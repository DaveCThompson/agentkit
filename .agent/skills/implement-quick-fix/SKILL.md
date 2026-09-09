---
name: implement-quick-fix
description: Make a bounded fix or minor improvement with a known approach. Use for small changes; assess behavioral risk and existing authority as well as the default 30-line, 5-file scope.
tier: core
required-tools: [codebase-mcp]
---

# Implement Quick Fix

Kit references below are relative to the configured kit checkout, located from the existing
agentkit CLI/setup or a configured vendor hook. Read only references needed for the current
phase. If the checkout or a reference is unavailable, use the stated fallback and report any
required guidance as unresolved.

## When to Use

Use when the cause or required adjustment is understood and the change can be verified locally.
The default small-scope guide is 30 changed lines across 5 files; it selects a method, not authority.

## Scope and Risk

Inspect the requested outcome, affected callers, and real consequences. A one-line change to
authorization, persistence, compatibility, or an external effect may require more analysis than
a larger mechanical edit. Filenames are discovery signals, not proof of risk or permission.

Follow [foundation-security](../../../.agent/rules/foundation-security.md) and
[pattern-external-mutation](../../../.agent/rules/pattern-external-mutation.md) for action/target authority.
Continue ordinary adjustments within the existing grant. If the repair needs planning, use
[plan-feature](../plan-feature/SKILL.md); if the cause remains uncertain, use
[debug-standard](../debug-standard/SKILL.md) or [debug-deep](../debug-deep/SKILL.md).
Ask only for a consequential missing decision or expanded authority, not merely a size overrun.

## Approach

### Phase 1: Scope Confirmation

Identify the intended behavior, owned paths, regression risk, and applicable proof. Consume an
existing diagnosis or reproduction instead of starting again. For a resumed repair, reconcile
current source, prior attempts, surviving edits and owners, and remaining acceptance.

### Phase 2: Analysis

Inspect the exact affected symbol and shared callers. Use
`integrations/codebase-mcp.md` only for useful targeted discovery. Current
source wins over stale results; bound refresh effort and use search/read if unavailable or
inconsistent. State consequential coverage limits.

Check pattern consistency and the behavioral mechanism before editing. A new test is useful
only when it establishes meaningful behavior or a required regression boundary.

### Phase 3: Execution

Make the smallest coherent correction. For a bug, reuse or collect behavioral failure evidence
and pair it with the same assertion after repair under
[foundation-testing](../../../.agent/rules/foundation-testing.md), Evidence identity and cite-or-run.
Setup failure is not the bug's red result. Explain material fixture or oracle changes.

If a safe repro is unavailable or authorized containment must come first, record the reason,
alternative evidence, confidence, and missing proof. Do not claim an untested symptom verified.

Apply the Lifecycle-Aware Verification Gate with project-equivalent methods. Investigate failures
by the evidence they add; stop when further progress requires a missing capability, external
change, or new authority rather than after an arbitrary retry count.

### Phase 4: Lifecycle Handoff

Report the change, actual focused proof, covered outcomes, and remaining check/owner. The shared
gate owns final-tree evidence and reuse; [foundation-browser-usage](../../../.agent/rules/foundation-browser-usage.md)
owns required runtime lanes. Pending required proof keeps its gated transition.

If work grows, carry the behavior contract, cause confidence, reproduction/results, attempted
approaches, partial edits, ownership, existing grant, and remaining acceptance into the same
work item and appropriate planner. Preserve other owners' state. Shared-tree authors do not run
Git commands or generation.

## Definition of Done

The requested adjustment is implemented and supported by applicable proof, or its precise
remaining blocker and evidence are handed off without a completion claim. No unrelated cleanup,
new dependency, publication, or expanded repair is implied by this route.
