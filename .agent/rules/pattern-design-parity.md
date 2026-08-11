---
trigger: glob
globs: "**/*.css"
tier: kind:app
domain: design-system
---

# Rule: Semantic Token Parity

## Context
We maintain a rigorous design system with Light and Dark modes. A common regression involves adding a token to one mode (usually the active dev mode) and forgetting it in the other.

## Invariant
**Every semantic token defined in the `:root` (Light Mode) block MUST have a corresponding definition in the `[data-theme='dark']` block, and vice-versa.**

## Enforcement
- When adding a new semantic token (e.g., `--surface-bg-new`), IMMEDIATELY add it to both blocks.
- Do not rely on "defaulting to transparent" for status colors. Explicitly define them (even if just to a neutral fallback) to strictly control visibility.
- **Solid Surfaces**: Ensure `*-solid` tokens are defined for all status types (Error, Warning, Success, Info) in both modes to allow for inverted text colors.
