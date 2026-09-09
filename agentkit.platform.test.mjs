// Platform update regressions. Run directly until the coordinator adds this suite to npm test.
// All effectful probes use fresh owned fixtures; the live kit is read-only.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { sha, syncProject, adoptFile, initProject, recoverOperation, checkProject, checkHygiene, taxonomyLint,
  kbMatch, checkContentIntegrity, changelogRoll } from './agentkit.mjs';
import { setupLauncher } from './agentkit.mjs';
import { parseFrontmatter } from './adapters.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentkit-platform-regression-'));

test('platform local-index: optional companions preserve public and local navigation', () => {
  const f = fixture();
  for (const area of ['working', 'backlog']) {
    put(f.project, `docs/${area}/README.md`, '# Queue\nRead README.local.md if present for local work.\n[TICKET-public.md](TICKET-public.md)\n');
    put(f.project, `docs/${area}/TICKET-public.md`, '# Published work\n');
  }
  assert.deepEqual(checkContentIntegrity(f.project, { kitRoot: f.kit }).findings, []);
  assert.deepEqual(taxonomyLint(f.project).findings, []);
  for (const area of ['working', 'backlog']) {
    put(f.project, `docs/${area}/README.local.md`, '# Local work\n[TICKET-private.md](TICKET-private.md)\n');
    put(f.project, `docs/${area}/TICKET-private.md`, '# Private work\n');
  }
  const before = snapshot(f.project);
  assert.deepEqual(checkContentIntegrity(f.project, { kitRoot: f.kit }).findings, []);
  assert.deepEqual(taxonomyLint(f.project).findings, []);
  assert.deepEqual(snapshot(f.project), before, 'checking must not mutate private or public docs');
});

test('platform local-index: missing local Markdown and code links remain hard failures', () => {
  const f = fixture();
  for (const area of ['working', 'backlog']) {
    put(f.project, `docs/${area}/README.md`, '# Queue\n');
    put(f.project, `docs/${area}/README.local.md`, '# Local work\n[missing](TICKET-missing.md)\n[probe](TEST-missing.mjs)\n');
  }
  const findings = checkContentIntegrity(f.project, { kitRoot: f.kit }).findings;
  assert.equal(findings.length, 4, JSON.stringify(findings));
  assert.ok(findings.every(finding => finding.kind === 'link' && finding.severity !== 'warn'));
});

test('platform local-index: stale bare filenames in companions remain detectable', () => {
  const f = fixture();
  for (const area of ['working', 'backlog']) {
    put(f.project, `docs/${area}/README.md`, '# Queue\n');
    put(f.project, `docs/${area}/README.local.md`, '# Local work\n`TICKET-gone.md`\n');
  }
  const findings = taxonomyLint(f.project).findings;
  assert.equal(findings.length, 2, JSON.stringify(findings));
  assert.ok(findings.every(finding => finding.kind === 'dead-index-entry'));
});

test('platform local-index: unindexed files and nested index ownership remain enforced', () => {
  const f = fixture();
  put(f.project, 'docs/working/README.md', '# Queue\n');
  put(f.project, 'docs/working/README.local.md', '# Local work\nTICKET-nested.md\n');
  put(f.project, 'docs/working/TICKET-unlisted.md', '# Unlisted\n');
  put(f.project, 'docs/working/topic/README.md', '# Topic\n');
  put(f.project, 'docs/working/topic/TICKET-nested.md', '# Nested\n');
  const findings = taxonomyLint(f.project).findings;
  assert.deepEqual(findings.map(finding => [finding.file, finding.kind]).sort(), [
    ['docs/working/TICKET-unlisted.md', 'unindexed-doc'],
    ['docs/working/topic/TICKET-nested.md', 'unindexed-doc'],
  ]);
});

test('platform local-index: valid local navigation cannot hide a broken public link', () => {
  const f = fixture();
  put(f.project, 'docs/working/README.md', '# Queue\n[missing](TICKET-public-missing.md)\n');
  put(f.project, 'docs/working/README.local.md', '# Local work\n[TICKET-private.md](TICKET-private.md)\n');
  put(f.project, 'docs/working/TICKET-private.md', '# Private\n');
  const findings = checkContentIntegrity(f.project, { kitRoot: f.kit }).findings;
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'docs/working/README.md');
  assert.notEqual(findings[0].severity, 'warn');
});

