---
name: blindspot-pass
description: Surface the unknown-unknowns before work starts in an unfamiliar code area or domain — landmines, hidden constraints, exemplars, and the expert questions to ask. Use when entering an unfamiliar module/subsystem/domain or when asked for a "blindspot pass".
tier: core
triggers: [blindspot, unknown unknowns, unfamiliar area, reconnaissance, recon]
required-tools: [codebase-mcp]
---

# Blindspot Pass

Surface the unknown-unknowns before the first edit, so a scoped foray into an unfamiliar area starts
from the map's known gaps instead of discovering them mid-implementation. Finding a landmine during
recon is cheap; finding it after you've built on top of it is not.

## When to Use

- Entering an unfamiliar module, package, or subsystem you have not worked in before.
- Entering an unfamiliar *domain* (design, video, infra, payments, auth) where the traps are not
  code-obvious.
- The user asks for a "blindspot pass" or to find their "unknown unknowns".

## When NOT to Use

- Whole-repo orientation at session start → `project-onboard` (read the routers, not one deep area).
- The problem itself is undefined and you need to diverge on ideas → `explore-concept`.
- Choosing between libraries or architectural approaches → `explore-tech`.
- You already know the area and just need a build plan → `plan-feature` / `plan-architecture`.

## Approach

### Phase 1: Establish context

- What is the user trying to accomplish in this area, and how familiar are they (and you) with it?
- Name the exact surface in scope: the module path, package, or domain.

### Phase 2: Explore the territory (evidence, not memory)

Use evidence suited to the scoped uncertainty:

- For structural code questions, use `use-codegraph` for the area's boundaries and dependencies.
  It owns reachability, freshness, query selection and fallback; the graph dependency is conditional
  on this code-discovery need.
- `git log` / blame on the surface for prior decisions and churn hot-spots.
- Read established conventions, accepted decisions and representative implementations. For a domain
  question, consult applicable primary documentation or supplied evidence and state its limits.
- Treat churn as a lead, not proof of fragility. Check the changed behavior and rationale before
  calling it a constraint. Use targeted source reads if graph discovery is unavailable.

### Phase 3: Report the material findings

Use these categories where they add information; empty categories need no invented findings:

1. **Landmines** — evidenced errors someone new to this area could make, plus repo-specific gotchas
   (fragile exceptions, ordering constraints, `// WHY:` / `// CONSTRAINT:` markers).
2. **Hidden context** — prior decisions that constrain the work (why it is the way it is) — the ones
   a fresh reader would unknowingly violate.
3. **What good looks like** — relevant exemplars and why their behavior or structure fits this task.
4. **Questions to ask** — unresolved questions that could change the approach, with an initial
   evidence-based answer or an explicit unknown.

Distinguish verified constraints, plausible risks and unresolved questions. For each material
uncertainty, state the consequence and cheapest useful check. End discovery when further checks
repeat known evidence, the relevant constraints are understood, or a task budget is reached;
name uncovered surfaces. No findings is a valid result.

### Phase 4: Reframe the request

Carry the original goal and exclusions into a handoff with discovered constraints, evidence and
remaining assumptions. An inference does not become an accepted requirement. Reuse the caller's
work item or conversation; a new planning artifact is not required. Return to the caller's
authorized work, using `plan-feature` / `plan-architecture` only when planning is needed.

## Verification / Definition of Done

- [ ] Claims cite inspected source/symbols, decisions, commits or applicable documentation;
      hypotheses remain labeled (see `foundation-testing.md`, "Evidence identity and cite-or-run").
- [ ] Material questions carry initial answers or unknowns, consequences and useful next checks.
- [ ] Output stops at understanding — no code, no edits.

## Constraints

- Diagnose only; this skill never implements. Prioritize architecture-changing traps over cosmetic
  detail.
- If recon shows the area is actually well-understood and low-risk, say so and stop — a blindspot
  pass that invents risk is noise.

## Output

A concise understanding handoff with findings, exemplars and remaining uncertainty. If a durable
report is requested, use its assigned path and end with `What we deliberately did NOT do`.
