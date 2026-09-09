import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { syncProject, checkProject } from './agentkit.mjs';
import { injectHeader, stripHeader } from './adapters.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentkit-rollout-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
const source = path.dirname(fileURLToPath(import.meta.url));
function put(base, rel, text) {
  const file = path.join(base, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text);
}
const json = (base, rel, value) => put(base, rel, JSON.stringify(value, null, 2) + '\n');
const read = (base, rel) => fs.readFileSync(path.join(base, rel), 'utf8');

test('rollout: legacy hook migration preserves unrelated settings and explains unresolved ownership', () => {
  const base = fs.mkdtempSync(path.join(root, 'legacy-')), kit = path.join(base, 'kit'), project = path.join(base, 'project');
  for (const rel of ['agentkit.mjs', 'adapters.mjs']) put(kit, rel, fs.readFileSync(path.join(source, rel)));
  json(kit, 'package.json', { version: '1.1.0' });
  put(kit, '.agent/skills/probe/SKILL.md', '---\nname: probe\ndescription: Use for fixture work.\ntier: core\n---\n# Probe\n');
  const oldHook = 'node private-machine-path/agentkit.mjs check . --quick --json';
  const newHook = 'agentkit check . --quick --json';
  json(kit, '.agent/hooks.json', [{ event: 'SessionStart', command: oldHook }]);
  json(project, '.agentkit.json', { vendors: ['claude'], stack: [], kinds: ['tooling'], tools: [], overlay: {}, permissions: { enabled: false } });
  json(project, '.claude/settings.json', { custom: 'keep', permissions: { deny: ['Bash(private-deny-value)'] } });
  assert.equal(syncProject(project, { kitRoot: kit }).ok, true);
  const lock = JSON.parse(read(project, '.agentkit.lock')); delete lock.schema;
  lock.settings = Object.fromEntries(Object.entries(lock.settings).map(([file, rows]) => [file, [...new Set(rows.map(row => row.key))]]));
  json(project, '.agentkit.lock', lock);
  json(kit, '.agent/hooks.json', [{ event: 'SessionStart', command: newHook }]);
  const cli = (...args) => spawnSync(process.execPath, [path.join(kit, 'agentkit.mjs'), 'sync', project, ...args], { encoding: 'utf8' });
  const before = read(project, '.claude/settings.json');
  const preview = cli('--dry-run');
  assert.equal(preview.status, 0, preview.stdout + preview.stderr);
  assert.equal(read(project, '.claude/settings.json'), before);
  assert.match(preview.stdout, /OWNERSHIP-UNRESOLVED/);
  assert.doesNotMatch(preview.stdout, /private-machine-path|private-deny-value/);
  const applied = cli(); assert.equal(applied.status, 0, applied.stdout + applied.stderr);
  assert.match(applied.stdout, /OWNERSHIP-UNRESOLVED/);
  assert.match(applied.stdout, /migration-checklist/);
  let native = JSON.parse(read(project, '.claude/settings.json'));
  assert.deepEqual(native.hooks.SessionStart.flatMap(g => g.hooks.map(h => h.command)), [oldHook, newHook]);
  // Operator removes exactly the superseded legacy contribution after preserving its preimage.
  native.hooks.SessionStart = native.hooks.SessionStart.filter(g => !g.hooks.some(h => h.command === oldHook));
  json(project, '.claude/settings.json', native);
  assert.equal(syncProject(project, { kitRoot: kit }).ok, true);
  assert.equal(checkProject(project, { kitRoot: kit }).results.some(r => r.verdict === 'OWNERSHIP-UNRESOLVED'), false);
  native = JSON.parse(read(project, '.claude/settings.json'));
  assert.deepEqual(native.hooks.SessionStart.flatMap(g => g.hooks.map(h => h.command)), [newHook]);
  assert.equal(native.custom, 'keep'); assert.deepEqual(native.permissions.deny, ['Bash(private-deny-value)']);
  const completed = read(project, '.agentkit.lock');
  const repeat = syncProject(project, { kitRoot: kit });
  assert.equal(repeat.ok, true); assert.deepEqual(repeat.written, []);
  assert.equal(read(project, '.agentkit.lock'), completed);
});

