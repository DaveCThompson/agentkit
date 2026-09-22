import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  applyPlan,
  buildPlan,
  listWorktrees,
  pathKey,
  pruneDryRun,
} from './.agent/skills/implement-session-land/scripts/worktree-cleanup.mjs';

const script = fileURLToPath(new URL('./.agent/skills/implement-session-land/scripts/worktree-cleanup.mjs', import.meta.url));
const tempRoots = [];
after(() => { for (const root of tempRoots) fs.rmSync(root, { recursive: true, force: true }); });

function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout.trim();
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wt-cleanup-'));
  tempRoots.push(root);
  const main = path.join(root, 'main');
  fs.mkdirSync(main);
  git(main, 'init', '-q', '-b', 'main');
  git(main, 'config', 'user.name', 'fixture');
  git(main, 'config', 'user.email', 'fixture@example.invalid');
  git(main, 'config', 'core.autocrlf', 'false');
  fs.writeFileSync(path.join(main, 'a.txt'), 'one\n');
  fs.writeFileSync(path.join(main, '.gitignore'), 'node_modules/\n.env\n');
  git(main, 'add', '.');
  git(main, 'commit', '-q', '-m', 'init');
  const registry = { entries: [] };
  const add = (name, { branch, owner = 'session-1', activity = 'inactive', register = true } = {}) => {
    const p = path.join(root, name);
    git(main, 'worktree', 'add', '-q', ...(branch ? ['-b', branch, p] : ['--detach', p]));
    if (register) registry.entries.push({ path: p, owner, activity });
    return p;
  };
  const plan = (extra = {}) => buildPlan({ repo: main, target: 'main', registry, authorizedOwners: ['session-1'], ...extra });
  const commit = (cwd, file, content, msg) => {
    fs.writeFileSync(path.join(cwd, file), content);
    git(cwd, 'add', file);
    git(cwd, 'commit', '-q', '-m', msg);
  };
  return { root, main, registry, add, plan, commit };
}

const find = (plan, p) => {
  for (const bucket of ['eligible', 'retained', 'blocked']) {
    const hit = plan[bucket].find(r => pathKey(r.path) === pathKey(p));
    if (hit) return { bucket, ...hit };
  }
  return null;
};

const outcomeFor = (result, p) => result.outcomes.find(o => pathKey(o.path) === pathKey(p))?.outcome;

test('every worktree lands in exactly one bucket with owner and reason; plan mutates nothing', () => {
  const f = fixture();
  f.add('clean');
  f.add('active', { activity: 'active' });
  f.add('unregistered', { register: false });
  f.add('foreign', { owner: 'session-9' });
  const before = git(f.main, 'worktree', 'list', '--porcelain');
  const plan = f.plan();
  assert.equal(git(f.main, 'worktree', 'list', '--porcelain'), before);
  const all = [...plan.eligible, ...plan.retained, ...plan.blocked];
  assert.equal(all.length, listWorktrees(f.main).length);
  assert.equal(new Set(all.map(r => pathKey(r.path))).size, all.length);
  for (const r of all) {
    for (const field of ['path', 'branch', 'head', 'owner', 'activity', 'dirty', 'preservation_ref', 'reason']) assert.ok(field in r, field);
    assert.ok(r.owner && r.reason);
  }
  assert.equal(find(plan, f.main).reason, 'primary-worktree');
  assert.equal(find(plan, path.join(f.root, 'clean')).bucket, 'eligible');
  assert.equal(find(plan, path.join(f.root, 'unregistered')).bucket, 'blocked');
  assert.equal(find(plan, path.join(f.root, 'unregistered')).owner, 'unknown');
  assert.match(find(plan, path.join(f.root, 'unregistered')).reason, /^owner-unknown/);
  assert.equal(find(plan, path.join(f.root, 'foreign')).reason, 'owner-not-authorized');
});

test('fixture 1: dirty worktree with uncommitted tracked changes is blocked', () => {
  const f = fixture();
  const p = f.add('dirty');
  fs.writeFileSync(path.join(p, 'a.txt'), 'local edit\n');
  const hit = find(f.plan(), p);
  assert.equal(hit.bucket, 'blocked');
  assert.match(hit.reason, /^dirty-unproven/);
  assert.equal(hit.dirty.tracked, 1);
  assert.equal(hit.preservation_ref, 'main');
});

