---
trigger: glob
globs: "**/*.css"
tier: kind:app
domain: design-system
---

# Design Tokens

> **Related Knowledge Base:** the project's design-tokens spec (primitive + semantic token
> definitions, generation pipeline) — path in `project-invariants.md`.

The "Physics" (Primitives) and "Intent" (Semantics) of the Design System.

## 1. The Golden Rule: Semantic-First
**Hierarchy of Truth:**
1.  **Intent (Component)**: "I need a card background."
2.  **Semantics (semantics.css)**: "Cards use `--surface-bg-primary`."
3.  **Physics (primitives.css)**: "`--surface-bg-primary` happens to be white."

**Mandate:**
-   You **MUST** use Semantic Tokens (Section 1).
-   You **MUST NOT** use Primitive Tokens (Section 5) directly in components.
-   You **MUST NOT** edit `primitives.css` manually. (See Section 6).

### 1a. Portal-Safe Token Scope (Invariant)
CSS custom properties inherit through the **DOM tree**, not the React tree. A node
portaled to `document.body` (`createPortal`) leaves the DOM subtree of its layout
wrapper and loses any tokens scoped to it.

-   **MUST NOT** define a component's token aliases on a layout element (e.g. a
    `.page` root) that portaled descendants fall outside of. A missing `var()` on
    SVG `fill`/`stroke` resolves to its initial value (**black**) — a silent visual
    regression. (Regression history: DFX access-console dials.)
-   **MUST** consume global semantics (`--surface-*`, `--text-*`, `--control-*`,
    `--font-*`) directly in portaled/overlay components; these resolve at
    `:root`/`<body>` regardless of DOM position.
-   **MUST NOT** add a pass-through alias that merely renames a semantic
    (`--x-text: var(--text-primary)`). Consume the semantic. Promote to a real
    `--control-*`/`--surface-*` token in `semantics.css` **only** for a genuine
    reusable treatment (e.g. a `color-mix`), never in page/component CSS.
-   Keep only **non-semantic, local** values (geometry, runtime animation vars) as
    component-scoped properties, prefixed by component (`--access-console-*`) — never
    by project-of-origin (`--dfx-*`).
-   **Border/edge modifiers follow the weight scale** (`subtle` → `strong`), not
    use-case names: `--control-border-subtle`, `--control-border-strong`; never
    `--control-border-grid`.

### 1b. Transient Mode Isolation (Invariant)
A transient/diagnostic view mode (e.g. the Accessibility Audit Lens, toggled via
`html[data-audit-mode="true"]`) **MUST NOT** reassign global semantic tokens
(`--surface-*`, `--text-*`, `--surface-border-*`) to force a different look.

-   **Why**: Recoloring the whole page collides with any component that owns its own
    background or hardcodes a value (light cards, layered/translucent popovers). The
    result is dark-on-dark text and illegible popovers. (Regression history: the audit
    lens "blueprint" dark-theme override.)
-   **MUST** leave page tokens untouched so every component stays legible. Achieve the
    differentiated look **non-destructively** — a fixed scrim that `backdrop-filter`s
    (grayscale/brightness) the live page behind the mode's own UI.
-   **MUST** style the mode's chrome with self-contained, explicitly-valued tokens
    scoped to the mode (e.g. `--audit-landmark`, `--audit-tooltip-bg`, `--audit-on-accent`).
    Never style mode chrome with page surface/text tokens — they revert to the active
    page theme the moment the override is removed, silently breaking contrast
    (e.g. a label that relied on `--surface-bg-sunken` going dark).

## 1. Semantic Tokens (The Public API)
Refer to the project's semantics token file (path in `project-invariants.md`) for the complete list. Common patterns:

