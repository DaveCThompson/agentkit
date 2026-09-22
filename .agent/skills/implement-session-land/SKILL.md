---
name: implement-session-land
description: Integrate and, when authorized, publish a finished session to its selected target. Use for session landing or recovery from a partial landing, with final-state proof and scoped resource cleanup.
tier: core
---

# Implement Session Land

Land the accepted session content on the selected target and report its verified state.
`git-protocol.md` owns Git preservation/conflicts, `pattern-external-mutation.md` owns grants
and unknown results, and `foundation-testing.md` owns final-tree/release proof.

## When to Use

Use for a requested session landing or a resumed partial operation. Ordinary checkpoints use
`implement-session-wrap-up`; parallel worker admission uses `orchestrate-merge-train`.
A planning-only request gets a reviewable landing proposal and no mutation.

## Approach

### Phase 0: Resolve the actual operation

Read the existing authority for integration, publication, and cleanup separately, including exact
repository/ref/resource targets. Preserve accepted grants; do not infer a push grant from completion
or a grant for a second remote ref from a main-only request.

Observe source branch/SHA, selected local target, remote target, relevant dirty state, and active
writers. On resume, source may already be on the target; compare completed effects before repeating
wrap, integration, or push. Preserve foreign/mixed ownership. Pause session writers before final
content/proof capture. An active unrelated owner is not cleanup authority.

Retain any caller's coordination acquisition through the operation; nested wrap/cleanup does not
release it. Use kernel §6 when orchestration locking applies.

### Phase 1: Wrap (bounded delegation)

Call `implement-session-wrap-up` with current authority, completed record steps, evidence, and
this landing's final-gate ownership. It prepares local records and returns; it cannot call land.

Finish requested release metadata/versioning and generation through the actual project's supported
procedure. Do not prescribe `package.json` or kit self-sync for every project. In the kit itself,
follow its release semantics and generated-source contract; never hand-edit machine metadata.
For a kit update or rollback, follow `governance/migration-checklist.md`: reconcile pending operations,
preserve ignored recovery/evidence and use a CLI compatible with the coupled consumer state.
Restoring tracked files does not restore local bindings or reverse kit-side adoption.

Ensure release notes cover the accepted span being integrated, including relevant earlier
unreleased work. Inspect ownership before incorporating pre-existing changes. Do not create or
publish a backup branch merely as a ritual record.

### Phase 2: Reconcile affected documentation

#### 2.0 Deletion-impact sweep (canonical procedure for lifecycle consumers)

The full relevant diff defines the removal scope:

1. Inspect path changes and modified-file hunks from the accepted session base through the candidate.
   Include owned staged/unstaged changes and intended new outputs where relevant. Identify removed
   exports, routes, scripts, dependencies, behavior, and mandates even when no file was deleted.
   Skip only after both path and semantic removal sets are empty.
2. Search those exact removed names/old paths in affected live docs, active work, and canonical
   agent rules/skills/workflows. Use explicit roots and `rg --hidden --no-ignore` when excluded
   evidence or agent directories must be covered. Bound the search to the affected contracts.
3. Treat generated hits diagnostically: repair the canonical owner and hand regeneration to its
   authorized owner. Historical/immutable source mentions are not current mandates; preserve
   provenance and use resolution mappings where needed.
4. Investigate a live ticket naming removed behavior against its current Acceptance. A renamed path
   or old citation does not itself prove cancellation/completion. Preserve remaining intent and
   return unresolved consequential decisions to its owner.
5. Apply authorized affected corrections and record every material unresolved hit with evidence,
   owner, and the transition it blocks. An uncorrected required contract cannot be declared complete;
   unrelated findings do not authorize a repository-wide cleanup.

This procedure may be used by wrap without invoking the rest of land.

#### 2.1 Premise and navigation reconciliation

Reconcile session-owned work and affected references against current behavior, accepted decisions,
and actual remaining proof. Use `pattern-docs-artifacts.md` and `governance/docs-standard.md`
for status/store meanings; do not copy ticket status into a board or index as a second authority.

Keep unfinished work discoverable, or transfer it to an explicit linked successor before archiving
its historical record. PRDs dissolve into implemented truth, accepted remainder, and history under
the docs standard. Apply `maintain-docs` for authorized moves, preserving inbound/outgoing navigation,
ignored storage, and immutable source bodies. Repair shared boards and indexes only through their
assigned owner. Report unrelated drift instead of silently expanding the landing.

### Phase 3: Finalize owned content and reconcile refs

Finish authored/generated content and any owned commits, then capture the exact source candidate.
Use `git-protocol.md` for scoped staging/commit and shared-index checks. A clean entry state does
not establish that later record edits were committed.

Read/fetch the authorized target's current state and compare source, local target, and observed
remote separately. Inspect unexpected local target commits before incorporating them. Apply the
project's permitted fast-forward transition only after those relationships are established:

| Source relative to the intended accumulated target | Disposition |
| --- | --- |
| Equal | Already integrated; verify remaining publication/proof obligations |
| Source ahead, target is its ancestor | Fast-forward candidate |
| Source already contained in target | Preserve the newer target; verify the actual resulting state |
| Diverged | Reconcile under Git policy and existing authority; no blind merge or force update |
| Missing/unknown ref or ambiguous prior mutation | Preserve state and establish identity before continuing |

If divergent integration needs a decision not already granted, return a reviewable conflict/state
handoff. Fast-forward mechanics cannot resolve semantic duplicate work or unowned changes.

### Phase 4: Verify and publish the final candidate

