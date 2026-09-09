---
name: plan-architecture
description: Specify architecture from accepted requirements or a clear brief when cross-cutting boundaries, data ownership, compatibility, or failure and rollout behavior need detailed design.
tier: core
required-tools: [codebase-mcp, fallow]
---

# Plan Architecture

Kit references below are relative to the configured kit checkout, located from the existing
agentkit CLI/setup or a configured vendor hook. Read only references needed for the current
phase. If the checkout or a reference is unavailable, use the stated fallback and report any
required guidance as unresolved.

## When to Use

Use for a technical specification from a converged brief or accepted requirements. A PRD is one
possible input. For a comparison before selecting an approach, use
[explore-tech](../explore-tech/SKILL.md).

## Artifacts

Reuse the caller's ticket, approved plan, or supplied destination, including an embedded plan.
Use [pattern-docs-artifacts](../../../.agent/rules/pattern-docs-artifacts.md), Work Items and Status-of-Record
Contract, when creating a new work item. Do not introduce another artifact merely to satisfy a
prefix convention.

## Approach

### Phase 1: Requirement Mapping

Reconcile current intent, explicit decisions, non-goals, and assumptions. Preserve observable
acceptance even when the input is a brief rather than a PRD. On resume, distinguish completed
valid outcomes from remaining work and superseded premises.

Locate governing project contracts and the existing dependency/data boundaries. Use
`integrations/codebase-mcp.md` when useful; verify relevant graph results
against current source. Bound refresh effort and use targeted search/read if unavailable or stale.
Record material coverage limits.

Map consequential acceptance to its responsible boundary, implementation phase, and proof owner.
This mapping must survive into build; use a table only when it improves traceability.

### Phase 2: Options Evaluation

Compare viable alternatives at unsettled boundaries, including reuse of the current design.
Explain compatibility, operational cost, failure isolation, coupling, and cost of changing the
decision later. A single supported option is valid when constraints settle the choice.

Use design principles to answer actual questions: separate responsibilities that change for
different reasons; examine consistency and availability under the relevant distributed failure;
trace attacker control to a protected operation. Do not substitute framework names or a role-play
transcript for the argument. Check changing API/support claims against applicable primary docs.

### Phase 3: Detailed Specification

Search relevant APIs and implementations before proposing new abstractions. Use
`integrations/fallow.md` for applicable clone/reachability questions, with source
search as fallback. Record search scope and reuse candidates; neither a clone scan nor a
dead-code scan proves semantic absence or safe deletion.

Describe the system using the dimensions it actually has:

- Domain entities, types, validation, ownership, lifecycle, and invariants.
- Interfaces, callers, inputs/outputs, authorization, and compatibility contracts.
- Data movement and control flow, including where trust or process boundaries are crossed.
- Persistence, concurrency, retry/idempotency, cancellation, partial success, and recovery.
- Required observability, rollout/migration order, and limits of code versus data rollback.

For a UI, add component hierarchy, state ownership, derived state, and effects using the project's
chosen libraries. Do not impose atoms or a state barrel on other stacks. For a CLI or service,
describe command/request boundaries, durable checkpoints, worker ownership, and observable
results where relevant.

Name new, modified, removed, and renamed files. Identify shared behavioral and resource surfaces
as well as files; disjoint paths alone do not establish independent execution.

### Phase 4: Risk Analysis

Probe the proposed contracts with concrete failure conditions:

- Rapid state changes, competing requests, and a late result after cancellation.
- Malformed or unexpected input, unavailable dependencies, and partial completion.
- Calls before initialization, after disposal, or under a different authority.
- Old and new consumers coexisting during rollout, including rollback after data migration.

For material risks, name prevention, detection, residual exposure, and recovery owner. Omit
irrelevant dimensions; do not fill a risk quota.

### Phase 5: Phased Implementation

Choose coherent phases with explicit prerequisites and observable exit conditions. Tie phase
proof to acceptance, not just a list of successful commands. Separate the decision-first reading
order from the dependency order an implementer must follow.

The Verification section uses [foundation-testing](../../../.agent/rules/foundation-testing.md),
Lifecycle-Aware Verification Gate and Evidence identity and cite-or-run, for applicable gates,
state validity, and reuse. Name project-equivalent methods and required runtime capabilities.
Carry pending lanes with owners and the transitions they gate. Required acceptance without
passing evidence blocks completion and integration by default. An explicit release-only policy
may defer that gate; it cannot mark pending evidence green.

## Definition of Done

The next implementer can identify the accepted outcomes, boundaries, file/resource scope,
execution dependencies, proof obligations, and recovery limits. Material assumptions retain their
status and a reason to revisit them.

Request direction only for a consequential unresolved choice outside existing authority. A
specification-only request ends here; an implementation grant may already cover the concrete plan.
The artifact ends with "What we deliberately did NOT do."
