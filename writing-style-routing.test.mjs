import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initStyle } from './.agent/skills/manage-writing-style/scripts/writing-style.mjs';

const fixturePath = path.join(import.meta.dirname, 'writing-style-routing-fixture.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const tempRoots = [];
const canonicalRoutes = new Set(['manage-writing-style', 'write-content', 'write-ui-copy', 'respond-clearly']);
const operations = new Set(['add', 'update', 'inspect', 'audit', 'approve-exemplar', 'exclude-source', 'purge-source']);

function snapshot(root) {
  const files = [];
  const writing = path.join(root, '.writing');
  if (!fs.existsSync(writing)) return files;
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else files.push([path.relative(root, absolute), fs.readFileSync(absolute).toString('base64')]);
    }
  };
  visit(writing);
  return files.sort((a, b) => a[0].localeCompare(b[0]));
}

function countsByClass(cases) {
  return Object.groupBy(cases, (item) => item.class);
}

function commandPlan(item) {
  if (!item.expected_operation) return null;
  return {
    command: item.expected_operation,
    route: 'manage-writing-style',
    mutates_style_data: item.mutation_expected,
  };
}

after(() => {
  for (const root of tempRoots) fs.rmSync(root, { recursive: true, force: true });
});

test('routing fixture has the required balanced cases and only final skill names', () => {
  assert.equal(fixture.schema_version, 1);
  assert.equal(fixture.cases.length, 40);
  const groups = countsByClass(fixture.cases);
  assert.equal(groups['management-positive'].length, 12);
  assert.equal(groups['named-style-generation-positive'].length, 10);
  assert.equal(groups['hard-negative'].length, 12);
  assert.equal(groups['mixed-or-multi-label'].length, 6);

  for (const item of fixture.cases) {
    assert.ok(item.id && item.utterance);
    assert.ok(item.expected_routes.length > 0);
    for (const route of item.expected_routes) assert.ok(canonicalRoutes.has(route), `${item.id}: ${route}`);
    assert.equal(typeof item.mutation_expected, 'boolean');
    if (!item.expected_operation) assert.equal(item.mutation_expected, false);
    if (item.expected_operation) assert.ok(operations.has(item.expected_operation), `${item.id}: unknown operation`);
  }
});

test('deterministic command assertions keep hard negatives mutation-free', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'writing-routing-'));
  tempRoots.push(root);
  fs.writeFileSync(path.join(root, '.agentkit.json'), '{}\n');
  initStyle(root, { styleId: 'humaira', displayName: 'Humaira' });
  const before = snapshot(root);

  for (const item of fixture.cases.filter((candidate) => candidate.class === 'hard-negative')) {
    assert.equal(commandPlan(item), null, `${item.id} must not map to a management command`);
    assert.equal(item.mutation_expected, false);
  }

  assert.deepEqual(snapshot(root), before, 'hard-negative evaluation must not mutate .writing');
});

test('management operations have explicit command mappings separate from model observations', () => {
  for (const item of fixture.cases.filter((candidate) => candidate.class === 'management-positive')) {
    const plan = commandPlan(item);
    assert.deepEqual(plan, {
      command: item.expected_operation,
      route: 'manage-writing-style',
      mutates_style_data: item.mutation_expected,
    });
  }

  assert.deepEqual(fixture.evaluation_boundary.model_routing_observations, 'Live model discovery and invocation results are recorded separately when a host-specific evaluator is available.');
  assert.equal(fixture.evaluation_boundary.model_observations_status, 'not-run');
});
