---
name: plan-feature
description: Create a lightweight implementation plan when requirements are clear and the change has bounded dependencies. Accept a feature brief, approved ticket, or diagnosed repair.
tier: core
required-tools: [codebase-mcp, fallow]
---

# Plan Feature

Kit references below are relative to the configured kit checkout, located from the existing
agentkit CLI/setup or a configured vendor hook. Read only references needed for the current
phase. If the checkout or a reference is unavailable, use the stated fallback and report any
required guidance as unresolved.

## When to Use

Use for a bounded change needing an implementation plan. Cross-cutting contracts or consequential
migration design may need [plan-architecture](../plan-architecture/SKILL.md). Unclear product
behavior may need [plan-prd](../plan-prd/SKILL.md); a clear brief does not.

## Output Contract

Reuse the supplied work item or plan, including an embedded plan. Preserve its path, outcomes,
exclusions, decisions, and authority. For a new artifact, use
[pattern-docs-artifacts](../../../.agent/rules/pattern-docs-artifacts.md), Work Items and Status-of-Record
Contract. No additional PLAN file or filename migration is required.

## Approach

### Phase 0: Knowledge Base Recon

Find the project's declared knowledge-base index and route by the provisional area when exact
files are not yet known. Once likely paths are known, use the available mechanical KB router to
match them to governing contracts; see `governance/docs-standard.md`,
The KB routing contract.

Read the relevant contracts without a count target. Distinguish a successful no-match result
from unavailable routing or a missing index. In the latter cases, use bounded source and document
search and name any consequential coverage gap. New files may be governed by their intended
location even before they exist.

### Phase 1: Discovery

Reconcile the brief, prior decisions, and assumptions against current source. State the desired
behavior and observable acceptance even when no PRD exists. Identify affected callers, state,
public contracts, and design-system implications where applicable.

For repair intake or resumed work, preserve the symptom, intended behavior, diagnosis confidence,
reproduction identity/results, rejected approaches, surviving edits and their owners, and remaining
acceptance. Check what has changed before reusing proof or repeating a completed step.

Use `integrations/codebase-mcp.md` to trace relevant symbols and boundaries
when helpful. Current source takes precedence over stale graph results. Bound refresh effort;
if unavailable or still stale, use targeted search/read and state the limit.

### Phase 2: Approach Evaluation

Compare viable approaches only where the choice is unsettled. Include extension of an existing
pattern. Explain the strongest objection, maintenance cost, and reason for the selected approach.
Record material assumptions with the signal that would change them. Do not manufacture options
or sign-off questions.

Before adding an API, helper, component, or dependency, search relevant implementations and name
the reuse candidate or search scope. Use `integrations/fallow.md` when applicable
for clone/reachability evidence; fall back to source search when unavailable. A scan does not
prove an equivalent implementation absent. Dead-code candidates depend on analyzed entry points,
dynamic consumers, and configuration; planning does not delete them.

### Phase 3: File Changes and Phases

Name new, modified, removed, and renamed paths with their purpose. Respect contractual assignment
boundaries. Break work into coherent, verifiable transformations and state execution dependencies.

For each consequential acceptance outcome, connect the responsible boundary, implementation
phase, and proof method/owner. Prose is sufficient for a small plan. For example, a CSV export
must preserve displayed column order; a passing build alone does not cover that outcome.

Include applicable failure behavior: authorization, ownership, retry/cancel semantics, partial
success, compatibility, and persistence. Describe rollout detection and recovery where a failure
could affect real users or data. Distinguish reverting code from restoring data.

## Plan Review

Lead with decisions costly to change, their alternatives, and consequences. Keep that reading
order separate from execution order. Review whether the plan introduces unnecessary coupling,
can be checked at its real seam, and leaves enough rationale for its next owner.

Use a Verification section to name actual project methods, required capabilities, proof lanes
and owners, and what pending proof gates. [foundation-testing](../../../.agent/rules/foundation-testing.md),
Lifecycle-Aware Verification Gate and Evidence identity and cite-or-run, owns the gate and reuse
rules. Do not copy its command recipe or assume a dev server is required.

## Definition of Done

The plan identifies outcomes, exclusions, scope, execution dependencies, applicable acceptance
proof, material assumptions, and blast radius/recovery limits. The next consumer receives the
same artifact and existing grants. A pending required acceptance item keeps its owner and the
transition it blocks. Required acceptance without passing evidence blocks completion and
integration by default; an explicit release-only policy may defer that gate, never mark it green.

Ask only for a consequential decision requiring new direction. A plan-only request stops at the
plan; a concrete plan within an implementation grant may proceed without renewed approval.
End durable reports with "What we deliberately did NOT do."
