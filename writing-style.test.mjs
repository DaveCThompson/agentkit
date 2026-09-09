import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  StyleError,
  addSource,
  approveExemplar,
  auditStyle,
  excludeSource,
  initStyle,
  inspectStyle,
  listStyles,
  purgeSource,
  runCommand,
  updateStyle,
} from './.agent/skills/manage-writing-style/scripts/writing-style.mjs';

const tempRoots = [];
const artifacts = [
  'normalized.jsonl',
  'profile.generated.json',
  'effective-profile.json',
  'baseline.json',
  'exemplar-candidates.jsonl',
  'exemplars.approved.jsonl',
  'build-state.json',
];

function project() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'writing-style-'));
  fs.writeFileSync(path.join(root, '.agentkit.json'), '{}\n');
  tempRoots.push(root);
  return root;
}

function styleDir(root, id = 'humaira') {
  return path.join(root, '.writing', 'styles', id);
}

function readArtifact(root, name) {
  return fs.readFileSync(path.join(styleDir(root), name));
}

beforeEach(() => {});

after(() => {
  for (const root of tempRoots) fs.rmSync(root, { recursive: true, force: true });
});

test('init, add, and update preserve source bytes and deterministic derived artifacts', () => {
  const root = project();
  const sample = path.join(root, 'sample.md');
  const sourceBytes = Buffer.from('\ufeffFirst paragraph, with a concrete detail.\r\n\r\nSecond paragraph follows.\r\n', 'utf8');
  fs.writeFileSync(sample, sourceBytes);

  const initialized = initStyle(root, { styleId: 'humaira', displayName: 'Humaira' });
  assert.equal(initialized.style_id, 'humaira');
  const added = addSource(root, { file: sample, style: 'humaira', mode: 'report', genre: 'technical' });
  assert.equal(added.capture_fidelity, 'original-bytes');

  const manifest = JSON.parse(fs.readFileSync(path.join(styleDir(root), 'source-manifest.json'), 'utf8'));
  assert.equal(manifest.sources.length, 1);
  assert.deepEqual(fs.readFileSync(path.join(styleDir(root), manifest.sources[0].stored_path)), sourceBytes);

  const styleBefore = fs.readFileSync(path.join(styleDir(root), 'style.md'));
  const first = Object.fromEntries(artifacts.map((name) => [name, readArtifact(root, name)]));
  const updated = updateStyle(root, 'humaira');
  const second = Object.fromEntries(artifacts.map((name) => [name, readArtifact(root, name)]));
  assert.equal(updated.diagnostics_status, 'needs-review');
  assert.deepEqual(fs.readFileSync(path.join(styleDir(root), 'style.md')), styleBefore);
  for (const name of artifacts) assert.deepEqual(second[name], first[name], `${name} should be deterministic after update`);

  const duplicate = addSource(root, { content: 'another copy is not the same', style: 'humaira' });
  assert.equal(duplicate.status, 'added');
  const duplicateAgain = addSource(root, { file: sample, style: 'humaira' });
  assert.equal(duplicateAgain.status, 'duplicate');
  assert.equal(duplicateAgain.mutated, false);
});

test('chat capture records fidelity and unauthorized third-party material is rejected', () => {
  const root = project();
  initStyle(root, { styleId: 'humaira', displayName: 'Humaira' });
  const chat = addSource(root, { content: 'This sample came from an authorized chat capture.', style: 'humaira' });
  assert.equal(chat.capture_fidelity, 'host-decoded-text');
  const manifest = JSON.parse(fs.readFileSync(path.join(styleDir(root), 'source-manifest.json'), 'utf8'));
  assert.equal(manifest.sources[0].capture_fidelity, 'host-decoded-text');

  assert.throws(
    () => addSource(root, { content: 'Copied third-party prose.', style: 'humaira', authorship: 'third-party', rights: 'unknown' }),
    (error) => error instanceof StyleError && error.code === 'rights-required',
  );
  const after = JSON.parse(fs.readFileSync(path.join(styleDir(root), 'source-manifest.json'), 'utf8'));
  assert.equal(after.sources.length, 1);
});

