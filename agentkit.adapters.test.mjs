import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The optional baseline lane uses immutable Git bytes, never switches the shared checkout.
let api;
if (process.env.AGENTKIT_ADAPTERS_BASELINE === '1') {
  const r = spawnSync('git', ['show', '396689e3758974eeb036aa8cbdf350e264aec908:adapters.mjs'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(createHash('sha256').update(r.stdout.replace(/\r\n/g, '\n')).digest('hex'),
    'af7967db9034c871dd60d9dd729dd76ade7f891f10f1bb82fc81b80f69061b68');
  api = await import(`data:text/javascript;base64,${Buffer.from(r.stdout).toString('base64')}`);
} else {
  api = await import('./adapters.mjs');
}
const { adapters, parseFrontmatter, stripHeader, claudePermissionsBaseline } = api;
const context = (vendors = ['claude', 'codex', 'gemini', 'opencode'], mcpServers = {}) => ({
  config: { vendors, kinds: ['tooling'], stack: [], permissions: { enabled: false } },
  hooks: [], mcpServers, projectRoot: 'C:/fixture space/project', kitPath: 'C:/fixture space/kit',
});
function entry(type, name, extra = {}, body = '# Fixture\nUse .agent/rules/first.md.\n') {
  const subPath = type === 'skill' ? `skills/${name}/SKILL.md` : `${type === 'workflow' ? 'workflows' : type === 'rule' ? 'rules' : 'agents'}/${name}.md`;
  const fm = { ...(type === 'skill' || type === 'agent' ? { name } : {}), description: 'Use for fixture work.', tier: 'core', ...extra };
  const raw = api.serializeFrontmatter(fm) + '\n' + body;
  return { type, name, subPath, srcRel: `.agent/${subPath}`, owner: 'core', fm, raw, body, tier: fm.tier };
}
const errors = result => result.validations.filter(v => v.level === 'error');
function parsedToml(text) {
  const python = process.env.AGENTKIT_TEST_PYTHON || 'python';
  const r = spawnSync(python, ['-c', 'import sys,json,tomllib; print(json.dumps(tomllib.loads(sys.stdin.read())))'], { input: text, encoding: 'utf8' });
  assert.equal(r.status, 0, `${python} tomllib required for semantic proof: ${r.error || r.stderr}`);
  return JSON.parse(r.stdout);
}

test('every generated file carries exact source and an explicit inverse contract', () => {
  const skill = entry('skill', 'fixture');
  const resource = { ...skill, subPath: 'skills/fixture/data.json', srcRel: '.agent/skills/fixture/data.json', raw: '{"safe":true}\n', fm: null };
  const workflow = entry('workflow', 'build');
  const rule = entry('rule', 'first', { trigger: 'model-decision' });
  for (const [vendor, adapter] of Object.entries(adapters)) {
    const result = adapter([rule, skill, resource, workflow], context([vendor]));
    assert.deepEqual(errors(result), [], vendor);
    for (const file of result.files) {
      assert.ok([rule, skill, resource, workflow].some(e => e.srcRel === file.source), `${vendor}: ${file.rel} source`);
      assert.ok(['body-md', 'copy', 'unsupported'].includes(file.transform), file.rel);
      if (file.rel.endsWith('data.json')) {
        assert.equal(file.transform, 'copy');
        assert.equal(file.content, resource.raw);
      } else if (file.rel.endsWith('.toml')) assert.equal(file.transform, 'unsupported');
      else assert.equal(file.transform, 'body-md');
    }
  }
});

test('real skill and synthesized workflow cannot overwrite one native destination', () => {
  const a = entry('skill', 'wf-build');
  const b = entry('workflow', 'build');
  const result = adapters.codex([a, b], context());
  assert.ok(errors(result).some(v => v.msg.includes(a.srcRel) && v.msg.includes(b.srcRel)));
  assert.deepEqual(result.files, []);
  assert.deepEqual(errors(adapters.opencode([entry('skill', 'build'), b], context())), []);
});

test('Claude visible skill and command collisions require explicit implementation pairing', () => {
  const skill = entry('skill', 'fixture');
  const workflow = entry('workflow', 'fixture');
  const result = adapters.claude([skill, workflow], context());
  assert.ok(errors(result).some(v => v.msg.includes(skill.srcRel) && v.msg.includes(workflow.srcRel)));
  assert.deepEqual(result.files, []);
  assert.deepEqual(errors(adapters.claude([skill, entry('workflow', 'fixture', { skill: 'fixture' })], context())), []);
});

test('same-owner duplicate routes, case aliases and malformed metadata fail before output', () => {
  const valid = entry('skill', 'fixture');
  const badCases = [
    [valid, { ...valid, owner: 'project' }],
    [valid, entry('skill', 'Fixture')],
    [entry('skill', 'fixture', { name: 'different' })],
    [entry('skill', 'fixture', { description: ['bad'] })],
    [entry('skill', 'fixture', { tier: 'techh:react' })],
    [entry('workflow', '../escape')],
    [{ ...valid, subPath: 'skills/fixture/../outside.md' }],
    [entry('workflow', 'fixture', { gemini: 'false' })],
  ];
  for (const vendor of ['claude', 'codex', 'gemini', 'opencode', 'antigravity']) {
    assert.deepEqual(errors(adapters[vendor]([valid], context([vendor]))), []);
    for (const entries of badCases) {
      const result = adapters[vendor](entries, context([vendor]));
      assert.ok(errors(result).length, `${vendor}: ${JSON.stringify(entries.map(e => e.fm))}`);
      assert.deepEqual(result.files, []);
      assert.deepEqual(result.settings, []);
    }
  }
});

test('Codex TOML preserves dotted keys and parent fields regardless of insertion order', () => {
  for (const server of [
    { command: 'inert-server', env: { 'SAFE.KEY': 'safe', QUOTED: 'a"b\\c\n\t' }, args: ['one', 'two'], enabled: false },
    { enabled: false, args: ['one', 'two'], env: { 'SAFE.KEY': 'safe', QUOTED: 'a"b\\c\n\t' }, command: 'inert-server' },
  ]) {
    const result = adapters.codex([], context(['codex'], { 'fixture.example': server }));
    assert.deepEqual(errors(result), []);
    const parsed = parsedToml(result.settings[0].data);
    assert.deepEqual(parsed, { mcp_servers: { 'fixture.example': server } });
  }
});

test('TOML renderer quotes literal child keys and keeps scalar siblings in their parent', () => {
  const obj = { env: { 'SAFE.KEY': 'value' }, args: ['x'], enabled: false };
  assert.deepEqual(parsedToml(api.renderTomlTable('mcp_servers.fixture', obj).join('\n')),
    { mcp_servers: { fixture: obj } });
});

test('MCP translation uses native fields and disabled means no Claude registration', () => {
  const server = { command: 'inert-server', env: { SAFE: 'value' }, args: ['--safe'], enabled: true };
  const ctx = context(undefined, { fixture: server, off: { ...server, enabled: false } });
  const open = adapters.opencode([], ctx).settings.find(s => s.merge === 'opencode-mcp').data;
  assert.deepEqual(open.fixture, { type: 'local', command: ['inert-server', '--safe'], environment: { SAFE: 'value' }, enabled: true });
  assert.equal(open.off.enabled, false);
  const claude = adapters.claude([], ctx).settings.find(s => s.merge === 'mcp-json').data;
  assert.deepEqual(claude, { fixture: { command: 'inert-server', args: ['--safe'], env: { SAFE: 'value' } } });
  assert.deepEqual(ctx.mcpServers.fixture, server, 'translation must not mutate neutral input');
});

test('unsupported MCP shapes fail closed without partial settings', () => {
  const invalid = [null, [], 'server', { command: ['node', 'script'] }, { command: 'node', args: [1] },
    { command: 'node', env: { BAD: { nested: true } } }, { command: 'node', env: { BAD: false } },
    { command: 'node', enabled: 'false' }, { command: 'node', url: 'https://example.invalid' },
    { command: 'node', type: 'local' }, { command: 'node', disabled: true }];
  for (const vendor of ['claude', 'codex', 'opencode', 'gemini', 'antigravity']) {
    for (const server of invalid) {
      const result = adapters[vendor]([], context([vendor], { fixture: server }));
      assert.ok(errors(result).length, `${vendor}: ${JSON.stringify(server)}`);
      assert.deepEqual(result.settings, []);
    }
  }
});

test('Gemini-only skills and combined alias output retain the same source, body and resources', () => {
  const skill = entry('skill', 'fixture');
  const resource = { ...skill, subPath: 'skills/fixture/references/guide.md', srcRel: '.agent/skills/fixture/references/guide.md', fm: null, raw: '# Guide\n' };
  const entries = [skill, resource, entry('workflow', 'build'), entry('workflow', 'private', { gemini: false })];
  const combined = context(['codex', 'gemini']);
  const gemini = adapters.gemini(entries, context(['gemini']));
  const codex = adapters.codex(entries, combined);
  assert.equal(gemini.files.filter(f => f.rel.startsWith('.gemini/skills/')).length, 2);
  for (const file of gemini.files.filter(f => f.rel.startsWith('.gemini/skills/'))) {
    const shared = codex.files.find(f => f.rel === file.rel.replace('.gemini/', '.agents/'));
    assert.equal(file.content, shared.content);
    assert.equal(file.source, shared.source);
    assert.equal(file.transform, shared.transform);
  }
  assert.equal(adapters.gemini(entries, combined).files.filter(f => f.rel.includes('/skills/')).length, 0);
  assert.ok(!gemini.files.some(f => f.rel.includes('private')));
  assert.equal(parseFrontmatter(stripHeader(gemini.files.find(f => f.rel.endsWith('SKILL.md')).content)).body, skill.body);
  // Removing Codex regenerates the same desired Gemini-only bytes. Edited old-output retirement
  // is deliberately a coordinator-owned planner assertion, not simulated by this pure adapter test.
  assert.deepEqual(adapters.gemini(entries, context(['gemini'])), gemini);
});

test('Gemini command TOML preserves quote, backslash and control-character meaning', () => {
  const e = entry('workflow', 'quote', {}, 'Text """ with \\ and literal \\n and \b and \f.\n');
  const file = adapters.gemini([e], context(['gemini'])).files[0];
  const doc = parsedToml(file.content);
  assert.equal(doc.description, e.fm.description);
  assert.equal(doc.prompt, e.body.trim() + `\n\nCanonical source: ${e.srcRel}\n`);
});

test('copy inverse preserves body citations and nested SKILL.md resources', () => {
  const root = entry('skill', 'fixture');
  const raw = '---\nname: sample\nprivate: preserved\n---\nExample AGENTKIT GENERATED from a citation.\n';
  const resource = { ...root, subPath: 'skills/fixture/references/SKILL.md', srcRel: '.agent/skills/fixture/references/SKILL.md', raw, ...parseFrontmatter(raw) };
  for (const vendor of ['claude', 'codex', 'gemini', 'opencode']) {
    const result = adapters[vendor]([root, resource], context([vendor]));
    assert.deepEqual(errors(result), []);
    const file = result.files.find(f => f.rel.endsWith('references/SKILL.md'));
    assert.equal(file.transform, 'copy');
    assert.equal(stripHeader(file.content), raw);
  }
});

test('reserved template support is not emitted as a native routable skill', () => {
  for (const vendor of ['claude', 'codex', 'gemini', 'opencode', 'antigravity']) {
    const result = adapters[vendor]([entry('skill', '_templates')], context([vendor]));
    assert.deepEqual(errors(result), []);
    assert.deepEqual(result.files, []);
  }
});

test('installed Gemini discovery: trusted paths, alias precedence and native YAML meanings',
  { skip: !process.env.AGENTKIT_TEST_GEMINI_BUNDLE && 'Set AGENTKIT_TEST_GEMINI_BUNDLE to the installed bundle exporting SkillManager.' }, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentkit-adapters-native-'));
    const description = 'Use for: "quoted" work # safely\nContinue here.';
    const e = entry('skill', 'native-fixture', { description });
    // Separate retained scenario roots: no real profile writes, servers, model calls or cleanup.
    for (const [scenario, vendors] of [['gemini-only', ['gemini']], ['combined', ['gemini', 'codex']], ['codex-removed', ['gemini']]]) {
      for (const vendor of vendors) for (const file of adapters[vendor]([e], context(vendors)).files) {
        const target = path.join(root, scenario, file.rel);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, file.content);
      }
    }
    const shadow = path.join(root, 'combined', '.gemini/skills/native-fixture/SKILL.md');
    fs.mkdirSync(path.dirname(shadow), { recursive: true });
    fs.writeFileSync(shadow, '---\nname: native-fixture\ndescription: lower precedence\n---\nLower body.\n');
    const home = path.join(root, 'isolated-home');
    fs.mkdirSync(home);
    const script = `
      import { SkillManager } from ${JSON.stringify(pathToFileURL(process.env.AGENTKIT_TEST_GEMINI_BUNDLE).href)};
      import path from 'node:path';
      const results = [];
      for (const scenario of ['gemini-only', 'combined', 'codex-removed']) {
        const base = path.join(process.env.AGENTKIT_NATIVE_FIXTURE, scenario);
        const storage = { getProjectSkillsDir: () => path.join(base, '.gemini/skills'), getProjectAgentSkillsDir: () => path.join(base, '.agents/skills') };
        const manager = new SkillManager();
        await manager.discoverSkills(storage, [], true);
        results.push({ scenario, skills: manager.getSkills().filter(s => s.name === 'native-fixture') });
        await manager.discoverSkills(storage, [], false);
        results.push({ scenario: scenario + '-untrusted', skills: manager.getSkills().filter(s => s.name === 'native-fixture') });
      }
      console.log(JSON.stringify(results));`;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: root, encoding: 'utf8', timeout: 30000,
      env: { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, LOCALAPPDATA: home,
        GEMINI_CLI_HOME: path.join(home, '.gemini'), AGENTKIT_NATIVE_FIXTURE: root },
    });
    fs.writeFileSync(path.join(root, 'result.json'), JSON.stringify({ status: r.status, error: r.error?.message, stdout: r.stdout, stderr: r.stderr }, null, 2));
    console.log(`Retained native Gemini evidence: ${root}`);
    assert.equal(r.status, 0, r.error?.message || r.stderr);
    const results = JSON.parse(r.stdout.trim().split(/\r?\n/).at(-1));
    for (const result of results) {
      if (result.scenario.endsWith('-untrusted')) { assert.deepEqual(result.skills, []); continue; }
      assert.equal(result.skills.length, 1, result.scenario);
      assert.equal(result.skills[0].description, description, result.scenario);
      assert.ok(result.skills[0].body.includes(e.body.trim()));
      assert.ok(result.skills[0].location.includes(result.scenario === 'combined' ? '.agents' : '.gemini'));
    }
  });

test('default grants cannot approve arbitrary helper scripts, broad runners or lock deletion', () => {
  const ctx = { ...context(), config: { kinds: ['app', 'service'], stack: ['python', 'docker'], permissions: {} } };
  const grants = claudePermissionsBaseline(ctx);
  for (const forbidden of ['Bash(node * lock *)', 'Bash(node * surfaces *)', 'Bash(rm -f .orchestrator.lock)', 'Bash(uv run *)', 'Bash(docker compose *)']) {
    assert.ok(!grants.includes(forbidden), forbidden);
  }
  assert.ok(grants.includes('Bash(npm run test *)'));
  assert.ok(grants.includes('Bash(docker compose ps *)'));
  assert.ok(!grants.some(g => /Bash\(.*\*node_modules|Bash\(npm --prefix/.test(g)));
  assert.ok(!grants.some(g => g.startsWith('PowerShell(')), 'unsupported permission tool names are not emitted');
  ctx.config.permissions.extra = ['Bash(uv run *)'];
  assert.ok(claudePermissionsBaseline(ctx).includes('Bash(uv run *)'), 'existing extra is explicit broad-runner opt-in');
  ctx.config.permissions.enabled = false;
  assert.deepEqual(claudePermissionsBaseline(ctx), []);
});
