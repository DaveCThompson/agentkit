---
trigger: glob
globs: "**/*.tsx"
tier: kind:app
domain: a11y
---

# Accessibility (A11y) Foundations

Preserve accessible meaning and operability across supported inputs and states. Apply WCAG 2.2
AA and explicit project requirements; distinguish standard criteria from local component, heading
and visual conventions. These semantics also apply beyond TSX.

Read the project's accessibility/design guidance where available. Use `audit-accessibility`
for criterion-specific review and `foundation-testing.md` for evidence and coverage limits.

## 1. Semantic Structure

- Use landmarks for their meaning: main content, major navigation and complementary content.
  A visually positioned sidebar is not automatically an `aside`. Label repeated landmarks when
  needed to distinguish them; preserve an identifiable main content region.
- Use headings to express actual section relationships, with descriptive names and levels.
  Prefer a clear page heading and avoid skipped levels when opening subsections. Returning from
  an h4 subsection to an h2 section is valid. Exactly one h1 is a useful project convention,
  not a standalone WCAG requirement. Do not invent hidden headings merely to satisfy a count.
- Shared heading components must support the level required by their context. Inspect the real
  API/default before choosing a prop; no universal `Heading` component or default exists.
  Use the project's visually hidden utility when a real label/heading needs that treatment.
- List items belong in `li` elements; do not put layout `div` wrappers between a list and its items.
  HTML also permits script-supporting elements in `ul`/`ol`; validate the rendered content model.
- Exclude purely decorative icons from the accessibility tree, for example with `aria-hidden="true"`.
  Meaningful images/icons need an appropriate alternative. Do not hide focusable controls or add
  redundant presentation roles to silence a scanner.

See [HTML list semantics](https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element)
and [WAI heading guidance](https://www.w3.org/WAI/tutorials/page-structure/headings/).

## 2. Interactive Controls

- Prefer native buttons, links and form controls. Preserve name, role, state and value when using
  custom controls. Use `aria-checked` for a custom radio/checkbox, `aria-pressed` for a toggle
  button, and the applicable widget pattern rather than replacing native semantics with ARIA.
- Associate inputs with accessible labels. Icon-only controls need a name via text, a real label,
  `aria-labelledby` or an appropriate `aria-label`; a tooltip alone is not dependable labeling.
  Use an existing label primitive if it implements that relationship. Keep visible and accessible
  names consistent, and associate instructions and validation errors with their fields.
- Keep keyboard focus visible and logically ordered. Composite widgets can use arrow navigation
  within a Tab stop; modal containment needs dismissal and sensible focus return. Do not remove
  the browser outline without a working replacement. Focus must not be entirely obscured by
  author-created content under WCAG 2.2 AA 2.4.11. Enhanced 2.4.12 and appearance 2.4.13 are AAA.
- Follow project focus tokens when they meet applicable contrast/visibility requirements in
  actual themes and backgrounds, including forced colors. Grey or brand color alone proves neither
  compliance nor failure. Check contrast after compositing transparency.
- Controls may be monochrome or colored. Convey state beyond color alone and test necessary visual
  information against adjacent colors under 1.4.11, including its exceptions. Assess target size,
  drag alternatives and authentication support where the interaction requires them.

## 3. Motion & Hydration

- Respect reduced-motion preferences through a static or reduced-motion alternative appropriate
  to the interaction. Do not universally set every duration to zero: preserve necessary state
  changes, completion signals and understandable feedback when animation is skipped or interrupted.
  Apply WCAG pause/stop/hide and flashing requirements where relevant; reduced-motion support
  alone does not establish them.
- Keep essential content usable when JavaScript, a reveal gate or hydration fails. Prefer server
  and initial-client markup that agree. Use client-only boundaries for browser-dependent state;
  a blanket `hasHydrated` guard can hide content or introduce shifts. Reserve required layout space
  and verify delayed startup, preference changes and failure paths.
- Provide a way to bypass repeated blocks. A visible-on-focus skip link is a common solution;
  its destination must exist and move navigation to the intended content. Reuse the project's
  target ID rather than prescribing `#main-content` everywhere.

## 4. Composition & Primitives

- Preserve required ARIA, event handlers, disabled behavior and ref access at the actual control
  when composing primitives. Merge handlers deliberately; prop spreading alone does not ensure
  correct ordering or prevent accidental overrides. Avoid nested interactive elements.
- Use the framework/library version's ref contract where composition needs a DOM ref. React 18
  function wrappers commonly use `forwardRef`; React 19 supports ref as a prop. A ref provides
  element access; forwarding ARIA props and handlers is a separate obligation. See
  [React ref guidance](https://react.dev/reference/react/forwardRef).

## 5. Implementation Details

Inspect the rendered DOM and accessibility tree, not component names alone. For a page with
repeated navigation, connect its bypass control to its main region; let the router manage focus
after navigation according to project policy. Keep loading, empty, success and error states
distinct. Announce meaningful asynchronous status without forcing focus or announcing every
decorative animation frame. Test labels and field errors in the actual form composition.

## 6. Verification

### Invariants (Automated)

- Use an available semantic/ARIA linter, HTML validator or accessibility scanner for relevant
  markup and states. Record coverage, exclusions and incomplete results.
- Text search can locate candidate unlabeled icons, invalid list wrappers or outline removal.
  It cannot establish accessible names, computed contrast, DOM validity or keyboard behavior.
- Check actual token definitions and resolved styles when verifying a project visual requirement.

### Logic (Manual/Reasoning)

- Traverse affected flows by keyboard, including activation, dismissal, focus return and errors.
- Inspect names/roles/states and announcements with supported assistive technology.
- Measure applicable text/control contrast across themes and states. Check zoom/reflow, text
  spacing, touch targets and reduced-motion behavior where affected.
- Cite the exact [WCAG criterion](https://www.w3.org/TR/WCAG22/), level and exceptions for a
  standards finding. Report local policy separately. Missing runtime checks remain unverified;
  a clean automated scan is not complete WCAG conformance.

## See Also

- `foundation-design-tokens.md` — token scope, focus and theme verification.
- `foundation-design-system.md` and project overlays — applicable visual/component conventions.
- `pattern-ui-copy.md` — concise labels and feedback that retain accessible meaning.
