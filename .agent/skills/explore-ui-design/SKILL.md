---
name: explore-ui-design
description: Explores visual design options (layout, color, typography, interactions). Use when user asks "how should this look?" or needs design alternatives for a component.
tier: kind:app
---

# Explore UI Design

Generate visual design options using Visionary → Pragmatist → Engineer role-switching.

## Socratic Gate
If request is vague, ask first:
- What problem does this solve?
- What existing patterns should it align with?

## Approach

### Phase 1: Context
- Design system context (the project's CSS-principles strategy doc — see `project-invariants.md`)
- Existing patterns to align with
- Mood/tone goals

### Phase 2: Generate Options (Visionary)
Create **3-4 distinct approaches** covering:
- Structure (layout, composition)
- Hierarchy (size, spacing, contrast)
- Interactivity (states, transitions, motion)
- Styling (borders, shadows, corners)

Make them genuinely different — **if two would draw the same reaction, replace one.** Contrast is
what lets the user discover a preference they can't yet state.

Use ASCII wireframes with `var(--token-name)` syntax.

### Phase 3: Critique (Pragmatist)
For each option: token usage, pattern adherence, accessibility implications.

### Phase 4: Recommend (Engineer)
Select with rationale, effort estimate (Low/Med/High).

## Reflexion
Before delivering:
- Every value traces to a design token?
- Looks cohesive with existing app?
- Accessibility considered?

## Constraints
- Use existing tokens; flag new ones as "Proposed System Update"
- No code generation
- No user flows (that's `exploring-ux`)

## Output
Discussion document ending with: "Which direction aligns with your goals?"

After the user reacts, **name the real requirement behind what they rejected** — the rejection
pattern often defines the spec better than the pick.
