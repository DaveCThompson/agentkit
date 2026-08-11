---
name: audit-performance
description: Detect performance problems and optimization opportunities. Scan-and-report ONLY; use performance-fix to remediate.
tier: core
conflicts-with: [performance-fix]
---

# Audit Performance

Measurement-first performance audit. Every finding starts from a measured number and a named
method — never from "this looks heavy." Diagnose only; no code changes.

> **Fix counterpart:** this skill is **scan-only** (evidence + report). To implement optimizations
> and write backlog tickets, use the `performance-fix` skill (Bolt). React-specific render tuning
> has its own deep-dive: `react-performance`.

## When to Use
- The app feels slow and you need to know *why* before touching code
- Before/after a change that could move Core Web Vitals
- Periodic budget check against documented perf targets

## When NOT to Use
- You already have a diagnosed bottleneck and want it fixed → `performance-fix`
- The question is "which library/approach is faster" → `explore-tech`

## Approach

### Step 0: Load Budgets & Invariants
Read `foundation-performance.md` and the project's perf budgets / source roots / breakpoint
conventions from `project-invariants.md`. A violation of a documented budget is automatically
**Critical** — everything else is ranked by measured impact.

### Step 1: Measure (the gate — no recommendations before this)
Capture the four Core Web Vitals with a **named method** and record method + values in the report:
- **LCP, CLS, TBT** — Lighthouse (lab). **A single run is noise**: mobile scores vary run-to-run
  (±9 points is normal; TBT/SI are worst). Require a multi-run average or a clear before/after
  delta before calling anything a regression or a win.
- **INP** — field data (CrUX/RUM) when available; otherwise DevTools Performance panel with real
  interactions. Lighthouse cannot measure INP.
- **Identify the actual LCP element** (DevTools Performance panel → LCP marker). Optimizing an
  image that is not the LCP element is wasted work — this single fact scopes the whole audit.
- **Identify long tasks** (>50 ms) and what script owns them. These are your INP/TBT suspects.

Runtime measurement is browser-driven: follow `foundation-browser-usage.md` for capability, profile,
lane ownership, and evidence selection.

### Step 2: Attribute
Trace each bad metric to a mechanism, with evidence:
- **LCP** → network waterfall: is the LCP resource discovered late (runtime-injected fonts/CSS,
  JS-gated visibility), unpreloaded, or competing with below-fold preloads?
- **CLS** → Layout Shift regions in DevTools: unsized media, late-loading fonts without fallback
  metrics, injected banners.
- **TBT/INP** → long-task attribution: hydration cost, oversized bundles, layout-thrashing
  animations (anything animating layout properties instead of transform/opacity).

### Step 3: Static Corroboration
Scan the project's source roots (see `project-invariants.md`) only to corroborate measured
problems: bundle analyzer output, image payloads and responsive delivery, font loading strategy,
lazy-loading of below-fold/route-level code, `sideEffects` declarations. A static smell with no
measured symptom is a **Low** note, not a finding.

## Findings Model
Report each finding as:
- **Severity** (Critical / High / Medium / Low) — driven by measured user impact, not code aesthetics
- **Evidence** — metric value, method, and file:line or resource URL
- **Failure scenario** — concrete: "hero image is the LCP element and loads at 4.2 s on 4G because…"
- **Expected impact** — which metric moves, roughly how much
- **Remediation pointer** — name the fix (for `performance-fix` to execute); do not implement it

Skip advisory-only noise: hover-transition "non-composited animation" flags and other
Lighthouse heuristics that have no mobile-user impact (see `foundation-performance.md` §7).

Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.

## Definition of Done
- [ ] LCP / INP / CLS / TBT recorded with named method and run count
- [ ] Actual LCP element and top long tasks identified
- [ ] Every High/Critical finding has a measured number behind it
- [ ] Budget violations from `project-invariants.md` flagged Critical
- [ ] Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.
- [ ] Report ends with prioritized handoff list for `performance-fix` — zero code changed
