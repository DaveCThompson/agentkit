---
name: vendor-capability-matrix
description: Generated vendor surfaces, supported adapter inputs, ownership and measured native proof limits.
last-verified: 2026-09-08
doc-urls: https://code.claude.com/docs/en/skills, https://developers.openai.com/codex/mcp, https://antigravity.google/docs, https://geminicli.com/docs/cli/skills/, https://opencode.ai/docs/mcp-servers/
---

# Vendor capability matrix

This table describes the kit's generation policy. It does not enumerate every native capability.
The evidence table separates observed discovery, parsed configuration and documentation support.
A date prompts rechecking the relevant source; age alone does not prove drift.

| Adapter | Generated files | Settings contributions | Current proof boundary |
| --- | --- | --- | --- |
| Claude | `.claude/skills`, `.claude/commands`, `.claude/agents`; always/glob rules in `.claude/rules`; model-decision rules as `rule-` skills; output styles in `.claude/output-styles` | Hooks, allow grants and allowlisted `vendorDefaults` scalars in `.claude/settings.json`; local MCP in `.mcp.json` | Pure output/schema checks and current docs. Native permission matching, menu behavior and whether Claude loads a generated output style are pending. |
| Codex | Standard skills and `wf-` workflow skills in `.agents/skills`; communication and delegation defaults in the root `AGENTS.md` managed block | Local MCP and allowlisted `vendorDefaults` keys in the `.codex/config.toml` managed block | Independent TOML semantics; isolated native Codex 0.153.4 project-config loading and skills/list discovery. Invocation/permission behavior pending. Project config applies only in a trusted project, and the kit cannot observe trust. |
| Gemini | Selected standard skills in `.gemini/skills` when Codex is absent; curated workflow commands in `.gemini/commands/*.toml` | No Gemini MCP or hook contribution in this adapter | Installed Gemini 0.42.0 skill loader and discovery manager exercised in isolated Windows fixtures. Interactive commands pending. |
| OpenCode | Standard skills in `.opencode/skills`; workflows in `.opencode/commands` | Create-if-absent `.opencode/package.json`; local MCP under `opencode.json` `mcp` | Pure output/schema checks and current docs. Native executable unavailable here. |
| Antigravity | None; retains canonical `.agent/` consumption policy | None | Canonical metadata checks only. Native behavior not reverified in this update. |

The CLI separately owns entry-point documents and combined plan validation. Root `AGENTS.md` and
the existing Claude/Gemini entry-point stubs remain its responsibility. No adapter emits a Codex hook
merely because Codex has a configuration file. Claude's paired workflow implementation skills remain
menu-hidden through `user-invocable: false`; native menu behavior remains unverified.

## Source and inverse contract

Every adapter file retains `rel` and `content`, and supplies `source` and `transform`.
`source` is the exact canonical `.agent/...` path supplied by the entry. Body citations never select it.

| Transform | Meaning | Adoption boundary |
| --- | --- | --- |
| `body-md` | One canonical Markdown body with native frontmatter filtering or synthesis | Only the body can change. Preserve canonical metadata bytes. Reject generated native metadata edits. Includes workflow-as-skill and rule-as-skill output. |
| `copy` | Single-source resource copy with deterministic header/EOL handling where applicable | Reverse the generated banner only. Preserve resource content and its own metadata. Text-copy contract, not binary certification. |
| `unsupported` | Native or composite representation without a supported inverse | Refuse adoption and identify the canonical source. Gemini command TOML uses this kind. |

Adapters reject invalid source paths, metadata types, routing names and duplicate source identities.
They validate emitted paths and native skill folder/name agreement. Output collisions use
case-insensitive path identity for portable generation. Fatal validation returns no files/settings.
The CLI also validates the complete combined plan, loaded ownership and actual filesystem targets.
Neither force nor a generated filename resolves a structural collision.

Native skill names use lowercase letters, digits and single hyphens, and fit 64 characters.
Native string metadata is quoted as YAML flow scalars. `_templates` is a reserved support directory.
Its `SKILL.md` explicitly says it is not a skill, so adapters omit that native entry point while
preserving its canonical source and copied resources. This does not remove a standard skill.

## Supported neutral MCP shape

