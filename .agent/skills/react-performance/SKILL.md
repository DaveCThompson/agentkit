---
name: react-performance
description: Use when investigating or improving React render cost, state propagation, memoization tradeoffs, bundle loading, or async priority boundaries.
tier: tech:react
---

# React performance

## When to use

Use as a React specialist within the user's current task. For findings-only work, use
`audit-performance`; for authorized remediation, use `performance-fix`. Keep the same finding,
scope and evidence through the handoff. This skill adds React methods, not another report or gate.

## Approach

### Load relevant context

Read applicable `foundation-performance.md` guidance, including `Bundle Size`, and `tech-react.md`.
Discover actual source roots, React/framework versions, compiler configuration and existing
profiling/build commands. Use available read/search tools; do not assume a vendor tool or a
conventional source-directory name.

Load only references relevant to the observed bottleneck:

| Symptom | Reference |
| --- | --- |
| Serial requests, delayed work, partial failures | [Async patterns](references/async-patterns.md) |
| Heavy initial payload, import cost, deferred features | [Bundle optimization](references/bundle-optimization.md) |
| Expensive hot-path JavaScript | [JavaScript micro-optimizations](references/js-micro-optimizations.md) |
| Layout work, DOM cost, render propagation | [Rendering patterns](references/rendering-patterns.md) |
| Unstable inputs, subscription churn, update priorities | [Re-render patterns](references/rerender-patterns.md) |

### Follow the cost to its cause

Start from the slow interaction or supplied measurement. Use the React Profiler for render
propagation and browser performance/network traces for scripting, layout, loading and paint.
Search can locate imports, effects, `await`, memoization and transition boundaries, but their
presence or absence is not a finding by itself.

Distinguish render attempts from commits and development checks from production cost. Trace
state ownership, context/store subscriptions, prop identity, effect-driven updates and hydration
boundaries. A broad context provider can notify many consumers; a compositional API alone does
not prove isolation. A transition changes update priority; synchronous code still occupies the
main thread. Inspect the expensive work before choosing a boundary.

Prefer a simpler state/data flow when it removes measured redundant work. Use `useMemo`,
`useCallback` or `React.memo` when stable inputs and avoided cost justify their maintenance and
memory costs. Check existing compiler behavior. Do not use memoization to hide incorrect effects
or incomplete dependencies.

### Measure the proposed change

Compare the same interaction, data size, build mode, device/throttling and cache state before and
after. Record versions and the relevant candidate identity. For bundles, inspect emitted chunks
and request timing; for responsiveness, measure the interaction, not just fewer renders. Repeat
noisy measurements enough to distinguish the effect from variance. Check behavior, errors,
loading states, accessibility and memory tradeoffs alongside latency.

Use `foundation-testing.md` for evidence validity. If profiling is unavailable, label source
observations as candidates and name the missing measurement. Do not invent numbers, elevate every
candidate to Critical/High, or force an optimization when the evidence supports no change.

## Definition of done

The requested analysis or scoped repair is delivered with a causal explanation, proportional
severity, comparable evidence where a gain is claimed, and remaining proof limits. Review stays
read-only; implementation continues only within the user's existing authority.
