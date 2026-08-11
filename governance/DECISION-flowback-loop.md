---
status: accepted
applies-to:
  - "agentkit.mjs"
  - ".agent/skills/kit-contribute/**"
  - ".agent/workflows/*wrap-up*"
last-verified: 2026-07-03
---

# DECISION-flowback-loop

**Status:** Accepted (Round 2, decision 7 — reverse-guard added Round 5, decision 26)

## Context
Three prior consolidation attempts died from the **same** cause: improvements made inside a project
never flowed back to a shared home, so the kit rotted while projects drifted. Distribution
(kit → project) was always solved; contribution (project → kit) was left as "manually copy the file,"
which is exactly the step history proves gets skipped. This is *the* reason attempt #4 would survive
or die.

## Decision
Ship BOTH halves of the loop in v1: an **`agentkit adopt`** CLI verb (mechanical copy-back +
manifest update + kit CHANGELOG entry with provenance) and a **`kit-contribute`** core skill that runs
at wrap-up, judges each locally-edited core file (generalize → adopt · project-specific → overlay ·
noise → discard), and absorbs `pattern-codify`'s codify-at-session-end role so one brain decides
rule-vs-skill-vs-kit-vs-overlay. A session-start staleness nag surfaces core files edited >7 days ago.

## Consequences
- A core-skill edit made in any project lands in the kit or becomes overlay **within one session** —
  a live loop, not a clean snapshot. This is a "done stays done" invariant, not a ritual.
- `adopt` carries the reverse clobber guard: it refuses when kit-current ≠ the lockfile's shipped hash
  (another project adopted first, or the kit moved) and drops into the 3-way merge path — the loop's
  only data-loss path, closed.
- `health-agent` is **rewritten** around `check`/`doctor`; its old "sync by copying" body bypasses the
  manifest and is harmful post-migration.

## Revisit trigger
The flowback queue chronically backs up (adopts deferred and never resolved), meaning the wrap-up
judgment is too heavy and needs to be cheaper or more automated.
