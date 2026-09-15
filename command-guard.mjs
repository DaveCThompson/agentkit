// Bounded, read-only command analysis. Never execute inspected text. This is not a sandbox.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export const GUARD_PROTOCOL_VERSION = 1;
export const GUARD_LIMITS = Object.freeze({ maxInputBytes: 65536, maxWrappers: 8, maxSegments: 128 });
const executable = v => String(v || '').split(/[\\/]/).pop().toLowerCase();
const normalizeShell = s => ({ bash: 'posix', sh: 'posix', zsh: 'posix', pwsh: 'powershell', ps: 'powershell', 'powershell.exe': 'powershell', 'cmd.exe': 'cmd', 'git-bash': 'posix' }[s] || s);
const result = (action = 'continue', ruleId = 'GUARD-CONTINUE', reason = '', coverage = {}, targets = []) =>
  ({ action, ruleId, reason, targets, coverage: { status: 'supported', shell: 'unknown', inspectedSegments: 0, ...coverage } });
const unsupported = shell => result('continue', 'GUARD-UNSUPPORTED', '', { shell, status: 'unsupported' });

// Operators retain their type: quoted ">" is data. Here-doc bodies never become commands.
function tokenize(text, shell) {
  const tokens = [], here = [];
  let value = '', active = false, quote = null, literal = false, expectHere = false, stripTabs = false;
  const push = () => {
    if (!active) return;
    tokens.push({ value, literal });
    if (expectHere) { here.push({ delimiter: value, stripTabs }); expectHere = false; }
    value = ''; active = literal = false;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    const escape = shell === 'powershell' ? String.fromCharCode(96) : shell === 'cmd' ? '^' : '\\';
    if (c === escape && quote !== "'" && (quote !== '"' || shell !== 'posix' || /[$\x60"\\\n]/.test(next || ''))) {
      if (next !== undefined) { if (next !== '\n') value += next; i++; active = true; if (next === '$') literal = true; continue; }
    }
    if (quote) {
      if (c === quote) {
        if (shell === 'powershell' && next === quote) { value += c; i++; } else quote = null;
      } else value += c;
      continue;
    }
    if (c === '"' || (c === "'" && shell !== 'cmd')) { quote = c; active = true; if (c === "'") literal = true; continue; }
    if (shell === 'powershell' && c === '<' && next === '#') {
      const end = text.indexOf('#>', i + 2);
      if (end < 0) return null;
      push(); i = end + 1; continue;
    }
    if (c === '#' && shell !== 'cmd' && !active) { while (i < text.length && text[i] !== '\n') i++; i--; continue; }
    if (c === '$' && next === '(') {
      const end = text.indexOf(')', i + 2);
      if (end < 0) return null;
      value += text.slice(i, end + 1); active = true; i = end; continue;
    }
    if (c === '\n') {
      push(); tokens.push({ op: '\n' });
      for (const doc of here.splice(0)) {
        let found = false;
        while (i + 1 < text.length) {
          const end = text.indexOf('\n', i + 1);
          let line = text.slice(i + 1, end < 0 ? text.length : end).replace(/\r$/, '');
          if (doc.stripTabs) line = line.replace(/^\t+/, '');
          i = end < 0 ? text.length : end;
          if (line === doc.delimiter) { found = true; break; }
        }
        if (!found) return null;
      }
      continue;
    }
    if (/\s/.test(c)) { push(); continue; }
    if (';|&><'.includes(c)) {
      push(); let op = c;
      if (next === c && c !== ';') { op += next; i++; }
      tokens.push({ op });
      if (op === '<<' && shell === 'posix') { expectHere = true; stripTabs = text[i + 1] === '-'; if (stripTabs) i++; }
      continue;
    }
    value += c; active = true;
  }
  push();
  return quote || here.length || expectHere ? null : tokens;
}
function expand(token, state, shell) {
  if (token.literal) return token.value;
  return token.value.replace(shell === 'cmd' ? /%(\w+)%/g : /\$(?:\{(\w+)\}|(?:env:)?(\w+))/gi,
    (full, a, b) => Object.hasOwn(state.env, a || b) ? String(state.env[a || b]) : full);
}

function resolver(input) {
  const api = input.platform === 'win32' ? path.win32 : path.posix;
  const home = input.homeDir || input.env.USERPROFILE || input.env.HOME || os.homedir();
  const temp = input.tempRoot || input.env.TEMP || input.env.TMP || os.tmpdir();
  const literal = raw => {
    if (typeof raw !== 'string' || !raw || /[$\x60*?{}\[\]%\0]/.test(raw)) return null;
    if (raw === '~' || /^~[/\\]/.test(raw)) raw = api.join(home, raw.slice(1));
    if (!api.isAbsolute(raw) && !input.cwd) return null;
    return api.resolve(input.cwd || api.parse(raw).root, raw);
  };
  const same = (a, b) => !!a && !!b && (input.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);
  const within = (child, parent) => {
    if (!child || !parent) return false;
    const rel = api.relative(parent, child);
    return !rel || (rel !== '..' && !rel.startsWith('..' + api.sep) && !api.isAbsolute(rel));
  };
  // Missing leaves are resolved via their existing ancestor; IO failures are uncertainty.
  const real = raw => {
    if (!raw) return null;
    if (input.platform !== process.platform) return raw;
    let current = raw;
    for (let i = 0; i < 128; i++) {
      try { return api.resolve(fs.realpathSync.native(current), api.relative(current, raw)); }
      catch (e) { if (!['ENOENT', 'ENOTDIR'].includes(e.code)) return null; }
      const parent = api.dirname(current);
      if (parent === current) return null;
      current = parent;
    }
    return null;
  };
  const project = literal(input.projectRoot), projectReal = real(project);
  const roots = [
    ...['.git', '.hg', '.svn'].map(p => project && api.join(project, p)),
    api.join(home, '.ssh'), api.join(home, '.aws'), api.join(home, '.config', 'gcloud'),
    ...(input.protectedPaths || []).map(p => api.isAbsolute(p) ? p : project && api.resolve(project, p)),
  ].filter(Boolean);
  const protectedRoots = roots.flatMap(p => [p, real(p)]).filter(Boolean);
  const configTrees = project ? ['.agent', '.agents', '.claude', '.codex', '.gemini', '.opencode'].map(p => api.join(project, p)) : [];
  const classify = raw => {
    const target = literal(raw);
    if (!target) return { raw, kind: 'unresolved' };
    const resolved = real(target);
    if ([api.parse(target).root, project, home, temp, ...configTrees].some(p => same(target, p) || same(resolved, p))) return { raw, kind: 'broad' };
    if (protectedRoots.some(p => within(target, p) || within(resolved, p) || within(p, target) || within(p, resolved))) return { raw, kind: 'protected' };
    if (!resolved) return { raw, kind: 'unresolved' };
    if (within(target, project) && !within(resolved, projectReal)) return { raw, kind: 'unresolved' };
    return { raw, kind: within(resolved, projectReal) ? 'contained' : within(resolved, real(literal(temp))) ? 'scratch' : 'outside' };
  };
  return { literal, classify, api };
}
function decide(files, operation, rule, state, shell, recursive = false) {
  const r = resolver(state), targets = files.map(r.classify);
  const bad = targets.find(t => ['protected', 'unresolved', 'broad'].includes(t.kind) || (recursive && t.kind === 'outside'));
  if (!bad && targets.length) return result();
  const kind = bad?.kind || 'unresolved';
  const ruleId = kind === 'protected' ? 'GUARD-PROTECTED-TARGET' : kind === 'unresolved' ? 'GUARD-UNRESOLVED-TARGET' : rule;
  return result('deny', ruleId, operation + ' targets ' + kind + ' scope ' + JSON.stringify(bad?.raw || '') + '; use an exact scoped target or a dry run.',
    { shell, inspectedSegments: 1 }, files);
}

function inspect(segment, state, shell, depth, budget) {
  const words = [];
  // A command dry-run never exempts its separate output redirection.
  for (let i = 0; i < segment.length; i++) {
    const token = segment[i];
    if (!token.op) { words.push(token); continue; }
    if (['>', '>>'].includes(token.op)) {
      if (segment[i + 1]?.op === '&') { i += 2; continue; }
      const dest = segment[++i];
      const verdict = decide(dest?.value !== undefined ? [expand(dest, state, shell)] : [], 'output redirection', 'GUARD-WRITE-TARGET', state, shell);
      if (verdict.action === 'deny') return verdict;
    } else if (['<', '<<'].includes(token.op)) i++;
    else return unsupported(shell);
  }
  if (!words.length) return result();
  const assignment = words.map(w => w.value).join(' ').match(shell === 'powershell' ? /^\$(\w+)\s*=\s*(.+)$/ : /^(\w+)=(.+)$/);
  if (assignment && (words.length === 1 || shell === 'powershell')) {
    let value = assignment[2];
    if (shell === 'posix' && /^\$\(mktemp -d\)$/.test(value)) {
      value = resolver(state).api.join(state.tempRoot || os.tmpdir(), 'agentkit-symbolic-scratch');
    } else if (words.length === 1) value = expand({ ...words[0], value }, state, shell);
    state.env[assignment[1]] = /[$\x60()]/.test(value) ? '$UNRESOLVED' : value;
    return /[$\x60()]/.test(value) ? unsupported(shell) : result();
  }
  const parts = words.map(w => expand(w, state, shell));
  const name = executable(parts[0]), args = parts.slice(1), lower = args.map(a => a.toLowerCase());
  if (['cd', 'chdir', 'set-location', 'sl'].includes(name)) {
    const dest = args.filter(a => !['/d', '-literalpath', '-path'].includes(a.toLowerCase()));
    state.cwd = dest.length === 1 ? resolver(state).literal(dest[0]) : null;
    if (state.cwd && state.nextBoundary !== '&&') {
      try { if (state.platform !== process.platform || !fs.statSync(state.cwd).isDirectory()) state.cwd = null; }
      catch { state.cwd = null; }
    }
    return state.cwd ? result() : unsupported(shell);
  }
  const nestedShell = ['bash', 'sh', 'dash', 'zsh', 'ksh'].includes(name) ? 'posix'
    : ['powershell', 'powershell.exe', 'pwsh', 'pwsh.exe'].includes(name) ? 'powershell'
      : ['cmd', 'cmd.exe'].includes(name) ? 'cmd' : null;
  if (nestedShell) {
    if (depth >= GUARD_LIMITS.maxWrappers) return unsupported(shell);
    const encoded = lower.findIndex(a => ['-encodedcommand', '-enc'].includes(a));
    if (encoded >= 0 && nestedShell === 'powershell') {
      const value = args[encoded + 1];
      if (!value || !/^[\w+/]+={0,2}$/.test(value)) return unsupported(shell);
      return analyzeText(Buffer.from(value, 'base64').toString('utf16le'), nestedShell, depth + 1, state, budget);
    }
    const index = lower.findIndex(a => ['-c', '/c', '-command'].includes(a));
    if (index < 0 || !args[index + 1]) return unsupported(shell);
    return analyzeText(nestedShell === 'cmd' ? args.slice(index + 1).join(' ') : args[index + 1], nestedShell, depth + 1, state, budget);
  }
  if (['env', 'sudo', 'doas', 'command', 'exec'].includes(name)) {
    if (depth >= GUARD_LIMITS.maxWrappers) return unsupported(shell);
    const nested = { ...state, env: { ...state.env } }; let i = 1;
    while (name === 'env' && /^\w+=/.test(parts[i] || '')) {
      const at = parts[i].indexOf('=');
      nested.env[parts[i].slice(0, at)] = parts[i].slice(at + 1); i++;
    }
    if (parts[i]?.startsWith('-')) return unsupported(shell);
    return inspect(words.slice(i), nested, shell, depth + 1, budget);
  }
  const whatIf = shell === 'powershell' && lower.some(a => ['-whatif', '-whatif:$true'].includes(a));
  const endOptions = args.indexOf('--');
  const optionArgs = endOptions < 0 ? args : args.slice(0, endOptions);
  const operands = [...optionArgs.filter(a => !a.startsWith('-') && !(shell === 'cmd' && /^\/[sqfa]$/i.test(a))), ...(endOptions < 0 ? [] : args.slice(endOptions + 1))];
  const remove = shell === 'posix' && ['rm', 'rmdir', 'unlink'].includes(name)
    || shell === 'cmd' && ['del', 'erase', 'rd', 'rmdir'].includes(name)
    || shell === 'powershell' && ['remove-item', 'ri', 'rm', 'rmdir', 'del', 'erase'].includes(name);
  if (remove) {
    if (whatIf) return result();
    const recursive = lower.some(a => /^-[^-]*r/.test(a) || ['--recursive', '-recurse', '/s'].includes(a));
    return decide(operands, name, 'GUARD-BROAD-DELETE', state, shell, recursive);
  }
  if (shell === 'powershell' && ['set-content', 'add-content', 'clear-content', 'out-file', 'sc', 'ac', 'clc'].includes(name)) {
    if (whatIf) return result();
    const index = lower.findIndex(a => ['-literalpath', '-path', '-filepath'].includes(a));
    return decide([index >= 0 ? args[index + 1] : operands[0]].filter(Boolean), name, 'GUARD-WRITE-TARGET', state, shell);
  }
  if (name === 'git') {
    let i = 0, gitState = { ...state };
    while (args[i]?.startsWith('-')) {
      const option = args[i++];
      if (option === '-C') gitState.cwd = resolver(gitState).literal(args[i++]);
      else if (['-c', '--git-dir', '--work-tree'].includes(option)) { if (option !== '-c') return unsupported(shell); i++; }
      else if (!['--no-pager', '--no-optional-locks'].includes(option)) return unsupported(shell);
    }
    const sub = args[i++], rest = args.slice(i), low = rest.map(a => a.toLowerCase());
    const terminator = rest.indexOf('--'), options = terminator < 0 ? low : low.slice(0, terminator);
    const deny = (rule, reason) => result('deny', rule, reason, { shell, inspectedSegments: 1 });
    if (sub === 'reset' && low.includes('--hard')) return deny('GUARD-GIT-RESET-HARD', 'git reset --hard discards working-tree changes.');
    if (sub === 'push' && low.some(a => ['--force', '-f', '--mirror'].includes(a) || a.startsWith('+'))) return deny('GUARD-GIT-FORCE-PUSH', 'Raw force or mirror push can replace remote history.');
    if (sub === 'clean') {
      if (options.some(a => ['--dry-run', '--interactive'].includes(a) || /^-[a-z]*[ni][a-z]*$/.test(a))) return result();
      const paths = terminator < 0 ? rest.filter(a => !a.startsWith('-')) : rest.slice(terminator + 1);
      if (!paths.length) return deny('GUARD-GIT-CLEAN', 'Unscoped git clean can discard untracked project data.');
      return decide(paths, 'git clean', 'GUARD-GIT-CLEAN', gitState, shell, true);
    }
    if (['restore', 'checkout'].includes(sub)) {
      const separator = rest.indexOf('--');
      const paths = separator >= 0 ? rest.slice(separator + 1) : rest.filter(a => !a.startsWith('-'));
      if (paths.some(a => a === '.' || a === ':/') || (sub === 'restore' && !paths.length)) return deny('GUARD-GIT-WORKTREE-RESTORE', 'This operation can replace the whole worktree; narrow the pathspec.');
      if (separator >= 0 || sub === 'restore') return decide(paths, 'git ' + sub, 'GUARD-GIT-WORKTREE-RESTORE', gitState, shell);
    }
    return result();
  }
  if (['mkfs', 'mkfs.ext4', 'format', 'format.com', 'diskpart', 'clear-disk', 'format-volume'].includes(name)) {
    return whatIf ? result() : result('deny', 'GUARD-DISK-WIPE', name + ' is a disk/volume destructive operation.', { shell });
  }
  if (name === 'dd') {
    const output = args.find(a => a.startsWith('of='));
    return output ? decide([output.slice(3)], 'dd', 'GUARD-DISK-WIPE', state, shell, true) : unsupported(shell);
  }
  if (['chmod', 'chown', 'icacls'].includes(name)) {
    return decide(name === 'icacls' ? args.slice(0, 1) : operands.slice(1), name, 'GUARD-BROAD-PERMISSIONS', state, shell, lower.includes('-r') || lower.includes('/t'));
  }
  if (['killall', 'pkill', 'taskkill'].includes(name)) {
    if (name === 'taskkill' && lower.includes('/pid') && /^\d+$/.test(args[lower.indexOf('/pid') + 1]) && !lower.includes('/im')) return result();
    if (name !== 'taskkill' && operands.length === 1 && /^[\w.-]+$/.test(operands[0])) return result();
    return result('deny', 'GUARD-BROAD-PROCESS-KILL', 'Process termination has broad or unresolved scope.', { shell });
  }
  return ['echo', 'printf', 'cat', 'rg', 'ls', 'pwd', 'true', 'false', 'get-content', 'write-output', 'new-item', 'mktemp'].includes(name) ? result() : unsupported(shell);
}
function analyzeText(text, shell, depth, input, budget) {
  if (Buffer.byteLength(text) > GUARD_LIMITS.maxInputBytes) return unsupported(shell);
  const tokens = tokenize(text, shell);
  if (!tokens) return unsupported(shell);
  const segments = []; let segment = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.op === '&' && ['>', '>>', '<'].includes(tokens[i - 1]?.op)) { segment.push(token); continue; }
    if ([';', '|', '||', '&&', '&', '\n'].includes(token.op)) { if (segment.length) { segment.boundary = token.op; segments.push(segment); } segment = []; }
    else segment.push(token);
  }
  if (segment.length) segments.push(segment);
  budget.segments += segments.length;
  if (budget.segments > GUARD_LIMITS.maxSegments) return unsupported(shell);
  const state = { ...input, env: { ...input.env } }; let partial = false;
  for (const current of segments) {
    const previousCwd = state.cwd, previousEnv = { ...state.env };
    state.nextBoundary = current.boundary;
    const verdict = inspect(current, state, shell, depth, budget);
    if (verdict.action === 'deny') return verdict;
    partial ||= verdict.coverage.status !== 'supported';
    if (['|', '&', '||'].includes(current.boundary)) { state.cwd = previousCwd; state.env = previousEnv; }
  }
  return result('continue', partial ? 'GUARD-PARTIAL-COVERAGE' : 'GUARD-CONTINUE', '', { shell, status: partial ? 'partial' : 'supported', inspectedSegments: budget.segments });
}
export function analyzeCommand(input = {}, options = {}) {
  try {
    const merged = { platform: process.platform, ...options, ...input, env: { ...process.env, ...options.env, ...input?.env } };
    merged.platform ||= process.platform;
    const shell = normalizeShell(merged.shell || merged.shellFamily), command = merged.command ?? merged.text;
    if (!['posix', 'powershell', 'cmd'].includes(shell) || typeof command !== 'string') return unsupported(shell);
    return analyzeText(command, shell, 0, merged, { segments: 0 });
  } catch { return unsupported(input?.shell); }
}
export function guardCapabilities() {
  return { protocolVersion: GUARD_PROTOCOL_VERSION, limits: { ...GUARD_LIMITS }, analyzer: 'bounded-shell-v1',
    shellFamilies: ['posix', 'powershell', 'cmd'],
    vendors: Object.fromEntries(['claude', 'codex', 'gemini', 'opencode'].map(v => [v, { registration: 'implemented', nativeProof: 'pending' }])),
    activation: 'blocked: native proof and compatible bound launcher proof required for every selected vendor/platform',
  };
}
// Closed gate, with no config/environment escape hatch. Admit platforms only with native evidence.
export function guardActivationIssues(config) {
  if (config.commandGuard?.enabled !== true) return [];
  return (config.vendors || []).filter(v => v !== 'antigravity').map(vendor => ({ level: 'error', vendor,
    msg: 'commandGuard cannot activate for ' + vendor + '/' + process.platform + ': native proof and compatible bound launcher proof are pending; leave enabled=false.',
  }));
}
