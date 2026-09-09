---
name: audit-design-system
description: Review adherence to design system (tokens, components, theming). Use to ensure consistency with SPEC files.
tier: kind:app
---

# Audit Design System

Review adherence to the selected design-system surfaces. Diagnose only; do not edit components,
tokens or configuration.

## When to Use
- After major UI changes
- Checking token usage
- Ensuring theming consistency

## Approach

### Step 1: Project Invariants (Required)
**Before auditing**, check project rules for design system constraints:
- `.agent/rules/foundation-design-system.md` — design system rules, spacing, component patterns
- `.agent/rules/foundation-design-tokens.md` — token definitions and generation workflow
- Report invariant compliance and blocking policy separately from impact severity.

### Step 2: Token Architecture (for optimization audits)
When the audit targets the token system itself (not just component adherence), inventory the token
namespace before judging individual components:
1. Extract custom-property definitions from the project's token-definition files (wherever
   `--name:` is defined — theme/primitives/semantics/component-token CSS) plus any local CSS.
2. Extract all `var(--name)` references from source (`**/*.{css,ts,tsx}`).
3. Treat runtime-injected variables as allowlisted only when a TS/TSX setter or third-party
   contract is cited.
4. Check apparently undefined `var()` references against cascade scope, inheritance, valid fallbacks,
   theme selectors, runtime setters and third-party contracts. Report unresolved required references
   as **phantom tokens** only with a demonstrated resolution failure or explicit static uncertainty.
5. Build a token-to-token reference graph; a token is live when consumed outside token files,
   runtime-set, or referenced by a live token.
6. Corroborate dead-token candidates against scoped consumers and runtime use. Equal values may
   express different semantic roles; do not recommend merging them solely because values match.
   Report naming drift against the actual project convention.
7. Check modern CSS contracts the project has adopted (cascade layers, OKLCH pairs, container
   queries, approved pilots).

### Step 3: Focus Areas
- **Color Tokens**: Correct use of `var(--color-*)` tokens
- **Component Usage**: Using existing components, not one-offs
- **Theming**: Light/dark mode support
- **Semantic Tokens**: Using semantic tokens over primitive

### Checklist
- [ ] Colors follow the project's semantic-token contract and documented exceptions
- [ ] Inline values respect the applicable token rule, including legitimate computed values
- [ ] Existing components reused where possible
- [ ] Shipped themes and material component states verified, or runtime evidence marked pending
- [ ] Custom properties follow naming convention

### Output
Findings report with specific file:line citations and token references.
Each selected lens is `finding | checked-clean | not-applicable | not-verified`. Name the scope,
evidence and reason; an unverified theme needs a check and owner under `foundation-browser-usage.md`.
A static token graph is not proof of computed styling. Use `foundation-testing.md` for shared
evidence requirements.

## Definition of Done

Token/component findings have contextual evidence, applicable policy and impact. Theme and runtime
coverage limits remain explicit. No design-system changes were made.
Keep necessary redacted evidence in the caller's approved location and cite its identity.
