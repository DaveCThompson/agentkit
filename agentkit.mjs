#!/usr/bin/env node
// agentkit — one canonical .agent/ source, generated vendor surfaces, drift detection, flowback.
// Verbs: init | sync | check | adopt | lock | surfaces | inventory | doctor          (decision 14)
// State model:
//   .agentkit.json  = pure intent (vendors, stack, tools, overlay, pins)          (decision 36)
//   .agentkit.lock  = shipped state (per-file out-hash + src-hash + kitVersion),  COMMITTED (decisions 25/36)
//   manifest.json   = COMPILED index of the kit, never hand-edited                (decision 28)
// All staleness reads the lock or git history — never mtime (cloud-synced churns it). (decisions 25/37)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  adapters, VENDORS, parseFrontmatter, normalizeEol, injectHeader, stripHeader,
} from './adapters.mjs';

export const KIT_ROOT = path.dirname(fileURLToPath(import.meta.url));

// ---------- fs / hash helpers ----------

export function sha(content) {
  return crypto.createHash('sha256').update(normalizeEol(content)).digest('hex');
}

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeText(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, normalizeEol(content), 'utf8');
}

function readJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(readText(p));
}

function writeJson(p, obj) {
  writeText(p, JSON.stringify(obj, null, 2) + '\n');
}

export function walk(dir, filter = () => true) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      out.push(...walk(p, filter));
    } else if (filter(p)) {
      out.push(p);
    }
  }
  return out;
}

function rel(root, p) {
  return path.relative(root, p).split(path.sep).join('/');
}

// glob → regex: supports **, *, ? ; matches whole rel path OR any single segment (so "domain-*"
// matches both "rules/domain-x.md" and the skill folder "skills/domain-x/SKILL.md").
export function globToRegex(glob) {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\x01').replace(/\*/g, '[^/]*').replace(/\x01/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${esc}$`);
}

export function matchesGlobs(globs, subPath) {
  const segs = subPath.split('/');
  const stems = segs.map((s) => s.replace(/\.[^.]+$/, ''));
  return (globs || []).some((g) => {
    const re = globToRegex(g);
    return re.test(subPath) || segs.some((s) => re.test(s)) || stems.some((s) => re.test(s));
  });
}

function git(cwd, args, opts = {}) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  } catch (e) {
    if (opts.soft) return null;
    throw e;
  }
}

// ---------- verification profiles + exact-tree receipts ----------

export const BROWSER_PROFILES = Object.freeze(['native-browser', 'deterministic-harness', 'human-only']);
const BROWSER_PROFILE_CAPABILITIES = Object.freeze({
  'native-browser': ['open', 'navigate', 'interact', 'screenshot'],
  'deterministic-harness': ['navigate', 'interact', 'screenshot', 'console', 'network'],
  'human-only': [],
});
const RECEIPT_SCHEMA_VERSION = 1;
const RECEIPT_DEFAULT_EXCLUDES = ['.agentkit/verification'];
const RECEIPT_LANES = new Set(['machine', 'runtime', 'human', 'docs', 'landing']);
const RECEIPT_STATUSES = new Set(['passed', 'failed', 'needs-human-verify', 'not-applicable']);

function browserConfig(cfg) {
  const value = cfg?.verification?.browser;
  return value === undefined ? null : value;
}

/** Resolve the project browser capability without inferring capabilities from vendor names. */
export function resolveBrowserProfile(cfg) {
  const value = browserConfig(cfg);
  const fallback = {
    profile: 'human-only', source: value === null ? 'default' : 'invalid', conservative: true,
    capabilities: [], runtime: 'needs-human-verify', human: 'required',
  };
  if (value === null) return fallback;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallback, error: 'verification.browser must be an object with a profile' };
  }
  const profile = String(value.profile || '');
  if (!BROWSER_PROFILES.includes(profile)) {
    return { ...fallback, error: `verification.browser.profile must be one of: ${BROWSER_PROFILES.join(', ')}` };
  }
  return {
    profile, source: 'project', conservative: false,
    capabilities: BROWSER_PROFILE_CAPABILITIES[profile],
    runtime: profile === 'human-only' ? 'needs-human-verify' : 'available',
    human: profile === 'human-only' ? 'required' : 'optional',
    ...(value.harness ? { harness: String(value.harness) } : {}),
    ...(value.target ? { target: String(value.target) } : {}),
    ...(value.flow ? { flow: String(value.flow) } : {}),
  };
}

export function validateBrowserProfile(cfg) {
  const value = browserConfig(cfg);
  if (value === null) return [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [{ level: 'error', msg: 'verification.browser must be an object with a profile' }];
  }
  const profile = String(value.profile || '');
  const errors = [];
  if (!BROWSER_PROFILES.includes(profile)) {
    errors.push({ level: 'error', msg: `unknown browser profile '${profile}' — use ${BROWSER_PROFILES.join(', ')}` });
    return errors;
  }
  for (const key of ['harness', 'target', 'flow']) {
    if (value[key] !== undefined && (typeof value[key] !== 'string' || !value[key].trim())) {
      errors.push({ level: 'error', msg: `verification.browser.${key} must be a non-empty string when provided` });
    }
  }
  if (profile === 'deterministic-harness' && !String(value.harness || '').trim()) {
    errors.push({ level: 'error', msg: 'deterministic-harness requires verification.browser.harness' });
  }
  if (profile !== 'human-only' && !String(value.target || '').trim()) {
    errors.push({ level: 'warn', msg: `${profile} should declare verification.browser.target so the runtime lane is reproducible` });
  }
  if (profile !== 'human-only' && !String(value.flow || '').trim()) {
    errors.push({ level: 'warn', msg: `${profile} should declare verification.browser.flow so the bounded smoke is reproducible` });
  }
  return errors;
}

