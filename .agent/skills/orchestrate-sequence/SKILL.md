---
name: orchestrate-sequence
description: Use when a defined ticket set needs dependency ordering, waves, and worker lanes, or when an existing schedule must be reconciled after progress or changed assignments.
tier: core
verified-against: 2026-07-04
---

# Orchestrate Sequence

Order work from accepted dependencies and current prerequisites, then ask
`orchestrate-partition` which ready assignments can run concurrently. The kernel
`pattern-agent-orchestration.md` owns metadata (§2), execution context (§§4–5), and coordination
ownership (§6). The schedule derives work status from tickets; it owns scheduling decisions only.

## When to Use

Use for multiple defined assignments or a resumed queue. Use `orchestrate-decompose` when the work
still needs useful assignment boundaries, `orchestrate-partition` for pairing analysis, and
`backlog-status` for a status view without scheduling.

## Two modes

- `--preview` or preparation-only: inspect and return the proposed schedule. Proposed ticket
  extraction, base correction, configuration, and status changes remain output only. No lock,
  board mutation, worker launch, Git mutation, or publishing capability is needed.
- Execute: apply scheduling changes within existing authority. Resolve the kernel's per-run
  context and lock ownership before shared writes. Execution here means scheduling, not an
  implicit grant to dispatch or publish.

## Approach

### Phase 1: Resolve the scheduling context

Read the requested set, accepted assignment revisions, current effort target, and existing
schedule if present. Resolve an explicit user/run base first, otherwise the accepted effort base
or configured `baseBranch`/`mainBranch`; retain the selected ref and exact SHA separately. Verify
the ref exists.
If a base disappeared, inspect ancestry and the recorded integration decision before proposing a
replacement. A missing name alone does not identify its successor.

Read only capabilities needed by the requested mode. In execute mode, resolve the effective roster,
status-board owner, isolation context, and any run override under kernel §§4–6. Missing optional
configuration is not a preview blocker. Reuse an inherited coordinator lock; acquire a fresh
UUID identity only for a new acquisition under §6. A composed consumer does not release its caller's
lock. Unsupported execution setup is a specific blocker for that write, not for independent analysis.

Capture in-flight owned work. Do not require a globally clean shared authoring tree to compute a
schedule; dispatch/provisioning and final proof have their own state boundaries.

### Phase 2: Harvest ticket metadata

Enumerate the selected active stores directly, including ignored tickets when applicable. Read
authoritative frontmatter status with legacy prose fallback under kernel §2. Load `Depends`,
`Files`, tier, proof lanes, accepted revision, overlap/resource claims, and coupling notes.

Missing scope or consequential acceptance leaves an assignment unschedulable, even solo, until its
owner resolves it. Return the gap rather than inventing readiness.

### Phase 2.5: Lane granularity — preserve one work identity

Bind each assignment to its accepted work item. Reuse an embedded plan. Extract a child only if a
subset is independently useful and an authorized assignment owner can preserve total scope and
parent pointers. Route that authoring through `orchestrate-decompose`; in preview, propose it only.

Do not split one coherent behavior merely because its proof uses several lanes.

### Phase 2.6: Premise pre-flight — reconcile remaining intent

Use ticket history, changelog/archive references, and current source to investigate whether work
is already satisfied or superseded. A historical ID/symbol hit or dead citation is a lead, not a
completion verdict. Compare actual behavior with current acceptance.

Carry forward valid completed work, known renames, accepted later decisions, and reusable proof.
Resolve routine in-scope corrections through the owner. Ask for direction only if conflicting
intent or new authority is needed. Return missing/external prerequisites explicitly; do not
silently drop them from the set.

### Phase 3: Build the dependency DAG

1. Add each explicit `Depends` edge as dependency → dependent, retaining its source.
2. Run `orchestrate-partition` across the whole set before cutting waves. Add qualified
   `must-precede` and established behavioral prerequisites as hard edges with their evidence.
   Duplicate same-direction edges are harmless; opposite edges remain a cycle to resolve.
3. Keep path/resource exclusions separate. They constrain simultaneous assignments, not
   dependency order. A parallel-safe hint cannot erase either kind of constraint.
4. Topologically sort the hard edges. Report cycles with the involved tickets/contracts; never
   remove an edge to make the sort succeed. Keep unavailable external dependencies as pending.

A prerequisite means the accepted producer state must be available on the consumer's launch base
and later in the accumulated integration candidate. A lower wave number or a status label alone
does not establish that fact.

### Phase 4: Detect the solo-first foundation

Use dependency fan-out and inspected shared contracts to identify work that unlocks several
consumers. Order a coherent foundation ahead of its riders. Surface intersection alone does not
prove a foundation, and no fixed fan-out threshold makes one mandatory.

For several ready foundations, honor hard dependencies, then priority and exact filename as the
stable tie-breaker. State which consumer contracts the foundation establishes.

### Phase 5: Cut waves and lanes

Plan waves in topological order: each proposed wave assumes its earlier producers will supply the
accepted prerequisite state. Keep that assumption explicit until dispatch checks the actual base.
Partition each ready set, cap concurrency by actual host capacity, and place deferred tickets in a
later eligible set. A newly discovered hard edge requires re-sorting; a different lane in the same
wave cannot fix precedence.

Record the selected mode and assignment owner per lane. Assign a worker branch only for an
independent committer in worktree mode. Shared-tree authors share the coordinator's Git state and
receive disjoint writable paths. Resolve model hints from the effective roster/runtime rather than
hardcoded brand claims.

### Phase 6: Return or record the schedule

Return exact artifact filenames, accepted revisions, dependency evidence, waves/lanes, selected
base, foundation rationale, resource reservations, and unresolved work. In preview, stop here.

In execute mode, the authorized coordinator writes scheduling state and derives ticket status.
Apply separately authorized assignment/status changes through their owners. Preserve the per-run
context and run overrides. Keep ownership through a composed kickoff/train; release only an
acquisition this invocation owns when that coordination operation has ended. Use kernel §6's
owner-checked `acquire/release --id <acquisition-id>` API; status inspection does not acquire it.

## Definition of Done

- Each selected ticket is scheduled once or returned with a concrete deferral/gap.
- Hard dependencies and external prerequisites survive into launch and integration inputs.
- Concurrent subsets have partition/resource evidence; no unknown scope is called safe.
- Remaining intent is reconciled without treating history hits as completion.
- Preview has no side effects; executed writes have the correct owner and lock disposition.