### Surfaces (The Hierarchy)
-   **Frame (`--surface-bg-tertiary`)**: The App Shell, Sidebar, Navigation.
-   **Workspace (`--surface-bg-secondary`)**: The Canvas, Gallery, Infinite Space.
-   **Content (`--surface-bg-primary`)**: The Result, Lab Panel, Inputs.
-   **Sunken (`--surface-bg-sunken`)**: Recessed areas, Footer Wells, Deep Scaffolds.
    - **CRITICAL INVARIANT**: Sunken surfaces MUST remain opaque (solid OKLCH) to prevent color stacking/darkening when other page surfaces overlap them during transitions.

### Controls
-   **interactive**: `--control-bg-primary` (Rest) -> `--control-bg-secondary` (Hover).
-   **Accent**: `--accent-primary` (Brand) -> `--accent-hover` (Interaction).

### Spacing Tokens
The scale is a strict step-function — no fractional tokens exist between the listed steps. Using an undefined token (e.g. `--spacing-1p5`) silently resolves to zero — verify against this list before use.

- **`--spacing-0p5`** (2px) — Focus ring safe zone
- **`--spacing-1`** (4px) — Toolbar/menu padding, button gap
- **`--spacing-2`** (8px) — Standard button padding, badge/pill inset
- **`--spacing-3`** (12px) — Component gap, standard padding
- **`--spacing-4`** (16px) — Section padding
- **`--spacing-5`** (20px) — Large component gap
- **`--spacing-6`** (24px) — Outer rhythm
- **`--spacing-7`** (28px)
- **`--spacing-8`** (32px)
- **`--spacing-10`** (40px)
- **`--spacing-12`** (48px)

## 2. Radius Tokens (`radius-*`)
- **`--radius-xs`** (4px) — Micro elements, accordion triggers
- **`--radius-sm`** (6px) — Scrollbar thumbs, search inputs, badges
- **`--radius-md`** (8px) — Standard buttons (m/s)
- **`--radius-lg`** (10px) — Icon-only buttons (s), menu items, switch tracks
- **`--radius-xl`** (12px) — Icon-only buttons (m), toolbar/menu containers
- **`--radius-2xl`** (16px) — Larger containers
- **`--radius-shell`** (40px) — Main App Shell pill curvature
- **`--radius-reveal`** (calc(var(--radius-shell) * 2)) — Cinematic page-level transitions
- **`--radius-full`** (9999px) — Sliders, Avatars, Pills

### Premium Surface Rules
- **Concentricity (Math check)**: Nested children MUST use `calc(var(--parent-radius) - var(--padding))` to maintain visual harmony.
- **Squircle Enhancement**: Premium components use `calc(var(--radius) + 4px)` in `@supports (corner-shape: squircle)` blocks.

## 3. Z-Index Tiers (`z-index-surface-*`)
Standardized stacking tiers for material components.

- **`--z-index-surface-standard`** (0) — Default grid items, cards, baseline content.
- **`--z-index-surface-premium`** (10) — Hover-lifted cards, active states.
- **`--z-index-surface-floating`** (100) — Popovers, Selects, Toasts, Tooltips.
- **`--z-index-surface-overlay`** (1000) — Dialogs, Modal backdrops, Full-screen takeovers.

### Legacy Z-indices (Utility)
- `--z-raised`: 5
- `--z-sticky`: 10

## 4. Shadow Tiers
Standardized depth tiers for material components.

- **`--shadow-none`**: No cast shadow (flat/reset states).
- **`--shadow-xs`**: Micro lift for chips, small labels, compact controls.
- **`--shadow-sm`**: Baseline lift for cards, panels, work tiles.
- **`--shadow-md`**: Raised emphasis for primary cards, hover/selected surfaces.
- **`--shadow-lg`**: Detached layer for dialogs, popovers, menus, lightbox frames.

### Material Transitions
All surface elevation changes (shadow/border) MUST use **`--surface-shadow-transition`** for cinematic consistency.


## 4. Typography Tokens
### Weights
- **`--font-weight-normal`** (400) — Body text, secondary content
- **`--font-weight-medium`** (500) — Subtle emphasis, labels, hotkeys
- **`--font-weight-semibold`** (600) — Buttons, headers, menu items

