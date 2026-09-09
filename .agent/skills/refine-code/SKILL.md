---
name: refine-code
description: Polish recently written or reviewed code for clarity, consistency, and simplicity — small in-place improvements. For structural reorganization from a plan use implement-refactor.
tier: core
conflicts-with: [implement-refactor]
---

# Refine Code

## When to Use

Use for a concrete local clarity improvement in code the task authorizes editing. No change is a
valid result when the code is already clear.

- Boundary moves or structural plans: [implement-refactor](../implement-refactor/SKILL.md).
- Read-only review: [audit-code](../audit-code/SKILL.md) or
  [audit-refactor-opportunities](../audit-refactor-opportunities/SKILL.md).
- Behavior change: [implement-feature](../implement-feature/SKILL.md) or
  [implement-quick-fix](../implement-quick-fix/SKILL.md).

## Approach

### Identify the Clarity Problem

Read the surrounding code and actual consumers. Name what a reader currently has to reconstruct:
a hidden condition, unnecessary indirection, mutable temporary state, or mixed responsibilities.
Size, repeated text, prop depth, and state-variable counts are signals to inspect, not findings.

Choose a local change that reduces that burden. Keep documented compatibility and fragile
exceptions; follow applicable [pattern-refactoring](../../../.agent/rules/pattern-refactoring.md).

### Apply a Suitable Tactic

- Guard clauses can expose the main path. Preserve short-circuit behavior, cleanup, and which
  operations execute before returning.
- Direct initialization or immutable locals can simplify state. Inline an expression only when
  doing so preserves evaluation count, order, exceptions, and useful naming.
- Named predicates can expose intent. Keep them near use when extraction would hide dependencies
  or change when a side effect runs.
- Split a function or local component at a meaningful responsibility boundary when the result
  reads more clearly. Do not split solely because it performs several steps.
- Remove an abstraction when its indirection exceeds its benefit. Similar code may correctly
  remain separate when ownership or future changes differ.

For React code, consider identity, hooks, subscriptions, and render timing before replacing prop
passing with composition or context. That is a design choice, not an automatic simplification.

### Review Preservation

Inspect the semantic risks the edit actually touches: external contract, evaluation order,
identity, mutation, exceptions, timing, side effects, and resource ownership. Shorter code alone
does not establish improvement.

Apply [foundation-testing](../../../.agent/rules/foundation-testing.md), Lifecycle-Aware Verification Gate
and Evidence identity and cite-or-run, using existing evidence where valid. Add focused
characterization only for a meaningful uncovered risk. Explain evidence limits rather than
claiming universal preservation from green tests.

## Definition of Done

The report can state the concrete readability benefit, preserved contract, actual applicable
proof, and any remaining check. Stay within the owned surface; route structural or behavioral
growth appropriately while preserving existing authority. No finding quota, new abstraction, or
cleanup outside the requested code is required.
