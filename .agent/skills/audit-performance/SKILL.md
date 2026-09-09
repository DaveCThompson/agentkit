---
name: audit-performance
description: Detect performance problems and optimization opportunities. Scan-and-report ONLY; use performance-fix to remediate.
tier: core
conflicts-with: [performance-fix]
---

# Audit Performance

Measure a performance symptom and trace its cause on the requested surface. Diagnose only; use
`performance-fix` for authorized remediation and `explore-tech` for approach comparisons.
Static risks may be reported, but they are not measured regressions or demonstrated speedups.

## When to Use

Use for unexplained slowness, a suspected regression or a scoped budget review.
For React-specific render investigation, consult `react-performance` only when React is present.

## Approach

### Step 0: Load Budgets & Invariants

Read `foundation-performance.md` and applicable project budgets. Identify target state, workload,
environment and user-visible outcome. A CLI, database or service needs its own relevant throughput,
latency, memory or resource measure; do not impose a web checklist.
Separate budget compliance and blocking policy from measured impact severity.

### Step 1: Measure

Record tool/version, environment, workload/data, warm/cold cache conditions, sample count and
variability. Use comparable conditions and repeated samples sufficient to distinguish the claimed
effect from noise. A single run is an observation, not automatically a regression verdict.

For web surfaces, [Core Web Vitals](https://web.dev/articles/vitals) are **LCP, INP and CLS**.
**TBT** is a supporting lab metric, not another Core Web Vital. Label field data, lab results and
individual interaction samples separately. Lighthouse navigation runs can report LCP/CLS/TBT;
they do not establish field INP. Use relevant field data or interaction traces for responsiveness,
and state which was available.

Identify the actual LCP element when investigating LCP. Attribute
[long tasks](https://web.dev/articles/optimize-long-tasks) (over 50 ms) and interaction phases
when investigating INP/TBT. Improvements to another resource may matter, but cannot be credited as
LCP improvement without evidence. For runtime capabilities and missing browser proof, follow
`foundation-browser-usage.md`.

### Step 2: Attribute

Trace a poor result to its mechanism:

- LCP: resource discovery, request timing, transfer, competing work and render delay.
- CLS: the shifting elements and causes such as missing media dimensions, font changes or
  injected content. Distinguish observed shifts from a complete field measurement.
- Responsiveness: input delay, processing and presentation; use task, layout and paint attribution.
- Non-web targets: query plans, I/O, allocation, contention, repeated work or dependency latency
  matched to the actual workload.

State alternatives and counterevidence. A layout-property animation or a large bundle suggests
where to investigate; it does not by itself establish user impact.

### Step 3: Static Corroboration

Inspect the responsible source and applicable build artifacts: bundle composition, image payloads,
font delivery, code loading, database access or resource lifetime. Distinguish scanner heuristics
from measured defects. Triage advisory animation flags against the target workload instead of
dismissing them universally. Do not invent expected percentage gains.

## Findings Model and Repair Handoff

Preserve the caller's finding/work identity. Each finding carries:

- Target/source state, affected workload, metric and method, baseline and variability.
- Mechanism and source/resource location, supporting evidence and remaining uncertainty.
- Impact severity, applicable budget and blocking policy.
- Proposed repair and intended outcome; expected benefit stays a hypothesis until measured.
- Comparable after-measurement method and correctness checks for the repair consumer.

A supplied finding remains the selected issue. Recheck stale premises and retain costly unresolved
findings with an owner; do not replace them with easier unrelated work.
Evidence does not confer repair authority. `foundation-testing.md` owns proof validity and
lifecycle gates; passing code checks cannot substitute for comparable performance evidence.

## Definition of Done

Each selected lens is `finding | checked-clean | not-applicable | not-verified`, with scope,
evidence and reason. Missing measurements name the next check/owner. No measured improvement,
no findings, and an unresolved bottleneck are valid bounded results.
Store necessary redacted evidence in the caller's approved location and return the scoped handoff
to `performance-fix`. No application code or performance configuration changed.