### Line Heights
- **`--leading-none`** (1) — Icons, badges, single-line headers
- **`--leading-tight`** (1.25) — Large headings, condensed blocks
- **`--leading-normal`** (1.5) — Standard body text, descriptive labels
- **`--leading-relaxed`** (1.75) — Large reading blocks, prompt previews

## 5. Link Tokens

### Semantic Link Colors
**Light Mode:**
- **`--link-fg-primary`** — Standard link color (blue-600) - **BREAKING CHANGE: Previously pink-600**
- **`--link-fg-default`** — Default variant (blue-600)
- **`--link-fg-default-hover`** — Hover state (relative color: 0.88 lightness)
- **`--link-fg-default-pressed`** — Pressed state (relative color: 0.75 lightness)
- **`--link-fg-ghost`** — Ghost variant (grey-600)
- **`--link-fg-ghost-hover`** — Ghost hover (relative color: 0.88 lightness)
- **`--link-fg-ghost-pressed`** — Ghost pressed (relative color: 0.75 lightness)

**Dark Mode:**
- **`--link-fg-primary`** — Standard link color (blue-400) - **BREAKING CHANGE: Previously pink-400**
- **`--link-fg-default`** — Default variant (blue-400)
- **`--link-fg-default-hover`** — Hover state (relative color: 1.14 lightness)
- **`--link-fg-default-pressed`** — Pressed state (relative color: 1.25 lightness)
- **`--link-fg-ghost`** — Ghost variant (grey-400)
- **`--link-fg-ghost-hover`** — Ghost hover (relative color: 1.14 lightness)
- **`--link-fg-ghost-pressed`** — Ghost pressed (relative color: 1.25 lightness)

### Underline Tokens
- **`--link-underline-thickness-default`** — 1px base underline
- **`--link-underline-thickness-hover`** — 2px hover underline
- **`--link-underline-offset`** — 2px offset (--spacing-0p5)

### Background Tokens (Ghost Variant)
- **`--link-bg-ghost-hover`** — Subtle background on hover
- **`--link-bg-ghost-pressed`** — Standard background on press

### Usage Pattern
Always use the Link component (`<Link>`) for clickable links. For button-styled links, use `<Button asChild><a></Button>`.

**Relative Color Syntax:**
```css
--link-fg-default-hover: oklch(from var(--link-fg-default) calc(l * 0.88) c h);
```

## 6. Primitives & Generation (The "Closed" API)
**Immutable Mandate:** `primitives.css` is READ-ONLY and managed by the generator.

### Adding a New Primitive
If a design requires a new value (e.g. `grey-150`):
1.  Edit the token-generator script's config object.
2.  Run the token generator.
3.  Verify the output in the generated `primitives.css`.

(Generator, validator, and CSS file paths for this repo are in `project-invariants.md`.)

## 6. Validation & Integrity
The system is strictly enforced via the token-validation script (`validate:tokens` by convention). Run it to check:
- **Gamut Compliance**: All OKLCH values must fit in sRGB (checked via `culori`).
- **Reference Integrity**: No broken `var(--primitives-*)` links in semantics.
- **Interpolation Registration**: Core semantic tokens are registered via `@property` for smooth transitions.

## 7. Color Primitives (Reference Only)
All primitive colors are generated via the token-generator script.
*   **Base:** Absolute Black/White.
*   **Theme:** Brand Identity (Pulse Pink - Hue 17).
*   **Neutral:** Studio Ink (Hue 265).
*   **Status:** Green (Success), Red (Error), Yellow (Warning), Blue (Info).

## 8. Component Type Colors (Icons & Sliders)
The system uses a **Synchronized Coordination** pattern.

### The Source of Truth
*   **Definition**: the type-colors config module maps `ComponentType` to primitive tokens for `{ light, dark }` modes.
*   **Normalizer**: Icons/sliders MUST use normalized `500` (Light) / `400` (Dark) primitive steps.

