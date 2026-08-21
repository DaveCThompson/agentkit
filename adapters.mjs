// adapters.mjs — vendor transforms as CODE, not directories (plan decision: flat repo, adapters in code).
// Each adapter: (entries, ctx) => { files: [{rel, content}], settings: [{file, merge, data}], validations: [{level, msg}] }
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
  return normalizeEol(content)
    .split('\n')
    .filter((l) => !l.includes('AGENTKIT GENERATED from'))
    .join('\n');
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
  return serializeFrontmatter(kept) + '\n' + entry.body;
}

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

// The set of real SKILL.md names in a merged tree. Both claude() and codex() synthesize skills into
// that same namespace (`wf-`, `rule-`) and must check for a collision against it first.
function skillNameSet(entries) {
  return new Set(
    entries.filter((e) => e.type === 'skill' && e.subPath.endsWith('SKILL.md')).map((e) => String(e.fm?.name || e.name)),
  );
}

// A `model-decision` rule rendered as a description-gated skill — the shared half of a mapping both
// Claude and Codex need. Claude adds its hide-from-menu key on top and writes to .claude/skills/;
// Codex writes the same frontmatter to .agents/skills/. Returns the synthesized name + frontmatter
// plus any validation the caller should record; the caller owns the path and the vendor extras.
function modelDecisionRuleSkill(e, vendor, skillNames) {
  const name = `rule-${e.name}`;
  return {
    name,
    collision: skillNames.has(name)
      ? { level: 'error', msg: `${vendor}: rule ${e.srcRel} collides with existing skill '${name}'` }
      : null,
    warn: e.fm?.description
      ? null
      : { level: 'warn', msg: `${vendor}: model-decision rule ${e.srcRel} lacks description: — routing degraded to its name` },
    fmOut: { name, description: e.fm?.description || `${e.name} rule — consult before work it governs.` },
  };
}

