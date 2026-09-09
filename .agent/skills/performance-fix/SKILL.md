---
name: performance-fix
description: Remediate a supplied performance finding or investigate and fix a bottleneck when optimization is requested. Use audit-performance for analysis without code changes.
tier: core
conflicts-with: [audit-performance]
---

# Performance Fix

## When to Use

Use for requested optimization. [audit-performance](../audit-performance/SKILL.md) owns scan-only
assessment. A measurement or audit recommendation supplies evidence, not authority by itself.

## Approach

### Phase 1: Intake and Baseline

For a supplied finding, preserve its ID, evidence/state, requested subset, desired outcome, and
authorized surface. Recheck whether its workload and attribution still apply. Do not substitute
a smaller unrelated issue or rerun a whole audit by default.

For open discovery, establish a user-visible symptom or resource budget, then profile its
relevant path. Choose a representative workload and metric: task latency, throughput, CPU,
memory, query cost, transfer size, or a relevant rendering/loading measure.

Before selecting a fix, record baseline state, environment, inputs and scale, measurement method,
and conditions such as cold/warm cache, concurrency, build mode, and network limits. Repeat
enough to understand material variance; do not use a fixed run count or universal speed target.
A missing measurement makes a proposed bottleneck a hypothesis, not a demonstrated gain.

### Phase 2: Attribute and Select

Trace the expensive work to its cause. Distinguish time spent computing, waiting for I/O,
transferring, rendering, or contending for a resource. A missing optimization pattern is not itself
a performance defect.

Use techniques only where the evidence fits:

- Repeated computation: improve the algorithm or avoid repeated work before adding a cache.
- Cache: define keys, invalidation, ownership, size limits, privacy boundaries, and freshness.
- Database: inspect the actual query plan and selectivity; weigh read gains against write,
  storage, and migration costs before adding an index.
- Rendering: identify costly renders and unstable inputs before React memoization; measure its
  overhead as well as saved work. Use virtualization when list cost warrants it while preserving
  focus, navigation, and state.
- Frequent events: debounce or throttle only when delayed/dropped intermediate work preserves
  the interaction contract.
- Transfer/startup: inspect payload and critical-path dependencies before splitting code,
  deferring images, or changing loading behavior.
- Hot loops: examine data structures, unnecessary copying, repeated parsing, and complexity
  under representative input sizes.

Keep applicable project performance contracts. Verify version-sensitive tool/library behavior
against primary docs. Select by evidenced impact, risk, and authorized scope, not a line limit
or preferred technique. No useful finding is a valid outcome; costly important findings stay visible.

### Phase 3: Optimize

Make a coherent change aimed at the measured cause. Preserve correctness, compatibility, ownership,
and failure behavior. Explain non-obvious tradeoffs in the owning code or work item.

If the finding's premise is stale, record that disposition. If measurement is unavailable, name
the missing evidence and owner. Continue a specifically authorized speculative change only with
its impact explicitly unverified. Scope expansion follows existing action/target authority.

### Phase 4: Verify

Repeat the baseline workload and method on the changed state. Record before/after values,
variability, environment differences, and regressions in other important metrics. A smaller
microbenchmark does not establish an end-to-end improvement unless the attribution supports it.

Check correctness at the changed seam and apply
[foundation-testing](../../../.agent/rules/foundation-testing.md), Lifecycle-Aware Verification Gate and
Evidence identity and cite-or-run, for generic gates and state validity. Generic green checks
cannot establish a speedup. No improvement or a regression is a valid result; revise or remove
an unsuccessful owned optimization within scope and preserve its evidence.

### Phase 5: Report

Use the caller's work item and finding identity. If follow-up tickets are warranted by the task,
follow [pattern-docs-artifacts](../../../.agent/rules/pattern-docs-artifacts.md), Work Items and
Status-of-Record Contract. Use its stable TICKET identity; severity and priority are fields,
not filename order. Delegated authors return follow-ups to the assigned metadata owner.

Report measurements, attribution, actual changes, correctness proof, and remaining findings with
their evidence/owner. Do not claim a speed boost from expectations or create a PR as an automatic
reporting side effect.

## Definition of Done

The requested performance outcome has comparable evidence and applicable correctness proof, or
the report states no finding, no improvement, stale premise, or missing measurement accurately.
Pending required performance or runtime acceptance retains its owner and gated transition.
End durable reports with "What we deliberately did NOT do."
