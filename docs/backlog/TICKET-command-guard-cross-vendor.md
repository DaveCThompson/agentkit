---
status: in-progress
updated: 2026-09-14
priority: P1
---

# TICKET-command-guard-cross-vendor — Block destructive mistakes without interrupting routine work

## Outcome and current state

Add a small, deterministic shell-command guard shared by Claude Code, Codex, Gemini CLI and
OpenCode. Routine development must incur **zero new approval prompts**, zero routine notices and
no false blocks in the agreed workflow corpus. A recognized destructive command receives one
short denial explaining its target and a practical correction. Existing native permissions still
apply; this guard cannot remove prompts issued by the client or its host.

This plan follows the user's 2026-09-14 instruction to prioritize uninterrupted work.
The local candidate has received a parent repair pass. Required acceptance is not complete. Native
enforcement, activation and release remain pending per the matrix and handoff below. Retain this ticket as the
work identity.
The original proposal is recoverable at Git commit `54cb28b`.

The selected kit is version `1.2.0`, commit `54cb28b`. A fresh fetch on 2026-09-14 found no newer
`origin/main` commit. Recheck identity before implementation; a version alone does not identify
a consumer's installed content or its machine-local launcher.

## Implementation record — local candidate

The candidate adds `command-guard.mjs` and `command-guard-cli.mjs`, integrates the opt-in
`commandGuard` configuration with Claude, Codex, Gemini and OpenCode generation, and extends
settings ownership to compare complete hook groups. Neutral continuation emits no approval decision;
recognized protected, broad or unresolved destructive targets receive vendor-specific denial output.
The shipped default remains disabled. The OpenCode bridge is generated but its native executable and
native behavior are unverified locally. See `docs/working/REVIEW-command-guard-implementation.md`
for exact files, commands, results, measurements and remaining gates.

The repair closes reproduced parsing, target-resolution, protocol and ownership defects. Sync,
dry-run and quick check now reject enabled guard targets while native/launcher proof is pending.
The generated OpenCode factory consumes `output.args.command` only for the Bash tool. Its POSIX
bridge uses the portable bound launcher without interpolating command text. Its Windows branch
remains unsupported and neutral: direct launcher binding and actual shell identity still need
implementation and native proof before that combination can be admitted. No vendor is activated.
The previous worker's 12-test and latency results describe the superseded candidate, not this repair.

## Decisions

1. **Prevent recognizable accidents with bounded coverage.** Block known destructive operations
   with protected, broad or unresolved targets. Do not require proof that every program is safe.
   Arbitrary scripts, aliases, computed code, remote tools and direct file-edit tools remain outside
   complete coverage. This is a guardrail, not a sandbox or defense against a hostile agent.
2. **No new approval layer.** Never return `ask`, auto-approve a tool, change trust/sandbox policy,
   or turn an existing denial into approval. Allowed commands receive neutral continuation through
   native permissions.
3. **Distinguish uncertainty from destruction.** Deny a recognized destructive operation whose
   target cannot be resolved. An unsupported language, opaque ordinary script or guard runtime
   failure continues under native permissions. Report unsupported coverage in explicit diagnostics;
   never label it proved safe.
4. **One activation switch and a fixed policy.** Shipped default: disabled. An opting-in project
   writes `commandGuard: { enabled: true, protectedPaths: [] }`. Absence/false emits no registration.
   Activation requires completed native proof for every selected guard-target vendor on the
   platform. If one is unsupported, preflight refuses the enablement without writes. No severity tuning,
   policy language, exception-token service, daemon or command-by-command approvals.
5. **Explicit, reversible adoption.** Updating the kit must not silently activate protection or
   expand vendor selection. Retirement uses existing ownership records. Proved vendor/platform
   combinations may ship independently for projects selecting those combinations; others remain
   pending in this ticket. Do not retain latent enabled-but-skipped target vendors that activate on
   a later kit update. Adding a vendor to an enabled project is an explicit selection change whose
   dry-run shows the new registration. Antigravity is outside this ticket's four target vendors and
   must be reported as outside guard coverage, not silently certified.

