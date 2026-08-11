---
trigger: glob
globs: "**/*.css"
tier: kind:app
domain: design-system
---

# System Foundations

> **Related Knowledge Base:** the project's design-system spec (semantic color logic, theme
> switching, concentric corners) — path in `project-invariants.md`.

Core physics and non-negotiables of the Design System.

## 1. Zero Hex Tolerance (CRITICAL)
*   **Rule:** Modern UI styling **MUST** use existing tokens from `foundation-design-tokens.md` and the generated primitives stylesheet.
*   **Constraint:** Hardcoded hex codes (e.g. `#fff`) are a **CRITICAL** failure.
*   **Action:** If a theme variable is missing, fix the theme, do not fallback to hex.

## 2. File & Directory Casing
*   **Strict Kebab-Case Mandate:** All files and directories within the source tree MUST follow **strictly kebab-case** (e.g., `user-profile.tsx`, `prompt-input-field.module.css`).
*   **Hooks Exception:** React hooks MUST use `camelCase` (e.g., `use-is-mac.ts` is forbidden; use `useIsMac.ts`).
*   **Why:** Prevents "Failed to fetch dynamically imported module" errors on case-insensitive file systems (Windows/macOS) and ensures consistency across environments.
*   **Enforcement:** Managed by `eslint-plugin-check-file` and verified via `npm run lint`.

## 3. CSS Modules & Styling
*   **Selectors Match DOM:** When refactoring JSX, update the corresponding CSS Module.
*   **Child Targeting:** Solve nested hovers with child targeting (`.wrapper:hover > .child`).
*   **No Inline Styles:** Component styles must be in CSS Module files.
*   **HTML Email Exception:** Dedicated HTML email renderers may use inline styles and literal fallback colors when client compatibility requires it. Keep this exception tightly scoped to copied/exported email markup, not normal app UI.
*   **Composes:** Extract shared styles to a base module and use `composes`.
*   **Gaps:** Use `gap` for spacing in flex/grid containers, avoid extensive margin hacks.

## 4. Layout & Spacing
*   **Gap-First Layouts:** For primary containers, use `display: flex; flex-direction: column; gap: var(--spacing-*)`.
    *   Outer Rhythm: `var(--spacing-6)` (24px).
    *   Inner Rhythm: `var(--spacing-3)` (12px).
    *   Atomic Rhythm: `var(--spacing-1)` (4px).

### Background Hierarchy (The Unwrapped Strategy)
1.  **App Wrapper:** `--surface-bg-tertiary` (Dark frame).
2.  **Workspace/Canvas:** `--surface-bg-secondary` (Flat).
3.  **Content/Output:** `--surface-bg-primary` (High contrast, "Raised").
    *   *Goal:* Visual progression from Frame -> Workspace -> Result.

*   **Concentric Radii:** `container_radius = inner_element_radius + padding`.
    *   Example: Button (10px/`md`) + Padding (4px/`spacing-1`) = Container (14px/`xl`).
    *   **Premium Card Wrapper:** Use a `6px` (`var(--spacing-1p5)`) offset with `var(--radius-2xl)` for the wrapper and `var(--radius-lg)` for the inner card.

## 5. Motion Physics
*   **Goal:** "Snappy but Fluid."
*   **Reduced Motion:** Always respect `prefers-reduced-motion`. Set durations to `0s`.
*   **No Drift:** Animations must start/end on pixel-perfect grid lines.
*   **Scannability:** Never animate hover states on "Scanning Surfaces" (Sidebar items, Menus).

## 6. Spacing Invariants
*   **Zero-Margin:** All components **MUST** have 0px external margins. Spacing is managed by parent `gap` or `padding`.
*   **No Magic Numbers:** Hardcoded pixel values (e.g., `margin-top: 15px`) are forbidden. Use tokens.

