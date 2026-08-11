# Animation Bridge

Load canonical truth from:

- `.agent/rules/pattern-motion.md`
- `.agent/rules/tech-framer-motion.md`
- `.agent/rules/foundation-accessibility.md`

Use this bridge only to focus the audit:

- Check reduced-motion handling before tuning any motion polish.
- Flag multiple animation owners on the same DOM region as a high-priority regression risk.
- Prefer the shared hero and reveal primitives over one-off inline motion logic.
