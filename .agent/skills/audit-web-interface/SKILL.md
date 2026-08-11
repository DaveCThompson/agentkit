---
name: audit-web-interface
description: Review UI code for Vercel Web Interface Guidelines compliance. Use when reviewing CSS, components, or checking accessibility, forms, animation, typography, or performance patterns.
argument-hint: <file-or-pattern>
tier: tech:web
---

# Web Interface Guidelines Audit

Review files for compliance with Web Interface Guidelines.

**Files to review:** $ARGUMENTS

## Quick Reference

**Quick Reference Checklist**:

- **Accessibility** — aria-labels, semantic HTML, focus states. See: `references/accessibility.md`
- **Animation** — `prefers-reduced-motion`, compositor property targeting. See: `references/animation.md`
- **Composition** — Radix-style primitives, state decoupling. See: `references/composition.md`
- **Forms** — labels, autocomplete, error handling patterns. See: `references/forms.md`
- **Images** — dimensions, lazy loading, priority markers. See: `references/images.md`
- **Hydration** — controlled inputs, date guards. See: `references/hydration.md`
- **Interactive States** — hover, active, focus feedback. See: `references/interactive-states.md`
- **Performance** — virtualization, layout thrashing prevention. See: `references/performance.md`
- **Typography** — ellipsis, quotes, text-wrap. See: `references/typography.md`

These `references/` files are bridge notes for this skill. Canonical project truth still lives in `.agent/rules/*.md` and `docs/knowledge-base/*`.

## Additional Categories (inline)

### Navigation & State
- URL reflects state—filters, tabs, pagination in query params
- Links use `<a>`/`<Link>` (Cmd/Ctrl+click support)
- Destructive actions need confirmation or undo

### Touch & Interaction
- `touch-action: manipulation` (prevents double-tap zoom)
- `overscroll-behavior: contain` in modals
- `autoFocus` sparingly—desktop only

### Dark Mode
- `color-scheme: dark` on `<html>`
- `<meta name="theme-color">` matches background

### Locale
- Use `Intl.DateTimeFormat` for dates
- Use `Intl.NumberFormat` for numbers

### Content & Copy
- Active voice: "Install the CLI" not "The CLI will be installed"
- Sentence case by default; follow an established product style when one exists
- Buttons use concise actions; include the object only when context does not make it clear
- Add UI text only when it clarifies an action, state, decision, risk, or accessibility need
- Tooltips explain non-obvious, non-critical controls; critical instructions must remain visible
- Error messages state the problem and next action, with the cause when known and useful
- Use consistent terms for the same object or action


## 2. Context Loading (Active Router)
This skill is a router. You must load the relevant Verification checklists before auditing.

1.  **System Rules**: Read [.agent/rules/foundation-design-system.md](../../../.agent/rules/foundation-design-system.md) (Section `## Verification`).
2.  **React Rules**: Read [.agent/rules/tech-react.md](../../../.agent/rules/tech-react.md) (Section `## Verification`).
3.  **A11y Rules**: Read [.agent/rules/foundation-accessibility.md](../../../.agent/rules/foundation-accessibility.md) (Section `## Verification`).
4.  **Token Rules**: Read [.agent/rules/foundation-design-tokens.md](../../../.agent/rules/foundation-design-tokens.md) (Section `## Verification`).
5.  **Skill Bridge Notes**: Read only the `references/*.md` files that materially apply to the audit target.
6.  **Copy Rules**: If the target contains product UI text, read `.agent/rules/pattern-ui-copy.md`.

## 3. Execution (The Verification)
For each file in `Files to review`:
1.  Run the **Invariant (Automated)** checks from the loaded rule sections (e.g. `grep "margin:"`).
2.  Evaluate the **Logic (Reasoning)** checks from the loaded rule sections.
3.  Log any violations in the Output Format below.
4.  If multiple rules conflict, `patterns/*` trump `foundations/*`.
5.  Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.

## Output Format

Group by file. Use `file:line` format. Terse findings.
Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.

```text
## src/Button.tsx

src/Button.tsx:42 - icon button missing aria-label
src/Button.tsx:55 - animation missing prefers-reduced-motion

## src/Card.tsx

✓ pass
```
