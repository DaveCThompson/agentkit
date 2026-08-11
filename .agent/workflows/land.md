---
description: Land the session on origin/main — wrap-up + changelog, backlog/working archived clean, READMEs + status current with next steps, worktrees and merged branches closed, ff-merge pushed.
skill: implement-session-land
---

# Land Workflow

The terminal step of the session lifecycle: `onboard` → `plan` → `build` → `ship` (one ticket) →
**`land`** (the whole session onto `origin/main`, clean and clear).

## Goal
`origin/main` carries the session's work; `docs/working/` and `docs/backlog/` hold only active
docs; changelog and status-of-record are correct; next steps are visible in the READMEs; no stale
worktrees or unexplained merged feature branches remain.

## Inputs required (ask if missing)
- None (global finalization). Optional: whether to delete the remote session branch after merge.

## Skill routing (explicit)
- `implement-session-land` — drives the whole protocol.
- `implement-session-wrap-up` — invoked by it for the gate/changelog/codify tier.

## Procedure
1. **Load skill**: Read `implement-session-land`'s `SKILL.md` and follow its phases in order:
   preconditions → wrap (gate + changelog + version) → docs deep-clean (premise sweep, archive,
   status-of-record, README next-steps) → worktree and merged-branch closure → ff-land on main →
   push → authorized remote cleanup → report.
2. **Fail-closed points**: uncommitted session work, a red gate, or true main-divergence each STOP
   the landing — they are never worked around inline.

## Notes
- `ship` ends with a ticket done on a branch; `land` is how branches become `origin/main`.
- Foreign dirt in a shared tree is named and left alone — landing commits are pathspec-only.
