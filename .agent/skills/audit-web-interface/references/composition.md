# Composition Bridge

Load canonical truth from:

- `.agent/rules/tech-react.md`
- `.agent/rules/pattern-code-standards.md`

Use this bridge only to focus the audit:

- Look for monolithic components hiding multiple modes behind boolean props.
- Prefer explicit composition and conductor-style structure when the JSX or state graph gets dense.
- Treat this as an audit lens, not a second source of architectural law.
