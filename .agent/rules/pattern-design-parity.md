---
trigger: glob
globs: "**/*.css"
tier: kind:app
domain: design-system
---

# Rule: Semantic Token Parity

## Context

Theme regressions occur when a required semantic role is unavailable or unreadable in a supported
theme. Discover the project's actual theme selectors, inheritance and token ownership rather than
assuming `:root` means light or that dark mode uses one particular attribute.

## Invariant

Every required semantic role must resolve to an intentional usable value in each supported theme
and relevant state. Equivalent explicit declarations are required only when the project's token
contract says so. Inherited values, shared aliases and deliberate theme-specific roles are valid;
CSS custom properties do not universally default to transparent.

## Enforcement

- When adding/changing a semantic role, trace its effective value and consuming property through
  the cascade, aliases, fallbacks and theme switches. Detect missing values, cycles and invalid
  substitutions, not only differing declaration-name sets.
- If the project mandates paired light/dark definitions, update both owning definitions and test
  that declared contract. Do not create unused status families or duplicate correct shared values
  solely to satisfy a count.
- Solid status surfaces need compatible foregrounds in every mode where used; test actual contrast
  and non-color cues for the supported statuses, including high-contrast/forced-colors behavior.
- Use existing token checks and rendered verification under `foundation-design-tokens.md` and
  `foundation-accessibility.md`. A source-name parity check alone is not theme correctness.
