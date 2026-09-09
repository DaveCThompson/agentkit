---
name: debug-standard
description: Investigate a reproducible bug or explain a suspected cause. Use for systematic diagnosis and, when requested, a supported repair; use debug-deep for persistent uncertainty.
tier: core
required-tools: [codebase-mcp]
---

# Debug Standard

Kit references below are relative to the configured kit checkout, located from the existing
agentkit CLI/setup or a configured vendor hook. Read only references needed for the current
phase. If the checkout or a reference is unavailable, use the stated fallback and report any
required guidance as unresolved.

## When to Use

Use for a reported defect whose conditions can be investigated directly. A known bounded repair
may use [implement-quick-fix](../implement-quick-fix/SKILL.md). Diagnostic uncertainty routes to
[debug-deep](../debug-deep/SKILL.md); repair breadth or consequential shared contracts route to
[plan-feature](../plan-feature/SKILL.md) or [plan-architecture](../plan-architecture/SKILL.md).

## Intake and Authority

Resolve whether the request is diagnosis, reproduction-only, or repair. Preserve existing repair
authority through the investigation. A no-edits request also excludes test-file and instrumentation
writes. Use available read-only evidence and return a diagnosis with its limits.

Consume any existing diagnosis, reproduction, and work item. On resume, reconcile the current
symptom, intended contract, prior attempts, surviving edits and owners, and later user decisions.
Retain useful historical evidence while refreshing only stale or insufficient proof.

## Approach

### Phase 1: Observe and Reproduce

Record inputs/actions, expected versus actual behavior, relevant environment/version, and how
the expectation was established. Separate reported observations from locally reproduced ones.

Inspect enough source to find the relevant behavioral seam. Reuse an existing collected failing
test when it covers the symptom. If creating a reproduction is in scope, confirm collection and
the intended assertion failure; setup or import failure is not behavioral red.

### Phase 2: Hypothesize

Trace from the symptom through data sources, transformations, state ownership, and callers.
Use `integrations/codebase-mcp.md` for useful graph discovery, then read
current source. Bound freshness recovery and fall back to targeted search/read if the graph is
unavailable or contradicts current files.

Form competing explanations only while uncertainty warrants them. For each live hypothesis,
record supporting evidence, counterevidence, confidence, and a probe that could distinguish it
from the alternatives. Source location alone does not establish causality.

For styling defects, verify computed-property validity and runtime token/config resolution.
Determine whether the property is dropped, overridden, or unavailable before tuning numeric
values. Check the actual DOM scope rather than assuming a source declaration reaches the node.

### Phase 3: Establish the Cause

Choose probes by information gained, not a fixed command count. Change one relevant condition
at a time when practical. Record negative results with their tested conditions; a local
non-reproduction does not refute a race in every environment.

Explain the mechanism linking input to symptom and why the proposed change addresses it.
Review nearby callers for the same mechanism without expanding repair scope automatically.
For diagnosis-only work, return the supported conclusion or unresolved result here.

### Phase 4: Implement and Verify

Within existing repair authority, make the smallest change that addresses the supported cause
and preserves unrelated behavior. Review malformed inputs, boundary conditions, and regression
risks before editing.

Apply [foundation-testing](../../../.agent/rules/foundation-testing.md), Evidence identity and cite-or-run,
for bug proof: pair the same behavioral assertion on the unfixed and fixed states. Explain
material oracle/fixture changes from the intended contract and re-establish applicable evidence.

When safe reproduction is unavailable or authorized containment must precede it, state the
specific reason, alternative evidence, confidence, and missing proof under that shared contract.
Do not claim verified repair of an untested symptom. Use the Lifecycle-Aware Verification Gate
for applicable checks and [foundation-browser-usage](../../../.agent/rules/foundation-browser-usage.md)
for required runtime lanes.

## Exit and Definition of Done

A diagnosis deliverable may be confirmed, probable, or unresolved. Return the symptom and
intended behavior, decisive evidence, confidence, attempted approaches and their limits, remaining
hypotheses, and next feasible probe/owner. Stop when further progress requires unavailable evidence,
new authority, or an external change; do not pad attempts or manufacture certainty.

A repair report names changed behavior, proof state and results, and remaining acceptance with
owners and gated transitions. Required pending proof remains pending. If scope grows, carry this
diagnostic state and surviving edits to the existing work item and appropriate planner; changing
methods does not revoke the existing grant or permit crossing a delegated file boundary.
