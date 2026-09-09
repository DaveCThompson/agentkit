# Hydration Bridge

Load canonical truth from:

- `.agent/rules/tech-react.md` only for React targets
- `.agent/rules/foundation-accessibility.md`

Use this bridge only to focus the audit:

- Check date rendering, client-only state gates, and controlled-input wiring first.
- For React, inspect why `suppressHydrationWarning` is present and what mismatch it masks; distinguish an intentional exception from missing synchronization.
- Prefer project-specific hydration guards over generic React examples when the repo already defines the pattern.
