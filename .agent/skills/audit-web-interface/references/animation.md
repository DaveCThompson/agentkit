# Animation Bridge

Load canonical truth from:

- `.agent/rules/pattern-motion.md`
- `.agent/rules/tech-framer-motion.md` only when that library is present
- `.agent/rules/foundation-accessibility.md`

Use this bridge only to focus the audit:

- Check reduced-motion handling before tuning any motion polish.
- Trace competing writes to the same property and cancellation/interruption behavior before assigning impact.
- Prefer existing motion primitives when their behavior fits. Do not assume shared hero/reveal components exist.