The supported shape is a map from server name to a local stdio object. Names begin with an ASCII
letter/digit and otherwise use letters, digits, dots, underscores or hyphens. Prototype metaproperty
names are rejected. No type, remote URL, arbitrary nested options or native-only fields are accepted.
Unsupported input is an error, not a silently dropped field.

| Neutral field | Type | Native translation |
| --- | --- | --- |
| `command` | Required nonempty string without control characters | Claude/Codex executable string; first OpenCode command element |
| `args` | Optional string array without NUL | Claude/Codex args; remaining OpenCode command elements |
| `env` | Optional map from environment names to string values | Claude/Codex env; OpenCode environment |
| `enabled` | Optional boolean; default enabled | Codex/OpenCode boolean; false omits the Claude registration |

Environment names must be nonempty and contain neither equals signs nor control characters.
Values cannot contain NUL. Secret values are not required in fixtures or public evidence.
Retiring an omitted disabled Claude registration still uses the CLI's introduced/borrowed ownership
rules; omission is not permission to remove a user-owned server.

The CLI validates raw integration/config input before parsing can flatten or discard unsupported
nesting, then passes a correctly typed neutral object. Adapter validation cannot recover lost raw
information. Direct-object tests do not establish arbitrary YAML ingestion support.

Codex TOML quotes each server/environment key segment. Parent scalars precede child tables, preserving
args and enabled beside env regardless of input insertion order. OpenCode uses an explicit native
field allowlist, including type local, command argv and environment.

Codex merge preflight also checks project-owned text outside the managed block. Equivalent quoted,
dotted and inline server identities cannot bypass ownership checks. User text is preserved, not
rewritten. The current bounded reader supports single-line strings, numbers, booleans, arrays,
inline tables and ordinary tables. Multiline strings, date/time values and arrays of tables refuse
with a line-numbered unsupported-syntax message, even outside the block. Preserve those valid native
files for explicit reconciliation; this is a merge limitation, not a native Codex restriction.
Forbidden raw control characters, including DEL and bare carriage returns, refuse before writes
with redacted line-numbered errors. Valid escaped controls, tabs and CRLF remain supported.

