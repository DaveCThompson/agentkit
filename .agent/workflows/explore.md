---
description: Exploration hub. Routes an ideation request to the matching explore-* skill before any plan is drafted.
---

# Explore Workflow

Hub router for deep exploration of UI, UX, tech, concept, or architecture — ideation and
evaluation *before* a plan is drafted.

## Goal
Route the request to the best specialized exploration skill and produce an options/evaluation
artifact, not an implementation plan.

## Inputs required (ask if missing)
- Domain: `ui`, `ux`, `tech`, `concept`, or `architecture`.

## Skill routing (explicit) — choose exactly one
- `ui` -> `explore-ui-design` (visual: layout, color, type, composition)
- `ux` -> `explore-ux` (interaction design, user flows, information architecture)
- `tech` -> `explore-tech` (libraries, patterns, performance trade-offs)
- `concept` -> `explore-concept` (Socratic problem framing, early-stage ideation)
- `architecture` -> route to `/architect` (this is a planning step, not open exploration)
- else -> ask which domain to explore.

## Procedure
1. Detect the domain from arguments.
2. Read the selected skill's `SKILL.md` and follow its exploration process.
3. If no domain is provided, present the menu of options above.

## Notes
- This is a hub only — there are no per-domain `explore-*` workflows; each maps straight to a skill.
- Exploration prioritizes divergent options; converge to a plan via `/plan` afterward.
