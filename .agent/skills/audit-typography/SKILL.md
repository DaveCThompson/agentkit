---
name: audit-typography
description: Review typography consistency and usability on the requested text surfaces. Diagnose only; do not edit styles, fonts or copy. Use to ensure readable, consistent text styling.
tier: kind:app
---

# Audit Typography

Review typography consistency and usability.

## When to Use
- After adding new text elements
- Checking readability
- Ensuring token adherence

## Approach

### Step 1: Project Invariants (Required)
**Before auditing**, check `.agent/rules/` for project-specific constraints:
- the project's CSS-principles / typography strategy doc (path in `project-invariants.md`) — typography token mandates
- `.agent/rules/foundation-design-system.md` — typography rules (e.g., weight limits, font prohibitions)
- Report applicable invariant compliance and blocking policy separately from impact severity.

### Step 2: Focus Areas
- **Font Sizes**: Consistent use of `var(--font-size-*)` tokens
- **Font Weights**: Appropriate use of `var(--font-weight-*)` tokens
- **Line Height**: Readable line heights
- **Hierarchy**: Clear visual hierarchy (H1 > H2 > H3 > body)
- **Number Sets**: Lining figures for UI, oldstyle for body (if applicable)

### Step 3: Rendered Reading Conditions

Use `foundation-browser-usage.md` for runtime capability and evidence. Sample long and localized
text, narrow containers, zoom, wrapping/truncation, font loading and fallback fonts. Check that
essential labels and values remain available, line length and leading support the actual content,
and hierarchy survives those conditions. Assess numeric alignment where comparison matters.
Record font state, container/viewport, zoom and observed failure with its source location.
Static token compliance does not prove readability; report runtime gaps with the next check/owner.

### Checklist
- [ ] Font sizes follow the project's token policy and exceptions
- [ ] Font weights follow hierarchy guidelines
- [ ] Line heights appropriate for content type
- [ ] Headings have clear visual distinction
- [ ] Hardcoded font values assessed against applicable policy and computed usage

### Output
Findings report with specific file:line citations.
Each selected lens is `finding | checked-clean | not-applicable | not-verified`, with evidence,
scope and reason. Apply `foundation-testing.md` to evidence and missing coverage.

### Definition of Done

Readability and consistency findings have contextual evidence and impact, with policy gates stated
separately. Unrun reading conditions remain unverified. No typography or content changes were made.
Keep necessary redacted evidence in the caller's approved location and cite its identity.