The strongest objection is missed destruction inside unsupported programs. That residual risk is
real. Blanket denial of unknown syntax trades it for frequent workflow breakage and is rejected
for this brief. New detection rules need both a concrete missed case and nearby benign tests.
No parser dependency is selected for v1.

## Default behavior

| Operation | Result and boundary |
| --- | --- |
| Search, read, status, diff, tests, builds, package scripts, formatting, normal edits, commit, ordinary push | Continue silently through native permissions. Script contents are not certified. |
| Print, quote or search for dangerous command text | Continue; data is not an executable command position. |
| Delete an exact file or contained project subdirectory, including build/cache output | Continue when the destructive target is resolved and avoids protected data. A name such as `dist` is not a safety guarantee. |
| Clean one exact scratch directory under an established system temporary root | Continue after containment and protected-root checks, including the bounded create/cleanup forms below. Never allow deleting the temp root itself or a wildcard of its children. |
| Recursively remove the project/worktree root, its ancestor, a filesystem/drive/share root, or home itself | Deny equivalent path and wildcard-content forms too. An ordinary child write is not root replacement. |
| Delete or overwrite Git metadata, recognized credential stores or configured protected data | Deny direct filesystem operations. Normal Git operations are classified separately. |
| Edit agent/vendor configuration or hooks; normal kit sync | Continue. Deny wholesale recursive removal of those configuration trees, not normal maintenance. |
| `git reset --hard`, working-tree-wide restore/checkout, unbounded non-dry-run `git clean`, raw force push, push `--mirror` | Deny broad work loss or remote history replacement. Match command semantics, not substrings. |
| Git dry runs, path-scoped restore, contained path-scoped clean, ordinary branch deletion, `--force-with-lease` without stronger force flags | Continue under native permissions. A lease is conditional rewriting, not authorization or proof of no data loss. |
| Direct disk/volume formatting or wiping | Deny recognized executable forms, not words inside text or package-script names. |
| Recursive permission/ownership changes over roots; broad process-kill patterns | Deny recognized broad forms. Continue exact-process termination and local permission repair. |
| Recognized destructive operation with unresolved variable, glob, destination or effective directory | Deny with a concrete scoping correction, not an approval request. |
| Unsupported script/language/executable without a recognized destructive operation | Continue with unsupported coverage; no routine warning. |
| Missing launcher, malformed input, crash, timeout or invalid analyzer output | Best-effort neutral continuation where the bridge can run. Explicit readiness checks report degradation; never claim active protection. |

Protected data defaults are Git metadata and conventional credential stores such as SSH/cloud
credential directories. `protectedPaths` adds exact files or directory subtrees containing
irreplaceable data. Do not protect all home descendants or all repository children.
Validate `protectedPaths` as nonempty literal paths without globs: relative paths resolve from
the project root, absolute paths name explicit external data. Invalid entries refuse sync before
writes. Custom paths add protection; they do not remove built-in protected targets.

Recursive deletion outside the effective project requires explicit containment in the target
project or the bounded scratch-directory exception, or remains denied when broad/unresolved.
Scratch containment uses the actual platform temp root and resolved path components; a folder
name alone never grants it. No task-ownership database or cleanup-permit service is needed.
Exact ordinary file operations outside the project continue unless they hit protected data.
Resolve worktree roots separately from `cwd`.

Supported non-mutating modes take precedence over unresolved-target denial for that operation:
for example Git clean dry-run and PowerShell `Remove-Item -WhatIf`. Recognize modes per command;
an arbitrary `--help` token is not a universal exemption. Inspect other command segments and
redirections independently. `echo ok > protected-file` is still a write, and a dry-run first
segment cannot excuse destructive execution in a later segment.

A false-positive denial names a correction: resolve the path, narrow the pathspec, use a dry run,
or use conditional Git behavior where appropriate. An intentionally blocked broad action remains
an explicit operator action outside the guarded agent. Do not suggest hiding the command,
changing interpreters to evade detection, or automatically disabling the guard. Repeated false
positives require a rule correction and regression test. No break-glass system in v1.

## Implementation boundary and reuse

Use the existing Node runtime and flat module layout. No network, model call, package installation,
shell evaluation or command execution belongs in analysis.

