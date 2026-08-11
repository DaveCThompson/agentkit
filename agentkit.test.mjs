// agentkit.test.mjs — Phase-0 test suite (decision 27). The destructive paths — the ones that must
// never be wrong across 7 repos — can only be trusted through tests. Run: npm test
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  sha, globToRegex, matchesGlobs, classifyAgentFile, tierOf, selectEntries, scanKitAgent,
  planSync, syncProject, checkProject, adoptFile, mergeSettings, kbMatch, compileManifest, initProject,
  checkContentIntegrity, stackLint, taxonomyLint, renderWorkflowMap, runDoctor, harvestChecks, runVerify, changelogRoll, main, checkHygiene,
  orchestratorLock, surfaceOverlap, scaffoldGateScripts, scanSettingsHygiene, loadConfig, KIT_ROOT, printCheck,
  resolveBrowserProfile, validateBrowserProfile, verificationTreeIdentity, createVerificationReceipt, checkVerificationReceipt,
} from './agentkit.mjs';
import { parseFrontmatter, injectHeader, stripHeader, tomlMultiline, adapters, claudePermissionsBaseline } from './adapters.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(HERE, '.tmp-test');

function write(root, rel, content) {
  const abs = path.join(root, ...rel.split('/'));
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  return abs;
}
function read(root, rel) {
  return fs.readFileSync(path.join(root, ...rel.split('/')), 'utf8');
}
function exists(root, rel) {
  return fs.existsSync(path.join(root, ...rel.split('/')));
}

const SKILL_MD = `---
name: implement-feature
description: Build a feature from an approved plan.
triggers: [build, implement]
applies-to: [src/**]
required-tools: [codebase-mcp]
orchestration: single
tier: core
---

# Implement Feature

Do the work.
`;

const TECH_SKILL_MD = `---
name: react-performance
description: React render performance tuning.
tier: tech:react
---

# React Performance
`;

const RULE_MD = `---
trigger: always
---

# Git Protocol

Commit early.
`;

const WORKFLOW_MD = `---
description: Plan a feature end to end.
---

# Plan Workflow

Step 1: think.
`;

const WORKFLOW_NO_GEMINI = `---
description: Internal workflow.
gemini: false
---

# Internal
`;

function mkKit() {
  const kit = fs.mkdtempSync(path.join(TMP, 'kit-'));
  write(kit, 'package.json', JSON.stringify({ name: 'agentkit', version: '0.1.0' }));
  write(kit, 'CHANGELOG.md', '# Changelog\n');
  write(kit, '.agent/skills/implement-feature/SKILL.md', SKILL_MD);
  write(kit, '.agent/skills/implement-feature/references/notes.md', '# Notes\nExtra file.\n');
  write(kit, '.agent/skills/react-performance/SKILL.md', TECH_SKILL_MD);
  write(kit, '.agent/rules/git-protocol.md', RULE_MD);
  write(kit, '.agent/workflows/plan.md', WORKFLOW_MD);
  write(kit, '.agent/workflows/internal.md', WORKFLOW_NO_GEMINI);
  write(kit, '.agent/hooks.json', JSON.stringify([
    { event: 'SessionStart', command: 'node "{KIT}" check --quick --json', vendors: ['claude'] },
  ]));
  write(kit, 'integrations/codebase-mcp.md', `---
name: codebase-mcp
mcp-name: codebase-memory
mcp:
  command: codebase-memory-mcp.exe
  args: []
check-command: node --version
last-verified: 2026-07-02
---

# Codebase MCP
`);
  write(kit, 'fleet.json', JSON.stringify({ members: [] }));
  return kit;
}

function mkProject(cfg = {}) {
  const proj = fs.mkdtempSync(path.join(TMP, 'proj-'));
  write(proj, '.agentkit.json', JSON.stringify({
    vendors: ['claude', 'codex', 'gemini', 'opencode', 'antigravity'],
    stack: ['react'],
    tools: ['codebase-mcp'],
    overlay: { rules: ['domain-*', 'project-*'], skills: ['domain-*', 'project-*'], workflows: [] },
    pins: {},
    ...cfg,
  }));
  return proj;
}

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
after(() => fs.rmSync(TMP, { recursive: true, force: true }));

// ---------- unit: utils ----------

test('globToRegex: **, *, ? semantics', () => {
  assert.ok(globToRegex('domain-*').test('domain-content'));
  assert.ok(!globToRegex('domain-*').test('rules/domain-content'));
  assert.ok(globToRegex('src/**').test('src/a/b/c.ts'));
  assert.ok(globToRegex('*.md').test('README.md'));
  assert.ok(!globToRegex('*.md').test('a/README.md'));
});

test('matchesGlobs matches whole path, segments, and stems', () => {
  assert.ok(matchesGlobs(['domain-*'], 'rules/domain-content.md'));
  assert.ok(matchesGlobs(['domain-*'], 'skills/domain-x/SKILL.md'));
  assert.ok(!matchesGlobs(['domain-*'], 'skills/audit-code/SKILL.md'));
});

test('browser profiles resolve conservatively and validate declared harnesses', () => {
  const fallback = resolveBrowserProfile({});
  assert.equal(fallback.profile, 'human-only');
  assert.equal(fallback.conservative, true);
  assert.equal(fallback.runtime, 'needs-human-verify');

  const deterministic = { verification: { browser: {
    profile: 'deterministic-harness', harness: 'playwright', target: 'http://localhost:3000', flow: 'docs/browser.md',
  } } };
  assert.equal(resolveBrowserProfile(deterministic).profile, 'deterministic-harness');
  assert.deepEqual(validateBrowserProfile(deterministic), []);
  const missingHarness = validateBrowserProfile({ verification: { browser: { profile: 'deterministic-harness' } } });
  assert.ok(missingHarness.some((x) => x.level === 'error' && /requires/.test(x.msg)), JSON.stringify(missingHarness));
  const unknown = validateBrowserProfile({ verification: { browser: { profile: 'vendor-magical' } } });
  assert.ok(unknown.some((x) => x.level === 'error'), JSON.stringify(unknown));
});

test('verification receipts match exact working-tree content and exclude their own file', () => {
  const proj = mkProject();
  write(proj, 'app/example.ts', 'export const value = 1;\n');
  const before = verificationTreeIdentity(proj);
  const receiptPath = path.join(proj, '.agentkit', 'verification', 'machine.json');
  const receipt = createVerificationReceipt(proj, {
    lane: 'machine', command: 'npm test', status: 'passed', exitCode: 0,
    outPath: receiptPath, notes: 'fixture',
  });
  write(proj, '.agentkit/verification/machine.json', JSON.stringify(receipt));
  let checked = checkVerificationReceipt(proj, receipt, { receiptPath });
  assert.equal(checked.reusable, true, JSON.stringify(checked));
  assert.equal(checkVerificationReceipt(proj, { ...receipt, schemaVersion: 99 }, { receiptPath }).reusable, false, 'unknown receipt schema is not reusable');
  assert.equal(before.digest, receipt.tree.digest, 'receipt writing must not change the covered identity');
  write(proj, 'app/example.ts', 'export const value = 2;\n');
  checked = checkVerificationReceipt(proj, receipt, { receiptPath });
  assert.equal(checked.reusable, false, 'a changed source invalidates prior evidence');
  assert.equal(checked.reason, 'tree identity changed');
});

test('receipt CLI writes JSON and rejects stale evidence', () => {
  const proj = mkProject();
  write(proj, 'app/example.ts', 'export const value = 1;\n');
  const receiptRel = '.agentkit/verification/cli.json';
  assert.equal(main(['receipt', proj, '--lane', 'machine', '--command', 'npm test', '--status', 'passed', '--exit-code', '0', '--out', receiptRel]), 0);
  assert.equal(main(['receipt', proj, '--check', receiptRel]), 0);
  write(proj, 'app/example.ts', 'export const value = 3;\n');
  assert.equal(main(['receipt', proj, '--check', receiptRel]), 1);
});

test('clean receipt reuses an identical tree after metadata-only commit changes', () => {
  const proj = mkProject();
  write(proj, 'app/example.ts', 'export const value = 1;\n');
  execFileSync('git', ['init', '-q'], { cwd: proj });
  execFileSync('git', ['add', '.'], { cwd: proj });
  execFileSync('git', ['-c', 'user.name=AgentKit Test', '-c', 'user.email=agentkit@example.test', 'commit', '-qm', 'initial'], { cwd: proj });
  const receipt = createVerificationReceipt(proj, { lane: 'machine', command: 'npm test', status: 'passed', exitCode: 0 });
  const metadataOnly = { ...receipt, tree: { ...receipt.tree, commit: 'metadata-only-different-commit' } };
  assert.equal(checkVerificationReceipt(proj, metadataOnly).reusable, true);
});

test('frontmatter: superset parse + nested map + lists', () => {
  const { fm, body } = parseFrontmatter(SKILL_MD);
  assert.equal(fm.name, 'implement-feature');
  assert.deepEqual(fm.triggers, ['build', 'implement']);
  assert.deepEqual(fm['applies-to'], ['src/**']);
  assert.ok(body.includes('# Implement Feature'));
  const integ = parseFrontmatter(`---\nmcp:\n  command: x.exe\n  args: []\n---\nbody`);
  assert.deepEqual(integ.fm.mcp, { command: 'x.exe', args: [] });
});

test('injectHeader after frontmatter; stripHeader removes it', () => {
  const out = injectHeader(SKILL_MD, '.agent/skills/implement-feature/SKILL.md', '.md');
  const lines = out.split('\n');
  const fmEnd = lines.indexOf('---', 1);
  assert.ok(lines[fmEnd + 1].includes('AGENTKIT GENERATED'));
  assert.equal(stripHeader(out), SKILL_MD.replace(/\r\n/g, '\n'));
});

test('tomlMultiline escapes backslashes and triple quotes', () => {
  const s = tomlMultiline('a\\b """ c');
  assert.ok(s.includes('a\\\\b'));
  assert.ok(!s.slice(4, -4).includes('"""'));
});

test('classify + tier defaults', () => {
  assert.deepEqual(classifyAgentFile('skills/x/SKILL.md'), { type: 'skill', name: 'x' });
  assert.deepEqual(classifyAgentFile('rules/git-protocol.md'), { type: 'rule', name: 'git-protocol' });
  assert.equal(tierOf(null, 'rule', 'domain-content'), 'overlay');
  assert.equal(tierOf(null, 'rule', 'foundation-a11y'), 'core');
  assert.equal(tierOf({ tier: 'tech:react' }, 'skill', 'x'), 'tech:react');
});

test('claude adapter maps glob-triggered rule to path-scoped rule', () => {
  const { fm, body } = parseFrontmatter('---\ntrigger: glob\nglobs: "**/*Atom*.ts"\n---\n\n# State rules\n');
  const entry = { srcRel: '.agent/rules/pattern-state.md', subPath: 'rules/pattern-state.md', type: 'rule', name: 'pattern-state', owner: 'core', fm, body, raw: '' };
  const out = adapters.claude([entry], { hooks: [], mcpServers: {} });
  const rule = out.files.find((f) => f.rel === '.claude/rules/pattern-state.md');
  assert.ok(rule.content.includes('paths: [**/*Atom*.ts]'));
  assert.ok(rule.content.includes('# State rules'));
});

test('claude adapter maps model-decision rule to a menu-hidden rule- skill', () => {
  const { fm, body } = parseFrontmatter('---\ntrigger: model-decision\ndescription: Consult before error handling work.\n---\n\n# Error rules\n');
  const md = { srcRel: '.agent/rules/pattern-error-handling.md', subPath: 'rules/pattern-error-handling.md', type: 'rule', name: 'pattern-error-handling', owner: 'core', fm, body, raw: '' };
  const always = { srcRel: '.agent/rules/git-protocol.md', subPath: 'rules/git-protocol.md', type: 'rule', name: 'git-protocol', owner: 'core', fm: { trigger: 'always' }, body: '# Git Protocol\n', raw: '' };
  const out = adapters.claude([md, always], { hooks: [], mcpServers: {} });

  const skill = out.files.find((f) => f.rel === '.claude/skills/rule-pattern-error-handling/SKILL.md');
  assert.ok(skill, 'model-decision rule emits a rule- skill');
  assert.ok(skill.content.includes('name: rule-pattern-error-handling'));
  assert.ok(skill.content.includes('description: Consult before error handling work.'));
  assert.ok(skill.content.includes('user-invocable: false'), 'rule- skill hidden from the / menu');
  assert.ok(skill.content.includes('# Error rules'), 'rule body rides in the skill');
  assert.ok(!out.files.some((f) => f.rel === '.claude/rules/pattern-error-handling.md'), 'no always-on rule emitted for model-decision');
  // regression: trigger: always still uses the native rules surface
  assert.ok(out.files.some((f) => f.rel === '.claude/rules/git-protocol.md'), 'always rule keeps .claude/rules/');
  assert.equal(out.validations.length, 0);
});

test('model-decision rule without description warns; rule-/skill name collision errors', () => {
  const bare = { srcRel: '.agent/rules/pattern-x.md', subPath: 'rules/pattern-x.md', type: 'rule', name: 'pattern-x', owner: 'core', fm: { trigger: 'model-decision' }, body: '# X\n', raw: '' };
  const out = adapters.claude([bare], { hooks: [], mcpServers: {} });
  assert.ok(out.validations.some((v) => v.level === 'warn' && v.msg.includes('lacks description')), 'missing description warns');
  const skill = out.files.find((f) => f.rel === '.claude/skills/rule-pattern-x/SKILL.md');
  assert.ok(skill.content.includes('description:'), 'fallback description still emitted');

  const squatter = { srcRel: '.agent/skills/rule-pattern-x/SKILL.md', subPath: 'skills/rule-pattern-x/SKILL.md', type: 'skill', name: 'rule-pattern-x', owner: 'core', fm: { name: 'rule-pattern-x', description: 'A real skill squatting the rule- prefix.' }, body: '# Squat\n', raw: '' };
  const out2 = adapters.claude([bare, squatter], { hooks: [], mcpServers: {} });
  assert.ok(out2.validations.some((v) => v.level === 'error' && v.msg.includes("collides with existing skill 'rule-pattern-x'")), 'collision is an error');
});

test('model-decision→always flip: sync prunes the rule- skill and writes the rule (and back)', () => {
  const kit = mkKit();
  write(kit, '.agent/rules/pattern-nav.md', '---\ntrigger: model-decision\ndescription: Consult when adding routes.\n---\n\n# Nav rules\n');
  const proj = mkProject();
  const r = syncProject(proj, { kitRoot: kit });
  assert.ok(r.ok, JSON.stringify(r));
  assert.ok(exists(proj, '.claude/skills/rule-pattern-nav/SKILL.md'), 'rule- skill lands');
  assert.ok(!exists(proj, '.claude/rules/pattern-nav.md'), 'no always-on rule file');
  const second = syncProject(proj, { kitRoot: kit });
  assert.equal(second.written.length, 0, 'idempotent');

  // reclassify to always → the skill is pruned, the rule file appears
  write(kit, '.agent/rules/pattern-nav.md', '---\ntrigger: always\n---\n\n# Nav rules\n');
  const third = syncProject(proj, { kitRoot: kit });
  assert.ok(third.ok, JSON.stringify(third));
  assert.ok(!exists(proj, '.claude/skills/rule-pattern-nav/SKILL.md'), 'stale rule- skill pruned');
  assert.ok(exists(proj, '.claude/rules/pattern-nav.md'), 'always rule written');
});

test('opencode drops a bare model hint; keeps provider/model form; claude passes it through', () => {
  const bare = { srcRel: '.agent/workflows/quick-fix.md', subPath: 'workflows/quick-fix.md', type: 'workflow', name: 'quick-fix', owner: 'core', fm: { description: 'Fix.', model: 'haiku' }, body: '# QF\n', raw: '' };
  const scoped = { srcRel: '.agent/workflows/deep.md', subPath: 'workflows/deep.md', type: 'workflow', name: 'deep', owner: 'core', fm: { description: 'Deep.', model: 'anthropic/claude-opus-4-8' }, body: '# Deep\n', raw: '' };
  const ctx = { hooks: [], mcpServers: {} };
  const oc = adapters.opencode([bare, scoped], ctx);
  assert.ok(!oc.files.find((f) => f.rel === '.opencode/commands/quick-fix.md').content.includes('model:'), 'bare alias dropped for opencode');
  assert.ok(oc.files.find((f) => f.rel === '.opencode/commands/deep.md').content.includes('model: anthropic/claude-opus-4-8'), 'provider/model form kept');
  const cl = adapters.claude([bare], ctx);
  assert.ok(cl.files.find((f) => f.rel === '.claude/commands/quick-fix.md').content.includes('model: haiku'), 'claude keeps the alias');
});

test('opencode emits native project MCP config and preserves user servers', () => {
  const out = adapters.opencode([], {
    hooks: [],
    mcpServers: { 'codebase-memory': { command: 'codebase-memory-mcp.exe', args: ['--ui=false'] } },
  });
  const action = out.settings.find((s) => s.file === 'opencode.json');
  assert.equal(action.merge, 'opencode-mcp');
  assert.deepEqual(action.data['codebase-memory'], {
    command: ['codebase-memory-mcp.exe', '--ui=false'],
    type: 'local',
    enabled: true,
  });

  const merged = mergeSettings(
    action,
    JSON.stringify({ custom: true, mcp: { user: { type: 'remote', url: 'https://example.test/mcp' } } }),
    [],
  );
  const config = JSON.parse(merged.content);
  assert.equal(config.custom, true);
  assert.ok(config.mcp.user);
  assert.ok(config.mcp['codebase-memory']);
});

// ---------- golden-file adapter outputs ----------

test('sync generates per-vendor native files (golden)', () => {
  const kit = mkKit();
  const proj = mkProject();
  const r = syncProject(proj, { kitRoot: kit });
  assert.ok(r.ok, JSON.stringify(r));

  // canonical .agent copy, with header after frontmatter
  const agentCopy = read(proj, '.agent/skills/implement-feature/SKILL.md');
  assert.ok(agentCopy.includes('AGENTKIT GENERATED'));

  // claude: skill with stripped superset frontmatter (no triggers/tier), command from workflow
  const cSkill = read(proj, '.claude/skills/implement-feature/SKILL.md');
  assert.ok(cSkill.startsWith('---\n'), 'frontmatter must stay at byte 0');
  assert.ok(cSkill.includes('name: implement-feature'));
  assert.ok(!cSkill.includes('triggers:'), 'superset keys stripped for claude');
  assert.ok(!cSkill.includes('tier:'));
  assert.ok(exists(proj, '.claude/skills/implement-feature/references/notes.md'));
  const cCmd = read(proj, '.claude/commands/plan.md');
  assert.ok(cCmd.includes('description: Plan a feature end to end.'));

  // claude rules: canonical rule → .claude/rules/<name>.md (trigger: always → no paths frontmatter)
  const cRule = read(proj, '.claude/rules/git-protocol.md');
  assert.ok(cRule.includes('# Git Protocol'));
  assert.ok(!cRule.includes('trigger:'), 'canonical trigger key stripped');

  // codex: .agents/skills (documented native surface), no .codex skills
  assert.ok(exists(proj, '.agents/skills/implement-feature/SKILL.md'));
  assert.ok(!exists(proj, '.codex/skills'));
  // codex has no commands surface → workflows ride in as wf-prefixed skills
  const codexWf = read(proj, '.agents/skills/wf-plan/SKILL.md');
  assert.ok(codexWf.includes('name: wf-plan'), 'codex workflow skill carries wf- name');
  assert.ok(codexWf.includes('description: Plan a feature end to end.'));
  assert.ok(codexWf.includes('# Plan Workflow'), 'codex workflow skill carries the workflow body');
  assert.ok(exists(proj, '.agents/skills/wf-internal/SKILL.md'), 'gemini:false does not gate codex');
  const codexToml = read(proj, '.codex/config.toml');
  assert.ok(codexToml.includes('AGENTKIT MANAGED'));
  assert.ok(codexToml.includes('[mcp_servers.codebase-memory]'));

  // gemini: workflow → command toml; gemini:false workflow excluded
  const toml = read(proj, '.gemini/commands/plan.toml');
  assert.ok(toml.includes('description = "Plan a feature end to end."'));
  assert.ok(toml.includes('prompt = """'));
  assert.ok(!exists(proj, '.gemini/commands/internal.toml'));

  // opencode: skills + native workflow commands + package.json created
  assert.ok(exists(proj, '.opencode/skills/implement-feature/SKILL.md'));
  assert.ok(exists(proj, '.opencode/package.json'));
  const ocCmd = read(proj, '.opencode/commands/plan.md');
  assert.ok(ocCmd.startsWith('---\n'), 'opencode command frontmatter at byte 0');
  assert.ok(ocCmd.includes('description: Plan a feature end to end.'));
  assert.ok(ocCmd.includes('# Plan Workflow'), 'opencode command carries the workflow body');
  assert.ok(exists(proj, '.opencode/commands/internal.md'), 'gemini:false does not gate opencode');
  assert.ok(!exists(proj, '.opencode/skills/wf-plan'), 'opencode uses commands, not wf-skills');
  const opencodeConfig = JSON.parse(read(proj, 'opencode.json'));
  assert.deepEqual(opencodeConfig.mcp['codebase-memory'].command, ['codebase-memory-mcp.exe']);
  assert.equal(opencodeConfig.mcp['codebase-memory'].enabled, true);

  // antigravity: nothing generated
  assert.ok(!exists(proj, '.antigravity'));

  // claude hooks + mcp key-merge
  const settings = JSON.parse(read(proj, '.claude/settings.json'));
  assert.equal(settings.hooks.SessionStart[0].hooks[0].type, 'command');
  assert.ok(settings.hooks.SessionStart[0].hooks[0].command.includes('agentkit'));
  const mcp = JSON.parse(read(proj, '.mcp.json'));
  assert.ok(mcp.mcpServers['codebase-memory']);

  // lock written and committed-shaped
  const lock = JSON.parse(read(proj, '.agentkit.lock'));
  assert.equal(lock.kitVersion, '0.1.0');
  assert.ok(Object.keys(lock.files).length > 10);
});

