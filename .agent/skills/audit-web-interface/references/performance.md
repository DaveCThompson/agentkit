# Performance Bridge

Load canonical truth from:

- `.agent/rules/foundation-performance.md`
- `.agent/rules/tech-react.md` only for React targets
- `.agent/rules/foundation-design-system.md`

Use this bridge only to focus the audit:

- Prioritize layout thrash, unnecessary large renders, and critical-image loading before micro-optimizations.
- Prefer repo-consistent structure changes over speculative memoization advice.
- Treat static candidates as hypotheses. Use `audit-performance` when a measured impact claim or attribution is needed.
