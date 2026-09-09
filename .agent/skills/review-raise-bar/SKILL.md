---
name: review-raise-bar
description: Use when asked to review and improve existing work by repairing demonstrated code, validation, UI or documentation defects. For critique without repairs use review-peer.
tier: core
---

# Review Raise Bar

Review and repair the requested work to the repository's standard. Route by the user's desired
outcome and demonstrated defects, not the author's tier or model.

## When to Use

Use when the user asks to review and improve existing code, docs or another agent's output.
For critique only use `review-peer` or `audit-code`; for an unimplemented proposal use
`vet-simple` or `vet-hard`. A review request alone does not authorize this repair workflow.

## Inputs

Use the existing work item, accepted outcome/exclusions, actual output and caller's repair grant.
Reuse a ticket or embedded plan rather than requiring another artifact. Read applicable standards
and status records through the project context index.

## Approach

### Phase 1: Recon and Ownership

Identify the actual base/target state and files produced by the work under review.
Locate other branches or output contexts only when the supplied work spans them; do not enumerate
the entire repository's recent history by default. Inspect the actual diff and affected callers.

In shared trees attribute concurrent edits using the assignment record. Recheck owned targets
before changing them. Follow `pattern-agent-orchestration.md` for disjoint ownership and
`git-protocol.md` for Git authority. A shared-tree repair worker does not stage, commit, branch,
merge, generate or publish; return owned changes to the coordinator.

### Phase 2: Multi-Lens Review

- **Behavior/correctness:** map expected behavior to implementation. Trace important success,
  failure and boundary paths through callers, state ownership and effects. Check compatibility,
  cancellation, data integrity and recovery where affected.
- **DX:** architecture/type boundaries, executable instructions and concrete verification.
- **UI/UX:** applicable design, accessibility and interaction contracts on target devices.
- **Docs:** source truth, filing/navigation and current work status.
- **Scope:** accepted outcomes, exclusions, assumptions and remaining acceptance.

Inspect tests and evidence rather than treating a green summary as proof. Pay particular attention
to changed fixtures, expected values and gate configuration. Use `foundation-testing.md` for
evidence validity, and `foundation-browser-usage.md` for applicable runtime proof.

### Phase 3: Judge Prior Findings

Classify supplied recommendations as **Adopt**, **Adapt** or **Reject** with evidence.
Recheck stale claims and retain difficult relevant defects. Author reputation and estimated effort
are not disposition criteria. No additional findings are required when the supplied issue is enough.

### Phase 4: Direct Upgrades

Repair supported defects within the requested outcome and owned surface. Prioritize behavior,
then meaningful validation, then documentation truth. Preserve compatibility and unrelated work.
Routine implementation choices and necessary dependencies within the grant do not need new approval.
A new product decision, consequential target expansion or conflicting writer needs owner direction.

For reproducible repairs, inspect the same behavioral assertion before and after; setup failure
is not the behavioral red. Explain material oracle/fixture changes. If a safe reproduction is
unavailable or authorized containment must precede it, use the bounded alternative-proof contract
in `foundation-testing.md`. Performance claims require comparable measurement; security repairs
require the threat boundary and legitimate operation to be checked.
Repairing a test to match new implementation behavior requires an intended-contract justification.

### Phase 5: Plan Only When Needed

Continue authorized repairs while meaningful independent work remains. Use the caller's existing
ticket/plan for an explicit planning request, a material design dependency or a blocked repair.
Preserve the goal, decisions, exclusions, partial diff, attempted approaches, evidence, remaining
acceptance and next owner. Distinguish uncertain diagnosis from a well-understood large repair.
Scale detail to the recipient and risk; do not force a junior pack or a fresh artifact.

### Phase 6: Return the Repaired Work

Use `foundation-testing.md` for the applicable focused/final-tree boundary. A worker returns focused
proof with the coordinator's final gate pending. A standalone task performs its applicable final
proof. Do not recursively invoke landing or cleanup as a consequence of finishing review.

Report what changed, why, actual validation and outstanding work. Required pending acceptance keeps
its owner and gating transition; it cannot be marked complete solely because code was edited.
Name gaps for inaccessible runtime or external remediation without inventing passing results.

## Definition of Done

The authorized surface meets the accepted contract in the verified lanes, or the exact remaining
defect/proof and owner are reported. Findings have evidence-backed dispositions.
Zero edits is valid when review demonstrates no repair is needed.
No unauthorized scope expansion, concurrent-file overwrite, publication or cleanup occurred.
