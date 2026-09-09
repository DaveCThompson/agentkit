---
name: explore-tech
description: Evaluate libraries, architectural approaches, and technical tradeoffs when the user wants a comparison or recommendation before selecting an implementation.
tier: core
required-tools: [codebase-mcp]
---

# Explore Tech

Kit references below are relative to the configured kit checkout, located from the existing
agentkit CLI/setup or a configured vendor hook. Read only references needed for the current
phase. If the checkout or a reference is unavailable, use the stated fallback and report any
required guidance as unresolved.

## When to Use

Use for technical choice, including architecture exploration. An architecture comparison stays
here; a converged brief needing a specification belongs to [plan-architecture](../plan-architecture/SKILL.md).

## Approach

### Phase 1: Problem Definition

Resolve the required outcome, current approach, accepted choices, and constraints that could
change the recommendation: compatibility, latency, throughput, payload, operations, cost,
maintainability, or team familiarity. Ask only for material unknowns not answered by the brief or
current sources.

For an existing codebase, locate the relevant APIs, dependency boundaries, and working examples.
Use `integrations/codebase-mcp.md` for graph mechanics when helpful.
Read exact current source before relying on a result. If relevant coverage is stale, make a
bounded refresh; if unavailable or still inconsistent, use targeted search/read and state the
coverage limit. An optional graph is not a planning prerequisite.

### Phase 2: Options Analysis

Compare viable alternatives, including extending the existing approach. One option with a
reasoned explanation is sufficient when constraints exclude the others.

For each, assess the differences that affect this decision:

- Fit with existing contracts, deployment/runtime support, and migration effort.
- Operational failure modes, maintenance burden, reversibility, and total cost.
- Expected performance and resource use, naming workload assumptions and missing measurements.

Cite decisive current source examples or primary documentation for factual comparisons. Verify
version-sensitive compatibility, support, and API claims against the applicable version's primary
docs. Label estimated effort and predicted performance as estimates; a polished comparison does
not establish a measured result.

### Phase 3: Recommendation

Explain why the preferred approach wins under the stated constraints, its strongest objection,
and the signal that would change the choice. Name a focused experiment if it could settle a
consequential uncertainty; do not require a benchmark for an immaterial difference.

## Boundaries

Evaluation may discuss an uninstalled library. Installing it, changing configuration, or building
a prototype requires scope that covers those actions. Follow [foundation-security](../../../.agent/rules/foundation-security.md)
for dependency authority. A recommendation alone does not grant it.

## Output and Definition of Done

Return the comparison, recommendation, evidence, accepted decisions, and unresolved assumptions
in the caller's destination or conversation. Preserve the distinction between a proposal and an
approved choice for the next consumer. No forced option count or closing approval question is
needed when the requested recommendation is complete.
