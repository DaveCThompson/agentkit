import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import * as style from './.agent/skills/manage-writing-style/scripts/writing-style.mjs';

const roots = [];
const script = fileURLToPath(new URL('./.agent/skills/manage-writing-style/scripts/writing-style.mjs', import.meta.url));
function project(init = true) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'writing-recovery-')); roots.push(root);
  fs.writeFileSync(path.join(root, '.agentkit.json'), '{}\n');
  if (init) style.initStyle(root, { styleId: 'house' });
  return root;
}
const dir = root => path.join(root, '.writing/styles/house');
const read = (root, name) => fs.readFileSync(path.join(dir(root), name), 'utf8');
const sample = 'An explicitly supplied sample with enough words to become an approved style example.';
function snapshot(root) {
  const result = {};
  const visit = (base, prefix = '') => {
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
      const rel = prefix + e.name;
      if (e.isDirectory()) visit(path.join(base, e.name), rel + '/');
      else result[rel] = fs.readFileSync(path.join(base, e.name)).toString('base64');
    }
  };
  visit(root); return result;
}
after(() => { for (const root of roots) fs.rmSync(root, { recursive: true, force: true }); });

test('writing F1: failed initialization preserves unregistered directories and their lock', () => {
  const root = project(false); fs.mkdirSync(dir(root), { recursive: true });
  fs.writeFileSync(path.join(dir(root), '.lock'), 'foreign'); fs.writeFileSync(path.join(dir(root), 'notes.txt'), 'recover me');
  const before = snapshot(dir(root));
  assert.throws(() => style.initStyle(root, { styleId: 'house' }));
  assert.deepEqual(snapshot(dir(root)), before);
});

test('writing F2: held style lock prevents even transient manifest mutation', () => {
  const root = project(); fs.writeFileSync(path.join(dir(root), '.lock'), 'foreign');
  const before = snapshot(root), rename = fs.renameSync; let observed = false;
  fs.renameSync = (from, to) => { if (to === path.join(dir(root), 'source-manifest.json')) observed = true; return rename(from, to); };
  try { assert.throws(() => style.addSource(root, { content: sample, style: 'house' }), e => e.code === 'lock-held'); }
  finally { fs.renameSync = rename; }
  assert.equal(observed, false); assert.deepEqual(snapshot(root), before);
});

test('writing F2: run-record failure rolls back corpus and every generated artifact', () => {
  const root = project(), before = snapshot(root), write = fs.writeFileSync;
  fs.writeFileSync = (file, ...args) => {
    if (String(file).includes(`${path.sep}runs${path.sep}`)) throw Object.assign(new Error('injected run EIO'), { code: 'EIO' });
    return write(file, ...args);
  };
  try { assert.throws(() => style.addSource(root, { content: sample, style: 'house' })); }
  finally { fs.writeFileSync = write; }
  assert.deepEqual(snapshot(root), before);
});

test('writing F3: excluded and purged samples leave no active approved prose', () => {
  const root = project(), added = style.addSource(root, { content: sample, style: 'house' });
  const candidate = JSON.parse(read(root, 'exemplar-candidates.jsonl').trim());
  style.approveExemplar(root, candidate.candidate_id, 'house');
  style.excludeSource(root, added.source_id, 'house');
  assert.equal(read(root, 'exemplars.approved.jsonl'), '');
  style.purgeSource(root, added.source_id, 'house', true);
  assert.ok(!JSON.stringify(snapshot(root)).includes(Buffer.from(sample).toString('base64')));
  assert.equal(style.auditStyle(root, 'house').status, 'ok');
});

test('writing F4: new IDs cannot capture existing aliases', () => {
  const root = project(false); style.initStyle(root, { styleId: 'first', alias: ['second'] });
  const before = snapshot(root);
  assert.throws(() => style.initStyle(root, { styleId: 'second' }), e => e.code === 'alias-collision');
  assert.deepEqual(snapshot(root), before);
});

