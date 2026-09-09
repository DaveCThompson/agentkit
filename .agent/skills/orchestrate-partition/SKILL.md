---
name: orchestrate-partition
description: Assess which defined assignments may run concurrently using intended paths, dependency contracts, and shared resources. Use before dispatch or after an assignment surface changes.
tier: core
verified-against: 2026-07-04
---

# Orchestrate Partition

Compute path relations, identify precedence, and recommend a safe concurrent subset. File
disjointness is evidence about paths, not proof of behavioral or external-resource independence.
The isolation contract belongs to `pattern-agent-orchestration.md` §5.

## When to Use

Use for a proposed wave, a standalone pairing, or a changed assignment. Return ordering edges to
`orchestrate-sequence`; do not assign wave numbers here. Workers cannot repartition to expand
their own scope. Finished output also needs the merge train's admission check.

This is read-only analysis. No manifest, lock, publishing capability, or board write is required.
The coordinator can consume the output in its authorized scheduling operation.

## Approach

### Phase 1: Expand each ticket's surface (hypothesis → path set)

Read the accepted assignment revisions and selected base. Build each write set from:

- Existing paths matched by declared globs, including relevant untracked/local-only files.
- Explicit intended creates, deletes, and both rename endpoints.
- Worker-owned completion artifacts and generated outputs a permitted command could write.
- Actual attributed changes, if the assignment has begun.

Normalize repository-relative paths using the actual filesystem's case/path semantics. Inspect
symlink or alias destinations when they can make different names address the same file.

An empty glob alone is unknown, not disjoint. Distinguish a typo naming existing work from an
intentional new path. Open-ended future globs need concrete destinations or a conservative ownership
boundary before concurrency can be cleared. Do not silently remove an unknown ticket from coverage.

### Phase 2: Grow surfaces with real edges

Keep writes separate from a read-halo of direct imports, importers, governing artifacts, and known
consumers. Use current source and resolved imports. `use-codegraph` can accelerate discovery and
owns its optional tool declarations/fallback; otherwise use `rg` and targeted reads. Basename hits
are candidate edges until their module identity is resolved.

For started work, compare the immutable output with its recorded base and the current accumulated
integration candidate. In shared-tree mode use the coordinator's attributed deltas. Do not substitute
remote main for a selected effort base or for already integrated local work.

Record material shared behavior and resource assumptions: protocol compatibility, required new
behavior, fixture namespace, service account, browser session, build output, and exclusive values.
A stable read can remain a watch; a required new or incompatible behavior needs a hard dependency.

### Phase 2a: Declared-new-symbol pass (the surface no file holds yet)

Build `(module/path, export) → producer` from explicit export declarations. Match consumers through
an explicit required-contract declaration or a resolved import. Ambiguous prose references are
candidates, not hard precedence.

Two producers of the same qualified export conflict. The same bare export name in different
modules does not. Distinct exports in one future file still collide through Phase 1's write set.

Emit `must-precede <producer> before <consumer>` with the qualified contract and evidence.
Keep these edges separate from the path verdict. If declarations are missing, report coverage as
uncertain; an empty declared map is not proof there are no future dependencies.

### Phase 3: Pairwise classification (deterministic)

For every pair A/B, let W be the write set and R the read-halo:

| Condition, evaluated in order | Path verdict |
| --- | --- |
| W(A) intersects W(B) | collision |
| W(A) intersects R(B), or W(B) intersects R(A) | watch |
| Otherwise, including read/read overlap only | disjoint |

Precedence is a separate relation. A watch can require serialization if the reader needs the
writer's new behavior. Neither an isolation mode nor `Parallel-safe-with` can waive an actual
write collision or prerequisite.

### Phase 3a: Reserves allocation (scarce values and shared resources)

Compare declared `Reserves` and resource claims using exact resource/namespace identity. An
exclusive value or shared mutable resource cannot belong to simultaneous writers. Return the
conflict, or a proposed disjoint allocation for its authorized owner to apply. Do not mutate the
board or reserve external resources from this diagnostic skill.

### Phase 4: Select the concurrent-safe subset

Build the exclusion graph from write collisions, incompatible watches, and resource conflicts.
Choose an independent set in declared priority order, breaking ties by exact ticket filename.
Return exclusions and unknown assignments with their counterpart and evidence.

Do not admit a consumer whose prerequisite is absent from its launch base. Return it deferred for
`must-precede`, naming the producer/output it needs. Emit every discovered dependency for the
sequencer even when its endpoints are not selected. Capacity can reduce concurrency; it cannot
make an unsafe pair independent.

### Phase 5: Recommend the isolation mode

Apply kernel §5. Independent committers need separate worktrees. Shared-tree-disjoint authoring
requires explicit disjoint ownership and one coordinator for Git, generation, shared metadata,
and combined proof. Other workers' dirt is expected under that contract.

Unknown surfaces shrink the concurrent subset until resolved. Worktrees reduce filesystem/index
coupling but do not waive semantic dependencies or shared-service conflicts. Account for actual
host capacity and required provisioning cost; reduce concurrency when necessary. State the fact
that determined the mode.

### Worked fixtures

| Assignments | Result |
| --- | --- |
| Both create `new.ts`, exporting different names | collision on the future path |
| Both read `types.ts`, write separate files | disjoint path relation |
| A exports `a.ts::create`; B exports `b.ts::create` | no symbol collision from the bare name |
| A creates `preview/stamp.ts::makeStamp`; B explicitly requires that export | path relation retained; A must precede B |
| B mentions “create” without a resolved module or required contract | candidate dependency, not a hard edge |
| Separate files mutate the same database fixture | resource conflict until isolated or serialized |

## Definition of Done

Return the covered assignment revisions/base, concrete sets and uncertainties, every pair's path
verdict, qualified prerequisite evidence, resource conflicts, selected/deferred tickets, and the
isolation recommendation. Empty findings are valid when the analyzed coverage supports them.
No ticket, branch, board, lock, or external resource was changed.
