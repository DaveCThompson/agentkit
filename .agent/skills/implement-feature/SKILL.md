---
name: implement-feature
description: Implement an accepted feature plan or plan-bearing ticket when the requested outcome and scope authorize building. Accept the caller's artifact identity and embedded plan.
tier: core
required-tools: [codebase-mcp]
---

# Implement Feature

Kit references below are relative to the configured kit checkout, located from the existing
agentkit CLI/setup or a configured vendor hook. Read only references needed for the current
phase. If the checkout or a reference is unavailable, use the stated fallback and report any
required guidance as unresolved.

## When to Use

Use for planned functionality from [plan-feature](../plan-feature/SKILL.md),
[plan-architecture](../plan-architecture/SKILL.md), or an equivalent accepted plan. Do not require
a particular filename or a second plan document.

## Approach

### Phase 1: Pre-Flight Checklist

Load the supplied artifact, latest accepted decisions, exclusions, file/resource boundaries, and
acceptance. Reuse provided readiness evidence where its premises remain valid. On resume, reconcile
completed phases, surviving edits, changed assumptions, and remaining valid outcomes before
continuing; do not repeat valid work or resurrect superseded requirements.

Locate the project's declared knowledge-base index and governing contracts. Use available
mechanical routing once target paths are known; follow
`governance/docs-standard.md`, The KB routing contract. When unavailable,
use bounded document/source search and distinguish missing coverage from a successful no-match.

Trace the affected boundaries using `integrations/codebase-mcp.md` when
helpful. Read current source, bound freshness recovery, and use targeted search/read if unavailable
or still stale. Keep material evidence limits visible.

Check only capabilities required by acceptance. UI work may require design-system context and a
runtime; CLI or instruction work may not. Discover actual project commands instead of inventing
lint, server, or build prerequisites. A missing optional tool is not a readiness blocker.
Name any required missing capability and continue independent authorized work.

### Phase 2: Execution Loop

Implement the remaining valid phases in dependency order. For each coherent change:

1. Recheck relevant caller contracts and reuse candidates.
2. Implement within accepted outcomes and assigned surfaces.
3. Verify the phase's acceptance at the relevant seam using
   [foundation-testing](../../../.agent/rules/foundation-testing.md), Lifecycle-Aware Verification Gate.
4. Record outcome coverage and material deviations in the existing work item or assigned report.

Verify library APIs against the installed version and applicable primary docs before using an
uncertain API. Keep domain failure behavior in view: ownership, authorization, repeated actions,
partial completion, cancellation, compatibility, and recovery where they apply.

### Deviation Ledger

Continue ordinary implementation adjustments within the existing grant. Record material changes
to approach, skipped/superseded steps, unexpected dependencies, and relevant edge cases with their
reason and effect on acceptance or proof. Reversibility informs risk; it does not grant authority.

Pause dependent work only for new authority or a consequential unresolved choice. A delegated
file boundary remains binding; request a collision-checked reassignment from the coordinator if
required. Shared-tree authors do not run Git commands, generation, or shared-metadata updates;
return owned source and proof to the coordinator.

### Phase 3: Self-Correction

Review the actual implementation against acceptance, not just the planned file list. Probe
applicable empty/loading/error states, malformed inputs, boundary values, repeated actions, races,
and regression risks. Correct clear defects inside scope before presenting. Disclose material
deviations and limitations; no persona or finding quota is required.

### Phase 4: Lifecycle Gate

[foundation-testing](../../../.agent/rules/foundation-testing.md), Evidence identity and cite-or-run,
owns evidence validity and reuse. Reconcile proof with the actual candidate. For an integration
handoff, provide focused proof and name the final-tree owner; a standalone completion needs its
applicable final-tree gate.

Apply [foundation-browser-usage](../../../.agent/rules/foundation-browser-usage.md) for required runtime
lanes. Report each pending required check, owner, and gated transition. Required acceptance
without passing evidence blocks completion and integration by default. An explicit release-only
policy may defer that gate; handing off ownership does not turn pending proof green.

### Phase 5: Documentation and Handoff

Update only task-owned documentation and comments needed to explain non-obvious contracts.
Remove obsolete code only when the requested change and inspected consumers justify it.
Lifecycle artifacts belong to the caller's wrap/land owner; do not create an unconditional
session log, publish, archive, or clean resources as a feature-completion side effect.

## Definition of Done

The accepted outcomes and exclusions are accounted for against current source. Report changed
behavior, material decisions, actual proof and state, and remaining acceptance. Preserve the
existing artifact and authority for the next owner. A progress/report handoff is not a claim of
integration or release, and no required pending outcome is marked complete.
