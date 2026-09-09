---
name: worker-report
description: Report a worker's completed, blocked, partial, or interim result with accessible output and focused evidence. Use at a worker boundary; integration and shared-state ownership remain with the coordinator.
tier: core
---

# Worker Report

Make the worker output reviewable and usable by its next owner. The report shape is owned by
`pattern-agent-orchestration.md` §3; evidence validity belongs to `foundation-testing.md`.
A report is deliverable without a commit, push, successful setup, or completed implementation.

## When to Use

- The worker finished its requested deliverable, reached a blocker, or has proof for another owner.
- The coordinator requested a progress snapshot.
- An attempt failed, was cancelled, or needs a recovery handoff.

An interim report does not close the assignment or require stand-down. Final output stands down
after delivery so its accepted content cannot change unnoticed.

## Approach

### Phase 1: Establish report kind and evidence

Identify the accepted assignment revision, active attempt, requested deliverable, delivered outcomes,
and remaining Acceptance. Use kernel §2 status and keep interim/partial/cancelled disposition separate;
do not invent a new status schema. A late cancelled attempt may supply historical evidence but is
not current eligible integration output.

Collect focused proof for the actual output under `foundation-testing.md` §1. Reuse valid earlier
evidence; run only missing applicable proof. Name the final-tree gate owner unless this worker
explicitly owns that boundary. Report real command results, covered content/environment, and limits.

For a suspected inherited failure, use matching comparative evidence from an isolated baseline when
available. Never switch/reset a shared live tree to prove blame. Without comparable proof, state
uncertain attribution and its acceptance impact instead of claiming either causality or exemption.

Carry each core proof lane with its owner, result/pending check, and gated transition, using justified
non-applicability. Human-pending work remains `needs-human-verify`. Other incomplete required lanes
remain explicit and block the transitions defined by testing policy. Intentional red can complete a
reproduction-only assignment while the repair remains unimplemented.

### Phase 2: Measure the real surface before any commit or publication

Compare output against its accepted start and write boundary. Include committed, staged, unstaged,
untracked, and assigned ignored artifacts. Shared-tree reports use attributed owned deltas and content
identities, not the whole tree's dirty list or a fictitious isolated branch.

Check intended additions, removals, rename endpoints, and semantic removals from modified files:
exports, routes, scripts, dependencies, or contracts. State zero only after inspecting both paths
and semantics. Return collision/resource implications and changed prerequisites.

An out-of-surface change is not legalized by a retrospective explanation. Preserve it, flag the
boundary failure, and require a coordinator revision/collision review before accepting it for
integration. The report itself must still be returned.

Disclose test, fixture, threshold, and oracle changes. A detection claim needs the violating and
conforming evidence in `foundation-testing.md` §1C and its independent scrutiny. Keep unexecuted
runtime assumptions visible.

### Phase 3: Finalize owned completion artifacts and output

Write the assigned ticket/status, report, or fragment only if those exact paths belong to this worker.
Frontmatter is authoritative; update existing prose consistently if retained. Otherwise return the
proposed status/fragment content to the named owner. Never write the board or shared changelog.

For a final report, finalize owned content before final focused evidence/identity capture. Ignored
evidence needs its own content identity and an authorized delivery route; it is not part of a normal
branch push. Do not force-add it or change ignore policy.

- Shared-tree-disjoint author: no Git mutations. Supply the owned path/content identities and stop
  editing for the coordinator's stable combined snapshot.
- Independent worktree committer: commit only assigned content if the assignment grants that action,
  after rechecking actual branch/index ownership. Capture the exact output commit. An interim,
  blocked, or partial report does not force a commit.
- Publication: only within the existing exact action/target grant under
  `pattern-external-mutation.md`. A local ref or accessible artifact is sufficient for a local
  handoff. Reconcile an unknown remote result before retrying.

### Phase 4: Emit the kernel §3 completion report

Use the shared contract without copying another mandatory schema here. Verify that the report
binds assignment/attempt to accessible immutable output, outcomes/remainder, actual surface,
deviations, proof and lane ownership, producer, runtime assumptions, gate changes, and integration
notes. Use actual model/runtime provenance; identify unavailable details instead of inventing them.

Distinguish what was authored from what was integrated or published. Name confirmed publication
separately from `landed`, which records verified integration ancestry. Preserve source evidence and
material qualifications so the coordinator can reconcile, rather than merely relay, the result.

Keep routine reporting compact. A blocked report needs enough evidence and retained-state detail
for the next useful action; it does not need an invented successful-completion checklist.

### Phase 5: Deliver and stand down

Deliver the report/output through the assigned accessible channel. A final report names the next
owner and leaves its output stable. Continue only on a new accepted revision/follow-up. An interim
snapshot returns to the active loop unless the coordinator requested a pause. Do not merge, clean
resources, archive tickets, or invoke wrap/land to finish a worker report.

## Definition of Done

- Report kind and work status are truthful; active assignment/attempt and exact output are identifiable.
- Scope was checked before any authorized commit/publication; blocked reports remain deliverable.
- Required owned completion artifacts exist or their owner has an explicit handoff.
- Evidence covers the claimed state; pending proof, removals, runtime assumptions, and gate changes survive.
- The next owner can access the output without publishing local-only evidence.