test('platform local-index: companions are not a general KB layout exception', () => {
  const f = fixture();
  put(f.project, 'docs/knowledge-base/README.md', '# KB\n');
  put(f.project, 'docs/knowledge-base/README.local.md', '# Not a sanctioned KB index\n');
  assert.ok(taxonomyLint(f.project).findings.some(finding => finding.kind === 'missing-prefix'
    && finding.file === 'docs/knowledge-base/README.local.md'));
});
const skill = (body = 'Do the scoped work.', tier = 'core') => `---\nname: probe\ndescription: Fixture skill.\ntier: ${tier}\nrequired-tools: [fixture]\n---\n\n# Probe\n\n${body}\n`;
const rule = '---\ntrigger: always\ntier: core\n---\n\n# Fixture rule\n\nPreserve owned work.\n';

function put(base, rel, content) {
  const dest = path.join(base, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  return dest;
}
function json(base, rel, value) { return put(base, rel, JSON.stringify(value, null, 2) + '\n'); }
function read(base, rel) { return fs.readFileSync(path.join(base, rel), 'utf8'); }
function exists(base, rel) { return fs.existsSync(path.join(base, rel)); }
function fixture(config = {}) {
  const base = fs.mkdtempSync(path.join(root, 'case-'));
  const kit = path.join(base, 'kit');
  const project = path.join(base, 'project');
  json(kit, 'package.json', { name: 'fixture-agentkit', version: '1.0.0' });
  put(kit, 'CHANGELOG.md', '# Changelog\n');
  put(kit, '.agent/rules/foundation-browser-usage.md', rule);
  put(kit, '.agent/skills/probe/SKILL.md', skill());
  json(kit, '.agent/hooks.json', [{ event: 'SessionStart', command: 'node "{KIT}" check --quick --json', vendors: ['claude'] }]);
  put(kit, 'integrations/fixture.md', '---\nname: fixture\nmcp-name: fixture\nmcp:\n  command: fixture-never-executed\n  args: []\n---\n\n# Fixture\n');
  const cfg = { vendors: ['claude', 'codex'], stack: [], kinds: ['tooling'], tools: ['fixture'], overlay: {}, ...config };
  json(project, '.agentkit.json', cfg);
  return { base, kit, project, cfg };
}
function invokeSync(f, options = {}) {
  try { return syncProject(f.project, { kitRoot: f.kit, ...options }); }
  catch (error) { return { ok: false, thrown: error.message }; }
}
function firstSync(f) {
  const result = invokeSync(f);
  assert.equal(result.ok, true, JSON.stringify(result));
}
function attempt(fn) {
  try { return fn(); } catch (error) { return { ok: false, thrown: error.message }; }
}
function snapshot(base) {
  const result = {};
  function visit(dir, prefix = '') {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const relative = prefix + item.name;
      if (item.isDirectory()) visit(path.join(dir, item.name), relative + '/');
      else result[relative] = fs.readFileSync(path.join(dir, item.name)).toString('base64');
    }
  }
  visit(base);
  return result;
}

test('platform DEP-F1: edited canonical content and peers survive a refused coherent update', () => {
  const f = fixture();
  firstSync(f);
  const rel = '.agent/skills/probe/SKILL.md';
  const edited = read(f.project, rel) + '\nLocal work must survive.\n';
  put(f.project, rel, edited);
  const peer = '.agent/rules/foundation-browser-usage.md';
  const beforePeer = read(f.project, peer);
  const beforeLock = read(f.project, '.agentkit.lock');
  put(f.kit, peer, rule + '\nNew upstream rule.\n');
  const result = invokeSync(f);
  assert.equal(read(f.project, rel), edited, 'ordinary sync must preserve the edited canonical file');
  assert.equal(result.ok, false, 'a known conflict cannot be called successful');
  assert.equal(read(f.project, peer), beforePeer, 'known conflict must stop peer changes before writes');
  assert.equal(read(f.project, '.agentkit.lock'), beforeLock, 'refusal preserves the completed ownership record');
});

test('platform DEP-F2/SYS-F1: a citation cannot redirect generated-skill adoption', () => {
  const f = fixture();
  put(f.kit, '.agent/skills/probe/SKILL.md', skill('Consult .agent/rules/foundation-browser-usage.md.'));
  firstSync(f);
  const unrelated = read(f.kit, '.agent/rules/foundation-browser-usage.md');
  const rel = '.agents/skills/probe/SKILL.md';
  put(f.project, rel, read(f.project, rel) + '\nSupported body improvement.\n');
  const result = adoptFile(f.project, rel, { kitRoot: f.kit });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.srcRel, '.agent/skills/probe/SKILL.md');
  assert.equal(read(f.kit, '.agent/rules/foundation-browser-usage.md'), unrelated);
  assert.match(read(f.kit, '.agent/skills/probe/SKILL.md'), /Supported body improvement/);
});

