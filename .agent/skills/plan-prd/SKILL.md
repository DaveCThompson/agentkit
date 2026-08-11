---
name: plan-prd
description: Create a product-requirements and UX-spec artifact for large features when the user problem, states, or interaction model still need definition before architecture planning.
tier: core
---

# Plan PRD

UX Researcher approach: Discover → Diverge → Debate → Specify → Validate.

## Socratic Gate
If request is vague, ask first:
- What's the core user problem?
- Who benefits?
- What does success look like?

## Approach

### Phase 1: Discovery
1. **Proof of Understanding**: One-sentence problem summary
2. **User Stories**: "As [user], I want [action], so that [benefit]"
3. **Non-Goals**: Explicit out-of-scope items

### Phase 2: Design Options
Generate **4-6 distinct options** varying:
- Information architecture
- Interaction model
- Visual hierarchy

For complex decisions, use Socratic Debate (Proponent → Adversary → Synthesis).

### Phase 3: Specification

**State Matrix:**
**State Matrix**:
- **Default** — Visual: [...], Behavior: [...]
- **Hover** — Visual: [...], Behavior: [...]
- **Focus** — Visual: [...], Behavior: [...]
- **Active** — Visual: [...], Behavior: [...]
- **Disabled** — Visual: [...], Behavior: [...]
- **Empty** — Visual: [...], Behavior: [...]
- **Loading** — Visual: [...], Behavior: [...]
- **Error** — Visual: [...], Behavior: [...]

**Wireframes:** ASCII with `var(--token-name)` syntax.

**Accessibility:** Keyboard nav, ARIA, screen reader, reduced motion.

### Phase 4: Validate
- UX Risks & Mitigations table
- Definition of Done checklist

## Reflexion
Before delivering:
- Keyboard-only user can complete?
- Screen reader announces correctly?
- Color alone conveys meaning? (Flag if yes)

## Constraints
- No technical architecture (that belongs in `plan-architecture`)
- Flag hallucinated tokens as violations

## Output
`docs/working/PRD-{name}.md` containing the requirements and ending with: "Ready for architecture
planning?" (A PRD is a lifecycle artifact — it specifies the to-be and is dissolved on landing per
`governance/docs-standard.md` §a; it is never promoted whole into the KB.)

The PRD MUST include, before that closing line:
- **Acceptance criteria** — testable conditions that define "done" for each requirement (the seam the later `plan-architecture` / `plan-feature` Verification section builds on).
- **Rollout risk** — how success will be measured and what user-facing risk shipping carries.
