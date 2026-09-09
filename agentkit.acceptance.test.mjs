// Independent acceptance boundaries. Production edits and this oracle have separate owners.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { syncProject, adoptFile, checkProject } from './agentkit.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentkit-acceptance-regression-'));
const put = (base, rel, text) => { const dest=path.join(base,rel); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.writeFileSync(dest,text); };
const json = (base,rel,value) => put(base,rel,JSON.stringify(value,null,2)+'\n');
const read = (base,rel) => fs.readFileSync(path.join(base,rel),'utf8');
const skill = (name='probe',tier='core',body='Preserve owned work.') => `---\nname: ${name}\ndescription: Fixture skill.\ntier: ${tier}\n---\n\n# Probe\n${body}\n`;
function fixture(config={}) {
  const base=fs.mkdtempSync(path.join(root,'case-')), kit=path.join(base,'kit'), project=path.join(base,'project');
  json(kit,'package.json',{name:'fixture-kit',version:'1.0.0'});
  put(kit,'CHANGELOG.md','# Changelog\n'); json(kit,'.agent/hooks.json',[]);
  put(kit,'.agent/skills/probe/SKILL.md',skill());
  json(project,'.agentkit.json',{vendors:['codex'],stack:[],kinds:['tooling'],tools:[],overlay:{},...config});
  return {base,kit,project};
}
const integration = (f,raw='  command: fixture-never-executed\n') => put(f.kit,'integrations/fixture.md','---\nmcp-name: fixture\nmcp:\n'+raw+'---\n');
const sync = (f,opts={}) => syncProject(f.project,{kitRoot:f.kit,...opts});
const first = f => { const r=sync(f); assert.equal(r.ok,true,JSON.stringify(r)); };
function snapshot(base) {
  const out={};
  function visit(dir,prefix='') { for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
    if(e.name==='.git') continue;
    const rel=prefix+e.name, abs=path.join(dir,e.name);
    if(e.isDirectory()) visit(abs,rel+'/'); else out[rel]=createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  } }
  visit(base); return out;
}
function refusesWithoutEffects(f,run) {
  const before=snapshot(f.base), result=run();
  assert.equal(result.ok,false,'operation must refuse: '+JSON.stringify(result));
  assert.deepEqual(snapshot(f.base),before,'refusal must preserve every peer and ownership byte');
  return result;
}
function parseToml(text) {
  const r=spawnSync(process.env.AGENTKIT_TEST_PYTHON||'python',['-c','import sys,json,tomllib; print(json.dumps(tomllib.loads(sys.stdin.read())))'],{input:text,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr||r.error?.message); return JSON.parse(r.stdout);
}

const userServerForms = [
  '[mcp_servers.fixture]\ncommand = "user-owned"\n',
  '[mcp_servers."fixture"]\ncommand = "user-owned"\n',
  "[mcp_servers.'fixture']\ncommand = 'user-owned'\n",
  'mcp_servers.fixture.command = "user-owned"\n',
  '[mcp_servers]\nfixture = { command = "user-owned" }\n',
  'mcp_servers = { fixture = { command = "user-owned" } }\n',
  '[mcp_servers."fi\\u0078ture"]\ncommand = "user-owned"\n',
];
for(const [index,text] of userServerForms.entries()) test(`ACCEPT-F1: semantic unowned TOML collision form ${index+1} refuses all effects`,()=>{
  assert.equal(parseToml(text).mcp_servers.fixture.command,'user-owned');
  const f=fixture({tools:['fixture']}); integration(f); put(f.project,'.codex/config.toml',text);
  refusesWithoutEffects(f,()=>sync(f));
});
test('ACCEPT-F1 control: unrelated user TOML survives as valid native configuration',()=>{
  const f=fixture({tools:['fixture']}); integration(f);
  const original='approval_policy = "on-request"\n[mcp_servers.mine]\ncommand = "user-owned"\n';
  put(f.project,'.codex/config.toml',original); first(f);
  const content=read(f.project,'.codex/config.toml'), parsed=parseToml(content);
  assert.ok(content.startsWith(original.trimEnd()));
  assert.equal(parsed.approval_policy,'on-request'); assert.equal(parsed.mcp_servers.mine.command,'user-owned');
  assert.equal(parsed.mcp_servers.fixture.command,'fixture-never-executed');
});
for(const [label,replacement] of [['wrong name',skill('wrong-name')],['wrong type',skill('[probe]')],['wrong description',skill().replace('description: Fixture skill.','description: [not, a, string]')]])
test(`ACCEPT-F2: canonical adoption rejects ${label} before kit publication`,()=>{
  const f=fixture(); first(f); put(f.project,'.agent/skills/probe/SKILL.md',replacement);
  refusesWithoutEffects(f,()=>adoptFile(f.project,'.agent/skills/probe/SKILL.md',{kitRoot:f.kit}));
});
test('ACCEPT-F2: adopted workflow cannot expose an accumulated native routing collision',()=>{
  const f=fixture();
  put(f.kit,'.agent/skills/build/SKILL.md',skill('build'));
  put(f.kit,'.agent/workflows/build.md','---\ndescription: Build fixture.\ntier: core\nskill: build\n---\n\nBuild.\n');
  first(f);
  const before=read(f.project,'.agent/workflows/build.md');
  const after=before.replace('skill: build\n',''); assert.notEqual(after,before);
  put(f.project,'.agent/workflows/build.md',after);
  refusesWithoutEffects(f,()=>adoptFile(f.project,'.agent/workflows/build.md',{kitRoot:f.kit}));
});
test('ACCEPT-F2 control: valid canonical body adoption remains syncable',()=>{
  const f=fixture(); first(f); put(f.project,'.agent/skills/probe/SKILL.md',skill('probe','core','Valid body change.'));
  assert.equal(adoptFile(f.project,'.agent/skills/probe/SKILL.md',{kitRoot:f.kit}).ok,true);
  assert.equal(sync(f,{dryRun:true}).ok,true);
});
for(const vendors of [['codex'],['claude'],[]]) for(const reason of ['filtered','absent'])
test(`ACCEPT-F3: ${reason} required skill refuses for ${vendors.join('+')||'canonical-only'}`,()=>{
  const f=fixture({vendors});
  if(reason==='filtered') put(f.kit,'.agent/skills/probe/SKILL.md',skill('probe','tech:react'));
  put(f.kit,'.agent/workflows/build.md',`---\ndescription: Build fixture.\ntier: core\nskill: ${reason==='absent'?'missing':'probe'}\n---\n\nUse the required skill.\n`);
  refusesWithoutEffects(f,()=>sync(f));
});
test('ACCEPT-F3 control: selected required skill succeeds independently of native vendor',()=>{
  const f=fixture({vendors:[]});
  put(f.kit,'.agent/workflows/build.md','---\ndescription: Build fixture.\ntier: core\nskill: probe\n---\n\nUse probe.\n'); first(f);
});
const badScalars = ['false','true','null','~','42','3.14','0x10','.inf'];
for(const value of badScalars) for(const field of ['command','arg','env'])
test(`ACCEPT-F4: raw ${field} ${value} cannot be coerced into a string`,()=>{
  const f=fixture({tools:['fixture']});
  const raw=field==='command'?`  command: ${value}\n`:
    field==='arg'?`  command: fixture-never-executed\n  args:\n    - ${value}\n`:
    `  command: fixture-never-executed\n  env:\n    SAFE: ${value}\n`;
  integration(f,raw); refusesWithoutEffects(f,()=>sync(f));
});
test('ACCEPT-F4 control: explicitly quoted scalar-looking strings retain exact native values',()=>{
  const f=fixture({tools:['fixture']}); integration(f,'  command: "false"\n  args: ["true", "42", "null"]\n  env:\n    SAFE: "false"\n'); first(f);
  const server=parseToml(read(f.project,'.codex/config.toml')).mcp_servers.fixture;
  assert.equal(server.command,'false'); assert.deepEqual(server.args,['true','42','null']); assert.deepEqual(server.env,{SAFE:'false'});
});
test('ACCEPT-F5: legacy conflict identifies native target and unresolved ownership without leaking values',()=>{
  const f=fixture({tools:['fixture']}); integration(f); first(f);
  const lock=JSON.parse(read(f.project,'.agentkit.lock')); delete lock.schema;
  lock.settings['.codex/config.toml']=['block']; json(f.project,'.agentkit.lock',lock);
  integration(f,'  command: new-fixture-never-executed\n  env:\n    SAFE: "private-fixture-marker"\n');
  const r=refusesWithoutEffects(f,()=>sync(f,{dryRun:true}));
  const summary=JSON.stringify(r);
  assert.ok(summary.includes('.codex/config.toml')); assert.ok(summary.includes('unresolved'));
  assert.ok(!summary.includes('private-fixture-marker'),'do not print private configuration values');
  const checked=checkProject(f.project,{kitRoot:f.kit});
  assert.equal(checked.clean,false); assert.ok(JSON.stringify(checked).includes('.codex/config.toml'));
});
test('ACCEPT proof: Git-dirty late paths are caught beyond the former 200-path batch',()=>{
  const f=fixture({vendors:['claude']});
  const rule=body=>'---\ntrigger: always\ntier: core\n---\n\n'+body+'\n';
  for(let i=0;i<215;i++) put(f.kit,`.agent/rules/probe-${String(i).padStart(3,'0')}.md`,rule('A'));
  first(f);
  const git=args=>execFileSync('git',args,{cwd:f.project,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  git(['init','-b','main']); git(['config','user.name','AgentKit Fixture']); git(['config','user.email','fixture@example.invalid']);
  git(['add','.']); git(['commit','-m','Fixture baseline']);
  put(f.kit,'.agent/rules/probe-214.md',rule('B')); first(f);
  assert.match(git(['status','--porcelain']),/probe-214\.md/);
  for(let i=0;i<215;i++) put(f.kit,`.agent/rules/probe-${String(i).padStart(3,'0')}.md`,rule('C'));
  const result=refusesWithoutEffects(f,()=>sync(f));
  assert.equal(result.reason,'git not clean on managed paths');
  assert.ok(result.dirty.some(line=>line.includes('probe-214.md')));
  assert.deepEqual(result.refusals,[],'hash conflicts must not substitute for the Git guard');
});
after(()=>console.log('Acceptance regression fixtures retained: '+root));

test('ACCEPT CLI: documented setup --bin-dir consumes the following path and creates its launcher',()=>{
  const bin=fs.mkdtempSync(path.join(root,'local bin '));
  const cli=fileURLToPath(new URL('./agentkit.mjs',import.meta.url));
  const r=spawnSync(process.execPath,[cli,'setup','--bin-dir',bin],{encoding:'utf8'});
  assert.equal(r.status,0,r.stdout+r.stderr);
  assert.equal(JSON.parse(r.stdout).ok,true);
  assert.ok(fs.existsSync(path.join(bin,process.platform==='win32'?'agentkit.cmd':'agentkit')));
});

test('ACCEPT CLI: changelog --title consumes its text and preserves source fragments',()=>{
  const f=fixture(); put(f.project,'CHANGELOG.md','# Changelog\n');
  put(f.project,'changelog.d/change.md','- Scoped fixture change.\n');
  const cli=fileURLToPath(new URL('./agentkit.mjs',import.meta.url));
  const r=spawnSync(process.execPath,[cli,'changelog-roll',f.project,'--title','Deliver a scoped change','--json'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stdout+r.stderr); assert.equal(JSON.parse(r.stdout).ok,true);
  assert.ok(read(f.project,'CHANGELOG.md').includes('Deliver a scoped change'));
  assert.equal(read(f.project,'changelog.d/change.md'),'- Scoped fixture change.\n');
});
test('ACCEPT CLI: missing changelog title reports a useful human refusal without mutation',()=>{
  const f=fixture(); put(f.project,'CHANGELOG.md','# Changelog\n');
  put(f.project,'changelog.d/change.md','- Scoped fixture change.\n');
  const before=snapshot(f.base), cli=fileURLToPath(new URL('./agentkit.mjs',import.meta.url));
  const r=spawnSync(process.execPath,[cli,'changelog-roll',f.project],{encoding:'utf8'});
  assert.equal(r.status,1); assert.match(r.stdout+r.stderr,/requires --title/);
  assert.deepEqual(snapshot(f.base),before);
});

const rawControlCases = [
  ['basic value DEL', 'model = "private-fixture-marker\x7f"\n'],
  ['literal value DEL', "model = 'private-fixture-marker\x7f'\n"],
  ['basic key DEL', '"private-fixture-marker\x7f" = "value"\n'],
  ['literal key DEL', "'private-fixture-marker\x7f' = 'value'\n"],
  ['full-line comment NUL', '# private-fixture-marker\x00\nmodel = "value"\n'],
  ['trailing comment NUL', 'model = "value" # private-fixture-marker\x00\n'],
  ['full-line comment DEL', '# private-fixture-marker\x7f\nmodel = "value"\n'],
  ['trailing comment DEL', 'model = "value" # private-fixture-marker\x7f\n'],
  ['value lower control', 'model = "private-fixture-marker\x08"\n'],
  ['bare carriage return', '# private-fixture-marker\rmodel = "value"\n'],
];
for(const [label,content] of rawControlCases) test(`ACCEPT-F6: ${label} refuses before publication`,()=>{
  const parsed=spawnSync(process.env.AGENTKIT_TEST_PYTHON||'python',
    ['-c','import sys,tomllib; tomllib.loads(sys.stdin.buffer.read().decode("utf-8"))'],{input:content,encoding:'utf8'});
  assert.equal(parsed.status,1,'independent parser must reject the malformed fixture');
  assert.match(parsed.stderr,/TOMLDecodeError/);
  const f=fixture({tools:['fixture']}); integration(f); put(f.project,'.codex/config.toml',content);
  const result=refusesWithoutEffects(f,()=>sync(f));
  assert.match(JSON.stringify(result),/TOML preflight at line \d+/);
  assert.ok(!JSON.stringify(result).includes('private-fixture-marker'),'diagnostic must redact source values');
});
for(const [label,content] of [
  ['escaped controls', 'model = "safe\\u007F\\u0000\\b\\f"\n'],
  ['tabs and CRLF', '# ordinary\tcomment\r\nmodel = "safe\tvalue" # trailing\tcomment\r\n'],
]) test(`ACCEPT-F6 control: ${label} remain valid through sync`,()=>{
  const expected=parseToml(content), f=fixture({tools:['fixture']}); integration(f);
  put(f.project,'.codex/config.toml',content); first(f);
  const result=parseToml(read(f.project,'.codex/config.toml'));
  assert.equal(result.model,expected.model);
  assert.equal(result.mcp_servers.fixture.command,'fixture-never-executed');
});