test('platform SYS-F1: supported body adoption preserves canonical metadata', () => {
  const f = fixture({ stack: ['react'] });
  put(f.kit, '.agent/skills/probe/SKILL.md', skill('Do the scoped work.', 'tech:react'));
  firstSync(f);
  const rel = '.agents/skills/probe/SKILL.md';
  put(f.project, rel, read(f.project, rel) + '\nBody-only improvement.\n');
  const result = adoptFile(f.project, rel, { kitRoot: f.kit });
  assert.equal(result.ok, true, JSON.stringify(result));
  const canonical = parseFrontmatter(read(f.kit, '.agent/skills/probe/SKILL.md'));
  assert.equal(canonical.fm.tier, 'tech:react');
  assert.deepEqual(canonical.fm['required-tools'], ['fixture']);
  assert.match(canonical.body, /Body-only improvement/);
});

test('platform SYS-F3: permission opt-out retires grants while retaining hooks and user settings', () => {
  const f = fixture({ vendors: ['claude'], permissions: { extra: ['Bash(fixture-kit-command *)'] } });
  json(f.project, '.claude/settings.json', { custom: 'keep', permissions: { allow: ['Bash(my-owned-command *)'] } });
  firstSync(f);
  const before = JSON.parse(read(f.project, '.claude/settings.json'));
  assert.ok(before.permissions.allow.length > 1, 'fixture must actually install kit grants');
  json(f.project, '.agentkit.json', { ...f.cfg, permissions: { enabled: false } });
  const result = invokeSync(f);
  assert.equal(result.ok, true, JSON.stringify(result));
  const after = JSON.parse(read(f.project, '.claude/settings.json'));
  assert.deepEqual(after.permissions.allow, ['Bash(my-owned-command *)']);
  assert.ok(after.hooks.SessionStart.length);
  assert.equal(after.custom, 'keep');
});

test('platform SYS-F3: a project hook containing agentkit is not implicitly owned', () => {
  const f = fixture({ vendors: ['claude'] });
  const own = { hooks: [{ type: 'command', command: 'node ./scripts/agentkit-local-audit.mjs' }] };
  json(f.project, '.claude/settings.json', { hooks: { SessionStart: [own] } });
  firstSync(f);
  const after = JSON.parse(read(f.project, '.claude/settings.json'));
  assert.ok(after.hooks.SessionStart.some(x => JSON.stringify(x) === JSON.stringify(own)));
});

test('platform SYS-F4: invalid settings refuse before any generated or canonical writes', () => {
  const f = fixture({ vendors: ['claude'] });
  put(f.project, '.claude/settings.json', '{ invalid');
  const result = invokeSync(f);
  assert.equal(result.ok, false);
  assert.equal(exists(f.project, '.agent/skills/probe/SKILL.md'), false);
  assert.equal(exists(f.project, '.claude/skills/probe/SKILL.md'), false);
  assert.equal(exists(f.project, '.agentkit.lock'), false);
  assert.equal(read(f.project, '.claude/settings.json'), '{ invalid');
});

test('platform SYS-F2: settings links cannot write outside the project', () => {
  const f = fixture({ vendors: ['codex'] });
  const outside = path.join(f.base, 'outside');
  const original = 'fixture_setting = "keep"\n';
  put(outside, 'config.toml', original);
  fs.symlinkSync(outside, path.join(f.project, '.codex'), process.platform === 'win32' ? 'junction' : 'dir');
  const result = invokeSync(f);
  assert.equal(read(outside, 'config.toml'), original);
  assert.equal(result.ok, false);
});

test('platform SYS-F2: traversal in loaded ownership cannot authorize an outside prune', () => {
  const f = fixture({ vendors: [], tools: [] });
  firstSync(f);
  const sentinel = 'outside project, inside owned test fixture\n';
  put(f.base, 'sentinel.md', sentinel);
  const lock = JSON.parse(read(f.project, '.agentkit.lock'));
  lock.files['../sentinel.md'] = { out: sha(sentinel), src: '.agent/rules/retired.md', srcHash: sha(sentinel), owner: 'core', vendor: null };
  json(f.project, '.agentkit.lock', lock);
  const result = invokeSync(f);
  assert.equal(exists(f.base, 'sentinel.md'), true, 'outside-project sentinel must survive');
  assert.equal(read(f.base, 'sentinel.md'), sentinel);
  assert.equal(result.ok, false);
});

