---
name: plan-prd
description: Define product requirements for a feature when the user problem, observable behavior, states, or interaction model still need specification before implementation planning.
tier: core
---

# Plan PRD

Kit references below are relative to the configured kit checkout, located from the existing
agentkit CLI/setup or a configured vendor hook. Read only references needed for the current
phase. If the checkout or a reference is unavailable, use the stated fallback and report any
required guidance as unresolved.

## When to Use

Use when product behavior remains unclear. A clear brief can go directly to
[plan-feature](../plan-feature/SKILL.md) or [plan-architecture](../plan-architecture/SKILL.md).
Do not repeat accepted exploration or require a PRD merely because implementation is large.

## Output Contract

Use the caller's existing ticket, PRD, or supplied destination, including an embedded requirements
section. Preserve its identity. If a new work item is needed, follow
[pattern-docs-artifacts](../../../.agent/rules/pattern-docs-artifacts.md), Work Items and Status-of-Record
Contract, for location and metadata. Do not create a competing plan or rename a valid artifact.

## Approach

### Phase 1: Discovery

Reconcile current user intent with prior exploration, explicit decisions, and revisable
assumptions. Describe the problem, affected actors, current behavior, desired outcome, and
non-goals. User stories can clarify motivation but do not replace observable requirements.

Identify material unknowns. Treat inferred preferences as assumptions until accepted; do not turn
rejection of one option into a broader prohibition. Resolve only consequential missing choices.

### Phase 2: Design Options

Compare alternatives only for unsettled behavior. Consider information architecture, interaction
model, or operational experience according to the actual product. Retain a chosen approach when
the brief already settles it. Explain its strongest objection and any resulting adjustment.

A service or CLI PRD may describe job submission, output, cancellation, or recovery without a
visual hierarchy. Include visual options only when they help decide the product behavior.

### Phase 3: Specification

Define each consequential requirement through its trigger, preconditions, observable result,
and recovery behavior. For stateful work, describe:

- Who can initiate or observe the action and who owns the result.
- Transitions through pending, successful, rejected, cancelled, or partially completed work.
- Repeated actions, interruption, retry, and what users can recover or undo.
- Compatibility expectations and user-visible limits.

For UI surfaces, add applicable visual states, wireframes, focus behavior, keyboard navigation,
status announcements, and reduced-motion requirements. Use actual project tokens; label proposed
tokens. Omit irrelevant UI sections for API, CLI, and background-service work.

Specify intent without choosing implementation architecture. For example, "A cancelled import
reports which records were saved" defines behavior; selecting a queue or storage engine belongs
to technical planning.

### Phase 4: Validate

Write testable acceptance for each required outcome, including the failure and recovery cases
that matter. Name success signals, rollout exposure, and material user risk. Record unresolved
assumptions and the evidence needed to settle them.

Check that the requirements preserve non-goals and accepted choices. Accessibility and usability
statements at this stage are requirements or hypotheses, not claims of working runtime behavior.
Identify the checks the implementer must carry forward.

## Handoff and Definition of Done

Return the requirements artifact, accepted decisions, assumptions, and acceptance that planning
must preserve. Ask for sign-off only on a consequential choice not covered by existing authority.
A planning-only request ends at the requested specification; already authorized implementation
may continue through the appropriate planner.

The requirements are ready for planning when observable outcomes and exclusions are clear and
remaining uncertainty has an explicit disposition. Do not call unresolved required behavior
specified. End durable reports with "What we deliberately did NOT do."

A PRD describes intended work, not durable shipped truth. Its later dissolution belongs to
`governance/docs-standard.md`, The PRD dissolution contract: preserve
shipped facts, discoverable unlanded work, and the historical record rather than promoting it
whole into the knowledge base.
