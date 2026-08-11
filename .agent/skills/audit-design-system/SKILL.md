---
name: audit-design-system
description: Review adherence to design system (tokens, components, theming). Use to ensure consistency with SPEC files.
tier: kind:app
---

# Audit Design System

Review adherence to the design system.

## When to Use
- After major UI changes
- Checking token usage
- Ensuring theming consistency

## Approach

### Step 1: Project Invariants (Required)
**Before auditing**, check project rules for design system constraints:
- `.agent/rules/foundation-design-system.md` — design system rules, spacing, component patterns
- `.agent/rules/foundation-design-tokens.md` — token definitions and generation workflow
- Flag any violation of documented invariants as **Critical** priority.

### Step 2: Token Architecture (for optimization audits)
When the audit targets the token system itself (not just component adherence), inventory the token
namespace before judging individual components:
1. Extract custom-property definitions from the project's token-definition files (wherever
   `--name:` is defined — theme/primitives/semantics/component-token CSS) plus any local CSS.
2. Extract all `var(--name)` references from source (`**/*.{css,ts,tsx}`).
3. Treat runtime-injected variables as allowlisted only when a TS/TSX setter or third-party
   contract is cited.
4. Report undefined `var()` references as **phantom tokens** with `file:line` usage evidence.
5. Build a token-to-token reference graph; a token is live when consumed outside token files,
   runtime-set, or referenced by a live token.
6. Report dead tokens, duplicate-value groups, and naming-dialect drift.
7. Check modern CSS contracts the project has adopted (cascade layers, OKLCH pairs, container
   queries, approved pilots).

### Step 3: Focus Areas
- **Color Tokens**: Correct use of `var(--color-*)` tokens
- **Component Usage**: Using existing components, not one-offs
- **Theming**: Light/dark mode support
- **Semantic Tokens**: Using semantic tokens over primitive

### Checklist
- [ ] All colors use semantic tokens
- [ ] No inline styles with hardcoded values
- [ ] Existing components reused where possible
- [ ] Light and dark mode verified
- [ ] Custom properties follow naming convention

### Output
Findings report with specific file:line citations and token references.
Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.
Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.
