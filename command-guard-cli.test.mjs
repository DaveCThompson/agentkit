import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { runGuardCli, translateGuardResult } from './command-guard-cli.mjs';
import { adapters } from './adapters.mjs';
import { mergeSettings, planSync, loadConfig, syncProject, checkProject } from './agentkit.mjs';

const payload = command => JSON.stringify({ command, shell: 'posix', cwd: process.cwd(), projectRoot: process.cwd() });

test('CLI emits neutral continuation without an approval decision', () => {
  const r = runGuardCli(['--vendor', 'claude', '--json'], payload('npm test'));
  assert.equal(r.exitCode, 0);
  assert.deepEqual(JSON.parse(r.stdout), {});
});

test('CLI emits vendor-specific deny protocols', () => {
  const input = payload('rm -rf .git');
  const claude = JSON.parse(runGuardCli(['--vendor', 'claude', '--json'], input).stdout);
  assert.equal(claude.hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(claude.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(JSON.parse(runGuardCli(['--vendor', 'gemini', '--json'], input).stdout).decision, 'deny');
  assert.equal(JSON.parse(runGuardCli(['--vendor', 'codex', '--json'], input).stdout).hookSpecificOutput?.permissionDecision, 'deny');
  assert.equal(JSON.parse(runGuardCli(['--vendor', 'opencode', '--json'], input).stdout).decision, 'deny');
});

test('real native payload discovers project and configured protections from a nested cwd', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-native-'));
  fs.mkdirSync(path.join(root, '.git'));
  fs.mkdirSync(path.join(root, 'sub'));
  fs.writeFileSync(path.join(root, '.agentkit.json'), JSON.stringify({ commandGuard: { protectedPaths: ['secret-data'] } }));
  const invoke = command => JSON.parse(runGuardCli(['--vendor', 'claude', '--explain'], JSON.stringify({
    cwd: path.join(root, 'sub'), tool_name: 'Bash', tool_input: { command },
  })).stdout);
  assert.equal(invoke('rm -rf build').action, 'continue');
  assert.equal(invoke('git clean -fdx').action, 'deny');
  assert.equal(invoke('rm ../.git/config').action, 'deny');
  assert.equal(invoke('rm ../secret-data').action, 'deny');
});

test('sync refuses activation while selected native proof is pending', () => {
  const cfg = { ...loadConfig(process.cwd()), vendors: ['codex', 'gemini'], commandGuard: { enabled: true, protectedPaths: [] } };
  const plan = planSync(process.cwd(), { cfg });
  assert.ok(plan.validations.some(x => x.level === 'error' && /command.?guard.*native.*proof/i.test(x.msg)));
});

test('explain and capabilities are bounded read-only modes', () => {
  const explain = JSON.parse(runGuardCli(['--explain'], payload('rm -rf .git')).stdout);
  assert.equal(explain.action, 'deny');
  const capabilities = JSON.parse(runGuardCli(['--capabilities', '--json'], '').stdout);
  assert.equal(capabilities.protocolVersion, 1);
  assert.equal(runGuardCli(['--protocol-version'], '').stdout.trim(), '1');
});

test('standalone launcher emits the capability contract and guard result', () => {
  const capabilities = spawnSync(process.execPath, ['command-guard-cli.mjs', '--capabilities', '--json'], { encoding: 'utf8' });
  assert.equal(capabilities.status, 0);
  assert.equal(JSON.parse(capabilities.stdout).protocolVersion, 1);
  const deny = spawnSync(process.execPath, ['command-guard-cli.mjs', '--vendor', 'claude', '--json'], {
    input: payload('rm -rf .git'), encoding: 'utf8'
  });
  assert.equal(deny.status, 0);
  assert.equal(JSON.parse(deny.stdout).hookSpecificOutput.permissionDecision, 'deny');
});

test('malformed input and analyzer failures continue neutrally', () => {
  assert.deepEqual(JSON.parse(runGuardCli(['--vendor', 'claude'], '{').stdout), {});
  assert.deepEqual(translateGuardResult('claude', { action: 'continue' }), {});
});

const hookEntry = { type: 'hook', name: 'hooks', subPath: 'hooks.json', srcRel: '.agent/hooks.json',
  owner: 'core', tier: 'core', fm: {}, raw: '[]\n', body: '[]\n' };
const enabledContext = vendor => ({ config: { vendors: [vendor], kinds: ['app'], commandGuard: { enabled: true, protectedPaths: [] } },
  hooks: [{ id: 'command-guard', event: 'PreToolUse', matcher: 'Bash|PowerShell', command: 'agentkit guard --vendor {VENDOR} --json', commandWindows: 'agentkit guard --vendor {VENDOR} --json', timeoutMs: 1000, vendors: [vendor] }],
  mcpServers: {}, projectRoot: 'C:/project', kitPath: 'C:/kit' });

test('enabled adapters emit distinct native registrations and preserve matchers', () => {
  const claude = adapters.claude([hookEntry], enabledContext('claude'));
  const claudeHook = claude.settings.find(x => x.merge === 'claude-hooks');
  assert.equal(claudeHook.data[0].matcher, 'Bash|PowerShell');
  assert.equal(claudeHook.data[0].timeout, 1);
  const codex = adapters.codex([hookEntry], enabledContext('codex'));
  assert.equal(codex.settings.find(x => x.merge === 'codex-hooks').file, '.codex/hooks.json');
  const gemini = adapters.gemini([hookEntry], enabledContext('gemini'));
  assert.equal(gemini.settings.find(x => x.merge === 'gemini-hooks').file, '.gemini/settings.json');
  const geminiHook = gemini.settings.find(x => x.merge === 'gemini-hooks').data[0];
  assert.equal(geminiHook.event, 'BeforeTool');
  assert.equal(geminiHook.matcher, 'run_shell_command');
  assert.equal(geminiHook.timeout, 1000);
  assert.equal(claudeHook.data[0].command, 'agentkit guard --vendor claude --json');
  const opencode = adapters.opencode([hookEntry], enabledContext('opencode'));
  assert.match(opencode.files.find(x => x.rel.endsWith('agentkit-command-guard.js')).content, /spawnSync/);
});

test('hook ownership compares the whole group, including matcher and timeout', () => {
  const action = { file: '.claude/settings.json', merge: 'claude-hooks', data: [{ event: 'PreToolUse', matcher: 'Bash|PowerShell', command: '/kit guard', timeout: 1000 }] };
  const existing = JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: '/kit guard', timeout: 1000 }] }] } });
  const merged = mergeSettings(action, existing, []);
  const hooks = JSON.parse(merged.content).hooks.PreToolUse;
  assert.equal(hooks.length, 2, 'different matcher is not borrowed as equivalent coverage');
  const lock = merged.managedKeys;
  const edited = JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash|PowerShell', hooks: [{ type: 'command', command: '/kit guard', timeout: 2000 }] }] } });
  assert.throws(() => mergeSettings(action, edited, lock), /settings conflict/);
});