// TOML multiline basic string escaping for Gemini command prompts.
export function tomlMultiline(s) {
  const esc = normalizeEol(s).replace(/\\/g, '\\\\').replace(/"""/g, '""\\"');
  return '"""\n' + esc + (esc.endsWith('\n') ? '' : '\n') + '"""';
}

function tomlValue(v) {
  if (Array.isArray(v)) return '[' + v.map(tomlValue).join(', ') + ']';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  return JSON.stringify(String(v));
}

export function renderTomlTable(name, obj) {
  const lines = [`[${name}]`];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      lines.push(...renderTomlTable(`${name}.${k}`, v));
    } else {
      lines.push(`${k} = ${tomlValue(v)}`);
    }
  }
  return lines;
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
// extend with permissions.extra; worktree wildcards need permissions.worktreeRoot in .agentkit.json.
export function claudePermissionsBaseline(ctx) {
  const cfg = (ctx && ctx.config) || {};
  const p = cfg.permissions || {};
  if (p.enabled === false) return [];
  const repo = String(ctx?.projectRoot || '.').replace(/[/\\]+$/, '').split(/[/\\]/).pop() || 'project';
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
      'Bash(npm run gate*)',
      'Bash(npm run lint*)', 'Bash(npm run typecheck*)', 'Bash(npm run test*)',
      'Bash(npm run build*)', 'Bash(npm run validate*)',
      'Bash(npx vitest run *)', 'Bash(npx eslint *)', 'Bash(npx tsc *)', 'Bash(npx depcruise *)',
    );
  }
  // The Python/container counterparts. OPT-IN by declared axis, never "non-app implies Python" —
  // spraying uv/ruff/pytest at a repo that declared neither would just re-run the original defect in
  // the other direction. A Python repo opts in with `stack: ["python"]` (the same key tech:python
  // assets will select on); a container repo with `kinds: ["service"]` or `stack: ["docker"]`.
  if (selects('tech:python')) base.push('Bash(uv run *)', 'Bash(ruff *)', 'Bash(pytest *)');
  if (selects('kind:service') || selects('tech:docker')) base.push('Bash(docker compose *)');
  base.push(
    // kit helpers, narrowly scoped (NOT a blanket `node *`; that arbitrary-exec grant is opt-in).
    // Stack-neutral: `agentkit lock`/`surfaces` are the orchestration primitives every kind uses.
    'Bash(node * lock *)', 'Bash(node * surfaces *)',
    // safe read-only utilities the audits found unlisted — stack-neutral, never gated
    'Bash(comm *)', 'Bash(od *)', 'Bash(printf *)', 'Bash(git fetch *)',
    'PowerShell(Get-CimInstance *)', 'PowerShell(Set-Location *)',
    // the one narrow delete the lock lifecycle needs (moot once `agentkit lock` is used; kept for safety)
    'Bash(rm -f .orchestrator.lock)',
  );
  // Worktree wildcards are themselves npm/node_modules-shaped, so they ride the same JS gate — a
  // Python repo with a worktreeRoot has no `npm --prefix` or `node_modules/.bin` to run.
  if (p.worktreeRoot && isJs) {
    const root = String(p.worktreeRoot).replace(/[/\\]+$/, '');
    base.push(
      `Bash(npm --prefix ${root}/${repo}-wt/*)`,
      'Bash(*node_modules/.bin/vitest run *)',
      'Bash(*node_modules/.bin/eslint *)',
    );
  }
  // Codebase-memory MCP read-only tools — the SessionStart code-discovery protocol mandates these
  // for all exploration, so each graph query prompts otherwise. Gated on the server actually being
  // registered for this project (key derived from ctx.mcpServers, robust to an mcp-name change);
  // per-tool enumeration, NOT `mcp__<server>__*`, so the mutating tools (index_repository,
  // delete_project, ingest_traces, manage_adr) stay human-gated.
  const codegraphKey = Object.keys((ctx && ctx.mcpServers) || {}).find((k) => k.includes('codebase-memory'));
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
  const skillNames = skillNameSet(entries);
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
      const hide = e.subPath.endsWith('SKILL.md') && pairedSkills.has(String(e.fm?.name || e.name));
      const content = e.subPath.endsWith('SKILL.md')
        ? injectHeader(stripFmTo(e, ['name', 'description', 'allowed-tools'], hide ? CLAUDE_HIDE_FROM_MENU : undefined), e.srcRel, ext)
        : injectHeader(normalizeEol(e.raw), e.srcRel, ext);
      files.push({ rel, content });
    } else if (e.type === 'rule') {
      if (e.fm?.trigger === 'model-decision') {
        // model-decision → menu-hidden `rule-` skill. Claude's progressive disclosure (name +
        // description always in context, body loaded on invocation) IS the model-decision
        // semantics; emitting these as .claude/rules/ made them always-on (~19K tokens/session
        // over-served). The `rule-` prefix mirrors the codex `wf-` collision guard. `always`
        // and `glob` rules keep the native rules surface below.
        const r = modelDecisionRuleSkill(e, 'claude', skillNames);
        // NOTE: on collision claude() records the error and emits ANYWAY, clobbering the real skill at
        // that path. That is pre-existing behavior, not a deliberate design — it is preserved verbatim
        // here because changing it would alter a shipped surface across the whole fleet, which is out
        // of this ticket's scope. codex() below fails closed instead. Reconciling the two is follow-up.
        if (r.collision) validations.push(r.collision);
        if (r.warn) validations.push(r.warn);
        const fmOut = { ...r.fmOut, ...CLAUDE_HIDE_FROM_MENU };
        files.push({ rel: `.claude/skills/${r.name}/SKILL.md`, content: injectHeader(serializeFrontmatter(fmOut) + '\n' + e.body, e.srcRel, '.md') });
      } else {
        // Claude Code native rules surface (verified 2026-07-03, code.claude.com/docs/en/memory):
        // .claude/rules/*.md, path-scoped via `paths:` frontmatter. Canonical `trigger: glob` maps 1:1.
        const paths = e.fm?.globs ? (Array.isArray(e.fm.globs) ? e.fm.globs : [e.fm.globs]) : null;
        const kept = paths ? { paths } : {};
        const content = (paths ? serializeFrontmatter(kept) + '\n' + e.body : e.body);
        files.push({ rel: `.claude/rules/${e.name}.md`, content: injectHeader(content, e.srcRel, '.md') });
      }
    } else if (e.type === 'workflow') {
      const rel = `.claude/commands/${e.name}.md`;
      files.push({ rel, content: injectHeader(stripFmTo(e, ['description', 'argument-hint', 'allowed-tools', 'model']), e.srcRel, '.md') });
    } else if (e.type === 'agent') {
      const rel = `.claude/agents/${e.name}.md`;
      files.push({ rel, content: injectHeader(stripFmTo(e, ['name', 'description', 'tools', 'model']), e.srcRel, '.md') });
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
  if (Object.keys(ctx.mcpServers).length) {
    settings.push({ file: '.mcp.json', merge: 'mcp-json', data: ctx.mcpServers });
  }
  return { files, settings, validations };
}

// A Codex custom agent IS a delegated worker by construction, so the depth-0 contract
// (pattern-agent-orchestration.md §14A) must hold for it UNCONDITIONALLY — it cannot depend on the
// `rule-` skill below having been loaded, because skill discovery inside a spawned Codex thread is
// model-discretionary. This preamble is therefore prepended to every emitted agent's
// `developer_instructions`; it is the Codex analogue of the two Claude-only frontmatter injections
// in claude(), and like those it is scoped to this one adapter.
// WHY it exists (live incident 2026-08-20, recorded in ~/.codex/state_5.sqlite): a depth-1 Codex
// subagent enumerated its tool namespace — reasoning summary "Inspecting tools for spawning …" —
// found `codex_app.create_thread`, and fanned out an unrequested duplicate review task. Unlike
// `spawnAgent`, that tool writes NO `thread_spawn_edges` row and stamps the new thread
// `thread_source: "user"`, so the nesting was invisible to the parent AND to the lineage table.
// Every `create_thread` call in that machine's entire history was made by a subagent.
export const CODEX_DELEGATION_CONTAINMENT = [
  '## Delegation containment (non-negotiable)',
  '',
  'You are a delegated worker. You run at depth 0 and you do not fan out.',
  '',
  '- Do NOT spawn, fork, branch, or delegate to another agent, task, chat, thread, or worktree.',
  '  This explicitly includes `codex_app.create_thread`, `spawnAgent`, and any `<codex_delegation>`',
  '  wrapper. A tool being reachable is not permission to call it.',
  '- If you believe further delegation is warranted, write the PROPOSAL into your final report and',
  '  stop. Proposing is free; spawning is not.',
  '- The only exception is an authorization from your parent or the user that you can quote',
  '  verbatim. An unquoted approval is no approval.',
  '- Before creating any task, check it against work already running under your parent. Report a',
  '  near-duplicate; never create one.',
  '- Open your first and final message with:',
  '  `Lineage: parent=<parent-id|user> · self=<own-id|nickname> · depth=<n> · scope=<one line>`',
  '',
  'Canonical contract: `.agent/rules/pattern-agent-orchestration.md` §14.',
].join('\n');

// CODEX — root AGENTS.md is the durable entry; native skill discovery is .agents/skills (plural,
// per official docs — decision 6/41). Config key-merge target is .codex/config.toml (managed block).
// Codex has NO commands-from-workflows surface (skills only), so workflows ride in as `wf-`prefixed
// skills at .agents/skills/wf-<name>/ — the only path that makes them discoverable in Codex.
// Project custom agents ARE a documented surface (`.codex/agents/*.toml`, required keys name /
// description / developer_instructions — verified 2026-07-26, learn.chatgpt.com/docs/agent-configuration/subagents),
// and `model-decision` rules ride in as `rule-`prefixed skills exactly as they do for Claude.
function codex(entries, ctx) {
  const files = [];
  const settings = [];
  const validations = [];
  // Collision guard for the two synthesized skill namespaces (`wf-`, `rule-`), mirroring claude().
  const skillNames = new Set(
    entries.filter((e) => e.type === 'skill' && e.subPath.endsWith('SKILL.md')).map((e) => String(e.fm?.name || e.name)),
  );
  for (const e of entries) {
    if (e.type === 'skill') {
      const ext = extOf(e.subPath);
      const rel = '.agents/' + e.subPath;
      const content = e.subPath.endsWith('SKILL.md')
        ? injectHeader(stripFmTo(e, ['name', 'description']), e.srcRel, ext)
        : injectHeader(normalizeEol(e.raw), e.srcRel, ext);
      files.push({ rel, content });
    } else if (e.type === 'workflow') {
      const w = workflowAsSkill(e);
      files.push({ rel: '.agents/' + w.subPath, content: injectHeader(stripFmTo(w, ['name', 'description']), e.srcRel, '.md') });
    } else if (e.type === 'rule') {
      // Codex has no native rules surface — the capability matrix's "via AGENTS.md text" was the whole
      // story, which meant a `model-decision` rule reached Codex only as a prose pointer the model may
      // or may not follow. A model-decision rule is description-gated BY DEFINITION, and that is
      // precisely what a skill is here, so mirror claude()'s `model-decision → rule-` mapping onto
      // Codex's skills surface. `always` and `glob` rules stay on the AGENTS.md path: Codex has no
      // always-on rules file and no path-scoping primitive, so emitting them as skills would convert a
      // mandatory rule into a discretionary one — a silent downgrade, not a port.
      if (e.fm?.trigger !== 'model-decision') continue;
      const r = modelDecisionRuleSkill(e, 'codex', skillNames);
      // Fail closed on collision — this is new code, so it takes the correct behavior rather than
      // inheriting claude()'s emit-anyway (see the note there). A colliding write would overwrite a
      // real skill at the same .agents/skills/<name>/SKILL.md path.
      if (r.collision) { validations.push(r.collision); continue; }
      if (r.warn) validations.push(r.warn);
      files.push({ rel: `.agents/skills/${r.name}/SKILL.md`, content: injectHeader(serializeFrontmatter(r.fmOut) + '\n' + e.body, e.srcRel, '.md') });
    } else if (e.type === 'agent') {
      const name = String(e.fm?.name || e.name);
      const instructions = CODEX_DELEGATION_CONTAINMENT + '\n\n' + normalizeEol(e.body).trim() + '\n';
      const lines = [
        `name = ${JSON.stringify(name)}`,
        `description = ${JSON.stringify(String(e.fm?.description || name))}`,
        `developer_instructions = ${tomlMultiline(instructions)}`,
      ];
      // Decision 4 (unsupported semantics fail VISIBLY, never a silent strip). Two canonical agent
      // fields have no faithful Codex mapping and are dropped with a recorded degradation:
      //   `model:` — canonical agents carry a Claude alias (`haiku`, `opus`); Codex wants its own
      //     provider IDs, and decision 3 forbids leaking vendor model IDs into canonical sources.
      //     A tier→model resolver is the compiler ticket's job, not this adapter's.
      //   `tools:` — Claude's flat allow-list has no equivalent; Codex scopes tools per MCP server
      //     table (`enabled_tools`/`disabled_tools`), so a flat list cannot be translated 1:1.
      if (e.fm?.model) validations.push({ level: 'warn', msg: `codex: agent ${e.srcRel} declares model '${e.fm.model}' — dropped (no canonical tier→model mapping yet); the agent inherits the session model` });
      if (e.fm?.tools) validations.push({ level: 'warn', msg: `codex: agent ${e.srcRel} declares tools: — dropped (Codex scopes tools per mcp_servers table, not a flat list); the agent inherits the parent tool surface` });
      files.push({ rel: `.codex/agents/${e.name}.toml`, content: injectHeader(lines.join('\n') + '\n', e.srcRel, '.toml') });
    }
  }
  if (Object.keys(ctx.mcpServers).length) {
    const lines = [];
    for (const [name, cfg] of Object.entries(ctx.mcpServers)) {
      lines.push(...renderTomlTable(`mcp_servers.${JSON.stringify(name).slice(1, -1)}`, cfg), '');
    }
    settings.push({ file: '.codex/config.toml', merge: 'toml-block', data: lines.join('\n').trimEnd() });
  }
  return { files, settings, validations };
}

// GEMINI CLI — curated subset of workflows → .gemini/commands/*.toml (opt out via `gemini: false`
// in workflow frontmatter). Curated, not a bulk mirror.
function gemini(entries) {
  const files = [];
  const validations = [];
  for (const e of entries) {
    if (e.type !== 'workflow' || e.fm?.gemini === false) continue;
    const desc = e.fm?.description || e.name;
    const prompt = normalizeEol(e.body).trim() + `\n\nCanonical source: ${e.srcRel}\n`;
    const content =
      headerFor(e.srcRel, '.toml') +
      '\n' +
      `description = ${JSON.stringify(desc)}\n` +
      `prompt = ${tomlMultiline(prompt)}\n`;
    files.push({ rel: `.gemini/commands/${e.name}.toml`, content });
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
      const content = e.subPath.endsWith('SKILL.md')
        ? injectHeader(stripFmTo(e, ['name', 'description']), e.srcRel, ext)
        : injectHeader(normalizeEol(e.raw), e.srcRel, ext);
      files.push({ rel: '.opencode/' + e.subPath, content });
    } else if (e.type === 'workflow') {
      const rel = `.opencode/commands/${e.name}.md`;
      // opencode expects provider/model form (e.g. anthropic/claude-haiku-4-5); a bare Claude
      // alias like `haiku` is meaningless here — drop it rather than emit a broken hint.
      const safe = e.fm?.model && !String(e.fm.model).includes('/') ? { ...e, fm: { ...e.fm, model: undefined } } : e;
      files.push({ rel, content: injectHeader(stripFmTo(safe, ['description', 'agent', 'model', 'subtask']), e.srcRel, '.md') });
    }
  }
  settings.push({
    file: '.opencode/package.json',
    merge: 'create-if-absent',
    data: JSON.stringify({ name: 'opencode-skills', private: true }, null, 2) + '\n',
  });
  const mcpServers = {};
  for (const [name, cfg] of Object.entries((ctx && ctx.mcpServers) || {})) {
    const command = Array.isArray(cfg.command)
      ? [...cfg.command, ...(Array.isArray(cfg.args) ? cfg.args : [])]
      : [cfg.command, ...(Array.isArray(cfg.args) ? cfg.args : [])];
    const server = { ...cfg, type: cfg.type || 'local', command };
    delete server.args;
    if (server.enabled === undefined && server.disabled === undefined) server.enabled = true;
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
    if (e.type === 'skill' && e.subPath.endsWith('SKILL.md')) {
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

export const adapters = { claude, codex, gemini, opencode, antigravity };
export const VENDORS = Object.keys(adapters);
