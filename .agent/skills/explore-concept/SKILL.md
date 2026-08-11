---
name: explore-concept
description: Broad ideation and problem definition using Socratic questioning. Use for early-stage exploration when the problem isn't well-defined.
tier: core
---

# Explore Concept

Broad ideation and problem definition using Socratic questioning.

## When to Use
- Early-stage exploration
- Problem isn't well-defined
- Need to generate divergent ideas
- Clarifying requirements

## Approach

### Phase 1: Socratic Discovery
Ask 3-5 probing questions:
- What problem are we really solving?
- Who benefits and how?
- What does success look like?
- What constraints exist?

Reject vague answers — push for specificity.

### Phase 2: Divergent Ideation
Generate **10 divergent concepts** without constraints, then select top 3.

Make them genuinely different — **if two concepts would draw the same reaction from the user, replace
one.** Contrast is the point; near-duplicates waste the user's reaction.

For each:
- Core idea
- Key benefit
- Biggest risk

### Phase 3: Synthesis
Narrow to 1-2 directions worth exploring further. After the user reacts, **name the real requirement
behind what they rejected** ("you consistently rejected X → the real constraint is Y") — the
rejection pattern often defines the spec better than the pick does.

## Interview Mode (resolve ambiguity before building)
When planning/brainstorming is largely done but unknowns remain, switch from a question dump to a
one-question-at-a-time interview:
- Rank open questions by impact — architecture-changing first, then behavioral edge cases, then
  cosmetic — and ask the highest-impact one via `AskUserQuestion` with 2–3 concrete options + a
  recommendation. "You decide" is a valid answer.
- **Never ask what the code or existing docs already answer** — read first.
- Checkpoint periodically: restate the decisions so far as one consolidated list to prevent drift.
- Stop when the remaining unknowns are cheaper to discover during implementation than to investigate now.

## Constraints
- No code or implementation plans
- No premature convergence
- End with: "Which of these directions feels most aligned with our goals?"
