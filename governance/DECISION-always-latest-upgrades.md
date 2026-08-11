---
status: accepted
applies-to:
  - "agentkit.mjs"
  - ".agentkit.json"
  - "CHANGELOG.md"
last-verified: 2026-07-03
---

# DECISION-always-latest-upgrades

**Status:** Accepted (Round 5, decision 33 — the maintainer's explicit pick)

## Context
Two upgrade postures were on the table: projects **always track kit HEAD** on sync, or projects pin to
**versioned releases** and upgrade deliberately. Deliberate versioning adds ceremony (choose a version,
run an upgrade) that, per this system's own survival test, gets skipped after weeks heads-down — and a
declared `kitVersion` sitting in `.agentkit.json` is dead weight if sync always converges anyway.

## Decision
**Always-latest.** `sync` always converges a project on kit HEAD; **`pins`** are the narrow exception
mechanism for freezing one file at an older version. `sync --dry-run` previews the incoming diff (the
upgrade UX — no separate "upgrade" command). Kit version semantics for the CHANGELOG: **patch** =
content fix to an existing asset · **minor** = new asset or behavior change · **major** = shape/contract
change requiring migration steps.

## Consequences
- No per-project version bookkeeping; `kitVersion` lives only in the committed `.agentkit.lock`, not in
  the intent file.
- `doctor` lists active pins so they don't silently rot; a pin is a visible, audited exception.
- Upgrading is boring and continuous, not an event — which is the point.

## Revisit trigger
A kit change ships a regression that always-latest propagates fleet-wide before anyone notices — would
prompt a staged-rollout or default-pin posture; `--dry-run` and the test suite are the current guards.
