import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyzeCommand, GUARD_LIMITS, guardCapabilities } from './command-guard.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentkit-command-guard-'));
const project = path.join(root, 'project');
const temp = path.join(root, 'temp');
fs.mkdirSync(path.join(project, '.git'), { recursive: true });
fs.mkdirSync(temp, { recursive: true });
const base = { cwd: project, projectRoot: project, tempRoot: temp, homeDir: path.join(root, 'home') };
const check = (command, shell = 'posix', extra = {}) => analyzeCommand({ ...base, ...extra, command, shell });

const regressionPairs = [
  ['newline boundary', 'echo ok\nrm -rf /', 'deny'],
  ['cmd boundary', 'echo ok & del /s .git', 'deny', 'cmd'],
  ['quoted operator is data', "printf '%s' '>' .git/config", 'continue'],
  ['heredoc body is data', 'cat <<EOF\n; rm -rf /\nEOF', 'continue'],
  ['post-heredoc command', 'cat <<EOF\nhello\nEOF\nrm -rf /', 'deny'],
  ['effective cwd', 'cd /; rm -rf work', 'deny'],
  ['literal assignment', 'target=build; rm -rf "$target"', 'continue'],
  ['scratch assignment', 'scratch=$(mktemp -d); rm -rf "$scratch"', 'continue'],
  ['cmd scoped cleanup', 'rmdir /s /q build', 'continue', 'cmd'],
  ['scoped permissions', 'chmod -R u+rw build', 'continue'],
  ['one process', 'taskkill /PID 1234 /F', 'continue', 'cmd'],
  ['scoped restore', 'git restore --worktree -- src/file.ts', 'continue'],
  ['Git message is data', 'git commit -m reset -m --hard', 'continue'],
  ['config tree removal', 'rm -rf .agent', 'deny'],
  ['protected PS write', 'Set-Content -LiteralPath .git/config -Value x', 'deny', 'powershell'],
  ['PS dry run still redirects', 'Remove-Item -LiteralPath $missing -WhatIf > .git/config', 'deny', 'powershell'],
  ['Git dry run still redirects', 'git clean -nd > .git/config', 'deny'],
  ['Git cwd', 'git -C / clean -fdx', 'deny'],
];
for (const [label, command, expected, shell] of regressionPairs) {
  test(`repair regression: ${label}`, () => assert.equal(check(command, shell).action, expected));
}
test('cmd preserves absolute backslashes', () => {
  assert.equal(check('del /s C:\\Users\\user\\project\\.git', 'cmd', {
    platform: 'win32', cwd: 'C:\\Users\\user\\project', projectRoot: 'C:\\Users\\user\\project',
  }).action, 'deny');
});
test('unknown scripts and exhausted wrapper depth are not claimed supported', () => {
  assert.notEqual(check('node script.mjs').coverage.status, 'supported');
  let command = 'echo ok';
  for (let i = 0; i < 10; i++) command = `bash -c ${JSON.stringify(command)}`;
  assert.notEqual(check(command).coverage.status, 'supported');
});
test('encoded PowerShell is inspected without executing it', () => {
  const encoded = Buffer.from('Remove-Item -LiteralPath .git -Recurse', 'utf16le').toString('base64');
  assert.equal(check(`pwsh -EncodedCommand ${encoded}`, 'powershell').action, 'deny');
});
test('missing leaves resolve through symlink ancestors and protected aliases', t => {
  const link = path.join(project, 'git-alias');
  try { fs.symlinkSync(path.join(project, '.git'), link, 'junction'); }
  catch (error) { if (error.code === 'EPERM') return t.skip('symlink permission unavailable'); throw error; }
  assert.equal(check('echo x > git-alias/not-yet-created').action, 'deny');
});

