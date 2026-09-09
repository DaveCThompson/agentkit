---
trigger: model-decision
description: Consult before scaffolding repeated wizard/lab/dashboard surfaces or converging duplicated implementations — existing abstractions, justified copies, stable contracts and shared dependency direction.
tier: kind:app
domain: code-quality
---

# Feature Scaffolding Patterns

Use existing abstractions and proven project behavior before creating another implementation.
Choose reuse, copy or extraction from the shared contract and expected variation; neither a
clone quota nor a session-size rule establishes the right boundary.

Read the project's scaffold examples, component APIs and any shared-kernel inventory. Preserve
documented domain constraints and the approved scope, including comprehensive changes.

## 1. Clone to Create

- First inspect an existing shared component, hook, configuration seam or scaffold that covers
  the requested behavior. Reuse it when its contract fits; do not clone merely to prove repetition.
- A proven sibling is useful evidence for navigation, validation, phase rails, gestures, footers,
  scrolling and responsive states. A scoped copy is appropriate when no suitable abstraction
  exists and adapting that sibling is clearer than a new implementation or premature generalization.
  Record the source and expected divergence when the copy creates meaningful maintenance coupling.
- Preserve required behavior and accessible states, not incidental CSS/module names or known bugs.
  Prefer native project conventions if the sibling predates the current architecture. Build a new
  surface when existing ones do not fit, documenting consequential differences.
- This covers in-repo siblings. For an external reference, use `reference-hunt` to extract semantics,
  preserve required compatibility and reimplement through the target project's native contracts.

## 2. Shared Kernel Boundary

- Put shared behavior at the existing dependency layer that owns it; do not create a core folder
  merely to satisfy this rule. Domain features can depend on shared modules; shared modules must
  not import their consuming slices and create cycles.
- Pass domain differences through explicit configuration, callbacks or adapters when they form
  a coherent public contract. Repeated checks of concrete consumer identity signal a poor seam.
  A legitimate capability variant is not inherently a forbidden special case.
- Define ownership of state, side effects, styles and cleanup. A shared API must preserve consumer
  error, loading, navigation and accessibility behavior, not just the happy-path layout.

## 3. Converge After Creation

- Assess stable common behavior, change coupling, variation and consumer proof before choosing
  extraction. Low-divergence copies can be good candidates. No universal minimum of three clones
  applies: two consumers or one established public contract may justify sharing, while many
  superficially similar surfaces may need separate implementations.
- Prefer a typed configuration/props seam when it expresses the stable contract. Retain separate
  behavior when extraction would couple independent changes or hide meaningful differences.
- Choose migration size from the approved outcome, dependency coupling and verification strategy.
  Incremental internal steps can aid diagnosis; an approved comprehensive migration is valid.
  There is no one-sibling-group-per-session restriction or blanket big-bang ban.
- Verify every affected consumer's contract with existing tests and focused checks for uncovered
  variation. Share tests for truly shared behavior, and check distinct adapters/flows separately.
  A green test for one sibling does not establish compatibility for all consumers.
- When one consumer needs to diverge, compare a supported extension seam with a deliberate local
  fork. A fork retains applicable corrections and takes explicit ownership of future maintenance;
  copying a kernel file back is an option, not the mandatory escape route.

## 4. Divergence Is Sometimes Correct

Keep unique or evolving domain behavior separate when that boundary reduces coupling. Record
consequential retained duplication and its reason in the existing design/inventory or work item.
Do not create a second tracking document just to satisfy this rule. Revisit when contracts or
maintenance costs change; text similarity alone is not a refactor mandate.

## Verification

- [ ] The scaffold choice names the reused API, sibling evidence or reason for a new implementation.
- [ ] Shared dependencies remain acyclic and state/effect ownership is explicit.
- [ ] Every affected consumer has relevant behavioral evidence or a named gap under `foundation-testing.md`.
- [ ] Applicable inventory/docs reflect shared contracts and deliberate divergence.
- [ ] Copy/extraction choices preserve scope and domain semantics without arbitrary count or session limits.
