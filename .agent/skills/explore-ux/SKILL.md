---
name: explore-ux
description: Explore interaction design, user flows, and information architecture when the user asks how people should complete a task or navigate a product.
tier: kind:app
---

# Explore UX

## When to Use

Use for task flow and interaction choices. Visual treatment belongs to
[explore-ui-design](../explore-ui-design/SKILL.md); technical architecture belongs to
[explore-tech](../explore-tech/SKILL.md).

## Approach

### Phase 1: User Context

Read supplied research, existing flows, and prior decisions. Identify the user's goal, mental
model, knowledge, device, and urgency. Separate observed behavior from assumptions. Ask only
about uncertainty that changes the flow.

### Phase 2: Flow Options

Compare viable ways to complete the task, including the existing flow when useful. For each,
trace entry, action, feedback, success, and recovery. Assess cognitive load and discoverability
alongside steps or clicks; fewer steps do not necessarily mean less effort.

For consequential actions, specify confirmation at the point of consequence, cancellation,
undo limits, partial success, retries, and loss of context. Explain what a returning user sees
after interruption. Preserve prior user choices instead of generating a fresh quota of flows.

### Phase 3: Compare

Use a compact flow or table when it makes differences easier to assess. Compare evidence,
likely friction, recovery cost, and explicit accessibility requirements.

Describe keyboard operation, focus movement and restoration, accessible names, status
announcements, and alternatives to pointer-only interaction where relevant. Record known risks
and pending checks. Do not label an unbuilt flow simply "Accessible: yes"; design intent and
runtime assurance are separate.

### Phase 4: Recommend

Name the preferred flow, strongest objection, edge cases, and assumptions that could change it.
Check whether a first-time user can discover the main action and recover from failure.
Use available evidence to support usability claims; untested expectations stay hypotheses.

## Output and Definition of Done

Return the flow and recommendation in conversation or the caller's destination, with explicit
decisions, user-knowledge assumptions, and unresolved checks. A separate document and a final
confirmation question are optional.

The exploration is complete when its tradeoffs are assessable or a specific missing fact is
identified. Carry accepted decisions and uncertainty into any already authorized planning work.
This skill does not authorize implementation.