test('workflow routing: opencode→command, codex→wf-skill, claude→command-only', () => {
  const wf = { srcRel: '.agent/workflows/plan.md', subPath: 'workflows/plan.md', type: 'workflow', name: 'plan', owner: 'core', fm: { description: 'Plan a feature.' }, body: '# Plan Workflow\n\nStep 1.\n', raw: '' };
  const ctx = { hooks: [], mcpServers: {} };

  // opencode: native command markdown, NOT a skill
  const oc = adapters.opencode([wf], ctx);
  const ocCmd = oc.files.find((f) => f.rel === '.opencode/commands/plan.md');
  assert.ok(ocCmd, 'opencode emits .opencode/commands/plan.md');
  assert.ok(ocCmd.content.includes('description: Plan a feature.'));
  assert.ok(ocCmd.content.includes('# Plan Workflow'));
  assert.ok(!oc.files.some((f) => f.rel.startsWith('.opencode/skills/')), 'opencode workflow is not a skill');

  // codex: wf-prefixed skill (no commands surface)
  const cx = adapters.codex([wf], ctx);
  const cxSkill = cx.files.find((f) => f.rel === '.agents/skills/wf-plan/SKILL.md');
  assert.ok(cxSkill, 'codex emits .agents/skills/wf-plan/SKILL.md');
  assert.ok(cxSkill.content.includes('name: wf-plan'));

  // claude: command only, never also a passthrough skill (adapters.mjs:160 rule)
  const cl = adapters.claude([wf], ctx);
  assert.ok(cl.files.some((f) => f.rel === '.claude/commands/plan.md'), 'claude emits a command');
  assert.ok(!cl.files.some((f) => f.rel.startsWith('.claude/skills/')), 'claude never emits a workflow skill');
});

test('wf- prefix prevents collision between a workflow and a skill of the same name', () => {
  // vet-hard exists as BOTH a workflow and a skill — the real collision the prefix guards.
  const skill = { srcRel: '.agent/skills/vet-hard/SKILL.md', subPath: 'skills/vet-hard/SKILL.md', type: 'skill', name: 'vet-hard', owner: 'core', fm: { name: 'vet-hard', description: 'Adversarial review skill.' }, body: '# Vet Hard\n', raw: '' };
  const workflow = { srcRel: '.agent/workflows/vet-hard.md', subPath: 'workflows/vet-hard.md', type: 'workflow', name: 'vet-hard', owner: 'core', fm: { description: 'Adversarial review workflow.' }, body: '# Vet Hard Workflow\n', raw: '' };
  const cx = adapters.codex([skill, workflow], { hooks: [], mcpServers: {} });
  const rels = cx.files.map((f) => f.rel);
  assert.ok(rels.includes('.agents/skills/vet-hard/SKILL.md'), 'real skill survives');
  assert.ok(rels.includes('.agents/skills/wf-vet-hard/SKILL.md'), 'workflow lands under wf- prefix');
  assert.equal(new Set(rels).size, rels.length, 'no two outputs share a path');
});

test('workflow skill: pairing hides the paired skill from the Claude slash menu only', () => {
  const paired = { srcRel: '.agent/skills/implement-session-wrap-up/SKILL.md', subPath: 'skills/implement-session-wrap-up/SKILL.md', type: 'skill', name: 'implement-session-wrap-up', owner: 'core', fm: { name: 'implement-session-wrap-up', description: 'Close a session.' }, body: '# Wrap Up\n', raw: '' };
  const unpaired = { srcRel: '.agent/skills/audit-code/SKILL.md', subPath: 'skills/audit-code/SKILL.md', type: 'skill', name: 'audit-code', owner: 'core', fm: { name: 'audit-code', description: 'Technical review.' }, body: '# Audit Code\n', raw: '' };
  const wf = { srcRel: '.agent/workflows/wrap-up.md', subPath: 'workflows/wrap-up.md', type: 'workflow', name: 'wrap-up', owner: 'core', fm: { description: 'Session exit protocol.', skill: 'implement-session-wrap-up' }, body: '# Wrap Workflow\n\nStep 1.\n', raw: '' };
  const ctx = { hooks: [], mcpServers: {} };

  const cl = adapters.claude([paired, unpaired, wf], ctx);
  const pairedOut = cl.files.find((f) => f.rel === '.claude/skills/implement-session-wrap-up/SKILL.md');
  assert.ok(pairedOut.content.includes('user-invocable: false'), 'paired skill hidden from the / menu');
  const unpairedOut = cl.files.find((f) => f.rel === '.claude/skills/audit-code/SKILL.md');
  assert.ok(!unpairedOut.content.includes('user-invocable'), 'unpaired skill untouched');
  const cmd = cl.files.find((f) => f.rel === '.claude/commands/wrap-up.md');
  assert.ok(cmd, 'command still emitted');
  assert.ok(!cmd.content.includes('skill:'), 'skill: key stripped from the command');
  assert.equal(cl.validations.length, 0, 'no warn when the paired skill exists');

  // other vendors structurally unaffected — no hide key anywhere
  for (const vendor of ['codex', 'opencode']) {
    const out = adapters[vendor]([paired, unpaired, wf], ctx);
    assert.ok(!out.files.some((f) => f.content.includes('user-invocable')), `${vendor} never carries user-invocable`);
  }
});

test('dangling workflow skill: reference warns without blocking the command', () => {
  const wf = { srcRel: '.agent/workflows/plan.md', subPath: 'workflows/plan.md', type: 'workflow', name: 'plan', owner: 'core', fm: { description: 'Plan.', skill: 'no-such-skill' }, body: '# Plan Workflow\n', raw: '' };
  const cl = adapters.claude([wf], { hooks: [], mcpServers: {} });
  assert.ok(cl.files.some((f) => f.rel === '.claude/commands/plan.md'), 'command still emitted');
  const warn = cl.validations.find((v) => v.level === 'warn' && v.msg.includes('no-such-skill'));
  assert.ok(warn, 'warn names the missing skill');
});

test('skill: pairing end-to-end: lock tracks the hidden skill; sync stays idempotent', () => {
  const kit = mkKit();
  write(kit, '.agent/workflows/feature.md', '---\ndescription: Build a feature.\nskill: implement-feature\n---\n\n# Feature Workflow\n');
  const proj = mkProject();
  const r = syncProject(proj, { kitRoot: kit });
  assert.ok(r.ok, JSON.stringify(r));
  const skill = read(proj, '.claude/skills/implement-feature/SKILL.md');
  assert.ok(skill.includes('user-invocable: false'), 'paired skill hidden after real sync');
  const lock = JSON.parse(read(proj, '.agentkit.lock'));
  assert.ok(lock.files['.claude/skills/implement-feature/SKILL.md'], 'lock tracks the hidden skill');
  const second = syncProject(proj, { kitRoot: kit });
  assert.equal(second.written.length, 0, 'second sync writes zero');
});

test('tech-tier selection: react skill ships only when stack declares react', () => {
  const kit = mkKit();
  const withReact = mkProject({ stack: ['react'] });
  syncProject(withReact, { kitRoot: kit });
  assert.ok(exists(withReact, '.claude/skills/react-performance/SKILL.md'));

  const noReact = mkProject({ stack: [] });
  syncProject(noReact, { kitRoot: kit });
  assert.ok(!exists(noReact, '.claude/skills/react-performance/SKILL.md'));
  assert.ok(exists(noReact, '.claude/skills/implement-feature/SKILL.md'));
});

// ---------- D2: kinds-axis snapshot (the merge gate's spine — TICKET-akit-p2-kinds-axis.md) ----------

// Golden selected-entry srcRel list captured against the REAL kit's .agent sources at the
// `pre-kinds` tag (agentkit commit bf3350d), for an empty, kinds-ABSENT config. The kinds axis
// (loadConfig defaulting cfg.kinds to ['app'], selectEntries gating `tier: kind:<k>` on it) and
// the app-catalog re-tier must never change this set — that identity is the whole point of
// defaulting kinds to ['app']. If this array ever needs to change, the change must be re-derived
// from an explicit, reviewed decision — never hand-patched to make a failing run go green.
//
// TICKET-akit-p3-testing-split (reviewed addition, not a hand-patch): the split adds a genuinely
// NEW asset, `.agent/rules/tech-node-gate.md` (tier: kind:app), that did not exist at the
// `pre-kinds` tag — it did not move from anywhere in the pre-kinds tree, so there is nothing to
// re-tier. Under kinds-absent (defaults to ['app']) it correctly joins the default selection, so
// the golden list gains exactly this one entry. Everything else in the list is unchanged, proving
// the split itself (as opposed to the new file's addition) had zero selection impact.
//
// TICKET-akit-p2.1 (hotfix, post-merge): the original capture embedded a latent selection bug —
// nested skill files (references/*.md) carried no tier: of their own and defaulted to 'core',
// shipping unconditionally regardless of their owning SKILL.md's gate. The fix (nested-file tier
// inheritance from the sibling SKILL.md) legitimately removed exactly 14 entries below: the 9
// audit-web-interface (tier: tech:web) and 5 react-performance (tier: tech:react) reference files.
// This is the second reviewed, intentional re-derivation the warning above anticipates.
// Communication-writing update (2026-08-10, reviewed addition): the three new core assets below
// intentionally join the default selection. They are not a re-tiering or an accidental selection
// change: they provide the requested session, ticket, and UI-copy guidance.
const PRE_KINDS_SNAPSHOT = [
  '.agent/hooks.json',
  '.agent/rules/foundation-accessibility.md',
  '.agent/rules/foundation-browser-usage.md',
  '.agent/rules/foundation-communication.md',
  '.agent/rules/foundation-design-system.md',
  '.agent/rules/foundation-design-tokens.md',
  '.agent/rules/foundation-performance.md',
  '.agent/rules/foundation-security.md',
  '.agent/rules/foundation-testing.md',
  '.agent/rules/git-protocol.md',
  '.agent/rules/pattern-agent-orchestration.md',
  '.agent/rules/pattern-code-standards.md',
  '.agent/rules/pattern-command-shape.md',
  '.agent/rules/pattern-component-props.md',
  '.agent/rules/pattern-design-parity.md',
  '.agent/rules/pattern-docs-artifacts.md',
  '.agent/rules/pattern-error-handling.md',
  '.agent/rules/pattern-external-mutation.md',
  '.agent/rules/pattern-feature-scaffolding.md',
  '.agent/rules/pattern-inputs.md',
  '.agent/rules/pattern-interactions.md',
  '.agent/rules/pattern-monorepo.md',
  '.agent/rules/pattern-navigation.md',
  '.agent/rules/pattern-refactoring.md',
  '.agent/rules/pattern-state.md',
  '.agent/rules/pattern-structure.md',
  '.agent/rules/pattern-ui-copy.md',
  '.agent/rules/tech-node-gate.md',
  '.agent/skills/_templates/COMPOSE-EDITORIAL-TEMPLATE.md',
  '.agent/skills/_templates/SKILL-TEMPLATE.md',
  '.agent/skills/_templates/SKILL.md',
  '.agent/skills/audit-accessibility/SKILL.md',
  '.agent/skills/audit-code/SKILL.md',
  '.agent/skills/audit-design-system/SKILL.md',
  '.agent/skills/audit-docs/SKILL.md',
  '.agent/skills/audit-hygiene-enforcement/SKILL.md',
  '.agent/skills/audit-layout/SKILL.md',
  '.agent/skills/audit-performance/SKILL.md',
  '.agent/skills/audit-refactor-opportunities/SKILL.md',
  '.agent/skills/audit-security/SKILL.md',
  '.agent/skills/audit-typography/SKILL.md',
  '.agent/skills/blindspot-pass/SKILL.md',
  '.agent/skills/debug-deep/SKILL.md',
  '.agent/skills/debug-standard/SKILL.md',
  '.agent/skills/explore-concept/SKILL.md',
  '.agent/skills/explore-tech/SKILL.md',
  '.agent/skills/explore-ui-design/SKILL.md',
  '.agent/skills/explore-ux/SKILL.md',
  '.agent/skills/handoff/SKILL.md',
  '.agent/skills/health-agent/SKILL.md',
  '.agent/skills/implement-feature/SKILL.md',
  '.agent/skills/implement-flight-check/SKILL.md',
  '.agent/skills/implement-quick-fix/SKILL.md',
  '.agent/skills/implement-refactor/SKILL.md',
  '.agent/skills/implement-session-land/SKILL.md',
  '.agent/skills/implement-session-wrap-up/SKILL.md',
  '.agent/skills/implement-test/SKILL.md',
  '.agent/skills/kit-contribute/SKILL.md',
  '.agent/skills/maintain-docs/SKILL.md',
  '.agent/skills/optimize-agent/SKILL.md',
  '.agent/skills/orchestrate-decompose/SKILL.md',
  '.agent/skills/orchestrate-kickoff/SKILL.md',
  '.agent/skills/orchestrate-merge-train/SKILL.md',
  '.agent/skills/orchestrate-partition/SKILL.md',
  '.agent/skills/orchestrate-sequence/SKILL.md',
  '.agent/skills/performance-fix/SKILL.md',
  '.agent/skills/plan-architecture/SKILL.md',
  '.agent/skills/plan-feature/SKILL.md',
  '.agent/skills/plan-prd/SKILL.md',
  '.agent/skills/project-onboard/SKILL.md',
  '.agent/skills/reference-hunt/SKILL.md',
  '.agent/skills/refine-code/SKILL.md',
  '.agent/skills/research-curate/SKILL.md',
  '.agent/skills/research-deep/SKILL.md',
  '.agent/skills/research-synthesize/SKILL.md',
  '.agent/skills/review-peer/SKILL.md',
  '.agent/skills/review-raise-bar/SKILL.md',
  '.agent/skills/security-fix/SKILL.md',
  '.agent/skills/sweep-codebase/SKILL.md',
  '.agent/skills/use-codegraph/SKILL.md',
  '.agent/skills/use-codegraph/agents/openai.yaml',
  '.agent/skills/verify-rules/SKILL.md',
  '.agent/skills/vet-hard/SKILL.md',
  '.agent/skills/vet-simple/SKILL.md',
  '.agent/skills/worker-bootstrap/SKILL.md',
  '.agent/skills/worker-execute/SKILL.md',
  '.agent/skills/worker-report/SKILL.md',
  '.agent/skills/write-clear/SKILL.md',
  '.agent/workflows/architect.md',
  '.agent/workflows/async-maint.md',
  '.agent/workflows/audit.md',
  '.agent/workflows/backlog-status.md',
  '.agent/workflows/build.md',
  '.agent/workflows/debug.md',
  '.agent/workflows/explore.md',
  '.agent/workflows/land.md',
  '.agent/workflows/onboard.md',
  '.agent/workflows/plan.md',
  '.agent/workflows/prd.md',
  '.agent/workflows/quick-fix.md',
  '.agent/workflows/refactor.md',
  '.agent/workflows/research.md',
  '.agent/workflows/ship.md',
  '.agent/workflows/test.md',
  '.agent/workflows/verify-pre-deploy.md',
  '.agent/workflows/wrap-up.md',
].sort();

test('D2 snapshot: kinds-absent config selects byte-identically to the pre-kinds baseline (real kit sources)', () => {
  const entries = scanKitAgent(KIT_ROOT);
  const cfg = { vendors: ['claude', 'codex'], stack: [], overlay: {} }; // `kinds` intentionally absent
  const selected = selectEntries(entries, cfg).map((e) => e.srcRel).sort();
  const added = selected.filter((s) => !PRE_KINDS_SNAPSHOT.includes(s));
  const removed = PRE_KINDS_SNAPSHOT.filter((s) => !selected.includes(s));
  assert.deepEqual(selected, PRE_KINDS_SNAPSHOT, JSON.stringify({ added, removed }, null, 2));
});

test('kind-tier selection: kind:app ships to unset/app kinds, not to a non-app kind; core still ships regardless', () => {
  const kit = mkKit();
  write(kit, '.agent/skills/audit-design-system/SKILL.md', '---\nname: audit-design-system\ndescription: App-catalog design audit.\ntier: kind:app\n---\n\n# Audit Design System\n');

  // (a) kinds unset on the project config → defaults to ['app'] → ships
  const unset = mkProject({ stack: [] });
  syncProject(unset, { kitRoot: kit });
  assert.ok(exists(unset, '.claude/skills/audit-design-system/SKILL.md'), 'kind:app ships when kinds is unset (defaults to app)');

  // (a) kinds explicitly ['app'] → ships
  const explicitApp = mkProject({ stack: [], kinds: ['app'] });
  syncProject(explicitApp, { kitRoot: kit });
  assert.ok(exists(explicitApp, '.claude/skills/audit-design-system/SKILL.md'), 'kind:app ships when kinds explicitly includes app');

  // (a) kinds ['knowledge'] (no 'app') → does not ship; core assets still ship
  const knowledge = mkProject({ stack: [], kinds: ['knowledge'] });
  syncProject(knowledge, { kitRoot: kit });
  assert.ok(!exists(knowledge, '.claude/skills/audit-design-system/SKILL.md'), 'kind:app does not ship to a knowledge-kind project');
  assert.ok(exists(knowledge, '.claude/skills/implement-feature/SKILL.md'), 'core assets ship regardless of kinds');

  // (b) mixed non-app kinds ['knowledge', 'agent-infra'] → zero kind:app assets
  const mixed = mkProject({ stack: [], kinds: ['knowledge', 'agent-infra'] });
  syncProject(mixed, { kitRoot: kit });
  assert.ok(!exists(mixed, '.claude/skills/audit-design-system/SKILL.md'), 'mixed non-app kinds receives zero kind:app assets');
});

test('kind:app respects overlay-glob shadow precedence exactly like every other non-core tier (c)', () => {
  const kit = mkKit();
  write(kit, '.agent/skills/project-widget/SKILL.md', '---\nname: project-widget\ndescription: d\ntier: kind:app\n---\n# W\n');
  write(kit, '.agent/skills/audit-design-system/SKILL.md', '---\nname: audit-design-system\ndescription: d\ntier: kind:app\n---\n# Real audit\n');
  const entries = scanKitAgent(kit);
  const cfg = { vendors: ['claude'], stack: [], kinds: ['app'], overlay: { rules: ['domain-*', 'project-*'], skills: ['domain-*', 'project-*'], workflows: [] } };
  const selected = selectEntries(entries, cfg).map((e) => e.subPath);
  assert.ok(!selected.some((s) => s.includes('project-widget')), 'overlay glob still shadows a kind:app asset (unchanged precedence)');
  assert.ok(selected.some((s) => s.includes('audit-design-system')), 'a kind:app asset outside the overlay glob still ships (unchanged precedence)');
});

// ---------- TICKET-akit-p3-testing-split: tech-node-gate.md kind-gating (real kit sources) ----------

test('tech-node-gate: real kit asset carries tier: kind:app + trigger: always; ships to unset/app kinds, absent from a knowledge-kind project; neutral foundation-testing ships regardless', () => {
  const entries = scanKitAgent(KIT_ROOT);
  const nodeGate = entries.find((e) => e.srcRel === '.agent/rules/tech-node-gate.md');
  assert.ok(nodeGate, 'tech-node-gate.md exists in the real kit sources');
  assert.equal(nodeGate.tier, 'kind:app', 'tech-node-gate.md is tier: kind:app');
  assert.equal(nodeGate.fm?.trigger, 'always', 'tech-node-gate.md is trigger: always');

  const testingCore = entries.find((e) => e.srcRel === '.agent/rules/foundation-testing.md');
  assert.equal(testingCore.tier, 'core', 'foundation-testing.md stayed tier: core after the split');

  // kinds unset → defaults to ['app'] → tech-node-gate.md ships; foundation-testing.md ships too
  const defaultCfg = { vendors: ['claude'], stack: [], overlay: {} };
  const defaultSelected = selectEntries(entries, defaultCfg).map((e) => e.srcRel);
  assert.ok(defaultSelected.includes('.agent/rules/tech-node-gate.md'), 'kind:app ships when kinds is unset (defaults to app)');
  assert.ok(defaultSelected.includes('.agent/rules/foundation-testing.md'), 'core neutral rule ships when kinds is unset');

  // kinds explicitly ['app'] → same as unset
  const appCfg = { vendors: ['claude'], stack: [], kinds: ['app'], overlay: {} };
  const appSelected = selectEntries(entries, appCfg).map((e) => e.srcRel);
  assert.ok(appSelected.includes('.agent/rules/tech-node-gate.md'), 'kind:app ships when kinds explicitly includes app');

  // kinds ['knowledge'] (no 'app') → tech-node-gate.md absent; foundation-testing.md still ships (core)
  const knowledgeCfg = { vendors: ['claude'], stack: [], kinds: ['knowledge'], overlay: {} };
  const knowledgeSelected = selectEntries(entries, knowledgeCfg).map((e) => e.srcRel);
  assert.ok(!knowledgeSelected.includes('.agent/rules/tech-node-gate.md'), 'kind:app does not ship to a knowledge-kind project (D4)');
  assert.ok(knowledgeSelected.includes('.agent/rules/foundation-testing.md'), 'neutral foundation-testing.md still ships to a knowledge-kind project (D4)');
});

// ---------- D5: agent-infra kind gating (TICKET-akit-p4-agent-infra-pack.md) ----------
// Mirrors the P2 kind:app gating test pattern above, one axis over: kind:agent-infra must ship
// only to a project whose `kinds` includes 'agent-infra' — never to an unset/default-app project,
// proving the new agent-infra pack has zero effect on the app fleet (app repos never set `kinds`
// to include 'agent-infra', so they can never select this tier).

test('kind-tier selection: kind:agent-infra ships only when kinds includes agent-infra; default/app kinds never receive it', () => {
  const kit = mkKit();
  write(kit, '.agent/skills/mcp-server-ops/SKILL.md', '---\nname: mcp-server-ops\ndescription: d\ntier: kind:agent-infra\n---\n\n# MCP Server Ops\n');

  // kinds unset on the project config → defaults to ['app'] → does NOT ship
  const unset = mkProject({ stack: [] });
  syncProject(unset, { kitRoot: kit });
  assert.ok(!exists(unset, '.claude/skills/mcp-server-ops/SKILL.md'), 'kind:agent-infra does not ship when kinds is unset (defaults to app)');
  assert.ok(exists(unset, '.claude/skills/implement-feature/SKILL.md'), 'core assets still ship regardless of kinds');

  // kinds explicitly ['app'] → does NOT ship
  const explicitApp = mkProject({ stack: [], kinds: ['app'] });
  syncProject(explicitApp, { kitRoot: kit });
  assert.ok(!exists(explicitApp, '.claude/skills/mcp-server-ops/SKILL.md'), 'kind:agent-infra does not ship to an app-kind project');

  // kinds includes 'agent-infra' → ships
  const agentInfra = mkProject({ stack: [], kinds: ['agent-infra'] });
  syncProject(agentInfra, { kitRoot: kit });
  assert.ok(exists(agentInfra, '.claude/skills/mcp-server-ops/SKILL.md'), 'kind:agent-infra ships when kinds explicitly includes agent-infra');

  // mixed kinds ['app', 'agent-infra'] → receives it too (both axes true simultaneously)
  const mixed = mkProject({ stack: [], kinds: ['app', 'agent-infra'] });
  syncProject(mixed, { kitRoot: kit });
  assert.ok(exists(mixed, '.claude/skills/mcp-server-ops/SKILL.md'), 'mixed kinds including agent-infra receives the kind:agent-infra asset');
});