test('OpenCode factory consumes output.args only for bash and preserves neutral failures', async () => {
  const plugin = adapters.opencode([hookEntry], enabledContext('opencode')).files.find(f => f.rel.endsWith('agentkit-command-guard.js'));
  assert.equal(plugin.transform, 'unsupported', 'generated plugin is not a lossless hooks.json copy');
  let calls = [], response = { status: 0, stdout: '{}' };
  const source = plugin.content.replace("import { spawnSync } from 'node:child_process';", '')
    .replace('export default async function', 'async function') + '\ncommandGuardPlugin';
  const factory = vm.runInNewContext(source, {
    process: { platform: 'linux', env: {} },
    spawnSync: (...args) => { calls.push(args); return response; },
  });
  const hooks = await factory({ directory: '/work/project/sub', worktree: '/work/project' });
  const before = hooks['tool.execute.before'];
  await before({ tool: 'read' }, { args: { command: 'rm -rf /' } });
  assert.equal(calls.length, 0);
  await before({ tool: 'bash', command: 'wrong' }, { args: { command: 'echo ok' } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'agentkit');
  const payload = JSON.parse(calls[0][2].input);
  assert.equal(payload.command, 'echo ok');
  assert.equal(payload.cwd, '/work/project/sub');
  assert.equal(payload.projectRoot, '/work/project');
  response = { status: 0, stdout: '{"decision":"deny","reason":"protected"}' };
  await assert.rejects(before({ tool: 'bash' }, { args: { command: 'rm .git/config' } }), /protected/);
  response = { status: null, stdout: '' };
  await before({ tool: 'bash' }, { args: { command: 'echo ok' } });
});

test('oversized envelopes and bounded stdin degrade neutrally without a second Node process', () => {
  const input = JSON.stringify({ ...JSON.parse(payload('rm -rf /')), padding: 'x'.repeat(70000) });
  assert.deepEqual(JSON.parse(runGuardCli(['--vendor', 'claude'], input).stdout), {});
  const child = spawnSync(process.execPath, ['agentkit.mjs', 'guard', '--vendor', 'claude'], { input, encoding: 'utf8', timeout: 3000 });
  assert.equal(child.status, 0);
  assert.deepEqual(JSON.parse(child.stdout), {});
});

for (const [kind, file] of [['claude-hooks', '.claude/settings.json'], ['codex-hooks', '.codex/hooks.json'], ['gemini-hooks', '.gemini/settings.json']]) {
  test(`${kind}: whole groups survive lock-only checks and retire by ownership`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-ownership-'));
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    const group = { matcher: 'Bash', hooks: [{ type: 'command', command: 'first', timeout: 1 }, { type: 'command', command: 'second', timeout: 2 }] };
    const content = JSON.stringify({ hooks: { PreToolUse: [group] }, custom: true }, null, 2) + '\n';
    const lock = [{ kind, key: 'PreToolUse', value: group, ownership: 'introduced' }];
    fs.writeFileSync(path.join(root, file), content);
    fs.writeFileSync(path.join(root, '.agentkit.json'), JSON.stringify({ vendors: [], tools: [], stack: [], kinds: ['app'] }));
    fs.writeFileSync(path.join(root, '.agentkit.lock'), JSON.stringify({ files: {}, edits: {}, settings: { [file]: lock } }));
    const checked = checkProject(root, { quick: true });
    assert.ok(!checked.results.some(r => r.verdict.startsWith('SETTINGS-')), JSON.stringify(checked.results));
    const retired = mergeSettings({ file, merge: kind, data: [] }, content, lock);
    assert.deepEqual(JSON.parse(retired.content), { custom: true });
    const borrowed = mergeSettings({ file, merge: kind, data: [] }, content, [{ ...lock[0], ownership: 'borrowed' }]);
    assert.deepEqual(JSON.parse(borrowed.content), JSON.parse(content));
    assert.throws(() => mergeSettings({ file, merge: kind, data: [] }, content.replace('second', 'edited'), lock), /settings conflict/);
  });
}
test('activation refusal preserves project bytes in apply, dry-run, and quick check', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-activation-'));
  const config = JSON.stringify({ vendors: ['codex', 'gemini'], tools: [], stack: [], kinds: ['app'], commandGuard: { enabled: true } });
  fs.writeFileSync(path.join(root, '.agentkit.json'), config);
  for (const dryRun of [true, false]) {
    assert.equal(syncProject(root, { dryRun }).ok, false);
    assert.deepEqual(fs.readdirSync(root), ['.agentkit.json']);
    assert.equal(fs.readFileSync(path.join(root, '.agentkit.json'), 'utf8'), config);
  }
  assert.equal(checkProject(root, { quick: true }).clean, false);
});
test('absent legacy hook keys remain unresolved through sync', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-legacy-'));
  fs.mkdirSync(path.join(root, '.codex'));
  fs.writeFileSync(path.join(root, '.agentkit.json'), JSON.stringify({ vendors: [], tools: [], stack: [], kinds: ['app'] }));
  fs.writeFileSync(path.join(root, '.codex/hooks.json'), '{}');
  fs.writeFileSync(path.join(root, '.agentkit.lock'), JSON.stringify({ files: {}, edits: {}, settings: { '.codex/hooks.json': ['UnknownLegacyEvent'] } }));
  const synced = syncProject(root);
  assert.equal(synced.ok, true, JSON.stringify(synced));
  assert.ok(synced.unresolvedSettings.some(r => r.key === 'UnknownLegacyEvent'));
  const checked = checkProject(root, { quick: true });
  assert.ok(checked.results.some(r => r.verdict === 'OWNERSHIP-UNRESOLVED'));
});