### The CSS Bridge (`--type-icon-color`)
*   **Binding**: the component-colors stylesheet maps `[data-component-type]` to the local variable `--type-icon-color`.
*   **Inheritance**: Children like `DiscreteSlider` or `Icon` use `var(--type-icon-color)` to automatically inherit the parent's type coloring.

### Architectural Invariants
> [!IMPORTANT]
> - Do **NOT** modify `semantics.css` accent values to change icon colors.
> - Do **NOT** use `[data-accent]` for component-specific icon coloring; use `[data-component-type]`.
> - Changes to the palette **MUST** be made in `type-colors.ts`.

## 8. Motion Tokens (`duration-*`, `ease-*`)
- **`--duration-fast`** (0.15s) — Interaction feedback
- **`--duration-standard`** (0.2s) — Default transitions
- **`--duration-slow`** (0.3s) — Large layout shifts
- **`--ease-smooth`** — `cubic-bezier(0.4, 0, 0.2, 1)` — Standard fades, accordion content
- **`--ease-spring`** — `cubic-bezier(0.175, 0.885, 0.32, 1.275)` — Buttons
- **`--ease-popover`** — `cubic-bezier(0.16, 1, 0.3, 1)` — Menus

### Motion Best Practices
- **Accordion Content**: Use `--ease-smooth` for grid-template-rows transitions (not `cubic-bezier(0.87, 0, 0.13, 1)` which overshoots). Add opacity fade on `.contentInner` for softer reveals.
- **Reduced Motion**: Always respect `@media (prefers-reduced-motion: reduce)` — set `animation: none` and `transition-duration: 0.01ms`.

## 9. Interaction Tokens

### Interactive State Transitions (Relative Color Syntax)
**Pattern**: Use CSS Color Module 4 relative color syntax for hover/pressed states. This achieves automatic light/dark mode adaptation with a single formula.

**Formula Reference**:
- **Primary/Accent/Destructive buttons** (dark base colors in light mode, light base colors in dark mode):
  - Hover: `oklch(from var(--base) calc(l * 0.88) c h)` — Darkens in light mode, lightens in dark mode
  - Pressed: `oklch(from var(--base) calc(l * 0.75) c h)` — Stronger darkening in light mode, stronger lightening in dark mode

- **Theme button** (near-black in light mode, near-white in dark mode):
  - Light Mode Hover: `oklch(from var(--base) calc(l * 1.5) c h)` — Lightens significantly
  - Dark Mode Hover: `oklch(from var(--base) calc(l * 1.02) c h)` — Lightens subtly

**Implementation Rules**:
1. Apply relative color syntax directly in `semantics.css` hover/pressed token definitions
2. **DO NOT** use `@property` for derived states (hover/pressed) — only for base colors
3. Register base colors with `@property` for smooth OKLCH transitions
4. Remove @property declarations for computed hover/pressed states to avoid initial-value conflicts
5. Formulas work identically in both light and dark modes because the base color automatically inverts

**Example**:
```css
/* Base color only gets @property */
@property --control-bg-accent {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(56.44% 0.2 17);
}

/* Light mode — base is dark, so multiply by <1 to darken further */
[data-theme='light'] {
  --control-bg-accent: var(--primitives-pink-600);
  --control-bg-accent-hover: oklch(from var(--control-bg-accent) calc(l * 0.88) c h);
  --control-bg-accent-pressed: oklch(from var(--control-bg-accent) calc(l * 0.75) c h);
}

/* Dark mode — base is light, so multiply by >1 to lighten further */
[data-theme='dark'] {
  --control-bg-accent: var(--primitives-pink-400);
  --control-bg-accent-hover: oklch(from var(--control-bg-accent) calc(l * 1.14) c h);
  --control-bg-accent-pressed: oklch(from var(--control-bg-accent) calc(l * 1.25) c h);
}
```