test('fixture 2: dirty diff already on target is blocked until proven, then eligible and removed', () => {
  const f = fixture();
  const p = f.add('dup');
  fs.writeFileSync(path.join(p, 'a.txt'), 'two\n');
  fs.writeFileSync(path.join(p, 'new.txt'), 'generated\n');
  assert.equal(find(f.plan(), p).bucket, 'blocked');

  fs.writeFileSync(path.join(f.main, 'new.txt'), 'generated\n');
  f.commit(f.main, 'a.txt', 'two\n', 'land the same generated change');
  git(f.main, 'add', 'new.txt');
  git(f.main, 'commit', '-q', '-m', 'add generated file');
  const plan = f.plan();
  const hit = find(plan, p);
  assert.equal(hit.bucket, 'eligible');
  assert.equal(hit.content_proof.ref, 'main');
  assert.deepEqual(hit.content_proof.mismatched, []);
  assert.deepEqual({ tracked: hit.dirty.tracked, untracked: hit.dirty.untracked }, { tracked: 1, untracked: 1 });

  const result = applyPlan(plan, { repo: f.main });
  assert.equal(outcomeFor(result, p), 'removed');
  assert.equal(fs.existsSync(p), false);
  assert.equal(result.prune_dry_run.clean, true);
  assert.equal(result.complete, true);
});

test('staged content found in neither the target nor HEAD keeps a matching working tree blocked', () => {
  const f = fixture();
  const p = f.add('staged');
  f.commit(f.main, 'a.txt', 'two\n', 'target content');
  fs.writeFileSync(path.join(p, 'a.txt'), 'staged only\n');
  git(p, 'add', 'a.txt');
  fs.writeFileSync(path.join(p, 'a.txt'), 'two\n');
  const hit = find(f.plan(), p);
  assert.equal(hit.bucket, 'blocked');
  assert.deepEqual(hit.content_proof.mismatched, ['a.txt']);
});

test('fixture 3: detached HEAD that is an ancestor of the target is eligible and removed', () => {
  const f = fixture();
  const p = f.add('detached');
  f.commit(f.main, 'a.txt', 'advanced\n', 'advance main');
  const plan = f.plan();
  const hit = find(plan, p);
  assert.equal(hit.bucket, 'eligible');
  assert.equal(hit.branch, null);
  assert.equal(hit.preservation_ref, 'main');
  assert.deepEqual(hit.ancestry.map(a => [a.ref, a.result]), [['main', 'ancestor']]);
  const result = applyPlan(plan, { repo: f.main });
  assert.equal(outcomeFor(result, p), 'removed');
  assert.equal(result.prune_dry_run.clean, true);
});

test('fixture 4: patch-equivalent branch that is not an ancestor is blocked; its own name is not proof', () => {
  const f = fixture();
  const p = f.add('feat', { branch: 'feat' });
  f.commit(p, 'b.txt', 'feature\n', 'feature work');
  f.commit(f.main, 'c.txt', 'other\n', 'unrelated main work'); // a distinct parent keeps the pick's SHA distinct
  git(f.main, 'cherry-pick', 'feat');
  assert.match(git(f.main, 'cherry', 'main', 'feat'), /^- /, 'fixture must be patch-equivalent');

  const hit = find(f.plan({ retained: ['feat'] }), p);
  assert.equal(hit.bucket, 'blocked');
  assert.match(hit.reason, /^head-not-preserved/);
  assert.equal(hit.preservation_ref, null);
  assert.deepEqual(hit.ancestry.map(a => [a.ref, a.result]), [['main', 'not-ancestor'], ['feat', 'skipped-own-branch']]);
});

test('fixture 5: worktree with an active registered owner is retained', () => {
  const f = fixture();
  const p = f.add('busy', { owner: 'session-1', activity: 'active' });
  const hit = find(f.plan(), p);
  assert.equal(hit.bucket, 'retained');
  assert.equal(hit.owner, 'session-1');
  assert.equal(hit.activity, 'active');
  assert.equal(hit.reason, 'owner-active');
});

test('fixture 6: worktree with a missing .git pointer is eligible and the removal path handles it', () => {
  const f = fixture();
  const p = f.add('nopointer');
  fs.rmSync(path.join(p, '.git'));
  const plan = f.plan();
  const hit = find(plan, p);
  assert.equal(hit.bucket, 'eligible');
  assert.equal(hit.action, 'repair-remove');
  const result = applyPlan(plan, { repo: f.main });
  assert.equal(outcomeFor(result, p), 'removed');
  assert.equal(fs.existsSync(p), false);
  assert.equal(result.prune_dry_run.clean, true);
});