// ---------- D3: nested skill file tier inheritance (TICKET-akit-p2.1) ----------
// Bug: a nested skill file (references/*.md etc.) carries no tier: frontmatter of its own, so
// tierOf() defaults it to 'core' and it ships UNCONDITIONALLY regardless of its owning skill's
// SKILL.md gate. Fix: a nested, untiered file inherits the sibling SKILL.md's computed tier.

test('D3(a): nested untiered file under a tech:X skill inherits the SKILL.md tier — excluded/included with stack', () => {
  const kit = mkKit(); // react-performance/SKILL.md already ships with tier: tech:react
  write(kit, '.agent/skills/react-performance/references/notes.md', '# Notes\nReact-specific reference.\n');
  const entries = scanKitAgent(kit);

  const noReact = selectEntries(entries, { vendors: ['claude'], stack: [], overlay: {} }).map((e) => e.subPath);
  assert.ok(!noReact.includes('skills/react-performance/references/notes.md'), 'nested file must NOT ship when stack lacks react (inherits tech:react from sibling SKILL.md)');

  const withReact = selectEntries(entries, { vendors: ['claude'], stack: ['react'], overlay: {} }).map((e) => e.subPath);
  assert.ok(withReact.includes('skills/react-performance/references/notes.md'), 'nested file ships when stack includes react');
});

test('D3(b): explicit fm.tier on a nested skill file wins over inherited SKILL.md tier', () => {
  const kit = mkKit(); // react-performance/SKILL.md ships with tier: tech:react
  write(kit, '.agent/skills/react-performance/references/always-ships.md', '---\ntier: core\n---\n\n# Always Ships\n');
  const entries = scanKitAgent(kit);

  const noReact = selectEntries(entries, { vendors: ['claude'], stack: [], overlay: {} }).map((e) => e.subPath);
  assert.ok(noReact.includes('skills/react-performance/references/always-ships.md'), 'explicit tier:core on the nested file must win over the inherited tech:react gate');
});

test('D3(c): nested untiered file under a kind:X skill inherits the SKILL.md tier likewise', () => {
  const kit = mkKit();
  write(kit, '.agent/skills/audit-design-system/SKILL.md', '---\nname: audit-design-system\ndescription: App-catalog design audit.\ntier: kind:app\n---\n\n# Audit Design System\n');
  write(kit, '.agent/skills/audit-design-system/references/checklist.md', '# Checklist\n');
  const entries = scanKitAgent(kit);

  const knowledge = selectEntries(entries, { vendors: ['claude'], stack: [], kinds: ['knowledge'], overlay: {} }).map((e) => e.subPath);
  assert.ok(!knowledge.includes('skills/audit-design-system/references/checklist.md'), 'nested file excluded when kinds lacks app (inherits kind:app from sibling SKILL.md)');

  const app = selectEntries(entries, { vendors: ['claude'], stack: [], kinds: ['app'], overlay: {} }).map((e) => e.subPath);
  assert.ok(app.includes('skills/audit-design-system/references/checklist.md'), 'nested file included when kinds includes app');
});

// ---------- idempotency ----------

test('sync twice → zero writes second time; check reports clean', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  const second = syncProject(proj, { kitRoot: kit });
  assert.equal(second.written.length, 0, JSON.stringify(second.written));
  assert.equal(second.pruned.length, 0);
  const c = checkProject(proj, { kitRoot: kit });
  assert.ok(c.clean, JSON.stringify(c.results));
});

// ---------- refuse-to-clobber ----------

test('locally-edited generated file: sync refuses, --force overwrites', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  const target = '.claude/skills/implement-feature/SKILL.md';
  write(proj, target, read(proj, target) + '\nLOCAL EDIT\n');
  // make the kit move so a write is attempted
  write(kit, '.agent/skills/implement-feature/SKILL.md', SKILL_MD.replace('Do the work.', 'Do the work v2.'));

  const r = syncProject(proj, { kitRoot: kit });
  assert.ok(r.refusals.some((x) => x.rel === target && x.why.includes('LOCALLY-EDITED')));
  assert.ok(read(proj, target).includes('LOCAL EDIT'), 'local edit must survive');

  // CRITICAL regression guard: a second sync must ALSO refuse (lock must not absorb the local edit)
  const r2 = syncProject(proj, { kitRoot: kit });
  assert.ok(r2.refusals.some((x) => x.rel === target), 'second sync silently clobbered');
  assert.ok(read(proj, target).includes('LOCAL EDIT'));

  const forced = syncProject(proj, { kitRoot: kit, force: true });
  assert.ok(forced.written.includes(target));
  assert.ok(read(proj, target).includes('Do the work v2.'));
  assert.ok(!read(proj, target).includes('LOCAL EDIT'));
});

test('untracked pre-existing file (pre-migration): refuses without --force', () => {
  const kit = mkKit();
  const proj = mkProject();
  write(proj, '.claude/skills/implement-feature/SKILL.md', 'pre-existing project content\n');
  const r = syncProject(proj, { kitRoot: kit });
  assert.ok(r.refusals.some((x) => x.rel === '.claude/skills/implement-feature/SKILL.md'));
  assert.equal(read(proj, '.claude/skills/implement-feature/SKILL.md'), 'pre-existing project content\n');
  const forced = syncProject(proj, { kitRoot: kit, force: true });
  assert.ok(forced.written.includes('.claude/skills/implement-feature/SKILL.md'));
});

// ---------- key-merge ----------

test('settings key-merge preserves unknown keys (claude settings + mcp.json + codex toml)', () => {
  const kit = mkKit();
  const proj = mkProject();
  write(proj, '.claude/settings.json', JSON.stringify({
    permissions: { allow: ['Bash(git*)'] },
    hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'my-own-hook' }] }] },
    custom: true,
  }, null, 2));
  write(proj, '.mcp.json', JSON.stringify({ mcpServers: { 'user-server': { command: 'u.exe' } } }, null, 2));
  write(proj, '.codex/config.toml', 'approval_policy = "on-request"\n');

  syncProject(proj, { kitRoot: kit });

  const s = JSON.parse(read(proj, '.claude/settings.json'));
  // decision 16 revised (2026-07-10): sync now owns permissions.allow as a union — the user's
  // Bash(git*) entry is preserved AND the kit baseline is added; other keys stay untouched.
  assert.ok(s.permissions.allow.includes('Bash(git*)'), 'user permission entry preserved');
  assert.ok(s.permissions.allow.includes('Bash(npm run gate*)'), 'kit baseline added');
  assert.equal(s.custom, true);
  const cmds = s.hooks.SessionStart.flatMap((g) => g.hooks.map((h) => h.command));
  assert.ok(cmds.includes('my-own-hook'), 'user hook preserved');
  assert.ok(cmds.some((c) => c.includes('agentkit')));

  const m = JSON.parse(read(proj, '.mcp.json'));
  assert.ok(m.mcpServers['user-server']);
  assert.ok(m.mcpServers['codebase-memory']);

  const t = read(proj, '.codex/config.toml');
  assert.ok(t.includes('approval_policy = "on-request"'), 'project toml preserved');
  assert.ok(t.includes('[mcp_servers.codebase-memory]'));

  // re-sync: no duplicate managed entries
  syncProject(proj, { kitRoot: kit });
  const s2 = JSON.parse(read(proj, '.claude/settings.json'));
  const ours = s2.hooks.SessionStart.flatMap((g) => g.hooks).filter((h) => h.command.includes('agentkit'));
  assert.equal(ours.length, 1);
  const t2 = read(proj, '.codex/config.toml');
  assert.equal(t2.match(/AGENTKIT MANAGED/g).length, 2, 'exactly one managed block');
});

test('mergeSettings removes managed keys when data empties', () => {
  const { content } = mergeSettings(
    { merge: 'mcp-json', data: {} },
    JSON.stringify({ mcpServers: { keep: { command: 'k' }, gone: { command: 'g' } } }),
    ['gone'],
  );
  const j = JSON.parse(content);
  assert.ok(j.mcpServers.keep);
  assert.ok(!j.mcpServers.gone);
});

// ---------- the 4-state check matrix ----------

test('check matrix: IN-SYNC / STALE / LOCALLY-EDITED / CONFLICT / NEW / ORPHAN', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });

  // IN-SYNC
  let c = checkProject(proj, { kitRoot: kit });
  assert.ok(c.clean);

  // STALE: kit source moves ahead
  write(kit, '.agent/rules/git-protocol.md', RULE_MD + '\nNew clause.\n');
  c = checkProject(proj, { kitRoot: kit });
  const stale = c.results.filter((r) => r.verdict === 'STALE').map((r) => r.rel);
  assert.ok(stale.includes('.agent/rules/git-protocol.md'), JSON.stringify(c.results));

  // LOCALLY-EDITED: project edits a shipped file (claude copy of the skill)
  const target = '.claude/skills/implement-feature/SKILL.md';
  write(proj, target, read(proj, target) + '\nLOCAL\n');
  c = checkProject(proj, { kitRoot: kit });
  assert.ok(c.results.some((r) => r.rel === target && r.verdict === 'LOCALLY-EDITED'));

  // CONFLICT: kit moves the SAME file the project edited
  write(kit, '.agent/skills/implement-feature/SKILL.md', SKILL_MD.replace('Do the work.', 'v2'));
  c = checkProject(proj, { kitRoot: kit });
  assert.ok(c.results.some((r) => r.rel === target && r.verdict === 'CONFLICT'), JSON.stringify(c.results.filter((r) => r.rel === target)));

  // NEW: kit gains an asset not yet synced
  write(kit, '.agent/rules/foundation-a11y.md', '# A11y\n');
  c = checkProject(proj, { kitRoot: kit });
  assert.ok(c.results.some((r) => r.rel === '.agent/rules/foundation-a11y.md' && r.verdict === 'NEW'));

  // ORPHAN: kit loses an asset the lock still tracks
  fs.rmSync(path.join(kit, '.agent/workflows/internal.md'));
  c = checkProject(proj, { kitRoot: kit });
  assert.ok(c.results.some((r) => r.rel === '.agent/workflows/internal.md' && r.verdict === 'ORPHAN'));
});

test('check --quick detects local edits from lock only', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.claude/commands/plan.md', 'overwritten\n');
  const c = checkProject(proj, { kitRoot: kit, quick: true });
  assert.ok(c.results.some((r) => r.rel === '.claude/commands/plan.md' && r.verdict === 'LOCALLY-EDITED'));
});

// ---------- prune (decision 29) ----------

test('asset leaving the selection prunes only lockfile-owned files; edited files refused', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  assert.ok(exists(proj, '.claude/skills/react-performance/SKILL.md'));

  // project drops react from its stack → react-performance leaves the selection
  const cfg = JSON.parse(read(proj, '.agentkit.json'));
  cfg.stack = [];
  write(proj, '.agentkit.json', JSON.stringify(cfg));

  // edit ONE of the generated copies — it must survive the prune
  write(proj, '.opencode/skills/react-performance/SKILL.md', 'edited\n');

  const r = syncProject(proj, { kitRoot: kit });
  assert.ok(r.pruned.includes('.claude/skills/react-performance/SKILL.md'));
  assert.ok(r.pruned.includes('.agent/skills/react-performance/SKILL.md'));
  assert.ok(!exists(proj, '.claude/skills/react-performance'), 'empty dirs removed');
  assert.ok(exists(proj, '.opencode/skills/react-performance/SKILL.md'), 'edited file kept');
  assert.ok(r.refusals.some((x) => x.rel === '.opencode/skills/react-performance/SKILL.md'));

  // TICKET 1a: a refused prune must not drop out of the lock — otherwise the stale file becomes
  // permanently invisible to every later command (check, doctor, another sync).
  const lockAfterRefusal = JSON.parse(read(proj, '.agentkit.lock'));
  const refusedEntry = lockAfterRefusal.files['.opencode/skills/react-performance/SKILL.md'];
  assert.ok(refusedEntry, 'refused-prune entry must survive in the lock');
  assert.equal(refusedEntry.refusedPrune, true);

  // checkProject now sees it as ORPHAN (lock still says kit-shipped, plan no longer selects it, file
  // still on disk) — never silently dropped, and an ORPHAN result makes check non-clean.
  const c = checkProject(proj, { kitRoot: kit });
  const orphan = c.results.find((x) => x.rel === '.opencode/skills/react-performance/SKILL.md');
  assert.ok(orphan, 'refused-prune entry must surface in check results');
  assert.equal(orphan.verdict, 'ORPHAN');
  assert.ok(!c.clean, 'an ORPHAN result must make check non-clean');

  // a file sync never wrote is NEVER pruned
  write(proj, '.claude/skills/hand-made/SKILL.md', 'mine\n');
  const r2 = syncProject(proj, { kitRoot: kit });
  assert.ok(exists(proj, '.claude/skills/hand-made/SKILL.md'));

  // the refusal persists across an ordinary (non-force) sync, and never leaks back out as
  // project-overlay/generated content on any vendor surface.
  assert.ok(r2.refusals.some((x) => x.rel === '.opencode/skills/react-performance/SKILL.md'), 'refusal persists on next ordinary sync');
  assert.ok(!exists(proj, '.claude/skills/react-performance/SKILL.md'), 'refused-prune content must never resurrect as project-overlay output');
  const lockAfterSecond = JSON.parse(read(proj, '.agentkit.lock'));
  assert.ok(lockAfterSecond.files['.opencode/skills/react-performance/SKILL.md']?.refusedPrune, 'lock retention survives a second ordinary sync');

  // sync --force finally prunes the refused entry and the lock entry disappears
  const forced = syncProject(proj, { kitRoot: kit, force: true });
  assert.ok(forced.pruned.includes('.opencode/skills/react-performance/SKILL.md'), JSON.stringify(forced));
  assert.ok(!exists(proj, '.opencode/skills/react-performance/SKILL.md'));
  const lockAfterForce = JSON.parse(read(proj, '.agentkit.lock'));
  assert.ok(!lockAfterForce.files['.opencode/skills/react-performance/SKILL.md'], 'forced prune removes the lock entry');
});

// ---------- adopt (flowback, decision 26) ----------

test('adopt: happy path copies back, bumps patch version, writes CHANGELOG provenance', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  const target = '.agent/rules/git-protocol.md';
  write(proj, target, read(proj, target).replace('Commit early.', 'Commit early and often.'));

  const r = adoptFile(proj, target, { kitRoot: kit });
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(r.newVersion, '0.1.1');
  const kitContent = read(kit, '.agent/rules/git-protocol.md');
  assert.ok(kitContent.includes('Commit early and often.'));
  assert.ok(!kitContent.includes('AGENTKIT GENERATED'), 'header stripped on flowback');
  assert.ok(read(kit, 'CHANGELOG.md').includes('adopt: .agent/rules/git-protocol.md'));
});

test('adopt: reverse clobber guard refuses when kit moved since last sync', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.agent/rules/git-protocol.md', 'my improvement\n');
  // kit moves independently (another project adopted first)
  write(kit, '.agent/rules/git-protocol.md', RULE_MD + '\nSomeone else was here.\n');

  const r = adoptFile(proj, '.agent/rules/git-protocol.md', { kitRoot: kit });
  assert.ok(!r.ok);
  assert.ok(r.reason.includes('changed since this project last synced'));
  assert.ok(read(kit, '.agent/rules/git-protocol.md').includes('Someone else was here.'), 'kit untouched');
});

test('adopt: new .agent file lands as new kit asset with minor bump; --defer queues', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.agent/skills/new-idea/SKILL.md', '---\nname: new-idea\ndescription: Fresh.\n---\n\n# New\n');

  const d = adoptFile(proj, '.agent/skills/new-idea/SKILL.md', { kitRoot: kit, defer: true });
  assert.ok(d.deferred);
  assert.equal(JSON.parse(read(kit, 'flowback-queue.json')).length, 1);

  const r = adoptFile(proj, '.agent/skills/new-idea/SKILL.md', { kitRoot: kit });
  assert.ok(r.ok && r.isNew);
  assert.equal(r.newVersion, '0.2.0');
  assert.ok(exists(kit, '.agent/skills/new-idea/SKILL.md'));
});

// ---------- overlay (decision 34) ----------

test('overlay skills reach vendor surfaces; core/overlay name collision flagged', () => {
  const kit = mkKit();
  const proj = mkProject();
  write(proj, '.agent/skills/domain-widgets/SKILL.md', '---\nname: domain-widgets\ndescription: Project domain skill.\n---\n\n# Widgets\n');
  const r = syncProject(proj, { kitRoot: kit });
  assert.ok(r.ok);
  assert.ok(exists(proj, '.claude/skills/domain-widgets/SKILL.md'), 'overlay skill must reach vendor surface');
  const lock = JSON.parse(read(proj, '.agentkit.lock'));
  assert.equal(lock.files['.claude/skills/domain-widgets/SKILL.md'].owner, 'project-generated');
  assert.ok(!lock.files['.agent/skills/domain-widgets/SKILL.md'], 'kit never ships/tracks the overlay source');

});

test('overlay file sync bypasses untracked/refusal checks if clean on disk', () => {
  const kit = mkKit();
  const proj = mkProject();
  
  // Create a project-specific overlay rule
  write(proj, '.agent/rules/domain-discovery.md', '---\nglobs: ["src/**/*.ts"]\n---\n# Discovery\n');
  
  // 1. First, try syncing. Since .claude/rules/domain-discovery.md doesn't exist, it should succeed.
  const r1 = syncProject(proj, { kitRoot: kit });
  assert.ok(r1.ok);
  const target = '.claude/rules/domain-discovery.md';
  assert.ok(exists(proj, target));
  
  // Now, let's delete the lockfile entry for it (to simulate exists but not lockfile-tracked)
  const lock = JSON.parse(read(proj, '.agentkit.lock'));
  delete lock.files[target];
  write(proj, '.agentkit.lock', JSON.stringify(lock, null, 2));
  
  // Since the file on disk matches what we want to generate, it should sync without --force and not refuse!
  const r2 = syncProject(proj, { kitRoot: kit });
  assert.ok(r2.ok);
  assert.equal(r2.refusals.length, 0);
  
  // Now let's simulate the case where the target file exists but has no header (e.g. copied from source)
  // delete lockfile tracking first
  const lock2 = JSON.parse(read(proj, '.agentkit.lock'));
  delete lock2.files[target];
  write(proj, '.agentkit.lock', JSON.stringify(lock2, null, 2));
  
  // Write target file content as exact copy of source content (no header)
  write(proj, target, '---\nglobs: ["src/**/*.ts"]\n---\n# Discovery\n');
  
  // Running sync should successfully overwrite/inject header and track it in lockfile without --force
  const r3 = syncProject(proj, { kitRoot: kit });
  assert.ok(r3.ok);
  assert.equal(r3.refusals.length, 0);
  assert.ok(r3.written.includes(target));
  
  // Verify lock now tracks it
  const lock3 = JSON.parse(read(proj, '.agentkit.lock'));
  assert.ok(lock3.files[target]);

  // 3. Test LOCALLY-EDITED bypass when clean:
  // Let's modify the source file
  write(proj, '.agent/rules/domain-discovery.md', '---\nglobs: ["src/**/*.ts"]\n---\n# Discovery Updated\n');
  
  // Modify the target file on disk to match the new source file content (without header)
  write(proj, target, '---\nglobs: ["src/**/*.ts"]\n---\n# Discovery Updated\n');
  
  // Now lockfile has the old target hash, but target file matches new source content (no header).
  // Running sync should recognize it is clean, write the header, and update the lockfile without --force!
  const r4 = syncProject(proj, { kitRoot: kit });
  assert.ok(r4.ok);
  assert.equal(r4.refusals.length, 0);
  assert.ok(r4.written.includes(target));
});

test('overlay/core collision lint: fires on duplicate routing name, silent otherwise', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });

  // overlay skill whose frontmatter name duplicates a CORE skill's routing name → error
  write(proj, '.agent/skills/local-impl/SKILL.md', '---\nname: implement-feature\ndescription: shadow\n---\n# x\n');
  let plan = planSync(proj, { kitRoot: kit });
  assert.ok(plan.validations.some((v) => v.level === 'error' && v.msg.includes('name collision')), JSON.stringify(plan.validations));

  // distinct names → no lint
  write(proj, '.agent/skills/local-impl/SKILL.md', '---\nname: local-impl\ndescription: mine\n---\n# x\n');
  plan = planSync(proj, { kitRoot: kit });
  assert.ok(!plan.validations.some((v) => v.msg.includes('name collision')));
});

test('surviving-by-absence: unclaimed overlay flagged; claim via glob / tier / config entry silences it', () => {
  const kit = mkKit();
  const proj = mkProject();
  const baseCfg = JSON.parse(read(proj, '.agentkit.json'));

  // a project-owned rule the kit does NOT ship, named outside domain-*/project-* and no tier:overlay
  write(proj, '.agent/rules/foundation-responsive.md', '---\ntrigger: always\n---\n\n# Responsive\n');
  let plan = planSync(proj, { kitRoot: kit });
  assert.ok(plan.survivingByAbsence.includes('.agent/rules/foundation-responsive.md'), JSON.stringify(plan.survivingByAbsence));

  // claim #1: tier: overlay frontmatter → silent
  write(proj, '.agent/rules/foundation-responsive.md', '---\ntier: overlay\ntrigger: always\n---\n\n# Responsive\n');
  plan = planSync(proj, { kitRoot: kit });
  assert.ok(!plan.survivingByAbsence.includes('.agent/rules/foundation-responsive.md'));

  // claim #2: explicit overlay.rules config entry → silent
  write(proj, '.agent/rules/foundation-responsive.md', '---\ntrigger: always\n---\n\n# Responsive\n');
  plan = planSync(proj, { kitRoot: kit, cfg: { ...baseCfg, overlay: { rules: ['domain-*', 'project-*', 'foundation-responsive'], skills: ['domain-*', 'project-*'], workflows: [] } } });
  assert.ok(!plan.survivingByAbsence.includes('.agent/rules/foundation-responsive.md'));

  // a domain-* overlay file (tier:overlay by name convention) is never surviving-by-absence
  write(proj, '.agent/skills/domain-widgets/SKILL.md', '---\nname: domain-widgets\ndescription: d\n---\n# w\n');
  plan = planSync(proj, { kitRoot: kit });
  assert.ok(!plan.survivingByAbsence.some((f) => f.includes('domain-widgets')));
});

