// Downstream-consumption regressions: an existing consumer must be able to take a new kit release.
// Each test states the consumer shape it protects, because these paths are reached by upgrading
// projects rather than by the kit's own self-sync.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
// Empty markers are the documented enrollment request for the AGENTS.md workflow block.
function mkProject(name, agents = `# Fixture project\n\n${MD_START}\n${MD_END}\n`) {
  const project = path.join(root, name);
  json(project, '.agentkit.json', { vendors: ['claude'], stack: [], kinds: ['tooling'], tools: [], overlay: {}, permissions: { enabled: false } });
  put(project, 'AGENTS.md', agents);
  return project;
}
const blockOf = text => text.slice(text.indexOf(MD_START), text.indexOf(MD_END) + MD_END.length);

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
