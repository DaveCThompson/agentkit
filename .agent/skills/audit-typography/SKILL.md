---
name: audit-typography
description: Review typography consistency and usability. Use to ensure readable, consistent text styling.
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
- Flag any violation of documented invariants as **Critical** priority.

### Step 2: Focus Areas
- **Font Sizes**: Consistent use of `var(--font-size-*)` tokens
- **Font Weights**: Appropriate use of `var(--font-weight-*)` tokens
- **Line Height**: Readable line heights
- **Hierarchy**: Clear visual hierarchy (H1 > H2 > H3 > body)
- **Number Sets**: Lining figures for UI, oldstyle for body (if applicable)

### Checklist
- [ ] All font sizes use tokens
- [ ] Font weights follow hierarchy guidelines
- [ ] Line heights appropriate for content type
- [ ] Headings have clear visual distinction
- [ ] No hardcoded font values

### Output
Findings report with specific file:line citations.
Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.
Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.
