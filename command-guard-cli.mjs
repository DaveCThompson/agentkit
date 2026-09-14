// Native hook boundary for the bounded analyzer. It accepts one JSON payload on stdin and emits
// one JSON result on stdout. Continue is intentionally an empty object: it preserves native
// permission checks and does not create a second approval/notice layer.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { analyzeCommand, guardCapabilities, GUARD_PROTOCOL_VERSION, GUARD_LIMITS } from './command-guard.mjs';

const VALUE_FLAGS = new Set(['--vendor', '--shell', '--platform', '--project-root', '--cwd']);

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (VALUE_FLAGS.has(key)) out[key.slice(2)] = argv[++i] || '';
    else if (key === '--json') out.json = true;
    else if (key === '--capabilities') out.capabilities = true;
    else if (key === '--protocol-version') out.protocolVersion = true;
    else if (key === '--explain') out.explain = true;
    else if (key === '--help' || key === '-h') out.help = true;
  }
  return out;
}

function projectContext(cwd, explicitRoot) {
  let current = path.resolve(cwd || process.cwd()), projectRoot = explicitRoot, configRoot;
  for (let i = 0; i < 128; i++) {
    if (fs.existsSync(path.join(current, '.agentkit.json'))) { configRoot = current; projectRoot ||= current; break; }
    if (fs.existsSync(path.join(current, '.git'))) { projectRoot ||= current; break; }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  let protectedPaths = [];
  const configPath = path.join(configRoot || projectRoot || current, '.agentkit.json');
  try {
    if (fs.statSync(configPath).size <= GUARD_LIMITS.maxInputBytes) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (Array.isArray(cfg.commandGuard?.protectedPaths)) protectedPaths = cfg.commandGuard.protectedPaths.filter(p => typeof p === 'string');
    }
  } catch { /* Missing/malformed project config is not authority to block every command. */ }
  return { projectRoot, protectedPaths };
}

function hookInput(payload, flags) {
  const toolInput = payload?.tool_input || payload?.toolInput || payload?.input || payload?.arguments || {};
  const command = payload?.command ?? toolInput.command ?? payload?.params?.command ?? payload?.args?.command;
  const cwd = toolInput.dir_path ?? payload?.cwd ?? payload?.dir_path ?? payload?.workdir ?? flags.cwd ?? process.cwd();
  const tool = payload?.tool_name ?? payload?.toolName ?? payload?.tool ?? flags.vendor;
  const explicitShell = payload?.shell ?? payload?.shell_family ?? payload?.shellFamily ?? flags.shell;
  const shell = explicitShell || (String(tool || '').toLowerCase().includes('powershell') ? 'powershell'
    : String(tool || '').toLowerCase() === 'bash' ? 'posix'
      : String(tool || '').toLowerCase() === 'run_shell_command' ? ((payload?.platform || flags.platform || process.platform) === 'win32' ? 'powershell' : 'posix')
        : undefined);
  const context = projectContext(payload?.cwd || cwd, payload?.projectRoot || flags['project-root']);
  return { command, cwd, shell, tool, ...context, platform: payload?.platform || flags.platform || process.platform,
    protectedPaths: [...context.protectedPaths, ...(payload?.protectedPaths || payload?.protected_paths || [])] };
}

export function translateGuardResult(vendor, analyzed) {
  if (analyzed.action !== 'deny') return {};
  const reason = analyzed.reason || 'Destructive command denied by AgentKit command guard.';
  if (vendor === 'claude' || vendor === 'codex') return { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } };
  if (vendor === 'gemini') return { decision: 'deny', reason };
  if (vendor === 'opencode') return { decision: 'deny', reason };
  return { decision: 'deny', reason };
}

export function runGuardCli(argv = [], inputText = '') {
  const flags = args(argv);
  if (flags.help) return { exitCode: 0, stdout: 'usage: command-guard-cli [--vendor <vendor>] [--json] [--capabilities] [--explain]\n', stderr: '' };
  if (flags.protocolVersion) return { exitCode: 0, stdout: `${GUARD_PROTOCOL_VERSION}\n`, stderr: '' };
  if (flags.capabilities) return { exitCode: 0, stdout: JSON.stringify(guardCapabilities(), null, flags.json ? 2 : 0) + '\n', stderr: '' };
  if (Buffer.byteLength(inputText) > GUARD_LIMITS.maxInputBytes) return { exitCode: 0, stdout: '{}\n', stderr: '' };
  let payload;
  try { payload = inputText ? JSON.parse(inputText) : {}; }
  catch { return { exitCode: 0, stdout: JSON.stringify({}), stderr: '' }; }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { exitCode: 0, stdout: '{}\n', stderr: '' };
  let normalized;
  try { normalized = hookInput(payload, flags); }
  catch { return { exitCode: 0, stdout: '{}\n', stderr: '' }; }
  const analyzed = analyzeCommand(normalized, { shell: flags.shell, platform: flags.platform, projectRoot: flags['project-root'] });
  const output = flags.explain ? analyzed : translateGuardResult(flags.vendor || payload.vendor || 'unknown', analyzed);
  return { exitCode: 0, stdout: JSON.stringify(output) + '\n', stderr: '' };
}

export function readGuardInput(fd = 0) {
  const buffer = Buffer.alloc(GUARD_LIMITS.maxInputBytes + 1);
  let total = 0;
  try {
    while (total < buffer.length) {
      const count = fs.readSync(fd, buffer, total, buffer.length - total, null);
      if (!count) return buffer.subarray(0, total).toString('utf8');
      total += count;
    }
  } catch { return ''; }
  return ''; // Oversized envelope is unsupported. Do not allocate or drain unbounded input.
}

export function main(argv = process.argv.slice(2)) {
  const noInput = argv.some(a => ['--help', '-h', '--capabilities', '--protocol-version'].includes(a));
  const input = noInput || process.stdin.isTTY ? '' : readGuardInput();
  const r = runGuardCli(argv, input);
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exit(main());