test('overlay.claims: a flat overlay.claims array claims paths identically to the typed rules/skills/workflows arrays', () => {
  const kit = mkKit();
  const proj = mkProject();
  const baseCfg = JSON.parse(read(proj, '.agentkit.json'));

  write(proj, '.agent/rules/foundation-responsive.md', '---\ntrigger: always\n---\n\n# Responsive\n');
  const plan = planSync(proj, { kitRoot: kit, cfg: { ...baseCfg, overlay: { rules: ['domain-*', 'project-*'], skills: ['domain-*', 'project-*'], workflows: [], claims: ['foundation-responsive'] } } });
  assert.ok(!plan.survivingByAbsence.includes('.agent/rules/foundation-responsive.md'), JSON.stringify(plan.survivingByAbsence));
});

test('lock syncedAt is a full ISO timestamp (session-boundary churn attribution), not date-only', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  const lock = JSON.parse(read(proj, '.agentkit.lock'));
  assert.match(lock.syncedAt, /T\d{2}:\d{2}/, lock.syncedAt);
});

test('doctor --project scopes the rollup to one member; unknown name errors with the roster', () => {
  const kit = mkKit();
  const projA = mkProject();
  const projB = mkProject();
  syncProject(projA, { kitRoot: kit });
  syncProject(projB, { kitRoot: kit });
  write(kit, 'fleet.json', JSON.stringify({ members: [
    { name: 'aaa', path: projA, status: 'managed' },
    { name: 'bbb', path: projB, status: 'managed' },
  ] }));

  const scoped = runDoctor({ kitRoot: kit, only: 'bbb', quick: true });
  assert.deepEqual(Object.keys(scoped.members), ['bbb']);
  assert.equal(scoped.only, 'bbb');

  const err = runDoctor({ kitRoot: kit, only: 'zzz', quick: true });
  assert.ok(err.error, 'unknown project name returns an error');
  assert.ok(err.available.includes('aaa') && err.available.includes('bbb'), JSON.stringify(err.available));
});

test('doctor scopes by cwd (project-path) match; falls back to full fleet on no match; --all overrides a matching cwd', () => {
  const kit = mkKit();
  const projA = mkProject();
  const projB = mkProject();
  syncProject(projA, { kitRoot: kit });
  syncProject(projB, { kitRoot: kit });
  write(kit, 'fleet.json', JSON.stringify({ members: [
    { name: 'aaa', path: projA, status: 'managed' },
    { name: 'bbb', path: projB, status: 'managed' },
  ] }));

  // cwd (projectRoot) matches a fleet member's abs path → scoped exactly like --project <name>
  const scoped = runDoctor({ kitRoot: kit, projectRoot: projB, quick: true });
  assert.deepEqual(Object.keys(scoped.members), ['bbb']);
  assert.equal(scoped.only, 'bbb');
  assert.ok(!scoped.note, JSON.stringify(scoped.note));

  // cwd is not a fleet member → full rollup (not an error), with a one-line note
  const nonMember = fs.mkdtempSync(path.join(TMP, 'nonmember-'));
  const fallback = runDoctor({ kitRoot: kit, projectRoot: nonMember, quick: true });
  assert.deepEqual(Object.keys(fallback.members).sort(), ['aaa', 'bbb']);
  assert.equal(fallback.only, null);
  assert.ok(fallback.note && fallback.note.includes(nonMember), JSON.stringify(fallback.note));

  // --all overrides a matching cwd — full rollup even though projectRoot matches a member
  const overridden = runDoctor({ kitRoot: kit, projectRoot: projB, all: true, quick: true });
  assert.deepEqual(Object.keys(overridden.members).sort(), ['aaa', 'bbb']);
  assert.equal(overridden.only, null);
  assert.ok(!overridden.note);
});

test('verify: harvests agentkit-checks from active rules and runs them against sourceRoots', () => {
  const kit = mkKit();
  // a core rule that DECLARES a check in a fenced agentkit-checks block
  write(kit, '.agent/rules/foundation-x.md', '---\ntrigger: model-decision\n---\n\n# X\n\n```agentkit-checks\n[{"id":"no-hex","pattern":"#[0-9a-fA-F]{3,6}","globs":["*.css"],"severity":"critical","message":"use tokens"}]\n```\n');
  const proj = mkProject({ sourceRoots: ['app'] });
  syncProject(proj, { kitRoot: kit });

  // harvest sees the check, tagged with the owning rule; sourceRoots come from config
  const h = harvestChecks(proj, { kitRoot: kit });
  assert.ok(h.checks.some((c) => c.id === 'no-hex' && c.rule.includes('foundation-x')), JSON.stringify(h.checks));
  assert.deepEqual(h.sourceRoots, ['app']);

  // a violation INSIDE the source root is found; identical content OUTSIDE any source root is not scanned
  write(proj, 'app/styles.css', 'a { color: #ff0000; }\n');
  write(proj, 'other/styles.css', 'a { color: #ff0000; }\n');
  const v = runVerify(proj, { kitRoot: kit });
  assert.equal(v.findings.length, 1, JSON.stringify(v.findings));
  assert.equal(v.findings[0].id, 'no-hex');
  assert.equal(v.findings[0].file, 'app/styles.css');
  assert.equal(v.findings[0].severity, 'critical');
  assert.equal(v.clean, false);

  // .agentkit.json verify.exclude silences a check for token-definition files
  const proj2 = mkProject({ sourceRoots: ['app'], verify: { exclude: ['**/styles.css'] } });
  syncProject(proj2, { kitRoot: kit });
  write(proj2, 'app/styles.css', 'a { color: #ff0000; }\n');
  assert.equal(runVerify(proj2, { kitRoot: kit }).findings.length, 0);
});

test('verify: a check-level exclude skips matching files (e.g. test mocks)', () => {
  const kit = mkKit();
  write(kit, '.agent/rules/foundation-x.md', '---\ntrigger: model-decision\n---\n\n# X\n\n```agentkit-checks\n[{"id":"no-hex","pattern":"#[0-9a-fA-F]{3,6}","globs":["*.tsx"],"exclude":["**/*.test.*"],"severity":"critical","message":"m"}]\n```\n');
  const proj = mkProject({ sourceRoots: ['app'] });
  syncProject(proj, { kitRoot: kit });
  write(proj, 'app/Widget.tsx', "const c = '#ff0000';\n");        // flagged
  write(proj, 'app/Widget.test.tsx', "vi.fn(() => '#000000');\n"); // excluded by the check's own exclude
  const v = runVerify(proj, { kitRoot: kit });
  assert.equal(v.findings.length, 1, JSON.stringify(v.findings));
  assert.equal(v.findings[0].file, 'app/Widget.tsx');
});

test('§5 explicit tier:core wins over an overlay glob (project-onboard not shadowed by project-*)', () => {
  const kit = mkKit();
  write(kit, '.agent/skills/project-onboard/SKILL.md', '---\nname: project-onboard\ndescription: d\ntier: core\n---\n# Onboard\n');
  write(kit, '.agent/skills/project-widget/SKILL.md', '---\nname: project-widget\ndescription: d\n---\n# W\n'); // no tier → name-inferred overlay
  const entries = scanKitAgent(kit);
  const cfg = { vendors: ['claude'], stack: [], overlay: { rules: ['domain-*', 'project-*'], skills: ['domain-*', 'project-*'], workflows: [] } };
  const selected = selectEntries(entries, cfg).map((e) => e.subPath);
  assert.ok(selected.includes('skills/project-onboard/SKILL.md'), 'explicit tier:core ships despite the project-* overlay glob');
  assert.ok(!selected.some((s) => s.includes('project-widget')), 'a project-* asset without tier:core stays overlay-tier and is not shipped as core');
});

test('§6 verify ignores hex inside comments, flags real hex', () => {
  const kit = mkKit();
  write(kit, '.agent/rules/foundation-x.md', '---\ntrigger: model-decision\n---\n\n# X\n\n```agentkit-checks\n[{"id":"no-hex","pattern":"#[0-9a-fA-F]{3,6}","globs":["*.scss"],"severity":"critical","message":"m"}]\n```\n');
  const proj = mkProject({ sourceRoots: ['app'] });
  syncProject(proj, { kitRoot: kit });
  write(proj, 'app/a.scss', '.a { color: var(--c); } /* was #ff0000 */\n.b { color: #00ff00; } // #123456\n');
  const v = runVerify(proj, { kitRoot: kit });
  assert.equal(v.findings.length, 1, JSON.stringify(v.findings));  // only the real #00ff00
  assert.ok(v.findings[0].text.includes('#00ff00'));
});

test('CLI verify --fail-on / --warn-only: additive, invalid value errors, default (critical-only) unchanged', () => {
  // main()'s verify case does not thread kitRoot — it always harvests core checks from the real
  // KIT_ROOT. A project-owned overlay rule (scanned straight off the project's own .agent/rules/,
  // independent of any kit sync) is enough to carry our fixture's agentkit-checks block; a .yaml
  // target keeps it clear of the real kit's own css/scss/tsx-scoped design-token checks.
  const proj = mkProject({ sourceRoots: ['app'] });
  write(proj, '.agent/rules/project-verify-fixture.md', '---\ntrigger: always\n---\n\n# Fixture\n\n```agentkit-checks\n[{"id":"fixture-high","pattern":"BADVALUE","globs":["*.yaml"],"severity":"high","message":"fixture high-severity finding"}]\n```\n');
  write(proj, 'app/config.yaml', 'key: BADVALUE\n');

  const orig = console.log; let out = '';
  console.log = (s) => { out += `${s}\n`; };
  try {
    // sanity: a high-severity-only finding does not trip the default (critical-only) gate
    out = '';
    assert.equal(main(['verify', proj]), 0, 'default gate is critical-only:\n' + out);

    // --fail-on high fails on a high-severity finding
    out = '';
    assert.equal(main(['verify', proj, '--fail-on', 'high']), 1, '--fail-on high must fail on a high finding:\n' + out);

    // invalid --fail-on value prints an error listing valid values and exits 1
    out = '';
    assert.equal(main(['verify', proj, '--fail-on', 'bogus']), 1, 'invalid --fail-on value must exit 1');

    // --warn-only always exits 0, even alongside a would-be-failing --fail-on
    out = '';
    assert.equal(main(['verify', proj, '--fail-on', 'high', '--warn-only']), 0, '--warn-only always exits 0:\n' + out);
  } finally { console.log = orig; }
});

test('CLI verify: a critical finding still fails the default gate (pins the default); --warn-only suppresses it', () => {
  const proj = mkProject({ sourceRoots: ['app'] });
  write(proj, '.agent/rules/project-verify-fixture2.md', '---\ntrigger: always\n---\n\n# Fixture\n\n```agentkit-checks\n[{"id":"fixture-critical","pattern":"BADVALUE","globs":["*.yaml"],"severity":"critical","message":"fixture critical finding"}]\n```\n');
  write(proj, 'app/config.yaml', 'key: BADVALUE\n');

  const orig = console.log; let out = '';
  console.log = (s) => { out += `${s}\n`; };
  try {
    out = '';
    assert.equal(main(['verify', proj]), 1, 'default gate still fails on critical (pins the default):\n' + out);
    out = '';
    assert.equal(main(['verify', proj, '--warn-only']), 0, '--warn-only overrides even a critical finding:\n' + out);
  } finally { console.log = orig; }
});

// ---------- kb routing (decision 31) ----------

test('check --kb matches applies-to globs mechanically', () => {
  const proj = mkProject();
  write(proj, 'docs/knowledge-base/SPEC-Pagination.md', '---\napplies-to: [src/pdf/**, "*.overflow.ts"]\nlast-verified: 2026-06-01\n---\n\n# Spec\n');
  write(proj, 'docs/knowledge-base/SPEC-Other.md', '---\napplies-to: [api/**]\n---\n\n# Other\n');
  const m = kbMatch(proj, ['src/pdf/render.ts']);
  assert.equal(m.length, 1);
  assert.ok(m[0].doc.includes('SPEC-Pagination'));
  assert.equal(m[0].lastVerified, '2026-06-01');
});

// ---------- init ----------

test('init greenfield writes intent config and first sync', () => {
  const kit = mkKit();
  const proj = fs.mkdtempSync(path.join(TMP, 'proj-'));
  const r = initProject(proj, { kitRoot: kit, vendors: ['claude'], stack: ['react'] });
  assert.ok(r.ok);
  assert.ok(exists(proj, '.agentkit.json'));
  assert.ok(exists(proj, '.agentkit.lock'));
  assert.ok(exists(proj, '.claude/skills/implement-feature/SKILL.md'));
});

test('init scaffolds .fallowrc.jsonc with noise-suppression levers when fallow is in tools (TICKET-22)', () => {
  const kit = mkKit();
  const proj = fs.mkdtempSync(path.join(TMP, 'proj-'));
  const r = initProject(proj, { kitRoot: kit });
  assert.ok(r.ok && r.fallowrc.written, JSON.stringify(r.fallowrc));
  const rc = read(proj, '.fallowrc.jsonc');
  assert.ok(rc.includes('"ignoreExportsUsedInFile": true'), 'lever 1 pre-wired');
  assert.ok(rc.includes('"ignoreExports": []'), 'lever 2 ships empty');
  assert.ok(rc.includes('"duplicates"'), 'lever 3 present');
  assert.ok(rc.includes('// WHY:'), 'WHY comments preserved (JSONC)');
});

test('init never touches an existing .fallowrc* (TICKET-22)', () => {
  const kit = mkKit();
  const proj = fs.mkdtempSync(path.join(TMP, 'proj-'));
  write(proj, '.fallowrc.json', '{ "custom": true }\n');
  const r = initProject(proj, { kitRoot: kit });
  assert.ok(r.ok && !r.fallowrc.written);
  assert.equal(read(proj, '.fallowrc.json'), '{ "custom": true }\n', 'existing config byte-identical');
  assert.ok(!exists(proj, '.fallowrc.jsonc'), 'no second config scaffolded alongside');
});

test('init without fallow in tools writes no fallowrc (TICKET-22)', () => {
  const kit = mkKit();
  const proj = fs.mkdtempSync(path.join(TMP, 'proj-'));
  const r = initProject(proj, { kitRoot: kit, tools: ['codebase-mcp'] });
  assert.ok(r.ok && !r.fallowrc.written);
  assert.ok(!exists(proj, '.fallowrc.jsonc'));
});

test('init: --kinds excluding app defaults tools to [] and skips JS-gate + fallow scaffolding (kind-aware init)', () => {
  const kit = mkKit();
  const proj = fs.mkdtempSync(path.join(TMP, 'proj-'));
  // A package.json with a `lint` script — if the kind gate were NOT applied, scaffoldGateScripts
  // would wire `gate:lint`/`gate` here, so this proves the step was genuinely skipped, not just a
  // no-op from a missing package.json.
  write(proj, 'package.json', JSON.stringify({ name: 'x', scripts: { lint: 'eslint .' } }));
  const r = initProject(proj, { kitRoot: kit, kinds: ['knowledge'] });
  assert.ok(r.ok, JSON.stringify(r));
  assert.deepEqual(r.cfg.kinds, ['knowledge']);
  assert.deepEqual(r.cfg.tools, [], 'non-app kind must default tools to empty — no live codebase-mcp/fallow wiring: ' + JSON.stringify(r.cfg.tools));
  assert.ok(!r.fallowrc.written, 'no .fallowrc scaffold for a non-app kind: ' + JSON.stringify(r.fallowrc));
  assert.ok(!exists(proj, '.fallowrc.jsonc'));
  assert.ok(!r.gate.scaffolded, 'no JS gate scaffold for a non-app kind: ' + JSON.stringify(r.gate));
  const pkg = JSON.parse(read(proj, 'package.json'));
  assert.ok(!pkg.scripts['gate:lint'], 'package.json must be left untouched for a non-app kind');
});

test('init: --kinds app (explicit) and the default (no --kinds flag) are unchanged — same tools default + gate/fallow scaffolding as before kind-awareness', () => {
  const kit = mkKit();

  const projDefault = fs.mkdtempSync(path.join(TMP, 'proj-'));
  const rDefault = initProject(projDefault, { kitRoot: kit });
  assert.ok(rDefault.ok);
  assert.deepEqual(rDefault.cfg.tools, ['codebase-mcp', 'fallow']);
  assert.ok(!('kinds' in rDefault.cfg), 'omitting --kinds must not add a kinds key — zero change to the generated config for existing app repos');
  assert.ok(rDefault.fallowrc.written);
  assert.ok(rDefault.gate); // scaffoldGateScripts still invoked (no-op here: temp dir has no package.json)

  const projApp = fs.mkdtempSync(path.join(TMP, 'proj-'));
  const rApp = initProject(projApp, { kitRoot: kit, kinds: ['app'] });
  assert.ok(rApp.ok);
  assert.deepEqual(rApp.cfg.kinds, ['app']);
  assert.deepEqual(rApp.cfg.tools, ['codebase-mcp', 'fallow']);
  assert.ok(rApp.fallowrc.written);
});

test('init CLI: --kinds parses as a comma-separated list like --stack, and reaches initProject', () => {
  const kit = mkKit();
  const proj = fs.mkdtempSync(path.join(TMP, 'proj-'));
  main(['init', proj, '--kinds', 'knowledge,agent-infra', '--no-sync']);
  const cfg = JSON.parse(read(proj, '.agentkit.json'));
  assert.deepEqual(cfg.kinds, ['knowledge', 'agent-infra']);
  assert.deepEqual(cfg.tools, [], 'non-app kinds list must still default tools to empty via the CLI path');
});

test('init clone-rebind resets lock and lists overlay triage', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.agent/skills/domain-old/SKILL.md', '---\nname: domain-old\n---\n# inherited from clone source\n');
  const r = initProject(proj, { kitRoot: kit, cloneRebind: true });
  assert.ok(r.ok && r.mode === 'clone-rebind');
  assert.ok(r.triage.some((t) => t.includes('domain-old')));
  assert.ok(!exists(proj, '.agentkit.lock'), 'stale inherited lock removed');
});

// ---------- manifest (decision 28) ----------

test('manifest is compiled with routing metadata and generatedTargets', () => {
  const kit = mkKit();
  const m = compileManifest(kit);
  const skill = m.entries.find((e) => e.path === '.agent/skills/implement-feature/SKILL.md');
  assert.equal(skill.tier, 'core');
  assert.deepEqual(skill.triggers, ['build', 'implement']);
  assert.deepEqual(skill.requiredTools, ['codebase-mcp']);
  assert.ok(skill.generatedTargets.claude.includes('.claude/skills/implement-feature/SKILL.md'));
  assert.ok(skill.generatedTargets.codex.includes('.agents/skills/implement-feature/SKILL.md'));
  const wf = m.entries.find((e) => e.path === '.agent/workflows/plan.md');
  assert.ok(wf.generatedTargets.gemini.includes('.gemini/commands/plan.toml'));
});

// ---------- self-sync (decision 38) ----------

test('kit self-sync: .agent sources untouched, vendor surface generated inside kit', () => {
  const kit = mkKit();
  write(kit, '.agentkit.json', JSON.stringify({ vendors: ['claude'], stack: [], tools: [], overlay: {}, pins: {} }));
  const before = read(kit, '.agent/skills/implement-feature/SKILL.md');
  const r = syncProject(kit, { kitRoot: kit });
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(read(kit, '.agent/skills/implement-feature/SKILL.md'), before, 'self-sync must not rewrite sources');
  assert.ok(exists(kit, '.claude/skills/implement-feature/SKILL.md'));
  assert.ok(!read(kit, '.claude/skills/implement-feature/SKILL.md').includes('tier:'));
  const second = syncProject(kit, { kitRoot: kit });
  assert.equal(second.written.length, 0, 'self-sync idempotent');
});

// ---------- junction guard (pilot finding 2026-07-03) ----------

test('sync refuses HARD when a vendor dir is a junction into .agent (even with --force)', () => {
  const kit = mkKit();
  const proj = mkProject();
  // simulate the fleet's junctioned wiring: .claude/skills -> .agent/skills
  write(proj, '.agent/skills/implement-feature/SKILL.md', SKILL_MD); // pre-existing source
  fs.mkdirSync(path.join(proj, '.claude'), { recursive: true });
  fs.symlinkSync(path.join(proj, '.agent', 'skills'), path.join(proj, '.claude', 'skills'), 'junction');

  const before = read(proj, '.agent/skills/implement-feature/SKILL.md');
  for (const force of [false, true]) {
    const r = syncProject(proj, { kitRoot: kit, force });
    assert.ok(!r.ok, `sync must refuse (force=${force})`);
    assert.ok(r.reason.includes('reparse'), r.reason);
    assert.ok(r.reparse.some((x) => x.dir === '.claude/skills'));
    assert.equal(r.written.length, 0);
  }
  assert.equal(read(proj, '.agent/skills/implement-feature/SKILL.md'), before, 'source must be untouched');

  // removing the link (the sanctioned fix) unblocks sync
  fs.rmdirSync(path.join(proj, '.claude', 'skills'));
  const ok = syncProject(proj, { kitRoot: kit, force: true });
  assert.ok(ok.ok, JSON.stringify(ok.reason || ok));
  assert.ok(exists(proj, '.claude/skills/implement-feature/SKILL.md'));
  assert.ok(!read(proj, '.claude/skills/implement-feature/SKILL.md').includes('tier:'), 'real generated copy, not the source');
});

// ---------- Phase-1 guards: content-integrity + stack-lint ----------

test('content-integrity flags phantom citations, passes resolvable + placeholder ones', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  // a rule that cites: one real path, one phantom path, a placeholder, a universal script, a project script
  write(proj, '.agent/rules/project-facts.md', [
    '---', 'trigger: always', '---', '',
    'Real: `.agent/rules/project-facts.md` exists.',
    'Phantom: `src/features/DeepResearch/personaData.ts` is gone.',
    'Placeholder: `apps/<app>/fonts.ts` is generic — never flag.',
    'Universal: run `npm run lint`.',
    'Project: run `npm run validate:tokens`.',
  ].join('\n'));
  fs.mkdirSync(path.join(proj, 'src'), { recursive: true }); // src/ exists but not src/features/...
  write(proj, 'package.json', JSON.stringify({ scripts: { lint: 'x', build: 'x' } }));

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const tokens = r.findings.map((f) => f.token);
  assert.ok(tokens.includes('src/features/DeepResearch/personaData.ts'), 'phantom path flagged');
  assert.ok(tokens.includes('validate:tokens'), 'project-specific script flagged');
  assert.ok(!tokens.some((t) => t.includes('<app>')), 'placeholder not flagged');
  assert.ok(!tokens.includes('lint'), 'universal script not flagged');
  assert.ok(!tokens.some((t) => t === '.agent/rules/project-facts.md'), 'resolvable path not flagged');
});