test('writing F5: actual CLI rejects missing samples and preserves equals signs', () => {
  const root = project();
  for (const args of [['add', '--content'], ['add', '--content='], ['add', '--unknown', 'x']]) {
    const before = snapshot(root), r = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
    assert.equal(r.status, 1, r.stdout); assert.deepEqual(snapshot(root), before);
  }
  const r = spawnSync(process.execPath, [script, 'add', '--content=a=b=c'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const manifest = JSON.parse(read(root, 'source-manifest.json'));
  assert.equal(read(root, manifest.sources[0].stored_path), 'a=b=c');
});

test('writing F6: initialization is draft and inspect distinguishes invalid contracts', () => {
  const root = project(); assert.match(read(root, 'style.md'), /contract_status: draft/);
  const initial = style.inspectStyle(root, 'house'); assert.equal(initial.contract_status, 'draft');
  assert.equal(initial.ready_for_voice, false);
  fs.writeFileSync(path.join(dir(root), 'style.md'), '# invalid\n');
  const invalid = style.inspectStyle(root, 'house'); assert.equal(invalid.contract_valid, false);
  assert.equal(invalid.ready_for_voice, false); assert.equal(invalid.dirty, true);
});

test('writing recovery: abrupt process exit retains recovery, refuses edits, then restores coupled bytes', () => {
  const root = project(), before = snapshot(path.join(root, '.writing'));
  const worker = path.join(root, 'crash.mjs');
  fs.writeFileSync(worker, `import fs from 'node:fs'; import * as api from ${JSON.stringify(new URL('./.agent/skills/manage-writing-style/scripts/writing-style.mjs', import.meta.url).href)};
    const rename=fs.renameSync; fs.renameSync=(a,b)=>{rename(a,b); if(String(b).endsWith('profile.generated.json')) process.exit(77);};
    api.addSource(process.cwd(),{content:${JSON.stringify(sample)},style:'house'});`);
  const r = spawnSync(process.execPath, [worker], { cwd: root, encoding: 'utf8' }); assert.equal(r.status, 77, r.stderr);
  const status = style.operationStatus(root); assert.equal(status.status, 'recovery-required');
  assert.throws(() => style.updateStyle(root, 'house'), e => e.code === 'operation-pending');
  const manifest = path.join(dir(root), 'source-manifest.json'), retained = fs.readFileSync(manifest);
  fs.writeFileSync(manifest, 'intervening user edit');
  const changed = snapshot(path.join(root, '.writing'));
  assert.throws(() => style.recoverStyle(root, status.operation, true), e => e.code === 'recovery-conflict');
  assert.deepEqual(snapshot(path.join(root, '.writing')), changed);
  fs.writeFileSync(manifest, retained);
  assert.equal(style.recoverStyle(root, status.operation, true).status, 'recovered');
  assert.deepEqual(snapshot(path.join(root, '.writing')), before);
  assert.equal(style.addSource(root, { content: sample, style: 'house' }).status, 'added');
});

test('writing containment: directory links and hardlinked contracts preserve outside bytes', t => {
  const root = project(false), outside = project(false);
  fs.mkdirSync(path.join(root, '.writing'));
  fs.symlinkSync(outside, path.join(root, '.writing/styles'), process.platform === 'win32' ? 'junction' : 'dir');
  const before = snapshot(outside);
  assert.throws(() => style.initStyle(root, { styleId: 'house' }), e => e.code === 'unsafe-path');
  assert.deepEqual(snapshot(outside), before);
  fs.unlinkSync(path.join(root, '.writing/styles'));
  style.initStyle(root, { styleId: 'house' });
  const contract = path.join(dir(root), 'style.md'), linked = path.join(outside, 'contract.md');
  fs.renameSync(contract, linked); fs.linkSync(linked, contract);
  const contractBytes = fs.readFileSync(linked);
  assert.throws(() => style.updateStyle(root, 'house'), e => e.code === 'unsafe-path');
  assert.deepEqual(fs.readFileSync(linked), contractBytes);
});

test('writing concurrency: another process cannot mutate a live operation or lose registry entries', async () => {
  const root = project(); const worker = path.join(root, 'concurrent.mjs');
  fs.writeFileSync(worker, `import fs from 'node:fs'; import * as api from ${JSON.stringify(new URL('./.agent/skills/manage-writing-style/scripts/writing-style.mjs', import.meta.url).href)};
    const rename=fs.renameSync; let waited=false;
    fs.renameSync=(a,b)=>{rename(a,b); if(!waited&&String(b).endsWith('config.json')){waited=true; process.stdout.write('locked\\n'); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,1000);}};
    api.initStyle(process.cwd(),{styleId:'first'});`);
  const child = spawn(process.execPath, [worker], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const done = once(child, 'exit');
  await once(child.stdout, 'data');
  const competing = spawnSync(process.execPath, [script, 'init', 'second'], { cwd: root, encoding: 'utf8' });
  assert.equal(competing.status, 1); assert.match(competing.stderr, /operation-pending|lock-held/);
  assert.equal((await done)[0], 0);
  style.initStyle(root, { styleId: 'second' });
  assert.deepEqual(style.listStyles(root).map(s => s.id), ['first', 'house', 'second']);
});

test('writing voice resolution is read-only, draft-safe and rejects retired exemplar bytes', () => {
  const root = project(); assert.throws(() => style.resolveStyleContext(root, 'house'), e => e.code === 'style-unreviewed');
  const added = style.addSource(root, { content: sample, style: 'house' });
  const candidate = JSON.parse(read(root, 'exemplar-candidates.jsonl').trim()); style.approveExemplar(root, candidate.candidate_id, 'house');
  const contract = path.join(dir(root), 'style.md');
  fs.writeFileSync(contract, fs.readFileSync(contract, 'utf8').replace('contract_status: draft', 'contract_status: reviewed'));
  const before = snapshot(root), resolved = style.resolveStyleContext(root, 'house');
  assert.equal(resolved.approved_exemplars.length, 1); assert.deepEqual(snapshot(root), before);
  style.excludeSource(root, added.source_id, 'house');
  fs.writeFileSync(path.join(dir(root), 'exemplars.approved.jsonl'), JSON.stringify(candidate) + '\n');
  assert.throws(() => style.resolveStyleContext(root, 'house'), e => e.code === 'style-needs-attention');
});

function crashAdd(root) {
  const worker = path.join(root, 'crash-add.mjs');
  fs.writeFileSync(worker, `import fs from 'node:fs'; import * as api from ${JSON.stringify(new URL('./.agent/skills/manage-writing-style/scripts/writing-style.mjs', import.meta.url).href)};
    const rename=fs.renameSync; fs.renameSync=(a,b)=>{rename(a,b); if(String(b).endsWith('profile.generated.json')) process.exit(77);};
    api.addSource(process.cwd(),{content:${JSON.stringify(sample)},style:'house'});`);
  const r = spawnSync(process.execPath, [worker], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 77, r.stderr); return style.operationStatus(root).operation;
}

test('writing R1: candidate presentation cap cannot retire included approved examples', () => {
  const root = project();
  const added = style.addSource(root, { content: sample, style: 'house' });
  const candidate = JSON.parse(read(root, 'exemplar-candidates.jsonl').trim());
  style.approveExemplar(root, candidate.candidate_id, 'house');
  // Source IDs are content hashes. Select an earlier-sorting source with fifty eligible chunks.
  let content;
  for (let n = 0; n < 10000; n++) {
    const value = Array.from({ length: 50 }, (_, i) => `Earlier sample ${n} paragraph ${i} has enough independent words for an eligible example.`).join('\n\n');
    if (`src-${style.sha(value).slice(7, 31)}`.localeCompare(added.source_id) < 0) { content = value; break; }
  }
  assert.ok(content, 'find an earlier source');
  style.addSource(root, { content, style: 'house' });
  assert.equal(read(root, 'exemplar-candidates.jsonl').trim().split('\n').length, 50);
  assert.deepEqual(JSON.parse(read(root, 'exemplars.approved.jsonl')), candidate);
  assert.equal(style.auditStyle(root, 'house').status, 'ok');
});

test('writing R2: changed style ownership refuses recovery before restoring any bytes', () => {
  const root = project(), token = crashAdd(root), lock = path.join(dir(root), '.lock');
  fs.writeFileSync(lock, 'different owner');
  const before = snapshot(path.join(root, '.writing'));
  assert.throws(() => style.recoverStyle(root, token, true), e => e.code === 'recovery-conflict');
  assert.deepEqual(snapshot(path.join(root, '.writing')), before);
});

test('writing R3: stale recovery cannot undo a later committed operation', async () => {
  const root = project(), token = crashAdd(root), worker = path.join(root, 'stale-recover.mjs');
  fs.writeFileSync(worker, `import fs from 'node:fs'; import * as api from ${JSON.stringify(new URL('./.agent/skills/manage-writing-style/scripts/writing-style.mjs', import.meta.url).href)};
    const write=fs.writeFileSync;
    fs.writeFileSync=(file,...args)=>{if(String(file).endsWith('.recovery-lock')) {
      process.stdout.write('paused\\n'); const deadline=Date.now()+15000;
      while(!fs.existsSync('resume')) {if(Date.now()>deadline) throw new Error('test resume timeout'); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,20);}
    } return write(file,...args);};
    try {api.recoverStyle(process.cwd(),${JSON.stringify(token)},true); process.exitCode=2;}
    catch(error) {process.stdout.write(error.code+'\\n'); process.exitCode=error.code==='invalid-recovery'?0:1;}`);
  const child = spawn(process.execPath, [worker], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const done = once(child, 'exit'); let output = ''; child.stdout.on('data', b => { output += b; });
  await once(child.stdout, 'data');
  let before;
  try {
    assert.equal(style.recoverStyle(root, token, true).status, 'recovered');
    style.addSource(root, { content: sample, style: 'house' }); before = snapshot(path.join(root, '.writing'));
  } finally { fs.writeFileSync(path.join(root, 'resume'), 'go'); }
  assert.equal((await done)[0], 0, output);
  assert.deepEqual(snapshot(path.join(root, '.writing')), before);
  assert.equal(JSON.parse(read(root, 'source-manifest.json')).sources.length, 1);
});

test('writing R4: project-lock cleanup failure reports committed or restored data explicitly', () => {
  for (const failRun of [false, true]) {
    const root = project(), unlink = fs.unlinkSync, write = fs.writeFileSync;
    fs.unlinkSync = file => { if (file === path.join(root, '.writing/.lock')) throw Object.assign(new Error('cleanup EIO'), { code: 'EIO' }); return unlink(file); };
    fs.writeFileSync = (file, ...args) => { if (failRun && String(file).includes(`${path.sep}runs${path.sep}`)) throw Object.assign(new Error('run EIO'), { code: 'EIO' }); return write(file, ...args); };
    try {
      assert.throws(() => style.addSource(root, { content: sample, style: 'house' }), e => {
        assert.equal(e.code, 'lock-cleanup-required');
        assert.equal(e.disposition, failRun ? 'restored-before-state' : 'committed');
        assert.equal(e.cleanup, '.writing/.lock');
        assert.equal(e.operation, style.operationStatus(root).operation); return true;
      });
    } finally { fs.unlinkSync = unlink; fs.writeFileSync = write; }
    assert.equal(fs.existsSync(path.join(root, '.writing/.pending.json')), false);
    assert.equal(JSON.parse(read(root, 'source-manifest.json')).sources.length, failRun ? 0 : 1);
  }
});
