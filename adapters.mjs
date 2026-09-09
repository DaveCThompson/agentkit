// adapters.mjs — vendor transforms as CODE, not directories (plan decision: flat repo, adapters in code).
// Each adapter: (entries, ctx) => { files: [{rel, content, source, transform}], settings: [{file, merge, data}], validations: [{level, msg}] }
//   entries: merged project tree (core, shipped from kit) + (overlay, project-owned) — decision 34.
//   ctx: { kitPath, projectRoot, config (.agentkit.json), mcpServers, hooks }
// Shared text utilities live here so agentkit.mjs and tests import one place (no circular deps).

// ---------- text utils ----------

export function normalizeEol(s) {
  return s.replace(/\r\n/g, '\n');
}

// Minimal YAML subset parser for frontmatter: flat keys, inline lists [a, b],
// block lists (- item), and ONE level of nested map (two-space indent).
export function parseFrontmatter(raw) {
  const text = normalizeEol(raw);
  if (!text.startsWith('---\n')) return { fm: null, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { fm: null, body: text };
  const fmText = text.slice(4, end);
  const body = text.slice(text.indexOf('\n', end + 1) + 1);
  const fm = {};
  let curKey = null;
  let curMode = null; // 'list' | 'map'
  for (const line of fmText.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const nested = /^\s{2,}/.test(line);
    if (nested && curKey) {
      const t = line.trim();
      if (t.startsWith('- ')) {
        if (curMode !== 'list') { fm[curKey] = []; curMode = 'list'; }
        fm[curKey].push(parseScalar(t.slice(2)));
      } else {
        const m = t.match(/^([\w."'-]+):\s*(.*)$/);
        if (m) {
          if (curMode !== 'map') { fm[curKey] = {}; curMode = 'map'; }
          fm[curKey][unquote(m[1])] = parseScalar(m[2]);
        }
      }
      continue;
    }
    const m = line.match(/^([\w."'-]+):\s*(.*)$/);
    if (!m) continue;
    curKey = unquote(m[1]);
    const v = m[2].trim();
    if (v === '') { fm[curKey] = null; curMode = null; continue; } // block list/map follows (or empty)
    curMode = null;
    fm[curKey] = parseScalar(v);
  }
  return { fm, body };
}

function unquote(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function parseScalar(v) {
  const t = v.trim();
  if (t.startsWith('[') && t.endsWith(']')) {
    const inner = t.slice(1, -1).trim();
    return inner === '' ? [] : inner.split(',').map((x) => unquote(x));
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  return unquote(t);
}

export function serializeFrontmatter(fm) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.map(String).join(', ')}]`);
    } else if (typeof v === 'object') {
      lines.push(`${k}:`);
      for (const [k2, v2] of Object.entries(v)) lines.push(`  ${k2}: ${v2}`);
    } else {
      lines.push(`${k}: ${String(v)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// GENERATED header (safety invariant). Deterministic — never a timestamp (idempotent sync).
export function headerFor(srcRel, ext) {
  const msg = `AGENTKIT GENERATED from ${srcRel} — edit the source in the agentkit repo, then run 'agentkit sync'. Local edits are detected by 'agentkit check' and can flow back via 'agentkit adopt'.`;
  if (ext === '.md') return `<!-- ${msg} -->`;
  if (ext === '.toml' || ext === '.ps1' || ext === '.sh' || ext === '.yaml' || ext === '.yml') return `# ${msg}`;
  if (ext === '.mjs' || ext === '.js' || ext === '.ts') return `// ${msg}`;
  return null; // json etc: no header (would break parsers); lockfile hash still guards it
}

// Insert header AFTER frontmatter for md (Claude/Codex require frontmatter at byte 0), at top otherwise.
export function injectHeader(content, srcRel, ext) {
  const h = headerFor(srcRel, ext);
  if (!h) return content;
  const text = normalizeEol(content);
  if (ext === '.md' && text.startsWith('---\n')) {
    const end = text.indexOf('\n---', 4);
    if (end !== -1) {
      const nl = text.indexOf('\n', end + 1);
      return text.slice(0, nl + 1) + h + '\n' + text.slice(nl + 1);
    }
  }
  return h + '\n' + text;
}

// Strip an AGENTKIT GENERATED header (used by adopt when flowing content back).
export function stripHeader(content) {
  const text = normalizeEol(content);
  const frontmatter = text.startsWith('---\n') ? text.match(/^---\n[\s\S]*?\n---\n/) : null;
  const start = frontmatter ? frontmatter[0].length : 0;
  const end = text.indexOf('\n', start);
  const line = text.slice(start, end === -1 ? text.length : end);
  if (!/^(?:<!-- |# |\/\/ )AGENTKIT GENERATED from /.test(line)) return text;
  return text.slice(0, start) + (end === -1 ? '' : text.slice(end + 1));
}

function extOf(p) {
  const i = p.lastIndexOf('.');
  return i === -1 ? '' : p.slice(i).toLowerCase();
}

// Rebuild an md file keeping only the frontmatter keys a vendor can parse (strip the superset — never
// author to the lowest common denominator; adapters strip downward. Decision 17.)
// `extra` (optional) merges vendor-injected keys into the kept frontmatter (e.g. Claude's hide key).
function stripFmTo(entry, keepKeys, extra) {
  if (!entry.fm) return normalizeEol(entry.raw);
  const kept = {};
  for (const k of keepKeys) if (entry.fm[k] !== undefined && entry.fm[k] !== null) kept[k] = entry.fm[k];
  if (extra) Object.assign(kept, extra);
  return nativeFrontmatter(kept) + '\n' + entry.body;
}

// JSON scalars/arrays are valid YAML flow values. Quote native strings so descriptions containing
// ': ', '#', booleans or line breaks retain their meaning in real vendor YAML parsers.
function nativeFrontmatter(fm) {
  return ['---', ...Object.entries(fm).map(([key, value]) => `${key}: ${JSON.stringify(value)}`), '---'].join('\n');
}

const isSkillRoot = e => e.type === 'skill' && e.subPath === `skills/${e.name}/SKILL.md`;

// Synthesize a skill-shaped view of a workflow entry for vendors that have a skills surface but NO
// commands-from-workflows surface (Codex — see vendor-capability-matrix.md). The `wf-` prefix keeps
// the synthesized skill from colliding with a real skill of the same name (e.g. the `vet-hard`
// workflow vs the `vet-hard` skill). Reuses stripFmTo downstream, so the SKILL.md carries only
// { name, description } — the skill frontmatter both Codex and antigravity accept.
function workflowAsSkill(e) {
  const name = `wf-${e.name}`;
  return {
    ...e,
    name,
    subPath: `skills/${name}/SKILL.md`,
    fm: { name, description: e.fm?.description || e.name },
  };
}

// TOML multiline basic string escaping for Gemini command prompts.
export function tomlMultiline(s) {
  // JSON basic-string escapes are also TOML escapes. Retain actual line breaks only.
  const esc = normalizeEol(s).split('\n').map(line => JSON.stringify(line).slice(1, -1)).join('\n');
  return '"""\n' + esc + (esc.endsWith('\n') ? '' : '\n') + '"""';
}

function tomlValue(v) {
  if (Array.isArray(v)) return '[' + v.map(tomlValue).join(', ') + ']';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  return JSON.stringify(String(v));
}

export function renderTomlTable(name, obj) {
  const lines = [`[${name}]`];
  // A child table changes TOML's current scope. Emit every parent value first.
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) continue;
    lines.push(`${JSON.stringify(k)} = ${tomlValue(v)}`);
  }
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) lines.push(...renderTomlTable(`${name}.${JSON.stringify(k)}`, v));
  }
  return lines;
}

// Provenance is assigned at construction, never recovered from output text or suffixes.
function generated(e, rel, content, transform) {
  return { rel, content, source: e.srcRel, transform };
}

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const strings = value => Array.isArray(value) && value.every(v => typeof v === 'string');
const safePath = value => typeof value === 'string' && !/[\\\x00-\x1f<>:"|?*]/.test(value)
  && value.split('/').every(part => part && part !== '.' && part !== '..' && !/[. ]$/.test(part)
    && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
const routeName = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const tierName = value => typeof value === 'string' && /^(core|overlay|(?:tech|kind):[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(value);
const canonicalTrigger = value => value === 'model_decision' ? 'model-decision' : value;

// Deliberately local-stdio only. Ingestion must validate raw metadata before a lossy parser;
// this second boundary validates actual objects supplied by direct callers and the planner.
function validateInputs(entries, ctx, vendor) {
  const validations = [];
  const error = msg => validations.push({ level: 'error', msg: `${vendor}: ${msg}` });
  const sources = new Map();
  for (const e of entries) {
    if (!safePath(e.srcRel) || !e.srcRel.startsWith('.agent/') || e.srcRel !== `.agent/${e.subPath}`) {
      error(`invalid canonical source/path ${e.srcRel}`);
      continue;
    }
    const identity = e.srcRel.toLowerCase();
    if (sources.has(identity)) error(`source collision: ${sources.get(identity)} and ${e.srcRel}`);
    sources.set(identity, e.srcRel);
    if (typeof e.raw !== 'string' || typeof e.body !== 'string') error(`text source required: ${e.srcRel}`);
    if (e.fm != null && !isRecord(e.fm)) error(`frontmatter must be a map: ${e.srcRel}`);
    const fm = isRecord(e.fm) ? e.fm : {};
    for (const tier of [e.tier, fm.tier]) if (tier !== undefined && !tierName(tier)) error(`invalid tier in ${e.srcRel}`);
    const skillRoot = isSkillRoot(e);
    // _templates is a reserved support directory, not a native skill. Its resources still copy.
    const template = e.type === 'skill' && e.name === '_templates';
    if (['skill', 'rule', 'workflow', 'agent'].includes(e.type) && !template && !routeName(e.name)) error(`invalid routing name '${e.name}' in ${e.srcRel}`);
    if (skillRoot && !template && (fm.name !== e.name || e.name.length > 64)) error(`SKILL.md name must match its folder and fit 64 characters: ${e.srcRel}`);
    if (skillRoot && !template && (typeof fm.description !== 'string' || !fm.description.trim())) error(`skill description must be a nonempty string: ${e.srcRel}`);
    for (const key of ['name', 'description', 'model', 'argument-hint', 'agent']) {
      if (fm[key] !== undefined && typeof fm[key] !== 'string') error(`${key} must be a string in ${e.srcRel}`);
    }
    for (const key of ['gemini', 'subtask', 'user-invocable', 'disable-model-invocation']) {
      if (fm[key] !== undefined && typeof fm[key] !== 'boolean') error(`${key} must be boolean in ${e.srcRel}`);
    }
    for (const key of ['required-tools', 'triggers', 'applies-to', 'conflicts-with']) {
      if (fm[key] !== undefined && !strings(fm[key])) error(`${key} must be a string array in ${e.srcRel}`);
    }
    for (const key of ['allowed-tools', 'tools', 'globs', 'skill']) {
      if (fm[key] !== undefined && typeof fm[key] !== 'string' && !strings(fm[key])) error(`${key} must be a string or string array in ${e.srcRel}`);
    }
    const trigger = canonicalTrigger(fm.trigger);
    if (fm.trigger !== undefined && !['always', 'glob', 'model-decision'].includes(trigger)) error(`invalid trigger in ${e.srcRel}`);
    if (trigger === 'glob' && (!fm.globs || (Array.isArray(fm.globs) && !fm.globs.length))) error(`glob trigger requires globs in ${e.srcRel}`);
  }
  if (!isRecord(ctx.mcpServers)) error('MCP servers must be a map');
  else for (const [name, cfg] of Object.entries(ctx.mcpServers)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) || ['__proto__', 'constructor', 'prototype'].includes(name)) error(`unsupported MCP server name '${name}'`);
    if (!isRecord(cfg)) { error(`MCP '${name}' must be a local server map`); continue; }
    for (const key of Object.keys(cfg)) if (!['command', 'args', 'env', 'enabled'].includes(key)) error(`MCP '${name}': unsupported field '${key}'`);
    if (typeof cfg.command !== 'string' || !cfg.command.trim() || /[\x00-\x1f]/.test(cfg.command)) error(`MCP '${name}': command must be a nonempty string`);
    if (cfg.args !== undefined && (!strings(cfg.args) || cfg.args.some(s => s.includes('\0')))) error(`MCP '${name}': args must be strings without NUL`);
    if (cfg.enabled !== undefined && typeof cfg.enabled !== 'boolean') error(`MCP '${name}': enabled must be boolean`);
    if (cfg.env !== undefined && (!isRecord(cfg.env) || Object.entries(cfg.env).some(([k, v]) => !k || /[=\x00-\x1f]/.test(k) || typeof v !== 'string' || v.includes('\0')))) error(`MCP '${name}': env must map environment names to strings`);
  }
  return validations;
}

function checkedAdapter(vendor, emit) {
  return (entries, supplied = {}) => {
    const ctx = { config: {}, hooks: [], mcpServers: {}, ...supplied };
    const validations = validateInputs(entries, ctx, vendor);
    if (validations.length) return { files: [], settings: [], validations };
    const result = emit(entries.filter(e => e.subPath !== 'skills/_templates/SKILL.md'), ctx);
    result.validations.unshift(...validations);
    const paths = new Map();
    const menuRoutes = new Map();
    for (const file of result.files) {
      if (!safePath(file.rel)) result.validations.push({ level: 'error', msg: `${vendor}: invalid output path ${file.rel} (${file.source})` });
      const identity = file.rel.toLowerCase();
      if (paths.has(identity)) result.validations.push({ level: 'error', msg: `${vendor}: output collision at ${file.rel}: ${paths.get(identity)} and ${file.source}` });
      paths.set(identity, file.source);
      if (/^\.[^/]+\/skills\/[^/]+\/SKILL\.md$/.test(file.rel)) {
        const name = parseFrontmatter(file.content).fm?.name;
        if (!routeName(name) || name.length > 64 || file.rel.split('/').at(-2) !== name) result.validations.push({ level: 'error', msg: `${vendor}: invalid native skill name at ${file.rel} (${file.source})` });
      }
      // Claude commands and visible skills share slash-menu names even with different paths.
      // The existing explicit workflow/skill pairing hides the implementation skill from that menu.
      if (vendor === 'claude') {
        const command = file.rel.match(/^\.claude\/commands\/([^/]+)\.md$/);
        const skill = file.rel.match(/^\.claude\/skills\/([^/]+)\/SKILL\.md$/);
        const visibleSkill = skill && parseFrontmatter(file.content).fm?.['user-invocable'] !== false;
        const route = command?.[1] || (visibleSkill ? skill[1] : null);
        if (route) {
          if (menuRoutes.has(route)) result.validations.push({ level: 'error', msg: `${vendor}: slash route collision '${route}': ${menuRoutes.get(route)} and ${file.source}; pair the workflow's implementation skill explicitly or rename the conflicting route` });
          menuRoutes.set(route, file.source);
        }
      }
    }
    if (result.validations.some(v => v.level === 'error')) return { files: [], settings: [], validations: result.validations };
    return result;
  };
}

// ---------- adapters ----------

// Claude SKILL.md frontmatter that hides a skill from the user-facing `/` menu while keeping it
// model-invocable (verified 2026-07-09 against code.claude.com/docs/en/skills.md#control-who-invokes-a-skill).
// NOT `disable-model-invocation:` — that is the INVERSE (user-only, hidden from the model).
const CLAUDE_HIDE_FROM_MENU = { 'user-invocable': false };

// CLAUDE — needs the MOST generation (no native path to .agent/). Emits skills, commands (from
// workflows, 1:1 — never also a passthrough skill), subagent defs, hooks + MCP key-merge, and a
// `permissions.allow` baseline (union merge). Owns `permissions.allow` ONLY — NEVER `defaultMode`,
// `permissions.deny`, `trustedDirectories`, or Claude memory (decision 16, revised 2026-07-10 —
// see governance/DECISION-settings-key-merge-scope.md).
// The kit-managed `permissions.allow` baseline (decision 16, revised 2026-07-10). Portable,
// project-relative, prompt-friendly patterns ONLY — every entry is a shape agents legitimately need
// and the permission engine can match. Deliberately EXCLUDES outward-facing / arbitrary-exec grants
// (git push, broad rm, Stop-Process, external curl, powershell -Command "<str>", bare `node *`) —
// those stay human-gated per pattern-external-mutation.md. Opt out with permissions.enabled=false;
// extend with permissions.extra. worktreeRoot alone does not authorize broader runners.
export function claudePermissionsBaseline(ctx) {
  const cfg = (ctx && ctx.config) || {};
  const p = cfg.permissions || {};
  if (p.enabled === false) return [];
  // Axis gating (F-perms-npm-in-non-app, the operate-side kit adoption 2026-07-25). Toolchain grants are
  // selected on the SAME axes as the asset catalog, resolved exactly the way selectEntries resolves a
  // tier: `kind:X` → kinds.includes(X), `tech:X` → stack.includes(X). Before this gate a non-app repo
  // received 10 npm/npx allows into a tree with no package.json — the same disease U1 fixed in core
  // skills, one layer down. Absent `kinds` defaults to ['app'] (mirroring selectEntries/loadConfig), so
  // every pre-kinds app config — 8 of the 9 app repos carry no `kinds` key — resolves byte-identically
  // to before. Entry ORDER below is load-bearing for that guarantee: the npm block stays first.
  const kinds = cfg.kinds || ['app'];
  const stack = cfg.stack || [];
  const selects = (tier) => (tier.startsWith('kind:') ? kinds.includes(tier.slice(5)) : stack.includes(tier.slice(5)));
  // A JS toolchain is implied by kind:app, or by any declared tech pack that STACK_MARKERS proves via a
  // package.json dependency. That list is duplicated rather than imported ON PURPOSE: adapters.mjs is a
  // zero-import leaf and agentkit.mjs imports IT, so a back-import would make the pair circular. The
  // meta-packs (`web`, `canvas`) are excluded — they carry no marker dep and imply no npm toolchain.
  const JS_PACKS = ['react', 'nextjs', 'next', 'supabase', 'react-flow', 'gsap', 'framer-motion', 'pwa', 'typescript'];
  const isJs = selects('kind:app') || JS_PACKS.some((k) => selects(`tech:${k}`));

  const base = [];
  // graduated gate + test/build runners — one allowlisted command each (foundation-testing.md §1)
  if (isJs) {
    base.push(
      'Bash(npm run gate *)',
      'Bash(npm run lint *)', 'Bash(npm run typecheck *)', 'Bash(npm run test *)',
      'Bash(npm run build *)', 'Bash(npm run validate *)',
      'Bash(npx vitest run *)', 'Bash(npx eslint *)', 'Bash(npx tsc *)', 'Bash(npx depcruise *)',
    );
  }
  // The Python/container counterparts. OPT-IN by declared axis, never "non-app implies Python" —
  // spraying uv/ruff/pytest at a repo that declared neither would just re-run the original defect in
  // the other direction. A Python repo opts in with `stack: ["python"]` (the same key tech:python
  // assets will select on); a container repo with `kinds: ["service"]` or `stack: ["docker"]`.
  if (selects('tech:python')) base.push('Bash(uv run pytest *)', 'Bash(uv run ruff check *)', 'Bash(ruff check *)', 'Bash(pytest *)');
  if (selects('kind:service') || selects('tech:docker')) base.push('Bash(docker compose ps *)', 'Bash(docker compose logs *)', 'Bash(docker compose config *)');
  base.push(
    // Launcher identity is resolved outside this pure adapter. Without an attested executable,
    // helper commands prompt under the user's policy. Never wildcard the node script position.
    // safe read-only utilities the audits found unlisted — stack-neutral, never gated
    'Bash(comm *)', 'Bash(od *)', 'Bash(printf *)', 'Bash(git fetch *)',
  );
  // worktreeRoot alone is not a runner grant. Broad uv/docker/worktree runners require extra.
  // Codebase-memory MCP read-only tools — the SessionStart code-discovery protocol mandates these
  // for all exploration, so each graph query prompts otherwise. Gated on the server actually being
  // registered for this project (key derived from ctx.mcpServers, robust to an mcp-name change);
  // per-tool enumeration, NOT `mcp__<server>__*`, so the mutating tools (index_repository,
  // delete_project, ingest_traces, manage_adr) stay human-gated.
  const codegraphKey = Object.keys((ctx && ctx.mcpServers) || {}).find((k) => /^[a-zA-Z0-9_-]+$/.test(k)
    && k.includes('codebase-memory') && ctx.mcpServers[k]?.enabled !== false);
  if (codegraphKey) {
    for (const tool of ['search_graph', 'query_graph', 'trace_path', 'get_code_snippet', 'get_graph_schema', 'get_architecture', 'search_code', 'list_projects', 'index_status', 'detect_changes']) {
      base.push(`mcp__${codegraphKey}__${tool}`);
    }
  }
  const extra = Array.isArray(p.extra) ? p.extra : [];
  return [...new Set([...base, ...extra])];
}

function claude(entries, ctx) {
  const files = [];
  const settings = [];
  const validations = [];
  // Workflow `skill:` pairing — a workflow that declares its 1:1 implementation skill gets that
  // skill hidden from Claude's `/` menu. Both surfaces land in the same autocomplete and matching
  // is substring, so `/wrap` would show `/wrap-up` AND `implement-session-wrap-up` otherwise.
  // Cross-entry logic: compileManifest calls adapters one entry at a time and so never sees a
  // pairing — harmless there (the manifest records target rels only, validations are discarded);
  // do NOT "fix" that by trying to pair inside the per-entry loop.
  const skillNames = new Set(
    entries.filter(isSkillRoot).map((e) => String(e.fm?.name || e.name)),
  );
  const pairedSkills = new Set();
  for (const e of entries) {
    if (e.type !== 'workflow' || !e.fm?.skill) continue;
    for (const s of Array.isArray(e.fm.skill) ? e.fm.skill : [e.fm.skill]) {
      pairedSkills.add(String(s));
      if (!skillNames.has(String(s))) {
        validations.push({ level: 'warn', msg: `claude: workflow '${e.name}' pairs skill '${s}' but no such skill is in the merged tree — nothing hidden` });
      }
    }
  }
  for (const e of entries) {
    if (e.type === 'skill') {
      const ext = extOf(e.subPath);
      const rel = '.claude/' + e.subPath; // skills/<name>/...
      const hide = isSkillRoot(e) && pairedSkills.has(String(e.fm?.name || e.name));
      const content = isSkillRoot(e)
        ? injectHeader(stripFmTo(e, ['name', 'description', 'allowed-tools'], hide ? CLAUDE_HIDE_FROM_MENU : undefined), e.srcRel, ext)
        : injectHeader(normalizeEol(e.raw), e.srcRel, ext);
      files.push(generated(e, rel, content, isSkillRoot(e) ? 'body-md' : 'copy'));
    } else if (e.type === 'rule') {
      if (canonicalTrigger(e.fm?.trigger) === 'model-decision') {
        // model-decision → menu-hidden `rule-` skill. Claude's progressive disclosure (name +
        // description always in context, body loaded on invocation) IS the model-decision
        // semantics; emitting these as .claude/rules/ made them always-on (~19K tokens/session
        // over-served). The `rule-` prefix mirrors the codex `wf-` collision guard. `always`
        // and `glob` rules keep the native rules surface below.
        const name = `rule-${e.name}`;
        if (skillNames.has(name)) {
          validations.push({ level: 'error', msg: `claude: rule ${e.srcRel} collides with existing skill '${name}'` });
        }
        if (!e.fm?.description) {
          validations.push({ level: 'warn', msg: `claude: model-decision rule ${e.srcRel} lacks description: — routing degraded to its name` });
        }
        const fmOut = { name, description: e.fm?.description || `${e.name} rule — consult before work it governs.`, ...CLAUDE_HIDE_FROM_MENU };
        files.push(generated(e, `.claude/skills/${name}/SKILL.md`, injectHeader(nativeFrontmatter(fmOut) + '\n' + e.body, e.srcRel, '.md'), 'body-md'));
      } else {
        // Claude Code native rules surface (verified 2026-07-03, code.claude.com/docs/en/memory):
        // .claude/rules/*.md, path-scoped via `paths:` frontmatter. Canonical `trigger: glob` maps 1:1.
        const paths = e.fm?.globs ? (Array.isArray(e.fm.globs) ? e.fm.globs : [e.fm.globs]) : null;
        const kept = paths ? { paths } : {};
        const content = (paths ? nativeFrontmatter(kept) + '\n' + e.body : e.body);
        files.push(generated(e, `.claude/rules/${e.name}.md`, injectHeader(content, e.srcRel, '.md'), 'body-md'));
      }
    } else if (e.type === 'workflow') {
      const rel = `.claude/commands/${e.name}.md`;
      files.push(generated(e, rel, injectHeader(stripFmTo(e, ['description', 'argument-hint', 'allowed-tools', 'model']), e.srcRel, '.md'), 'body-md'));
    } else if (e.type === 'agent') {
      const rel = `.claude/agents/${e.name}.md`;
      files.push(generated(e, rel, injectHeader(stripFmTo(e, ['name', 'description', 'tools', 'model']), e.srcRel, '.md'), 'body-md'));
    }
  }
  if (ctx.hooks.length) {
    settings.push({
      file: '.claude/settings.json',
      merge: 'claude-hooks',
      data: ctx.hooks.filter((h) => !h.vendors || h.vendors.includes('claude')),
    });
  }
  const permsBaseline = claudePermissionsBaseline(ctx);
  if (permsBaseline.length) {
    settings.push({ file: '.claude/settings.json', merge: 'claude-permissions', data: permsBaseline });
  }
  const servers = Object.fromEntries(Object.entries(ctx.mcpServers).filter(([, cfg]) => cfg.enabled !== false).map(([name, cfg]) => [name, {
    command: cfg.command, ...(cfg.args !== undefined ? { args: [...cfg.args] } : {}), ...(cfg.env !== undefined ? { env: { ...cfg.env } } : {}),
  }]));
  if (Object.keys(servers).length) settings.push({ file: '.mcp.json', merge: 'mcp-json', data: servers });
  return { files, settings, validations };
}

// CODEX — root AGENTS.md is the durable entry; native skill discovery is .agents/skills (plural,
// per official docs — decision 6/41). Config key-merge target is .codex/config.toml (managed block).
// Codex has NO commands-from-workflows surface (skills only), so workflows ride in as `wf-`prefixed
// skills at .agents/skills/wf-<name>/ — the only path that makes them discoverable in Codex.
function codex(entries, ctx) {
  const files = [];
  const settings = [];
  const validations = [];
  for (const e of entries) {
    if (e.type === 'skill') {
      const ext = extOf(e.subPath);
      const rel = '.agents/' + e.subPath;
      const content = isSkillRoot(e)
        ? injectHeader(stripFmTo(e, ['name', 'description']), e.srcRel, ext)
        : injectHeader(normalizeEol(e.raw), e.srcRel, ext);
      files.push(generated(e, rel, content, isSkillRoot(e) ? 'body-md' : 'copy'));
    } else if (e.type === 'workflow') {
      const w = workflowAsSkill(e);
      files.push(generated(e, '.agents/' + w.subPath, injectHeader(stripFmTo(w, ['name', 'description']), e.srcRel, '.md'), 'body-md'));
    }
  }
  if (Object.keys(ctx.mcpServers).length) {
    const lines = [];
    for (const [name, cfg] of Object.entries(ctx.mcpServers)) {
      const native = { command: cfg.command, ...(cfg.args !== undefined ? { args: [...cfg.args] } : {}),
        ...(cfg.enabled !== undefined ? { enabled: cfg.enabled } : {}), ...(cfg.env !== undefined ? { env: { ...cfg.env } } : {}) };
      lines.push(...renderTomlTable(`mcp_servers.${JSON.stringify(name)}`, native), '');
    }
    settings.push({ file: '.codex/config.toml', merge: 'toml-block', data: lines.join('\n').trimEnd() });
  }
  return { files, settings, validations };
}

// GEMINI CLI — curated subset of workflows → .gemini/commands/*.toml (opt out via `gemini: false`
// in workflow frontmatter). Curated, not a bulk mirror.
function gemini(entries, ctx) {
  const files = [];
  const validations = [];
  for (const e of entries) {
    if (e.type === 'skill' && !ctx.config.vendors?.includes('codex')) {
      const ext = extOf(e.subPath);
      const main = isSkillRoot(e);
      const content = injectHeader(main ? stripFmTo(e, ['name', 'description']) : normalizeEol(e.raw), e.srcRel, ext);
      files.push(generated(e, '.gemini/' + e.subPath, content, main ? 'body-md' : 'copy'));
    }
    if (e.type !== 'workflow' || e.fm?.gemini === false) continue;
    const desc = e.fm?.description || e.name;
    const prompt = normalizeEol(e.body).trim() + `\n\nCanonical source: ${e.srcRel}\n`;
    const content =
      headerFor(e.srcRel, '.toml') +
      '\n' +
      `description = ${JSON.stringify(desc)}\n` +
      `prompt = ${tomlMultiline(prompt)}\n`;
    files.push(generated(e, `.gemini/commands/${e.name}.toml`, content, 'unsupported'));
  }
  return { files, settings: [], validations };
}

// OPENCODE — skills copy + workflows as native slash commands + package.json (create-if-absent).
// OpenCode HAS a commands surface (verified 2026-07-08 against opencode.ai/docs/commands): markdown
// files at .opencode/commands/<name>.md, filename → /<name>, `description` frontmatter, body is the
// prompt template. So workflows map to real user-invoked commands here (like Claude), NOT skills.
// MCP is project config in `opencode.json` under `mcp` (verified 2026-08-10 against
// https://opencode.ai/docs/mcp-servers/); it is not read from `.mcp.json`.
function opencode(entries, ctx) {
  const files = [];
  const settings = [];
  for (const e of entries) {
    if (e.type === 'skill') {
      const ext = extOf(e.subPath);
      const content = isSkillRoot(e)
        ? injectHeader(stripFmTo(e, ['name', 'description']), e.srcRel, ext)
        : injectHeader(normalizeEol(e.raw), e.srcRel, ext);
      files.push(generated(e, '.opencode/' + e.subPath, content, isSkillRoot(e) ? 'body-md' : 'copy'));
    } else if (e.type === 'workflow') {
      const rel = `.opencode/commands/${e.name}.md`;
      // opencode expects provider/model form (e.g. anthropic/claude-haiku-4-5); a bare Claude
      // alias like `haiku` is meaningless here — drop it rather than emit a broken hint.
      const safe = e.fm?.model && !String(e.fm.model).includes('/') ? { ...e, fm: { ...e.fm, model: undefined } } : e;
      files.push(generated(e, rel, injectHeader(stripFmTo(safe, ['description', 'agent', 'model', 'subtask']), e.srcRel, '.md'), 'body-md'));
    }
  }
  settings.push({
    file: '.opencode/package.json',
    merge: 'create-if-absent',
    data: JSON.stringify({ name: 'opencode-skills', private: true }, null, 2) + '\n',
  });
  const mcpServers = {};
  for (const [name, cfg] of Object.entries((ctx && ctx.mcpServers) || {})) {
    const server = { type: 'local', command: [cfg.command, ...(cfg.args || [])],
      ...(cfg.env !== undefined ? { environment: { ...cfg.env } } : {}), enabled: cfg.enabled ?? true };
    mcpServers[name] = server;
  }
  if (Object.keys(mcpServers).length) {
    settings.push({ file: 'opencode.json', merge: 'opencode-mcp', data: mcpServers });
  }
  return { files, settings, validations: [] };
}

// ANTIGRAVITY — reads .agent/ natively; NOTHING generated (decision 15). Cost is validation:
// SKILL.md name == folder name, flat skill layout, workflows shaped as low-logic routers.
function antigravity(entries) {
  const validations = [];
  for (const e of entries) {
    if (isSkillRoot(e)) {
      const folder = e.subPath.split('/')[1];
      if (e.fm?.name && e.fm.name !== folder) {
        validations.push({ level: 'error', msg: `antigravity: SKILL.md name '${e.fm.name}' != folder '${folder}' (${e.srcRel})` });
      }
      if (!e.fm?.description) {
        validations.push({ level: 'warn', msg: `antigravity: missing description in ${e.srcRel}` });
      }
    }
  }
  return { files: [], settings: [], validations };
}

export const adapters = Object.fromEntries(Object.entries({ claude, codex, gemini, opencode, antigravity })
  .map(([vendor, emit]) => [vendor, checkedAdapter(vendor, emit)]));
export const VENDORS = Object.keys(adapters);
