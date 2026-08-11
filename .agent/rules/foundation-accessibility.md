---
trigger: glob
globs: "**/*.tsx"
tier: kind:app
domain: a11y
---

# Accessibility (A11y) Foundations

> **Related Knowledge Base:** docs/knowledge-base/SPEC-accessibility.md (motion sensitivities, keyboard navigation, screen readers).

Global standards for inclusive design.

## 1. Semantic Structure
*   **Landmarks:** Use `<aside>` for Sidebars, `<main>` for Workspace, `<nav>` for Navigation.
*   **Lists:** `<ul>` and `<ol>` must ONLY contain `<li>` children.
*   **Headings:** Strict sequential descending hierarchy. `h1` (Page) → `h2` (Section) → `h3` (Sub-section) → `h4` (Item). NEVER skip levels. Every page must have exactly one `h1`.
    *   The `<Heading>` component defaults to `as="h2"` when no `as` prop is supplied. Always pass `as` explicitly to prevent accidental h2 avalanches inside h2 sections.
    *   Shared components that render headings (e.g. card titles) must use the level appropriate for the page context — use a `headingAs` or `as` prop if the component is reused at different levels.
    *   For visually hidden h1 or bridging h2 entries (e.g. when the page hero supplies context but not a semantic heading), use `className="sr-only"` — the global utility class in `apps/<app>/app/globals.css`.
*   **Decorative Icons:**
    *   MUST use `aria-hidden="true"`.
    *   If using semantic tags (like `span` or `i`), add `role="presentation"` to prevent role mismatch warnings.

## 2. Interactive Controls
*   **Review Roles:** Use `aria-checked` for radios, `aria-pressed` for toggle buttons.
*   **Hidden Labels:** Use `FieldLabel` with `hideLabel` prop (sr-only) for icon-only inputs.
*   **Focus Rings:** ALWAYS use `--control-focus-ring-standard` (Grey-300). Never generic blue.
*   **Neutral Visuals:** Foundational controls (Checkboxes) must use high-contrast monochromatic themes.

## 3. Motion & Hydration
*   **Reduced Motion:** Respect `prefers-reduced-motion`. Use `useReducedMotion()` hook to strict duration to 0.
*   **Hydration:** Guard client-side state with `hasHydrated` checks to prevent layout shifts.
*   **Skip Links:** Implement "Skip to main content" at the top of the App. Target `#main-content`.

## 4. Composition & Primitives
*   **Ref Forwarding:** All interactive utility components (like `Tooltip`) MUST use `forwardRef`. This allows parent composition libraries (like Radix `Popover`) to inject correct ARIA attributes (e.g., `aria-haspopup`) onto the trigger.
*   **Prop Spreading:** Always spread `...props` to the underlying interactive element to ensure event handlers and ARIA attributes are preserved.

## 5. Implementation Details
*   **App Structure:**
    ```tsx
    <div className="appContainer">
      <Sidebar /> {/* <aside> */}
      <main id="main-content">...</main>
    </div>
    ```
*   **List Validity:** `<ul>` must ONLY contain `<li>`. Wrapper `divs` around items are forbidden. Move logic outside the list.

## 6. Verification

### Invariants (Automated)
- [ ] **Icon Buttons**: `grep "<button.*>.*<svg"` (Must have `aria-label` or `sr-only` text).
- [ ] **List Structure**: `grep "<ul.*>.*<div"` (Lists must only contain `li`).
- [ ] **Focus Rings**: `grep "outline-"` (Ensure custom focus rings differ from browser default if standard is overridden).

### Logic (Manual/Reasoning)
- [ ] **Landmarks**: Are you using `<main>`, `<nav>`, `<aside>` correctly?
- [ ] **Keyboard Nav**: Can you tab through the new feature? Is the focus order logical?
- [ ] **Reduced Motion**: If an element moves, does it check `prefers-reduced-motion`?

---

## See Also
- `foundation-design-system.md` — For Focus Ring tokens and motion physics.
- `domain-content.md` — For inclusive copy and label standards.
