---
name: implement-session-wrap-up
description: Prepare a local session checkpoint with truthful evidence, scoped records, and preserved remaining work. Use for ordinary wrap-up or as a bounded preparation step called by land or close.
tier: core
---

# Implement Session Wrap-Up

Prepare the local record and return to the caller. Wrap does not invoke land, publish, delete
branches/worktrees, or archive the conversation. Existing authority survives this boundary, but
those actions remain with their owning caller.

## When to Use

Use at a checkpoint, a finished local change, or a paused session needing a durable record.
`implement-session-land` owns authorized integration/publication. `close` owns task archive
preparation and session-resource disposition.

## Approach

### Phase 1: Identify the boundary and collect evidence

Read the requested outcome, current work identity, accepted decisions, owned changes, prior wrap
receipt, and remaining Acceptance. Resolve the project's docs root/KB equivalent, changelog
convention, status owners, and evidence location. Do not assume a Node project or app KB layout.

Apply `foundation-testing.md` §1 to identify focused, final-tree, or release ownership. Collect
existing exact-state evidence under §1A; do not run a broad gate before record/generation edits that
will change the candidate. A land/train caller may own the final gate after this bounded return.

A failed check bars unsupported completion/integration claims, not preservation of a paused task.
Record failures, useful negative evidence, and their next owner. Fix only authorized in-scope defects;
continue independent record preparation where safe.

### Phase 2: Choose the wrap tier

Evaluate full-wrap triggers first:

| Condition | Work added to the common record steps |
| --- | --- |
| A material behavior/schema/build decision produced uncaptured durable truth | Distill the affected truth in Phase 3 |
| Session agent-system edits, a new local asset, or an evidenced uncodified pattern needs disposition | Route that item through `kit-contribute` |
| Multi-session recovery needs context the existing work item/changelog cannot carry | Consider Phase 6's exceptional log |
| None applies | Light wrap |

Citable proof, a completed ticket, or file count does not override these predicates. Full wrap may
conclude there is no new durable truth after inspection. Both tiers complete the common record and
return phases; neither automatically launches broader maintenance.

### Phase 3: Distillation and flowback (when triggered)

Separate changed current truth, proposed behavior, and event history. Route durable facts to the
project's actual KB equivalent using `governance/docs-standard.md`'s type registry. Prospective PRD
requirements stay in lifecycle stores; dissolve landed truth and unlanded remainder under that
standard rather than promoting the whole PRD.

Use `kit-contribute` for agent-system changes and uncodified patterns. Pass provenance, scope,
target owner, and existing grants. Accept explained deferred, candidate, or sync-pending results
with the next action/owner. A local wrap does not itself authorize adoption into another repository
or fleet sync. If detection tooling is absent, report bounded source/diff evidence and its limits.

Do not erase or archive the only durable truth before its appropriate owner has preserved it.
Do not manufacture a new rule or knowledge document merely to satisfy full wrap.

### Phase 4: Changelog (common record step)

Create or update the session's entry when it records a material event, using the project's
changelog dialect and `pattern-docs-artifacts.md` rolling window. Reuse an entry already covering
the change; an unchanged checkpoint needs no duplicate event.

Record what changed and why, actual verification or pending final-gate owner, and consulted
knowledge where the project contract requests it. Do not embed a self-referential final SHA before
it exists. Final receipts belong in the existing excluded/local evidence location.

Only the authorized changelog owner writes it. A worker supplies assigned fragments or proposed
content to that owner. Roll history recoverably and retain its archive navigation.
Fragment assembly follows `governance/docs-standard.md` §(b): finalize a titled entry with actual
proof limits before consuming recoverable fragments. Keep assembly, combined verification and
history archival distinct. Moving a report permits reuse of matching proof under `foundation-testing.md`.

### Phase 5: Ticket closeout and affected references

Use `pattern-docs-artifacts.md` for status and storage. Frontmatter owns work status; legacy
prose remains readable. Update only assigned tickets and keep retained prose consistent.
`reported` is not `merged`; populate `landed` only with verified integration ancestry.
Record publication separately. A body SHA or heuristic hygiene hit is not proof of completion.

Reconcile this session's tickets and references affected by its changes. Run the deletion-impact
method in `implement-session-land` §2.0 as a bounded reference procedure, not a call to land.
Inspect semantic removals in modified files and relevant uncommitted owned changes as well as
deleted/renamed paths. Report out-of-scope corrections to their owners.

Keep pending Acceptance, proof lanes, and paused work in active stores. Archive a finished record
only when allowed, or after an explicit reachable successor owns its remaining work. Indexes point
to current artifacts without duplicating status. Broader unrelated cleanup needs its own mandate.

For authorized moves, use `maintain-docs`' preservation procedure: resolve tracking policy,
destination collisions, inbound references, outgoing relative targets, and immutable-source
navigation before moving. Verify the destination and links; retain the source on unresolved
preservation. Local-only files stay local. Inventory useful ignored evidence explicitly; ordinary
Git status does not enumerate it.

### Phase 6: Session log (exception)

Use the existing work item as the resumption record when possible. Create a log under the project's
`archive/YYYY-MM/` convention only when separately useful handoff context cannot fit there.
Keep an active resumption pointer for unfinished work. Record partial effects, useful proof,
remaining accepted outcomes, owners, and next action; do not duplicate the changelog.

### Phase 7: Final proof and bounded return

Finalize authorized authored/generated content belonging to this wrap. If wrap owns the final
tree, run or cite its applicable gate now under `foundation-testing.md`. If land/train owns it,
return the changed paths and missing proof for that owner. Reconcile any later tracked edit rather
than citing stale evidence; identify ignored report content separately.

Return completed record steps, changed/moved paths, evidence identity, remainder/dispositions,
and retained branch/resources. Ordinary wrap ends locally. A caller already authorized to land
continues its own operation with this receipt; wrap never delegates back to it.

For a requested reviewer package, give the actual problem, result, material objections, deviations,
and evidence. Include visual proof when it supports a visible claim. Unavailable visuals remain a
named limit; no fixed objection count or extra approval step is implied.

## Definition of Done

- The local checkpoint has a truthful result, relevant evidence, and explicit remaining work.
- Records are idempotent, scoped to their owners, and preserve current truth and navigation.
- Pending lanes remain discoverable; status, integration ancestry, and publication stay distinct.
- Final-state proof is valid or explicitly handed to its owner.
- The caller receives a bounded return without publication, resource deletion, or recursive land.