| File | Planned responsibility |
| --- | --- |
| New `command-guard.mjs` | Pure analysis with injected bounded environment/path queries; stable rule IDs and decisions. |
| New `command-guard-cli.mjs` | Native payload normalization/output translation; read-only explain and capability modes. |
| `agentkit.mjs` | Guard dispatch and typed config; `mergeSettings`, `legacySettingsRecords`, `prepareSettings` retirement defaults, and lock-only `checkProject` reconstruction for new hook contributions. |
| `adapters.mjs` | Thin selected native registrations and generated OpenCode bridge; vendor differences remain here. |
| Canonical `.agent/hooks.json` | Named guard contribution and minimum semantic fields, preserving existing SessionStart records. |
| New `command-guard.test.mjs`, `command-guard-cli.test.mjs`; existing adapter/acceptance/platform/rollout tests | Behavior pairs, protocol and lifecycle proof at existing seams. |
| `package.json`, `CHANGELOG.md`, capability/migration docs, this ticket | Collect new tests, record release changes, document actual support and remaining proof. |

Normalized input contains command text, effective working directory, shell family and actual tool
identity. If a native payload omits shell family, use documented tool/platform context or mark
coverage unsupported. Do not assume POSIX on Windows. Do not carry unused permission-mode or
duplicate raw-input fields.

Analysis returns `{ action: 'continue' | 'deny', ruleId, reason, targets, coverage }`.
Coverage distinguishes supported, partial and unsupported analysis. Vendor exit codes belong to
the translation boundary; exit `2` does not have one universal meaning.

Reuse the portable launcher binding. The OpenCode bridge launches without a shell; standard native
hook launch strings contain only launcher identity and fixed flags, never interpolated analyzed
commands. Guard invocation must not compile the manifest, enumerate kit sources, sync or run checks.

Current source findings at `54cb28b`:

- `loadHooks` loads canonical registrations; the Claude adapter emits a `claude-hooks` action.
  Extend these seams rather than inventing another registry.
- The Claude settings merge constructs only event and command. The lock-only check path likewise
  reconstructs only those fields. Both must preserve matcher, timeout and supported launch fields.
- Compare the whole registration before borrowing or retiring it. An identical command under a
  different matcher is not equivalent coverage. The current `satisfied` predicate in the
  `claude-hooks` branch of `mergeSettings` compares only the inner hook object, ignoring its group
  matcher (`agentkit.mjs:1229` at the reviewed base). Preserve user hooks and policy.
- Add explicit Codex/Gemini hook merge kinds, with shared low-level operations only where their
  semantics match. `mergeSettings` refuses unknown kinds. `legacySettingsRecords` currently treats
  non-Claude JSON legacy keys as MCP entries; preserve unsupported legacy records as unresolved
  rather than discarding or misclassifying them. Fresh acquisition of unowned native hooks is a
  separate case and still uses whole-record equality.
- Update `prepareSettings`'s empty contribution shape for removal and `checkProject`'s lock-only
  reconstruction for both new kinds. Unknown reconstruction branches currently skip action creation;
  the resulting check can miss a problem or plan retirement/conflict, not reliably report one fixed
  verdict. Test retained, edited, borrowed and removed contributions with and without kit planning.
  Codex already owns MCP/default settings in `.codex/config.toml`; these are new hook-file surfaces,
  not its first settings integration.
- Keep old lock records readable, edited records conflicting, borrowed records preserved and
  ambiguous ownership unresolved. Reuse prepare/recovery machinery. No new settings store,
  lock, transaction journal or generated-file hand edits.

`containedPath` is a reuse reference for component and ancestor checks, not a drop-in command-target
resolver. It only accepts constrained relative kit paths, rejects backslashes and linked ancestors,
and validates existing path components; it does not resolve arbitrary shell operands or link targets.
Keep those sync invariants unchanged. Reuse suitable focused predicates/fixtures if their semantics
match; do not import the full CLI into analysis or generalize sync's strict path policy solely for
this feature. A small separate resolver is preferable to coupling incompatible policies.

### Bounded analysis