**Browser Support**:
- ✅ Chrome 123+
- ✅ Firefox 128+
- ✅ Safari 17.4+
- ❌ IE 11 (graceful degradation via fallback to base color)

### Focus Rings (`--control-focus-ring`)
- **Light Mode**: `oklch(70% 0.005 265 / 0.35)` — Neutral transparent grey (Studio Ink hue 265, low chroma)
- **Dark Mode**: `oklch(80% 0.005 265 / 0.3)` — Lighter neutral transparent grey
- **Rationale**: Focus states should be neutral and subtle, not brand-colored. The transparent grey provides sufficient contrast without competing with brand accents.
- **Usage**: Automatically propagates to all form inputs (Input, Select, Radio, Checkbox) and global `:focus-visible` outline via `semantics.css`.

## 9. Verification

### Invariants (Automated)
- [ ] **Valid Token Syntax**: `grep "var\(--[a-z]+-[a-z0-9-]+\)"` (Ensure no typos in variable names).
- [ ] **No Hardcoded Values**: `grep ": [0-9]+px"` (Should be `var(--spacing-*)` or `var(--radius-*)`).
- [x] **Logo Exception**: Brand logos (e.g., `AnimatedLogo`, `PartnerLogo`) may use hardcoded hex values for brand fidelity or GSAP animation compatibility.

## 10. Workflow: Adding Tokens
Before creating a new token, verify it doesn't exist in the tables above.

#### Step 1: Update Generation Script
Edit the token-generator script to add the new primitive:

```javascript
// Add to appropriate scale (Neutral, Theme, Extended)
grey: [
  { L: 98, C: 0.012, H: 265 }, // grey-50
  // ... existing values ...
  { L: 15, C: 0.012, H: 265 },  // grey-950
],
```

#### Step 2: Run Generator
```bash
node <token-generator-script>   # path in project-invariants.md
```

#### Step 3: Update This Document
Add the new token to the relevant table in **Section 5 (Color Primitives)** or the appropriate section above.

## Automated Checks
These invariants are harvested by `agentkit verify`, which runs them against the project's
`sourceRoots` (from `.agentkit.json`). The color checks already default-exclude **test/spec/stories
files** (a mock's color return is never a token concern) and the **conventional token-definition
files** (`**/primitives.css`, `**/semantics.css`, `**/*.tokens.css`), so a freshly-synced project is
quiet out of the box. Any *non-conventional* token-definition file (a differently-named file where raw
values legitimately live) goes in `.agentkit.json` `verify.exclude` — which is the single machine-read
source of truth (list them there, not only as prose in `project-invariants.md`).

```agentkit-checks
[
  {"id":"zero-hex","pattern":"#[0-9a-fA-F]{3,6}\\b","globs":["*.css","*.scss","*.tsx","*.ts"],"exclude":["**/*.test.*","**/*.spec.*","**/*.stories.*","**/primitives.css","**/semantics.css","**/*.tokens.css"],"severity":"critical","message":"Hex color literal — use a semantic token"},
  {"id":"raw-color-fn","pattern":"\\b(rgb|hsl|oklch|color-mix)\\(","globs":["*.css","*.scss","*.tsx"],"exclude":["**/*.test.*","**/*.spec.*","**/*.stories.*","**/primitives.css","**/semantics.css","**/*.tokens.css"],"severity":"high","message":"Raw color function outside a token-definition file — reference var(--color-*)"},
  {"id":"hardcoded-z-index","pattern":"z-index:\\s*-?[0-9]","globs":["*.css","*.scss"],"severity":"high","message":"Hardcoded z-index — use a var(--z-*) token"},
  {"id":"important","pattern":"!important","globs":["*.css","*.scss"],"severity":"medium","message":"!important breaks the cascade and complicates theming — justify or remove"},
  {"id":"direct-margin","pattern":"^\\s*margin:","globs":["*.css","*.module.css","*.scss"],"severity":"medium","message":"Direct margin — prefer gap in the parent or padding in the child"}
]
```

