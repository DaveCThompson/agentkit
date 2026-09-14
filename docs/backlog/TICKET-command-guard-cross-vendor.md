---
status: proposed
updated: 2026-09-14
priority: P1
---

# TICKET-command-guard-cross-vendor — Add a vendor-neutral destructive-command guard

## Decision needed

Accept or reject a clean-room implementation of a shared command-analysis engine with thin
registration adapters for Claude Code, OpenCode, Gemini CLI, and Codex. This ticket is a plan for
peer review. It does not install a dependency, change global client configuration, enable hooks in
another project, or execute a destructive command.

## Problem

AgentKit generates vendor surfaces, but it does not currently provide a common pre-execution safety
policy for shell commands. A dangerous command can therefore reach a client through a generated
hook, a nested shell, a platform-specific shell, or a vendor surface that is not covered by the
current Claude-only lifecycle hook.

The policy must be conservative around protected data while remaining portable. The four clients
do not expose the same hook model, matcher language, or approval semantics, so a shared policy
engine cannot rely on one vendor's configuration format.

## Research conclusion

The external reference supplied for this exploration was reviewed for ideas, but its license has a
special rider that prohibits use, disclosure, distribution, execution, testing, analysis, indexing,
or incorporation into automated systems by parties that include OpenAI. No code, dependency, or
implementation pattern from that repository is being copied or installed. The proposal below is an
independent design based on the vendor contracts and general security requirements.

The completed research synthesis found:

- One bounded policy engine can serve all four clients, but there is no single portable hook
  registration mechanism.
- Claude Code, Gemini CLI, and Codex can invoke a synchronous pre-tool command hook. OpenCode
  needs a JavaScript/TypeScript plugin bridge around its shell tool.
- The portable result is allow or deny. “Ask the user” cannot be the engine's cross-vendor
  contract because Codex `PreToolUse` does not support an ask decision. Vendor-native approvals
  remain available for commands the guard does not deny.
- A lexical substring denylist is insufficient. The engine must inspect shell structure, nested
  shells, inline interpreters, encoded payloads, redirections, pipelines, and platform path forms.
- Hook configuration is a guardrail, not an OS security boundary. A disabled, bypassed, stale, or
  untrusted hook must be visible in diagnostics, and high-value workspaces should still use least
  privilege and sandboxing.

Primary contracts reviewed:

