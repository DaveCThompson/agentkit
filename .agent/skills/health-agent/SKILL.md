---
name: health-agent
description: Diagnose the health of the agent system itself — drift between kit, .agent sources, and generated vendor surfaces; tool reachability; config accuracy. Use when something about skills/rules/commands seems stale, missing, or inconsistent.
tier: core
triggers: [agent health, drift, stale skills, vendor mismatch]
required-tools: []
---

# Health Agent

Diagnose (never hand-fix) the agent system. All state questions are answered by the agentkit CLI —
its path is in the SessionStart hook command in `.claude/settings.json`.

## When to Use
- A skill/command behaves as if it's an old version, or a vendor can't see an asset.
- After pulling, cloning, or long-gap returns to the project.
- `doctor` nagged, or the session-start `check --quick` reported drift.

## Approach

### Phase 1: Mechanical status (never eyeball trees)
- [ ] `agentkit check . --json` — the 4-state verdict per file: IN-SYNC / STALE / LOCALLY-EDITED /
      CONFLICT (+ NEW / ORPHAN / UNTRACKED-DIFFERS). This covers BOTH layers: `.agent/` sources and
      generated vendor files.
- [ ] `agentkit doctor --json` (fleet-wide) when the question is bigger than this project: tool
      callability, cloud-synced conflict-copies, governed-doc staleness, pins, flowback queue.

### Phase 2: Interpret → route (the remediation map)
| Verdict | Meaning | Action |
|---|---|---|
| STALE | kit moved ahead | `agentkit sync . --dry-run`, review, then `sync` |
| LOCALLY-EDITED | project changed a kit-owned file | route through `kit-contribute` (adopt / overlay / discard) |
| CONFLICT | both moved | 3-way merge using the printed base, then adopt or sync |
| ORPHAN | asset left the selection | `sync` prunes it (refuses if edited — then kit-contribute) |
| UNTRACKED-DIFFERS | pre-migration or hand-made file at a managed path | adjudicate: adopt or delete, then `sync --force` for that path |
| tool UNREACHABLE (doctor) | declared tool not callable | provision per `integrations/<tool>.md`, or remove it from `.agentkit.json` tools |

### Phase 3: Config accuracy
- [ ] `.agentkit.json` still matches reality: vendors actually used, `stack` matches package.json
      dependencies (a declared tech pack with no matching dependency is dead weight — flag it),
      overlay globs cover every `domain-*`/`project-*` asset.
- [ ] AGENTS.md's wiring claims match reality (no "junction-linked" language — surfaces are
      generated files).

## Definition of Done
A written status: verdict counts, each non-IN-SYNC file with its routed action, tool status, and
config accuracy notes. Fixes happen through `sync`/`adopt`/`kit-contribute` — **never by copying
files between directories by hand** (that was this skill's old body, and it is how the fleet
rotted).