test('content-integrity resolves kit-relative citations against the kit', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.agent/rules/uses-integration.md', '---\ntrigger: always\n---\nSee `integrations/codebase-mcp.md` and `integrations/nonexistent.md`.');
  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const tokens = r.findings.map((f) => f.token);
  assert.ok(!tokens.includes('integrations/codebase-mcp.md'), 'existing kit-relative doc resolves');
  assert.ok(tokens.includes('integrations/nonexistent.md'), 'missing kit-relative doc flagged');
});

test('content-integrity leniency: placeholders, skill-relative refs, docs convention, vendor surfaces', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.agent/skills/demo/SKILL.md', [
    '---', 'name: demo', 'description: x', '---', '# Demo',
    'See `references/guide.md` for details.',              // resolves relative to the skill dir → pass
    'Example path `path/to/thing.tsx`.',                   // illustrative placeholder → skip
    'Scaffold at `.agent/skills/[skill-name]/SKILL.md`.',  // bracket placeholder → skip
    'Archive under `docs/archive/2026-MM/`.',              // date-placeholder segment → skip
    'The KB index lives under `docs/knowledge-base/`.',    // docs-model convention dir → pass
    'Read `docs/knowledge-base/SPEC-missing.md`.',         // specific absent KB file → FLAG
    'Vendor surface `.agents/` is generated.',             // generated vendor surface → skip
  ].join('\n'));
  write(proj, '.agent/skills/demo/references/guide.md', '# guide\n');
  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const tokens = r.findings.map((f) => f.token);
  assert.ok(!tokens.includes('references/guide.md'), 'skill-relative reference resolves against the skill dir');
  assert.ok(!tokens.some((t) => t.startsWith('path/to/')), 'path/to placeholder not flagged');
  assert.ok(!tokens.some((t) => t.includes('[skill-name]')), 'bracket placeholder not flagged');
  assert.ok(!tokens.some((t) => t.includes('2026-MM')), 'date-placeholder dir not flagged');
  assert.ok(!tokens.includes('docs/knowledge-base/'), 'docs-model convention dir not flagged');
  assert.ok(!tokens.includes('.agents/'), 'generated vendor surface not flagged');
  assert.ok(tokens.includes('docs/knowledge-base/SPEC-missing.md'), 'specific absent KB file still flagged');
});

test('content-integrity: gate:* convention scripts are universal (cited generically, not flagged); an unknown script still flags', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  // package.json defines only `test` — the gate:* scripts are cited as a convention, not present here
  write(proj, 'package.json', JSON.stringify({ name: 'p', version: '1.0.0', scripts: { test: 'node --test' } }));
  write(proj, '.agent/skills/demo/SKILL.md', [
    '---', 'name: demo', 'description: x', '---', '# Demo',
    'Run `npm run gate` or `npm run gate:types` per foundation-testing.md §1.', // convention → skip
    'Then `npm run frobnicate`.',                                              // real unknown → FLAG
  ].join('\n'));
  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const scriptTokens = r.findings.filter((f) => f.kind === 'npm-script').map((f) => f.token);
  assert.ok(!scriptTokens.includes('gate'), 'gate is universal, not flagged');
  assert.ok(!scriptTokens.includes('gate:types'), 'gate:types is universal, not flagged');
  assert.ok(scriptTokens.includes('frobnicate'), 'a genuinely unknown script is still flagged');
});

// ---------- design-token citations (TICKET-17) ----------

test('content-integrity token citations: undefined token warns with file/line; defined, var(), glob, and CLI-flag citations stay silent', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, 'src/styles/tokens.css', ':root {\n  --z-raised: 10;\n  --z-overlay: 20;\n  --text-primary: #111;\n  --surface-bg-primary: #fff;\n}\n');
  write(proj, '.agent/rules/project-tokens.md', [
    '---', 'trigger: always', '---', '',
    'Use `--z-raised` for cards.',                    // L5: defined → silent
    'Use `var(--z-overlay)` for modals.',             // L6: var() form, defined → silent
    'Layer with `--z-index-surface-*` tokens.',       // L7: glob, no defined token has the prefix → WARN
    'Color errors with `--text-error`.',              // L8: namespace defined, token not → WARN
    'Any `--surface-*` token is fine.',               // L9: glob resolves via --surface-bg-primary → silent
    'Never resolve with `--ours` or `--theirs`.',     // L10: CLI flags, namespace undefined → silent
    'Run `agentkit check --content` for details.',    // L11: not a whole-backtick token → silent
  ].join('\n'));
  // token citations outside .agent/rules are NOT harvested (rules-only, per the ticket decision)
  write(proj, 'AGENTS.md', '# AGENTS\n\nUse `--text-error` here too.\n');

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const tokens = r.findings.filter((f) => f.kind === 'token');
  assert.deepEqual(tokens.map((t) => t.token).sort(), ['--text-error', '--z-index-surface-*'], JSON.stringify(r.findings));
  const glob = tokens.find((t) => t.token === '--z-index-surface-*');
  const exact = tokens.find((t) => t.token === '--text-error');
  assert.equal(glob.file, '.agent/rules/project-tokens.md');
  assert.equal(glob.line, 7, 'glob citation carries its line');
  assert.equal(exact.line, 8, 'exact citation carries its line');
  assert.ok(tokens.every((t) => t.severity === 'warn'), 'token findings are warn severity');
});

// ---------- TICKET-25 / TICKET-29: citation resolver + checker coverage ----------

test('TICKET-25: markdown links resolve against the citing dir then repo root; dead links flagged', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, 'docs/knowledge-base/SPEC-thing.md', [
    '# Spec',
    'See [the rule](../../.agent/rules/local-rule.md) — real file OUTSIDE docs/ (the D2 false-positive case).',
    'See [sibling](SPEC-other.md) — resolves against the citing dir.',
    'See [gone](../working/TICKET-archived.md) — dead link.',
    'See [home](https://example.com/x.md) — external URL, never resolved.',
  ].join('\n'));
  write(proj, 'docs/knowledge-base/SPEC-other.md', '# other\n');
  write(proj, '.agent/rules/local-rule.md', '---\ntrigger: always\n---\n# local\n');

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const links = r.findings.filter((f) => f.kind === 'link').map((f) => f.token);
  assert.ok(links.includes('../working/TICKET-archived.md'), `dead link flagged: ${JSON.stringify(r.findings)}`);
  assert.ok(!links.some((t) => t.includes('local-rule')), 'valid link to a real file outside docs/ not flagged');
  assert.ok(!links.includes('SPEC-other.md'), 'sibling link resolves against the citing dir');
  assert.ok(!links.some((t) => t.startsWith('http')), 'external URL not resolved');
});

test('TICKET-25 / D6: cross-repo citations are skipped via `repo:path` notation and externalRoots', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.agentkit.json', JSON.stringify({ vendors: ['claude'], externalRoots: ['predecessor-kit'] }));
  write(proj, '.agent/rules/cross-repo.md', [
    '---', 'trigger: always', '---',
    'Ops runbook: `predecessor-kit/.agent/skills/open-webui-agent-network-ops/SKILL.md`.',
    'Ticket: `proj-resume:docs/backlog/TICKET-for-agentkit-docs-drift-hardening-staff.md`.',
    'Local phantom: `src/features/Gone.tsx`.',
  ].join('\n'));
  fs.mkdirSync(path.join(proj, 'src'), { recursive: true });

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const tokens = r.findings.map((f) => f.token);
  assert.ok(!tokens.some((t) => t.startsWith('predecessor-kit')), 'externalRoots citation not flagged as a path');
  assert.ok(!r.findings.some((f) => f.kind === 'skill-ref'), 'cross-repo .agent/skills/ ref is not a claim about THIS repo');
  assert.ok(!tokens.some((t) => t.startsWith('proj-resume:')), '`repo:path` notation is skipped without config');
  assert.ok(tokens.includes('src/features/Gone.tsx'), 'a genuinely local phantom is still flagged');
});

test('TICKET-25: `<!-- taxonomy-ignore-line -->` suppresses content-integrity too (shared vocabulary)', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.agent/rules/historical.md', [
    '---', 'trigger: always', '---',
    'Legacy name `docs/gone-forever/` is still recognised. <!-- taxonomy-ignore-line -->',
    'Unsuppressed phantom `src/features/Gone.tsx`.',
  ].join('\n'));
  fs.mkdirSync(path.join(proj, 'src'), { recursive: true });

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const tokens = r.findings.map((f) => f.token);
  assert.ok(!tokens.includes('docs/gone-forever/'), 'marker-suppressed line skipped');
  assert.ok(tokens.includes('src/features/Gone.tsx'), 'unmarked line still flagged');
});

test('TICKET-29: docs are a citing surface — KB bodies warn, index READMEs fail', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, 'docs/knowledge-base/SPEC-ported.md', '# Ported\n\nCites `src/features/Gone.tsx` from another repo.\n');
  write(proj, 'docs/knowledge-base/README.md', '# KB\n\n| Doc | Read it when |\n|---|---|\n| [gone](SPEC-never-existed.md) | never |\n');
  fs.mkdirSync(path.join(proj, 'src'), { recursive: true });

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const body = r.findings.find((f) => f.file === 'docs/knowledge-base/SPEC-ported.md');
  const index = r.findings.find((f) => f.file === 'docs/knowledge-base/README.md');
  assert.ok(body, 'docs body file is scanned');
  assert.equal(body.severity, 'warn', 'KB body findings are advisory — a guard that arrives red gets disabled');
  assert.ok(index, 'index README is scanned');
  assert.notEqual(index.severity, 'warn', 'a dead index row is held hard — pointing at real things is an index\'s job');
});

test('TICKET-29: working/ and backlog/ BODIES are not scanned — their paths are hypotheses', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  // A ticket's **Files** line names files that do not exist yet — that is what a ticket IS.
  write(proj, 'docs/backlog/TICKET-future.md', '# Future\n\n**Files**: `src/features/NotBuiltYet.tsx`\n');
  write(proj, 'docs/working/PLAN-future.md', '# Plan\n\nWill create `src/features/AlsoNotBuilt.tsx`.\n');
  fs.mkdirSync(path.join(proj, 'src'), { recursive: true });

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  assert.ok(!r.findings.some((f) => f.file.startsWith('docs/backlog/TICKET-')), 'backlog ticket bodies not scanned');
  assert.ok(!r.findings.some((f) => f.file.startsWith('docs/working/PLAN-')), 'working plan bodies not scanned');
});

test('TICKET-29: CI job names are checked against .github/workflows, and are a no-op when absent', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.agent/rules/ci.md', ['---', 'trigger: always', '---', 'The job `pdf-parity` gates this.', 'The job `build-and-test` gates that.'].join('\n'));

  const before = checkContentIntegrity(proj, { kitRoot: kit });
  assert.ok(!before.findings.some((f) => f.kind === 'ci-job'), 'no workflows dir ⇒ no CI findings at all');

  write(proj, '.github/workflows/ci.yml', 'name: CI\non: push\njobs:\n  build-and-test:\n    runs-on: ubuntu-latest\n');
  const after = checkContentIntegrity(proj, { kitRoot: kit });
  const jobs = after.findings.filter((f) => f.kind === 'ci-job').map((f) => f.token);
  assert.deepEqual(jobs, ['pdf-parity'], `fictional job flagged, real one not: ${JSON.stringify(after.findings)}`);
});

test('F-ci-job-prose-fp: prose "job <word>" is not a CI-job claim — only a quoted token is', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.github/workflows/ci.yml', 'name: CI\non: push\njobs:\n  build-and-test:\n    runs-on: ubuntu-latest\n');
  // The proj-resume FP class verbatim: a domain where "job" is product vocabulary, not CI vocabulary.
  write(proj, '.agent/rules/domain.md', ['---', 'trigger: always', '---',
    'The job intake pipeline normalizes job description text before the job application is stored.',
    'Job Board rows refresh when job details change; job URLs are canonicalized.',
    'The TriageExecutive owns job source ranking.',
    'A backticked Title-Case word is not a job name either: job `Description`.',
  ].join('\n'));
  // The check must still bite: a quoted lowercase-kebab token that names no real job.
  write(proj, '.agent/rules/ci-cite.md', ['---', 'trigger: always', '---',
    'The CI job `gate-fast` must pass before merge; the job `build-and-test` already does.',
  ].join('\n'));

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const jobs = r.findings.filter((f) => f.kind === 'ci-job').map((f) => f.token);
  assert.deepEqual(jobs, ['gate-fast'],
    `only the quoted fictional token is a claim — prose "job <word>" never is: ${JSON.stringify(jobs)}`);
});

test('TICKET-25: a `:line` citation in a durable doc is flagged warn-tier, and still resolves', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, 'docs/knowledge-base/SPEC-lines.md', '# Spec\n\nSee `docs/knowledge-base/SPEC-lines.md:164` for the shape.\n');

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const lc = r.findings.filter((f) => f.kind === 'line-citation');
  assert.equal(lc.length, 1, JSON.stringify(r.findings));
  assert.equal(lc[0].severity, 'warn', 'advisory — volatile, not broken');
  assert.ok(!r.findings.some((f) => f.kind === 'path'), 'the line suffix is stripped before resolving, so the real file resolves');
});

test('TICKET-29: kit-relative globs resolve their literal prefix (integrations/*.md is not a phantom)', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  fs.mkdirSync(path.join(kit, 'integrations'), { recursive: true });
  write(proj, '.agent/rules/globs.md', ['---', 'trigger: always', '---', 'Formalize a new `integrations/*.md`.', 'Missing `templates/nope/*.md`.'].join('\n'));

  const r = checkContentIntegrity(proj, { kitRoot: kit });
  const tokens = r.findings.map((f) => f.token);
  assert.ok(!tokens.includes('integrations/*.md'), 'existing kit dir cited as a glob resolves');
  assert.ok(tokens.includes('templates/nope/*.md'), 'a glob under a missing kit dir is still flagged');
});

test('content-integrity token citations: a repo defining zero custom properties stays silent', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, '.agent/rules/project-tokens.md', '---\ntrigger: always\n---\n\nUse `--text-error` and `--z-index-surface-*`.\n');
  const r = checkContentIntegrity(proj, { kitRoot: kit });
  assert.ok(!r.findings.some((f) => f.kind === 'token'), JSON.stringify(r.findings));
});

test('TICKET-17 CLI: check --content exits 0 on warn-only token findings, 1 on phantom paths', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, 'src/styles/tokens.css', ':root { --z-raised: 10; }\n');
  write(proj, '.agent/rules/project-tokens.md', '---\ntrigger: always\n---\n\nUse `--z-index-surface-overlay`.\n');
  const orig = console.log; let out = '';
  console.log = (s) => { out += `${s}\n`; };
  try {
    out = '';
    assert.equal(main(['check', proj, '--content']), 0, 'warn-only token findings never fail CI:\n' + out);
    assert.ok(out.includes('[warn:token] .agent/rules/project-tokens.md:5 → --z-index-surface-overlay'), out);

    // a phantom PATH citation keeps the existing failing exit code
    write(proj, '.agent/rules/project-facts.md', '---\ntrigger: always\n---\n\nSee `src/features/gone.ts`.\n');
    out = '';
    assert.equal(main(['check', proj, '--content']), 1, 'phantom path still exits 1:\n' + out);
    assert.ok(out.includes('[phantom:path] .agent/rules/project-facts.md → src/features/gone.ts'), out);
  } finally { console.log = orig; }
});

test('TICKET-17 CLI: check --all runs the content pass; default check prints the --content hint instead', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  write(proj, 'src/styles/tokens.css', ':root { --z-raised: 10; }\n');
  write(proj, '.agent/rules/project-tokens.md', '---\ntrigger: always\n---\n\nUse `--z-index-surface-overlay`.\n');
  const orig = console.log; let out = '';
  console.log = (s) => { out += `${s}\n`; };
  try {
    out = '';
    assert.equal(main(['check', proj, '--quick', '--all']), 0, 'warn-only token findings never fail check --all:\n' + out);
    assert.ok(out.includes('[warn:token] .agent/rules/project-tokens.md:5 → --z-index-surface-overlay'), 'content pass included in --all:\n' + out);
    assert.ok(!out.includes('run `agentkit check --content`'), 'no hint when the pass already ran');

    out = '';
    main(['check', proj, '--quick']);
    assert.ok(out.includes('run `agentkit check --content` for citation integrity'), 'default check points at the content pass:\n' + out);
    assert.ok(!out.includes('[warn:token]'), 'content pass not run without --all/--content');
  } finally { console.log = orig; }
});

const WF_MARKERS = [
  "<!-- >>> AGENTKIT WORKFLOWS >>> (generated — do not edit; run 'agentkit sync') -->",
  '<!-- <<< AGENTKIT WORKFLOWS <<< -->',
].join('\n');

test('K3 workflow-map: sync fills the generated command table between markers, sorted, preserving surroundings', () => {
  const kit = mkKit();
  const proj = mkProject();
  write(proj, 'AGENTS.md', `# AGENTS\n\nAuthored intro.\n\n## Workflows\n${WF_MARKERS}\n\n## Footer stays.\n`);
  syncProject(proj, { kitRoot: kit });
  const agents = fs.readFileSync(path.join(proj, 'AGENTS.md'), 'utf8');
  assert.ok(agents.includes('| `/plan` | Plan a feature end to end. |'), 'plan row generated from frontmatter description');
  assert.ok(agents.includes('| `/internal` | Internal workflow. |'), 'internal row generated');
  assert.ok(agents.indexOf('/internal') < agents.indexOf('/plan'), 'rows sorted by command name');
  assert.ok(agents.includes('Authored intro.') && agents.includes('## Footer stays.'), 'authored content around the block preserved');
});

test('K3 workflow-map: an AGENTS.md without the markers is left byte-for-byte untouched', () => {
  const kit = mkKit();
  const proj = mkProject();
  const original = '# AGENTS\n\nNo markers here — fully authored.\n';
  write(proj, 'AGENTS.md', original);
  syncProject(proj, { kitRoot: kit });
  assert.equal(fs.readFileSync(path.join(proj, 'AGENTS.md'), 'utf8'), original, 'opt-in: no markers → not touched');
});

test('renderWorkflowMap escapes pipes and is empty when there are no workflows', () => {
  assert.equal(renderWorkflowMap([{ type: 'skill', name: 'x', fm: {} }]), '', 'no workflows → empty map');
  const map = renderWorkflowMap([{ type: 'workflow', name: 'w', fm: { description: 'a | b' } }]);
  assert.ok(map.includes('a \\| b'), 'pipe in description escaped');
});

test('CLI --version / -v / version print the kit version and exit 0', () => {
  const orig = console.log; let out = '';
  console.log = (s) => { out += `${s}`; };
  try {
    for (const verb of ['--version', '-v', 'version']) {
      out = '';
      assert.equal(main([verb]), 0, `${verb} exits 0`);
      assert.match(out, /^\d+\.\d+\.\d+/, `${verb} prints a semver`);
    }
  } finally { console.log = orig; }
});

test('CLI general help and subcommand help print usage and exit 0', () => {
  const orig = console.log; let out = '';
  console.log = (s) => { out += `${s}\n`; };
  try {
    // 1. General help
    for (const verb of ['--help', '-h', 'help']) {
      out = '';
      assert.equal(main([verb]), 0, `general help ${verb} exits 0`);
      assert.ok(out.includes('usage: agentkit <init|sync|check|verify|receipt|changelog-roll|adopt|lock|surfaces|inventory|doctor|--version>'), `general help ${verb} contains usage`);
    }

    // 2. Subcommand help
    const subcommands = [
      { verb: 'init', expected: 'usage: agentkit init [project-path] [--vendors a,b]' },
      { verb: 'sync', expected: 'usage: agentkit sync [project-path] [--dry-run]' },
      { verb: 'check', expected: 'usage: agentkit check [project-path] [--quick]' },
      { verb: 'verify', expected: 'usage: agentkit verify [project-path]' },
      { verb: 'receipt', expected: 'usage: agentkit receipt [project-path]' },
      { verb: 'changelog-roll', expected: 'usage: agentkit changelog-roll [project-path] [--version' },
      { verb: 'adopt', expected: 'usage: agentkit adopt [project] <file-rel>' },
      { verb: 'lock', expected: 'usage: agentkit lock <acquire|release|status>' },
      { verb: 'surfaces', expected: 'usage: agentkit surfaces --base <ref>' },
      { verb: 'inventory', expected: 'usage: agentkit inventory' },
      { verb: 'doctor', expected: 'usage: agentkit doctor [project-path]' },
    ];
    
    for (const sc of subcommands) {
      for (const helpFlag of ['--help', '-h']) {
        out = '';
        assert.equal(main([sc.verb, helpFlag]), 0, `${sc.verb} ${helpFlag} exits 0`);
        assert.ok(out.includes(sc.expected), `${sc.verb} ${helpFlag} usage string matches`);
      }
    }
  } finally { console.log = orig; }
});

test('stackLint warns on a declared pack whose marker dependency is absent', () => {
  const kit = mkKit();
  const proj = mkProject({ stack: ['react', 'supabase'] });
  write(proj, 'package.json', JSON.stringify({ dependencies: { react: '19', next: '16' } }));
  const r = stackLint(proj);
  assert.ok(r.checked);
  const packs = r.warnings.map((w) => w.pack);
  assert.ok(packs.includes('supabase'), 'supabase declared but no @supabase dep → warned');
  assert.ok(!packs.includes('react'), 'react has its dep → not warned');
});

test('antigravity lints name/folder mismatch', () => {
  const kit = mkKit();
  write(kit, '.agent/skills/misnamed/SKILL.md', '---\nname: wrong-name\ndescription: x\n---\n# x\n');
  const proj = mkProject({ vendors: ['antigravity'] });
  const plan = planSync(proj, { kitRoot: kit });
  assert.ok(plan.validations.some((v) => v.level === 'error' && v.msg.includes("'wrong-name' != folder 'misnamed'")));
});

