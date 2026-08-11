---
status: accepted
applies-to:
  - "fleet.json"
  - "agentkit.mjs"
last-verified: 2026-07-03
---

# DECISION-cloud-sync-stay-mitigated

**Status:** Accepted (Round 5, decision 30 — staff-review recommendation, maintainer-delegated)

## Context
The whole fleet lives on a cloud-synced path, and that sync platform was the villain behind
junction-flattening. The tempting fix is to move active repos to a non-synced path (e.g. a plain
`<repo root>` on local disk) with git as the sync mechanism — it would kill the root-cause class
permanently. But moving to **generated real files** already killed junction-flattening, and
stacking a second fleet-wide migration in the middle of this consolidation is precisely how
attempt #4 dies the old way.

## Decision
**Stay on the cloud-synced path for v1, mitigated.** Residual sync hazards get the mechanical
mitigations the kit needs anyway: `doctor` detects sync-conflict-copy filenames (`*-DESKTOP-*`),
Phase E pins `.agent/` + vendor dirs "Always keep on this device" per project, and **nothing reads
mtime** (see `DECISION-lockfile-state-model.md`). Move-out is not shelved — it is an **explicit
post-pilot revisit** with a real trigger, not an open-ended maybe.

## Consequences
- No second migration competes with the consolidation for attention or risk budget.
- The mitigations (`doctor` conflict-copy detection, lockfile-not-mtime, pin-on-device) are useful
  regardless of where the fleet eventually lives.

## Revisit trigger
After the pilot, review `doctor`'s **observed** conflict-copy and Files-On-Demand hydration data.
If the residuals are material, move the fleet to a non-synced path with git as sync/backup —
overturnable at a gate either way.