test('platform SYS-F5: generated workflow/overlay collision refuses before writing', () => {
  const f = fixture({ vendors: ['codex'] });
  put(f.kit, '.agent/workflows/build.md', '---\ndescription: Fixture build.\n---\n\n# Build\n');
  put(f.project, '.agent/skills/wf-build/SKILL.md', '---\nname: wf-build\ndescription: Project skill.\ntier: overlay\n---\n\n# Own\n');
  const result = invokeSync(f, { force: true });
  assert.equal(result.ok, false, 'force cannot waive a routing collision');
  assert.equal(exists(f.project, '.agents/skills/wf-build/SKILL.md'), false);
});

test('platform SYS-F5: invalid tier cannot silently become universal', () => {
  const f = fixture();
  put(f.kit, '.agent/skills/probe/SKILL.md', skill('Invalid metadata.', 'techh:react'));
  const result = invokeSync(f, { force: true });
  assert.equal(result.ok, false);
  assert.equal(exists(f.project, '.agent/skills/probe/SKILL.md'), false);
});

test('platform DEP-F3: nonempty legacy pins refuse before sync', () => {
  const f = fixture({ pins: { '.agent/skills/probe/SKILL.md': '1.0.0' } });
  const result = invokeSync(f);
  assert.equal(result.ok, false, 'accepted pin removal must not silently ignore an existing pin');
  assert.equal(exists(f.project, '.agent/skills/probe/SKILL.md'), false);
});