Before integration, check all required acceptance lanes and any explicit later-transition policy
under `foundation-testing.md`; pending acceptance blocks integration by default. Then apply the
permitted local integration and run or cite final-tree evidence for the actual result. A fast-forward
alone does not invalidate matching proof. Release-only checks remain pending until their boundary
and never become green by implication.

Keep post-gate receipts/attestations in the existing excluded/local store. If tracked content
changes after the gate, reconcile and supply evidence for the actual final identity. Ignored
evidence needs separate identity. Do not create an endless receipt-SHA edit cycle.

Recheck remote movement before the authorized publication. Push only the granted target refs and
confirm the real remote result. Distinguish a verified remote equality/ancestry result from a stale
local tracking ref. If publication fails or is ambiguous, inspect actual remote state before retrying;
retain candidate refs and resources until the result is reconciled.

### Phase 3.5: Release-tree closure audit (after final-state reconciliation)

Use the cleanup ownership/preservation contract in `git-protocol.md`. Inventory every worktree on
every run. Restraint applies to mutation, not inspection: mutate only exact authorized,
session-owned, inactive targets. This step follows verified preservation and publication
reconciliation when publication is requested.

Run the bundled planner from the primary worktree. When a vendor exposes only the copied skill path,
use its local `scripts/worktree-cleanup.mjs`.

1. Write the registry snapshot. Add one entry per worktree whose owner and activity the host's
   task/session registry states: `{ "entries": [{ "path": "<exact path>", "owner": "<task or
   session id>", "activity": "active" | "inactive" }] }`. Sources include the host session list,
   `lock status`, and ticket frontmatter. Filesystem mtime, a clean status, or an absent process is
   not activity evidence. Omit a worktree you cannot resolve; the planner blocks it.
2. Emit the plan before any mutation:
   `node .agent/skills/implement-session-land/scripts/worktree-cleanup.mjs plan --target <landed ref>
   --registry <file> --authorized-owner <session id> --out .agentkit/verification/worktree-cleanup/plan.json`.
   Add `--retain <ref>` for each other verified retained ref. `plan` does not change Git state.
3. Review `retained` and `blocked`. Resolve a blocked resource by preserving its content or
   establishing its owner, then re-plan. Never edit the registry to claim inactivity.
4. Execute: `node .agent/skills/implement-session-land/scripts/worktree-cleanup.mjs apply --plan
   <plan.json> --out .agentkit/verification/worktree-cleanup/result.json`. Exit 0 means every
   eligible resource is gone and `git worktree prune --dry-run` reports nothing. Exit 2 means
   resources remain. Exit 1 is an error.
5. After a timeout or partial failure, rerun `apply` over the same plan. It re-reads Git state,
   skips completed removals, and is a verified no-op once complete.

Each worktree lands in exactly one bucket with `path`, `branch`, `head`, `owner`, `activity`,
`dirty` counts, `preservation_ref`, and `reason`:

| Bucket | Condition |
| --- | --- |
| `eligible` | Registered inactive owner covered by the cleanup grant. `git merge-base --is-ancestor` shows HEAD in a named retained ref, recorded in `ancestry`. No useful ignored content. Any tracked, staged, or untracked change is byte-identical in that ref (`content_proof`). |
| `retained` | Primary or current worktree, locked, active owner, or owner outside the cleanup grant. |
| `blocked` | Unknown owner, HEAD not an ancestor of a retained ref, unproven dirty content, useful ignored content, or content that cannot be inspected. |

- A branch name, a missing branch, or patch equivalence is not preservation proof. The planner
  skips the worktree's own branch when it checks retained refs.
- Ignored content is useful unless a path segment is on the disposable list (`node_modules`,
  build caches, virtualenvs). Extend it with `--disposable-ignored <name>` only for regenerable
  output. Never force-add private artifacts to satisfy a cleanup.
- `apply` re-assesses each entry and skips one whose state changed since the plan. It removes
  proven-dirty worktrees with `--force`, repairs a missing `.git` pointer before removal, and removes
  a stale admin record only after it confirms the recorded path is absent. It does not delete branches.
- Local branch deletion and remote branch deletion are separate exact-target grants. Local worktree
  removal does not imply either. Confirm a remote deletion at the remote.
- If Node or the script is unavailable, apply the same checks manually. Record the same fields and
  buckets, or retain the resource as `blocked`.

The closure audit is complete when every inventoried resource sits in exactly one bucket with its
reason recorded. Cleanup of resources outside this landing's session still needs its own mandate.

### Phase 5: Report

Return integrated source/candidate identities, target, actual proof, remaining checks/owners, and
documentation disposition. Report four outcomes separately:

- **integrated**: verified ancestry of the candidate in the local target.
- **published**: the confirmed remote result, or the retained local state.
- **cleaned**: resources removed in this run, from the `apply` result.
- **retained**: every `retained` and `blocked` resource with its owner and reason, plus any
  eligible resource `apply` skipped.

Use kernel §2 status semantics: `landed` means verified integration ancestry. It never implies
`published` or `cleaned`. A run that removes nothing must say so and name what it retained and why.
Keep required pending work in active navigation.

Record obligations before releasing only a coordination acquisition this invocation owns. If a
post-gate tracked status edit was necessary, reconcile the new state under the testing rule before
claiming a fully verified final candidate.

## Definition of Done

The requested integration/publication has evidence for the exact final state, or a precise retained
blocker. Required pending proof and work remain reachable. Owned records are current. The cleanup
plan was emitted before any mutation. Every inventoried resource has a verified removal or a
recorded retention reason, and `git worktree prune --dry-run` reports nothing. No foreign work or
useful local-only evidence was discarded.