Recognize executable positions, quoting, comments, separators, pipelines and redirections in POSIX
shell, PowerShell and `cmd`. Unwrap literal shell commands and supported `env`/`sudo` prefixes
without executing them. Parse known destructive commands with their actual options and operands,
including executable paths, attached options, `--`, PowerShell aliases and literal-path forms.
The fixture table defines supported syntax; do not claim a complete shell parser.

"Recognized" requires established executable position, command identity and destructive semantics.
Suspicious tokens inside an unsupported heredoc, string or program do not meet that threshold.
Partial parsing must never turn unknown text into an executable destructive operation. Preserve
a proven denial in an independent understood segment even if another segment is unsupported.

Inspect literal substitutions and nested shell strings. Decode literal PowerShell encoded commands
within the same budget. Inline Node/Python recognition is deferred by default, including literal
deletion calls; it is not a v1 acceptance requirement. Arbitrary programs, sourced scripts,
package scripts and computed code are not interpreted.
Do not read script bodies recursively or classify dangerous words in ordinary text as commands.

Minimum v1 fixture families per shipped shell: POSIX `rm` and output redirection; PowerShell
`Remove-Item`/documented aliases and output writes; `cmd` `del`/`erase`, `rd`/`rmdir` and output
redirection. Each shipped shell also covers the supported Git cases in the behavior table and
platform-specific disk/root-permission/broad-kill command forms frozen in phase 1. Include ordinary
checkout/switch, branch `-d` versus forced `-D`, clean dry-run versus execution, combined force flags,
PowerShell `-WhatIf`, nested wrappers and data-only lookalikes. This table must be explicit before
engine coding, not left to ad hoc keyword additions.

For routine scratch cleanup, support literal strict-child temp paths and a narrowly recognized
same-invocation assignment from `mktemp -d`, provided the variable is not reassigned before deletion.
For PowerShell, support `New-Item -ItemType Directory` followed by cleanup of the same resolvable
literal temp-child path. Do not generalize these fixtures into arbitrary program evaluation.
Unresolved cross-invocation variables need a resolved operand; symlink/junction escape and a temp
directory that is itself a protected project/worktree root still deny.

Initial limits: 64 KiB native input, eight wrapper levels, 128 executable segments. Keep them
implementation constants. Limits produce unsupported coverage, not a claim of completed inspection;
a destructive operation already recognized with unresolved scope stays denied. Track bounded
`cd`, Git `-C` and resolvable local variable assignments. Unknown effective directories must not
make deletion appear contained.

Compare path components rather than prefixes. Resolve quoting, `.`/`..`, known environment/home
values, platform case rules, drive-relative paths, UNC and Git Bash/WSL aliases only where actual
environment evidence establishes their meaning. Read-only resolution of symlinks/junctions and
existing ancestors of missing leaves prevents simple containment mistakes. Inaccessible or ambiguous
targets remain unresolved for recognized destructive operations. Do not assume `/mnt/c` always
maps to a host drive. Filesystem changes between check and execution remain outside atomicity guarantees.

## Vendor delivery and evidence

At the reviewed commit, only Claude receives a kit SessionStart hook. The four command guards
below are planned. Freeze native client versions and payload fixtures before enabling each one.

| Vendor | Planned boundary | Required native proof |
| --- | --- | --- |
| Claude Code | Shared `.claude/settings.json`, `PreToolUse`, matcher `Bash\|PowerShell` | Both tool paths, neutral continuation, denial, project trust and Windows launch. Bash-only coverage misses PowerShell-only clients. |
| Codex | Project `.codex/hooks.json`, `PreToolUse`, documented `Bash` mapping and `commandWindows` | Actual desktop/Windows mapping, exact hook trust and project trust, denial/failure semantics. CLI docs do not prove desktop coverage. |
| Gemini CLI | `.gemini/settings.json`, `BeforeTool` for `run_shell_command` | Complete-record ownership, decision JSON, project-hook fingerprint/disabled state, PowerShell launch and timeout behavior. |
| OpenCode | Generated `.opencode/plugins/agentkit-command-guard.js`, `tool.execute.before` for `bash` | Native proof unavailable locally: no `opencode` command resolved in this review, consistent with the capability matrix. Release owner supplies a supported client/environment before activation; discovery, denial and launch proof remain pending. |