test('platform DOC-F1: an unresolved integration target cannot verify landed ancestry', () => {
  const f = fixture({ vendors: [], tools: [], orchestration: { mainBranch: 'refs/heads/missing-target' } });
  const git = args => execFileSync('git', args, { cwd: f.project, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git(['init', '-q', '-b', 'main']);
  put(f.project, 'README.md', '# Fixture\n');
  git(['add', '--', 'README.md']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture baseline']);
  const commit = git(['rev-parse', 'HEAD']);
  put(f.project, 'docs/working/TICKET-fixture.md', `---\nstatus: reported\nlanded: [${commit}]\n---\n\n# Fixture\n`);
  const result = checkHygiene(f.project);
  assert.equal(result.clean, false, 'unknown ancestry is incomplete verification');
  assert.ok(result.errors.length > 0, 'unknown must remain distinct from a proven non-ancestor');
});

test('platform DOC-F4: evidence capture permits spaces while lifecycle validation remains active', () => {
  const f = fixture({ vendors: [], tools: [] });
  put(f.project, 'docs/raw-research/inbox/Vendor Export.md', 'Untouched external evidence.\n');
  put(f.project, 'docs/working/TICKET-invalid name.md', '# Invalid lifecycle filename\n');
  const result = taxonomyLint(f.project);
  assert.equal(result.findings.some(x => x.file.includes('raw-research/inbox')), false);
  assert.ok(result.findings.some(x => x.file.endsWith('TICKET-invalid name.md') && x.kind === 'space-in-name'));
});

test('platform PLAN-F2: consumer sync never publishes the kit manifest', () => {
  const f = fixture();
  const original = '{"fixture":"owned by kit publication"}\n';
  put(f.kit, 'manifest.json', original);
  firstSync(f);
  assert.equal(read(f.kit, 'manifest.json'), original);
});

test('platform PLAN-F2: malformed adoption metadata refuses before changing any kit file', () => {
  const f = fixture();
  firstSync(f);
  const rel = '.agents/skills/probe/SKILL.md';
  put(f.project, rel, read(f.project, rel) + '\nProposed improvement.\n');
  put(f.kit, 'package.json', '{ malformed');
  const before = snapshot(f.kit);
  assert.equal(attempt(() => adoptFile(f.project, rel, { kitRoot: f.kit })).ok, false);
  assert.deepEqual(snapshot(f.kit), before);
});

test('platform PLAN-F3: a pre-existing identical grant stays user-owned across repeated sync and opt-out', () => {
  const grant = 'Bash(fixture-shared-command *)';
  const f = fixture({ vendors: ['claude'], permissions: { extra: [grant] } });
  json(f.project, '.claude/settings.json', { permissions: { allow: [grant], deny: ['Bash(fixture-denied *)'] } });
  firstSync(f);
  firstSync(f);
  json(f.project, '.agentkit.json', { ...f.cfg, permissions: { enabled: false } });
  const result = invokeSync(f);
  assert.equal(result.ok, true, JSON.stringify(result));
  const settings = JSON.parse(read(f.project, '.claude/settings.json'));
  assert.deepEqual(settings.permissions.allow, [grant]);
  assert.deepEqual(settings.permissions.deny, ['Bash(fixture-denied *)']);
});

test('platform PLAN-F3: pre-existing identical hook is not acquired and retired', () => {
  const f = fixture({ vendors: ['claude'], tools: [] });
  const command = 'fixture-hook-never-executed';
  const hook = { hooks: [{ type: 'command', command }] };
  json(f.kit, '.agent/hooks.json', [{ event: 'SessionStart', command, vendors: ['claude'] }]);
  json(f.project, '.claude/settings.json', { hooks: { SessionStart: [hook] } });
  firstSync(f);
  firstSync(f);
  json(f.project, '.agentkit.json', { ...f.cfg, vendors: [] });
  const result = invokeSync(f);
  assert.equal(result.ok, true, JSON.stringify(result));
  const settings = JSON.parse(read(f.project, '.claude/settings.json'));
  assert.deepEqual(settings.hooks.SessionStart, [hook]);
});

test('platform PLAN-F3: conflicting unowned MCP key refuses the entire sync', () => {
  const f = fixture({ vendors: ['claude'] });
  json(f.project, '.mcp.json', { mcpServers: { fixture: { command: 'user-owned-never-executed', args: ['keep'] } } });
  const before = snapshot(f.project);
  assert.equal(invokeSync(f).ok, false);
  assert.deepEqual(snapshot(f.project), before);
});

test('platform PLAN-F3: an edited kit-introduced MCP value survives retirement', () => {
  const f = fixture({ vendors: ['claude'] });
  firstSync(f);
  const value = { command: 'user-edited-never-executed', args: ['preserve'] };
  json(f.project, '.mcp.json', { mcpServers: { fixture: value } });
  json(f.project, '.agentkit.json', { ...f.cfg, tools: [] });
  invokeSync(f);
  const settings = JSON.parse(read(f.project, '.mcp.json'));
  assert.deepEqual(settings.mcpServers.fixture, value);
});

for (const pins of [null, false, '1.0.0', [], 42]) {
  test(`platform DEP-F3: malformed raw pins ${JSON.stringify(pins)} cannot disappear during normalization`, () => {
    const f = fixture({ pins });
    const before = snapshot(f.project);
    assert.equal(invokeSync(f, { force: true }).ok, false);
    assert.deepEqual(snapshot(f.project), before);
  });
}

for (const defer of [false, true]) {
  test(`platform DEP-F3: ${defer ? 'deferred' : 'direct'} adoption cannot bypass legacy pin refusal`, () => {
    const f = fixture();
    firstSync(f);
    const rel = '.agents/skills/probe/SKILL.md';
    put(f.project, rel, read(f.project, rel) + '\nProposed edit.\n');
    json(f.project, '.agentkit.json', { ...f.cfg, pins: { '.agent/skills/probe/SKILL.md': '0.9.0' } });
    const before = snapshot(f.kit);
    assert.equal(attempt(() => adoptFile(f.project, rel, { kitRoot: f.kit, defer })).ok, false);
    assert.deepEqual(snapshot(f.kit), before);
  });
}

test('platform SYS-F1: body adoption retains unknown canonical metadata bytes exactly', () => {
  const f = fixture();
  const canonical = skill().replace('tier: core', 'tier: core\n# Preserve this annotation and quoting.\ncustom-field: "01, untouched"');
  put(f.kit, '.agent/skills/probe/SKILL.md', canonical);
  firstSync(f);
  const rel = '.agents/skills/probe/SKILL.md';
  put(f.project, rel, read(f.project, rel) + '\nNew body only.\n');
  const result = adoptFile(f.project, rel, { kitRoot: f.kit });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(read(f.kit, '.agent/skills/probe/SKILL.md').split('\n---\n')[0], canonical.split('\n---\n')[0]);
});

test('platform SYS-F1: native metadata edits cannot masquerade as body-only adoption', () => {
  const f = fixture();
  firstSync(f);
  const rel = '.agents/skills/probe/SKILL.md';
  const original = read(f.project, rel);
  const edited = original.replace(/^description:.*$/m, 'description: Different native metadata.');
  assert.notEqual(edited, original, 'fixture must actually change native metadata, regardless of quoting');
  put(f.project, rel, edited);
  const before = snapshot(f.kit);
  assert.equal(attempt(() => adoptFile(f.project, rel, { kitRoot: f.kit })).ok, false);
  assert.deepEqual(snapshot(f.kit), before);
});

test('platform DEP-F5: clone rebinding preserves inherited ownership', () => {
  const f = fixture();
  firstSync(f);
  const before = JSON.parse(read(f.project, '.agentkit.lock'));
  const result = initProject(f.project, { kitRoot: f.kit, cloneRebind: true });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.ok(exists(f.project, '.agentkit.lock'), 'rebinding must not erase the shipped record');
  const after = JSON.parse(read(f.project, '.agentkit.lock'));
  for (const rel of Object.keys(before.files)) assert.ok(after.files[rel], `ownership retained for ${rel}`);
});

test('platform PLAN-F2: invalid initialization has no scaffold side effects', () => {
  const f = fixture();
  const project = path.join(f.base, 'new-project');
  fs.mkdirSync(project);
  const result = attempt(() => initProject(project, { kitRoot: f.kit, vendors: ['not-a-vendor'], kinds: ['tooling'], tools: [] }));
  assert.equal(result.ok, false);
  assert.deepEqual(snapshot(project), {});
});

test('platform DEP-F1: managed edits after the first 200 paths are protected', () => {
  const f = fixture({ vendors: [], tools: [] });
  for (let i = 0; i < 220; i++) put(f.kit, `.agent/rules/pattern-fixture-${String(i).padStart(3, '0')}.md`, rule);
  firstSync(f);
  const rel = '.agent/rules/pattern-fixture-219.md';
  const edited = read(f.project, rel) + '\nLate-path user work.\n';
  put(f.project, rel, edited);
  const result = invokeSync(f);
  assert.equal(result.ok, false);
  assert.equal(read(f.project, rel), edited);
});

test('platform PLAN-F1: interrupted sync retains exact preimages and completes its prepared source after upstream changes', () => {
  const f = fixture();
  firstSync(f);
  const rel = '.agent/skills/probe/SKILL.md';
  const before = read(f.project, rel);
  const lockBefore = read(f.project, '.agentkit.lock');
  put(f.kit, rel, skill('Prepared improvement.'));
  let interrupted = false;
  const result = invokeSync(f, { afterEffect: target => {
    if (target === rel) { interrupted = true; throw new Error('fixture interruption after canonical replacement'); }
  } });
  assert.equal(interrupted, true, 'fault must actually reach the replacement boundary');
  assert.equal(result.ok, false);
  const pending = JSON.parse(read(f.project, '.agentkit.pending.json'));
  const effect = pending.effects.find(x => x.rel === rel);
  assert.equal(Buffer.from(effect.before, 'base64').toString('utf8'), before);
  assert.equal(read(f.project, '.agentkit.lock'), lockBefore);
  put(f.kit, rel, skill('Later upstream work, not the prepared operation.'));
  const check = checkProject(f.project, { kitRoot: f.kit, quick: true });
  assert.equal(check.clean, false);
  assert.equal(read(f.project, '.agentkit.lock'), lockBefore, 'check cannot mutate ownership during recovery');
  assert.equal(invokeSync(f).ok, false, 'ordinary sync cannot silently replace the pending operation');
  const recovery = recoverOperation(f.project);
  assert.equal(recovery.ok, true, JSON.stringify(recovery));
  assert.match(read(f.project, rel), /Prepared improvement/);
  assert.doesNotMatch(read(f.project, rel), /Later upstream work/);
  assert.equal(exists(f.project, '.agentkit.pending.json'), false);
});

test('platform PLAN-F1: recovery refuses an intervening target edit without changing any file', () => {
  const f = fixture();
  firstSync(f);
  const rel = '.agent/skills/probe/SKILL.md';
  put(f.kit, rel, skill('Prepared improvement.'));
  let interrupted = false;
  invokeSync(f, { afterEffect: target => {
    if (target === rel) { interrupted = true; throw new Error('fixture interruption'); }
  } });
  assert.equal(interrupted, true);
  put(f.project, rel, read(f.project, rel) + '\nIntervening user edit.\n');
  const beforeRecovery = snapshot(f.project);
  const result = recoverOperation(f.project);
  assert.equal(result.ok, false);
  assert.deepEqual(snapshot(f.project), beforeRecovery);
});

test('platform PLAN-F1: a prune interruption retains removed bytes and can finish retirement', () => {
  const f = fixture({ vendors: ['claude'] });
  firstSync(f);
  const rel = '.claude/skills/probe/SKILL.md';
  const before = read(f.project, rel);
  json(f.project, '.agentkit.json', { ...f.cfg, vendors: [] });
  let interrupted = false;
  const result = invokeSync(f, { afterEffect: target => {
    if (target === rel) { interrupted = true; throw new Error('fixture interruption after prune'); }
  } });
  assert.equal(interrupted, true);
  assert.equal(result.ok, false);
  assert.equal(exists(f.project, rel), false);
  const pending = JSON.parse(read(f.project, '.agentkit.pending.json'));
  const effect = pending.effects.find(x => x.rel === rel);
  assert.equal(Buffer.from(effect.before, 'base64').toString('utf8'), before);
  assert.equal(effect.after, null);
  assert.equal(recoverOperation(f.project).ok, true);
  const lock = JSON.parse(read(f.project, '.agentkit.lock'));
  assert.equal(lock.files[rel], undefined);
});

test('platform PLAN-F1: crash after completed-lock publication finalizes without replay', () => {
  const f = fixture();
  firstSync(f);
  put(f.kit, '.agent/skills/probe/SKILL.md', skill('Final prepared body.'));
  let interrupted = false;
  const result = invokeSync(f, { afterEffect: target => {
    if (target === '.agentkit.lock') { interrupted = true; throw new Error('fixture interruption after commit point'); }
  } });
  assert.equal(interrupted, true);
  assert.equal(result.ok, false);
  const completedLock = read(f.project, '.agentkit.lock');
  let replayed = 0;
  const recovery = recoverOperation(f.project, { afterEffect: () => replayed++ });
  assert.equal(recovery.ok, true, JSON.stringify(recovery));
  assert.equal(replayed, 0);
  assert.equal(read(f.project, '.agentkit.lock'), completedLock);
  assert.equal(exists(f.project, '.agentkit.pending.json'), false);
});

test('platform PLAN-F1: replacement that succeeds before throwing is recognized by its bytes', () => {
  const f = fixture();
  firstSync(f);
  const rel = '.agent/skills/probe/SKILL.md';
  put(f.kit, rel, skill('Rename completed before failure.'));
  const rename = fs.renameSync;
  let injected = false;
  let result;
  fs.renameSync = (from, to) => {
    rename(from, to);
    if (!injected && path.resolve(to) === path.resolve(f.project, rel)) {
      injected = true;
      throw new Error('fixture failure after rename but before progress callback');
    }
  };
  try { result = invokeSync(f); } finally { fs.renameSync = rename; }
  assert.equal(injected, true);
  assert.equal(result.ok, false);
  assert.match(read(f.project, rel), /Rename completed before failure/);
  assert.equal(recoverOperation(f.project).ok, true);
  assert.equal(exists(f.project, '.agentkit.pending.json'), false);
});

test('platform PLAN-F2: interrupted adoption recovers exactly one package bump and changelog entry', () => {
  const f = fixture();
  firstSync(f);
  const rel = '.agents/skills/probe/SKILL.md';
  put(f.project, rel, read(f.project, rel) + '\nAdopt this body once.\n');
  let interrupted = false;
  const result = attempt(() => adoptFile(f.project, rel, { kitRoot: f.kit, afterEffect: target => {
    if (target === '.agent/skills/probe/SKILL.md') { interrupted = true; throw new Error('fixture adoption interruption'); }
  } }));
  assert.equal(interrupted, true);
  assert.equal(result.ok, false);
  assert.equal(JSON.parse(read(f.kit, 'package.json')).version, '1.0.0');
  assert.equal(attempt(() => adoptFile(f.project, rel, { kitRoot: f.kit })).ok, false);
  const recovery = recoverOperation(f.kit);
  assert.equal(recovery.ok, true, JSON.stringify(recovery));
  assert.equal(JSON.parse(read(f.kit, 'package.json')).version, '1.0.1');
  assert.equal((read(f.kit, 'CHANGELOG.md').match(/^## .*adopt:/gm) || []).length, 1);
  assert.ok(exists(f.kit, 'manifest.json'));
  const completed = snapshot(f.kit);
  assert.equal(recoverOperation(f.kit).ok, true);
  assert.deepEqual(snapshot(f.kit), completed);
});

test('platform DOC-F2: the declared KB root is shared by routing, content and taxonomy checks', () => {
  const f = fixture({ vendors: [], tools: [], docs: { kbRoot: 'governance' } });
  put(f.project, 'governance/SPEC-fixture.md', '---\napplies-to: [src/**]\nlast-verified: 2026-09-08\n---\n\n# Fixture\n\nRead [implementation](../src/missing.mjs).\n');
  put(f.project, 'governance/contract-without-prefix.md', '# Unprefixed live contract\n');
  assert.ok(kbMatch(f.project, ['src/feature.mjs']).some(x => x.doc === 'governance/SPEC-fixture.md'));
  const content = checkContentIntegrity(f.project, { kitRoot: f.kit });
  assert.ok(content.findings.some(x => x.file === 'governance/SPEC-fixture.md' && x.kind === 'link'));
  const taxonomy = taxonomyLint(f.project);
  assert.ok(taxonomy.findings.some(x => x.file === 'governance/contract-without-prefix.md' && x.kind === 'missing-prefix'));
});

test('platform DOC-F5: an untitled changelog assembly does not consume its only source fragments', () => {
  const f = fixture({ vendors: [], tools: [] });
  put(f.project, 'CHANGELOG.md', '# Changelog\n\nPreserve the introductory contract.\n');
  const fragment = '- Delivered the scoped fixture change.\n';
  put(f.project, 'changelog.d/fixture.md', fragment);
  attempt(() => changelogRoll(f.project, { version: 'v1.0.0', date: '2026-09-08' }));
  assert.equal(exists(f.project, 'changelog.d/fixture.md'), true);
  assert.equal(read(f.project, 'changelog.d/fixture.md'), fragment);
});

test('platform DOC-F5: titled changelog assembly stays below the existing introduction', () => {
  const f = fixture({ vendors: [], tools: [] });
  const intro = 'Preserve the introductory contract.';
  put(f.project, 'CHANGELOG.md', `# Changelog\n\n${intro}\n\n## [2026-09-01] — Previous release\n\n- Old body.\n`);
  put(f.project, 'changelog.d/fixture.md', '- Delivered the scoped fixture change.\n');
  const result = changelogRoll(f.project, { version: 'v1.0.0', date: '2026-09-08', title: 'Scoped fixture update' });
  assert.equal(result.ok, true, JSON.stringify(result));
  const output = read(f.project, 'CHANGELOG.md');
  assert.ok(output.indexOf(intro) < output.indexOf('Scoped fixture update'));
  assert.ok(output.indexOf('Scoped fixture update') < output.indexOf('Previous release'));
  assert.equal((output.match(/^## .*Scoped fixture update/gm) || []).length, 1);
});

test('platform DEP-F6: a machine-local launcher executes its selected checkout through paths with spaces', () => {
  const f = fixture();
  const selected = path.join(f.base, 'selected kit with spaces');
  fs.mkdirSync(selected);
  for (const name of ['agentkit.mjs', 'adapters.mjs']) {
    put(selected, name, fs.readFileSync(new URL('./' + name, import.meta.url)));
  }
  json(selected, 'package.json', { name: 'fixture-agentkit', version: '8.7.6', type: 'module' });
  const bin = path.join(f.base, 'machine local bin');
  fs.mkdirSync(bin);
  const beforeProject = snapshot(f.project);
  const result = setupLauncher(bin, { kitRoot: selected });
  assert.equal(result.ok, true, JSON.stringify(result));
  // Invoke the installed launcher by absolute path on both platforms. Relying on the current
  // directory would resolve a real machine-local agentkit on PATH wherever Windows disables
  // current-directory search (NoDefaultCurrentDirectoryInExePath), testing a foreign binary.
  const output = process.platform === 'win32'
    ? execFileSync('cmd.exe', ['/d', '/c', path.join(bin, 'agentkit.cmd'), '--version'], { cwd: f.project, encoding: 'utf8' })
    : execFileSync(path.join(bin, 'agentkit'), ['--version'], { cwd: f.project, encoding: 'utf8' });
  assert.match(output, /8\.7\.6/);
  assert.deepEqual(snapshot(f.project), beforeProject, 'computer setup cannot sync or modify a project');
  const installed = snapshot(bin);
  assert.equal(setupLauncher(bin, { kitRoot: selected }).ok, true);
  assert.deepEqual(snapshot(bin), installed, 'repeat setup is idempotent');
});

test('platform DEP-F6: setup preserves a different pre-existing launcher', () => {
  const f = fixture();
  put(f.kit, 'agentkit.mjs', fs.readFileSync(new URL('./agentkit.mjs', import.meta.url)));
  const bin = path.join(f.base, 'machine-bin');
  const name = process.platform === 'win32' ? 'agentkit.cmd' : 'agentkit';
  put(bin, name, 'user-owned launcher, never execute\n');
  const before = snapshot(bin);
  assert.equal(setupLauncher(bin, { kitRoot: f.kit }).ok, false);
  assert.deepEqual(snapshot(bin), before);
});

after(() => {
  // Retain baseline/failure evidence. The coordinator owns later verified cleanup, not this suite.
  console.log(`Platform regression fixtures retained: ${root}`);
});