Raw neutral MCP string positions reject unquoted boolean/null/numeric scalars. Quote a value such as
`"false"` when it is intentionally a literal string. Unsupported raw types are not coerced into strings.
See [Codex MCP](https://developers.openai.com/codex/mcp),
[Claude MCP](https://code.claude.com/docs/en/mcp),
[OpenCode local MCP](https://opencode.ai/docs/mcp-servers/) and
[TOML keys and tables](https://toml.io/en/v1.0.0).

## Permissions

The adapter emits Claude allow contributions. The CLI owns acquisition and retirement records.
Existing deny/default/trust policy remains user-owned. Named runner actions use a space before
the trailing wildcard. JS test/build scripts remain axis-gated; Python uses named pytest/ruff commands;
containers use compose ps, logs and config. These still depend on trusted project scripts and native
policy. They are not a sandbox or a guarantee that every accepted argument is read-only.

There is no default wildcard in the Node script position, manual orchestrator-lock deletion grant,
unsupported PowerShell tool-name grant, or worktree executable wildcard. Worktree root configuration
alone does not grant runners. Broad runners require explicit `permissions.extra` entries; no second
opt-in setting is added. `permissions.enabled: false` disables all kit allow contributions.

The portable launcher resolves a machine-local binding. The adapter has no attested executable
identity and grants no helper command automatically, including bare PATH-resolved agentkit.
Commands follow the user's prompt policy. No absolute machine path is embedded.
[Claude permission syntax](https://code.claude.com/docs/en/permissions) supports these command-boundary
wildcards. Native allowed/disallowed command matching remains pending.

## Gemini skill ownership and migration

Gemini 0.42.0 discovers trusted workspace skills in `.gemini/skills` and `.agents/skills`.
The shared alias wins for equal names. Its installed discovery manager loads the Gemini directory
first and the alias second; untrusted workspaces stop before either workspace directory.
This matches [Gemini discovery documentation](https://geminicli.com/docs/cli/skills/).

For Gemini-only selection, Gemini owns standard skill output under `.gemini/skills`. With Codex
selected, Codex owns `.agents/skills`; Gemini emits no duplicate standard skill copy. The body,
native metadata and resource content are identical between those standard-skill paths.
Combined Gemini discovery also sees Codex's `wf-` skills through the shared alias. Gemini continues
emitting its workflow commands; `gemini: false` suppresses that command only. It does not disable a
Codex workflow skill visible through shared discovery.

Removing Codex while retaining Gemini introduces Gemini skill copies and retires managed shared-alias
output. The CLI must check edited old aliases and new user-owned paths before writes. A retained
conflicting alias can shadow Gemini output; the coherent plan must refuse that conflict. The reverse
transition requires the same checks. Unmanaged aliases may affect discovery; adapter output checks
cannot certify every user's external skill collection.

## Evidence and pending lanes

| Evidence | Observed result | Limit |
| --- | --- | --- |
| Combined four-file suite, Windows Node 20.20.2, 22.19.0 and 24.19.0 after acceptance repairs | 317 tests pass on each runtime with zero skips, including independent TOML parsing and installed Gemini discovery | Windows runtime compatibility, not POSIX, CI execution or another computer's setup. |
| `node --test agentkit.adapters.test.mjs`, Windows Node 22.19.0, Python 3.13.7 | Direct output, fatal validation, permission-policy and independent tomllib assertions pass | Does not exercise CLI ownership or native permission matching. Python 3.11+ is a test prerequisite only. |
| Same suite with `AGENTKIT_TEST_GEMINI_BUNDLE` pointing to installed Gemini 0.42.0's exported SkillManager bundle | Trusted Gemini-only/combined/final Codex-removed layouts load the intended skill; alias precedence and untrusted exclusion pass; native YAML descriptions preserve meaning | Native library execution, not interactive invocation or planner-driven removal. No model or MCP server launched. |
| Isolated Windows Codex 0.153.4 `mcp list --json`, generated dotted server name with args/env/disabled state | Trusted project loads the exact fixture fields; untrusted project excludes them. The same trusted-loader assertion fails on the retained old adapter and passes on the candidate. | Child-only temporary home/config/state, disabled nonexistent fixture command. No model, login, server, real profile change or skill-discovery claim. |
| Isolated Windows Codex 0.153.4 app-server `skills/list`, protocol generated by that executable | Discovers the expected 71 operational plus 24 workflow skills with exact canonical names/descriptions and no errors. A malformed added skill produces a native YAML error while the 95 valid skills remain discoverable. | Temporary profile/project; no thread/turn or model request. Native discovery, not invocation or behavioral evaluation. The fixture app-server process is stopped after the probe. |
| Primary docs retrieved 2026-09-08 | Confirms cited MCP fields, TOML meanings, Claude matching syntax and Gemini discovery policy | Retrieval establishes documented support, not native acceptance. |

The optional native test reports a skip if its installed bundle path is absent. A skip is pending
proof. `AGENTKIT_TEST_PYTHON` selects the independent parser executable when python is not the right
local command. No production parser dependency is added.

The Codex probe uses a separate existing `CODEX_HOME` and explicit per-project trust. These are
documented configuration boundaries, not an assertion that all project settings load when untrusted.
See [advanced configuration](https://learn.chatgpt.com/docs/config-file/config-advanced) and
[environment variables](https://learn.chatgpt.com/docs/config-file/environment-variables).
The coordinator retains the probe, exact executable/source hashes and candidate/baseline results
with the local acceptance evidence; private fixture paths are not a distribution dependency.

Coordinator owns combined collisions, raw ingestion/dependency closure, retirement/conflicts,
test collection and final candidate proof. Native Claude/OpenCode loading, skill invocation,
native permission enforcement, Gemini interactive commands and POSIX remain pending. No second-computer,
cloud-hydration, power-loss or native parity claim follows from Windows fixtures.

Historical July/August documentation checks established the then-documented Claude rules/invocation
controls, OpenCode commands/MCP and entry-point policy. Their manual smoke checks were still pending.
This September update replaces the stale Gemini no-skills claim; it does not retroactively certify
those earlier runtime lanes.

## What we deliberately did NOT do

Adapters do not mutate native profiles, install clients, execute servers, run automatic setup or
grant broad runners. The coordinator separately exercised user-authorized local launcher setup
and project self-sync; those operations do not establish another computer's readiness.
No remote MCP portability, general inverse-transform framework or configurable discovery profiles.
No claim that historical native capability omissions still describe current products.