test('fixture 7: stale Git admin record with no directory is pruned and verified by dry-run', () => {
  const f = fixture();
  const p = f.add('gone');
  fs.rmSync(p, { recursive: true, force: true });
  assert.equal(pruneDryRun(f.main).clean, false);
  const plan = f.plan();
  const hit = find(plan, p);
  assert.equal(hit.bucket, 'eligible');
  assert.equal(hit.action, 'prune-record');
  const result = applyPlan(plan, { repo: f.main });
  assert.equal(outcomeFor(result, p), 'removed');
  assert.equal(pruneDryRun(f.main).clean, true);
  assert.equal(listWorktrees(f.main).length, 1);
});

test('fixture 8: interrupted cleanup rerun over the same plan converges, then is a no-op', () => {
  const f = fixture();
  const first = f.add('first');
  const second = f.add('second');
  const plan = f.plan();
  assert.equal(plan.eligible.length, 2);

  git(f.main, 'worktree', 'remove', first); // the interrupted run completed only its first removal
  const resumed = applyPlan(plan, { repo: f.main });
  assert.equal(outcomeFor(resumed, first), 'already-removed');
  assert.equal(outcomeFor(resumed, second), 'removed');
  assert.equal(resumed.mutations, 1);
  assert.equal(resumed.complete, true);
  const state = git(f.main, 'worktree', 'list', '--porcelain');

  const rerun = applyPlan(plan, { repo: f.main });
  assert.equal(rerun.mutations, 0);
  assert.deepEqual(rerun.outcomes.map(o => o.outcome), ['already-removed', 'already-removed']);
  assert.equal(git(f.main, 'worktree', 'list', '--porcelain'), state);
  assert.equal(rerun.complete, true);

  const cleanPlan = f.plan();
  assert.equal(cleanPlan.eligible.length, 0);
  const noop = applyPlan(cleanPlan, { repo: f.main });
  assert.equal(noop.mutations, 0);
  assert.equal(noop.complete, true);
  assert.match(noop.summary, /^No worktrees were removed/);
  assert.match(noop.summary, /prune --dry-run reports nothing/);
});

test('useful ignored content blocks removal; disposable ignored content does not', () => {
  const f = fixture();
  const secret = f.add('secret');
  const deps = f.add('deps');
  fs.writeFileSync(path.join(secret, '.env'), 'TOKEN=placeholder\n');
  fs.mkdirSync(path.join(deps, 'node_modules'));
  fs.writeFileSync(path.join(deps, 'node_modules', 'x.js'), '\n');
  const plan = f.plan();
  assert.equal(find(plan, secret).bucket, 'blocked');
  assert.match(find(plan, secret).reason, /^useful-ignored-content/);
  assert.equal(find(plan, secret).dirty.ignored_useful, 1);
  assert.equal(find(plan, deps).bucket, 'eligible');
  assert.equal(find(plan, deps).dirty.ignored_disposable, 1);
});

test('apply skips an eligible worktree that changed after planning', () => {
  const f = fixture();
  const p = f.add('moving');
  const plan = f.plan();
  fs.writeFileSync(path.join(p, 'late.txt'), 'new work\n');
  const result = applyPlan(plan, { repo: f.main });
  assert.equal(outcomeFor(result, p), 'skipped-changed');
  assert.equal(fs.existsSync(path.join(p, 'late.txt')), true);
  assert.equal(result.mutations, 0);
  assert.equal(result.complete, false);
  assert.ok(result.retained.some(r => pathKey(r.path) === pathKey(p)));
});

test('CLI writes the plan before apply and reports completion by exit code', () => {
  const f = fixture();
  const p = f.add('cli');
  const registryFile = path.join(f.root, 'registry.json');
  fs.writeFileSync(registryFile, JSON.stringify(f.registry));
  const planFile = path.join(f.root, 'out', 'plan.json');
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: f.main, encoding: 'utf8' });

  const planned = run('plan', '--target', 'main', '--registry', registryFile, '--authorized-owner', 'session-1', '--out', planFile);
  assert.equal(planned.status, 0, planned.stderr);
  assert.equal(JSON.parse(fs.readFileSync(planFile, 'utf8')).eligible.length, 1);
  assert.equal(run('apply').status, 1, 'apply without a plan must refuse');

  const applied = run('apply', '--plan', planFile);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(applied.stdout).complete, true);
  assert.equal(fs.existsSync(p), false);
  assert.equal(run('verify').status, 0);
});
