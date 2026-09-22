#!/usr/bin/env node

// Deterministic, dependency-free worktree cleanup planner/executor for implement-session-land.
// `plan` inventories every worktree and sorts it into exactly one bucket (eligible, retained,
// blocked) without mutating anything. `apply` re-assesses each eligible entry against live Git
// state, removes only entries that are unchanged, and verifies the postcondition. Rerunning `apply`
// over the same plan is a no-op once its removals are done.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const SCHEMA_VERSION = 1;
export const DEFAULT_DISPOSABLE_IGNORED = Object.freeze([
  'node_modules', '.next', '.turbo', '.cache', 'coverage', 'dist', 'build',
  '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache', '.venv',
]);
const ACTIVITY = new Set(['active', 'inactive']);

export class CleanupError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CleanupError';
    this.code = code;
  }
}

function git(cwd, args, input) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', input, maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  if (r.error) throw new CleanupError('git-unavailable', r.error.message);
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function gitOk(cwd, args, input) {
  const r = git(cwd, args, input);
  if (r.status !== 0) throw new CleanupError('git-failed', `git ${args.join(' ')}: ${r.stderr.trim() || `exit ${r.status}`}`);
  return r.stdout;
}

function digest(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

// Git reports paths with forward slashes and, on Windows, may differ in drive/segment case.
export function pathKey(p) {
  const resolved = path.resolve(p).replace(/[\\/]+$/, '');
  return process.platform === 'win32' ? resolved.replace(/\\/g, '/').toLowerCase() : resolved;
}

function commonDir(repo) {
  return path.resolve(gitOk(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir']).trim());
}

export function listWorktrees(repo) {
  const out = gitOk(repo, ['worktree', 'list', '--porcelain', '-z']);
  const entries = [];
  let cur = null;
  for (const field of out.split('\0')) {
    if (field === '') { if (cur) entries.push(cur); cur = null; continue; }
    const sp = field.indexOf(' ');
    const key = sp === -1 ? field : field.slice(0, sp);
    const val = sp === -1 ? '' : field.slice(sp + 1);
    if (key === 'worktree') { if (cur) entries.push(cur); cur = { path: path.resolve(val), head: null, branch: null, detached: false, bare: false, locked: null, prunable: null }; continue; }
    if (!cur) continue;
    if (key === 'HEAD') cur.head = val;
    else if (key === 'branch') cur.branch = val.replace(/^refs\/heads\//, '');
    else if (key === 'detached') cur.detached = true;
    else if (key === 'bare') cur.bare = true;
    else if (key === 'locked') cur.locked = val || 'locked';
    else if (key === 'prunable') cur.prunable = val || 'prunable';
  }
  if (cur) entries.push(cur);
  return entries;
}

// Map each linked worktree path to its admin directory (<common>/worktrees/<id>).
function adminDirs(common) {
  const map = new Map();
  const root = path.join(common, 'worktrees');
  if (!fs.existsSync(root)) return map;
  for (const id of fs.readdirSync(root)) {
    const gitdirFile = path.join(root, id, 'gitdir');
    if (!fs.existsSync(gitdirFile)) continue;
    const pointer = fs.readFileSync(gitdirFile, 'utf8').trim();
    map.set(pathKey(path.dirname(pointer)), path.join(root, id));
  }
  return map;
}

// A registry file is re-read at apply time so an owner that became active is honored.
export function loadRegistry(source) {
  if (!source) return { file: null, entries: [] };
  const data = typeof source === 'string' ? JSON.parse(fs.readFileSync(source, 'utf8')) : source;
  const entries = Array.isArray(data) ? data : data.entries;
  if (!Array.isArray(entries)) throw new CleanupError('invalid-registry', 'registry must be an array or { entries: [] }');
  return { file: typeof source === 'string' ? path.resolve(source) : (data.file ?? null), entries };
}

function lookupOwner(registry, wt) {
  const byPath = registry.entries.find(e => e.path && pathKey(e.path) === pathKey(wt.path));
  const hit = byPath ?? (wt.branch ? registry.entries.find(e => !e.path && e.branch === wt.branch) : null);
  if (!hit) return { owner: 'unknown', activity: 'unknown', matched_by: null };
  const activity = ACTIVITY.has(hit.activity) ? hit.activity : 'unknown';
  return { owner: hit.owner ? String(hit.owner) : 'unknown', activity, matched_by: byPath ? 'path' : 'branch' };
}

function parseStatus(raw) {
  const fields = raw.split('\0');
  const rows = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (f.length < 4) continue;
    const x = f[0], y = f[1], p = f.slice(3);
    const row = { x, y, path: p, orig: null };
    if (x === 'R' || x === 'C') row.orig = fields[++i];
    rows.push(row);
  }
  return rows;
}

function isDisposable(p, disposable) {
  return p.replace(/\/$/, '').split('/').some(seg => disposable.includes(seg));
}

function inspectContent(ctx, wt) {
  const exists = fs.existsSync(wt.path);
  if (!exists) return { directory: 'missing', raw: '', rows: [], dirty: { tracked: 0, staged: 0, untracked: 0, ignored_useful: 0, ignored_disposable: 0 } };
  const gitArgs = ctx.gitArgsFor(wt);
  const r = git(wt.path, [...gitArgs, 'status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching']);
  if (r.status !== 0) return { directory: 'present', error: r.stderr.trim() || `exit ${r.status}` };
  const rows = parseStatus(r.stdout);
  const dirty = { tracked: 0, staged: 0, untracked: 0, ignored_useful: 0, ignored_disposable: 0 };
  for (const row of rows) {
    if (row.x === '?' && row.y === '?') dirty.untracked++;
    else if (row.x === '!' && row.y === '!') {
      if (isDisposable(row.path, ctx.disposable)) dirty.ignored_disposable++;
      else dirty.ignored_useful++;
    } else {
      if (row.x !== ' ') dirty.staged++;
      if (row.y !== ' ') dirty.tracked++;
    }
  }
  return { directory: 'present', raw: r.stdout, rows, dirty };
}

function treeBlobs(repo, sha) {
  const blobs = new Map();
  for (const line of gitOk(repo, ['ls-tree', '-r', '-z', '--full-tree', sha]).split('\0')) {
    const tab = line.indexOf('\t');
    if (tab === -1) continue;
    const [, type, oid] = line.slice(0, tab).split(' ');
    blobs.set(line.slice(tab + 1), type === 'blob' ? oid : `${type}:${oid}`);
  }
  return blobs;
}

// Every dirty (non-ignored) path must hold in the working tree exactly the blob the ref holds (or
// be absent where the ref lacks it). Its index entry must match the ref or the already-preserved
// HEAD. Then removal loses no content.
function proveContent(ctx, wt, rows, ref) {
  const gitArgs = ctx.gitArgsFor(wt);
  const refBlobs = treeBlobs(ctx.repo, ref.sha);
  const headBlobs = treeBlobs(ctx.repo, wt.head);
  const indexBlobs = new Map();
  for (const line of gitOk(wt.path, [...gitArgs, 'ls-files', '-s', '-z']).split('\0')) {
    const tab = line.indexOf('\t');
    if (tab === -1) continue;
    indexBlobs.set(line.slice(tab + 1), line.slice(0, tab).split(' ')[1]);
  }
  const paths = new Set();
  for (const row of rows) {
    if (row.x === '!' && row.y === '!') continue;
    paths.add(row.path);
    if (row.orig) paths.add(row.orig);
  }
  const present = [...paths].filter(p => fs.existsSync(path.join(wt.path, p)) && fs.statSync(path.join(wt.path, p)).isFile());
  const hashes = present.length
    ? gitOk(wt.path, [...gitArgs, 'hash-object', '--stdin-paths'], present.join('\n') + '\n').trim().split(/\r?\n/)
    : [];
  const wtBlobs = new Map(present.map((p, i) => [p, hashes[i]]));
  const mismatched = [];
  for (const p of paths) {
    const want = refBlobs.get(p) ?? null;
    const untracked = rows.some(r => r.path === p && r.x === '?');
    const inIndex = untracked ? want : (indexBlobs.get(p) ?? null);
    const indexPreserved = inIndex === want || inIndex === (headBlobs.get(p) ?? null);
    if ((wtBlobs.get(p) ?? null) !== want || !indexPreserved) mismatched.push(p);
  }
  return { ref: ref.name, sha: ref.sha, paths: paths.size, mismatched };
}

function resolveRef(repo, name) {
  const r = git(repo, ['rev-parse', '--verify', '--quiet', `${name}^{commit}`]);
  if (r.status !== 0) throw new CleanupError('unresolved-ref', `cannot resolve ref: ${name}`);
  const full = git(repo, ['rev-parse', '--symbolic-full-name', name]).stdout.trim() || null;
  return { name, full, sha: r.stdout.trim() };
}

function context(opts) {
  const repo = path.resolve(opts.repo ?? process.cwd());
  const common = commonDir(repo);
  const admin = adminDirs(common);
  const current = git(repo, ['rev-parse', '--show-toplevel']);
  const disposable = [...(opts.defaultDisposable === false ? [] : DEFAULT_DISPOSABLE_IGNORED), ...(opts.disposableIgnored ?? [])];
  return {
    repo, common, admin, disposable,
    currentKey: current.status === 0 ? pathKey(current.stdout.trim()) : null,
    gitArgsFor(wt) {
      const dir = admin.get(pathKey(wt.path)) ?? common;
      return [`--git-dir=${dir}`, `--work-tree=${wt.path}`];
    },
  };
}

function assess(ctx, wt, index, refs, registry, authorized) {
  const who = lookupOwner(registry, wt);
  const res = {
    path: wt.path,
    branch: wt.branch,
    head: wt.head,
    owner: who.owner,
    activity: who.activity,
    dirty: null,
    preservation_ref: null,
    ancestry: [],
    content_proof: null,
    action: null,
    reason: null,
    fingerprint: null,
  };
  const content = index === 0 ? null : inspectContent(ctx, wt);
  if (content && !content.error) res.dirty = content.dirty;
  res.fingerprint = digest([wt.head, wt.branch, wt.prunable ? 'prunable' : 'valid', content?.directory ?? 'primary', content?.raw ?? '']);

  const done = (bucket, reason) => { res.reason = reason; return { bucket, res }; };
  if (index === 0) return done('retained', 'primary-worktree');
  if (wt.bare) return done('retained', 'bare-repository');
  if (ctx.currentKey && pathKey(wt.path) === ctx.currentKey) return done('retained', 'current-worktree');
  if (wt.locked) return done('retained', `locked: ${wt.locked}`);
  if (who.activity === 'unknown') return done('blocked', who.owner === 'unknown' ? 'owner-unknown: no registry entry' : 'owner-activity-unknown');
  if (who.activity === 'active') return done('retained', 'owner-active');
  if (!authorized.includes(who.owner)) return done('retained', 'owner-not-authorized');
  if (!wt.head) return done('blocked', 'head-unresolved');

  for (const ref of refs) {
    if (wt.branch && ref.full === `refs/heads/${wt.branch}`) { res.ancestry.push({ ref: ref.name, sha: ref.sha, result: 'skipped-own-branch' }); continue; }
    const r = git(ctx.repo, ['merge-base', '--is-ancestor', wt.head, ref.sha]);
    const result = r.status === 0 ? 'ancestor' : r.status === 1 ? 'not-ancestor' : 'error';
    res.ancestry.push({ ref: ref.name, sha: ref.sha, result });
    if (result === 'ancestor') { res.preservation_ref = ref.name; break; }
  }
  if (!res.preservation_ref) return done('blocked', 'head-not-preserved: HEAD is not an ancestor of any retained ref');

  if (content.error) return done('blocked', `content-uninspectable: ${content.error}`);
  const missingDir = content.directory === 'missing';
  res.action = missingDir ? 'prune-record' : wt.prunable ? 'repair-remove' : 'remove';
  if (content.dirty.ignored_useful > 0) return done('blocked', 'useful-ignored-content: preserve or discard it explicitly, then re-plan');
  const d = content.dirty;
  if (d.tracked + d.staged + d.untracked > 0) {
    for (const ref of refs) {
      const proof = proveContent(ctx, wt, content.rows, ref);
      if (proof.mismatched.length === 0) { res.content_proof = proof; break; }
      if (ref === refs[0]) res.content_proof = proof;
    }
    if (!res.content_proof || res.content_proof.mismatched.length) {
      return done('blocked', 'dirty-unproven: uncommitted content is not present in a retained ref');
    }
    return done('eligible', `head-preserved and dirty content present in ${res.content_proof.ref}`);
  }
  return done('eligible', missingDir ? 'head-preserved; directory already gone (stale admin record)' : 'head-preserved and clean');
}

export function buildPlan(opts = {}) {
  if (!opts.target) throw new CleanupError('missing-target', 'plan requires --target <ref>');
  const ctx = context(opts);
  const refs = [resolveRef(ctx.repo, opts.target), ...(opts.retained ?? []).map(r => resolveRef(ctx.repo, r))];
  const registry = loadRegistry(opts.registry);
  const authorized = (opts.authorizedOwners ?? []).map(String);
  const plan = {
    schema: SCHEMA_VERSION,
    kind: 'worktree-cleanup-plan',
    repo: ctx.common,
    target: { ref: refs[0].name, sha: refs[0].sha },
    retained_refs: refs.slice(1).map(r => ({ ref: r.name, sha: r.sha })),
    registry,
    authorized_owners: authorized,
    disposable_ignored: ctx.disposable,
    eligible: [], retained: [], blocked: [],
  };
  listWorktrees(ctx.repo).forEach((wt, i) => {
    const { bucket, res } = assess(ctx, wt, i, refs, registry, authorized);
    plan[bucket].push(res);
  });
  plan.plan_id = digest({ ...plan, plan_id: undefined });
  return plan;
}

export function pruneDryRun(repo) {
  const r = git(repo, ['worktree', 'prune', '--dry-run', '--verbose']);
  const output = (r.stdout + r.stderr).trim();
  return { clean: r.status === 0 && output === '', output, exit: r.status };
}

function listedKeys(repo) {
  return new Map(listWorktrees(repo).map((w, i) => [pathKey(w.path), { ...w, index: i }]));
}

function removeOne(ctx, item, live) {
  const gitArgs = item.content_proof ? ['worktree', 'remove', '--force', live.path] : ['worktree', 'remove', live.path];
  if (item.action === 'prune-record') {
    const adminDir = ctx.admin.get(pathKey(item.path));
    if (!adminDir) return { outcome: 'failed', detail: 'admin record not found' };
    const pointer = fs.readFileSync(path.join(adminDir, 'gitdir'), 'utf8').trim();
    if (pathKey(path.dirname(pointer)) !== pathKey(item.path) || fs.existsSync(item.path)) {
      return { outcome: 'skipped-changed', detail: 'admin record no longer matches a missing directory' };
    }
    fs.rmSync(adminDir, { recursive: true, force: false });
    return { outcome: 'mutated', detail: `removed admin record ${adminDir}` };
  }
  if (item.action === 'repair-remove') {
    git(ctx.repo, ['worktree', 'repair', live.path]); // exit status is unreliable; re-list instead
    const after = listedKeys(ctx.repo).get(pathKey(item.path));
    if (!after || after.prunable) return { outcome: 'failed', detail: 'git worktree repair did not restore the .git pointer' };
  }
  const r = git(ctx.repo, gitArgs);
  if (r.status !== 0) return { outcome: 'failed', detail: r.stderr.trim() || `exit ${r.status}` };
  return { outcome: 'mutated', detail: gitArgs.slice(0, -1).join(' ') };
}

export function applyPlan(plan, opts = {}) {
  if (plan?.kind !== 'worktree-cleanup-plan' || plan.schema !== SCHEMA_VERSION) throw new CleanupError('invalid-plan', 'not a worktree-cleanup plan of this schema');
  const ctx = context({ ...opts, disposableIgnored: plan.disposable_ignored, defaultDisposable: false });
  if (pathKey(ctx.common) !== pathKey(plan.repo)) throw new CleanupError('wrong-repository', `plan belongs to ${plan.repo}`);
  const refs = [resolveRef(ctx.repo, plan.target.ref), ...plan.retained_refs.map(r => resolveRef(ctx.repo, r.ref))];
  const registry = loadRegistry(opts.registry ?? plan.registry?.file ?? plan.registry);
  const outcomes = [];
  let mutations = 0;

  for (const item of plan.eligible) {
    const live = listedKeys(ctx.repo).get(pathKey(item.path));
    if (!live) {
      outcomes.push({ path: item.path, action: item.action, outcome: fs.existsSync(item.path) ? 'removal-incomplete' : 'already-removed', detail: 'not listed by git worktree list' });
      continue;
    }
    ctx.admin = adminDirs(ctx.common);
    const again = assess(ctx, live, live.index, refs, registry, plan.authorized_owners);
    if (again.bucket !== 'eligible' || again.res.fingerprint !== item.fingerprint) {
      outcomes.push({ path: item.path, action: item.action, outcome: 'skipped-changed', detail: `now ${again.bucket}: ${again.res.reason}` });
      continue;
    }
    const step = removeOne(ctx, again.res, live);
    if (step.outcome === 'mutated') mutations++;
    // Re-read Git state and the filesystem after every removal.
    const stillListed = listedKeys(ctx.repo).has(pathKey(item.path));
    const dirGone = !fs.existsSync(item.path);
    let outcome = step.outcome;
    if (step.outcome === 'mutated') outcome = !stillListed && dirGone ? 'removed' : stillListed ? 'failed' : 'removal-incomplete';
    outcomes.push({ path: item.path, action: item.action, outcome, detail: step.detail });
  }

  const prune = pruneDryRun(ctx.repo);
  const cleaned = outcomes.filter(o => o.outcome === 'removed' || o.outcome === 'already-removed').map(o => o.path);
  const notCleaned = outcomes.filter(o => !['removed', 'already-removed'].includes(o.outcome));
  const retained = [
    ...plan.retained.map(r => ({ path: r.path, owner: r.owner, bucket: 'retained', reason: r.reason })),
    ...plan.blocked.map(r => ({ path: r.path, owner: r.owner, bucket: 'blocked', reason: r.reason })),
    ...notCleaned.map(o => ({ path: o.path, owner: plan.eligible.find(e => e.path === o.path)?.owner ?? 'unknown', bucket: 'eligible', reason: `${o.outcome}: ${o.detail}` })),
  ];
  const removedNow = outcomes.filter(o => o.outcome === 'removed').length;
  const summary = removedNow === 0
    ? `No worktrees were removed in this run (${cleaned.length} already absent). Retained ${retained.length}.`
    : `Removed ${removedNow} worktree(s). Retained ${retained.length}.`;
  return {
    schema: SCHEMA_VERSION,
    kind: 'worktree-cleanup-result',
    plan_id: plan.plan_id,
    repo: plan.repo,
    outcomes,
    mutations,
    cleaned,
    retained,
    prune_dry_run: prune,
    complete: notCleaned.length === 0 && prune.clean,
    summary: `${summary} git worktree prune --dry-run ${prune.clean ? 'reports nothing' : `reports: ${prune.output || `exit ${prune.exit}`}`}.`,
  };
}

function parseArgs(argv) {
  const opts = { retained: [], authorizedOwners: [], disposableIgnored: [] };
  const multi = { '--retain': 'retained', '--authorized-owner': 'authorizedOwners', '--disposable-ignored': 'disposableIgnored' };
  const single = { '--target': 'target', '--registry': 'registry', '--out': 'out', '--plan': 'plan', '--repo': 'repo' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-default-disposable') opts.defaultDisposable = false;
    else if (multi[a]) opts[multi[a]].push(argv[++i]);
    else if (single[a]) opts[single[a]] = argv[++i];
    else throw new CleanupError('bad-argument', `unknown argument: ${a}`);
  }
  return opts;
}

function emit(value, out) {
  const text = JSON.stringify(value, null, 2) + '\n';
  if (out) { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, text); }
  process.stdout.write(text);
}

const USAGE = `usage:
  worktree-cleanup.mjs plan --target <ref> [--retain <ref>]... [--registry <file>]
                            [--authorized-owner <id>]... [--disposable-ignored <name>]...
                            [--no-default-disposable] [--out <plan.json>]
  worktree-cleanup.mjs apply --plan <plan.json> [--registry <file>] [--out <result.json>]
  worktree-cleanup.mjs verify`;

export function main(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  try {
    const opts = parseArgs(rest);
    if (cmd === 'plan') { emit(buildPlan(opts), opts.out); return 0; }
    if (cmd === 'apply') {
      if (!opts.plan) throw new CleanupError('missing-plan', 'apply requires --plan <plan.json>');
      const result = applyPlan(JSON.parse(fs.readFileSync(opts.plan, 'utf8')), opts);
      emit(result, opts.out);
      return result.complete ? 0 : 2;
    }
    if (cmd === 'verify') { const p = pruneDryRun(path.resolve(opts.repo ?? process.cwd())); emit(p); return p.clean ? 0 : 2; }
    process.stderr.write(USAGE + '\n');
    return 64;
  } catch (err) {
    process.stderr.write(`worktree-cleanup: ${err.code ?? 'error'}: ${err.message}\n`);
    return 1;
  }
}

if (process.argv[1] && pathKey(process.argv[1]) === pathKey(fileURLToPath(import.meta.url))) process.exitCode = main();
