---
status: accepted
applies-to:
  - ".agentkit.lock"
  - ".agentkit.json"
  - "agentkit.mjs"
last-verified: 2026-07-03
---

# DECISION-lockfile-state-model

**Status:** Accepted (Round 5, decision 25 — committed-file + git-guard added Round 6, decisions 36–37)

## Context
Telling STALE (kit moved ahead) from LOCALLY-EDITED (project changed a core file) needs **three**
hashes per file: kit-current, as-shipped-at-last-sync, and project-current. Storing only `kitVersion`
in `.agentkit.json` supplies two, so `check` cannot distinguish the states — and cannot detect the
**normal** case after weeks heads-down in one project: **CONFLICT** (kit moved ahead AND the project
edited the file). mtime can't stand in for the missing hash because cloud-synced churns mtime constantly.

## Decision
`sync` writes a per-project **`.agentkit.lock`** — per-file shipped hash + kitVersion +
first-detected-edit date — and **commits it** (it's the shipped-state record; CONFLICT detection and
clone-rebind triage need it in history). `check` gains a fourth verdict, **CONFLICT**, resolved via a
3-way diff whose base comes from the kit repo's git history at the lockfile's kitVersion tag. **All**
date/staleness/recency logic reads the lockfile or git history, **never mtime.** `.agentkit.json`
becomes **pure intent** (vendors/stack/tools/overlay/pins); shipped state lives only in the lock.

## Consequences
- `check`'s verdict set is in-sync / STALE / LOCALLY-EDITED / CONFLICT — the last being the one every
  guarantee in the system leans on after a real heads-down stretch.
- `sync` requires clean git status on the paths it touches (or `--force`), so every sync is trivially
  revertible — a permanent invariant, not just a Phase-E precondition.
- The >7-day flowback nag, `inventory`'s recency tiebreaker, and conflict-copy handling all read the
  lock/git, immunizing them from cloud-synced mtime churn.
- Declaration (`.agentkit.json`) and state (`.agentkit.lock`) are one file each — no field lives in two
  places.

## Revisit trigger
Lockfile merge conflicts become common enough in normal git flow to be painful — would prompt a
different shipped-state encoding, but the three-hash requirement itself is fixed.