Path decision: use the documented project-local surfaces in this table. The parent previously
retrieved their vendor documentation; native schema/registration tests still gate each supported
client version. Config files are key/record merged; the OpenCode bridge alone is a generated owned
file. Do not claim ownership of entire native settings documents. A native incompatibility reopens
only that adapter's proposed path/shape with the integration owner; it does not require a new
cross-vendor framework or an unresolved global path decision.

Luna retrieved primary documentation on 2026-09-14; the parent also checked the cited hook/plugin
pages. These establish documented contracts, not installed-client behavior. Claude supports a
PowerShell launch selector, not Codex's `commandWindows` field. Codex documents continuing a tool
call when certain unsupported hook-output fields cause failure. Translate timeout units per vendor;
do not copy one native hook object into all four formats. Set a short finite watchdog, provisionally
one second where supported, instead of inheriting multi-minute defaults. Normal-latency gates below
remain stricter. If a native timeout itself causes repeated errors, that platform fails the pilot.

Native OpenCode wildcard permission rules were considered. They cannot express this shared
target-resolution and shell-composition policy, and would require owning permission policy that
the kit currently preserves. Retain the thin plugin for shared semantics; do not generate broad
`rm *` denials, catch-all asks or new allow grants. Native permissions remain the operator's layer.

A missing or broken hook may not stop execution. `agentkit check` can inspect registration bytes
and launcher/protocol readiness; it cannot infer native trust or invocation across every tool route.
Unknown activation remains unknown until a native probe establishes it. Some clients may surface
their own launch errors; no vendor-independent silence or fail-closed guarantee is implied.

First activation or a changed hook identity can require the client's native trust review. State
that once in setup; the zero-prompt requirement applies to routine operation after activation.
Do not bypass trust or keep changing hook bytes on unchanged syncs. Dry-run and explicit readiness
checks must list each selected vendor's configured/active/unsupported/unknown state. An enabled
project switch must never turn a missing combination into an apparent protection claim.

Do not add successful-command logs, transcripts, telemetry or environment capture. Explain mode
reports rule IDs, coverage and redacted targets. No background persistence is needed for v1.
An explicit readiness probe cannot establish that no intermittent failure occurred.

### Older-kit compatibility

At `54cb28b`, `validateConfig` accepts unknown top-level keys. A pre-guard CLI can ignore
`commandGuard` and report ordinary sync success. Neither a new warning nor a new minimum-version
field can retroactively make an already installed binary enforce it. No such guarantee is claimed.

Before activation, the integration owner must run proposed `agentkit guard --capabilities --json`
through the actual launcher in the invoking environment. Require success with a supported protocol
version and the selected vendor/platform coverage. Compare it with the selected checkout, then
preview/apply with that same compatible source and verify registration plus a harmless native deny
probe. Missing/unknown subcommand, malformed output or unsupported coverage fails activation proof.
This is an explicit setup/rebind check, not an additional process before every shell command.
In this review the current launcher returned exit 1 and general usage for that proposed capability
command, confirming it cannot pass the required success-and-JSON test. The full old-sync fixture
remains implementation proof; no consumer configuration was changed for this negative probe.

New supported setup/sync/check paths must enforce this capability contract for enablement and
report a mismatched binding. Guard entry itself checks the protocol it consumes. The release owner
records the first supported kit release; supported upgrades/rebindings repeat readiness checks.
Include an isolated old-CLI fixture demonstrating silent unknown-key acceptance and the capability
probe's rejection, so ordinary `check` success is never substituted for activation evidence.

Running an old CLI manually after activation remains outside that supported path: it may ignore
the switch or mishandle new records. Preserve coupled config/lock/generated state and use a
compatible kit for rollback. Do not add a general unknown-config warning system or version manager
to v1, and do not describe this operational compatibility gate as enforcement inside old binaries.