## 7. Icons & Typography
*   **Explicit Icon Architecture:** `font-variation-settings` is atomic. Use `data-fill="true"` for state changes.
*   **Optical Sizing:** Small icons (<20px) MUST use a font range starting at 15px (not 20px).
*   **Button Icons:** Explicitly set to **20px** by default.
*   **Typography:**
    *   Labels: `text-xs`, `font-weight-semibold`.
    *   Content: `text-sm`, `font-weight-normal`.

## 8. Theming & SVG
*   **SVG Colors:** Must be CSS-Driven via `fill: var(...)`. No inline fills.
*   **GSAP Override:** If animating SVG, cleanup inline styles in `onComplete`.
*   **MutationObserver:** Components caching colors must watch `data-theme` changes on `<html>`.
*   **Brand Identity:** Brand colors must be defined in localized CSS modules.

## 9. Feature Status Indicators

*   **Preview Mode:** Features that are built but deferred or mocked MUST use a top-level `Banner` with `variant="caution"`.
    - **Icon:** `construction`.
    - **Label:** "PREVIEW MODE" (bold).
    - **Why:** Sets expectations for non-production features while allowing feedback/demos.

## 10. Miscellaneous System Invariants
*   **Vertical Stretch:** `position: fixed` needs `bottom: auto` if height stretches unexpectedly.
*   **Z-Index:** Stack with the `var(--z-index-surface-*)` tokens, never a raw `z-index: N`. The numeric scale lives in `primitives.css` (`--z-index-inset: -1`, `standard: 0`, `base: 1`, `raised: 2`, `premium: 10`, `floating: 100`, `overlay: 1000`); components consume the `--z-index-surface-*` aliases from `semantics.css`. Use `inset/base/raised` for intra-component layering and `premium/floating/overlay` for cross-surface stacking.
    *   **Shared-plane stacking** — element competes with other components in the page/root context (sticky header, overlays, page glows). Use the global `--z-index-surface-*` token.
    *   **Internal-layer stacking** — element only stacks against its own component's children, inside an isolated root (`isolation: isolate`). Define a **component-local** named z-index scale at the isolated root as CSS custom properties (e.g., `--z-backdrop: 1; --z-stage: 2;`). Children reference the local vars. Do not invent new global rungs for orphan values like `3`, `4`, `78`, `79`.
*   **Documented max-tier constants** (sanctioned exceptions, must carry a `// CONSTRAINT:` comment):
    1. `globals.css` noise overlay (`z-index: 9999999`) — must cover modals per §14.
    2. `cursor.module.css` (`z-index: 10000000`) — must sit above the noise overlay.
*   **Selection Toolbar:** Must be the **LAST** child in JSX to ensure z-index visibility.

## 11. Verification

### Invariants (Automated)
- [ ] **No Hex Codes**: `grep "#[0-9a-fA-F]{3,6}"` (Critical. Use tokens.)
- [ ] **No Direct Margins**: `grep "^[^/]*margin:"` (Use `gap` in parent or `padding` in child. Exceptions: `margin: 0`, `margin: 0 auto`, `margin-inline: auto`, `margin: -1px` intentional negatives, and `// CONSTRAINT:` commented lines.)
- [ ] **No Direct Z-Index**: `grep "z-index: [0-9]"` (Use `var(--z-index-surface-*)` tokens or component-local vars. Only two documented max-tier constants may remain: noise overlay in `globals.css` §14 and cursor in `cursor.module.css`, both with `// CONSTRAINT:` comments.)
- [ ] **Lowercase Features**: All feature directories must be lowercase.

### Logic (Manual/Reasoning)
- [ ] **Reduced Motion**: Does any animation logic check `prefers-reduced-motion`?
- [ ] **Scannability**: Are listing items static on hover (no layout shifts)?