test('R13 changelog-roll: assembles changelog.d fragments into one dated section, removes them', () => {
  const proj = mkProject();
  write(proj, 'CHANGELOG.md', '# Changelog\n\n## [2026-07-01] — v0.1.0\n\nold entry\n');
  write(proj, 'changelog.d/ticket-a.md', '- lane A shipped X');
  write(proj, 'changelog.d/ticket-b.md', '- lane B shipped Y');
  const r = changelogRoll(proj, { version: 'v0.6.0', date: '2026-07-05' });
  assert.equal(r.rolled, 2);
  const cl = read(proj, 'CHANGELOG.md');
  assert.ok(cl.includes('## [2026-07-05] — v0.6.0'), 'dated section added');
  assert.ok(cl.includes('lane A shipped X') && cl.includes('lane B shipped Y'), 'both fragments assembled');
  assert.ok(cl.indexOf('2026-07-05') < cl.indexOf('2026-07-01'), 'newest section on top');
  assert.ok(!exists(proj, 'changelog.d/ticket-a.md') && !exists(proj, 'changelog.d/ticket-b.md'), 'fragments removed');
  // idempotent: nothing left to roll
  assert.equal(changelogRoll(proj, {}).rolled, 0);
});

// ---------- taxonomy lint (K7) ----------

test('taxonomyLint flags missing prefix, suffix dialect, space, and Title-Case tail', () => {
  const proj = mkProject();
  write(proj, 'docs/knowledge-base/color-system.md', '# unprefixed durable contract\n');       // missing-prefix
  write(proj, 'docs/knowledge-base/color-system-spec.md', '# suffix dialect\n');                 // suffix-dialect (+missing-prefix)
  write(proj, 'docs/working/TICKET-Corporate-MRI-Tool.md', '# title case tail\n');               // title-case-tail
  write(proj, 'docs/backlog/IDEA has space.md', '# spaced\n');                                    // space-in-name (+missing-prefix)
  write(proj, 'docs/knowledge-base/SPEC-color-system.md', '# clean\n');                           // clean
  const r = taxonomyLint(proj);
  const kinds = r.findings.reduce((m, f) => (m[f.kind] = (m[f.kind] || 0) + 1, m), {});
  assert.ok(kinds['missing-prefix'] >= 2, 'unprefixed + spaced durable docs flagged');
  assert.ok(kinds['suffix-dialect'] === 1, 'suffix -spec form flagged');
  assert.ok(kinds['title-case-tail'] === 1, 'Title-Case tail flagged');
  assert.ok(kinds['space-in-name'] === 1, 'space in filename flagged');
  assert.ok(!r.clean && !r.enforce, 'has findings, warn-only by default');
});

test('taxonomyLint: acronym tails, READMEs, and docs/research evidence are NOT flagged', () => {
  const proj = mkProject();
  write(proj, 'docs/knowledge-base/SPEC-pdf-generation.md', '# acronym PDF fine\n');  // all-caps acronym, not Title-Case
  write(proj, 'docs/knowledge-base/README.md', '# index\n');                          // exempt
  write(proj, 'docs/working/PROGRAM-STATUS.md', '# status\n');                        // exempt name
  write(proj, 'docs/research/help-docs/example agents.md', '# raw evidence\n');       // research: prefix-exempt...
  write(proj, 'docs/research/CODEX-OFFICIAL-DOCS-RESEARCH.md', '# corpus\n');          // research: -RESEARCH suffix ok
  const r = taxonomyLint(proj);
  assert.ok(!r.findings.some((f) => f.kind === 'missing-prefix'), 'no missing-prefix on exempt/acronym/research');
  assert.ok(!r.findings.some((f) => f.kind === 'title-case-tail'), 'acronym tail not flagged as Title-Case');
  assert.ok(!r.findings.some((f) => f.kind === 'suffix-dialect'), 'suffix-shaped corpus name under research/ not flagged');
  assert.ok(r.findings.some((f) => f.kind === 'space-in-name'), 'space still flagged even under research/');
});

// Regression: the evidence store was exempted by two hand-copied `docs/research/` regexes, so
// renaming it to `raw-research/` (docs-standard §f, 2026-07-25) silently un-exempted it — the kit's
// own corpus lit up with dead-index-entry + suffix-dialect on files that had never moved. Both call
// sites now share EVIDENCE_STORE_RE. Assert BOTH names, or the next rename repeats it.
test('taxonomyLint: the evidence store is exempt under raw-research/ as well as legacy research/', () => {
  for (const store of ['raw-research', 'research']) {
    const proj = mkProject();
    write(proj, `docs/${store}/help-docs/example agents.md`, '# raw evidence\n');       // prefix-exempt
    write(proj, `docs/${store}/CODEX-OFFICIAL-DOCS-RESEARCH.md`, '# corpus\n');         // -RESEARCH suffix ok
    write(proj, `docs/${store}/inbox/chatgpt-thing.md`, '# unfiled drop\n');            // tier 1: any name
    write(proj, `docs/${store}/README.md`, '# index\n\nSee `RESULT-N.md` and `moved-away.md`.\n'); // index names need not resolve
    const r = taxonomyLint(proj);
    for (const kind of ['missing-prefix', 'suffix-dialect', 'dead-index-entry']) {
      assert.ok(!r.findings.some((f) => f.kind === kind), `${kind} must not fire under docs/${store}/`);
    }
    assert.ok(r.findings.some((f) => f.kind === 'space-in-name'), `space still flagged under docs/${store}/`);
  }
});

test('taxonomyLint: DECISION- without status is flagged; waiver + ratchet work', () => {
  const proj = mkProject();
  write(proj, 'docs/knowledge-base/DECISION-no-status.md', '# why\nno frontmatter\n');
  let r = taxonomyLint(proj);
  assert.ok(r.findings.some((f) => f.kind === 'decision-no-status'), 'DECISION without status flagged');

  // per-file frontmatter waiver suppresses it
  write(proj, 'docs/knowledge-base/DECISION-no-status.md', '---\ntaxonomy-waiver: legacy import\n---\n# why\n');
  r = taxonomyLint(proj);
  assert.ok(!r.findings.some((f) => f.file.endsWith('DECISION-no-status.md')), 'waivered file suppressed');

  // ratchet: taxonomyEnforce flips enforce=true (CLI exit becomes 1 when not clean)
  const proj2 = mkProject({ taxonomyEnforce: true });
  write(proj2, 'docs/knowledge-base/bad-name.md', '# unprefixed\n');
  const r2 = taxonomyLint(proj2);
  assert.ok(r2.enforce && !r2.clean, 'enforce true and dirty → CLI would exit 1');
});

test('taxonomy baseline ratchet: gates on regression (findings > baseline), not mere non-zero findings', () => {
  const mkTwoFindings = (cfg) => {
    const proj = mkProject(cfg);
    write(proj, 'docs/knowledge-base/bad-name-one.md', '# unprefixed 1\n');
    write(proj, 'docs/knowledge-base/bad-name-two.md', '# unprefixed 2\n');
    return proj;
  };

  // sanity: 2 real findings, no baseline configured
  const plain = taxonomyLint(mkTwoFindings({ taxonomyEnforce: true }));
  assert.equal(plain.findings.length, 2, JSON.stringify(plain.findings));
  assert.equal(plain.baseline, undefined);

  // baseline == current findings → no regression, CLI exits 0
  const atBaseline = mkTwoFindings({ taxonomyEnforce: true, taxonomyBaseline: 2 });
  const orig = console.log; let out = '';
  console.log = (s) => { out += `${s}\n`; };
  try {
    out = '';
    assert.equal(main(['check', atBaseline, '--taxonomy']), 0, 'findings == baseline is not a regression:\n' + out);

    // baseline = findings - 1 → regression, CLI exits 1
    const belowBaseline = mkTwoFindings({ taxonomyEnforce: true, taxonomyBaseline: 1 });
    out = '';
    assert.equal(main(['check', belowBaseline, '--taxonomy']), 1, 'findings > baseline is a regression:\n' + out);
  } finally { console.log = orig; }
});

test('taxonomyLint: waiver glob (an entry containing *) suppresses a whole subtree, exact-path waivers still work', () => {
  const proj = mkProject({ taxonomyWaivers: ['docs/kb-fixture/**', 'docs/working/exact-waived-plan.md'] });
  write(proj, 'docs/kb-fixture/notes-plan.md', '# suffix dialect, waived by glob\n');
  write(proj, 'docs/working/exact-waived-plan.md', '# suffix dialect, waived by exact path\n');
  write(proj, 'docs/working/unwaived-plan.md', '# suffix dialect, NOT waived\n');
  const r = taxonomyLint(proj);
  const dialectFiles = r.findings.filter((f) => f.kind === 'suffix-dialect').map((f) => f.file);
  assert.ok(!dialectFiles.some((f) => f.includes('kb-fixture')), JSON.stringify(dialectFiles));
  assert.ok(!dialectFiles.some((f) => f.includes('exact-waived-plan')), JSON.stringify(dialectFiles));
  assert.ok(dialectFiles.some((f) => f.includes('unwaived-plan')), JSON.stringify(dialectFiles));
});

test('D1 taxonomyLint is store-aware: a valid prefix in the wrong store is flagged', () => {
  const proj = mkProject();
  write(proj, 'docs/working/RESEARCH-scrape.md', '# evidence in the wrong store\n');   // wrong-store
  write(proj, 'docs/working/SPEC-thing.md', '# KB doc in a lifecycle store\n');        // wrong-store
  write(proj, 'docs/knowledge-base/TICKET-thing.md', '# lifecycle doc in the KB\n');   // wrong-store
  write(proj, 'docs/working/TICKET-thing.md', '# correctly placed\n');                 // clean
  write(proj, 'docs/knowledge-base/SPEC-thing.md', '# correctly placed\n');            // clean
  const r = taxonomyLint(proj);
  const wrong = r.findings.filter((f) => f.kind === 'wrong-store').map((f) => f.file);
  assert.equal(wrong.length, 3, JSON.stringify(r.findings));
  assert.ok(wrong.some((f) => f.includes('working/RESEARCH-')) && wrong.some((f) => f.includes('working/SPEC-')) && wrong.some((f) => f.includes('knowledge-base/TICKET-')));
});

test('F-prd-store-lifecycle: PRD- is lifecycle — legal in working/, wrong-store parked whole in the KB', () => {
  const proj = mkProject();
  // A PRD is born in working/ while its content is still to-be (docs-standard: expires on landing).
  write(proj, 'docs/working/PRD-authentication.md', '# PRD — auth\n\n**Status**: draft\n');
  write(proj, 'docs/backlog/PRD-payments-later.md', '# PRD — payments\n');
  // Promoted WHOLE into the KB — to-be content wearing an as-is costume; the contract is dissolve,
  // not park: landed subset → SPEC-, unlanded remainder → strategy/backlog, record → archive.
  write(proj, 'docs/knowledge-base/PRD-search.md', '# PRD — search\n');
  const r = taxonomyLint(proj);
  const wrong = r.findings.filter((f) => f.kind === 'wrong-store').map((f) => f.file);
  assert.ok(!wrong.some((f) => f.includes('working/PRD-')), `a working PRD is where a PRD lives: ${JSON.stringify(wrong)}`);
  assert.ok(!wrong.some((f) => f.includes('backlog/PRD-')), 'a backlog PRD is legal too');
  assert.ok(wrong.some((f) => f.includes('knowledge-base/PRD-')), `a PRD parked whole in the KB is wrong-store: ${JSON.stringify(wrong)}`);
});

test('TICKET-25(a): D2 resolves backticked basenames against .agent/ and root, not just docs/', () => {
  const proj = mkProject();
  write(proj, '.agent/rules/pattern-docs-artifacts.md', '---\ntrigger: always\n---\n# rule\n');
  write(proj, 'docs/backlog/README.md', [
    '# backlog',
    '',
    'The canon is `pattern-docs-artifacts.md` — a real rule, cited by bare basename.',
    'Root entrypoint `AGENTS.md` is also real.',
    'But `TICKET-renamed-away.md` genuinely does not exist.',
  ].join('\n'));
  write(proj, 'AGENTS.md', '# agents\n');

  const r = taxonomyLint(proj);
  const dead = r.findings.filter((f) => f.kind === 'dead-index-entry').map((f) => f.detail);
  assert.equal(dead.length, 1, `only the genuinely missing name is dead: ${JSON.stringify(r.findings)}`);
  assert.ok(dead[0].includes('TICKET-renamed-away.md'), 'names the real dead entry');
  assert.ok(!dead.some((d) => d.includes('pattern-docs-artifacts')), 'a real rule cited by basename is not "renamed away"');
  assert.ok(!dead.some((d) => d.includes('AGENTS.md')), 'a real root file cited by basename is not "renamed away"');
});

test('C2/D5 waiver hygiene: bare-string waivers are unowned, waivers matching nothing are dead', () => {
  const proj = mkProject({
    taxonomyWaivers: [
      'docs/knowledge-base/legacy/**',                                                  // unowned, but live
      { path: 'docs/knowledge-base/owned/**', owner: 'kit-owner', reason: 'imported corpus' }, // owned + live
      { path: 'docs/knowledge-base/gone/**', owner: 'kit-owner', reason: 'stale' },     // owned but DEAD
    ],
  });
  write(proj, 'docs/knowledge-base/legacy/lowercase-name.md', '# legacy\n');
  write(proj, 'docs/knowledge-base/owned/another-lowercase.md', '# owned\n');

  const r = taxonomyLint(proj);
  const unowned = r.findings.filter((f) => f.kind === 'waiver-unowned');
  const dead = r.findings.filter((f) => f.kind === 'waiver-dead');
  assert.equal(unowned.length, 1, `only the bare string is unowned: ${JSON.stringify(r.findings)}`);
  assert.ok(unowned[0].detail.includes('legacy'), 'names the offending entry');
  assert.equal(dead.length, 1, 'the waiver suppressing nothing is dead');
  assert.ok(dead[0].detail.includes('gone'), 'names the dead entry');
  assert.ok([...unowned, ...dead].every((f) => f.severity === 'warn'), 'waiver hygiene is advisory, not a build break');
  // the owned+live waiver still suppresses — hygiene reporting must not break suppression itself
  assert.ok(!r.findings.some((f) => f.file === 'docs/knowledge-base/owned/another-lowercase.md'), 'owned waiver still suppresses');
});

test('C5 taxonomyLint index-COVERAGE: a doc that exists but is unindexed is flagged (the mirror of D2)', () => {
  const proj = mkProject();
  write(proj, 'docs/backlog/README.md', '# backlog\n\n| Doc | Read it when… |\n|---|---|\n| `TICKET-listed.md` | it is indexed |\n');
  write(proj, 'docs/backlog/TICKET-listed.md', '# listed\n');
  write(proj, 'docs/backlog/TICKET-orphan.md', '# orphan — never added to the index\n');
  write(proj, 'docs/working/TICKET-no-index-here.md', '# working, but working/ has no README at all\n');

  const r = taxonomyLint(proj);
  const unindexed = r.findings.filter((f) => f.kind === 'unindexed-doc').map((f) => f.file);
  assert.deepEqual(unindexed, ['docs/backlog/TICKET-orphan.md'], JSON.stringify(r.findings));
  assert.ok(!unindexed.includes('docs/backlog/README.md'), 'the index does not have to index itself');
  assert.ok(!unindexed.some((f) => f.startsWith('docs/working/')), 'no README ⇒ nothing to be missing from');
});

test('C5 index-coverage respects waivers and enumerates from the filesystem, not the index', () => {
  const proj = mkProject({ taxonomyWaivers: ['docs/backlog/TICKET-waived.md'] });
  write(proj, 'docs/backlog/README.md', '# backlog\n\nNothing listed here.\n');
  write(proj, 'docs/backlog/TICKET-waived.md', '# waived\n');
  write(proj, 'docs/backlog/TICKET-not-waived.md', '# not waived\n');

  const r = taxonomyLint(proj);
  const unindexed = r.findings.filter((f) => f.kind === 'unindexed-doc').map((f) => f.file);
  assert.deepEqual(unindexed, ['docs/backlog/TICKET-not-waived.md'], JSON.stringify(r.findings));
});

test('D2 taxonomyLint index-integrity: a README listing a renamed-away file is flagged', () => {
  const proj = mkProject();
  write(proj, 'docs/working/PLAN-real.md', '# exists\n');
  write(proj, 'docs/working/README.md', '# Index\n| `PLAN-real.md` | live |\n| `PLAN-gone.md` | renamed away |\n'); // gone → flag
  const r = taxonomyLint(proj);
  const dead = r.findings.filter((f) => f.kind === 'dead-index-entry');
  assert.equal(dead.length, 1, JSON.stringify(r.findings));
  assert.ok(dead[0].detail.includes('PLAN-gone.md'));
});

test('D2 taxonomyLint index-integrity: placeholder-shaped tokens and marker-suppressed lines are not flagged', () => {
  const proj = mkProject();
  write(proj, 'docs/working/PLAN-real.md', '# exists\n');
  write(proj, 'docs/working/README.md', [
    '# Index',
    '| `PLAN-real.md` | live |',
    'Example format: `RESULT-N.md`, or `RESULT-NN.md`, `RESULT-X.md`, `RESULT-XX.md`, `result-n.md`.',
    '`MISSING-marked.md` is suppressed on this line. <!-- taxonomy-ignore-line -->',
    '',
  ].join('\n'));
  const r = taxonomyLint(proj);
  const dead = r.findings.filter((f) => f.kind === 'dead-index-entry');
  assert.equal(dead.length, 0, JSON.stringify(r.findings));
});

// ---------- hygiene check (TICKET-02) ----------

function gitInit(cwd) {
  execFileSync('git', ['init'], { cwd, encoding: 'utf8', stdio: 'pipe' });
  execFileSync('git', ['config', 'user.email', 'test@test'], { cwd, encoding: 'utf8', stdio: 'pipe' });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd, encoding: 'utf8', stdio: 'pipe' });
}

function gitCommit(cwd, msg, env) {
  execFileSync('git', ['add', '.'], { cwd, encoding: 'utf8', stdio: 'pipe' });
  execFileSync('git', ['commit', '-m', msg], { cwd, encoding: 'utf8', stdio: 'pipe', ...(env ? { env } : {}) });
}

// ---------- sibling-branch warn ----------

test('sibling-branch warn: kit clone not on main/master warns during sync/check; --allow-branch suppresses; non-git kit is silent', () => {
  const kit = mkKit();
  gitInit(kit);
  gitCommit(kit, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: kit, encoding: 'utf8', stdio: 'pipe' });
  const proj = mkProject();

  // kit on main → no warn
  let plan = planSync(proj, { kitRoot: kit });
  assert.ok(!plan.validations.some((v) => /not main/.test(v.msg)), JSON.stringify(plan.validations));

  // kit checked out to a feature branch → warn present
  execFileSync('git', ['checkout', '-b', 'feat/x'], { cwd: kit, encoding: 'utf8', stdio: 'pipe' });
  plan = planSync(proj, { kitRoot: kit });
  const warn = plan.validations.find((v) => v.level === 'warn' && /not main/.test(v.msg));
  assert.ok(warn, JSON.stringify(plan.validations));
  assert.ok(warn.msg.includes('feat/x'), warn.msg);
  assert.ok(warn.msg.includes('--allow-branch'), warn.msg);

  // sync and check surface the same validation
  const s = syncProject(proj, { kitRoot: kit });
  assert.ok(s.validations.some((v) => /not main/.test(v.msg)), JSON.stringify(s.validations));
  const c = checkProject(proj, { kitRoot: kit });
  assert.ok(c.validations.some((v) => /not main/.test(v.msg)), JSON.stringify(c.validations));

  // --allow-branch acknowledges and suppresses it
  plan = planSync(proj, { kitRoot: kit, allowBranch: true });
  assert.ok(!plan.validations.some((v) => /not main/.test(v.msg)), JSON.stringify(plan.validations));

  // self-sync (the kit syncing itself) never warns regardless of branch
  write(kit, '.agentkit.json', JSON.stringify({ vendors: ['claude'], stack: [], tools: [], overlay: {}, pins: {} }));
  plan = planSync(kit, { kitRoot: kit });
  assert.ok(!plan.validations.some((v) => /not main/.test(v.msg)), JSON.stringify(plan.validations));

  // a plain non-git tmp-dir kit fixture never warns (airtight null path — must not pick up an
  // ENCLOSING repo's branch state; the kit fixture itself carries no .git of its own)
  const kit2 = mkKit();
  plan = planSync(proj, { kitRoot: kit2 });
  assert.ok(!plan.validations.some((v) => /not main/.test(v.msg)), JSON.stringify(plan.validations));
});

test('check --quick surfaces the sibling-branch warn (the SessionStart hook path); allowBranch suppresses', () => {
  const kit = mkKit();
  gitInit(kit);
  gitCommit(kit, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: kit, encoding: 'utf8', stdio: 'pipe' });
  execFileSync('git', ['checkout', '-b', 'feat/x'], { cwd: kit, encoding: 'utf8', stdio: 'pipe' });
  const proj = mkProject();
  // quick mode skips planSync entirely, but the hook runs --quick — the warn must still surface
  const c = checkProject(proj, { quick: true, kitRoot: kit });
  assert.ok(c.validations.some((v) => v.level === 'warn' && /not main/.test(v.msg)), JSON.stringify(c.validations));
  assert.ok(c.clean, 'a warn-level validation must not flip quick-check to dirty');
  const c2 = checkProject(proj, { quick: true, kitRoot: kit, allowBranch: true });
  assert.ok(!c2.validations.some((v) => /not main/.test(v.msg)), JSON.stringify(c2.validations));
  // self-check (kit checking itself) stays silent regardless of branch
  write(kit, '.agentkit.json', JSON.stringify({ vendors: ['claude'], stack: [], tools: [], overlay: {}, pins: {} }));
  const c3 = checkProject(kit, { quick: true, kitRoot: kit });
  assert.ok(!c3.validations.some((v) => /not main/.test(v.msg)), JSON.stringify(c3.validations));
});

test('lock is write-if-changed: a no-op sync does not rewrite .agentkit.lock with a fresh syncedAt', () => {
  const kit = mkKit();
  const proj = mkProject();
  syncProject(proj, { kitRoot: kit });
  const p = path.join(proj, '.agentkit.lock');
  const stamped = JSON.parse(fs.readFileSync(p, 'utf8'));
  stamped.syncedAt = '2020-01-01T00:00:00.000Z'; // simulate an earlier sync, content identical
  fs.writeFileSync(p, JSON.stringify(stamped, null, 2) + '\n');
  const r = syncProject(proj, { kitRoot: kit });
  assert.equal(r.written.length, 0, 'second sync is a no-op on vendor files');
  const after = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.equal(after.syncedAt, '2020-01-01T00:00:00.000Z', 'a syncedAt-only delta must not rewrite the lock');
  // a real content change still rewrites (and re-stamps)
  write(kit, '.agent/rules/new-rule.md', '---\ntrigger: always\ndescription: New rule.\n---\n\n# New Rule\n');
  syncProject(proj, { kitRoot: kit });
  const changed = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.notEqual(changed.syncedAt, '2020-01-01T00:00:00.000Z', 'a content change re-stamps syncedAt');
});

