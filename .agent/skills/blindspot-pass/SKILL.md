---
name: blindspot-pass
description: Surface the unknown-unknowns before work starts in an unfamiliar code area or domain — landmines, hidden constraints, exemplars, and the expert questions to ask. Use when entering an unfamiliar module/subsystem/domain or when asked for a "blindspot pass".
tier: core
triggers: [blindspot, unknown unknowns, unfamiliar area, reconnaissance, recon]
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
Build understanding from the code graph + history before reporting (see `integrations/codebase-mcp.md`):
- `search_graph` / `get_architecture` for the area's shape and boundaries; `trace_path` for who
  depends on it (blast radius of a change here).
- `git log` / blame on the surface for prior decisions and churn hot-spots.
- Existing conventions and patterns already established in the area; for an unfamiliar *domain*, the
  domain's best-practices.
- Fallback to Grep/Read if the graph is unavailable; note the degrade.

### Phase 3: Report four sections
1. **Landmines** — the common errors someone new to this area makes, plus repo-specific gotchas
   (fragile exceptions, ordering constraints, `// WHY:` / `// CONSTRAINT:` markers).
2. **Hidden context** — prior decisions that constrain the work (why it is the way it is) — the ones
   a fresh reader would unknowingly violate.
3. **What good looks like** — 2–3 high-quality exemplars already in the codebase to calibrate against.
4. **Questions to ask** — 3–5 expert-level questions that would change the approach, each with your
   best initial answer drawn from the Phase 2 evidence (not a bare question list).

### Phase 4: Reframe the request
Restate the user's original goal, now incorporating the discovered constraints. The reframed request
is the handoff into `plan-feature` / `plan-architecture`.

## Verification / Definition of Done

- [ ] Every landmine / hidden-context claim is backed by a `file:line`, a commit, or a named
      convention — not asserted from intuition (cite-or-run, `foundation-testing.md` §1B).
- [ ] The four sections are present; questions carry initial answers.
- [ ] Output stops at understanding — no code, no edits.

## Constraints

- Diagnose only; this skill never implements. Prioritize architecture-changing traps over cosmetic
  detail.
- If recon shows the area is actually well-understood and low-risk, say so and stop — a blindspot
  pass that invents risk is noise.

## Output

A short report (the four sections + the reframed request), ready to feed a planning skill.
