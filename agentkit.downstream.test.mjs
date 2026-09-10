// Downstream-consumption regressions: an existing consumer must be able to take a new kit release.
// Each test states the consumer shape it protects, because these paths are reached by upgrading
// projects rather than by the kit's own self-sync.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { syncProject, mergeSettings } from './agentkit.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentkit-downstream-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
const source = path.dirname(fileURLToPath(import.meta.url));

function put(base, rel, text) {
  const file = path.join(base, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text);
}
const json = (base, rel, value) => put(base, rel, JSON.stringify(value, null, 2) + '\n');
const read = (base, rel) => fs.readFileSync(path.join(base, rel), 'utf8');
const exists = (base, rel) => fs.existsSync(path.join(base, rel));

// A kit with one workflow. Adding a second changes the AGENTS.md managed block, which is what every
// real release does and what the consumer must be able to accept.
function mkKit(name, workflows) {
  const kit = path.join(root, name);
  for (const rel of ['agentkit.mjs', 'adapters.mjs']) put(kit, rel, fs.readFileSync(path.join(source, rel)));
  json(kit, 'package.json', { version: '1.1.0' });
  put(kit, '.agent/skills/probe/SKILL.md', '---\nname: probe\ndescription: Use for fixture work.\ntier: core\n---\n# Probe\n');
  for (const wf of workflows) {
    put(kit, `.agent/workflows/${wf}.md`, `---\ndescription: Fixture workflow ${wf}.\nskill: probe\n---\n\n# ${wf}\n\nStep 1.\n`);
  }
  return kit;
}
const MD_START = "<!-- >>> AGENTKIT WORKFLOWS >>> (generated — do not edit; run 'agentkit sync') -->";
const MD_END = '<!-- <<< AGENTKIT WORKFLOWS <<< -->';
const TOML_START = "# >>> AGENTKIT MANAGED >>> (do not edit inside this block; run 'agentkit sync')";
const TOML_END = '# <<< AGENTKIT MANAGED <<<';
// Empty markers are the documented enrollment request for the AGENTS.md workflow block.
function mkProject(name, agents = `# Fixture project\n\n${MD_START}\n${MD_END}\n`) {
  const project = path.join(root, name);
  json(project, '.agentkit.json', { vendors: ['claude'], stack: [], kinds: ['tooling'], tools: [], overlay: {}, permissions: { enabled: false } });
  put(project, 'AGENTS.md', agents);
  return project;
}
const blockOf = text => text.slice(text.indexOf(MD_START), text.indexOf(MD_END) + MD_END.length);
const tomlBlockOf = text => text.slice(text.indexOf(TOML_START), text.indexOf(TOML_END) + TOML_END.length);