- [Codex hooks](https://developers.openai.com/codex/hooks) — `PreToolUse`, `Bash`, Windows command
  overrides, hook trust, and deny output.
- [Gemini CLI hooks](https://geminicli.com/docs/hooks/) — lifecycle and tool hook registration.
- [OpenCode plugins](https://opencode.ai/docs/plugins/) — plugin lifecycle and tool interception.
- [Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) — pre-tool matching and
  hook decisions.
- [Reference repository license](https://raw.githubusercontent.com/Dicklesworthstone/destructive_command_guard/main/LICENSE)
  — the clean-room boundary for this work.

## Proposed security behavior

The first release should use this severity policy:

| Severity | Meaning | Initial action |
| --- | --- | --- |
| P0 | Clearly safe command and target | Allow |
| P1 | Suspicious or ordinary mutation outside a protected target | Allow and record a diagnostic; vendor-native approval may still apply |
| P2 | High-impact mutation or destructive VCS action against a protected or broad target | Deny |
| P3 | Catastrophic, malformed, opaque, or unparseable command | Deny |

The guard must not turn P2 or P3 into an approval prompt. A future break-glass path would need a
separate, auditable contract with explicit scope, expiry, and vendor-specific implementation. It
must never be an implicit “parser failed, so ask or allow” fallback.

Commands in the initial blocked class include:

- Recursive deletion, overwrite, permission changes, or process termination targeting `/`, a drive
  root, the home/profile directory, a UNC root, the project/worktree root, `.git`, AgentKit/vendor
  configuration, hook, or credential directories, or a user-configured protected path.
- Destructive VCS operations such as `git clean -fdx`, `git reset --hard`, force push, and broad
  history or reference deletion.
- Disk, volume, or filesystem destruction commands.
- Nested or composed commands that contain a blocked operation, including separators, pipelines,
  substitutions, subshells, `sh -c`, `bash -c`, `pwsh -Command`, `cmd /c`, inline Node/Python,
  heredocs, process substitution, and encoded PowerShell where the effective target cannot be
  proven safe.
- Commands whose input is malformed, exceeds parser limits, uses an unknown shell, has excessive
  nesting, times out, or produces an invalid decision response.

Safe text such as printing the literal string `rm -rf /` must remain P0. Ordinary file mutation
outside protected targets is not automatically treated as catastrophic; the existing vendor
permission system remains responsible for its normal approval policy.

## Proposed architecture

Keep the implementation flat unless a new boundary is proven necessary.

1. `command-guard.mjs` becomes the vendor-neutral, synchronous policy entry point. It reads one
   JSON request from stdin and writes one JSON decision to stdout. Diagnostics go to stderr. Exit
   code `0` means continue and exit code `2` means blocked. The engine has no shell execution,
   network access, package installation, or file mutation capability.
2. Normalize a bounded request containing `schemaVersion`, `vendor`, `event`, `tool`, `cwd`,
   `shellFamily`, `command`, `rawToolInput`, `permissionMode`, and `runInBackground`. Reject wrong
   types, missing required values, oversized input, and unexpected output rather than guessing.
3. Parse shell-aware structure and recursively inspect command-bearing wrappers. Normalize POSIX,
   Windows, UNC, Git Bash, WSL, drive-letter, case, tilde, environment-variable, junction, and
   equivalent path forms before comparing targets.
4. Resolve protected targets from the filesystem root, home/profile, drives/UNC, current project
   and worktree, `.git`, AgentKit and vendor configuration/hook/credential directories, and an
   explicit user-configured list. Keep target resolution separate from command classification so
   it can be tested independently.
5. Return a stable decision containing `action`, `severity`, `ruleId`, `reason`, and normalized
   targets. Rule IDs must be deterministic and suitable for diagnostics, tests, and future policy
   configuration.
6. Extend canonical `.agent/hooks.json` records with a stable contribution ID, event, matcher,
   command identity, timeout, Windows command override, and selected vendor list. Preserve
   ownership and retirement in `agentkit.mjs`; do not hand-edit `manifest.json` or
   `.agentkit.lock`.
7. Add thin adapters in `adapters.mjs`:

   - Claude Code: generate a `PreToolUse` hook for shell tools, including the Windows command
     override where applicable.
   - Codex: generate `.codex/hooks.json` `PreToolUse` coverage for `Bash` and the Windows command
     override. The generated hook returns the documented deny object on a block.
   - Gemini CLI: generate a `BeforeTool` hook for `run_shell_command` using the Gemini hook
     decision contract.
   - OpenCode: generate the plugin bridge that invokes the engine without going through a shell and
     rejects the tool call on deny or engine failure.

   Vendor selection remains explicit. Adding these vendors to a project's `.agentkit.json` is a
   separate project decision; the adapter must not silently expand the selected vendor set.

## Implementation phases

### Phase 0 — threat model and contract

- Confirm protected-target policy, P2/P3 deny default, parser limits, break-glass exclusion, and
  the exact vendor hook schemas.
- Record an accepted `governance/DECISION-command-guard-surface.md` only after peer review.
- Resolve whether a shell parser dependency is permitted. Do not install one as part of this plan;
  any new dependency needs its own license, maintenance, and supply-chain review.

### Phase 1 — standalone engine

- Implement `command-guard.mjs` and `command-guard.test.mjs` with no vendor registration.
- Cover safe literals, separators, pipelines, redirection, nested shells, inline interpreters,
  encoded/opaque payloads, protected target resolution, Windows/WSL aliases, limits, timeout, and
  malformed input.
- Use only harmless command strings and temporary disposable paths in tests. Never execute a
  destructive fixture.

### Phase 2 — canonical registration and adapters

- Extend `.agent/hooks.json`, `agentkit.mjs`, and `adapters.mjs` while preserving contribution
  ownership, borrowed records, lock state, and idempotent sync behavior.
- Add adapter and merge tests for all four vendors, including generated-path drift and a project
  selecting only a subset of vendors.
- Update the vendor capability matrix and the generated-surface documentation.

### Phase 3 — diagnostics and lifecycle proof

- Add `agentkit check` diagnostics for missing, disabled, stale, untrusted, malformed, or
  out-of-date guard registrations.
- Verify that a generated guard can fail closed when the engine is missing, times out, cannot parse,
  or returns invalid output.
- Run `npm test`, sync dry runs, drift checks, and the relevant generated-surface checks.

### Phase 4 — safe native smoke tests

- On disposable projects, exercise each vendor's hook with safe commands that print text, inspect
  status, and attempt blocked analysis without performing the blocked operation.
- Confirm the vendor-specific deny signal, diagnostics, and normal approval behavior for a benign
  mutation. Do not run a real destructive command to prove that a destructive command is blocked.
- Treat any native client or global configuration change as an explicit operator step, outside the
  implementation commit.

## Verification matrix

The acceptance suite must include these classes:

| Class | Expected result |
| --- | --- |
| Print a literal containing a dangerous string | Allow |
| `echo ok;` followed by a blocked operation | Deny |
| POSIX, PowerShell, `cmd`, Git Bash, WSL, and UNC protected roots | Deny |
| Project root, `.git`, AgentKit config, hook, credential, and configured protected paths | Deny |
| `git clean -fdx`, `git reset --hard`, and force push | Deny |
| Nested shell, inline interpreter, encoded payload, heredoc, or process substitution | Recursively inspect; deny if opaque or unsafe |
| Equivalent path aliases, mixed case, junctions, and drive forms | Same decision after normalization |
| Missing fields, malformed JSON, unknown shell, oversized input, deep nesting, timeout | Deny |
| Each vendor's generated registration and deny contract | Contract test passes |
| Repeated sync, lock/manifest ownership, and drift check | No unintended writes or drift |

## Permission and change boundary

For this ticket and its implementation review:

- Reading the reference material, editing this plan, running local tests, and committing the plan
  are local repository actions. They do not require a vendor permission prompt.
- Installing packages or binaries, modifying `C:\Users\davec\.codex`, Claude, Gemini, or OpenCode
  global configuration, changing another project, starting a native client, or running a native
  smoke test requires explicit operator approval at that phase.
- This commit does not enable a guard in any vendor. It only records the proposed design.
- Once implemented and selected for a project, the generated guard is intended to block P2/P3
  before tool execution. It will not ask for approval for those classes. P0/P1 commands continue
  through the vendor's normal permission model.
- No push, pull request, release, or external message is included.

## Open review questions

1. Is the P2/P3 deny default acceptable, given that the portable engine cannot request approval?
2. Which shell grammars and parser limits are required for the first release, and is a dependency
   allowed after license and supply-chain review?
3. Which vendor-generated plugin/config paths are stable enough to own in AgentKit today?
4. Should ordinary file deletion outside protected targets stay P1, or should a selected project
   promote it to P2 through policy configuration?
5. What operator-visible recovery path is required for a false positive without weakening the
   fail-closed default?

## Acceptance criteria

- A peer can clone the repository and review this plan without access to ignored local working
  documents.
- The accepted design has one policy engine and four thin adapters with explicit vendor selection.
- Dangerous protected-target, destructive-VCS, nested-shell, opaque-input, and parser-failure cases
  are denied before execution.
- Safe literals and benign commands are not blocked merely because they contain dangerous words.
- Hook ownership, lock/manifest generation, drift detection, and vendor-specific contracts are
  covered by tests before implementation is called complete.
- No dependency is installed, no global configuration is changed, and no destructive command is
  executed as part of this ticket's planning commit.

What we deliberately did NOT do

- We did not copy, install, execute, test, or adapt the supplied reference repository.
- We did not claim that hooks alone provide a complete security boundary.
- We did not choose a universal approval prompt that some vendors cannot represent.
- We did not enable hooks, modify global client settings, push changes, or run destructive commands.