test('invalid style contract fails closed without replacing active artifacts', () => {
  const root = project();
  initStyle(root, { styleId: 'humaira', displayName: 'Humaira' });
  addSource(root, { content: 'A useful sample with enough words to generate a candidate for review.', style: 'humaira' });
  const before = readArtifact(root, 'profile.generated.json');
  fs.writeFileSync(path.join(styleDir(root), 'style.md'), '# malformed contract\n', 'utf8');
  assert.throws(
    () => updateStyle(root, 'humaira'),
    (error) => error instanceof StyleError && error.code === 'invalid-style-contract',
  );
  assert.deepEqual(readArtifact(root, 'profile.generated.json'), before);
});

test('exclude retains the source, rebuilds without it, and purge requires confirmation', () => {
  const root = project();
  initStyle(root, { styleId: 'humaira', displayName: 'Humaira' });
  const added = addSource(root, { content: 'An included source with enough detail for the generated diagnostic profile.', style: 'humaira' });
  const excluded = excludeSource(root, added.source_id, 'humaira');
  assert.equal(excluded.status, 'excluded');
  const manifest = JSON.parse(fs.readFileSync(path.join(styleDir(root), 'source-manifest.json'), 'utf8'));
  assert.equal(manifest.sources[0].included, false);
  assert.ok(fs.existsSync(path.join(styleDir(root), manifest.sources[0].stored_path)));
  assert.equal(inspectStyle(root, 'humaira').dirty, false);
  assert.throws(() => purgeSource(root, added.source_id, 'humaira'), (error) => error.code === 'confirmation-required');
  const purged = purgeSource(root, added.source_id, 'humaira', true);
  assert.equal(purged.status, 'purged');
  assert.equal(JSON.parse(fs.readFileSync(path.join(styleDir(root), 'source-manifest.json'), 'utf8')).sources.length, 0);
});

test('style lookup supports aliases and exemplar approval remains explicit', () => {
  const root = project();
  initStyle(root, { styleId: 'humaira', displayName: 'Humaira', alias: ['house-voice'] });
  addSource(root, { content: 'A candidate sample with enough words to be considered for explicit approval.', style: 'house-voice' });
  const candidates = fs.readFileSync(path.join(styleDir(root), 'exemplar-candidates.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.ok(candidates.length > 0);
  const approved = approveExemplar(root, candidates[0].candidate_id, 'humaira');
  assert.equal(approved.status, 'approved');
  assert.equal(auditStyle(root, 'humaira').status, 'ok');
  assert.equal(listStyles(root)[0].default, true);
});

test('add accepts a positional style id and aliases cannot collide', () => {
  const root = project();
  initStyle(root, { styleId: 'default-style', displayName: 'Default', alias: ['default-voice'] });
  initStyle(root, { styleId: 'second-style', displayName: 'Second' });
  runCommand(['add', 'second-style', '--content', 'A positional style selection must reach the requested profile.'], root);
  assert.equal(inspectStyle(root, 'second-style').included_source_count, 1);
  assert.throws(
    () => initStyle(root, { styleId: 'third-style', displayName: 'Third', alias: ['default-voice'] }),
    (error) => error instanceof StyleError && error.code === 'alias-collision',
  );
});

test('style IDs cannot escape the project writing root and locks fail closed', () => {
  const root = project();
  assert.throws(() => initStyle(root, { styleId: '../outside' }), (error) => error.code === 'invalid-style-id');
  assert.throws(() => runCommand(['list', '--root', 'C:/outside'], root), (error) => error.code === 'unsupported-option');
  initStyle(root, { styleId: 'humaira', displayName: 'Humaira' });
  const lock = path.join(styleDir(root), '.lock');
  fs.writeFileSync(lock, '{"pid":1}\n', 'utf8');
  assert.throws(() => updateStyle(root, 'humaira'), (error) => error.code === 'lock-held');
  fs.unlinkSync(lock);
});
