---
name: orchestrate-merge-train
description: Integrate eligible worker outputs sequentially against an accumulated candidate, with dependency admission and focused proof between changes. Use when a parallel wave is ready for integration or a halted train must resume.
tier: core
---

# Orchestrate Merge Train

Admit exact worker outputs, integrate one at a time, then verify the final candidate. Publication
is a separate authorized effect. Shared contracts live in `pattern-agent-orchestration.md`
§§2–6; `foundation-testing.md` owns proof and `git-protocol.md` owns integration mechanics.

## When to Use

Use for completed worker outputs or a resumed partial train. A solo branch normally uses
`implement-session-land` or the ordinary Git integration path. Preparation-only requests return
an admission/order proposal without changing refs, locks, boards, or remote state.

## Approach

### Phase 1: Authority, identity, and ownership

Confirm the coordinator/integrator role under kernel §1 and the requested integration/publication
targets and existing grants. Local integration does not require push capability. Resolve the selected
base/target and actual local candidate; retain the observed remote identity separately.

Consume the caller's coordination context under kernel §§4–6. Borrow its acquisition without
reacquiring or releasing it. A standalone owner acquires with a fresh UUID and retains that ID
across composed calls; foreign/legacy ownership requires reconciliation, not unowned release.
A declared supported waiver remains explicit.

Reconcile active writers and dirty state. Pause shared-tree authors before capturing combined output
and proof. Preserve unrelated work and mixed ownership; isolate integration when necessary instead
of staging foreign content. On resume, read prior admitted outputs, current refs, completed effects,
remaining lanes, and active attempts before doing anything again.

### Phase 2: Order the train and admit outputs

For each reported output:

1. Match accepted assignment revision, active attempt, accessible output identity, and report.
   Exclude interim, cancelled, stale, and blocked attempts. A partial subset needs an explicit
   accepted scope revision and preserved remainder before it becomes eligible.
2. Pin the reported commit/content. If a named branch tip moved, inspect the new delta and obtain
   current acceptance/evidence rather than merging the name on stale proof. Shared-tree output
   uses attributed file identities; it is already in the candidate and is not merged again.
3. Re-scan actual writes, future/removed/renamed paths, semantic contracts, and completion artifacts
   against the recorded worker start and current accumulated candidate. Do not substitute fetched
   remote main for local cars already integrated.
4. Compare resource claims and `Reserves` with actual candidate state. Verify claimed values
   exist where required and do not conflict. A path-clean merge does not prove resource safety.
5. Consume explicit `Depends`, recorded `must-precede`, and behavioral prerequisite evidence.
   Verify accepted producer output/contracts are present in the candidate before admitting a
   consumer. A status label or earlier wave number is insufficient. Defer unmet/external
   prerequisites; retain their evidence and owner.
6. Inspect every required proof lane and its gated transition. Pending acceptance blocks
   integration by default under `foundation-testing.md`; an explicit later-transition policy
   permits only that bounded exception and never closes the check.

Order eligible outputs by hard dependencies, then prefer lower overlap with waiting outputs,
breaking equivalent priorities by exact ticket filename. A surprise overlap requires ownership and
compatibility reconciliation, not merely a note to expect a conflict.

### Phase 3: Integrate one car

Integrate the exact accepted output using the project's authorized merge convention. Recheck its
identity immediately before changing refs. For shared authoring, reconcile the attributed delta
into the coordinator-owned candidate instead of inventing worker commits.

A conflict halts the train. Preserve files, both sides, current refs, and a recommended resolution.
Follow `git-protocol.md` and any existing scoped resolution authority; do not choose a side
wholesale, reset the tree, or treat a skill transition as new permission.

Inspect merge health and changed contracts even after a clean merge. Check whitespace/conflict
artifacts and targeted behavior where relevant; mechanical merge success is not acceptance proof.

### Phase 4: Focused proof between cars

Run or cite applicable focused evidence on the accumulated result under `foundation-testing.md`.
Include targeted integration proof for changed shared contracts and affected package consumers.
Record the real runner result, candidate identity, and covered outcomes.

A failed required check stops the next car and publication. Diagnose within authority, preserve the
partial candidate, and return the concrete repair need to its owner. Do not rely on the next car to
hide the failure or routinely revert state with uncertain ownership. A worker/integrator result
disagreement needs evidence reconciliation before choosing either claim.

Refresh waiting outputs against the current candidate. If a worker must update its branch, issue an
accepted revision with that exact base and review/proof requirements; do not silently mutate an
inactive worker's output and keep its old report.

### Phase 5: Finalize the candidate

After all admitted cars pass focused proof, prepare the authorized changelog, status/artifact
maintenance, release metadata, and generated content. Compose the bounded
`implement-session-wrap-up` operation with prior evidence and the final-gate owner; it returns
without invoking land or releasing this train's acquisition.

Assemble only this run's allocated fragments if used. Inventory and preserve ignored fragments
before rolling; do not consume another run's notes. Use the project's release/generation procedure.
Finish owned commits/content before the broad gate.

Run or cite one applicable broad gate on the final integrated candidate, plus release proof only
when crossing that boundary. Keep receipts in the existing excluded/local evidence store. Later
tracked edits require reconciled evidence for the actual final identity; they cannot inherit the
earlier green claim.

### Phase 6: Publish, record, and return

Publish only if the exact action/target grant covers it and required proof permits it. Preserve an
existing grant across cars and nested skills; do not require redundant confirmation. Confirm actual
remote state after the operation. An ambiguous result requires read-before-retry reconciliation
under `pattern-external-mutation.md`; retain the candidate and refs while unresolved.

Apply kernel §2 authoritative status semantics. `landed` records verified integration ancestry,
not publication. Keep remaining runtime/human/docs/release checks active and discoverable; archive
only when the lifecycle contract permits it or an explicit successor owns the remainder.
Post-gate attestations follow the excluded-evidence rule; tracked status changes reopen final-state
reconciliation.

Return local candidate/target, confirmed remote state or unpublished/unknown result, admitted and
deferred outputs, proof, remaining obligations, and next owner. Record these before releasing only
the acquisition this invocation owns. Cleanup belongs to an authorized lifecycle owner, not an
automatic per-car step.

## Definition of Done

- Every admitted output matches the accepted assignment, active attempt, and immutable content.
- Prerequisites and resource contracts hold in the accumulated candidate.
- Focused proof covers each integration; the broad gate covers finalized content.
- Required pending proof remains discoverable and gates the proper transition.
- Publication, if requested and authorized, has a confirmed target/result or an explicit retained blocker.
- Ownership persists through result reconciliation; borrowed locks were not released.