test('rollout: generated executable headers preserve shebang and supported adoption round trip', () => {
  for (const ending of ['\n', '\r\n']) {
    const raw = '#!/usr/bin/env node' + ending + 'console.log("fixture");' + ending;
    const generated = injectHeader(raw, '.agent/skills/probe/scripts/run.mjs', '.mjs');
    assert.ok(generated.startsWith('#!/usr/bin/env node\n// AGENTKIT GENERATED'));
    assert.equal(stripHeader(generated), raw.replaceAll('\r\n', '\n'));
  }
});

test('rollout: old writing names and project overlays survive current all-vendor generation', () => {
  const base = fs.mkdtempSync(path.join(root, 'writing-consumer-')), oldKit = path.join(base, 'old-kit'), project = path.join(base, 'project');
  json(oldKit, 'package.json', { version: '0.3.0' }); json(oldKit, '.agent/hooks.json', []);
  const names = ['manage-writing-style', 'respond-clearly', 'write-content', 'write-ui-copy'];
  for (const name of names) put(oldKit, `.agent/skills/${name}/SKILL.md`, `---\nname: ${name}\ndescription: Use for old fixture writing.\ntier: core\n---\n# Old ${name}\n`);
  json(project, '.agentkit.json', { vendors: ['claude', 'codex', 'gemini', 'opencode', 'antigravity'], stack: [], kinds: ['tooling'], tools: [], overlay: { skills: ['project-*'] }, permissions: { enabled: false } });
  const overlay = '---\nname: project-voice\ndescription: Use for project terminology.\ntier: overlay\n---\n# Keep our terminology\n';
  put(project, '.agent/skills/project-voice/SKILL.md', overlay);
  put(project, 'AGENTS.md', '# Project\nUse manage-writing-style, respond-clearly, write-content and write-ui-copy.\n');
  assert.equal(syncProject(project, { kitRoot: oldKit }).ok, true);
  const oldLock = JSON.parse(read(project, '.agentkit.lock')); delete oldLock.schema;
  json(project, '.agentkit.lock', oldLock);
  const before = read(project, 'AGENTS.md');
  const result = syncProject(project, { kitRoot: source, allowBranch: true });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(read(project, 'AGENTS.md'), before); assert.equal(read(project, '.agent/skills/project-voice/SKILL.md'), overlay);
  for (const name of [...names, 'write-clear']) assert.ok(fs.existsSync(path.join(project, `.agent/skills/${name}/SKILL.md`)));
  assert.equal(fs.existsSync(path.join(project, 'governance')), false);
  assert.match(read(project, '.agent/rules/pattern-docs-artifacts.md'), /selected AgentKit checkout/);
  const scripts = result.written.filter(rel => rel.endsWith('/manage-writing-style/scripts/writing-style.mjs'));
  assert.ok(scripts.length >= 3, JSON.stringify(scripts));
  for (const rel of scripts) {
    const r = spawnSync(process.execPath, [path.join(project, rel), 'list'], { cwd: project, encoding: 'utf8' });
    assert.equal(r.status, 0, rel + ': ' + r.stderr);
    assert.deepEqual(JSON.parse(r.stdout).styles, []);
  }
  assert.equal(fs.existsSync(path.join(project, '.writing')), false, 'read-only commands must not create private data');
  const script = path.join(project, scripts[0]);
  const init = spawnSync(process.execPath, [script, 'init', 'house'], { cwd: project, encoding: 'utf8' });
  assert.equal(init.status, 0, init.stderr);
  for (const rel of scripts) {
    const r = spawnSync(process.execPath, [path.join(project, rel), 'resolve', 'house'], { cwd: project, encoding: 'utf8' });
    assert.equal(r.status, 1); assert.match(r.stderr, /style-unreviewed/);
  }
  const completed = read(project, '.agentkit.lock');
  const repeat = syncProject(project, { kitRoot: source, allowBranch: true });
  assert.equal(repeat.ok, true, JSON.stringify(repeat)); assert.deepEqual(repeat.written, []);
  assert.equal(read(project, '.agentkit.lock'), completed);
  assert.equal(checkProject(project, { kitRoot: source }).results.some(r => r.verdict === 'MISSING'), false);
});