function mkCodexKit(name, workflows, command) {
  const kit = mkKit(name, workflows);
  put(kit, 'integrations/probe.md', `---\nmcp-name: probe\nmcp:\n  command: ${command}\n---\n`);
  return kit;
}
function mkCodexProject(name) {
  const project = mkProject(name, '# Fixture project\n');
  json(project, '.agentkit.json', { vendors: ['codex'], stack: [], kinds: ['tooling'], tools: ['probe'], overlay: {}, permissions: { enabled: false } });
  return project;
}
function mkClaudeMcpKit(name, command) {
  const kit = mkKit(name, ['alpha']);
  put(kit, 'integrations/probe.md', `---\nmcp-name: probe\nmcp:\n  command: ${command}\n---\n`);
  return kit;
}
function mkClaudeMcpProject(name) {
  const project = mkProject(name);
  json(project, '.agentkit.json', { vendors: ['claude'], stack: [], kinds: ['tooling'], tools: ['probe'], overlay: {}, permissions: { enabled: false } });
  return project;
}
function commitFixture(project, message) {
  const git = args => execFileSync('git', args, { cwd: project, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git(['add', '.']);
  git(['commit', '-m', message]);
}

// Rewrite a completed lock's settings records to the 0.3.x string-list shape.
function downgradeLockToLegacy(project) {
  const lock = JSON.parse(read(project, '.agentkit.lock'));
  lock.settings = Object.fromEntries(Object.entries(lock.settings).map(([file, rows]) => [file, [...new Set(rows.map(row => row.key))]]));
  json(project, '.agentkit.lock', lock);
}

// A legacy record proves membership only, so the kit must not overwrite the block (ACCEPT-F5). What
// the consumer needs is a refusal it can act on, and a remedy that actually completes the upgrade.
test('downstream F1: a legacy 0.3.x block refuses with an actionable message, and the documented remedy works', () => {
  const before = mkKit('f1-legacy-kit-before', ['alpha']);
  const project = mkProject('f1-legacy-project');
  assert.equal(syncProject(project, { kitRoot: before }).ok, true);
  downgradeLockToLegacy(project);
  const preserved = read(project, 'AGENTS.md');

  const after_ = mkKit('f1-legacy-kit-after', ['alpha', 'beta']);
  const refused = syncProject(project, { kitRoot: after_ });
  assert.equal(refused.ok, false, 'the kit must not adopt a block it cannot prove it wrote');
  assert.equal(read(project, 'AGENTS.md'), preserved, 'the refusal preserves the block byte-for-byte');
  assert.match(refused.reason, /AGENTS\.md/);
  assert.match(refused.reason, /unresolved/);
  assert.doesNotMatch(refused.reason, /Restore the edited introduced value/,
    'a legacy contribution was never introduced by the kit and cannot be restored');

  // The documented remedy: remove that exact contribution, then sync to establish new introduction.
  put(project, 'AGENTS.md', preserved.replace(blockOf(preserved), `${MD_START}\n${MD_END}`));
  const applied = syncProject(project, { kitRoot: after_ });
  assert.equal(applied.ok, true, 'the remedy must complete the upgrade: ' + JSON.stringify(applied.reason));
  assert.match(blockOf(read(project, 'AGENTS.md')), /beta/, 'the new workflow lands after reconciliation');
});

test('downstream F1: a borrowed block accepts a kit-side change when nobody edited it', () => {
  const before = mkKit('f1-borrowed-kit-before', ['alpha']);
  const seed = mkProject('f1-borrowed-seed');
  assert.equal(syncProject(seed, { kitRoot: before }).ok, true);
  const generated = read(seed, 'AGENTS.md');

  // A project that already carries the exact generated block: init records ownership 'borrowed'.
  const project = mkProject('f1-borrowed-project', generated);
  assert.equal(syncProject(project, { kitRoot: before }).ok, true);
  const lock = JSON.parse(read(project, '.agentkit.lock'));
  assert.deepEqual(lock.settings['AGENTS.md'].map(r => r.ownership), ['borrowed'], 'fixture must exercise borrowed ownership');

  const after_ = mkKit('f1-borrowed-kit-after', ['alpha', 'beta']);
  const result = syncProject(project, { kitRoot: after_ });
  assert.equal(result.ok, true, 'an unedited borrowed block must not refuse: ' + JSON.stringify(result.refusals || result.reason));
  assert.match(blockOf(read(project, 'AGENTS.md')), /beta/);
  const relocked = JSON.parse(read(project, '.agentkit.lock'));
  assert.deepEqual(relocked.settings['AGENTS.md'].map(r => r.ownership), ['borrowed'], 'updating does not claim authorship');

  const borrowedRecorded = read(project, 'AGENTS.md');
  put(project, 'AGENTS.md', borrowedRecorded.replace('Fixture workflow alpha.', 'Fixture workflow alpha. HUMAN EDIT'));
  const borrowedRefused = syncProject(project, { kitRoot: mkKit('f1-borrowed-kit-next', ['alpha', 'beta', 'gamma']) });
  assert.equal(borrowedRefused.ok, false);
  assert.match(borrowedRefused.settingsConflicts[0].action, /Restore the exact recorded borrowed value/);
  put(project, 'AGENTS.md', borrowedRecorded);
  assert.equal(syncProject(project, { kitRoot: after_ }).ok, true, 'restoring borrowed bytes permits the release');
});

test('downstream F1 guard: an edited block still refuses, whatever its ownership', () => {
  const before = mkKit('f1-guard-kit-before', ['alpha']);
  const seed = mkProject('f1-guard-seed');
  assert.equal(syncProject(seed, { kitRoot: before }).ok, true);
  const generated = read(seed, 'AGENTS.md');

  const project = mkProject('f1-guard-project', generated);
  assert.equal(syncProject(project, { kitRoot: before }).ok, true);
  // A human edits inside the managed markers after the kit recorded it.
  const recorded = read(project, 'AGENTS.md');
  const edited = recorded.replace('Fixture workflow alpha.', 'Fixture workflow alpha. HUMAN EDIT');
  assert.notEqual(edited, recorded, 'the fixture must actually change the managed block');
  assert.ok(blockOf(edited).includes('HUMAN EDIT'), 'the edit must land inside the managed block');
  put(project, 'AGENTS.md', edited);
  const kept = read(project, 'AGENTS.md');

  const after_ = mkKit('f1-guard-kit-after', ['alpha', 'beta']);
  const result = syncProject(project, { kitRoot: after_ });
  assert.equal(result.ok, false, 'an edited block must still refuse');
  assert.equal(read(project, 'AGENTS.md'), kept, 'the edited file must be preserved byte-for-byte');
});

test('downstream C1: legacy Markdown and TOML blocks enroll through empty markers and stay stable across releases', () => {
  const mdBefore = mkKit('c1-md-before', ['alpha']);
  const md = mkProject('c1-md-project', `# Project-owned header\n\n${MD_START}\n${MD_END}\n\nProject-owned footer.\n`);
  assert.equal(syncProject(md, { kitRoot: mdBefore }).ok, true);
  downgradeLockToLegacy(md);
  const mdPreserved = read(md, 'AGENTS.md');
  const mdAfter = mkKit('c1-md-after', ['alpha', 'beta']);
  const mdRefused = syncProject(md, { kitRoot: mdAfter });
  assert.equal(mdRefused.ok, false);
  assert.equal(read(md, 'AGENTS.md'), mdPreserved, 'ambiguous legacy content remains byte-identical');
  put(md, 'AGENTS.md', mdPreserved.replace(blockOf(mdPreserved), `${MD_START}\n${MD_END}`));
  const mdApplied = syncProject(md, { kitRoot: mdAfter });
  assert.equal(mdApplied.ok, true, JSON.stringify(mdApplied));
  assert.equal(JSON.parse(read(md, '.agentkit.lock')).settings['AGENTS.md'][0].ownership, 'introduced');
  assert.equal(syncProject(md, { kitRoot: mdAfter }).settingsWritten.length, 0, 'same-release sync is stable');
  const mdNext = mkKit('c1-md-next', ['alpha', 'beta', 'gamma']);
  const introducedRecorded = read(md, 'AGENTS.md');
  put(md, 'AGENTS.md', introducedRecorded.replace('Fixture workflow alpha.', 'Fixture workflow alpha. HUMAN EDIT'));
  const introducedRefused = syncProject(md, { kitRoot: mdNext });
  assert.equal(introducedRefused.ok, false);
  assert.match(introducedRefused.settingsConflicts[0].action, /Restore the exact recorded introduced value/);
  put(md, 'AGENTS.md', introducedRecorded);
  assert.equal(syncProject(md, { kitRoot: mdNext }).ok, true);
  const mdFinal = read(md, 'AGENTS.md');
  assert.match(blockOf(mdFinal), /gamma/);
  assert.match(mdFinal, /Project-owned header/);
  assert.match(mdFinal, /Project-owned footer/);

  const tomlBefore = mkCodexKit('c1-toml-before', ['alpha'], 'probe-before');
  const toml = mkCodexProject('c1-toml-project');
  const tomlOutside = 'approval_policy = "on-request"\n';
  put(toml, '.codex/config.toml', tomlOutside);
  assert.equal(syncProject(toml, { kitRoot: tomlBefore }).ok, true);
  downgradeLockToLegacy(toml);
  const tomlPreserved = read(toml, '.codex/config.toml');
  const tomlAfter = mkCodexKit('c1-toml-after', ['alpha'], 'probe-after');
  const tomlRefused = syncProject(toml, { kitRoot: tomlAfter });
  assert.equal(tomlRefused.ok, false);
  assert.equal(read(toml, '.codex/config.toml'), tomlPreserved, 'ambiguous legacy TOML remains byte-identical');
  put(toml, '.codex/config.toml', tomlPreserved.replace(tomlBlockOf(tomlPreserved), `${TOML_START}\n${TOML_END}`));
  const tomlApplied = syncProject(toml, { kitRoot: tomlAfter });
  assert.equal(tomlApplied.ok, true, JSON.stringify(tomlApplied));
  assert.equal(JSON.parse(read(toml, '.agentkit.lock')).settings['.codex/config.toml'][0].ownership, 'introduced');
  assert.equal(syncProject(toml, { kitRoot: tomlAfter }).settingsWritten.length, 0, 'same-release TOML sync is stable');
  const tomlNext = mkCodexKit('c1-toml-next', ['alpha'], 'probe-next');
  assert.equal(syncProject(toml, { kitRoot: tomlNext }).ok, true);
  const tomlFinal = read(toml, '.codex/config.toml');
  assert.match(tomlBlockOf(tomlFinal), /probe-next/);
  assert.ok(tomlFinal.startsWith(tomlOutside), 'TOML outside the managed markers survives');

  // A marker-only enrollment edit is intentionally still subject to the consumer Git guard.
  const dirty = mkProject('c1-md-git-project');
  assert.equal(syncProject(dirty, { kitRoot: mdBefore }).ok, true);
  downgradeLockToLegacy(dirty);
  execFileSync('git', ['init', '-b', 'main'], { cwd: dirty, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'AgentKit Fixture'], { cwd: dirty, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'fixture@example.invalid'], { cwd: dirty, stdio: 'ignore' });
  commitFixture(dirty, 'legacy fixture baseline');
  const dirtyText = read(dirty, 'AGENTS.md');
  put(dirty, 'AGENTS.md', dirtyText.replace(blockOf(dirtyText), `${MD_START}\n${MD_END}`));
  const dirtyRefused = syncProject(dirty, { kitRoot: mdAfter });
  assert.equal(dirtyRefused.ok, false);
  assert.equal(dirtyRefused.reason, 'git not clean on managed paths');
  commitFixture(dirty, 'enroll managed block');
  assert.equal(syncProject(dirty, { kitRoot: mdAfter }).ok, true, 'clean checkpoint permits enrollment');
});

test('downstream F2: an object contribution differing only in key order is not a conflict', () => {
  const value = { type: 'local', command: ['probe-mcp'], enabled: true };
  const reordered = { command: ['probe-mcp'], enabled: true, type: 'local' };
  const action = { merge: 'opencode-mcp', file: 'opencode.json', data: { 'probe-mcp': value } };
  const existing = JSON.stringify({ mcp: { 'probe-mcp': reordered } }, null, 2);

  const merged = mergeSettings(action, existing, []);
  assert.deepEqual(JSON.parse(merged.content).mcp['probe-mcp'], value);
  assert.deepEqual(merged.managedKeys.map(r => r.ownership), ['borrowed'], 'an equal value is borrowed, not a conflict');

  // A genuinely different value must still refuse.
  const different = JSON.stringify({ mcp: { 'probe-mcp': { ...value, command: ['other-mcp'] } } }, null, 2);
  assert.throws(() => mergeSettings(action, different, []), /settings conflict/);
});

test('downstream F3: a settings conflict reports the desired value and an ownership-appropriate action', () => {
  const value = { type: 'local', command: ['probe-mcp'], enabled: true };
  const action = { merge: 'opencode-mcp', file: 'opencode.json', data: { 'probe-mcp': value } };
  const different = JSON.stringify({ mcp: { 'probe-mcp': { ...value, command: ['other-mcp'] } } }, null, 2);
  let error;
  try { mergeSettings(action, different, []); } catch (e) { error = e; }
  assert.ok(error?.settingsConflict, 'conflict context must be attached');
  const ctx = error.settingsConflict;
  assert.ok(ctx.desiredHash, 'the value the kit wanted must be reported');
  assert.notEqual(ctx.desiredHash, ctx.hash, 'desired and current must be distinguishable');
  assert.doesNotMatch(ctx.action, /Restore an edited introduced value/,
    'an unowned contribution must not be described as an edited introduced one');

  const recorded = { command: 'old-mcp' };
  let retainedError;
  try {
    mergeSettings({ merge: 'mcp-json', file: '.mcp.json', data: { probe: { command: 'new-mcp' } } },
      JSON.stringify({ mcpServers: {} }),
      [{ kind: 'mcp-json', key: 'probe', value: recorded, ownership: 'introduced' }]);
  } catch (error) { retainedError = error; }
  assert.equal(retainedError?.settingsConflict?.desiredHashRole, 'retained-prerequisite',
    'a missing introduced value reports the recorded prerequisite separately from a kit proposal');
});

test('downstream L1: borrowed MCP conflicts preserve local values and exact removal accepts the kit value', () => {
  const before = mkClaudeMcpKit('l1-mcp-before', 'old-mcp');
  const seed = mkClaudeMcpProject('l1-mcp-seed');
  assert.equal(syncProject(seed, { kitRoot: before }).ok, true);
  const generated = read(seed, '.mcp.json');
  const project = mkClaudeMcpProject('l1-mcp-project');
  put(project, '.mcp.json', generated);
  assert.equal(syncProject(project, { kitRoot: before }).ok, true);
  const lock = JSON.parse(read(project, '.agentkit.lock'));
  assert.equal(lock.settings['.mcp.json'][0].ownership, 'borrowed');

  const after = mkClaudeMcpKit('l1-mcp-after', 'new-mcp');
  const refused = syncProject(project, { kitRoot: after });
  assert.equal(refused.ok, false);
  assert.match(refused.settingsConflicts[0].action, /Keep the local borrowed value intact/);
  assert.match(refused.settingsConflicts[0].action, /leave this incompatible kit update pending/);
  assert.match(refused.settingsConflicts[0].action, /To accept the kit value, remove only the exact borrowed contribution/);
  assert.equal(read(project, '.mcp.json'), generated, 'keep-local path preserves the borrowed server');

  const changed = JSON.stringify({ mcpServers: { probe: { command: 'old-mcp' } } });
  for (const ownership of ['unowned', 'unresolved']) {
    const records = ownership === 'unowned' ? [] : [{ kind: 'mcp-json', key: 'probe', value: { command: 'old-mcp' }, ownership }];
    let error;
    try {
      mergeSettings({ merge: 'mcp-json', file: '.mcp.json', data: { probe: { command: 'new-mcp' } } }, changed, records);
    } catch (caught) { error = caught; }
    assert.match(error?.settingsConflict?.action || '', /leave this incompatible kit update pending/);
    assert.match(error?.settingsConflict?.action || '', /do not remove it/);
  }

  const native = JSON.parse(generated);
  delete native.mcpServers.probe;
  json(project, '.mcp.json', native);
  const applied = syncProject(project, { kitRoot: after });
  assert.equal(applied.ok, true, JSON.stringify(applied));
  assert.equal(JSON.parse(read(project, '.mcp.json')).mcpServers.probe.command, 'new-mcp');
  assert.equal(JSON.parse(read(project, '.agentkit.lock')).settings['.mcp.json'][0].ownership, 'introduced');
});

test('downstream L2: migration guidance makes marker checkpoint commits conditional on Git authority', () => {
  const checklist = fs.readFileSync(path.join(source, 'governance/migration-checklist.md'), 'utf8');
  const prompt = fs.readFileSync(path.join(source, 'templates/project-migration-prompt.md'), 'utf8');
  for (const text of [checklist, prompt]) {
    assert.match(text.replace(/the selected/g, 'selected'), /selected Git action authorizes[\s\n]+committing/);
    assert.match(text, /prepare a diff/);
    assert.match(text, /preserve[\s\S]*marker-only[\s\S]*edit[\s\S]*diff/i);
    assert.match(text, /guarded[\s\S]*pending/i);
    assert.doesNotMatch(text, /must be committed before sync(?:\s+because|[.;])/i);
  }
});

test('downstream C3: human sync and check diagnostics render current, prior, desired and unavailable hashes', () => {
  const before = mkKit('c3-before', ['alpha']);
  const project = mkProject('c3-project');
  assert.equal(syncProject(project, { kitRoot: before }).ok, true);
  downgradeLockToLegacy(project);
  const after_ = mkKit('c3-after', ['alpha', 'beta']);
  const kitCli = path.join(after_, 'agentkit.mjs');
  const sync = spawnSync(process.execPath, [kitCli, 'sync', project, '--dry-run'], { encoding: 'utf8' });
  assert.equal(sync.status, 1, sync.stdout + sync.stderr);
  const context = syncProject(project, { kitRoot: after_, dryRun: true }).settingsConflicts[0];
  assert.match(sync.stdout, new RegExp(`current SHA-256: ${context.hash}`));
  assert.match(sync.stdout, new RegExp(`prior: ${context.priorHash}`));
  assert.match(sync.stdout, new RegExp(`desired: ${context.desiredHash}`));
  assert.match(sync.stdout, new RegExp(`desired: ${context.desiredHash} \\(kit proposal\\)`));
  const check = spawnSync(process.execPath, [kitCli, 'check', project], { encoding: 'utf8' });
  assert.equal(check.status, 1, check.stdout + check.stderr);
  assert.match(check.stdout, new RegExp(`desired: ${context.desiredHash}`));

  const malformed = mkCodexProject('c3-malformed');
  const tomlKit = mkCodexKit('c3-malformed-kit', ['alpha'], 'probe');
  put(malformed, '.codex/config.toml', `value = """\n${TOML_START}\n${TOML_END}\n`);
  const malformedCli = spawnSync(process.execPath, [path.join(tomlKit, 'agentkit.mjs'), 'sync', malformed], { encoding: 'utf8' });
  assert.equal(malformedCli.status, 1);
  assert.match(malformedCli.stdout, /desired: \(unavailable\)/);

  const retained = mkClaudeMcpProject('c3-retained-prerequisite');
  const retainedBefore = mkClaudeMcpKit('c3-retained-before', 'old-mcp');
  const retainedAfter = mkClaudeMcpKit('c3-retained-after', 'new-mcp');
  assert.equal(syncProject(retained, { kitRoot: retainedBefore }).ok, true);
  const retainedNative = JSON.parse(read(retained, '.mcp.json'));
  delete retainedNative.mcpServers.probe;
  json(retained, '.mcp.json', retainedNative);
  const retainedCli = spawnSync(process.execPath, [path.join(retainedAfter, 'agentkit.mjs'), 'sync', retained, '--dry-run'], { encoding: 'utf8' });
  assert.equal(retainedCli.status, 1, retainedCli.stdout + retainedCli.stderr);
  assert.match(retainedCli.stdout, /desired: .* \(retained prerequisite\)/);
});

test('downstream F4: sync protects the private writing store in the consumer gitignore', () => {
  const kit = mkKit('f4-kit', ['alpha']);
  const project = mkProject('f4-project');
  put(project, '.gitignore', 'node_modules/\n');
  assert.equal(syncProject(project, { kitRoot: kit }).ok, true);
  assert.ok(exists(project, '.gitignore'));
  const lines = read(project, '.gitignore').split(/\r?\n/);
  assert.ok(lines.includes('.writing/'), 'the private sample store must be ignored by the consumer, not only by a file inside it');
  assert.ok(lines.includes('node_modules/'), 'existing entries are preserved');
});