test('compileManifest is write-if-changed: a later-day recompile with unchanged sources does not rewrite (F-cli-sync-dirties-kit)', () => {
  const kit = mkKit();
  compileManifest(kit);
  const p = path.join(kit, 'manifest.json');
  const stamped = JSON.parse(fs.readFileSync(p, 'utf8'));
  stamped.compiledAt = '2020-01-01'; // simulate a compile from an earlier day, content identical
  fs.writeFileSync(p, JSON.stringify(stamped, null, 2) + '\n');
  compileManifest(kit);
  const after = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.equal(after.compiledAt, '2020-01-01', 'a compiledAt-only delta must not rewrite the manifest');
  // a real content change still recompiles (and re-dates)
  write(kit, '.agent/rules/new-rule.md', '---\ntrigger: always\ndescription: New rule.\n---\n\n# New Rule\n');
  compileManifest(kit);
  const changed = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.notEqual(changed.compiledAt, '2020-01-01', 'a content change recompiles');
  assert.ok(changed.entries.some((e) => e.path === '.agent/rules/new-rule.md'), 'new entry present');
});

test('hygiene: merged-but-open flags an open ticket citing a SHA in main branch', () => {
  const proj = mkProject({ orchestration: { mainBranch: 'main' } });
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' }).toString().trim();
  // Ticket with open status citing the SHA in main
  write(proj, 'docs/backlog/TICKET-test-staff.md', `# TICKET-test\n\n**Status**: ready\n\nMerged via \`${sha}\`.\n`);
  const r = checkHygiene(proj);
  assert.ok(r.findings.some((f) => f.kind === 'merged-but-open'), JSON.stringify(r));
});

test('hygiene: merged-but-open passes when ticket is already done', () => {
  const proj = mkProject({ orchestration: { mainBranch: 'main' } });
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' }).toString().trim();
  // Ticket is done — should NOT flag
  write(proj, 'docs/backlog/TICKET-test-staff.md', `# TICKET-test\n\n**Status**: merged\n\nMerged via \`${sha}\`.\n`);
  const r = checkHygiene(proj);
  assert.ok(!r.findings.some((f) => f.kind === 'merged-but-open'), JSON.stringify(r));
});

test('hygiene: the **Status:** dialect (colon inside the bold) parses like **Status**:', () => {
  const proj = mkProject({ orchestration: { mainBranch: 'main' } });
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' }).toString().trim();
  // Live working tickets write `**Status:** x` (colon inside the bold). A status the fallback
  // cannot parse leaves the ticket silently exempt from every hygiene check — no finding, no flag.
  write(proj, 'docs/backlog/TICKET-dialect-staff.md', `# TICKET-dialect\n\n**Status:** ready\n\nMerged via \`${sha}\`.\n`);
  write(proj, 'docs/working/TICKET-dialect-gate-senior.md', '# gate\n\n**Status:** needs-human-verify — awaiting review\n');
  const r = checkHygiene(proj);
  assert.ok(r.findings.some((f) => f.kind === 'merged-but-open' && f.file === 'docs/backlog/TICKET-dialect-staff.md'),
    `an open ticket in the **Status:** dialect must still be checked: ${JSON.stringify(r.findings)}`);
  assert.ok(r.humanGates.some((g) => g.file === 'docs/working/TICKET-dialect-gate-senior.md'),
    'a human gate in the **Status:** dialect must still reach the generated view');
});

test('TICKET-30/C3: frontmatter status is read, and landed SHAs cannot sit in docs/backlog/', () => {
  const proj = mkProject({ orchestration: { mainBranch: 'main' } });
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' }).toString().trim();

  // shipped work still parked in backlog — the "not yet started" lie, now mechanical
  write(proj, 'docs/backlog/TICKET-shipped-staff.md', `---\nstatus: merged\nlanded: [${sha}]\n---\n\n# shipped\n`);
  // the same artifact in working/ is fine
  write(proj, 'docs/working/TICKET-also-shipped-staff.md', `---\nstatus: merged\nlanded: [${sha}]\n---\n\n# fine\n`);

  const r = checkHygiene(proj);
  const inBacklog = r.findings.filter((f) => f.kind === 'landed-in-backlog');
  assert.equal(inBacklog.length, 1, JSON.stringify(r.findings));
  assert.equal(inBacklog[0].file, 'docs/backlog/TICKET-shipped-staff.md');
  assert.ok(!r.findings.some((f) => f.kind === 'landed-not-ancestor'), 'a real ancestor SHA is accepted');
  // frontmatter status was read: `merged` is not open, so merged-but-open must not fire
  assert.ok(!r.findings.some((f) => f.kind === 'merged-but-open'), 'frontmatter status:merged suppresses merged-but-open');
});

test('TICKET-30/C3: a landed: SHA that is not an ancestor — or not in this repo — is flagged', () => {
  const proj = mkProject({ orchestration: { mainBranch: 'main' } });
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  // a SHA-shaped token that names no commit here (the flowback / cross-repo case)
  write(proj, 'docs/working/TICKET-foreign-staff.md', '---\nstatus: merged\nlanded: [41b10d96]\n---\n\n# foreign\n');
  const r = checkHygiene(proj);
  assert.ok(r.findings.some((f) => f.kind === 'landed-not-ancestor'), JSON.stringify(r.findings));
});

test('D6: a cross-repo SHA cited in ticket PROSE is silent — not ours, so not an error', () => {
  const proj = mkProject({ orchestration: { mainBranch: 'main' } });
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  // an open ticket citing its SOURCE repo's commit — a flowback ticket does exactly this
  write(proj, 'docs/backlog/TICKET-flowback-staff.md', '# flowback\n\n**Status**: ready\n\n**Provenance**: source ticket at proj-resume `41b10d96`.\n');
  const r = checkHygiene(proj);
  assert.ok(!r.errors.some((e) => e.kind === 'could-not-determine'), `foreign SHA must not raise an error: ${JSON.stringify(r.errors)}`);
  assert.ok(!r.findings.some((f) => f.kind === 'merged-but-open'), 'and it is not an ancestor either');
});

test('TICKET-30/C6: the human-gate view is generated from the filesystem, never from an index', () => {
  const proj = mkProject({ orchestration: { mainBranch: 'main' } });
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  // frontmatter form, prose form, and one that is NOT a gate — plus an index that omits both gates
  write(proj, 'docs/working/TICKET-fm-gate-senior.md', '---\nstatus: needs-human-verify\n---\n\n# fm gate\n');
  write(proj, 'docs/backlog/TICKET-prose-gate-junior.md', '# prose gate\n\n**Status**: needs-human-verify — browser check pending\n');
  write(proj, 'docs/working/TICKET-not-a-gate-staff.md', '---\nstatus: ready\n---\n\n# not a gate\n');
  write(proj, 'docs/working/README.md', '# working\n\nNo gates listed here at all.\n');

  const gates = checkHygiene(proj).humanGates.map((g) => g.file).sort();
  assert.deepEqual(gates, ['docs/backlog/TICKET-prose-gate-junior.md', 'docs/working/TICKET-fm-gate-senior.md'],
    'both spellings found, and the omitting index is irrelevant because it is never the enumerator');
});

test('hygiene: uncommitted-docs flags dirty docs/ dir', () => {
  const proj = mkProject();
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  // dirty docs/ without committing
  write(proj, 'docs/working/uncommitted.md', '# uncommitted\n');
  const r = checkHygiene(proj);
  assert.ok(r.findings.some((f) => f.kind === 'uncommitted-docs'), JSON.stringify(r));
});

test('hygiene: stale-ticket flags a ticket untouched past threshold', () => {
  const proj = mkProject({ orchestration: { mainBranch: 'main' }, thresholds: { staleTicketDays: 14 } });
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  // Ticket committed with an old date
  write(proj, 'docs/backlog/TICKET-old-staff.md', '# TICKET-old\n\n**Status**: ready\n\nOld.\n');
  const env = { ...process.env, GIT_AUTHOR_DATE: '2024-01-01T12:00:00', GIT_COMMITTER_DATE: '2024-01-01T12:00:00' };
  gitCommit(proj, 'old ticket', env);
  const r = checkHygiene(proj);
  assert.ok(r.findings.some((f) => f.kind === 'stale-ticket'), JSON.stringify(r));
});

test('hygiene: unstamped-feedback flags a post-marker entry lacking Provenance; stamped passes; legacy exempt', () => {
  const proj = mkProject();
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  // legacy entry above the marker (exempt), one stamped + one unstamped below it
  write(proj, 'docs/backlog/IDEA-test-feedback.md', [
    '# IDEA: feedback pool', '',
    '### L1 — legacy finding (no stamp, above marker)', 'Old observation.', '',
    '<!-- provenance-required-below -->', '',
    '### N1 — stamped finding',
    '**Provenance**: senior · claude-opus-4-8 · T2 · session', 'Observed thing.', '',
    '### N2 — unstamped finding', 'Naked claim.', '',
  ].join('\n'));
  const r = checkHygiene(proj);
  const unstamped = r.findings.filter((f) => f.kind === 'unstamped-feedback');
  assert.equal(unstamped.length, 1, JSON.stringify(r.findings));
  assert.ok(unstamped[0].detail.includes('N2'), 'flags the unstamped entry by title');
  assert.ok(!unstamped.some((f) => f.detail.includes('L1')), 'legacy entry above the marker exempt');
  assert.ok(!unstamped.some((f) => f.detail.includes('N1')), 'stamped entry passes');

  // a pool with no marker at all is fully exempt (legacy)
  write(proj, 'docs/backlog/IDEA-old-feedback.md', '# old pool\n\n### O1 — old\nNo stamp.\n');
  const r2 = checkHygiene(proj);
  assert.ok(!r2.findings.some((f) => f.kind === 'unstamped-feedback' && f.file.includes('IDEA-old-feedback')), 'marker-less pool exempt');
});

test('hygiene: could-not-determine when ref is unresolvable (fail-closed)', () => {
  const proj = mkProject();
  // no orchestration block → defaults to 'origin/main' which doesn't exist
  gitInit(proj);
  write(proj, 'README.md', '# proj\n');
  gitCommit(proj, 'initial');
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' }).toString().trim();
  write(proj, 'docs/backlog/TICKET-open-staff.md', `# TICKET-open\n\n**Status**: ready\n\nSee commit \`${sha}\`.\n`);
  const r = checkHygiene(proj);
  assert.ok(r.errors.some((e) => e.kind === 'could-not-determine'), JSON.stringify(r));
  assert.ok(!r.findings.some((f) => f.kind === 'merged-but-open'), 'no false positive when could-not-determine');
});

// ---------- TICKET-18: dirty-aware sync guard + kit-moved-ahead nudge ----------

// Red-proof order (foundation-testing §1B): the refusal cases come FIRST — the guard must be seen
// protecting genuinely-dirty state before the self-output bypass is trusted.

test('sync git-guard: genuinely-dirty managed path still refuses without --force; overlay-clean dirt excluded from the message', () => {
  const kit = mkKit();
  const proj = mkProject();
  write(proj, '.agent/rules/project-custom.md', '---\ntrigger: always\n---\n\n# Custom v1\n');
  gitInit(proj);
  const r1 = syncProject(proj, { kitRoot: kit });
  assert.ok(r1.ok);
  gitCommit(proj, 'v1 sync output');

  // kit moves; sync writes v2 (tree clean at that point) but the result is NOT committed
  write(kit, '.agent/skills/implement-feature/SKILL.md', SKILL_MD.replace('Do the work.', 'Do the work v2.'));
  const mid = syncProject(proj, { kitRoot: kit });
  assert.ok(mid.ok, JSON.stringify(mid.reason ?? null));

  // kit moves again — the uncommitted v2 vendor state is real uncommitted work sync v3 cannot reproduce
  write(kit, '.agent/skills/implement-feature/SKILL.md', SKILL_MD.replace('Do the work.', 'Do the work v3.'));
  // …plus an overlay-clean dirty pair (source + vendor copy edited in agreement) that must NOT be named
  write(proj, '.agent/rules/project-custom.md', '---\ntrigger: always\n---\n\n# Custom v2\n');
  write(proj, '.claude/rules/project-custom.md', '---\ntrigger: always\n---\n\n# Custom v2\n');

  const skillRel = '.claude/skills/implement-feature/SKILL.md';
  const r = syncProject(proj, { kitRoot: kit });
  assert.equal(r.ok, false, 'guard must still refuse on non-reproducible dirt');
  assert.ok(r.reason.includes('git not clean'), r.reason);
  assert.ok(r.dirty.some((d) => d.includes(skillRel)), JSON.stringify(r.dirty));
  assert.ok(!r.dirty.some((d) => d.includes('project-custom')), 'overlay-clean dirt must not be named: ' + JSON.stringify(r.dirty));
  assert.ok(read(proj, skillRel).includes('Do the work v2.'), 'refusal must leave the uncommitted state untouched');
});

test('sync git-guard: real user edit on a managed path still refused and named (decision 36 intact)', () => {
  const kit = mkKit();
  const proj = mkProject();
  gitInit(proj);
  const r1 = syncProject(proj, { kitRoot: kit });
  assert.ok(r1.ok);
  gitCommit(proj, 'v1 sync output');

  // genuine user edit on the vendor copy, uncommitted; kit also moves so a write is attempted
  const target = '.claude/skills/implement-feature/SKILL.md';
  write(proj, target, read(proj, target) + '\nLOCAL EDIT\n');
  write(kit, '.agent/skills/implement-feature/SKILL.md', SKILL_MD.replace('Do the work.', 'Do the work v2.'));

  const r = syncProject(proj, { kitRoot: kit });
  assert.ok(r.refusals.some((x) => x.rel === target && x.why.includes('LOCALLY-EDITED')), 'user edit refused by name: ' + JSON.stringify(r.refusals));
  assert.ok(read(proj, target).includes('LOCAL EDIT'), 'user edit must survive');
});

test('sync git-guard: dirt that is sync-reproducible output proceeds without --force (decision 36 narrowed, not weakened)', () => {
  const kit = mkKit();
  const proj = mkProject();
  write(proj, '.agent/rules/project-custom.md', '---\ntrigger: always\n---\n\n# Custom v1\n');
  gitInit(proj);
  const r1 = syncProject(proj, { kitRoot: kit });
  assert.ok(r1.ok);
  gitCommit(proj, 'v1 sync output');

  const target = '.claude/rules/project-custom.md';
  // the overlay source and the vendor copy edited in agreement (flowback already done) — uncommitted
  write(proj, '.agent/rules/project-custom.md', '---\ntrigger: always\n---\n\n# Custom v2\n');
  write(proj, target, '---\ntrigger: always\n---\n\n# Custom v2\n');

  const r = syncProject(proj, { kitRoot: kit });
  assert.ok(r.ok, 'overlay-clean git-dirt must not require --force: ' + JSON.stringify(r.reason ?? null));
  assert.ok(r.written.includes(target), JSON.stringify(r.written));
  const after = read(proj, target);
  assert.ok(after.includes('# Custom v2'), 'regenerated content carries the (reproducible) user work');
  assert.ok(after.includes('AGENTKIT GENERATED'), 'header injected on the regenerated copy');
});

test('check: kit-moved-ahead nudge flags dirtyManaged exactly when managed paths hold uncommitted work', () => {
  const kit = mkKit();
  const proj = mkProject();
  gitInit(proj);
  const r1 = syncProject(proj, { kitRoot: kit });
  assert.ok(r1.ok);
  gitCommit(proj, 'synced');

  const target = '.claude/skills/implement-feature/SKILL.md';

  // kit NOT moved + dirty tree → scan skipped, no flag
  write(proj, target, read(proj, target) + '\nLOCAL EDIT\n');
  let c = checkProject(proj, { kitRoot: kit, noWrite: true });
  assert.equal(c.kitMovedAhead, false);
  assert.deepEqual(c.dirtyManaged, [], 'porcelain scan must be skipped when kit has not moved');

  // kit moved ahead + dirty managed path → flagged
  write(kit, 'package.json', JSON.stringify({ name: 'agentkit', version: '0.2.0' }));
  c = checkProject(proj, { kitRoot: kit, noWrite: true });
  assert.equal(c.kitMovedAhead, true);
  assert.ok(c.dirtyManaged.some((l) => l.includes(target)), JSON.stringify(c.dirtyManaged));

  // kit moved ahead + committed (clean) tree → nudge without caution
  gitCommit(proj, 'edit committed');
  c = checkProject(proj, { kitRoot: kit, noWrite: true });
  assert.equal(c.kitMovedAhead, true);
  assert.deepEqual(c.dirtyManaged, []);
});

test('check: gitDirty catches a managed-path edit the hash comparison misses (EOL-normalized false-clean), while clean stays true (Decision D, warning-only)', () => {
  const kit = mkKit();
  const proj = mkProject();
  gitInit(proj);
  // Force real CRLF/LF byte diffs to survive `git status` regardless of the host's global
  // core.autocrlf — this repro must be deterministic, not machine-dependent.
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  const r1 = syncProject(proj, { kitRoot: kit });
  assert.ok(r1.ok);
  gitCommit(proj, 'synced');

  const target = '.claude/skills/implement-feature/SKILL.md';
  const lfContent = read(proj, target);
  // Reproduces the reported bug exactly: sha() normalizes EOL before hashing (adapters.mjs
  // normalizeEol), so rewriting the SAME text with CRLF line endings hashes IDENTICALLY to the
  // committed LF version — the hash-based `results` above therefore treats the file as IN-SYNC and
  // never lists it, even though git sees real uncommitted bytes on disk.
  write(proj, target, lfContent.replace(/\n/g, '\r\n'));

  const c = checkProject(proj, { kitRoot: kit, noWrite: true });
  assert.equal(c.kitMovedAhead, false, 'kit must not have moved — proves gitDirty runs independent of the kitMovedAhead gate');
  assert.ok(!c.results.some((r) => r.rel === target), 'hash-based results must NOT flag the EOL-only rewrite — that IS the bug being reproduced: ' + JSON.stringify(c.results));
  assert.deepEqual(c.dirtyManaged, [], 'the OLD kitMovedAhead-gated field stays blind here (unchanged behavior)');
  assert.ok(c.gitDirty.includes(target), 'gitDirty must catch what the hash comparison missed: ' + JSON.stringify(c.gitDirty));
  assert.ok(c.clean, 'clean must stay true — gitDirty is purely informational per Decision D, a repo with WIP is not "unclean"');
});

test('check: gitDirty is empty for a fully committed, clean managed tree', () => {
  const kit = mkKit();
  const proj = mkProject();
  gitInit(proj);
  const r1 = syncProject(proj, { kitRoot: kit });
  assert.ok(r1.ok);
  gitCommit(proj, 'synced');

  const c = checkProject(proj, { kitRoot: kit, noWrite: true });
  assert.deepEqual(c.gitDirty, []);
  assert.ok(c.clean);
});

test('check: gitDirty fails safe to [] (no throw) when the project has no .git', () => {
  const kit = mkKit();
  const proj = mkProject(); // mkProject never runs gitInit
  const r1 = syncProject(proj, { kitRoot: kit });
  assert.ok(r1.ok);

  const c = checkProject(proj, { kitRoot: kit, noWrite: true });
  assert.deepEqual(c.gitDirty, []);
});

test('check CLI: printed output lists gitDirty as informational, separate from verdict lines', () => {
  const kit = mkKit();
  const proj = mkProject();
  gitInit(proj);
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  const r1 = syncProject(proj, { kitRoot: kit });
  assert.ok(r1.ok);
  gitCommit(proj, 'synced');
  const target = '.claude/skills/implement-feature/SKILL.md';
  write(proj, target, read(proj, target).replace(/\n/g, '\r\n'));

  const c = checkProject(proj, { kitRoot: kit, noWrite: true });
  let out = '';
  const orig = console.log;
  console.log = (s) => { out += `${s}\n`; };
  try {
    printCheck(c, false);
  } finally { console.log = orig; }
  assert.ok(out.includes(`[git-dirty] ${target}`), out);
  assert.ok(out.includes('informational; does not affect clean'), out);
});

test('check CLI: printed nudge appends the defer-while-dirty caution', () => {
  const kit = mkKit();
  const proj = mkProject();
  gitInit(proj);
  syncProject(proj, { kitRoot: kit }); // lock pins fixture-kit 0.1.0 — the real kit is ahead
  gitCommit(proj, 'synced');
  write(proj, '.claude/skills/implement-feature/SKILL.md', 'user dirt\n');
  let out = '';
  const orig = console.log;
  console.log = (s) => { out += `${s}\n`; };
  try {
    main(['check', proj, '--quick']);
  } finally { console.log = orig; }
  assert.ok(out.includes('kit moved ahead'), out);
  assert.ok(out.includes('defer sync while another session may be mid-flight'), out);
});

// ---------- Wave 2: orchestrator lock (A4) ----------