## 12. Branding & Logo Architecture
*   **Asset-First:** Standard brand logos SHOULD be extracted to separate SVG assets (Light/Dark variants) in a dedicated branding-assets directory.
*   **Theme Resolution:** Components requiring theme-aware assets MUST use the `useResolvedTheme` hook to determine the effective theme ('light'|'dark').
*   **Logo Registry:** All brand assets MUST be defined in a single branding-config module to allow global toggles and asset switching.
*   **Fallback Strategy:** Use a "Generic Partner" asset pattern by default if `ENABLE_PARTNER_BRANDING` is false.

---

## 13. Data-Attribute CSS Color Bridge

When a component needs to inherit a dynamic accent color based on a category/type prop, use a `data-*` attribute and a CSS custom property bridge. This avoids prop drilling, inline styles, and className collisions.

**Pattern:**
```css
/* In the component's CSS module */
.card[data-category="why"]  { --category-color: var(--primitive-primary-500); }
.card[data-category="how"]  { --category-color: var(--primitive-accent-a-600); }
.card[data-category="what"] { --category-color: var(--primitive-accent-b-600); }

/* Children consume the local variable */
.title { color: var(--category-color); }
.icon  { color: var(--category-color); }
```

```tsx
<motion.div data-category={activeCategoryKey} className={styles.card}>
  {/* children inherit --category-color automatically */}
</motion.div>
```

**Rules:**
- Use semantic primitive tokens (`--primitive-primary-500`) as the values, not hardcoded colors
- Scope the bridge to the component root — do not set it globally
- Works correctly through `AnimatePresence` since the attribute updates with the keyed re-mount

---

## 14. Global Tactility (Noise Overlays)
To achieve a "premium" surface feel, the project uses a global noise overlay.
*   **Implementation**: A `.noise-overlay` div at the start of the `<body>` (outside the content tree for performance).
*   **Theme Inversion Pattern**: 
    - **Light Mode**: Use `mix-blend-mode: multiply` with a dark-on-white noise texture.
    - **Dark Mode**: Adapt via `[data-theme-mode='dark']`. Use `filter: invert(1)` to flip the noise colors and `mix-blend-mode: screen`.
*   **Stacking**: Use a persistent high z-index (e.g., `9999999`) to ensure the "tooth" covers Modals and Tooltips.
*   **Performance**: Force a dedicated layer with `transform: translateZ(0)` and `will-change: transform`.

---

## 15. Browser Clipping & Radius Inheritance

To ensure reliable corner radii and clipping of absolute-positioned or accelerated content (like Next.js `Image` or GSAP revealed layers):

*   **Isolation Standard**: Containers with `overflow: hidden` and `border-radius` SHOULD use `isolation: isolate;` to force a stacking context. This ensures that browsers (especially Safari) clip child content reliably without "pixel leakage" at the corners.
*   **Avoid Inherit on Base Frames**: Do not use `border-radius: inherit;` on base component frames (e.g., `SiteImage`). This forces the radius to 0 if the parent has no radius, overriding page-level specificity.
*   **Dynamic Ratio**: Use CSS variables (e.g., `--aspect-ratio`) passed via React props to manage container proportions. This prevents layout shift during hydration and simplifies component APIs.

---

## 16. Responsive Strategy: Container Queries First

*   **Non-Negotiable:** Component-level responsive behavior MUST use `@container` queries, not `@media` queries.
*   **`@media` is reserved** for viewport-level layout shifts only (e.g., switching from sidebar to bottom nav at mobile breakpoints).
*   **Why:** `@container` makes components self-contained and reusable across different layout contexts. A card component should respond to its container's width, not the viewport's.
*   **Pattern:**
    ```css
    .wrapper {
      container-type: inline-size;
    }

    @container (min-width: 400px) {
      .card { flex-direction: row; }
    }
    ```
*   **Constraint:** All new responsive components must use `container-type: inline-size` on their wrapper. Existing `@media`-based components should be migrated opportunistically during refactors.

---

## See Also
- `foundation-design-tokens.md` — For semantic and primitive token definitions.
- `foundation-accessibility.md` — For keyboard and screen reader foundations.
