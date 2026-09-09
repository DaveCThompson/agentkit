---
name: explore-ui-design
description: Explore visual design alternatives when the user asks how a page or component should look. Compare layout, hierarchy, typography, color, and visual states.
tier: kind:app
---

# Explore UI Design

## When to Use

Use for visual decisions within an interaction model. Unresolved task flows belong to
[explore-ux](../explore-ux/SKILL.md); technical architecture belongs to
[explore-tech](../explore-tech/SKILL.md).

## Approach

### Phase 1: Context

Read the brief, prior choices, nearest relevant UI, and the project's actual design-system
contracts. Locate token definitions and styling conventions through the project index. Do not
assume a particular CSS strategy document exists. Establish audience, task, tone, and device
constraints only where they affect the design.

### Phase 2: Generate Options

Develop alternatives that expose meaningful visual tradeoffs:

- Structure and composition.
- Hierarchy through size, spacing, contrast, and typography.
- Rest, focus, hover, active, disabled, empty, loading, and error treatments where applicable.
- Transitions and motion, including interruption and reduced-motion expectations.
- Borders, elevation, density, and alignment with existing components.

Use sketches, annotated wireframes, or another available medium that makes the choice legible.
Token references are useful in a CSS-based project, but an ASCII sketch is not required.
Do not pad an option set with alternatives likely to produce the same reaction.

### Phase 3: Critique

Compare each option's task emphasis, consistency, token fit, implementation cost, and accessibility
risks. Specify concrete requirements such as visible focus, meaningful reading order, and
information that cannot depend on color alone. These are design expectations; runtime contrast,
keyboard, and assistive-technology checks remain pending until exercised.

### Phase 4: Recommend

Recommend a direction with rationale and the most important tradeoff. After feedback, distinguish
the user's stated preference from an inferred explanation of it. Carry the latter as a revisable
assumption; confirm only if it changes the result materially.

## Boundaries

Use the project's existing tokens and [foundation-design-tokens](../../../.agent/rules/foundation-design-tokens.md)
where applicable. Mark additions as "Proposed System Update"; do not present invented tokens as
available. With no established system, label the proposed visual vocabulary explicitly.
Design exploration does not authorize production code or design-system changes.

## Output and Definition of Done

Use conversation or the supplied destination. Return enough visual detail to assess the
recommendation, plus accepted choices, assumptions, proposed system changes, and pending checks.
Ask for a decision only if one remains material. The next planner must be able to distinguish
accepted requirements from visual hypotheses.