test('protected descendants cannot be erased by removing their parent', () => {
  assert.equal(check('rm -rf data', 'posix', { protectedPaths: ['data/secrets'] }).action, 'deny');
  assert.equal(check('rm -rf ..').action, 'deny');
});
test('failed or conditional directory changes cannot prove containment', () => {
  assert.equal(check('cd missing-directory; rm -rf .git').action, 'deny');
  assert.equal(check('cd build || rm -rf .').action, 'deny');
});
test('native option terminators keep dry-run-looking filenames destructive', () => {
  assert.equal(check('git clean -fd -- -n .git').action, 'deny');
  assert.equal(check('rm -- -safe-file').action, 'continue');
});
test('PowerShell literal scratch create and cleanup needs no prompt', () => {
  const child = path.join(temp, 'scoped-child');
  assert.equal(check(`New-Item -ItemType Directory -Path '${child}'; Remove-Item -LiteralPath '${child}' -Recurse`, 'powershell').action, 'continue');
});
test('PowerShell block comments are data while commands after the comment are inspected', () => {
  assert.equal(check('Write-Output ok <#\n; Remove-Item .git -Recurse\n#>', 'powershell').action, 'continue');
  assert.equal(check('<# Remove-Item .git #> Remove-Item .git -Recurse', 'powershell').action, 'deny');
});

test('dangerous and benign POSIX pairs distinguish executable position from data', () => {
  assert.equal(check('rm -rf .git').action, 'deny');
  assert.equal(check('rm -rf dist').action, 'continue');
  assert.equal(check('printf "rm -rf /"').action, 'continue');
  assert.equal(check('rg "rm -rf /" README.md').action, 'continue');
  assert.equal(check('bash -c "rm -rf .git"').action, 'deny');
  assert.equal(check('bash -c "rm -rf dist"').action, 'continue');
});

test('protected, broad, unresolved, and contained targets use path components', () => {
  assert.equal(check('rm -rf .').action, 'deny');
  assert.equal(check('rm -rf /').ruleId, 'GUARD-BROAD-DELETE');
  assert.equal(check('rm -rf $UNRESOLVED').ruleId, 'GUARD-UNRESOLVED-TARGET');
  assert.equal(check('rm -rf build/output').action, 'continue');
  assert.equal(check('rm outside-file.txt').action, 'continue');
  assert.equal(check('rm -rf ../outside-directory').action, 'deny');
  assert.equal(check('rm -rf ../project-other').action, 'deny');
  assert.equal(check(`rm -rf ${path.join(temp, 'case-1').replaceAll('\\', '/')}`).action, 'continue');
  assert.equal(check(`rm -rf ${temp.replaceAll('\\', '/')}`).action, 'deny');
});

test('PowerShell, cmd, redirection, Git, and disk rules are command-specific', () => {
  assert.equal(check('Remove-Item -LiteralPath .git -Recurse', 'powershell').action, 'deny');
  assert.equal(check('Remove-Item -LiteralPath $missing -Recurse -WhatIf', 'powershell').action, 'continue');
  assert.equal(check('del /s .git', 'cmd').action, 'deny');
  assert.equal(check('echo rm -rf / > .git/config').action, 'deny');
  assert.equal(check('git reset --hard HEAD').ruleId, 'GUARD-GIT-RESET-HARD');
  assert.equal(check('git clean -nd').action, 'continue');
  assert.equal(check('git push --force-with-lease').action, 'continue');
  assert.equal(check('git push --force').ruleId, 'GUARD-GIT-FORCE-PUSH');
  assert.equal(check('mkfs.ext4 /dev/sda').ruleId, 'GUARD-DISK-WIPE');
});

test('limits degrade to unsupported neutral continuation', () => {
  assert.equal(check('x'.repeat(GUARD_LIMITS.maxInputBytes + 1)).coverage.status, 'unsupported');
  assert.equal(check(Array.from({ length: GUARD_LIMITS.maxSegments + 1 }, () => 'echo ok').join(';')).coverage.status, 'unsupported');
  assert.equal(check('echo "rm -rf .git"').action, 'continue');
  assert.equal(analyzeCommand({ ...base, command: 'rm -rf .git', shell: 'ruby' }).coverage.status, 'unsupported');
});

test('custom protected paths and capability contract are explicit', () => {
  assert.equal(check('rm -rf secrets', 'posix', { protectedPaths: ['secrets'] }).action, 'deny');
  const capabilities = guardCapabilities();
  assert.equal(capabilities.protocolVersion, 1);
  assert.deepEqual(capabilities.shellFamilies, ['posix', 'powershell', 'cmd']);
  assert.equal(capabilities.vendors.opencode.nativeProof, 'pending');
});
