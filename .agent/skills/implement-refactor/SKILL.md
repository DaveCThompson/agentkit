---
name: implement-refactor
description: Restructure code or move responsibility boundaries while preserving behavior. Use for planned organization changes; use refine-code for small in-place clarity edits.
tier: core
required-tools: [codebase-mcp, fallow]
---

# Implement Refactor

Kit references below are relative to the configured kit checkout, located from the existing
agentkit CLI/setup or a configured vendor hook. Read only references needed for the current
phase. If the checkout or a reference is unavailable, use the stated fallback and report any
required guidance as unresolved.

## When to Use

Use for a specific maintainability problem, shared-pattern extraction, or boundary change with
no intended behavior change. Use [refine-code](../refine-code/SKILL.md) for local polish.
A visible-contract change belongs to a feature or repair route.

## Approach

### Phase 1: Scope Definition

Name the concrete problem, intended clarity/ownership improvement, and in-scope paths. Preserve
documented compatibility and fragile exceptions. Follow applicable project contracts and
[pattern-refactoring](../../../.agent/rules/pattern-refactoring.md).

Locate consumers and ownership boundaries with `integrations/codebase-mcp.md`
when useful. Reconcile against current source, bound refresh effort, and use targeted search/read
if unavailable or stale. Record consequential limits.

Identify semantic invariants relevant to the transformation: return values and public shapes,
evaluation order, object identity, mutation, exception behavior, side effects, timing,
subscriptions, resource lifetime, and accessible interaction. Do not assume a green suite covers
all of these.

### Phase 2: Safety Net

Map existing coverage to the identified invariants. Add focused characterization only where a
material preservation risk lacks evidence; choose the actual seam, including integration/runtime
checks for timing or rendering. Preserve baseline evidence before restructuring.

### Phase 3: Refactoring Plan

Choose coherent transformations with understood recovery paths. Prefer extraction at a real
responsibility boundary over splitting by length or moving complexity behind a new name.
Keep shared dependencies pointing toward the common boundary, not back into its consumers.

Search existing APIs and implementations before adding an abstraction.
`integrations/fallow.md` can supply applicable duplication or reachability evidence;
source search is the fallback. Record scope, dynamic consumers, entry-point/configuration limits,
and required compatibility before deletion. Intentionally dormant or externally consumed code
is not dead merely because a scan omits it.

Review the strongest regression risks and adjust the plan. Similar text alone does not establish
shared semantics or justify convergence.

### Phase 4: Execution

Make coherent transformations within the authorized scope. Check relevant invariants after each
meaningful transformation, not every trivial edit. Preserve evaluation order and ownership during
extraction; inspect callers and exports after boundary changes. Keep recovery scoped to owned
edits, including uncommitted work; Git is not a universal backup.

A discovered bug is separate from behavior preservation. Record it and keep the refactor scoped
unless the user has also authorized that repair. Shared-tree authors leave Git, generation, and
shared metadata to the coordinator.

### Phase 5: Verification

Use [foundation-testing](../../../.agent/rules/foundation-testing.md), Lifecycle-Aware Verification Gate,
Evidence identity and cite-or-run, and Refactor Verification. Reuse valid evidence or run the
missing applicable checks after the coherent transformation.

Report which invariants the evidence covers, semantic review findings, and missing runtime or
consumer coverage. A passing build is bounded evidence, not proof of every behavior.
Do not alter an expectation to hide a changed contract.

## Definition of Done

The intended organization benefit is concrete, the authorized scope is preserved, and relevant
behavioral invariants have evidence or explicit remaining proof. The report names actual state
and results, required pending checks/owners, and the final-tree owner when handing off.
No cleanup, publication, or unrelated bug repair is implied by refactoring.
