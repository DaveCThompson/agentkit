# Hydration Bridge

Load canonical truth from:

- `.agent/rules/tech-react.md`
- `.agent/rules/foundation-accessibility.md`

Use this bridge only to focus the audit:

- Check date rendering, client-only state gates, and controlled-input wiring first.
- Treat `suppressHydrationWarning` as a last resort and audit any use as suspicious by default.
- Prefer project-specific hydration guards over generic React examples when the repo already defines the pattern.