test('lock: acquire writes, second acquire refuses (fail-closed), release removes, release is idempotent', () => {
  const proj = fs.mkdtempSync(path.join(TMP, 'lock-'));
  const a = orchestratorLock(proj, 'acquire', { id: 'orch-1' });
  assert.equal(a.ok, true, JSON.stringify(a));
  assert.ok(exists(proj, '.orchestrator.lock'), 'lock file written on acquire');
  assert.match(a.holder, /orch-1\//);

  // held → refuse, and DO NOT steal (red-proof: the ok:false path is the gate)
  const held = orchestratorLock(proj, 'acquire', { id: 'orch-2' });
  assert.equal(held.ok, false, 'second acquire must refuse');
  assert.equal(held.reason, 'held');
  assert.match(held.held, /orch-1\//, 'refusal reports the original holder, not the challenger');

  const s = orchestratorLock(proj, 'status');
  assert.equal(s.held, true);

  const rel1 = orchestratorLock(proj, 'release');
  assert.equal(rel1.released, true);
  assert.ok(!exists(proj, '.orchestrator.lock'), 'lock file removed on release');

  // idempotent: releasing an absent lock is a no-op success
  const rel2 = orchestratorLock(proj, 'release');
  assert.equal(rel2.ok, true);
  assert.equal(rel2.released, false);

  // after release, acquire succeeds again
  assert.equal(orchestratorLock(proj, 'acquire').ok, true);
});

test('lock CLI: acquire returns 0, held acquire returns 1', () => {
  const proj = fs.mkdtempSync(path.join(TMP, 'lockcli-'));
  const orig = console.log; console.log = () => {};
  try {
    assert.equal(main(['lock', 'acquire', proj]), 0, 'first acquire exits 0');
    assert.equal(main(['lock', 'acquire', proj]), 1, 'held acquire exits 1');
    assert.equal(main(['lock', 'release', proj]), 0);
  } finally { console.log = orig; }
});

// ---------- Wave 2: surface overlap (A5) ----------

test('surfaces: reports per-branch surface and pairwise disjoint/overlap', () => {
  const proj = fs.mkdtempSync(path.join(TMP, 'surf-'));
  gitInit(proj);
  write(proj, 'shared.ts', 'base\n');
  write(proj, 'README.md', '# base\n');
  gitCommit(proj, 'base');
  execFileSync('git', ['branch', '-M', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });

  // branch A touches shared.ts + a.ts
  execFileSync('git', ['checkout', '-b', 'lane-a'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  write(proj, 'shared.ts', 'a-change\n');
  write(proj, 'a.ts', 'a\n');
  gitCommit(proj, 'a');
  // branch B (from main) touches shared.ts + b.ts → overlaps A on shared.ts
  execFileSync('git', ['checkout', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  execFileSync('git', ['checkout', '-b', 'lane-b'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  write(proj, 'shared.ts', 'b-change\n');
  write(proj, 'b.ts', 'b\n');
  gitCommit(proj, 'b');
  // branch C (from main) touches only c.ts → disjoint from both
  execFileSync('git', ['checkout', 'main'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  execFileSync('git', ['checkout', '-b', 'lane-c'], { cwd: proj, encoding: 'utf8', stdio: 'pipe' });
  write(proj, 'c.ts', 'c\n');
  gitCommit(proj, 'c');

  const r = surfaceOverlap(proj, 'main', ['lane-a', 'lane-b', 'lane-c']);
  assert.deepEqual(r.surfaces['lane-a'], ['a.ts', 'shared.ts']);
  assert.deepEqual(r.surfaces['lane-c'], ['c.ts']);
  const ab = r.overlaps.find((o) => o.a === 'lane-a' && o.b === 'lane-b');
  assert.deepEqual(ab.shared, ['shared.ts'], 'A∩B share shared.ts');
  assert.equal(ab.disjoint, false);
  const ac = r.overlaps.find((o) => o.a === 'lane-a' && o.b === 'lane-c');
  assert.equal(ac.disjoint, true, 'A∩C disjoint');
  assert.equal(r.disjoint, false, 'wave is not fully disjoint because A/B collide');
});

// ---------- Wave 2: gate:* scaffolding (A2) ----------

test('scaffoldGateScripts: wires gate:* for present scripts, skips absent, never overwrites, builds aggregate', () => {
  const proj = fs.mkdtempSync(path.join(TMP, 'gate-'));
  // project has lint + typecheck + test, no build; a hand-written gate:test must be respected
  write(proj, 'package.json', JSON.stringify({
    name: 'p', version: '1.0.0',
    scripts: { lint: 'eslint .', typecheck: 'tsc --noEmit', test: 'vitest run', 'gate:test': 'vitest run --coverage' },
  }, null, 2));
  const r = scaffoldGateScripts(proj);
  assert.equal(r.scaffolded, true, JSON.stringify(r));
  const pkg = JSON.parse(read(proj, 'package.json'));
  assert.equal(pkg.scripts['gate:lint'], 'npm run lint');
  assert.equal(pkg.scripts['gate:types'], 'npm run typecheck');
  assert.equal(pkg.scripts['gate:test'], 'vitest run --coverage', 'existing gate:test not overwritten');
  assert.equal(pkg.scripts['gate:build'], undefined, 'no build script → no gate:build');
  assert.equal(pkg.scripts.gate, 'npm run gate:lint && npm run gate:types && npm run gate:test');
  // idempotent: second run adds nothing
  const r2 = scaffoldGateScripts(proj);
  assert.equal(r2.scaffolded, false, 'second scaffold is a no-op');
});

test('scaffoldGateScripts: no package.json → no-op, no crash', () => {
  const proj = fs.mkdtempSync(path.join(TMP, 'gate-none-'));
  const r = scaffoldGateScripts(proj);
  assert.equal(r.scaffolded, false);
  assert.equal(r.reason, 'no package.json');
});

// ---------- Wave 3: kit-owned permissions.allow baseline (decision 16 revised) ----------

test('claude-permissions merge: unions baseline, preserves user entries, prunes stale kit entries', () => {
  // existing: one user entry + one prior-kit entry that is NO LONGER in the baseline (stale)
  const existing = JSON.stringify({ permissions: { allow: ['Bash(git*)', 'Bash(npx oldtool *)'] }, custom: 1 });
  const baseline = ['Bash(npm run gate*)', 'Bash(node * lock *)'];
  const lockKeys = ['SessionStart', 'Bash(npx oldtool *)']; // hooks event + our prior perm entry
  const { content, managedKeys } = mergeSettings({ merge: 'claude-permissions', data: baseline }, existing, lockKeys);
  const j = JSON.parse(content);
  assert.ok(j.permissions.allow.includes('Bash(git*)'), 'user entry preserved');
  assert.ok(!j.permissions.allow.includes('Bash(npx oldtool *)'), 'stale kit entry pruned');
  assert.ok(j.permissions.allow.includes('Bash(npm run gate*)') && j.permissions.allow.includes('Bash(node * lock *)'), 'baseline added');
  assert.equal(j.custom, 1, 'unrelated keys untouched');
  assert.deepEqual(managedKeys, baseline, 'managedKeys are the baseline entries');
});

test('claude-permissions merge: idempotent (second merge is a no-op on content)', () => {
  const baseline = ['Bash(npm run gate*)', 'Bash(comm *)'];
  const once = mergeSettings({ merge: 'claude-permissions', data: baseline }, JSON.stringify({ permissions: { allow: ['Bash(git*)'] } }), []);
  const twice = mergeSettings({ merge: 'claude-permissions', data: baseline }, once.content, baseline);
  assert.equal(twice.content, once.content, 'stable across re-merge');
});

test('claude-hooks and claude-permissions coexist on settings.json without clobbering each other', () => {
  const kit = mkKit();
  const proj = mkProject();
  write(proj, '.claude/settings.json', JSON.stringify({ permissions: { allow: ['Bash(git*)'] } }, null, 2));
  syncProject(proj, { kitRoot: kit });
  const s = JSON.parse(read(proj, '.claude/settings.json'));
  assert.ok(s.hooks.SessionStart, 'hooks written');
  assert.ok(s.permissions.allow.includes('Bash(git*)'), 'user perm preserved');
  assert.ok(s.permissions.allow.includes('Bash(npm run gate*)'), 'baseline perm added');
  // idempotent: re-sync produces no duplicates
  syncProject(proj, { kitRoot: kit });
  const s2 = JSON.parse(read(proj, '.claude/settings.json'));
  assert.equal(s2.permissions.allow.filter((e) => e === 'Bash(npm run gate*)').length, 1, 'no duplicate baseline entry');
  assert.equal(s2.hooks.SessionStart.flatMap((g) => g.hooks).filter((h) => h.command.includes('agentkit')).length, 1, 'no duplicate hook');
});

test('claudePermissionsBaseline: opt-out, worktree wildcards, extras, exclusions', () => {
  // default: base entries present, NO worktree wildcards (no worktreeRoot), excludes push/broad-rm
  const def = claudePermissionsBaseline({ projectRoot: '/x/proj-resume', config: {} });
  assert.ok(def.includes('Bash(npm run gate*)'));
  assert.ok(!def.some((e) => e.includes('-wt/')), 'no worktree wildcards without worktreeRoot');
  assert.ok(!def.some((e) => /git push|Bash\(rm \*\)|Stop-Process|powershell -NoProfile/.test(e)), 'excludes outward/arbitrary grants');
  assert.ok(!def.includes('Bash(node *)'), 'no blanket node grant');
  // worktreeRoot → repo-scoped wildcard derived from projectRoot basename
  const wt = claudePermissionsBaseline({ projectRoot: '/x/proj-resume', config: { permissions: { worktreeRoot: 'C:/tmp' } } });
  assert.ok(wt.includes('Bash(npm --prefix C:/tmp/proj-resume-wt/*)'), JSON.stringify(wt));
  // extra merged; enabled:false → empty
  const ex = claudePermissionsBaseline({ projectRoot: '/x/p', config: { permissions: { extra: ['Bash(mytool *)'] } } });
  assert.ok(ex.includes('Bash(mytool *)'));
  assert.deepEqual(claudePermissionsBaseline({ projectRoot: '/x/p', config: { permissions: { enabled: false } } }), []);
  // no MCP entries when the codegraph server is not registered
  assert.ok(!def.some((e) => e.startsWith('mcp__')), 'no mcp entries without a registered server');
});

test('claudePermissionsBaseline: codebase-memory MCP read-only tools gated on server registration', () => {
  const withServer = claudePermissionsBaseline({ projectRoot: '/x/p', config: {}, mcpServers: { 'codebase-memory-mcp': { command: 'x' } } });
  // 10 read-only tools present, exact server key
  for (const t of ['search_graph', 'query_graph', 'trace_path', 'get_code_snippet', 'get_graph_schema', 'get_architecture', 'search_code', 'list_projects', 'index_status', 'detect_changes']) {
    assert.ok(withServer.includes(`mcp__codebase-memory-mcp__${t}`), `read-only tool ${t} allowed`);
  }
  // the 4 mutating/heavy tools are NOT allowed (no whole-server wildcard)
  for (const t of ['index_repository', 'delete_project', 'ingest_traces', 'manage_adr']) {
    assert.ok(!withServer.includes(`mcp__codebase-memory-mcp__${t}`), `mutating tool ${t} stays gated`);
  }
  assert.ok(!withServer.includes('mcp__codebase-memory-mcp__*'), 'no whole-server wildcard');
  // a different (non-codegraph) MCP server contributes no entries
  const other = claudePermissionsBaseline({ projectRoot: '/x/p', config: {}, mcpServers: { 'some-other-mcp': { command: 'y' } } });
  assert.ok(!other.some((e) => e.startsWith('mcp__')), 'unrelated MCP server yields no mcp entries');
});

// ---------- Wave 3: settings hygiene (C5) ----------

test('scanSettingsHygiene: flags fossil, over-broad grant, defaultMode cascade, stale trustedDirectories; clean passes', () => {
  const proj = fs.mkdtempSync(path.join(TMP, 'hyg-'));
  const home = fs.mkdtempSync(path.join(TMP, 'home-'));
  // global layer holds a fossil + an over-broad grant
  write(home, '.claude/settings.json', JSON.stringify({ permissions: { allow: [
    'Bash(cd x && npm run build > /tmp/log 2>&1; echo $?)', // compound fossil
    'Bash(*)',                                              // over-broad
    'Bash(npm run gate*)',                                  // clean → not flagged
  ] } }));
  // project declares bypass; local shadows it with auto (the BDW cascade trap) + a stale trustedDir
  write(proj, '.claude/settings.json', JSON.stringify({ defaultMode: 'bypassPermissions', trustedDirectories: ['/other/proj-portfolio'] }));
  write(proj, '.claude/settings.local.json', JSON.stringify({ defaultMode: 'auto' }));

  const r = scanSettingsHygiene(proj, { homeDir: home });
  const kinds = r.findings.map((f) => f.kind);
  assert.ok(kinds.includes('fossil-permission'), 'fossil flagged');
  assert.ok(kinds.includes('overbroad-grant'), 'over-broad grant flagged');
  assert.ok(kinds.includes('defaultmode-cascade'), 'cascade flagged');
  assert.ok(kinds.includes('stale-trusteddir'), 'stale trustedDirectories flagged');
  // the clean baseline entry must NOT be flagged
  assert.ok(!r.findings.some((f) => f.detail.includes('Bash(npm run gate*)')), 'clean entry not flagged');
});

test('scanSettingsHygiene: kit-style clean settings yield zero findings', () => {
  const proj = fs.mkdtempSync(path.join(TMP, 'hyg-clean-'));
  const home = fs.mkdtempSync(path.join(TMP, 'home-clean-'));
  write(proj, '.claude/settings.json', JSON.stringify({ permissions: { allow: [
    'Bash(npm run gate*)', 'Bash(node * lock *)', 'Bash(comm *)', 'Bash(rm -f .orchestrator.lock)',
  ] } }));
  const r = scanSettingsHygiene(proj, { homeDir: home });
  assert.deepEqual(r.findings, [], JSON.stringify(r.findings));
});

// ---------- operate-kit adoption batch (2026-07-25) ----------
// Three defects found by standing up the first Python-primary, non-app fleet member
// (`kinds: ["agent-infra"]`). See docs/backlog/IDEA-post-v06-feedback.md.

// F-perms-npm-in-non-app. The baseline shipped 10-of-19 npm/npx entries into a repo with no
// package.json. The zero-delta guarantee for the 9 existing app repos is the first assertion here:
// an absent `kinds` MUST still resolve to ['app'] exactly as selectEntries/loadConfig do, because 8
// of the 9 app repos carry no `kinds` key at all.
test('claudePermissionsBaseline: npm/npx block is gated on the app axis — absent kinds still yields the pre-gate baseline', () => {
  const npmish = (list) => list.filter((e) => /npm |npx /.test(e));
  const neutral = ['Bash(node * lock *)', 'Bash(comm *)', 'Bash(git fetch *)', 'Bash(rm -f .orchestrator.lock)'];

  // 1. absent `kinds` — the shape every pre-kinds app repo's config has. MUST be unchanged.
  const implicit = claudePermissionsBaseline({ projectRoot: '/x/proj-resume', config: {} });
  assert.equal(npmish(implicit).length, 10, 'absent kinds defaults to app → all 10 npm/npx entries: ' + JSON.stringify(npmish(implicit)));
  assert.ok(implicit.includes('Bash(npm run gate*)') && implicit.includes('Bash(npx vitest run *)'));

  // 2. explicit app — identical selection to the implicit default.
  const app = claudePermissionsBaseline({ projectRoot: '/x/p', config: { kinds: ['app'] } });
  assert.deepEqual(app, implicit, 'explicit kinds:[app] must be byte-identical to the absent-kinds default');

  // 3. non-app — the npm/npx block is gone, every stack-neutral entry survives.
  const infra = claudePermissionsBaseline({ projectRoot: '/x/operate-kit', config: { kinds: ['agent-infra'] } });
  assert.deepEqual(npmish(infra), [], 'a non-app repo with no package.json must receive ZERO npm/npx grants: ' + JSON.stringify(npmish(infra)));
  for (const e of neutral) assert.ok(infra.includes(e), `stack-neutral entry ${e} must stay ungated`);

  // 4. a non-app repo that DOES declare a JS pack still gets the block — gated on the same axes
  //    selectEntries resolves `tech:*` with (cfg.stack.includes(pack)), not on kind alone.
  const infraJs = claudePermissionsBaseline({ projectRoot: '/x/p', config: { kinds: ['agent-infra'], stack: ['react'] } });
  assert.ok(infraJs.includes('Bash(npm run gate*)'), 'a declared JS pack re-enables the npm block regardless of kind');
});

test('claudePermissionsBaseline: python/container block is axis-gated too — never sprayed at repos that did not declare it', () => {
  const py = ['Bash(uv run *)', 'Bash(ruff *)', 'Bash(pytest *)'];

  // tech:python — mirrors selectEntries' `cfg.stack.includes(e.tier.slice(5))`
  const python = claudePermissionsBaseline({ projectRoot: '/x/p', config: { kinds: ['agent-infra'], stack: ['python'] } });
  for (const e of py) assert.ok(python.includes(e), `python stack must grant ${e}: ` + JSON.stringify(python));
  assert.ok(!python.some((e) => /npm |npx /.test(e)), 'a python repo gets no npm grants');

  // kind:service — the container half
  const svc = claudePermissionsBaseline({ projectRoot: '/x/p', config: { kinds: ['service'] } });
  assert.ok(svc.includes('Bash(docker compose *)'), 'kind:service grants docker compose: ' + JSON.stringify(svc));

  // symmetry guard: an app repo that never declared python/docker must NOT receive them — the
  // inverse of the original defect, and the reason the block is opt-in rather than "non-app implies python".
  const app = claudePermissionsBaseline({ projectRoot: '/x/p', config: {} });
  for (const e of [...py, 'Bash(docker compose *)']) assert.ok(!app.includes(e), `an app repo must not receive ${e}`);
});

test('claudePermissionsBaseline: the npm-flavoured worktree wildcards follow the same JS gate', () => {
  const wt = { permissions: { worktreeRoot: 'C:/tmp' } };
  const app = claudePermissionsBaseline({ projectRoot: '/x/proj-resume', config: wt });
  assert.ok(app.some((e) => e.includes('npm --prefix')), 'app repo keeps the worktree npm wildcard');
  assert.ok(app.includes('Bash(*node_modules/.bin/vitest run *)'));

  const infra = claudePermissionsBaseline({ projectRoot: '/x/p', config: { ...wt, kinds: ['agent-infra'] } });
  assert.ok(!infra.some((e) => e.includes('npm --prefix') || e.includes('node_modules/.bin')), 'node_modules/npm worktree grants are JS-only: ' + JSON.stringify(infra));
});

// F-taxonomy-research-store. The kit's own docs/knowledge-base/README.md designates
// `research/README.md` as "the ledger for completed research" and the kit SHIPS that folder — so
// the documented layout was unreachable without tripping the linter.
test('taxonomyLint: knowledge-base/research/ resolves to the research store — the kit\'s own documented layout lints clean', () => {
  const proj = mkProject();
  write(proj, 'docs/knowledge-base/research/RESEARCH-2026-07-24-thing.md', '# completed research\n'); // the documented layout
  write(proj, 'docs/knowledge-base/research/README.md', '# the ledger for completed research\n');
  write(proj, 'docs/knowledge-base/RESEARCH-loose.md', '# evidence parked in the kb store\n');        // still wrong-store
  write(proj, 'docs/knowledge-base/research/SPEC-thing.md', '# a kb contract in the research ledger\n'); // still wrong-store
  const r = taxonomyLint(proj);
  const wrong = r.findings.filter((f) => f.kind === 'wrong-store').map((f) => f.file);
  assert.ok(!wrong.some((f) => f.includes('research/RESEARCH-')), 'a RESEARCH- doc in the KB research ledger must NOT be wrong-store: ' + JSON.stringify(wrong));
  assert.ok(wrong.some((f) => f.includes('knowledge-base/RESEARCH-loose')), 'a RESEARCH- doc loose in the KB is still wrong-store');
  assert.ok(wrong.some((f) => f.includes('research/SPEC-thing')), 'the carve-out re-maps the store, it does NOT exempt the subtree');
});

test('taxonomyLint: ROADMAP- is a sanctioned lifecycle prefix and docs/architecture/ is a sanctioned KB area', () => {
  const proj = mkProject();
  write(proj, 'docs/working/ROADMAP-v1.md', '# planned work\n');                                    // clean
  write(proj, 'docs/architecture/DECISION-adopt-x.md', '---\nstatus: accepted\n---\n# why\n');      // clean
  write(proj, 'docs/architecture/loose-notes.md', '# unprefixed\n');                                 // missing-prefix
  write(proj, 'docs/knowledge-base/ROADMAP-v2.md', '# a roadmap parked in the kb\n');                // wrong-store
  const r = taxonomyLint(proj);
  const has = (frag, kind) => r.findings.some((f) => f.file.includes(frag) && (!kind || f.kind === kind));
  assert.ok(!has('working/ROADMAP-v1'), 'ROADMAP- in a lifecycle store is clean: ' + JSON.stringify(r.findings));
  assert.ok(!has('architecture/DECISION-adopt-x'), 'DECISION- lands naturally in docs/architecture/: ' + JSON.stringify(r.findings));
  assert.ok(has('architecture/loose-notes', 'missing-prefix'), 'docs/architecture/ is now prefix-checked');
  assert.ok(has('knowledge-base/ROADMAP-v2', 'wrong-store'), 'ROADMAP- is a lifecycle type, not a KB one');
});

// F-init-no-root-contract. init for a non-app kind skipped the JS gate correctly but nothing wrote a
// root AGENTS.md, and sync's K3 workflow-map is opt-in via markers — so the repo landed with 82
// assets and no project contract at all.
test('init scaffolds a root AGENTS.md + CLAUDE.md import when none exists (F-init-no-root-contract)', () => {
  const kit = mkKit();
  // the REAL shipped template — this test is also the proof it still carries the two K3 markers
  write(kit, 'templates/project-AGENTS.md', fs.readFileSync(path.join(KIT_ROOT, 'templates', 'project-AGENTS.md'), 'utf8'));
  const proj = fs.mkdtempSync(path.join(TMP, 'proj-'));
  const r = initProject(proj, { kitRoot: kit, kinds: ['agent-infra'] });
  assert.ok(r.ok, JSON.stringify(r));
  assert.ok(r.rootContract.agents, 'AGENTS.md scaffolded: ' + JSON.stringify(r.rootContract));
  assert.ok(exists(proj, 'AGENTS.md'), 'a non-app repo must not land without a project contract');
  const agents = read(proj, 'AGENTS.md');
  assert.ok(agents.includes('>>> AGENTKIT WORKFLOWS >>>') && agents.includes('<<< AGENTKIT WORKFLOWS <<<'), 'both K3 markers present so the first sync fills the command map');
  // CLAUDE.md uses the @import form, NOT a symlink: Anthropic's docs recommend it on Windows,
  // where symlinks need Administrator or Developer Mode.
  assert.ok(exists(proj, 'CLAUDE.md'));
  assert.equal(read(proj, 'CLAUDE.md').trim(), '@AGENTS.md', 'import form, not a symlink or a copy');
});

test('init never overwrites an authored AGENTS.md or CLAUDE.md', () => {
  const kit = mkKit();
  write(kit, 'templates/project-AGENTS.md', fs.readFileSync(path.join(KIT_ROOT, 'templates', 'project-AGENTS.md'), 'utf8'));
  const proj = fs.mkdtempSync(path.join(TMP, 'proj-'));
  write(proj, 'AGENTS.md', '# authored constitution\nno markers here\n');
  write(proj, 'CLAUDE.md', '# hand-written\n');
  const r = initProject(proj, { kitRoot: kit, kinds: ['agent-infra'] });
  assert.ok(r.ok && !r.rootContract.agents, 'existing AGENTS.md must not be re-scaffolded: ' + JSON.stringify(r.rootContract));
  assert.equal(read(proj, 'AGENTS.md'), '# authored constitution\nno markers here\n', 'authored AGENTS.md byte-identical');
  assert.equal(read(proj, 'CLAUDE.md'), '# hand-written\n', 'authored CLAUDE.md byte-identical');
});
