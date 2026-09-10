---
status: accepted
applies-to:
  - ".claude/settings.json"
  - ".mcp.json"
  - ".codex/config.toml"
  - "adapters.mjs"
  - "agentkit.mjs"
last-verified: 2026-07-10
---

# DECISION-settings-key-merge-scope

**Status:** Accepted (Round 2 decision 13 + Round 3 decision 16 + Round 4 2026-07-10: permissions.allow baseline)

## Context
Tool-aware skills need their dependencies actually registered (hooks so the drift-check installs
itself; MCP servers so the tools the skills lean on exist). But vendor settings files are also full of
**project-owned** keys — permissions, memory, personal config — that the kit has no business owning.
Owning the whole settings file would clobber project intent; owning nothing would leave tool-aware
skills broken (a skill requiring an unregistered tool is a broken skill).

## Decision
`sync` owns, via key-level merge that never clobbers project-owned keys:
1. **hook registrations** (`hooks`) and **MCP server config** (`.mcp.json` / for Codex,
   `.codex/config.toml`, decision 41);
2. **`permissions.allow`** — a kit-managed baseline of prompt-friendly, portable allow entries
   (Round 4, 2026-07-10; resolves the revisit trigger below).

The `permissions.allow` merge is a **non-destructive union**: kit baseline entries are added and
stale kit entries pruned, while every user-added `allow` entry is preserved. Ownership is scoped to
`allow` **only** — sync still **never** writes `defaultMode`, `permissions.deny`,
`trustedDirectories`, or Claude memory files (those stay project/overlay-owned). The baseline ships
only portable, project-relative patterns (gate/test runners, kit helpers, safe read-only utilities,
worktree wildcards derived from `.agentkit.json` `permissions.worktreeRoot`) and **excludes** every
outward-facing / arbitrary-exec grant (`git push`, broad `rm`, `Stop-Process`, external `curl`,
`powershell -Command "<str>"`, bare `Bash(node *)`) per `pattern-external-mutation.md`. A project
opts out with `"permissions": { "enabled": false }` and extends via `permissions.extra`.

WHY the change: four 2026-07-10 permission-prompt audits showed the residual prompts are structural,
and that an unmanaged permissions surface is where drift hides — a stale over-broad copy
(`Bash(*)` + `bypassPermissions`) sat unnoticed in a kit-adjacent settings file precisely because
the kit policed everything around it *except* permissions.

## Consequences
- Key-merge tags the keys it writes so vendor/skill removal is **reversible** (orphaned hook/MCP keys
  don't keep firing); the permissions union tracks its baseline entries in the lock the same way, so
  a shrunk baseline prunes only kit entries.
- The test suite must prove key-merge preserves unknown (project-owned) keys AND that the permissions
  union preserves user `allow` entries while pruning stale kit ones — golden Phase-0 tests.
- `check --hygiene` now flags settings drift the kit previously ignored: fossilized one-off
  `allow` entries, over-broad grants, a `defaultMode` cascade (local shadowing project), and a
  `trustedDirectories` pointing at another repo (report-only).
- Still off-limits to `sync`: `defaultMode`, `deny`, `trustedDirectories`, memory. That narrower
  boundary is the live gate, not an oversight.

## Amendment 2026-09-10 — vendorDefaults scalar keys

`sync` additionally owns a **closed allowlist** of scalar preference keys, declared per project in
`.agentkit.json` `vendorDefaults` and default-off. The allowlist lives in `adapters.mjs`
(`VENDOR_DEFAULT_KEYS`); a key outside it is refused with a typed error, never passed through.

The boundary is **authority**, not file location or convenience:

| Class | Owned | Reason |
| --- | --- | --- |
| Tone and format (`outputStyle`) | Yes | Changes how output reads. No authority effect. |
| Model, reasoning effort, subagent wait window | Yes | Cost, quality and latency. Reversible, and visible in every response. |
| Claude `defaultMode`, `permissions.deny`, `trustedDirectories` | **No** | Unchanged from the original decision. |
| Codex approval policy, sandbox mode, trust level | **No** | Same authority class. A wrong value is a lockout or a fail-open. |
| Tool-existence keys (`agents.enabled`, `wait_agent_enabled`, `expose_spawn_agent_model_overrides`) | **No** | These change which tools exist rather than how they behave, which sits closer to authority than to tuning. |

Three Codex keys were considered and deliberately excluded on their own merits, not by class:
`subagent_developer_instructions` **overrides** a subagent's inherited developer instructions and
reaches only subagents without role-specific instructions — replacing an entire instruction layer to
add one rule is disproportionate; `agents.max_depth` is documented "Ignored by V2", so owning it
would imply an enforcement the kit cannot deliver; `max_concurrent_threads_per_session` exists in two
schema definitions and one neutral name cannot address both unambiguously.

**Targets.** Claude uses the SHARED `.claude/settings.json`, never `settings.local.json` — Claude Code
adds the local file to the global git excludes the first time it writes it, so a value there reaches
no teammate and no other machine, and it outranks the shared file, so writing there would silently
override someone's own choice. Both `outputStyle` and `model` carry scope `Any file` in the settings
index, which was checked specifically because keys scoped `User, local, or managed` never apply from
a repository file. Codex uses the existing `.codex/config.toml` managed block.

**Ownership models differ by vendor and are not interchangeable.** Claude JSON keys use the per-key
introduced/borrowed/conflict contract from `mirror-contract.md`. The Codex TOML block is owned whole:
a key or table the project already declares refuses rather than borrowing, because TOML cannot
declare the same key twice. Per-key TOML borrowing would need a key-level editor and is deferred.

**Codex project config applies only in a trusted project.** Codex ignores project `.codex/` layers
when the project is untrusted. `check` keeps reporting generated-state agreement, which is what it
can observe; it gains no permanent unverified-in-effect status, because a status that is always
unverified carries no information. The condition is documented for the config author instead.

## Revisit trigger
RESOLVED 2026-07-10 (permissions.allow now owned). RESOLVED 2026-09-10 (vendorDefaults allowlist).
Next revisit only if a project needs kit-managed `deny`, `defaultMode`, a Codex approval/sandbox key,
or a tool-existence key — all deliberately still deferred, because a wrong value in any of them is a
fail-open or lockout risk the owner must set consciously.