function normalizeReceiptPath(value) {
  return String(value || '').replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function receiptExcluded(file, excludes) {
  const normalized = normalizeReceiptPath(file);
  return excludes.some((raw) => {
    const prefix = normalizeReceiptPath(raw);
    return normalized === prefix || normalized.startsWith(prefix + '/');
  });
}

function ownGitRoot(projectRoot) {
  const root = git(projectRoot, ['rev-parse', '--show-toplevel'], { soft: true })?.trim();
  return root && path.resolve(root) === path.resolve(projectRoot);
}

function worktreeFiles(projectRoot, excludes, useGit) {
  const listed = useGit ? git(projectRoot, ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { soft: true }) : null;
  const fallback = listed === null
    ? walk(projectRoot).map((p) => rel(projectRoot, p))
    : [];
  const paths = (listed === null ? fallback : listed.split('\0').filter(Boolean)).map(normalizeReceiptPath)
    .filter((p) => !receiptExcluded(p, excludes)).sort();
  return paths.map((file) => {
    const abs = path.join(projectRoot, ...file.split('/'));
    try {
      const stat = fs.lstatSync(abs);
      if (stat.isSymbolicLink()) return { path: file, kind: 'symlink', target: fs.readlinkSync(abs) };
      if (!stat.isFile()) return { path: file, kind: 'other', mode: stat.mode & 0o777 };
      return { path: file, kind: 'file', mode: stat.mode & 0o777, size: stat.size,
        sha256: crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex') };
    } catch {
      return { path: file, kind: 'missing' };
    }
  });
}

/** Return an exact, reusable identity for the current tracked + non-ignored working tree. */
export function verificationTreeIdentity(projectRoot, opts = {}) {
  const excludes = [...RECEIPT_DEFAULT_EXCLUDES, ...(opts.excludePaths || [])].map(normalizeReceiptPath);
  const useGit = ownGitRoot(projectRoot);
  const files = worktreeFiles(projectRoot, excludes, useGit);
  const payload = JSON.stringify({ schemaVersion: RECEIPT_SCHEMA_VERSION, files });
  const head = useGit ? git(projectRoot, ['rev-parse', 'HEAD'], { soft: true })?.trim() || null : null;
  const gitTree = useGit ? git(projectRoot, ['rev-parse', 'HEAD^{tree}'], { soft: true })?.trim() || null : null;
  const status = (useGit ? git(projectRoot, ['status', '--porcelain=v1', '--untracked-files=all'], { soft: true }) : '')
    .split('\n').filter(Boolean)
    .map((line) => line.slice(3).replace(/^"|"$/g, '').replaceAll('\\', '/'))
    .filter((file) => !receiptExcluded(file, excludes));
  const dirty = status.length > 0;
  return {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    kind: !dirty && gitTree ? 'commit' : 'worktree',
    commit: head,
    gitTree: !dirty ? gitTree : null,
    digest: sha(payload),
    dirty,
    excludedPaths: excludes,
  };
}

export function createVerificationReceipt(projectRoot, opts = {}) {
  const lane = String(opts.lane || 'machine');
  const status = String(opts.status || 'passed');
  const command = String(opts.command || '').trim();
  const exitCode = Number(opts.exitCode ?? 0);
  if (!RECEIPT_LANES.has(lane)) throw new Error(`unknown verification lane '${lane}' — use ${[...RECEIPT_LANES].join(', ')}`);
  if (!RECEIPT_STATUSES.has(status)) throw new Error(`unknown verification status '${status}' — use ${[...RECEIPT_STATUSES].join(', ')}`);
  if (!command) throw new Error('verification receipts require the exact command or human check');
  if (!Number.isInteger(exitCode)) throw new Error('verification receipt exit-code must be an integer');
  if (status === 'passed' && exitCode !== 0) throw new Error('a passed verification receipt requires exit-code 0');
  if (status === 'failed' && exitCode === 0) throw new Error('a failed verification receipt requires a non-zero exit-code');
  const outPath = opts.outPath ? path.resolve(projectRoot, opts.outPath) : null;
  const excludePaths = outPath && outPath.startsWith(path.resolve(projectRoot) + path.sep)
    ? [rel(projectRoot, outPath)] : [];
  return {
    type: 'agentkit-verification-receipt', schemaVersion: RECEIPT_SCHEMA_VERSION,
    project: path.resolve(projectRoot), recordedAt: new Date().toISOString(), lane, status,
    command, exitCode, tree: verificationTreeIdentity(projectRoot, { excludePaths }),
    ...(opts.notes ? { notes: String(opts.notes) } : {}),
  };
}

export function checkVerificationReceipt(projectRoot, receipt, opts = {}) {
  const file = opts.receiptPath ? path.resolve(opts.receiptPath) : null;
  const excludePaths = file && file.startsWith(path.resolve(projectRoot) + path.sep) ? [rel(projectRoot, file)] : [];
  const current = verificationTreeIdentity(projectRoot, { excludePaths });
  const expected = receipt?.tree;
  const shape = receipt?.type === 'agentkit-verification-receipt' && receipt?.schemaVersion === RECEIPT_SCHEMA_VERSION
    && typeof receipt?.lane === 'string' && typeof receipt?.command === 'string';
  // A clean commit's tree identity is stable across metadata-only commits (for example, a
  // supersede merge that preserves the exact tree). Dirty worktree evidence still requires the
  // original HEAD because the same file content can sit on a different base.
  const identityKeys = expected?.kind === 'commit' && current.kind === 'commit'
    ? ['kind', 'gitTree', 'digest', 'dirty']
    : ['kind', 'commit', 'gitTree', 'digest', 'dirty'];
  const match = shape && !!expected && identityKeys.every((key) => expected[key] === current[key]);
  const reusable = match && receipt?.status === 'passed' && receipt?.exitCode === 0;
  return { valid: match, reusable, expectedTree: expected || null, currentTree: current,
    reason: match ? (reusable ? 'exact tree match' : 'receipt is not passing machine evidence') : 'tree identity changed' };
}

// Sibling-branch warn: which branch is the KIT CLONE itself on. Explicit --git-dir/--work-tree
// (never -C) is load-bearing — a bare `-C kitRoot` lets git's normal upward repo-discovery escape a
// kitRoot that has no .git of its own and silently report the ENCLOSING checkout's branch instead
// (verified: a kit fixture nested in this repo's own working tree reads as this repo's real branch
// under `-C`). --git-dir/--work-tree pins git to exactly kitRoot — no discovery, no escape. Any
// failure (non-git kit, no git binary, detached HEAD, no .git of its own) or empty output → null;
// the null path must be airtight or every non-git-fixture test regresses.
export function kitBranchState(kitRoot) {
  try {
    const out = execFileSync('git', ['--git-dir', path.join(kitRoot, '.git'), '--work-tree', kitRoot, 'branch', '--show-current'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    return out || null;
  } catch {
    return null;
  }
}

// The one warn construction, shared by planSync and checkProject's quick path — two hand-rolled
// copies would drift. Self-sync/self-check is exempt (no sibling to drift from); null-safe.
export function kitBranchWarn(kitRoot, projectRoot, allowBranch) {
  if (allowBranch || path.resolve(projectRoot) === path.resolve(kitRoot)) return null;
  const branch = kitBranchState(kitRoot);
  if (!branch || branch === 'main' || branch === 'master') return null;
  return { level: 'warn', msg: `kit clone ${kitRoot} is on branch ${branch}, not main — sync pulls that branch's state; pass --allow-branch to acknowledge` };
}

// ---------- kit scan ----------

const TYPE_BY_DIR = { skills: 'skill', rules: 'rule', workflows: 'workflow', scripts: 'script', agents: 'agent' };

export function classifyAgentFile(subPath) {
  const segs = subPath.split('/');
  const type = TYPE_BY_DIR[segs[0]] || 'other';
  let name;
  if (type === 'skill') name = segs[1];
  else name = segs[segs.length - 1].replace(/\.[^.]+$/, '');
  return { type, name };
}

export function tierOf(fm, type, name) {
  if (fm?.tier) return String(fm.tier);
  if (/^(domain-|project-)/.test(name)) return 'overlay';
  return 'core';
}

function loadEntry(root, subPath, owner) {
  const abs = path.join(root, '.agent', ...subPath.split('/'));
  const raw = readText(abs);
  const { type, name } = classifyAgentFile(subPath);
  const { fm, body } = subPath.endsWith('.md') ? parseFrontmatter(raw) : { fm: null, body: raw };
  return {
    srcRel: `.agent/${subPath}`, subPath, type, name, owner,
    fm, body, raw: normalizeEol(raw), tier: tierOf(fm, type, name),
  };
}

// TICKET-akit-p2.1: a nested skill file (references/*.md etc. under .agent/skills/<name>/, anything
// that is NOT the skill's own SKILL.md) carries no `tier:` of its own by convention, so tierOf()
// above defaults it to 'core' and it ships UNCONDITIONALLY — bypassing the gate on its owning
// skill's SKILL.md entirely. Fix: such a file inherits the sibling SKILL.md's computed tier. An
// explicit `fm.tier` on the nested file still wins (tierOf already applied it). A skill folder with
// no SKILL.md sibling falls back to whatever tierOf already computed — unchanged behavior. Rules and
// workflows are single files (type !== 'skill') and are untouched.
function applyNestedSkillTierInheritance(entries) {
  const skillMdTierByName = new Map();
  for (const e of entries) {
    if (e.type === 'skill' && path.basename(e.subPath) === 'SKILL.md') skillMdTierByName.set(e.name, e.tier);
  }
  for (const e of entries) {
    if (e.type !== 'skill' || path.basename(e.subPath) === 'SKILL.md') continue;
    if (e.fm?.tier) continue; // explicit tier on the nested file wins
    if (skillMdTierByName.has(e.name)) e.tier = skillMdTierByName.get(e.name);
  }
}

export function scanKitAgent(kitRoot = KIT_ROOT) {
  const base = path.join(kitRoot, '.agent');
  const entries = walk(base)
    .map((p) => rel(base, p))
    .filter((s) => !s.startsWith('journals/') && !s.startsWith('scratch/'))
    .sort()
    .map((s) => loadEntry(kitRoot, s, 'core'));
  applyNestedSkillTierInheritance(entries);
  return entries;
}

export function kitVersion(kitRoot = KIT_ROOT) {
  return readJson(path.join(kitRoot, 'package.json'), {}).version || '0.0.0';
}

// hooks.json — canonical, vendor-neutral hook registrations. {KIT} resolves at sync time.
function loadHooks(kitRoot, projectRoot) {
  const p = path.join(kitRoot, '.agent', 'hooks.json');
  const hooks = readJson(p, []);
  const kitCli = path.join(kitRoot, 'agentkit.mjs');
  return hooks.map((h) => ({ ...h, command: h.command.replaceAll('{KIT}', kitCli).replaceAll('{PROJECT}', projectRoot) }));
}

// integrations/<tool>.md frontmatter may declare an `mcp:` server config + `check-command:`.
export function loadIntegration(kitRoot, tool) {
  const p = path.join(kitRoot, 'integrations', `${tool}.md`);
  if (!fs.existsSync(p)) return null;
  const { fm } = parseFrontmatter(readText(p));
  return { tool, fm: fm || {}, path: p };
}

function mcpServersFor(kitRoot, cfg) {
  const servers = {};
  for (const tool of cfg.tools || []) {
    const integ = loadIntegration(kitRoot, tool);
    if (integ?.fm?.mcp) servers[integ.fm['mcp-name'] || tool] = integ.fm.mcp;
  }
  return servers;
}

// ---------- selection + planning ----------

export function loadConfig(projectRoot) {
  const p = path.join(projectRoot, '.agentkit.json');
  if (!fs.existsSync(p)) return null;
  const cfg = readJson(p, {});
  cfg.vendors = cfg.vendors || [];
  cfg.stack = cfg.stack || [];
  cfg.kinds = cfg.kinds || ['app'];
  cfg.tools = cfg.tools || [];
  cfg.overlay = cfg.overlay || {};
  cfg.pins = cfg.pins || {};
  return cfg;
}

export function loadLock(projectRoot) {
  return readJson(path.join(projectRoot, '.agentkit.lock'), { kitVersion: null, files: {}, settings: {}, edits: {} });
}

function overlayGlobs(cfg) {
  const o = cfg.overlay || {};
  return [...(o.rules || []), ...(o.skills || []), ...(o.workflows || []), ...(o.paths || []), ...(o.claims || [])];
}

export function selectEntries(entries, cfg) {
  const globs = overlayGlobs(cfg);
  // Defensive fallback (mirrors loadConfig's default) so a directly-constructed cfg that omits
  // `kinds` — as every pre-kinds caller's config does — still resolves to the same selection.
  const kinds = cfg.kinds || ['app'];
  return entries.filter((e) => {
    if (e.tier === 'overlay') return false;               // kit never ships overlay-tier content
    // A project overlay glob claims a path as its own — UNLESS the kit explicitly pinned that asset
    // `tier: core` in frontmatter. Otherwise a default `project-*`/`domain-*` overlay silently drops a
    // core asset whose NAME collides with the reservation (e.g. the core skill `project-onboard` was
    // shadowed by the default `project-*` glob and never shipped — §5 overlay-shadows-core). Explicit
    // core wins over a glob; a genuine project override still uses a distinct name or `tier: overlay`.
    if (matchesGlobs(globs, e.subPath) && e.fm?.tier !== 'core') return false;
    if (e.tier === 'core') return true;
    if (e.tier.startsWith('tech:')) return cfg.stack.includes(e.tier.slice(5));
    // repo-kind axis (what a repo IS, orthogonal to `tech:` — what it's built WITH). Absent `kinds`
    // defaults to ['app'] so a config predating this axis selects byte-identically to today.
    if (e.tier.startsWith('kind:')) return kinds.includes(e.tier.slice(5));
    return true;
  });
}

// Overlay = files in the project's .agent that the kit does not ship (owner: project). Decision 34:
// adapters run over the MERGED tree so overlay skills reach vendor surfaces too.
export function scanProjectOverlay(projectRoot, shippedAgentRels, lock) {
  const base = path.join(projectRoot, '.agent');
  const shipped = new Set(shippedAgentRels);
  // A file the LOCK says the kit shipped (owner core) is never overlay — when it falls out of the
  // selection it must become an ORPHAN pending prune, not get re-adopted as project content.
  const lockShipped = new Set(
    Object.entries(lock?.files || {})
      .filter(([r, m]) => m.owner === 'core' && r.startsWith('.agent/'))
      .map(([r]) => r.slice('.agent/'.length)),
  );
  return walk(base)
    .map((p) => rel(base, p))
    .filter((s) => !s.startsWith('journals/') && !s.startsWith('scratch/') && !shipped.has(s) && !lockShipped.has(s) && s !== 'hooks.json')
    .sort()
    .map((s) => loadEntry(projectRoot, s, 'project'));
}

// The single planner: sync applies it, check compares against it, --dry-run prints it.
export function planSync(projectRoot, opts = {}) {
  const kitRoot = opts.kitRoot || KIT_ROOT;
  const cfg = opts.cfg || loadConfig(projectRoot);
  if (!cfg) throw new Error(`no .agentkit.json in ${projectRoot} — run 'agentkit init' first`);
  const kitEntries = opts.kitEntries || scanKitAgent(kitRoot);
  const selected = selectEntries(kitEntries, cfg);
  const selfSync = path.resolve(projectRoot) === path.resolve(kitRoot);

  const actions = []; // {rel, content, src, srcHash, owner, vendor}
  // 1) canonical .agent copies (skipped when the kit syncs itself — sources already live there)
  if (!selfSync) {
    for (const e of selected) {
      const ext = path.extname(e.subPath).toLowerCase();
      const content = e.subPath === 'hooks.json' ? e.raw : injectHeader(e.raw, e.srcRel, ext);
      actions.push({ rel: e.srcRel, content, src: e.srcRel, srcHash: sha(e.raw), owner: 'core', vendor: null });
    }
  }

  // 2) merged tree for vendor adapters = selected core + project overlay
  // On self-sync the kit's .agent IS the source tree — nothing in it is overlay.
  const shippedRels = selected.map((e) => e.subPath);
  const overlay = opts.overlay || (selfSync ? [] : scanProjectOverlay(projectRoot, shippedRels, loadLock(projectRoot)));
  const merged = [...selected, ...overlay];

  // "Surviving by absence" warn (portal finding 2): a project overlay file kept ONLY because the kit
  // doesn't currently ship its name — not matched by any overlay glob and not `tier: overlay`. It is
  // fragile: the day the kit adopts that name, the file becomes a lockfile `owner: core` orphan and
  // `sync --force` prunes/overwrites it. Flag it so the project makes an explicit claim (an
  // `overlay.rules`/`overlay.skills` entry, or `tier: overlay` frontmatter). Empty on self-sync.
  const claimGlobs = overlayGlobs(cfg);
  const survivingByAbsence = overlay
    .filter((o) => o.tier !== 'overlay' && !matchesGlobs(claimGlobs, o.subPath))
    .map((o) => o.srcRel);

  const ctx = {
    kitPath: kitRoot, projectRoot, config: cfg,
    mcpServers: mcpServersFor(kitRoot, cfg),
    hooks: loadHooks(kitRoot, projectRoot),
  };
  const settingsActions = [];
  const validations = [];
  validations.push(...validateBrowserProfile(cfg));
  // sibling-branch warn: syncing pulls whatever the kit clone currently has checked out.
  const branchWarn = kitBranchWarn(kitRoot, projectRoot, opts.allowBranch);
  if (branchWarn) validations.push(branchWarn);
  for (const vendor of cfg.vendors) {
    const adapter = adapters[vendor];
    if (!adapter) { validations.push({ level: 'error', msg: `unknown vendor '${vendor}' in .agentkit.json` }); continue; }
    const out = adapter(merged, ctx);
    for (const f of out.files) {
      const src = merged.find((e) => f.rel.endsWith(e.subPath) || f.content.includes(e.srcRel));
      actions.push({
        rel: f.rel, content: f.content, src: src ? src.srcRel : null,
        srcHash: src ? sha(src.raw) : null, owner: src?.owner === 'project' ? 'project-generated' : 'core', vendor,
      });
    }
    for (const s of out.settings) settingsActions.push({ ...s, vendor });
    validations.push(...out.validations.map((v) => ({ ...v, vendor })));
  }

  // K3: AGENTS.md workflow-map — vendor-neutral, generated from .agent/workflows/ so it can't drift.
  // Opt-in via markers (see mergeSettings 'md-block'); an AGENTS.md without them is left untouched.
  const workflowMap = renderWorkflowMap(merged);
  if (workflowMap) settingsActions.push({ file: 'AGENTS.md', merge: 'md-block', data: workflowMap, vendor: null });

  // overlay↔core name collision lint (decision 34) — two skills with one ROUTING name is ambiguity.
  // The routing name is what the model sees: SKILL.md frontmatter `name:` (fallback: folder name).
  const effName = (e) => (e.type === 'skill' ? String(e.fm?.name || e.name) : e.name);
  const routable = (e) => e.type !== 'skill' || e.subPath.endsWith('SKILL.md');
  const coreNames = new Map(selected.filter(routable).map((e) => [`${e.type}:${effName(e)}`, e.srcRel]));
  for (const o of overlay) {
    if (!routable(o)) continue;
    const key = `${o.type}:${effName(o)}`;
    if (coreNames.has(key)) {
      validations.push({ level: 'error', msg: `name collision: overlay ${o.srcRel} vs core ${coreNames.get(key)} (both route as '${key}')` });
    }
  }

  return {
    cfg, actions, settingsActions, validations, selected, overlay, survivingByAbsence, selfSync, kitRoot,
    browserProfile: resolveBrowserProfile(cfg),
  };
}

// ---------- manifest (compiled, never authored — decision 28) ----------

export function compileManifest(kitRoot = KIT_ROOT) {
  const entries = scanKitAgent(kitRoot);
  const ctx = { kitPath: kitRoot, projectRoot: '<project>', config: {}, mcpServers: {}, hooks: [] };
  const items = entries.map((e) => {
    const generatedTargets = {};
    for (const vendor of VENDORS) {
      const out = adapters[vendor]([e], ctx);
      if (out.files.length) generatedTargets[vendor] = out.files.map((f) => f.rel);
    }
    return {
      path: e.srcRel, type: e.type, name: e.name, tier: e.tier, sha256: sha(e.raw),
      triggers: e.fm?.triggers || null, appliesTo: e.fm?.['applies-to'] || null,
      requiredTools: e.fm?.['required-tools'] || null, conflictsWith: e.fm?.['conflicts-with'] || null,
      generatedTargets,
    };
  });
  const manifest = {
    kitVersion: kitVersion(kitRoot),
    compiledAt: new Date().toISOString().slice(0, 10),
    note: 'COMPILED by agentkit sync/inventory — never hand-edit (a hand edit here is itself drift; decision 28)',
    entries: items,
  };
  // write-if-changed (F-cli-sync-dirties-kit): every downstream sync calls this, and a rewrite
  // whose only delta is compiledAt dirties the kit clone's tree on any later day — foreign
  // modifications in every concurrent kit-side session. Skipping the no-op write makes compiledAt
  // mean "when the CONTENT last compiled", which is the honest reading.
  const outPath = path.join(kitRoot, 'manifest.json');
  const existing = readJson(outPath, null);
  if (existing && JSON.stringify({ ...existing, compiledAt: null }) === JSON.stringify({ ...manifest, compiledAt: null })) return existing;
  writeJson(outPath, manifest);
  return manifest;
}

// ---------- settings merges (key-level; never clobbers project-owned keys — decision 13) ----------

const TOML_BLOCK_START = "# >>> AGENTKIT MANAGED >>> (do not edit inside this block; run 'agentkit sync')";
const TOML_BLOCK_END = '# <<< AGENTKIT MANAGED <<<';

// K3: AGENTS.md workflow-map. A markdown managed block regenerated from .agent/workflows/ at sync so
// the command list can't drift by hand. OPT-IN: sync only rewrites between these markers if the
// project's AGENTS.md already contains them — an authored AGENTS.md without markers is never touched.
const MD_BLOCK_START = "<!-- >>> AGENTKIT WORKFLOWS >>> (generated — do not edit; run 'agentkit sync') -->";
const MD_BLOCK_END = '<!-- <<< AGENTKIT WORKFLOWS <<< -->';

// Render the workflow/command map from merged (selected + overlay) workflow entries. Deterministic
// (sorted by command) so sync is idempotent. Descriptions come from each workflow's frontmatter.
export function renderWorkflowMap(entries) {
  const wfs = entries.filter((e) => e.type === 'workflow').sort((a, b) => a.name.localeCompare(b.name));
  if (!wfs.length) return '';
  const rows = wfs.map((e) => {
    const desc = String(e.fm?.description || '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
    return `| \`/${e.name}\` | ${desc} |`;
  });
  return ['| Command | What it does |', '| --- | --- |', ...rows].join('\n');
}

export function mergeSettings(action, existingContent, lockKeys) {
  if (action.merge === 'claude-hooks') {
    const json = existingContent ? JSON.parse(existingContent) : {};
    json.hooks = json.hooks || {};
    const isOurs = (h) => (h.command || '').includes('agentkit');
    // lockKeys for .claude/settings.json is the union of hook-event names AND permission entries
    // (two merge kinds share this file). Permission entries are paren-shaped (`Bash(…)`, `Read(…)`);
    // event names never are — so filter them out here to avoid iterating perms as pseudo-events.
    const priorEvents = (lockKeys || []).filter((k) => !/[()]/.test(k));
    const events = new Set([...priorEvents, ...action.data.map((d) => d.event)]);
    for (const event of events) {
      let groups = json.hooks[event] || [];
      groups = groups.map((g) => ({ ...g, hooks: (g.hooks || []).filter((h) => !isOurs(h)) })).filter((g) => (g.hooks || []).length);
      const ours = action.data.filter((d) => d.event === event);
      if (ours.length) groups.push({ hooks: ours.map((d) => ({ type: 'command', command: d.command })) });
      if (groups.length) json.hooks[event] = groups; else delete json.hooks[event];
    }
    if (!Object.keys(json.hooks).length) delete json.hooks;
    return { content: JSON.stringify(json, null, 2) + '\n', managedKeys: action.data.map((d) => d.event) };
  }
  if (action.merge === 'claude-permissions') {
    // Non-destructive union into permissions.allow (decision 16, revised): add the kit baseline,
    // prune stale kit entries (previously ours, no longer in the baseline), and preserve every
    // user-added entry. Kit-managed entries are the exact (paren-shaped) baseline strings, which is
    // how they are told apart from the claude-hooks event names that share this file's lockKeys.
    const json = existingContent ? JSON.parse(existingContent) : {};
    const perms = json.permissions || {};
    const allow = Array.isArray(perms.allow) ? perms.allow : [];
    const baseline = action.data || [];
    const baselineSet = new Set(baseline);
    const priorKit = (lockKeys || []).filter((k) => /[()]/.test(k)); // our prior permission entries
    // keep everything except a stale kit entry (was ours, not in the new baseline) — user entries stay
    const kept = allow.filter((e) => !(priorKit.includes(e) && !baselineSet.has(e)));
    const keptSet = new Set(kept);
    const merged = [...kept, ...baseline.filter((e) => !keptSet.has(e))];
    if (merged.length) perms.allow = merged; else delete perms.allow;
    if (Object.keys(perms).length) json.permissions = perms; else delete json.permissions;
    return { content: JSON.stringify(json, null, 2) + '\n', managedKeys: baseline };
  }
  if (action.merge === 'mcp-json') {
    const json = existingContent ? JSON.parse(existingContent) : {};
    json.mcpServers = json.mcpServers || {};
    for (const k of lockKeys || []) delete json.mcpServers[k];
    for (const [k, v] of Object.entries(action.data)) json.mcpServers[k] = v;
    return { content: JSON.stringify(json, null, 2) + '\n', managedKeys: Object.keys(action.data) };
  }
  if (action.merge === 'opencode-mcp') {
    const json = existingContent ? JSON.parse(existingContent) : {};
    const servers = json.mcp && typeof json.mcp === 'object' && !Array.isArray(json.mcp) ? json.mcp : {};
    for (const k of lockKeys || []) delete servers[k];
    for (const [k, v] of Object.entries(action.data)) servers[k] = v;
    if (Object.keys(servers).length) json.mcp = servers; else delete json.mcp;
    return { content: JSON.stringify(json, null, 2) + '\n', managedKeys: Object.keys(action.data) };
  }
  if (action.merge === 'toml-block') {
    let text = existingContent ? normalizeEol(existingContent) : '';
    const start = text.indexOf(TOML_BLOCK_START);
    if (start !== -1) {
      const end = text.indexOf(TOML_BLOCK_END);
      text = (text.slice(0, start) + text.slice(end === -1 ? text.length : end + TOML_BLOCK_END.length)).replace(/\n{3,}/g, '\n\n');
    }
    const block = action.data ? `${TOML_BLOCK_START}\n${action.data}\n${TOML_BLOCK_END}\n` : '';
    const content = (text.trimEnd() + (text.trim() && block ? '\n\n' : '\n') + block).replace(/^\n+/, '');
    return { content: content.trimEnd() + '\n', managedKeys: ['block'] };
  }
  if (action.merge === 'md-block') {
    // opt-in: never inject into an authored file that hasn't placed the markers.
    if (existingContent === null) return { content: null, managedKeys: [] };
    const text = normalizeEol(existingContent);
    const start = text.indexOf(MD_BLOCK_START);
    if (start === -1) return { content: null, managedKeys: [] }; // no markers → leave file untouched
    const endIdx = text.indexOf(MD_BLOCK_END);
    const end = endIdx === -1 ? text.length : endIdx + MD_BLOCK_END.length;
    const block = action.data ? `${MD_BLOCK_START}\n${action.data}\n${MD_BLOCK_END}` : '';
    const content = (text.slice(0, start) + block + text.slice(end)).replace(/\n{3,}/g, '\n\n');
    return { content: content.replace(/\s*$/, '') + '\n', managedKeys: action.data ? ['workflow-map'] : [] };
  }
  if (action.merge === 'create-if-absent') {
    if (existingContent !== null) return { content: null, managedKeys: [] };
    return { content: action.data, managedKeys: [] };
  }
  throw new Error(`unknown settings merge kind: ${action.merge}`);
}

// ---------- check (the 4-state matrix — decision 25) ----------

export function checkProject(projectRoot, opts = {}) {
  const lock = loadLock(projectRoot);
  const results = [];
  const plan = opts.quick ? null : planSync(projectRoot, opts);
  const expected = new Map();
  if (plan) for (const a of plan.actions) expected.set(a.rel, a);

  const rels = new Set([...Object.keys(lock.files), ...expected.keys()]);
  for (const r of [...rels].sort()) {
    const abs = path.join(projectRoot, ...r.split('/'));
    const diskHash = fs.existsSync(abs) ? sha(readText(abs)) : null;
    const locked = lock.files[r];
    const exp = expected.get(r);

    if (opts.quick) {
      if (!locked) continue;
      if (diskHash === null) results.push({ rel: r, verdict: 'MISSING' });
      else if (diskHash !== locked.out) results.push({ rel: r, verdict: 'LOCALLY-EDITED' });
      continue;
    }
    const expHash = exp ? sha(exp.content) : null;
    let verdict;
    if (locked && exp) {
      if (diskHash === null) verdict = 'MISSING';
      else if (diskHash === expHash) verdict = 'IN-SYNC';
      else if (diskHash === locked.out && expHash !== locked.out) verdict = 'STALE';
      else if (diskHash !== locked.out && expHash === locked.out) verdict = 'LOCALLY-EDITED';
      else verdict = 'CONFLICT';
    } else if (exp && !locked) {
      if (diskHash === null) verdict = 'NEW';
      else if (diskHash === expHash) verdict = 'NEW-MATCHES';
      else verdict = 'UNTRACKED-DIFFERS';
    } else {
      verdict = diskHash === null ? 'PRUNED' : 'ORPHAN';
    }
    if (verdict !== 'IN-SYNC' || opts.all) results.push({ rel: r, verdict, vendor: locked?.vendor ?? exp?.vendor ?? null });
  }

  // record first-detected edit dates in the lock (the >7-day flowback nag reads this, never mtime)
  const now = new Date().toISOString().slice(0, 10);
  let lockDirty = false;
  const editedNow = new Set(results.filter((x) => x.verdict === 'LOCALLY-EDITED' || x.verdict === 'CONFLICT').map((x) => x.rel));
  for (const r of editedNow) if (!lock.edits[r]) { lock.edits[r] = now; lockDirty = true; }
  for (const r of Object.keys(lock.edits)) if (!editedNow.has(r)) { delete lock.edits[r]; lockDirty = true; }
  if (lockDirty && !opts.noWrite && fs.existsSync(path.join(projectRoot, '.agentkit.lock'))) {
    writeJson(path.join(projectRoot, '.agentkit.lock'), lock);
  }

  const nags = [];
  for (const [r, d] of Object.entries(lock.edits)) {
    const age = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (age >= 7) nags.push(`${r} locally edited ${age}d ago — run flowback (agentkit adopt or the kit-contribute skill)`);
  }
  const validations = plan ? plan.validations : [];
  // quick mode skips planSync entirely, but the SessionStart hook runs `check --quick` — the
  // sibling-branch warn must still reach that always-on surface (F-cli-sibling-branch).
  if (opts.quick) {
    const branchWarn = kitBranchWarn(opts.kitRoot || KIT_ROOT, projectRoot, opts.allowBranch);
    if (branchWarn) validations.push(branchWarn);
  }
  const kitVer = kitVersion(opts.kitRoot || KIT_ROOT);
  const kitMovedAhead = lock.kitVersion !== null && lock.kitVersion !== kitVer;
  // Wave U3 (gitDirty): the hash-based `results` above compares EOL-normalized content (sha()
  // normalizes line endings), so a managed file whose only difference from the expected/locked
  // content is a real, non-EOL, uncommitted edit can still hash IN-SYNC and be silently excluded
  // from `results` — a false-clean `check` caught only by a solo `git status`. Run the porcelain
  // scan on every managed path UNCONDITIONALLY (not gated on kitMovedAhead) and surface it as an
  // informational `gitDirty` list of file paths. WARNING-ONLY (Decision D): `clean` below is left
  // driven entirely by the existing hash/validation logic — a repo legitimately carrying WIP on a
  // managed path is not "unclean" per this tool. Fail-safe: dirtyManagedPaths() already returns
  // [] with no error when git is absent, the project isn't a repo, or there are no managed rels.
  const gitDirtyLines = dirtyManagedPaths(projectRoot, Object.keys(lock.files));
  const gitDirty = [...new Set(gitDirtyLines.map(porcelainPath))].sort();
  // TICKET-18: a sync while the tree carries uncommitted work on managed paths is a guaranteed
  // collision with whatever session made that work — the sync nudge must warn, not just invite.
  // Reuses the scan above instead of a second git shell-out; only surfaced when the kit moved ahead.
  const dirtyManaged = kitMovedAhead ? gitDirtyLines : [];
  return {
    project: projectRoot, kitVersion: kitVer, lockKitVersion: lock.kitVersion,
    kitMovedAhead, dirtyManaged, gitDirty,
    browserProfile: plan?.browserProfile || resolveBrowserProfile(loadConfig(projectRoot)),
    results, validations, nags,
    survivingByAbsence: plan?.survivingByAbsence || [],
    clean: results.length === 0 && !validations.some((v) => v.level === 'error'),
  };
}

// ---------- content-integrity (K1/K6/K13, core-B): cited paths/scripts/asset-names must resolve ----------
// CONSERVATIVE by design (a guard that cries wolf is worse than none — the reviews' own K10 warning):
// only flags tokens that are unambiguously repo-path/script/asset citations AND do not resolve.

const KIT_RELATIVE_ROOTS = ['integrations/', 'governance/', 'templates/', 'reports/'];
// The sanctioned four-directory docs model (pattern-docs-artifacts / governance/docs-standard). A
// DIRECTORY or glob citation of these is generic convention that resolves in any conforming project
// (and is absent only in the kit itself, which uses governance/ as its KB) — pass it. A SPECIFIC file
// under them (docs/knowledge-base/SPEC-x.md, docs/working/branch-state.md) is a concrete project fact
// and is still resolved normally, so baked-in doc names stay flagged.
const DOC_CONVENTION_ROOTS = ['docs/working', 'docs/backlog', 'docs/archive', 'docs/knowledge-base'];
const UNIVERSAL_SCRIPTS = new Set(['lint', 'build', 'test', 'typecheck', 'dev', 'start', 'validate', 'preview', 'format', 'check',
  // gate:* convention (foundation-testing.md §1) — generically cited by rules/skills, scaffolded per-project by `agentkit init`.
  'gate', 'gate:lint', 'gate:types', 'gate:test', 'gate:build']);
const PATH_ROOTS_DEFAULT = ['src', 'app', 'components', 'lib', 'packages', 'apps', 'docs', '.agent', 'scripts', 'public', 'tests', 'test', 'styles', 'config'];
const CODE_EXT = /\.(md|mdx|ts|tsx|js|jsx|mjs|cjs|json|jsonc|css|scss|sql|ps1|sh|yaml|yml|toml)$/i;

// Docs scanned as CITING surfaces (TICKET-29). Deliberately narrow, and the narrowing is the design:
//  - knowledge-base/ IS durable truth — a citation there must resolve, and this is where the source
//    review found its largest drift class (~12 dead refs to archived files inside green-passing specs).
//  - working/ + backlog/ BODIES are excluded. A ticket describes work not yet done, so its paths are
//    hypotheses by construction — the `**Files**` line names files that do not exist yet, and a plan
//    names its own proposed deliverables. Scanning them produced 60+ findings on this repo, none of
//    them drift. (The upstream implementation this ports from excludes docs/backlog/ for the same
//    reason.) Their INDEX READMEs are scanned, because an index must point at things that exist.
//  - archive/ + raw-research/ are history and evidence: naming dead things is their job.
const DOCS_SCAN_DIRS = ['knowledge-base'];
const DOCS_SCAN_INDEXES = ['docs/working/README.md', 'docs/backlog/README.md', 'docs/README.md'];
// Cross-repo citation notation (TICKET-25 / D6). A path or asset reference whose FIRST SEGMENT names
// another repo can only resolve there — flagging it is a false positive whose only workaround is
// degrading correct prose. Declared per-project as `externalRoots: ["a predecessor kit", …]`; the notation
// is the leading path segment, so prose stays readable and nothing needs a marker comment.
const IGNORE_LINE_RE = /<!--\s*taxonomy-ignore-line\s*-->/;
// A `:line` or `:line-line` suffix on a citation. Volatile by construction (governance/docs-standard
// §(i)) — normalized off before resolving, and flagged warn-tier in durable docs.
const LINE_CITE_RE = /:(\d+)(?:-\d+)?$/;

function sourceRootsFor(cfg) {
  return (cfg && cfg.sourceRoots) || PATH_ROOTS_DEFAULT;
}

function externalRootsFor(cfg) {
  return new Set((cfg && cfg.externalRoots) || []);
}

// Is this token a citation into ANOTHER repo? Two accepted forms, so a cross-repo pointer never has to
// be degraded into vaguer prose to appease the checker (D6):
//   1. `<repo>:path/to/file` — the EXPLICIT notation. Self-describing, needs no config, works anywhere.
//   2. a bare first segment listed in `.agentkit.json` → `externalRoots` — for prose that already
//      names sibling repos by path (`a predecessor kit/…`) and reads worse with a prefix.
function isExternalCitation(tok, externals) {
  const t = tok.trim().replace(/^\.\//, '');
  const colon = t.indexOf(':');
  const slash = t.indexOf('/');
  if (colon > 0 && (slash === -1 || colon < slash) && /^[a-z][a-z0-9-]*$/.test(t.slice(0, colon))) return true;
  return externals.size ? externals.has(t.split('/')[0]) : false;
}

// Decide if a backtick token is a repo-path CITATION we should resolve (vs prose, a symbol, a glob, a placeholder).
function looksLikeRepoPath(tok, roots) {
  const t = tok.trim();
  if (!t || t.length > 200) return false;
  if (/\s/.test(t)) return false;                         // has whitespace → not a path token
  if (t.includes('<') || t.includes('>') || t.includes('{') || t.includes('}')) return false; // placeholder (apps/<app>, {slug})
  if (t.includes('[') || t.includes(']')) return false;   // bracket placeholder ([skill-name], LOG-[session-name].md)
  if (/^\.(agents|claude|gemini|opencode|codex)(\/|$)/.test(t)) return false; // generated vendor surface (may be absent per configured vendors) — never drift
  if (/^path\/to\//.test(t)) return false;                // illustrative example path (path/to/file.tsx)
  if (t.split('/').some((s) => /^(YYYY|MM|DD|YYYY-MM|YYYY-MM-DD|\d{4}-MM)$/.test(s))) return false; // date-placeholder segment (docs/archive/2026-MM/)
  if (/:\/\//.test(t) || t.startsWith('http') || t.startsWith('www.') || t.startsWith('@')) return false; // URL / npm scope
  if (t.startsWith('--') || t.startsWith('var(') || t.startsWith('#') || t.startsWith('.') && !t.startsWith('.agent')) return false; // css var/flag/class
  const hasSlash = t.includes('/');
  const firstSeg = t.split('/')[0].replace(/^\.\//, '');
  const rootMatch = roots.includes(firstSeg) || KIT_RELATIVE_ROOTS.some((r) => t.startsWith(r)) || t.startsWith('.agent');
  // path if: (starts with a known root and has a slash) OR (has a code extension and a slash)
  return (hasSlash && rootMatch) || (hasSlash && CODE_EXT.test(t));
}

function resolveCitation(projectRoot, kitRoot, tok, citingDir) {
  let t = tok.trim().replace(/^\.\//, '').replace(/[),.;:]+$/, '');
  // kit-relative citations resolve against the kit repo. Globs resolve their literal prefix — the
  // wildcard branch below is unreachable from here, so `integrations/*.md` must be handled inline
  // (it was reported as a phantom before this: a real directory cited with a valid glob).
  if (KIT_RELATIVE_ROOTS.some((r) => t.startsWith(r))) {
    const w = t.search(/[*?]/);
    const target = w === -1 ? t : t.slice(0, w).replace(/\/[^/]*$/, '');
    if (!target) return true;
    return fs.existsSync(path.join(kitRoot, ...target.split('/')));
  }
  // resolve against the project root AND (for skill-relative citations like `references/x.md`)
  // the citing file's own directory — a skill that ships its own reference files cites them relatively.
  // ...and the citing file's PARENT dir: an index row in docs/backlog/README.md cites its sibling
  // store as `working/TICKET-x.md`, which is a real, resolvable form (docs/ + working/TICKET-x.md).
  const bases = citingDir ? [projectRoot, citingDir, path.dirname(citingDir)] : [projectRoot];
  const anyExists = (relPath) => bases.some((b) => fs.existsSync(path.join(b, ...relPath.split('/'))));
  // sanctioned docs-model directory/glob → convention, passes even where absent (see DOC_CONVENTION_ROOTS)
  const inDocConvention = DOC_CONVENTION_ROOTS.some((r) => t === r || t.startsWith(r + '/'));
  // dir/glob/non-code under a convention root → convention. Also the `README.md` INDEX of a convention
  // root (every conforming project keeps one; the kit uses governance/ so its own is absent) — but a
  // SPECIFIC content doc (SPEC-x.md) still resolves normally below, so baked-in doc names stay flagged.
  if (inDocConvention && (/[*?]/.test(t) || !CODE_EXT.test(t) || /\/README\.md$/.test(t))) return true;
  // globs: resolve the literal prefix before the first wildcard
  const wild = t.search(/[*?]/);
  if (wild !== -1) {
    const base = t.slice(0, wild).replace(/\/[^/]*$/, '');
    if (!base) return true; // bare glob like *.ts — unresolvable target, don't flag
    return anyExists(base);
  }
  if (anyExists(t)) return true;
  // a directory citation without trailing slash, or a path whose parent dir exists (file may be an example) → lenient pass
  const parent = t.replace(/\/[^/]*$/, '');
  if (parent && parent !== t && !CODE_EXT.test(t) && anyExists(parent)) return true;
  return false;
}

export function checkContentIntegrity(projectRoot, opts = {}) {
  const kitRoot = opts.kitRoot || KIT_ROOT;
  const cfg = loadConfig(projectRoot) || {};
  const roots = sourceRootsFor(cfg);
  const externals = externalRootsFor(cfg);
  const base = path.join(projectRoot, '.agent');
  const scan = [];
  // _templates holds illustrative scaffolding (placeholder paths by design) — not a live asset to integrity-check.
  for (const sub of ['rules', 'skills', 'workflows']) scan.push(...walk(path.join(base, sub), (f) => f.endsWith('.md') && !f.split(path.sep).includes('_templates')));
  for (const root of ['AGENTS.md', 'README.md']) { const p = path.join(projectRoot, root); if (fs.existsSync(p)) scan.push(p); }
  // TICKET-29: docs are a citing surface too. Live stores only — archive/ and raw-research/ are
  // history and evidence, deliberately allowed to name things that no longer exist.
  for (const sub of DOCS_SCAN_DIRS) scan.push(...walk(path.join(projectRoot, 'docs', sub), (f) => f.endsWith('.md')));
  for (const idx of DOCS_SCAN_INDEXES) { const p = path.join(projectRoot, ...idx.split('/')); if (fs.existsSync(p)) scan.push(p); }
  // CI job names (TICKET-29 / C1c): a doc naming a job that does not exist reads exactly like one that
  // does. Absent .github/workflows ⇒ the check is a no-op, never a false positive.
  const ciJobs = new Set();
  const wfDir = path.join(projectRoot, '.github', 'workflows');
  for (const wf of walk(wfDir, (f) => /\.ya?ml$/i.test(f))) {
    const wtext = normalizeEol(readText(wf));
    const jobsAt = wtext.search(/^jobs:\s*$/m);
    if (jobsAt === -1) continue;
    for (const jm of wtext.slice(jobsAt).matchAll(/^ {2}([A-Za-z0-9_-]+):/gm)) ciJobs.add(jm[1]);
  }

  // known asset names for name-reference resolution
  const ruleNames = new Set(walk(path.join(base, 'rules'), (f) => f.endsWith('.md')).map((p) => path.basename(p, '.md')));
  const wfNames = new Set(walk(path.join(base, 'workflows'), (f) => f.endsWith('.md')).map((p) => path.basename(p, '.md')));
  const skillNames = new Set(fs.existsSync(path.join(base, 'skills')) ? fs.readdirSync(path.join(base, 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : []);
  const pkg = readJson(path.join(projectRoot, 'package.json'), {});
  const scripts = new Set(Object.keys(pkg.scripts || {}));

  // TICKET-17: design-token citations. A rule citing `--token-name` (also `var(--x)` and the
  // `--prefix-*` glob form) must reference a custom property the consuming repo actually defines.
  // CONSERVATIVE gates, same philosophy as above: (a) a repo defining zero custom properties is
  // never flagged; (b) only whole-backtick citations count — a flag inside a longer command is
  // prose; (c) lowercase-only, so `--noEmit`-style CLI flags never match; (d) the citation's
  // leading namespace (--z-…, --text-…) must match a defined token's namespace, so CLI flags cited
  // in rules (`--ours`, `--dry-run`) stay silent. Severity 'warn' — advisory, never fails CI.
  const TOKEN_CITATION = /^(?:var\()?(--[a-z][a-z0-9-]*)(\*)?\)?$/;
  let tokenDefs = null; // { names, namespaces } — union over css/scss under sourceRoots, computed once, lazily
  const definedTokens = () => {
    if (tokenDefs) return tokenDefs;
    tokenDefs = { names: new Set(), namespaces: new Set() };
    for (const root of roots) {
      for (const cssFile of walk(path.join(projectRoot, root), (p) => /\.(css|scss)$/i.test(p))) {
        for (const d of readText(cssFile).matchAll(/(?:^|[^\w-])(--[a-zA-Z][a-zA-Z0-9-]*)\s*:/g)) {
          tokenDefs.names.add(d[1]);
          tokenDefs.namespaces.add(d[1].slice(2).split('-')[0]);
        }
      }
    }
    return tokenDefs;
  };

  const findings = [];
  for (const f of scan) {
    const text = normalizeEol(readText(f));
    const relFile = rel(projectRoot, f);
    const isRule = relFile.startsWith('.agent/rules/'); // token harvesting rides the same rule-selection path
    const isDurableDoc = relFile.startsWith('docs/');
    // An INDEX must point at things that exist — that is its entire job, and a dead index row is the
    // routing hole C5 describes. Held hard. A docs BODY file lands at 'warn': KBs legitimately carry
    // imported and ported documents whose citations belong to another repo, and a guard that arrives
    // red on day one gets disabled (K10 cry-wolf). Ratchet it per repo once its KB is conforming.
    const isIndex = /(^|\/)README\.md$/.test(relFile);
    const docSev = isDurableDoc && !isIndex ? { severity: 'warn' } : {};
    // Shared suppression vocabulary with taxonomyLint's D2 (TICKET-25): a line carrying the marker is
    // deliberate prose — historical, negated, or illustrative — and is skipped by BOTH citation checkers.
    const lines = text.split('\n');
    const lineAt = (idx) => text.slice(0, idx).split('\n').length;
    const suppressed = (idx) => IGNORE_LINE_RE.test(lines[lineAt(idx) - 1] || '');
    // 1. backtick-quoted repo-path citations
    for (const m of text.matchAll(/`([^`\n]+)`/g)) {
      const tok = m[1];
      if (suppressed(m.index)) continue;
      // 1b. design-token citations (TICKET-17) — active rule files only
      if (isRule) {
        const tm = TOKEN_CITATION.exec(tok.trim());
        if (tm) {
          const defs = definedTokens();
          const name = tm[1]; const glob = !!tm[2];
          const resolved = glob ? [...defs.names].some((n) => n.startsWith(name)) : defs.names.has(name);
          if (defs.names.size && !resolved && defs.namespaces.has(name.slice(2).split('-')[0])) {
            const line = text.slice(0, m.index).split('\n').length;
            findings.push({ file: relFile, line, kind: 'token', token: name + (glob ? '*' : ''), severity: 'warn' });
          }
          continue; // a custom-property citation is never a repo path
        }
      }
      if (isExternalCitation(tok, externals)) continue;   // cross-repo (D6) — resolvable only in that repo
      // `file.ts:164` — strip the volatile line suffix before resolving, and flag it warn-tier in
      // durable docs (governance/docs-standard §(i): cite symbols and sections, never line numbers).
      const lineCite = LINE_CITE_RE.exec(tok.trim());
      const bare = lineCite ? tok.trim().replace(LINE_CITE_RE, '') : tok;
      if (lineCite && isDurableDoc && looksLikeRepoPath(bare, roots)) {
        findings.push({ file: relFile, line: lineAt(m.index), kind: 'line-citation', token: tok.trim(), severity: 'warn' });
      }
      if (!looksLikeRepoPath(bare, roots)) continue;
      if (!resolveCitation(projectRoot, kitRoot, bare, path.dirname(f))) findings.push({ file: relFile, kind: 'path', token: bare.trim(), ...docSev });
    }
    // 1c. markdown links (TICKET-25) — `[text](target.md)`. A link target is UNAMBIGUOUSLY a path, so
    // it gets direct resolution rather than looksLikeRepoPath's prose heuristics: those reject any
    // token starting with '.' as a CSS class, which is exactly the shape of a relative link
    // (`../working/x.md`). Resolution order: the citing file's own directory, then the repo root,
    // then the kit for kit-relative roots. Scoped to concrete file targets so prose links stay quiet.
    for (const m of text.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
      if (suppressed(m.index)) continue;
      const raw = m[1].trim().replace(/^<|>$/g, '').split('#')[0];
      if (!raw || /^(?:https?:|mailto:|tel:|app:|file:|data:)/.test(raw)) continue;
      if (/[<>{}[\]*?]/.test(raw)) continue;                 // placeholder or glob target
      const tgt = raw.replace(LINE_CITE_RE, '');
      if (isExternalCitation(tgt, externals)) continue;
      if (!CODE_EXT.test(tgt)) continue;                     // concrete file links only
      if (/(^|\/)\.(agents|claude|gemini|opencode|codex)(\/|$)/.test(tgt)) continue; // generated vendor surface
      const cands = [path.resolve(path.dirname(f), tgt)];
      if (!tgt.startsWith('.')) {                            // repo-root and kit-relative forms
        const segs = tgt.replace(/^\//, '').split('/');
        cands.push(path.join(projectRoot, ...segs));
        if (KIT_RELATIVE_ROOTS.some((r) => tgt.startsWith(r))) cands.push(path.join(kitRoot, ...segs));
      }
      if (!cands.some((c) => fs.existsSync(c))) findings.push({ file: relFile, kind: 'link', token: raw, ...docSev });
    }
    // 2. npm scripts — skip universal ones (rules generically cite these; assumed present)
    for (const m of text.matchAll(/npm run ([a-z0-9:_-]+)/gi)) {
      const s = m[1];
      if (UNIVERSAL_SCRIPTS.has(s) || suppressed(m.index)) continue;
      if (scripts.size && !scripts.has(s)) findings.push({ file: relFile, kind: 'npm-script', token: s });
    }
    // 2b. CI job names (TICKET-29) — only when the repo actually has workflows to check against.
    // The quote/backtick is MANDATORY and must close (\1): the quote is what marks "job <token>" as
    // a CI claim rather than prose. Optional quoting flagged every prose "job <word>" in any repo
    // whose domain vocabulary contains "job" (F-ci-job-prose-fp: 156 hard FPs on proj-resume alone),
    // and the old /i flag defeated [a-z], so Title-Case prose matched too. Lowercase-kebab is now
    // genuinely enforced; the accepted recall cost is an unquoted or sentence-case citation.
    if (ciJobs.size) {
      for (const m of text.matchAll(/(?:^|[^\w-])(?:CI )?job ([`'"])([a-z][a-z0-9_-]{2,})\1/g)) {
        if (suppressed(m.index)) continue;
        if (!ciJobs.has(m[2])) findings.push({ file: relFile, kind: 'ci-job', token: m[2] });
      }
    }
    // 3. explicit .agent asset references. The lookbehind keeps `<other-repo>/.agent/skills/x/` out —
    // a cross-repo pointer is not a claim about THIS repo's assets (D6).
    for (const m of text.matchAll(/(?<![\w.\/-])\.agent\/rules\/([a-z0-9-]+)\.md/gi)) if (!ruleNames.has(m[1]) && !suppressed(m.index)) findings.push({ file: relFile, kind: 'rule-ref', token: m[1] });
    for (const m of text.matchAll(/(?<![\w.\/-])\.agent\/workflows\/([a-z0-9-]+)\.md/gi)) if (!wfNames.has(m[1]) && !suppressed(m.index)) findings.push({ file: relFile, kind: 'workflow-ref', token: m[1] });
    for (const m of text.matchAll(/(?<![\w.\/-])\.agent\/skills\/([a-z0-9-]+)\//gi)) if (!skillNames.has(m[1]) && !suppressed(m.index)) findings.push({ file: relFile, kind: 'skill-ref', token: m[1], ...docSev });
  }
  // de-dup identical (file, token)
  const seen = new Set();
  const unique = findings.filter((x) => { const k = `${x.file}|${x.kind}|${x.token}`; if (seen.has(k)) return false; seen.add(k); return true; });
  return { project: projectRoot, findings: unique, clean: unique.length === 0 };
}

// check --kb <paths…> — the mechanical read-side KB router (decision 31)
export function kbMatch(projectRoot, paths) {
  const kbDir = path.join(projectRoot, 'docs', 'knowledge-base');
  const matches = [];
  for (const p of walk(kbDir, (f) => f.endsWith('.md'))) {
    const { fm } = parseFrontmatter(readText(p));
    const globs = fm?.['applies-to'];
    if (!globs) continue;
    const list = Array.isArray(globs) ? globs : [globs];
    for (const target of paths) {
      const t = target.split(path.sep).join('/');
      if (matchesGlobs(list, t)) { matches.push({ doc: rel(projectRoot, p), matched: t, lastVerified: fm['last-verified'] || null }); break; }
    }
  }
  return matches;
}

// ---------- sync ----------

function threeWayBase(kitRoot, lockVer, srcRel) {
  if (!lockVer) return null;
  return git(kitRoot, ['show', `v${lockVer}:${srcRel}`], { soft: true });
}

// Junction/symlink guard (pilot finding 2026-07-03): if a vendor dir is a reparse point into
// .agent/, writing the vendor copy CLOBBERS THE CANONICAL SOURCE through the link. Any reparse
// point among a write-target's ancestors is a hard refusal — never overridable by --force.
export function findReparseAncestors(projectRoot, rels) {
  const cache = new Map();
  const isLink = (abs) => {
    if (cache.has(abs)) return cache.get(abs);
    let v = false;
    try { v = fs.lstatSync(abs).isSymbolicLink(); } catch { v = false; }
    cache.set(abs, v);
    return v;
  };
  const offenders = new Map();
  for (const r of rels) {
    const segs = r.split('/');
    for (let i = 1; i < segs.length; i++) {
      const dirRel = segs.slice(0, i).join('/');
      const abs = path.join(projectRoot, ...dirRel.split('/'));
      if (isLink(abs)) {
        let target = null;
        try { target = fs.readlinkSync(abs); } catch { /* leave null */ }
        offenders.set(dirRel, target);
        break;
      }
    }
  }
  return [...offenders].map(([dir, target]) => ({ dir, target }));
}

function isOverlayClean(a, abs, projectRoot) {
  if (!a.src || !a.src.startsWith('.agent/')) return false;
  if (!fs.existsSync(abs)) return true;
  const diskText = readText(abs);
  const expText = a.content;
  const cleanDisk = stripHeader(diskText).trim();
  const cleanExp = stripHeader(expText).trim();
  if (cleanDisk === cleanExp) return true;
  const srcAbs = path.join(projectRoot, ...a.src.split('/'));
  if (fs.existsSync(srcAbs)) {
    const srcText = readText(srcAbs);
    if (cleanDisk === stripHeader(srcText).trim()) return true;
  }
  return false;
}

// Shared porcelain scan (decision 36 / TICKET-18): uncommitted (non-untracked) git state on the
// given managed rels. Used by both the sync git-clean guard and check's kit-moved-ahead nudge.
function dirtyManagedPaths(projectRoot, rels) {
  if (!rels.length || !fs.existsSync(path.join(projectRoot, '.git'))) return [];
  return (git(projectRoot, ['status', '--porcelain', '--', ...rels.slice(0, 200)], { soft: true }) || '')
    .split('\n').filter((l) => l.trim() && !l.startsWith('??'));
}

// Path out of a porcelain-v1 line: `XY <path>` (rename: `XY <old> -> <new>`; special chars quoted).
function porcelainPath(line) {
  let p = line.slice(3);
  const arrow = p.indexOf(' -> ');
  if (arrow !== -1) p = p.slice(arrow + 4);
  if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1).replace(/\\(.)/g, '$1');
  return p.trim();
}

export function syncProject(projectRoot, opts = {}) {
  const kitRoot = opts.kitRoot || KIT_ROOT;
  const plan = planSync(projectRoot, { ...opts, kitRoot });
  const lock = loadLock(projectRoot);
  const errors = plan.validations.filter((v) => v.level === 'error');
  if (errors.length && !opts.force) {
    return { ok: false, reason: 'validation errors', errors, written: [], pruned: [] };
  }

  // HARD guard, before any classification: no write may pass through a junction/symlink.
  const reparse = findReparseAncestors(projectRoot, plan.actions.map((a) => a.rel));
  if (reparse.length) {
    return {
      ok: false,
      reason: 'reparse-point vendor path(s) — a junction/symlink here makes vendor writes clobber the canonical source. Remove the link first (Windows: rmdir <dir> — removes only the link), then re-run sync. NOT overridable by --force.',
      reparse, written: [], pruned: [],
    };
  }

  // classify writes
  const writes = []; const refusals = [];
  for (const a of plan.actions) {
    const abs = path.join(projectRoot, ...a.rel.split('/'));
    const exists = fs.existsSync(abs);
    const diskHash = exists ? sha(readText(abs)) : null;
    const expHash = sha(a.content);
    if (diskHash === expHash) continue; // already correct
    const locked = lock.files[a.rel];
    if (exists && locked && diskHash !== locked.out && !opts.force) {
      if (isOverlayClean(a, abs, projectRoot)) {
        // clean overlay — bypass refusal
      } else {
        refusals.push({ rel: a.rel, why: 'LOCALLY-EDITED since last sync', base: threeWayBase(kitRoot, lock.kitVersion, a.src) !== null ? `git show v${lock.kitVersion}:${a.src}` : '(no base tag)' });
        continue;
      }
    }
    if (exists && !locked && !opts.force) {
      if (isOverlayClean(a, abs, projectRoot)) {
        // clean overlay — bypass refusal
      } else {
        refusals.push({ rel: a.rel, why: 'exists but not lockfile-tracked (pre-migration content?)' });
        continue;
      }
    }
    writes.push(a);
  }

  // prunes: lockfile entries that fell out of the plan (decision 29 — only files we wrote)
  const planned = new Set(plan.actions.map((a) => a.rel));
  const prunes = []; const pruneRefusals = [];
  for (const [r, meta] of Object.entries(lock.files)) {
    if (planned.has(r)) continue;
    const abs = path.join(projectRoot, ...r.split('/'));
    if (!fs.existsSync(abs)) { prunes.push({ rel: r, missing: true }); continue; }
    if (sha(readText(abs)) === meta.out || opts.force) prunes.push({ rel: r });
    else pruneRefusals.push({ rel: r, why: 'locally edited — refusing to prune without --force' });
  }

  // git-clean guard (decision 36): every sync must be trivially revertible. TICKET-18 narrowing:
  // dirt whose content this sync would reproduce anyway (isOverlayClean — disk already matches the
  // expected generated content modulo the provenance header, or matches the overlay source) is
  // sync's own output, not user work at risk. Drop those entries and refuse only when genuinely-
  // user-dirty paths remain; the refusal names only those. Protection of real user edits is
  // untouched — a path whose dirt is NOT reproducible still refuses exactly as before.
  const touched = [...writes.map((w) => w.rel), ...prunes.filter((p) => !p.missing).map((p) => p.rel)];
  if (!opts.force && !opts.dryRun && touched.length) {
    const actionByRel = new Map(writes.map((w) => [w.rel, w]));
    const dirty = dirtyManagedPaths(projectRoot, touched).filter((line) => {
      const r = porcelainPath(line);
      const a = actionByRel.get(r);
      if (!a) return true; // prune target or unparseable line — keep it protected
      return !isOverlayClean(a, path.join(projectRoot, ...r.split('/')), projectRoot);
    });
    if (dirty.length) {
      return { ok: false, reason: 'git not clean on managed paths (commit or stash first, or --force)', dirty, written: [], pruned: [], refusals, plan };
    }
  }

  if (opts.dryRun) {
    return { ok: true, dryRun: true, wouldWrite: writes.map((w) => w.rel), wouldPrune: prunes.map((p) => p.rel), refusals: [...refusals, ...pruneRefusals], validations: plan.validations, survivingByAbsence: plan.survivingByAbsence, plan };
  }

  for (const a of writes) writeText(path.join(projectRoot, ...a.rel.split('/')), a.content);
  for (const p of prunes) {
    if (p.missing) continue;
    const abs = path.join(projectRoot, ...p.rel.split('/'));
    fs.rmSync(abs);
    let d = path.dirname(abs);
    while (d !== projectRoot && fs.existsSync(d) && !fs.readdirSync(d).length) { fs.rmdirSync(d); d = path.dirname(d); }
  }

  // settings key-merges
  const newSettings = {};
  const settingsWritten = [];
  for (const s of plan.settingsActions) {
    const abs = path.join(projectRoot, ...s.file.split('/'));
    const existing = fs.existsSync(abs) ? readText(abs) : null;
    const { content, managedKeys } = mergeSettings(s, existing, (lock.settings || {})[s.file]);
    if (content !== null && content !== existing) { writeText(abs, content); settingsWritten.push(s.file); }
    // Accumulate: .claude/settings.json is written by TWO kinds (claude-hooks + claude-permissions),
    // so the lock records the union of both kinds' managed keys for that file.
    if (managedKeys.length) newSettings[s.file] = [...(newSettings[s.file] || []), ...managedKeys];
  }
  // settings files we managed before but no longer: strip our keys
  for (const [file, keys] of Object.entries(lock.settings || {})) {
    if (newSettings[file]) continue;
    const abs = path.join(projectRoot, ...file.split('/'));
    if (!fs.existsSync(abs)) continue;
    if (file.endsWith('.md') || file.endsWith('.toml') || file.includes('mcp') || file === 'opencode.json') {
      const kind = file.endsWith('.md') ? 'md-block' : file.endsWith('.toml') ? 'toml-block' : file === 'opencode.json' ? 'opencode-mcp' : 'mcp-json';
      const emptyData = kind === 'mcp-json' || kind === 'opencode-mcp' ? {} : '';
      const { content } = mergeSettings({ merge: kind, data: emptyData }, readText(abs), keys);
      if (content !== null) { writeText(abs, content); settingsWritten.push(file); }
    } else {
      // .claude/settings.json may hold both kinds — strip hooks (event keys) and permissions
      // (paren-shaped keys) in turn, each reading the running content.
      const hookKeys = keys.filter((k) => !/[()]/.test(k));
      const permKeys = keys.filter((k) => /[()]/.test(k));
      let content = readText(abs);
      content = mergeSettings({ merge: 'claude-hooks', data: [] }, content, hookKeys).content;
      content = mergeSettings({ merge: 'claude-permissions', data: [] }, content, permKeys).content;
      if (content !== null) { writeText(abs, content); settingsWritten.push(file); }
    }
  }

  // write the lock — the shipped-state record, committed to git (decision 36).
  // CRITICAL: a lock entry means "this content was shipped by sync". For refused writes the disk
  // content is the USER'S, not ours — preserve the old shipped record so the local edit stays
  // detectable as LOCALLY-EDITED and the next sync cannot silently clobber it.
  const files = {};
  const edits = {};
  for (const a of plan.actions) {
    const abs = path.join(projectRoot, ...a.rel.split('/'));
    if (!fs.existsSync(abs)) continue; // refused writes on new files
    const diskHash = sha(readText(abs));
    if (diskHash === sha(a.content)) {
      files[a.rel] = { out: diskHash, src: a.src, srcHash: a.srcHash, owner: a.owner, vendor: a.vendor };
    } else if (lock.files[a.rel]) {
      files[a.rel] = lock.files[a.rel];
      if (lock.edits?.[a.rel]) edits[a.rel] = lock.edits[a.rel]; // keep the first-detected edit date
    }
    // else: untracked pre-existing file we refused to touch — stays untracked
  }
  // a refused PRUNE must not drop out of the lock either — else the stale file becomes permanently
  // invisible to every later command (check/doctor can no longer see it was ever kit-shipped). Carry
  // the old record forward, flagged, so checkProject's PRUNED/ORPHAN branch keeps seeing it. A later
  // successful prune (sync --force) or adopt naturally drops it — this loop just isn't reached for it.
  for (const p of pruneRefusals) {
    if (!lock.files[p.rel]) continue;
    files[p.rel] = { ...lock.files[p.rel], refusedPrune: true };
    if (lock.edits?.[p.rel]) edits[p.rel] = lock.edits[p.rel];
  }
  const newLock = {
    kitVersion: kitVersion(kitRoot), syncedAt: new Date().toISOString(),
    files, settings: newSettings, edits,
  };
  // write-if-changed, same rule as compileManifest: a no-op sync must not rewrite the lock with a
  // fresh syncedAt — timestamp-only churn is exactly the attribution noise syncedAt exists to cut.
  // syncedAt therefore means "the last sync that CHANGED something", which is the useful reading.
  const lockPath = path.join(projectRoot, '.agentkit.lock');
  const prevLock = readJson(lockPath, null);
  if (!(prevLock && JSON.stringify({ ...prevLock, syncedAt: null }) === JSON.stringify({ ...newLock, syncedAt: null }))) {
    writeJson(lockPath, newLock);
  }
  compileManifest(kitRoot);

  return {
    ok: true, written: writes.map((w) => w.rel), pruned: prunes.map((p) => p.rel),
    settingsWritten, refusals: [...refusals, ...pruneRefusals], validations: plan.validations,
    survivingByAbsence: plan.survivingByAbsence,
  };
}

// ---------- adopt (flowback — decisions 7/26) ----------

export function adoptFile(projectRoot, fileRel, opts = {}) {
  const kitRoot = opts.kitRoot || KIT_ROOT;
  const relNorm = fileRel.split(path.sep).join('/');
  const abs = path.join(projectRoot, ...relNorm.split('/'));
  if (!fs.existsSync(abs)) return { ok: false, reason: `no such file: ${relNorm}` };
  const lock = loadLock(projectRoot);
  const locked = lock.files[relNorm];

  if (opts.defer) {
    const qPath = path.join(kitRoot, 'flowback-queue.json');
    const q = readJson(qPath, []);
    q.push({ project: path.basename(projectRoot), file: relNorm, date: new Date().toISOString().slice(0, 10) });
    writeJson(qPath, q);
    return { ok: true, deferred: true };
  }

  let srcRel;
  if (locked && locked.src) {
    srcRel = locked.src;
    // reverse clobber guard (decision 26): refuse when the kit moved since this project last synced
    const kitAbs = path.join(kitRoot, ...srcRel.split('/'));
    const kitCurrent = fs.existsSync(kitAbs) ? sha(readText(kitAbs)) : null;
    if (kitCurrent !== null && kitCurrent !== locked.srcHash && !opts.force) {
      return {
        ok: false, reason: `kit source ${srcRel} changed since this project last synced (another project adopted first, or the kit was edited directly) — 3-way merge needed`,
        base: `git -C "${kitRoot}" show v${lock.kitVersion}:${srcRel}`,
      };
    }
  } else {
    if (!relNorm.startsWith('.agent/')) return { ok: false, reason: 'new files must live under .agent/ to be adoptable' };
    srcRel = relNorm;
  }

  const content = stripHeader(readText(abs));
  const kitAbs = path.join(kitRoot, ...srcRel.split('/'));
  const isNew = !fs.existsSync(kitAbs);
  writeText(kitAbs, content);

  // version semantics (decision 33): patch = content fix to existing asset; minor = new asset
  const pkgPath = path.join(kitRoot, 'package.json');
  const pkg = readJson(pkgPath, {});
  const [maj, min, pat] = (pkg.version || '0.0.0').split('.').map(Number);
  pkg.version = isNew ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;
  writeJson(pkgPath, pkg);

  // kit CHANGELOG entry with provenance
  const clPath = path.join(kitRoot, 'CHANGELOG.md');
  const today = new Date().toISOString().slice(0, 10);
  const entry = `## [${today}] — v${pkg.version} adopt: ${srcRel}\n- ${isNew ? 'New asset' : 'Content fix'} adopted from \`${path.basename(projectRoot)}\` (${relNorm})\n`;
  const cl = fs.existsSync(clPath) ? readText(clPath) : '# Changelog\n';
  const lines = normalizeEol(cl).split('\n');
  const insertAt = lines.findIndex((l) => l.startsWith('## '));
  if (insertAt === -1) lines.push('', entry); else lines.splice(insertAt, 0, entry, '');
  writeText(clPath, lines.join('\n'));

  compileManifest(kitRoot);
  return { ok: true, srcRel, isNew, newVersion: pkg.version, note: `commit the kit and tag v${pkg.version}, then re-sync the fleet` };
}

// ---------- inventory (mechanical variant matrix — decision 37: recency from git, never mtime) ----------

export function loadFleet(kitRoot = KIT_ROOT) {
  const f = readJson(path.join(kitRoot, 'fleet.json'), { members: [] });
  return f.members.map((m) => ({ ...m, abs: path.resolve(kitRoot, m.path) }));
}

function gitDates(projectRoot) {
  const dates = new Map();
  const prefix = (git(projectRoot, ['rev-parse', '--show-prefix'], { soft: true }) || '').trim();
  const log = git(projectRoot, ['log', '--format=\x01%cI', '--name-only', '--', '.agent'], { soft: true });
  if (log === null) return { dates, gitAvailable: false };
  let cur = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('\x01')) { cur = line.slice(1).trim(); continue; }
    const t = line.trim();
    if (!t || !cur) continue;
    const relToProj = prefix && t.startsWith(prefix) ? t.slice(prefix.length) : t;
    if (!dates.has(relToProj)) dates.set(relToProj, cur.slice(0, 10));
  }
  return { dates, gitAvailable: true };
}

export function runInventory(opts = {}) {
  const kitRoot = opts.kitRoot || KIT_ROOT;
  const fleet = loadFleet(kitRoot).filter((m) => m.status !== 'out');
  const rows = {}; // assetKey -> { project: {hash, date, dateSource} }
  const perProject = {};
  for (const m of fleet) {
    const base = path.join(m.abs, '.agent');
    if (!fs.existsSync(base)) { perProject[m.name] = { error: 'no .agent dir' }; continue; }
    const { dates, gitAvailable } = gitDates(m.abs);
    let count = 0;
    for (const p of walk(base)) {
      const sub = rel(base, p);
      if (sub.startsWith('journals/') || sub.startsWith('scratch/')) continue;
      const { type, name } = classifyAgentFile(sub);
      const key = type === 'skill' ? `skill:${name}` : `${type}:${name}`;
      const fileKey = `.agent/${sub}`;
      rows[key] = rows[key] || {};
      rows[key][m.name] = rows[key][m.name] || {};
      const d = dates.get(fileKey);
      rows[key][m.name][sub] = { hash: sha(readText(p)).slice(0, 12), date: d || null, dateSource: d ? 'git' : gitAvailable ? 'untracked' : 'no-git' };
      count++;
    }
    perProject[m.name] = { files: count, gitAvailable };
  }
  // notInKit = asset absent from the kit but live in ≥1 consumer: either project-owned by design
  // or kit-deleted drift (e.g. a retired workflow a consumer still carries). The matrix marks it so
  // no such row reads as a live kit asset; it cannot distinguish the two cases (TICKET-21).
  const kitMember = fleet.find((m) => m.abs === path.resolve(kitRoot));
  const notInKit = kitMember
    ? Object.keys(rows).filter((key) => !rows[key][kitMember.name] && Object.keys(rows[key]).length > 0).sort()
    : [];
  const out = { generatedAt: new Date().toISOString().slice(0, 10), projects: perProject, assets: rows, notInKit };
  writeJson(path.join(kitRoot, 'reports', 'inventory.json'), out);

  // human-readable variant matrix at the asset level
  const projNames = fleet.map((m) => m.name);
  const lines = ['# Fleet inventory — variant matrix', '', `Generated ${out.generatedAt} by \`agentkit inventory\` (hashes normalized-EOL sha256/12; dates from git history — decision 37).`, ''];
  lines.push('| asset | ' + projNames.join(' | ') + ' |');
  lines.push('|---|' + projNames.map(() => '---').join('|') + '|');
  for (const key of Object.keys(rows).sort()) {
    const cells = projNames.map((pn) => {
      const files = rows[key][pn];
      if (!files) return '—';
      const hashes = new Set(Object.values(files).map((f) => f.hash));
      const dates = Object.values(files).map((f) => f.date).filter(Boolean).sort();
      return `${[...hashes][0].slice(0, 7)}${hashes.size > 1 ? '+' : ''} ${dates[dates.length - 1] || '?'}`;
    });
    const label = notInKit.includes(key) ? `${key} _(not in kit)_` : key;
    lines.push(`| ${label} | ${cells.join(' | ')} |`);
  }
  writeText(path.join(kitRoot, 'reports', 'inventory.md'), lines.join('\n') + '\n');
  return out;
}

// ---------- stack-manifest lint (K2/core-A): declared tech pack with no matching dependency ----------
// A pack whose marker dep is absent from package.json is WARNED (never auto-removed; per-project —
// the pack stays canonical in the kit even if one project doesn't use it). One-of markers: match any.
export const STACK_MARKERS = {
  react: ['react'],
  nextjs: ['next'],
  next: ['next'],
  supabase: ['@supabase/supabase-js', '@supabase/ssr', 'supabase'],
  'react-flow': ['reactflow', '@xyflow/react', '@reactflow/core'],
  gsap: ['gsap', '@gsap/react'],
  'framer-motion': ['framer-motion', 'motion'],
  pwa: ['workbox-window', 'vite-plugin-pwa', '@ducanh2912/next-pwa', 'next-pwa'],
  typescript: ['typescript'],
  // 'web' is a meta-pack (Vercel Web Interface Guidelines) — no marker dependency; never flagged.
  // 'canvas' (tech:canvas, theme-aware canvas/GPU rendering) is a meta-pack too: it spans native 2D
  // canvas (no dep) and GPU libs (three, cobe, @react-three/fiber, regl), so no single marker is
  // required — declaring it is never flagged. (Renamed from the old 'webgl' pack.)
};

export function stackLint(projectRoot) {
  const cfg = loadConfig(projectRoot);
  if (!cfg) return { checked: false, warnings: [] };
  const pkg = readJson(path.join(projectRoot, 'package.json'), {});
  const deps = new Set([...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {}), ...Object.keys(pkg.peerDependencies || {})]);
  const warnings = [];
  for (const pack of cfg.stack || []) {
    const markers = STACK_MARKERS[pack];
    if (!markers) continue; // unknown/meta pack — no marker to check
    if (!markers.some((m) => deps.has(m))) {
      warnings.push({ pack, markersLookedFor: markers, why: `stack declares '${pack}' but package.json has none of: ${markers.join(', ')} — dead inherited pack? (warn only; remove from .agentkit.json stack if unused)` });
    }
  }
  return { checked: true, warnings };
}

// ---------- taxonomy lint (K7, warn-only): durable/lifecycle docs carry a sanctioned type prefix ----------
// CONSERVATIVE by design (K10: a guard that cries wolf is worse than none). WARN-ONLY unless the
// project opts into the ratchet (`.agentkit.json` "taxonomyEnforce": true) — flip once the project's
// docs are clean OR with a recorded "taxonomyBaseline" (number): the ratchet then gates on
// regression (findings > baseline), and the baseline only ever decreases. Waivers: a per-file
// `taxonomy-waiver:` frontmatter key, or an entry in the "taxonomyWaivers" array in `.agentkit.json`
// — an entry containing `*` is a glob (reuses the kit's overlay glob matcher), anything else is an
// exact path. `docs/raw-research/` — and the legacy `docs/research/` — is evidence (arbitrary names
// allowed); see TAXONOMY_PREFIX_AREAS below for why that exclusion is deliberate. Canonical spec:
// governance/docs-standard.md §(c),(f),(h).

// `ROADMAP-` (added 2026-07-25, F-taxonomy-research-store): a common, legitimate doc type that had no
// sanctioned prefix, so every roadmap was forced to either mis-prefix or take a waiver.
const TAXONOMY_PREFIXES = ['SPEC-', 'PRD-', 'STRATEGY-', 'RUNBOOK-', 'DECISION-', 'TICKET-', 'PLAN-', 'IDEA-', 'REVIEW-', 'LOG-', 'NARRATIVE-', 'RESEARCH-', 'ROADMAP-'];
const TAXONOMY_EXEMPT_NAME = /^(README|PROGRAM-STATUS|AGENTS|CHANGELOG.*|source-of-truth|backlog-status)\.md$/i;
const SUFFIX_DIALECT_RE = /-(spec|prd|strategy|runbook|decision|ticket|plan|idea|review|log|narrative|research)\.md$/i;
// `architecture` (added 2026-07-25, F-taxonomy-research-store): DECISION- docs land in
// docs/architecture/ naturally, but the area was unsanctioned — so the whole subtree went unchecked.
// Evidence stores are excluded by omission: this list is the walk set, so `docs/raw-research/` (and
// the legacy `docs/research/`) are never visited and their arbitrary names never flagged. That is
// deliberate and load-bearing — tier 1 (`raw-research/inbox/`) must accept any filename, and a rule
// that fired on every pre-existing corpus in the fleet would be the K10 cry-wolf failure.
// Enforcement of the tier-2 grammar belongs to the `research-curate` skill. (docs-standard §(f).)
const TAXONOMY_PREFIX_AREAS = ['knowledge-base', 'working', 'backlog', 'archive', 'architecture'];
// D1: prefix → the store a doc of that type belongs in (§a/§f). `archive` is a catch-all (any retired
// type) and `research` is evidence — neither is store-checked. A prefix in the wrong strict store
// (KB doc in working/, lifecycle doc in the KB, evidence doc outside research) is structurally wrong
// regardless of a valid prefix — the lint used to pass it because it only checked prefix *existence*.
// The store test is the doc's EXPIRY TRIGGER (docs-standard §a): expires when behavior changes →
// kb (SPEC-/RUNBOOK-); expires on a direction pivot → kb (STRATEGY-/DECISION- — a commitment is a
// present-tense fact even when its content describes the future); expires when the work LANDS →
// lifecycle (TICKET-/PLAN-/ROADMAP-/PRD-). `PRD-` moved kb → lifecycle 2026-08-01
// (F-prd-store-lifecycle): a PRD specifies the to-be and is superseded by landing — on landing it
// DISSOLVES (landed subset → SPEC-, unlanded remainder → strategy/backlog, record → archive), it is
// never parked whole in the KB.
const PREFIX_STORE = { 'SPEC-': 'kb', 'STRATEGY-': 'kb', 'RUNBOOK-': 'kb', 'DECISION-': 'kb', 'RESEARCH-': 'research', 'TICKET-': 'lifecycle', 'PLAN-': 'lifecycle', 'IDEA-': 'lifecycle', 'REVIEW-': 'lifecycle', 'LOG-': 'lifecycle', 'NARRATIVE-': 'lifecycle', 'ROADMAP-': 'lifecycle', 'PRD-': 'lifecycle' };
// `architecture` is a kb store: it holds DECISION-/SPEC- style durable contracts, same as knowledge-base.
const AREA_STORE = { 'knowledge-base': 'kb', 'working': 'lifecycle', 'backlog': 'lifecycle', 'architecture': 'kb' }; // archive/research: not store-checked
// The store is resolved per-PATH, not per-area. The kit's own docs/knowledge-base/README.md designates
// `research/README.md` as "the ledger for completed research" and the kit SHIPS that folder — but
// AREA_STORE['knowledge-base'] applied to the whole subtree, so every RESEARCH- doc in the documented
// location was flagged `wrong-store`. The kit's own layout was unreachable without tripping its own
// linter. A `research/` subtree inside the KB is the `research` store, exactly like top-level
// docs/research/. This RE-MAPS the store; it does not exempt the subtree — a SPEC- parked in the
// research ledger is still wrong-store. (F-taxonomy-research-store, 2026-07-25.)
const KB_RESEARCH_RE = /(^|[/\\])docs[/\\]knowledge-base[/\\]research[/\\]/;
// The top-level evidence store, under either name. `raw-research/` is current; `research/` is the
// legacy name kept recognised so unmigrated repos do not light up. Checks that scan ALL of docs/
// (D2 index-integrity, suffix-dialect) must skip it — evidence keeps arbitrary corpus names, and a
// mirrored vendor corpus keeps its upstream filenames on purpose. One constant, because two
// hand-copied regexes is how the rename silently un-exempted the store. (docs-standard §(f).)
const EVIDENCE_STORE_RE = /(^|[/\\])docs[/\\](raw-research|research)[/\\]/;
const storeForPath = (area, r) => (KB_RESEARCH_RE.test(r) ? 'research' : AREA_STORE[area]);

export function taxonomyLint(projectRoot, opts = {}) {
  const cfg = loadConfig(projectRoot) || {};
  const enforce = !!cfg.taxonomyEnforce;
  const baseline = cfg.taxonomyBaseline;
  // waiver entries: an entry containing `*` is a glob — reuse the kit's own overlay glob matcher
  // (matchesGlobs/globToRegex) rather than a second hand-rolled matcher; anything else is an exact
  // path, matched as before.
  // TICKET-29 / C2: a suppression must name an OWNER and a REASON. Two accepted forms —
  //   "docs/x/**"                                          (legacy bare string)
  //   { path: "docs/x/**", owner: "…", reason: "…" }        (owned)
  // A bare string is reported (warn) rather than rejected, so an upgrade never arrives red; a waiver
  // matching nothing on disk is DEAD and is reported too. Unowned lists are how one grew to 18 entries
  // "repaired ticket-by-ticket" with no owning ticket and four entries that were simply fixable.
  const rawWaivers = cfg.taxonomyWaivers || [];
  const waiverMeta = rawWaivers.map((w) => (typeof w === 'string'
    ? { path: w.replace(/^\.\//, ''), owner: null, reason: null }
    : { path: String(w.path || '').replace(/^\.\//, ''), owner: w.owner || null, reason: w.reason || null }))
    .filter((w) => w.path);
  const waiverEntries = waiverMeta.map((w) => w.path);
  const waiverExact = new Set(waiverEntries.filter((w) => !w.includes('*')));
  const waiverGlobs = waiverEntries.filter((w) => w.includes('*'));
  const waiverUsed = new Set();
  const docsRoot = path.join(projectRoot, 'docs');
  const hasPrefix = (name) => TAXONOMY_PREFIXES.some((p) => name.startsWith(p));
  const isWaived = (abs, r) => {
    if (waiverExact.has(r)) { waiverUsed.add(r); return true; }
    const g = waiverGlobs.find((w) => matchesGlobs([w], r));
    if (g) { waiverUsed.add(g); return true; }
    if (TAXONOMY_EXEMPT_NAME.test(path.basename(abs))) return true;
    if (/(^|\/)_templates\//.test(r)) return true;
    try { const { fm } = parseFrontmatter(readText(abs)); if (fm && fm['taxonomy-waiver'] != null) return true; } catch { /* not md/frontmatter */ }
    return false;
  };
  const findings = [];
  // 1. prefix presence + kebab tail in prefix-required areas
  for (const area of TAXONOMY_PREFIX_AREAS) {
    for (const p of walk(path.join(docsRoot, area), (f) => f.endsWith('.md'))) {
      const r = rel(projectRoot, p);
      if (isWaived(p, r)) continue;
      const name = path.basename(p);
      if (!hasPrefix(name)) findings.push({ file: r, kind: 'missing-prefix', detail: 'durable/lifecycle doc has no sanctioned type prefix' });
      else if (/[A-Z][a-z]/.test(name.replace(/^[A-Z]+-/, ''))) findings.push({ file: r, kind: 'title-case-tail', detail: 'tail should be lowercase-kebab, not Title-Case' });
      // D1: store-aware — the prefix's expected store must match the store the file's PATH resolves to
      // (skip archive). Path-resolved, not area-resolved, so the KB's own research/ ledger reads as the
      // research store rather than inheriting kb from its parent area.
      const areaStore = storeForPath(area, r);
      const expected = areaStore && PREFIX_STORE[TAXONOMY_PREFIXES.find((p) => name.startsWith(p))];
      if (expected && areaStore && expected !== areaStore) {
        findings.push({ file: r, kind: 'wrong-store', detail: `a ${name.match(/^[A-Z]+-/)[0]} doc belongs in the ${expected} store, not docs/${area}/ (§a/§f)` });
      }
    }
  }
  // D2: index-integrity — a backtick-quoted `<name>.md` in an index README must resolve to a real file
  // somewhere under docs/. A rename that adds a prefix leaves the old name in the README with no file —
  // `check --content` can't see it (backtick table text isn't a navigable citation). Conservative: only
  // flag a name that exists NOWHERE under docs/ (genuinely renamed away), tolerating archive cross-refs.
  // TICKET-25 case (a): the basename set must include the AGENT ASSET tree, not just docs/. A README
  // legitimately cites a rule or skill by bare backticked basename (`pattern-docs-artifacts.md`), and
  // scoping the set to docs/ made every such reference read as "renamed away" — a false positive on a
  // real, resolvable file whose only workaround was degrading correct prose. Root files (AGENTS.md,
  // README.md, CHANGELOG.md) count for the same reason.
  const allDocNames = new Set([
    ...walk(docsRoot, (f) => f.endsWith('.md')),
    ...walk(path.join(projectRoot, '.agent'), (f) => f.endsWith('.md')),
    ...['AGENTS.md', 'README.md', 'CHANGELOG.md'].map((f) => path.join(projectRoot, f)).filter((f) => fs.existsSync(f)),
  ].map((f) => path.basename(f)));
  // two conservative suppressions ONLY (not fence-skipping — verified to clear zero live findings):
  // (i) an explicit per-line marker, for a citation the author knows is illustrative; (ii) a
  // placeholder-shaped stem (`RESULT-N.md`, `RESULT-XX.md`) — an example token, not a real filename.
  const TAXONOMY_IGNORE_LINE = '<!-- taxonomy-ignore-line -->';
  const PLACEHOLDER_STEM_RE = /-(N|NN|X|XX|n)\.md$/;
  for (const p of walk(docsRoot, (f) => path.basename(f) === 'README.md')) {
    const r = rel(projectRoot, p);
    if (waiverExact.has(r) || matchesGlobs(waiverGlobs, r) || EVIDENCE_STORE_RE.test(r)) continue; // not isWaived() (README is an exempt *name*, but we scan it); evidence store is exempt
    for (const line of readText(p).split('\n')) {
      if (line.includes(TAXONOMY_IGNORE_LINE)) continue;
      for (const m of line.matchAll(/`([\w][\w.-]*\.md)`/g)) {
        const name = m[1];
        if (name === 'README.md' || TAXONOMY_EXEMPT_NAME.test(name)) continue;
        if (PLACEHOLDER_STEM_RE.test(name)) continue;
        if (!allDocNames.has(name)) findings.push({ file: r, kind: 'dead-index-entry', detail: `README lists \`${name}\` but no such doc exists (renamed away?)` });
      }
    }
  }
  // 2. universal across all of docs/: no spaces, no suffix dialects
  for (const p of walk(docsRoot, (f) => f.endsWith('.md'))) {
    const r = rel(projectRoot, p);
    const name = path.basename(p);
    if (/\s/.test(name)) findings.push({ file: r, kind: 'space-in-name', detail: 'filename contains a space' });
    const underResearch = EVIDENCE_STORE_RE.test(r); // evidence: arbitrary corpus names allowed
    if (!underResearch && !isWaived(p, r) && SUFFIX_DIALECT_RE.test(name) && !hasPrefix(name)) findings.push({ file: r, kind: 'suffix-dialect', detail: 'type marker is a suffix; use the prefix form' });
  }
  // 3. DECISION- docs carry `status:` frontmatter (scan docs/ + governance/ so the kit's own count)
  for (const root of [docsRoot, path.join(projectRoot, 'governance')]) {
    for (const p of walk(root, (f) => path.basename(f).startsWith('DECISION-') && f.endsWith('.md'))) {
      const r = rel(projectRoot, p);
      if (isWaived(p, r)) continue;
      const { fm } = parseFrontmatter(readText(p));
      if (!fm || fm.status == null) findings.push({ file: r, kind: 'decision-no-status', detail: 'DECISION- doc missing `status:` frontmatter' });
    }
  }
  // 4. INDEX COVERAGE (TICKET-29 / C5) — the mirror of D2. D2 asks "does every name in the index
  // exist?"; this asks "is every file that exists named in the index?". The second question is the one
  // that bites: an unindexed ticket is invisible to the next agent AND to any sweep that takes its
  // denominator from the index — a bulk status pass over "all 19" tickets missed the 20th, which had
  // never been indexed, and it still read `ready` long after it merged (governance/docs-standard §(i),
  // "Index completeness"). Enumerated from the FILESYSTEM, never from the index (§(i), D2 rule).
  for (const area of ['working', 'backlog']) {
    const areaDir = path.join(docsRoot, area);
    const readme = path.join(areaDir, 'README.md');
    if (!fs.existsSync(readme)) continue;          // no index ⇒ nothing to be missing from
    const indexText = readText(readme);
    for (const p of walk(areaDir, (f) => f.endsWith('.md'))) {
      const r = rel(projectRoot, p);
      const name = path.basename(p);
      if (name === 'README.md' || isWaived(p, r)) continue;
      if (!indexText.includes(name)) findings.push({ file: r, kind: 'unindexed-doc', detail: `exists but is not named in docs/${area}/README.md — invisible to the next agent and to any index-driven sweep` });
    }
  }
  // 5. WAIVER HYGIENE (TICKET-29 / C2 + D5). Runs last: isWaived() has now been called for every
  // scanned file, so waiverUsed is complete. Both findings are warn-tier — a suppression list is a
  // maintenance signal, not a build break, and an upgrade that turns a fleet red gets disabled.
  for (const w of waiverMeta) {
    if (!w.owner || !w.reason) findings.push({ file: '.agentkit.json', kind: 'waiver-unowned', severity: 'warn', detail: `taxonomyWaivers entry "${w.path}" names no owner/reason — use { path, owner, reason }` });
    if (!waiverUsed.has(w.path)) findings.push({ file: '.agentkit.json', kind: 'waiver-dead', severity: 'warn', detail: `taxonomyWaivers entry "${w.path}" suppresses nothing — remove it (ratchet: empty the list, run, fix or justify each failure, re-add only owned survivors)` });
  }
  const seen = new Set();
  const unique = findings.filter((x) => { const k = `${x.file}|${x.kind}|${x.detail || ''}`; if (seen.has(k)) return false; seen.add(k); return true; });
  return { project: projectRoot, findings: unique, enforce, baseline, clean: unique.length === 0 };
}

// ---------- hygiene check (git-based, deterministic — decisions A + D from batch-3 feedback) ----------

// Does this SHA name an object in THIS repo at all? A ticket legitimately cites SHAs from other
// repos (a flowback ticket names its source repo's commits), and those are not a git failure — they
// simply are not ours, so they cannot be an ancestor of our main. Reporting them as
// "could-not-determine" is the D6 cross-repo false positive, one checker over.
function shaExistsHere(projectRoot, sha) {
  try {
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch { return false; }
}

function checkMergeBase(projectRoot, sha, ref) {
  if (!shaExistsHere(projectRoot, sha)) return 'foreign';
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, ref], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return 'ancestor';
  } catch (e) {
    if (e.status === 1) return 'not-ancestor';
    return 'error';
  }
}

// Below this marker in a feedback pool, every `###` entry needs a **Provenance**: line (§1
// codification gate). Above it = legacy entries that pre-date the contract; never retro-flagged.
export const PROVENANCE_MARKER = '<!-- provenance-required-below -->';

// The one status parser for every consumer (checkHygiene, humanGates). Frontmatter `status:` wins
// (`Status:` accepted — earlier docs used it, kernel §2); the prose bold line is the fallback that
// makes the frontmatter migration non-breaking, in BOTH live dialects: `**Status**: x` (colon
// outside the bold) and `**Status:** x` (colon inside). A dialect a consumer cannot parse leaves
// the artifact silently exempt from its checks — fail-open — and two hand-copied parsers here
// already drifted once, so keep this the single copy.
function parseArtifactStatus(content) {
  let status = null;
  let fm = null;
  let body = content;
  try {
    const parsed = parseFrontmatter(content);
    if (parsed.fm) { fm = parsed.fm; if (fm.status != null || fm.Status != null) status = String(fm.status ?? fm.Status); }
    body = parsed.body;
  } catch { /* not a frontmatter doc */ }
  if (!status) {
    const m = body.match(/\*\*Status(?::\*\*|\*\*\s*:)\s*(\S+)/i);
    if (m) status = m[1];
  }
  return { status, fm, body };
}

export function checkHygiene(projectRoot, opts = {}) {
  const cfg = loadConfig(projectRoot);
  const mainBranch = cfg?.orchestration?.mainBranch || 'origin/main';
  const staleDays = cfg?.thresholds?.staleTicketDays ?? 30;
  const findings = [];
  const errors = [];
  const ticketDirs = ['docs/backlog', 'docs/working'];

  for (const dir of ticketDirs) {
    const abs = path.join(projectRoot, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of walk(abs, (f) => f.endsWith('.md'))) {
      const relFile = rel(projectRoot, f);
      const content = readText(f);
      const { status, fm, body } = parseArtifactStatus(content);
      const isOpen = status && ['ready', 'in-progress', 'open'].includes(status.toLowerCase());

      // (a) merged-but-open: open ticket citing a SHA already in main branch
      if (isOpen) {
        const shaCandidates = [];
        for (const line of body.split('\n')) {
          const shas = line.match(/\b[0-9a-f]{7,40}\b/g);
          if (!shas) continue;
          const lower = line.toLowerCase();
          const isDependencyOrRef = /\b(depend|see-also|see\s+also|provenance|source|ref|reference|base|parent)\b/i.test(lower);
          const isLandingContext = /\b(merge|land|ship|via|commit|fix|close|push|done)\b/i.test(lower);
          if (isDependencyOrRef || !isLandingContext) {
            continue;
          }
          for (const sha of shas) {
            shaCandidates.push(sha);
          }
        }
        const uniqueShas = [...new Set(shaCandidates)];
        for (const sha of uniqueShas) {
          const r = checkMergeBase(projectRoot, sha, mainBranch);
          if (r === 'ancestor') {
            findings.push({ kind: 'merged-but-open', file: relFile, severity: 'fail', detail: `cites SHA ${sha.slice(0, 12)} which is an ancestor of ${mainBranch} but status is "${status}"` });
            break;
          } else if (r === 'error') {
            errors.push({ kind: 'could-not-determine', file: relFile, severity: 'error', detail: `could not check if SHA ${sha.slice(0, 12)} is an ancestor of ${mainBranch}` });
          }
          // 'foreign' → a SHA from another repo (a flowback ticket cites its source's commits).
          // Silent by design: it is not ours, so it cannot be an ancestor, and it is not an error.
        }
      }

      // (a2) TICKET-30 / C3: an artifact whose frontmatter records landed SHAs cannot sit in
      // docs/backlog/. Backlog means "not yet started"; landed SHAs mean it shipped. This is the
      // mechanical replacement for the 19-stale-Status-lines class — a backlog index section still
      // described a 20-ticket program as "Not yet started" after five waves had landed and pushed.
      const landed = fm && fm.landed;
      const landedList = Array.isArray(landed) ? landed : (landed ? [String(landed)] : []);
      if (landedList.length && dir === 'docs/backlog') {
        findings.push({ kind: 'landed-in-backlog', file: relFile, severity: 'fail', detail: `frontmatter records landed SHA(s) ${landedList.join(', ')} but the artifact sits in docs/backlog/ ("not yet started")` });
      }
      // (a3) TICKET-30 / C3: every SHA written into the machine-read `landed:` field must be a real
      // ancestor of the main branch. This field is TRUSTED by the checks above, so an unverified
      // entry here is worse than an unverified one in prose.
      for (const sha of landedList) {
        const r = checkMergeBase(projectRoot, String(sha).trim(), mainBranch);
        if (r === 'not-ancestor') findings.push({ kind: 'landed-not-ancestor', file: relFile, severity: 'fail', detail: `frontmatter landed: ${sha} is not an ancestor of ${mainBranch}` });
        else if (r === 'foreign') findings.push({ kind: 'landed-not-ancestor', file: relFile, severity: 'fail', detail: `frontmatter landed: ${sha} names no commit in this repo` });
      }

      // (c) stale ticket: open/needs-human-verify ticket unchanged longer than threshold
      if (isOpen || (status && status.toLowerCase() === 'needs-human-verify')) {
        try {
          const log = execFileSync('git', ['log', '-1', '--format=%cI', '--', relFile], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
          if (log) {
            const age = Math.floor((Date.now() - new Date(log).getTime()) / 86400000);
            if (age > staleDays) {
              findings.push({ kind: 'stale-ticket', file: relFile, severity: 'flag', detail: `last committed ${age}d ago (threshold: ${staleDays}d), status "${status}" unchanged` });
            }
          }
        } catch { /* no git history for this file — skip */ }
      }
    }
  }

  // (b) uncommitted docs: git status --porcelain -- docs/ non-empty
  try {
    const statusOut = execFileSync('git', ['status', '--porcelain', '--', 'docs/'], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    if (statusOut) {
      const files = statusOut.split('\n').filter(Boolean).map(l => l.trim().slice(2).trim());
      findings.push({ kind: 'uncommitted-docs', file: null, severity: 'flag', detail: `uncommitted changes in docs/: ${files.join(', ')}` });
    }
  } catch (e) {
    errors.push({ kind: 'could-not-determine', file: null, severity: 'error', detail: 'git status --porcelain -- docs/ failed' });
  }

  // (d) feedback-intake provenance: in feedback pools (docs/backlog/IDEA-*feedback*.md), every
  // `###` entry below the explicit PROVENANCE_MARKER must carry a `**Provenance**:` line
  // (pattern-agent-orchestration.md §1 codification gate). A file without the marker is a legacy
  // pool — exempt until it opts in, so old entries are never retro-flagged.
  const backlogAbs = path.join(projectRoot, 'docs/backlog');
  if (fs.existsSync(backlogAbs)) {
    for (const f of walk(backlogAbs, (p) => /^IDEA-.*feedback.*\.md$/i.test(path.basename(p)))) {
      const relFile = rel(projectRoot, f);
      const content = readText(f);
      const markerIdx = content.indexOf(PROVENANCE_MARKER);
      if (markerIdx === -1) continue;
      for (const chunk of content.slice(markerIdx).split(/\n(?=###\s)/)) {
        const m = chunk.match(/^###\s+(.+)/);
        if (!m) continue;
        if (!/\*\*Provenance\*\*\s*:/.test(chunk)) {
          findings.push({ kind: 'unstamped-feedback', file: relFile, severity: 'flag', detail: `entry "${m[1].trim()}" lacks a **Provenance**: line (producer tier · model · evidence tier · source) — treated as candidate, not codifiable` });
        }
      }
    }
  }

  // (e) settings hygiene (decision 16 revised, 2026-07-10): drift the kit previously ignored —
  // fossilized one-off allow entries, over-broad grants, a defaultMode cascade (local shadowing
  // project), and a trustedDirectories naming another repo. Report-only (severity 'flag').
  findings.push(...scanSettingsHygiene(projectRoot, opts).findings);

  return { project: projectRoot, findings, errors, humanGates: humanGates(projectRoot), clean: findings.filter(f => f.severity === 'fail').length === 0 };
}

// TICKET-30 / C6: the human-gate view is GENERATED, never hand-consolidated. Every artifact whose
// status is `needs-human-verify` appears here by construction, because the list is built by globbing
// the lifecycle directories — the index is never the enumerator. A hand-written "single human-gate
// list" is what omitted an open browser check that was honestly marked on both its ticket AND the
// board, while two other indexes described the same program with different denominators.
export function humanGates(projectRoot) {
  const out = [];
  for (const dir of ['docs/backlog', 'docs/working']) {
    const abs = path.join(projectRoot, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of walk(abs, (p) => p.endsWith('.md'))) {
      const { status } = parseArtifactStatus(readText(f));
      if (status && status.toLowerCase().startsWith('needs-human-verify')) out.push({ file: rel(projectRoot, f), status });
    }
  }
  return out;
}

const OVERBROAD_GRANTS = new Set(['Bash(*)', 'Bash(powershell*)', 'Read(*)', 'Edit(*)', 'Write(*)']);
function isFossilPerm(entry) {
  return /&&|;|\$\(|`/.test(entry) || entry.length > 80;
}

// Scan the three Claude settings layers (global ~/.claude, project, project-local) for permission
// hygiene. `opts.homeDir` overrides os.homedir() so tests never read the real global settings.
export function scanSettingsHygiene(projectRoot, opts = {}) {
  const home = opts.homeDir || os.homedir();
  const findings = [];
  const layers = [
    ['global', path.join(home, '.claude', 'settings.json')],
    ['project', path.join(projectRoot, '.claude', 'settings.json')],
    ['local', path.join(projectRoot, '.claude', 'settings.local.json')],
  ];
  const modeByLayer = {};
  const projBase = path.basename(projectRoot.replace(/[/\\]+$/, ''));
  for (const [label, file] of layers) {
    if (!fs.existsSync(file)) continue;
    let s;
    try { s = JSON.parse(readText(file)); } catch { findings.push({ kind: 'settings-unparseable', file: label === 'global' ? file : rel(projectRoot, file), severity: 'flag', detail: `${label} settings JSON did not parse` }); continue; }
    if (s.defaultMode) modeByLayer[label] = s.defaultMode;
    const allow = (s.permissions && Array.isArray(s.permissions.allow)) ? s.permissions.allow : [];
    const shownFile = label === 'global' ? file : rel(projectRoot, file);
    for (const e of allow) {
      if (OVERBROAD_GRANTS.has(String(e).replace(/\s+/g, ''))) findings.push({ kind: 'overbroad-grant', file: shownFile, severity: 'flag', detail: `over-broad allow entry "${e}" in ${label} settings — grants far more than needed` });
      else if (isFossilPerm(String(e))) findings.push({ kind: 'fossil-permission', file: shownFile, severity: 'flag', detail: `fossil allow entry in ${label} settings (compound/oversized — matched once, never again): ${String(e).slice(0, 60)}${String(e).length > 60 ? '…' : ''}` });
    }
    for (const d of (Array.isArray(s.trustedDirectories) ? s.trustedDirectories : [])) {
      const dBase = path.basename(String(d).replace(/[/\\]+$/, ''));
      if (dBase && dBase !== projBase) findings.push({ kind: 'stale-trusteddir', file: shownFile, severity: 'flag', detail: `trustedDirectories in ${label} names "${dBase}" — not this repo (${projBase}); likely a stale cross-repo copy` });
    }
  }
  if (modeByLayer.local && modeByLayer.project && modeByLayer.local !== modeByLayer.project) {
    findings.push({ kind: 'defaultmode-cascade', file: '.claude/settings.local.json', severity: 'flag', detail: `settings.local.json defaultMode "${modeByLayer.local}" silently overrides settings.json "${modeByLayer.project}" (local wins the cascade)` });
  }
  return { findings };
}

// ---------- verify (core-J): harvest checkable invariants FROM the rules that own them ----------
// A rule declares its automatable greps in a fenced ```agentkit-checks JSON block; `verify` collects
// them from every ACTIVE rule (kit-selected core + project overlay) and runs them against the
// project's `sourceRoots`. This kills the dual-maintenance where the verify-rules skill restated
// (and `src/`-hardcoded) checks the rules already own. Each check: { id, pattern, globs[],
// severity, message, exclude?[], flags? }.

const CHECKS_FENCE_RE = /```agentkit-checks\s*\n([\s\S]*?)```/g;
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function harvestChecks(projectRoot, opts = {}) {
  const kitRoot = opts.kitRoot || KIT_ROOT;
  const cfg = opts.cfg || loadConfig(projectRoot) || {};
  const selfSync = path.resolve(projectRoot) === path.resolve(kitRoot);
  const kitEntries = opts.kitEntries || scanKitAgent(kitRoot);
  let ruleEntries;
  if (selfSync) {
    ruleEntries = kitEntries.filter((e) => e.type === 'rule');
  } else {
    const selected = selectEntries(kitEntries, cfg);
    const overlay = scanProjectOverlay(projectRoot, selected.map((e) => e.subPath), loadLock(projectRoot));
    ruleEntries = [...selected, ...overlay].filter((e) => e.type === 'rule');
  }
  const checks = [];
  const errors = [];
  for (const e of ruleEntries) {
    const text = e.raw || '';
    let m;
    CHECKS_FENCE_RE.lastIndex = 0;
    while ((m = CHECKS_FENCE_RE.exec(text))) {
      let parsed;
      try { parsed = JSON.parse(m[1]); } catch (err) { errors.push({ rule: e.srcRel, why: `invalid agentkit-checks JSON: ${err.message}` }); continue; }
      for (const c of (Array.isArray(parsed) ? parsed : [parsed])) {
        if (!c || !c.id || !c.pattern) { errors.push({ rule: e.srcRel, why: `check missing id/pattern` }); continue; }
        checks.push({ ...c, rule: e.srcRel });
      }
    }
  }
  return { checks, errors, sourceRoots: sourceRootsFor(cfg), exclude: (cfg.verify && cfg.verify.exclude) || [] };
}

// §6: blank comment spans so a value inside a comment isn't a violation (e.g. a hex in `/* #fff */`
// is not a zero-hex defect). Replace comment chars with spaces but KEEP newlines so line numbers hold.
// Handles CSS/JS block comments and `//` line comments (guarding `://` in URLs).
export function blankComments(text) {
  let t = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  t = t.replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  return t;
}

export function runVerify(projectRoot, opts = {}) {
  const kitRoot = opts.kitRoot || KIT_ROOT;
  const h = harvestChecks(projectRoot, { ...opts, kitRoot });
  const findings = [];
  const SKIP_SEG = new Set(['.claude', '.gemini', '.opencode', '.codex', '.agents', '.agent', 'dist', 'build', 'coverage']);
  for (const root of h.sourceRoots) {
    const base = path.join(projectRoot, ...root.split('/'));
    for (const p of walk(base, (f) => CODE_EXT.test(f))) {
      const relp = rel(projectRoot, p);
      if (relp.split('/').some((s) => SKIP_SEG.has(s))) continue;
      if (h.exclude.length && matchesGlobs(h.exclude, relp)) continue;
      let lines = null;
      for (const c of h.checks) {
        if (Array.isArray(c.globs) && c.globs.length && !matchesGlobs(c.globs, relp)) continue;
        if (Array.isArray(c.exclude) && matchesGlobs(c.exclude, relp)) continue;
        let re;
        try { re = new RegExp(c.pattern, (c.flags || '').replace('g', '')); } catch { continue; }
        if (lines === null) lines = blankComments(readText(p)).split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) findings.push({ severity: c.severity || 'medium', id: c.id, rule: c.rule, file: relp, line: i + 1, message: c.message || '', text: lines[i].trim().slice(0, 120) });
        }
      }
    }
  }
  findings.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) || a.file.localeCompare(b.file) || a.line - b.line);
  const counts = {};
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  const ruleSet = new Set(h.checks.map((c) => c.rule));
  return { project: projectRoot, sourceRoots: h.sourceRoots, checkCount: h.checks.length, ruleCount: ruleSet.size, harvestErrors: h.errors, findings, counts, clean: findings.length === 0 };
}

// ---------- changelog-roll (R13): assemble changelog.d/ fragments into CHANGELOG.md ----------
// Parallel lanes each drop a fragment `changelog.d/<slug>.md` (own file → no merge conflict); the
// merge-train rolls them into one dated section in a single commit, then deletes the fragments. Makes
// a multi-lane train's CHANGELOG conflict-free.
export function changelogRoll(projectRoot, opts = {}) {
  const dir = path.join(projectRoot, 'changelog.d');
  if (!fs.existsSync(dir)) return { ok: true, rolled: 0, note: 'no changelog.d/ — nothing to assemble' };
  const frags = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md').sort();
  if (!frags.length) return { ok: true, rolled: 0, note: 'changelog.d/ has no fragments' };
  const date = opts.date || new Date().toISOString().slice(0, 10);
  const heading = `## [${date}]${opts.version ? ` — ${opts.version}` : ''}`;
  const body = frags.map((f) => readText(path.join(dir, f)).trim()).filter(Boolean).join('\n\n');
  const section = `${heading}\n\n${body}\n`;
  const clPath = path.join(projectRoot, 'CHANGELOG.md');
  const existing = fs.existsSync(clPath) ? normalizeEol(readText(clPath)) : '# Changelog\n';
  const header = existing.match(/^# Changelog\s*\n+/);
  const out = header ? existing.slice(0, header[0].length) + section + '\n' + existing.slice(header[0].length)
    : `# Changelog\n\n${section}\n${existing}`;
  if (!opts.dryRun) {
    writeText(clPath, out);
    for (const f of frags) fs.rmSync(path.join(dir, f));
  }
  return { ok: true, rolled: frags.length, fragments: frags, section, dryRun: !!opts.dryRun };
}

// ---------- doctor (fleet-wide rollup — self-scheduling via session-start hook, decision 39) ----------

const CONFLICT_COPY_RE = /-(DESKTOP|LAPTOP)-\w+|\s\(\d+\)\.|conflicted copy/i;

export function runDoctor(opts = {}) {
  const kitRoot = opts.kitRoot || KIT_ROOT;
  let fleet = loadFleet(kitRoot);
  let only = opts.only || null;
  let note = null;
  if (opts.only) {
    // `doctor --project <name>` (portal finding 4): scope the whole rollup — members, tool
    // reachability, and KB staleness — to one fleet member so a per-project DoD is directly checkable.
    const wanted = fleet.filter((m) => m.name === opts.only);
    if (!wanted.length) return { error: `no fleet member named '${opts.only}'`, available: fleet.map((m) => m.name).sort() };
    fleet = wanted;
  } else if (opts.projectRoot && !opts.all) {
    // usage advertises `doctor [project-path]` — honor it: a cwd/project-path matching a fleet
    // member's abs path scopes exactly like --project <name>. A non-member path is not an error
    // (unlike an unknown --project name) — it just falls back to the full rollup with a note, since
    // running doctor from an arbitrary directory is a normal, expected case.
    const norm = (p) => {
      const n = path.resolve(p).split(path.sep).join('/');
      return process.platform === 'win32' ? n.toLowerCase() : n;
    };
    const target = norm(opts.projectRoot);
    const matched = fleet.find((m) => norm(m.abs) === target);
    if (matched) {
      fleet = [matched];
      only = matched.name;
    } else {
      note = `doctor: ${opts.projectRoot} is not a fleet member — showing full fleet; use --project <name> or --all`;
    }
  }
  const report = { ranAt: new Date().toISOString(), quick: !!opts.quick, only, members: {}, governedDocs: [], conflictCopies: [], reparsePoints: [], pins: {}, tools: {}, flowbackQueue: readJson(path.join(kitRoot, 'flowback-queue.json'), []) };
  if (note) report.note = note;

  for (const m of fleet) {
    if (!fs.existsSync(m.abs)) { report.members[m.name] = { status: 'path missing' }; continue; }
    const cfg = loadConfig(m.abs);
    if (!cfg) { report.members[m.name] = { status: m.status === 'managed' ? 'pre-migration (no .agentkit.json)' : m.status }; continue; }
    try {
      const c = checkProject(m.abs, { kitRoot, noWrite: true });
      const counts = {};
      for (const r of c.results) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
      const entry = { status: c.clean ? 'clean' : 'drift', counts, nags: c.nags, errors: c.validations.filter((v) => v.level === 'error').map((v) => v.msg) };
      if (c.survivingByAbsence?.length) entry.unclaimedOverlay = c.survivingByAbsence;
      if (!opts.quick) {
        // K2/core-A: stack-manifest lint (dead inherited packs)
        const sl = stackLint(m.abs);
        if (sl.warnings.length) entry.stackWarnings = sl.warnings.map((w) => w.why);
        // K1/K6/core-B: content-integrity (phantom citations)
        const ci = checkContentIntegrity(m.abs, { kitRoot });
        if (ci.findings.length) entry.phantomCitations = { count: ci.findings.length, sample: ci.findings.slice(0, 8).map((f) => `${f.file} → ${f.token}`) };
        // K7: taxonomy lint (warn-only; ratchet per project)
        const tl = taxonomyLint(m.abs);
        if (tl.findings.length) entry.taxonomyWarnings = { count: tl.findings.length, enforce: tl.enforce, sample: tl.findings.slice(0, 6).map((f) => `${f.file} [${f.kind}]`) };
      }
      report.members[m.name] = entry;
      if (Object.keys(cfg.pins).length) report.pins[m.name] = cfg.pins;
    } catch (e) {
      report.members[m.name] = { status: 'check failed', error: String(e.message || e) };
    }
    // cloud-synced conflict-copy scan (decision 30)
    for (const dir of ['.agent', '.claude', '.codex', '.gemini', '.opencode', '.agents']) {
      const d = path.join(m.abs, dir);
      for (const p of walk(d)) if (CONFLICT_COPY_RE.test(path.basename(p))) report.conflictCopies.push(rel(m.abs, p));
    }
    // reparse-point scan (pilot finding): junctioned vendor dirs corrupt sources on sync
    for (const dir of ['.claude', '.codex', '.gemini', '.opencode', '.agents']) {
      const d = path.join(m.abs, dir);
      if (!fs.existsSync(d)) continue;
      const candidates = [d, ...fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory() || e.isSymbolicLink()).map((e) => path.join(d, e.name))];
      for (const c of candidates) {
        try {
          if (fs.lstatSync(c).isSymbolicLink()) report.reparsePoints.push({ member: m.name, path: rel(m.abs, c) });
        } catch { /* ignore */ }
      }
    }
  }

  // ONE staleness machinery for every governed doc (decision 35): anything with last-verified: frontmatter
  const governedRoots = [path.join(kitRoot, 'governance'), path.join(kitRoot, 'integrations')];
  for (const m of fleet) governedRoots.push(path.join(m.abs, 'docs', 'knowledge-base'));
  const thresholdDays = opts.staleDays || 60;
  for (const root of governedRoots) {
    for (const p of walk(root, (f) => f.endsWith('.md'))) {
      const { fm } = parseFrontmatter(readText(p));
      if (!fm?.['last-verified']) continue;
      const age = Math.floor((Date.now() - new Date(fm['last-verified']).getTime()) / 86400000);
      if (age > thresholdDays) report.governedDocs.push({ doc: p.replace(kitRoot + path.sep, ''), lastVerified: fm['last-verified'], ageDays: age, docUrls: fm['doc-urls'] || null });
    }
  }

  // tool callability (decision 19) — declared tools must be REACHABLE, not merely documented.
  // Reachability is PER PROJECT: the check-command runs in the declaring project's directory (a
  // local devDependency like fallow's `npx --no-install fallow` resolves against cwd's node_modules,
  // not the kit's). A tool is only "ok" for a project when its check passes IN THAT PROJECT.
  if (!opts.quick) {
    const declaredBy = new Map(); // tool -> [{name, abs}]
    for (const m of fleet) { const cfg = loadConfig(m.abs); for (const t of cfg?.tools || []) { if (!declaredBy.has(t)) declaredBy.set(t, []); declaredBy.get(t).push(m); } }
    for (const [t, members] of declaredBy) {
      const integ = loadIntegration(kitRoot, t);
      if (!integ) { report.tools[t] = { ok: false, why: 'declared by a project but missing from integrations/ registry' }; continue; }
      const cmd = integ.fm['check-command'];
      if (!cmd) { report.tools[t] = { ok: null, why: 'no check-command in registry entry' }; continue; }
      const perProject = {};
      for (const m of members) {
        try {
          execFileSync(process.platform === 'win32' ? 'cmd' : 'sh', [process.platform === 'win32' ? '/c' : '-c', cmd], { timeout: 20000, stdio: 'ignore', cwd: m.abs });
          perProject[m.name] = true;
        } catch { perProject[m.name] = false; }
      }
      const bad = Object.entries(perProject).filter(([, ok]) => !ok).map(([n]) => n);
      report.tools[t] = { ok: bad.length === 0, perProject, ...(bad.length ? { why: `check-command failed in: ${bad.join(', ')}` } : {}) };
    }
  }

  writeJson(path.join(kitRoot, 'reports', 'doctor-last-run.json'), { ranAt: report.ranAt, quick: report.quick });
  return report;
}

// ---------- init ----------

// Scaffold the gate:* script convention (A2 · foundation-testing.md §1) non-destructively into an
// existing package.json. Wires `gate:<tier>` → `npm run <tier>` for whichever of lint/typecheck/
// test/build the project already defines, plus an aggregate `gate`. Never overwrites an existing
// key. Effect: agents run the graduated gate as ONE allowlisted `npm run gate*` command instead of
// an unmatchable compound (`pattern-command-shape.md`); the script owns the true exit code.
export function scaffoldGateScripts(projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return { scaffolded: false, reason: 'no package.json' };
  const pkg = readJson(pkgPath, {});
  pkg.scripts = pkg.scripts || {};
  const map = [['gate:lint', 'lint'], ['gate:types', 'typecheck'], ['gate:test', 'test'], ['gate:build', 'build']];
  const added = [];
  const tiers = [];
  for (const [gateName, srcScript] of map) {
    if (pkg.scripts[gateName] !== undefined) { tiers.push(gateName); continue; } // respect a hand-written gate:X
    if (pkg.scripts[srcScript] !== undefined) { pkg.scripts[gateName] = `npm run ${srcScript}`; added.push(gateName); tiers.push(gateName); }
  }
  if (pkg.scripts.gate === undefined && tiers.length) { pkg.scripts.gate = tiers.map((t) => `npm run ${t}`).join(' && '); added.push('gate'); }
  if (added.length) writeJson(pkgPath, pkg);
  return { scaffolded: added.length > 0, added, pkg: rel(projectRoot, pkgPath) };
}

// TICKET-22: seed a starter fallow config so a new adopter never hits the false-clean →
// finding-flood cliff (integrations/fallow.md — Noise suppression). Levers 1+3 pre-wired;
// ignoreExports ships empty by design (its names are per-repo cite-or-run evidence).
const FALLOWRC_SCAFFOLD = `{
  // WHY: exports also consumed inside their own file are the "demote to non-exported, never
  // delete" class (pattern-refactoring.md §6) — align the scanner with that invariant up front.
  "ignoreExportsUsedInFile": true,

  // Contract: add names ONLY with a cite-or-run verified test importer; never "*".
  // Per-repo evidence, not template content — ships empty by design.
  "ignoreExports": [],

  "duplicates": {
    // WHY: fixtures/dev-data repeat literal shapes on purpose (readability over DRY), and
    // vendored-file duplication is upstream's to fix. Uncomment/adjust to this repo's paths:
    "ignore": [
      // "src/**/fixtures/**",
      // "src/**/dev-data/**"
    ]
  }
  // Invariant: after any suppression-only change here, the unused-file count must be identical
  // before/after (integrations/fallow.md — Noise suppression) — the proof no signal was hidden.
}
`;
function scaffoldFallowrc(projectRoot, tools) {
  if (!(tools || []).includes('fallow')) return { written: false, reason: 'fallow not in tools' };
  const existing = fs.readdirSync(projectRoot).filter((f) => f.toLowerCase().startsWith('.fallowrc'));
  if (existing.length) return { written: false, reason: `existing ${existing[0]} untouched` };
  writeText(path.join(projectRoot, '.fallowrc.jsonc'), FALLOWRC_SCAFFOLD);
  return { written: true, file: '.fallowrc.jsonc' };
}

// F-init-no-root-contract: a greenfield repo joined the fleet with 82 assets and NO project contract.
// `init` correctly skips the JS gate for a non-app kind, but nothing wrote a root AGENTS.md — and
// sync's K3 workflow-map is opt-in via markers ("an authored AGENTS.md without them is never touched"),
// so a repo with NO AGENTS.md at all got nothing from either side. Scaffold the kit skeleton (it already
// carries the two K3 markers, so the first sync fills the command map) plus a CLAUDE.md import.
// Import form (`@AGENTS.md`), NOT a symlink: Anthropic's docs recommend the import specifically on
// Windows, where symlinks require Administrator or Developer Mode — so it is the right fleet-wide
// default. Never overwrites either file: an authored constitution is the project's, not the kit's.
function scaffoldRootContract(projectRoot, kitRoot, vendors) {
  const out = { agents: false, claude: false };
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) { out.reason = 'existing AGENTS.md untouched'; return out; }
  const tpl = path.join(kitRoot, 'templates', 'project-AGENTS.md');
  if (!fs.existsSync(tpl)) { out.reason = 'kit has no templates/project-AGENTS.md'; return out; }
  writeText(agentsPath, readText(tpl));
  out.agents = true;
  // Only Claude consumes the `@` import; another vendor's root file is that adapter's business.
  const claudePath = path.join(projectRoot, 'CLAUDE.md');
  if ((vendors || []).includes('claude') && !fs.existsSync(claudePath)) {
    writeText(claudePath, '@AGENTS.md\n');
    out.claude = true;
  }
  return out;
}

export function initProject(projectRoot, opts = {}) {
  const cfgPath = path.join(projectRoot, '.agentkit.json');
  const existing = fs.existsSync(cfgPath);
  if (existing && !opts.cloneRebind) {
    return { ok: false, reason: '.agentkit.json already exists — use --clone-rebind for the clone path' };
  }
  if (opts.cloneRebind) {
    // clone-rebind (decision 10): reset shipped state, triage inherited overlays, re-sync
    const lockPath = path.join(projectRoot, '.agentkit.lock');
    if (fs.existsSync(lockPath)) fs.rmSync(lockPath);
    const cfg = loadConfig(projectRoot) || {};
    const kitEntries = scanKitAgent(opts.kitRoot || KIT_ROOT);
    const selected = selectEntries(kitEntries, cfg);
    const overlay = scanProjectOverlay(projectRoot, selected.map((e) => e.subPath));
    return {
      ok: true, mode: 'clone-rebind',
      triage: overlay.filter((o) => o.subPath.endsWith('SKILL.md') || o.type !== 'skill').map((o) => o.srcRel),
      next: "review the triage list (keep / delete / genericize each inherited overlay), reset CHANGELOG.md + docs/working/, then run 'agentkit sync . --force' (clone content predates the lockfile)",
    };
  }
  // repo-kind axis (wave U3, kind-aware init): resolve BEFORE building cfg so app-only defaults —
  // the live codebase-memory-mcp exe + fallow wiring, and the JS/fallow scaffold steps below — are
  // opt-in for a non-app kind, never assumed. `--kinds` unset (kindsProvided false) leaves `cfg`
  // exactly as before (no `kinds` key written) and every downstream default identical to today —
  // zero change for the app-repo path. Mirrors selectEntries' own `cfg.kinds || ['app']` default.
  const kindsProvided = Array.isArray(opts.kinds) && opts.kinds.length > 0;
  const resolvedKinds = kindsProvided ? opts.kinds : ['app'];
  const isApp = resolvedKinds.includes('app');
  const cfg = {
    vendors: opts.vendors || ['claude'],
    stack: opts.stack || [],
    ...(kindsProvided ? { kinds: resolvedKinds } : {}),
    tools: opts.tools || (isApp ? ['codebase-mcp', 'fallow'] : []),
    overlay: { rules: ['domain-*', 'project-*'], skills: ['domain-*', 'project-*'], workflows: [] },
    pins: {},
  };
  writeJson(cfgPath, cfg);
  const gate = isApp ? scaffoldGateScripts(projectRoot) : { scaffolded: false, reason: 'kinds excludes app — JS gate scaffold skipped' };
  const fallowrc = isApp ? scaffoldFallowrc(projectRoot, cfg.tools) : { written: false, reason: 'kinds excludes app — fallow scaffold skipped' };
  // Kind-neutral: EVERY greenfield repo needs a root contract, not just a non-app one. Must run before
  // the first sync so K3 finds the markers and fills the workflow map in the same pass.
  const rootContract = scaffoldRootContract(projectRoot, opts.kitRoot || KIT_ROOT, cfg.vendors);
  const sync = opts.noSync ? null : syncProject(projectRoot, { kitRoot: opts.kitRoot || KIT_ROOT });
  return { ok: true, mode: 'greenfield', cfg, gate, fallowrc, rootContract, sync };
}

// ---------- orchestrator lock (A4) ----------
// Prompt-free replacement for the shell `test -f .orchestrator.lock || echo "$id/$pid" > …` idiom.
// Routed through the already-allowlisted `node "<kit>"`, so acquiring/releasing the wave lock never
// prompts, and the write-if-absent is atomic (openSync 'wx') instead of a racy test-then-write —
// and cross-platform (the shell form is bash-only; broke on Windows/PowerShell).
export function orchestratorLock(projectRoot, action, opts = {}) {
  const lockPath = path.join(projectRoot, '.orchestrator.lock');
  if (action === 'acquire') {
    const holder = `${opts.id || 'orchestrator'}/${opts.pid ?? process.pid} @ ${new Date().toISOString()}`;
    try {
      const fd = fs.openSync(lockPath, 'wx'); // atomic write-if-absent — fails if the file exists
      fs.writeSync(fd, holder + '\n');
      fs.closeSync(fd);
      return { ok: true, action, holder };
    } catch (e) {
      if (e.code === 'EEXIST') {
        // Fail closed (pattern-external-mutation §4): a held lock refuses, it never steals.
        const held = fs.existsSync(lockPath) ? readText(lockPath).trim() : '(unreadable)';
        return { ok: false, action, reason: 'held', held };
      }
      throw e;
    }
  }
  if (action === 'release') {
    if (fs.existsSync(lockPath)) { fs.rmSync(lockPath); return { ok: true, action, released: true }; }
    return { ok: true, action, released: false }; // idempotent — releasing an absent lock is a no-op
  }
  if (action === 'status') {
    const held = fs.existsSync(lockPath);
    return { ok: true, action, held, holder: held ? readText(lockPath).trim() : null };
  }
  return { ok: false, action, reason: `unknown lock action: ${action}` };
}

// ---------- surface overlap (A5) ----------
// Prompt-free replacement for the `comm -12 <(git diff --name-only main…A | sort) <(… B | sort)`
// process-substitution disjointness check that orchestrate-partition runs every wave. One
// `node "<kit>"` call reports each branch's real surface and the pairwise overlaps.
export function surfaceOverlap(projectRoot, base, branches) {
  const surfaces = {};
  for (const b of branches) {
    const out = execFileSync('git', ['diff', '--name-only', `${base}...${b}`], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    surfaces[b] = [...new Set(out.split('\n').map((s) => s.trim()).filter(Boolean))].sort();
  }
  const overlaps = [];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i], c = branches[j];
      const setC = new Set(surfaces[c]);
      const shared = surfaces[a].filter((f) => setC.has(f));
      overlaps.push({ a, b: c, shared, disjoint: shared.length === 0 });
    }
  }
  return { base, branches, surfaces, overlaps, disjoint: overlaps.every((o) => o.disjoint) };
}

// ---------- CLI ----------

function parseArgs(argv) {
  const flags = {}; const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (['vendors', 'stack', 'tools', 'clone-of', 'kinds'].includes(key)) flags[key] = (argv[++i] || '').split(',').filter(Boolean);
      else if (key === 'project') flags.project = argv[++i] || '';
      else if (key === 'version' || key === 'date' || key === 'id' || key === 'base' || key === 'fail-on'
        || key === 'lane' || key === 'command' || key === 'status' || key === 'exit-code' || key === 'notes'
        || key === 'out' || key === 'check') flags[key] = argv[++i] || '';
      else if (key === 'kb') { flags.kb = argv.slice(i + 1); i = argv.length; }
      else if (key === 'waive') {
        const pathVal = argv[++i] || '';
        const reasonVal = argv[++i] || '';
        flags.waive = { path: pathVal, reason: reasonVal };
      }
      else flags[key] = true;
    } else pos.push(a);
  }
  return { flags, pos };
}

export function printCheck(c, json) {
  if (json) { console.log(JSON.stringify(c, null, 2)); return; }
  console.log(`agentkit check — ${c.project}`);
  let nudge = '';
  if (c.kitMovedAhead) {
    nudge = '  << kit moved ahead — run sync';
    // TICKET-18: syncing over another session's uncommitted work is a guaranteed collision — warn.
    if (c.dirtyManaged?.length) nudge += ' — CAUTION: tree has uncommitted work on managed paths — commit first; defer sync while another session may be mid-flight';
  }
  console.log(`  kit ${c.kitVersion} | lock ${c.lockKitVersion ?? '(never synced)'}${nudge}`);
  if (!c.results.length) console.log('  all tracked files in sync');
  for (const r of c.results) console.log(`  [${r.verdict}] ${r.rel}`);
  // gitDirty is informational only (Decision D) — never affects `clean` or the process exit code.
  for (const g of c.gitDirty || []) console.log(`  [git-dirty] ${g} — uncommitted git changes (informational; does not affect clean)`);
  for (const v of c.validations) console.log(`  [lint:${v.level}] ${v.msg}`);
  for (const n of c.nags) console.log(`  [flowback] ${n}`);
  if (c.content) {
    if (c.content.clean) console.log('  content: all cited paths/scripts/asset-names/tokens resolve');
    for (const f of c.content.findings) console.log(`  [${f.severity === 'warn' ? 'warn' : 'phantom'}:${f.kind}] ${f.file}${f.line ? ':' + f.line : ''} → ${f.token}`);
  } else {
    console.log('  run `agentkit check --content` for citation integrity');
  }
}

function printGeneralUsage() {
  console.log('usage: agentkit <init|sync|check|verify|receipt|changelog-roll|adopt|lock|surfaces|inventory|doctor|--version> [project-path] [flags]');
  console.log('  init      [--vendors a,b] [--stack x,y] [--kinds k,l] [--tools t] [--clone-rebind] [--no-sync]');
  console.log('  sync      [--dry-run] [--force] [--json] [--allow-branch]');
  console.log('  check     [--quick] [--all] [--json] [--kb <paths…>] [--content] [--taxonomy] [--waive <path> <reason>] [--hygiene] [--count-only] [--allow-branch]');
  console.log('  verify    [--json] [--warn-only] [--fail-on <severity>]   (runs invariant checks harvested from active rules)');
  console.log('  receipt   [--lane <lane>] [--command <command>] [--status <status>] [--exit-code <n>] [--out <file>] | [--check <file>]');
  console.log('  adopt     <project> <file-rel> [--defer] [--force]');
  console.log('  lock      <acquire|release|status> [project-path] [--id <label>]   (prompt-free wave lock)');
  console.log('  surfaces  --base <ref> <branchA> <branchB> [...]   (branch surface-disjointness)');
  console.log('  inventory');
  console.log('  doctor    [project-path] [--quick] [--json] [--project <name>] [--all]');
}

export function main(argv = process.argv.slice(2)) {
  const [verb, ...rest] = argv;
  if (verb === '--version' || verb === '-v' || verb === 'version') { console.log(kitVersion(KIT_ROOT)); return 0; }
  if (verb === '--help' || verb === '-h' || verb === 'help') { printGeneralUsage(); return 0; }
  const { flags, pos } = parseArgs(rest);
  const projectRoot = path.resolve(pos[0] || '.');
  const showHelp = !!(flags.help || flags.h || pos.includes('-h') || pos.includes('--help'));
  try {
    switch (verb) {
      case 'init': {
        if (showHelp) {
          console.log('usage: agentkit init [project-path] [--vendors a,b] [--stack x,y] [--kinds k,l] [--tools t] [--clone-rebind] [--no-sync]');
          return 0;
        }
        const r = initProject(projectRoot, { vendors: flags.vendors, stack: flags.stack, kinds: flags.kinds, tools: flags.tools, cloneRebind: flags['clone-rebind'], noSync: flags['no-sync'] });
        console.log(JSON.stringify(r, null, 2));
        return r.ok ? 0 : 1;
      }
      case 'sync': {
        if (showHelp) {
          console.log('usage: agentkit sync [project-path] [--dry-run] [--force] [--json] [--allow-branch]');
          return 0;
        }
        const r = syncProject(projectRoot, { dryRun: flags['dry-run'], force: flags.force, allowBranch: flags['allow-branch'] });
        if (flags.json) console.log(JSON.stringify(r, null, 2));
        else {
          if (!r.ok) { console.log(`sync REFUSED: ${r.reason}`); (r.dirty || []).forEach((d) => console.log('  ' + d)); (r.errors || []).forEach((e) => console.log('  ' + e.msg)); (r.reparse || []).forEach((x) => console.log(`  [junction] ${x.dir} -> ${x.target ?? '(unreadable target)'}`)); return 1; }
          if (r.dryRun) {
            console.log(`sync --dry-run: ${r.wouldWrite.length} writes, ${r.wouldPrune.length} prunes, ${r.refusals.length} refusals`);
            r.wouldWrite.forEach((w) => console.log('  write  ' + w));
            r.wouldPrune.forEach((p) => console.log('  prune  ' + p));
          } else {
            console.log(`sync: wrote ${r.written.length}, pruned ${r.pruned.length}, settings ${r.settingsWritten.length}`);
          }
          r.refusals.forEach((x) => console.log(`  REFUSED ${x.rel} — ${x.why}${x.base ? ` (3-way base: ${x.base})` : ''}`));
          r.validations.filter((v) => v.level !== 'info').forEach((v) => console.log(`  [lint:${v.level}] ${v.msg}`));
          (r.survivingByAbsence || []).forEach((f) => console.log(`  [overlay-unclaimed] ${f} — surviving only by absence-from-core; add it to .agentkit.json overlay.* or set 'tier: overlay' so a future kit release can't prune it`));
        }
        return r.ok && !(r.refusals || []).length ? 0 : 1;
      }
      case 'check': {
        if (showHelp) {
          console.log('usage: agentkit check [project-path] [--quick] [--all] [--json] [--kb <paths…>] [--content] [--taxonomy] [--waive <path> <reason>] [--hygiene] [--count-only] [--allow-branch]');
          return 0;
        }
        if (flags.waive) {
          const pathVal = flags.waive.path;
          const reasonVal = flags.waive.reason;
          if (!pathVal || !reasonVal) {
            console.error('Error: --waive requires both a path and a reason. Usage: agentkit check --waive <path> <reason>');
            return 1;
          }
          const p = path.join(projectRoot, '.agentkit.json');
          let configObj = {};
          if (fs.existsSync(p)) {
            try {
              configObj = JSON.parse(fs.readFileSync(p, 'utf8'));
            } catch (e) {
              console.error(`Failed to parse config file: ${e.message}`);
              return 1;
            }
          }
          configObj.taxonomyWaivers = configObj.taxonomyWaivers || [];

          let ownerName = 'user';
          try {
            ownerName = execFileSync('git', ['config', 'user.name'], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() || 'user';
          } catch {
            // fallback
          }

          const existingIdx = configObj.taxonomyWaivers.findIndex(w => (typeof w === 'string' ? w : w.path) === pathVal);
          const newWaiver = { path: pathVal, owner: ownerName, reason: reasonVal };
          if (existingIdx !== -1) {
            configObj.taxonomyWaivers[existingIdx] = newWaiver;
          } else {
            configObj.taxonomyWaivers.push(newWaiver);
          }

          fs.writeFileSync(p, JSON.stringify(configObj, null, 2) + '\n', 'utf8');
          console.log(`Recorded taxonomy waiver for "${pathVal}" (owner: ${ownerName}, reason: "${reasonVal}") in .agentkit.json`);
          return 0;
        }
        if (flags.kb) {
          const m = kbMatch(projectRoot, flags.kb);
          if (flags.json) console.log(JSON.stringify(m, null, 2));
          else m.forEach((x) => console.log(`${x.doc}  (matched ${x.matched})`));
          return 0;
        }
        if (flags.content) {
          const ci = checkContentIntegrity(projectRoot);
          if (flags.json) console.log(JSON.stringify(ci, null, 2));
          else {
            console.log(`agentkit check --content — ${ci.project}`);
            if (ci.clean) console.log('  all cited paths/scripts/asset-names/tokens resolve');
            for (const f of ci.findings) console.log(`  [${f.severity === 'warn' ? 'warn' : 'phantom'}:${f.kind}] ${f.file}${f.line ? ':' + f.line : ''} → ${f.token}`);
          }
          // warn-severity findings (token drift) are advisory — they never fail CI (TICKET-17)
          return ci.findings.some((f) => f.severity !== 'warn') ? 1 : 0;
        }
        if (flags.taxonomy) {
          const tl = taxonomyLint(projectRoot);
          const baseline = tl.baseline ?? 0;
          if (flags.json) console.log(JSON.stringify(tl, null, 2));
          else {
            console.log(`agentkit check --taxonomy — ${tl.project}${tl.enforce ? ' (enforced)' : ' (warn-only)'}`);
            if (tl.clean) console.log('  all docs carry a sanctioned type prefix; no dialect/space/decision-status issues');
            for (const f of tl.findings) console.log(`  [${f.kind}] ${f.file} — ${f.detail}`);
            if (tl.findings.length > baseline) console.log(`  ${tl.findings.length} > baseline ${baseline} — REGRESSION`);
            else console.log(`  ${tl.findings.length} findings (baseline ${baseline} — no regression)`);
            if (tl.findings.length < baseline) console.log(`  findings dropped below baseline — ratchet taxonomyBaseline down to ${tl.findings.length}`);
          }
          // ratchet: gates on REGRESSION (findings > baseline), not mere non-zero findings — the
          // baseline only ever decreases (docs-standard §h).
          return tl.enforce && tl.findings.length > baseline ? 1 : 0;
        }
        if (flags.hygiene) {
          const h = checkHygiene(projectRoot);
          if (flags.json) console.log(JSON.stringify(h, null, 2));
          else {
            console.log(`agentkit check --hygiene — ${h.project}`);
            if (h.clean && !h.errors.length) console.log('  all hygiene checks pass');
            for (const f of h.findings) console.log(`  [${f.severity}:${f.kind}] ${f.file ? f.file + ' — ' : ''}${f.detail}`);
            for (const e of h.errors) console.log(`  [${e.severity}:${e.kind}] ${e.file ? e.file + ' — ' : ''}${e.detail}`);
            // The generated human-gate view (C6) — never hand-consolidated, never omitted.
            if (h.humanGates.length) {
              console.log(`  human gates (${h.humanGates.length}) — generated from the filesystem, not from any index:`);
              for (const g of h.humanGates) console.log(`    [needs-human-verify] ${g.file}`);
            }
          }
          return h.clean ? 0 : 1;
        }
        const c = checkProject(projectRoot, { quick: flags.quick, all: flags.all, allowBranch: flags['allow-branch'] });
        if (flags.all) c.content = checkContentIntegrity(projectRoot); // TICKET-17: --all includes the content-integrity pass
        printCheck(c, flags.json);
        const contentFail = c.content ? c.content.findings.some((f) => f.severity !== 'warn') : false;
        return c.clean && !contentFail ? 0 : 1;
      }
      case 'verify': {
        if (showHelp) {
          console.log('usage: agentkit verify [project-path] [--json] [--warn-only] [--fail-on <severity>]');
          return 0;
        }
        // additive gate controls (default stays critical-only, unchanged below): --warn-only always
        // exits 0; --fail-on <severity> fails on that severity or worse. Validate before running so a
        // typo'd severity errors fast instead of burning a verify pass first.
        if (typeof flags['fail-on'] === 'string' && !(flags['fail-on'] in SEVERITY_ORDER)) {
          console.error(`agentkit verify: invalid --fail-on value '${flags['fail-on']}' — valid values: ${Object.keys(SEVERITY_ORDER).join(', ')}`);
          return 1;
        }
        const r = runVerify(projectRoot, {});
        if (flags.json) console.log(JSON.stringify(r, null, 2));
        else {
          console.log(`agentkit verify — ${r.project}`);
          console.log(`  ${r.checkCount} check(s) harvested from ${r.ruleCount} active rule(s); scanned: ${r.sourceRoots.join(', ')}`);
          for (const e of r.harvestErrors) console.log(`  [harvest-error] ${e.rule} — ${e.why}`);
          if (r.clean) console.log('  no invariant violations');
          for (const f of r.findings) console.log(`  [${f.severity}] ${f.file}:${f.line} — ${f.id} (${f.rule.replace('.agent/rules/', '')}) — ${f.message}`);
          if (!r.clean) console.log(`  ${JSON.stringify(r.counts)}`);
        }
        if (flags['warn-only']) return 0;
        if (typeof flags['fail-on'] === 'string') {
          const threshold = SEVERITY_ORDER[flags['fail-on']];
          return r.findings.some((f) => SEVERITY_ORDER[f.severity] <= threshold) ? 1 : 0;
        }
        return (r.counts.critical || 0) > 0 ? 1 : 0; // fail CI only on Critical; lesser findings are advisory (report-only)
      }
      case 'receipt': {
        if (showHelp) {
          console.log('usage: agentkit receipt [project-path] --lane <lane> --command <command> [--status <status>] [--exit-code <n>] [--out <file>] | [--check <file>]');
          return 0;
        }
        if (typeof flags.check === 'string' && flags.check) {
          const receiptPath = path.resolve(projectRoot, flags.check);
          if (!fs.existsSync(receiptPath)) { console.error(`agentkit receipt: file not found: ${receiptPath}`); return 1; }
          let receipt;
          try { receipt = JSON.parse(readText(receiptPath)); } catch (err) { console.error(`agentkit receipt: invalid JSON: ${err.message}`); return 1; }
          const result = checkVerificationReceipt(projectRoot, receipt, { receiptPath });
          if (flags.json) console.log(JSON.stringify(result, null, 2));
          else console.log(`agentkit receipt — ${result.reusable ? 'REUSABLE' : 'STALE/NOT-REUSABLE'} — ${result.reason}`);
          return result.reusable ? 0 : 1;
        }
        try {
          const receipt = createVerificationReceipt(projectRoot, {
            lane: flags.lane, command: flags.command, status: flags.status,
            exitCode: flags['exit-code'] === '' ? 0 : Number(flags['exit-code']),
            notes: flags.notes, outPath: flags.out,
          });
          if (flags.out) writeJson(path.resolve(projectRoot, flags.out), receipt);
          if (flags.json || !flags.out) console.log(JSON.stringify(receipt, null, 2));
          else console.log(`agentkit receipt: wrote ${path.resolve(projectRoot, flags.out)}`);
          return 0;
        } catch (err) {
          console.error(`agentkit receipt: ${err.message}`);
          return 1;
        }
      }
      case 'changelog-roll': {
        if (showHelp) {
          console.log('usage: agentkit changelog-roll [project-path] [--version v] [--date d] [--dry-run]');
          return 0;
        }
        const r = changelogRoll(projectRoot, { version: flags.version, date: flags.date, dryRun: flags['dry-run'] });
        if (flags.json) console.log(JSON.stringify(r, null, 2));
        else console.log(r.rolled ? `changelog-roll: assembled ${r.rolled} fragment(s)${r.dryRun ? ' (dry-run)' : ''} → CHANGELOG.md${r.dryRun ? '' : ' (fragments removed)'}` : `changelog-roll: ${r.note}`);
        return 0;
      }
      case 'adopt': {
        if (showHelp) {
          console.log('usage: agentkit adopt [project] <file-rel> [--defer] [--force]');
          return 0;
        }
        // two positionals = <project> <file>; one positional = <file> with cwd as the project
        const proj = pos[1] ? path.resolve(pos[0]) : path.resolve('.');
        const file = pos[1] || pos[0];
        if (!file) { console.log('usage: agentkit adopt [project] <file-rel> [--defer] [--force]'); return 1; }
        const r = adoptFile(proj, file, { defer: flags.defer, force: flags.force });
        console.log(JSON.stringify(r, null, 2));
        return r.ok ? 0 : 1;
      }
      case 'lock': {
        if (showHelp) {
          console.log('usage: agentkit lock <acquire|release|status> [project-path] [--id <label>] [--json]');
          return 0;
        }
        const action = pos[0];
        const proj = pos[1] ? path.resolve(pos[1]) : path.resolve('.');
        if (!['acquire', 'release', 'status'].includes(action)) {
          console.log('usage: agentkit lock <acquire|release|status> [project-path] [--id <label>] [--json]');
          return 1;
        }
        const r = orchestratorLock(proj, action, { id: typeof flags.id === 'string' ? flags.id : undefined });
        if (flags.json) console.log(JSON.stringify(r, null, 2));
        else if (action === 'acquire') console.log(r.ok ? `lock acquired: ${r.holder}` : `lock REFUSED — held by ${r.held}`);
        else if (action === 'release') console.log(r.released ? 'lock released' : 'no lock to release');
        else console.log(r.held ? `lock held: ${r.holder}` : 'no lock');
        return r.ok ? 0 : 1;
      }
      case 'surfaces': {
        if (showHelp) {
          console.log('usage: agentkit surfaces --base <ref> <branchA> <branchB> [...] [--project <path>] [--json]');
          return 0;
        }
        const proj = flags.project ? path.resolve(String(flags.project)) : path.resolve('.');
        const base = typeof flags.base === 'string' && flags.base ? flags.base : 'main';
        const branches = pos;
        if (branches.length < 2) {
          console.log('usage: agentkit surfaces --base <ref> <branchA> <branchB> [...] [--project <path>] [--json]');
          return 1;
        }
        const r = surfaceOverlap(proj, base, branches);
        if (flags.json) console.log(JSON.stringify(r, null, 2));
        else {
          console.log(`agentkit surfaces — base ${r.base}`);
          for (const b of r.branches) console.log(`  ${b}: ${r.surfaces[b].length} file(s)`);
          for (const o of r.overlaps) console.log(`  ${o.a} ∩ ${o.b}: ${o.disjoint ? 'DISJOINT' : `${o.shared.length} shared — ${o.shared.join(', ')}`}`);
          console.log(r.disjoint ? '  all pairs disjoint — safe to parallelize' : '  overlaps present — serialize or re-partition the overlapping pair(s)');
        }
        return 0;
      }
      case 'inventory': {
        if (showHelp) {
          console.log('usage: agentkit inventory');
          return 0;
        }
        const r = runInventory({});
        console.log(`inventory: ${Object.keys(r.assets).length} distinct assets across ${Object.keys(r.projects).length} fleet members -> reports/inventory.{json,md}`);
        return 0;
      }
      case 'doctor': {
        if (showHelp) {
          console.log('usage: agentkit doctor [project-path] [--quick] [--json] [--project <name>] [--all]');
          return 0;
        }
        const r = runDoctor({ quick: flags.quick, only: flags.project, all: !!(flags.all || flags.fleet), projectRoot });
        if (r.error) {
          if (flags.json) console.log(JSON.stringify(r, null, 2));
          else { console.log(`agentkit doctor: ${r.error}`); console.log(`  available: ${r.available.join(', ')}`); }
          return 1;
        }
        if (flags.json) console.log(JSON.stringify(r, null, 2));
        else {
          console.log(`agentkit doctor${r.only ? ` — ${r.only}` : ''}`);
          if (r.note) console.log(`  ${r.note}`);
          for (const [name, m] of Object.entries(r.members)) {
            console.log(`  ${name}: ${m.status}${m.counts ? ' ' + JSON.stringify(m.counts) : ''}`);
            for (const w of m.stackWarnings || []) console.log(`    [stack] ${w}`);
            for (const f of m.unclaimedOverlay || []) console.log(`    [overlay-unclaimed] ${f} — claim it in .agentkit.json overlay.* or set 'tier: overlay'`);
            if (m.phantomCitations) console.log(`    [phantom] ${m.phantomCitations.count} unresolved citation(s); e.g. ${m.phantomCitations.sample[0]}`);
            if (m.taxonomyWarnings) console.log(`    [taxonomy] ${m.taxonomyWarnings.count} warning(s)${m.taxonomyWarnings.enforce ? ' (ENFORCED)' : ''}; e.g. ${m.taxonomyWarnings.sample[0]}`);
          }
          if (r.conflictCopies.length) console.log(`  cloud-synced conflict copies: ${r.conflictCopies.length}`), r.conflictCopies.forEach((c) => console.log('    ' + c));
          for (const rp of r.reparsePoints) console.log(`  [junction] ${rp.member}: ${rp.path} — remove the link before syncing (rmdir)`);
          for (const g of r.governedDocs) console.log(`  [stale-doc] ${g.doc} last-verified ${g.lastVerified} (${g.ageDays}d)${g.docUrls ? ' — re-verify: ' + g.docUrls : ''}`);
          for (const [t, s] of Object.entries(r.tools)) console.log(`  [tool] ${t}: ${s.ok === true ? 'callable' : s.ok === false ? 'UNREACHABLE — ' + s.why : s.why}`);
          if (r.flowbackQueue.length) console.log(`  flowback queue: ${r.flowbackQueue.length} deferred item(s)`);
        }
        return 0;
      }
      default:
        printGeneralUsage();
        return verb ? 1 : 0;
    }
  } catch (e) {
    console.error(`agentkit ${verb}: ${e.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exit(main());
}
