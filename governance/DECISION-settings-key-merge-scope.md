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

## Revisit trigger
RESOLVED 2026-07-10 (permissions.allow now owned). Next revisit only if a project needs kit-managed
`deny` or `defaultMode` — deliberately still deferred (a wrong `defaultMode` or `deny` is a
fail-open/lockout risk the owner must set consciously).