Primary contracts for verification:
[Claude hooks](https://code.claude.com/docs/en/hooks),
[Codex hooks](https://developers.openai.com/codex/hooks),
[Gemini hooks](https://geminicli.com/docs/hooks/),
[OpenCode plugins](https://opencode.ai/docs/plugins/).
No external guard repository, code, algorithm or dependency is reused.

## Implementation sequence and acceptance

1. **Contract fixtures and native probes — implementation owner.** Freeze the command/operand table
   and versioned native payload fixtures. Use harmless sentinels in disposable clients to establish
   continuation, denial and forced analyzer failure. A denied sentinel must never execute.
   Complete the verified vendor matrix before activation; never execute destructive fixtures.
2. **Standalone analyzer — engine owner.** Build analysis and CLI without registration. Pair each
   dangerous case with benign lookalikes. Cover paths, variables/directories, wrappers, resource
   limits and degraded coverage. Add tests to the explicit `package.json` test list.
3. **Generation and lifecycle — integration owner.** Add configuration, canonical selection and
   complete-record ownership. Cover legacy locks, mixed vendors, edited/borrowed settings,
   enable/disable, missing binding and interrupted sync. Test refusal of mixed unsupported
   enablement, support becoming available without latent activation, and explicit vendor additions.
   Test incompatible-launcher capability rejection and every new merge/reconstruction/retirement seam.
   Update capability/migration docs.
   Canonical content changes require changelog/version handling and generated self-sync.
4. **Workflow replay and pilot — integration owner.** Replay sanitized real Windows/POSIX workflows
   through analysis only. Include searches, pipelines, PowerShell multiline scripts, build/test,
   local cleanup, worktrees, scoped restore and kit sync. Zero added prompts, routine notices and
   false blocks are gates. Add harmless live probes for every enabled vendor/platform combination.
5. **Delivery — release owner.** Run `npm test` on the final candidate, scoped sync dry runs,
   drift checks and native probes. Ship only proved combinations. Pilot an explicitly selected
   project before wider activation. Preserve all remaining vendor/platform proof here.

### Performance budget and measured baseline

The original 100 ms end-to-end gate is superseded. The supplied Opus review measured launcher p95
at 181.9 ms. A parent rerun on Windows / Node 22.19.0 / kit code `54cb28b` found:

| Invocation | n | Mean ms | p50 ms | p95 ms | Max ms |
| --- | --- | --- | --- | --- | --- |
| `node -e "0"` | 30 | 64.0 | 60.6 | 80.7 | 82.7 |
| `node agentkit.mjs --version` | 30 | 98.1 | 92.7 | 123.7 | 125.9 |
| Existing `agentkit --version` launcher | 30 | 153.1 | 152.5 | 184.9 | 188.3 |

Method: sequential invocations from PowerShell, Stopwatch around each command, output discarded,
every exit checked, nearest-rank percentiles. Each invocation starts a process; this is not a
machine-reboot/cold-filesystem measurement. The launcher was confirmed to be the `.cmd` shim bound
to this checkout. These small samples establish the startup issue, not native hook timing or the
minimum achievable latency of every integration. Raw samples were not retained.

Selected v1 gates on the pilot machine, measured with at least 200 invocations per shipped
shell/platform and repeated after material launcher changes:

- Measure the actual bridge plus a no-op analyzer first. Run an interleaved real-analyzer comparison
  on the same corpus/environment. Mean incremental analysis overhead must be at most 20 ms;
  the increase in p95 at most 25 ms; analyzer CPU p95 at most 10 ms.
- Full guard overhead against native execution without the guard must have p95 at most 250 ms.
  Total added serial wall time for the 200-command routine replay must be at most **35 seconds**
  (175 ms mean). This explicitly accepts a small per-command startup cost; it is not zero latency.
- Report mean, p50/p95/p99/max, no-op baseline, aggregate and run ordering. Gate on native bridge
  measurements, not CLI `--version` as a proxy. Count shell invocations, not all tool calls; do not
  multiply p95 by command count and present that as an expected session duration.

These are chosen budgets, not passing implementation evidence. The observed launcher mean alone
would cost about 30.6 seconds across 200 serial launches. Eliminate redundant shell/process hops
where native APIs permit while preserving portable binding and ownership; avoid eager full-kit
loading. Do not introduce a daemon or native binary solely to chase the superseded 100 ms number.
If the real pilot exceeds these limits, optimize the invocation path or defer that combination's
activation rather than quietly increasing the budget. Routine prompts/notices/false blocks remain zero.

Pending acceptance: dangerous/benign pairs, zero-friction corpus, complete ownership lifecycle,
latency and native deny/continue probes for the shipped matrix. Unit tests do not prove native
enforcement. Unknown activation blocks that combination's activation claim. The release owner
retains remaining lanes and owners rather than calling all four vendors complete.

Recovery is a scoped disable and ordinary sync after reviewing exact owned removals. Preserve
edited/borrowed contributions and user configuration. Rollback restores coupled config, generated
files and completed lock through the existing migration procedure. It does not restore lost data.

Separate project reconciliation is independent of this feature. Project-specific review findings
stay in the project's local work records, not in public kit documents.

## Planning verification

Reviewed canonical hooks, adapter dispatch, ownership and lock-only reconstruction at `54cb28b`.
Mechanical KB routing found governing documents for the implementation paths. Luna supplied a
documentation review. Planning edits require diff/reference checks; native behavior, timing and
protection remain unverified until implementation.

Astra reviewed the revised draft and returned **Adapt**. Incorporated all five findings: bounded
scratch cleanup, an executable-evidence threshold, command-specific dry-run precedence, no latent
vendor activation, and deferred inline-language analysis. Source/ownership reuse and the deliberate
low-friction coverage tradeoff were supported. The parent checked these dispositions against the
final text; they are planning evidence, not implementation acceptance.

The Luna/Astra originals are session tool messages, not repository review artifacts. The summaries
above are retained dispositions, not links to a reproducible independent report. The supplied Opus
review likewise came through a local attachment; its findings and the parent's checks are recorded
below without publishing that attachment or private machine/project identifiers.

### Opus review disposition

| Finding | Final decision and evidence |
| --- | --- |
| 1. 100 ms gate infeasible | **Adapt.** Reproduced startup above budget on this path; replace it with measured-baseline, analyzer and aggregate budgets above. This does not prove all alternative paths infeasible, and p95 times invocation count is not expected total time. |
| 2. Project name in public plan | **Adopt.** Remove project identity. Public plan scope is sufficient reason; no additional confidentiality determination or user decision is needed. |
| 3. Settings integration understated | **Adopt with corrections.** Name new merge kinds, legacy handling, retirement defaults and lock-only reconstruction. Codex already has settings contributions, and an unhandled check branch need not produce perpetual `SETTINGS-STALE`. |
| 4. Old CLI ignores switch | **Adapt.** Hazard confirmed in `validateConfig`; neither proposed new-field fix retrofits old executables. Require capability proof on the selected launcher, document unsupported old-CLI use and test the negative case. |
| 5. Native paths left unanswered | **Clarify.** Adopt the documented project-local paths above; installed-client proof remains the integration owner's per-vendor activation gate. Proposed location and native verification are different questions. |
| 6. OpenCode unavailable | **Adopt.** No executable found on this shell's PATH; native lane stays pending until the release owner supplies its environment. This is not evidence of absence everywhere. |
| 7. Reviews lack artifacts | **Adopt the disclosure option.** Identify session-only provenance and preserve dispositions here. No duplicate review document is required. |
| 8. Opt-in example ambiguous | **Adopt.** State disabled as shipped default and label the example as project opt-in. |
| Containment reuse note | **Adapt.** Reuse appropriate predicates/fixtures; do not force arbitrary shell targets through sync's strict relative-path policy or claim it already resolves link targets. |
| Matcher source citation | **Adopt.** Identify `mergeSettings`'s inner-hook equality predicate and whole-group equality proof. |

The user delegated final direction for this pass. No further approval question is needed to make
these planning corrections. Implementation, native acceptance and publication remain separate work.

## What we deliberately did NOT do

- Build a universal shell/interpreter analyzer, framework, daemon or exception service.
- Retain blanket denial of opaque syntax or guard failure; this is an explicit tradeoff following
  the user's current requirement for uninterrupted ordinary work.
- Claim coverage for direct editing, MCP actions, arbitrary script bodies or malicious tampering,
  or weaken native permissions to manufacture a no-prompt result.
- Implement/enable the guard, sync another project, modify global policy, execute destructive
  fixtures, commit or publish this planning work.
