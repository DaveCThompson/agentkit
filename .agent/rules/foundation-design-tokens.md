---
trigger: glob
globs: "**/*.css"
tier: kind:app
domain: design-system
---

# Design Tokens

Use the project's token contract to keep meaning, themes and component states consistent.
Verify definitions and computed values; familiar names and literal-free CSS do not establish
correct styling. Token catalogs, palettes and generators belong to their actual project owners.

Read the project's design specification and source/derived-file mapping, using
`project-invariants.md` when present. The names below illustrate roles, not an installed catalog.

## 1. The Golden Rule: Semantic-First

Prefer semantic roles at component boundaries: component intent → semantic token → primitive.
For example, a card can consume `--surface-bg-primary` if that token exists and means card surface
in this project. Reuse existing roles before adding aliases or new values. Follow explicit project
exceptions for brand artwork, visualization palettes or runtime styles. Do not invent a token
to satisfy a naming convention or edit a generated output as its source.

### 1a. Portal-Safe Token Scope (Invariant)

Custom properties normally inherit through the DOM tree, not React ownership. A portal can leave
a theme/alias scope. Inspect the actual portal container and resolved tokens: use a shared ancestor,
an in-scope portal root, or an explicit theme/token bridge. Global semantics work only if they
are defined for that DOM location and active theme.

Component aliases can express a real component API; avoid redundant renaming. Preserve local
geometry and animation properties with clear component ownership. Inspect registration inheritance,
fallbacks and runtime setters before diagnosing a missing token. An unresolved `var()` can make a
declaration invalid at computed-value time; inherited/initial behavior depends on the property.
It does not universally become zero, nor do SVG fill and stroke share one black fallback.
See [CSS custom-property semantics](https://www.w3.org/TR/css-variables-1/).

### 1b. Transient Mode Isolation (Invariant)

Keep temporary diagnostic/overlay styles from unintentionally recoloring the underlying page or
breaking contrast. Scope mode chrome and remove only owned overrides on exit. A true theme mode
may intentionally change global semantic tokens if it tests all affected surfaces and portals.
A scrim/backdrop filter is an optional technique; verify its compositing, focus, contrast and
performance instead of assuming it is harmless. Preserve the original theme on interruption.

## 1. Semantic Tokens (The Public API)

### Surfaces (The Hierarchy)

Discover roles such as shell, workspace, content and recessed surfaces. Existing names might be
`--surface-bg-tertiary`, `--surface-bg-secondary`, `--surface-bg-primary` and `--surface-bg-sunken`.
Do not impose their ordering or values on another design. Preserve required opacity when layered
surfaces would otherwise stack/darken; transparent surfaces need checks on real backgrounds.

### Controls

Map rest, hover, pressed, selected, disabled and focus states to the existing control contract.
A brand accent is not automatically the correct link, icon, status or focus role.

### Spacing Tokens

Use the actual scale for repeated spacing. Distinguish spacing from borders, geometry and runtime
measurements before rejecting a literal. Verify that fractional or computed token names exist;
undefined variables do not provide a new step. Check density, zoom and responsive layouts.

## 2. Radius Tokens (`radius-*`)

Reuse the project's radius scale and component variants. A pill radius, shell radius or reveal
radius is a design choice, not a universal numeric value.

### Premium Surface Rules

For concentric nested corners, compare inner radius with outer radius minus inset, accounting
for borders and clamping where needed. Squircle/corner-shape enhancements require target-browser
support and a usable fallback; do not add a fixed radius increment as a universal correction.

## 3. Z-Index Tiers (`z-index-surface-*`)

Use project stacking tiers for ordinary surfaces, floating content and overlays when provided.
Inspect stacking-context creation, portals and the browser top layer; a larger number in a child
context does not necessarily place it above another context.

### Legacy Z-indices (Utility)

Retain supported legacy tiers until their consumers are migrated within scope. Local zero/negative
stacking can be intentional; verify actual overlap and hit testing before replacing it.

## 4. Shadow Tiers

Use existing depth roles for flat, raised and detached surfaces. Check clipping and contrast in
each theme; a shadow does not replace required boundary information.

### Material Transitions

Reuse applicable motion tokens for elevation changes. Verify paint cost and reduced-motion
behavior. A named transition token does not prove a composited animation.

## 4. Typography Tokens

### Weights

Use available font weights for the intended hierarchy. Confirm loaded faces/axes and avoid
accidental synthesized weights. Numeric scale and token spelling come from the project.

### Line Heights

Choose the existing text role and verify glyph clipping, wrapping and user text-spacing changes.
Do not apply single-line icon leading to multiline body text merely because both share a token.

## 5. Link Tokens

### Semantic Link Colors

Preserve distinct link roles and state contrast in each theme. Do not migrate a project's brand
colors based on another application's historical palette.

### Underline Tokens

Keep link identification and affordance visible. Thickness/offset choices must remain readable
at the actual font, zoom and state; use the project's tokens where available.

### Background Tokens (Ghost Variant)

If a ghost link variant exists, validate its hover/pressed background against text and surrounding
content. A role does not require inventing this variant.

### Usage Pattern

Use the project's navigation primitive when it preserves real link semantics. An anchor navigates;
a button performs an action. Composition APIs such as `asChild` are library-specific. Preserve
href, keyboard activation, focus and accessible name without nesting interactive elements.

## 6. Primitives & Generation (The "Closed" API)

Generated files are edited through their source. A filename such as `primitives.css` alone does
not establish generation ownership; inspect the actual pipeline.

### Adding a New Primitive

Check the existing palette and semantic role first. If a new value is justified, edit the owned
definition/configuration and run the project's generator where applicable and authorized.
Inspect outputs and affected themes/consumers; do not manufacture a generator for hand-authored tokens.

## 6. Validation & Integrity

Use the project's validator for references, naming, cycles and gamut policy. Validate the actual
target gamut rather than imposing sRGB on an intentional wide-gamut design. Check registered
custom properties' syntax, inheritance and initial values when registration is used for interpolation.
Registration is a technique, not a requirement for every token. Missing tooling leaves explicit
static/runtime coverage gaps.

## 7. Color Primitives (Reference Only)

The project palette owns hue families, steps and status mappings. Raw values belong at that source
or a documented exception. Brand artwork and charts can need specific colors; scope an exception
to the relevant check and surface and verify accessible alternatives for meaningful color encoding.

## 8. Component Type Colors (Icons & Sliders)

### The Source of Truth

When a product coordinates colors by component/data type, locate its actual type-to-color mapping
and light/dark contract. No universal `type-colors.ts`, category helper or numbered palette step exists.

### The CSS Bridge (`--type-icon-color`)

A data attribute can bind a local custom property inherited by icons/sliders. This is conditional
on the project API. Check actual DOM inheritance and portals rather than requiring
`data-component-type` on every renderer.

### Architectural Invariants

Keep changes at the correct owner: type palettes, brand accents and semantic control roles are
different concerns. Do not globally change accent tokens to recolor one type. Preserve a supported
bridge or migrate its consumers together.

## 8. Motion Tokens (`duration-*`, `ease-*`)

Use the project's motion language and units; timing/easing values are not fixed by this kit.

### Motion Best Practices

Choose curves that fit the space and intent. Reduced-motion alternatives must preserve final
visibility, state and completion/error handling. Disabling animations can suppress completion
events; a tiny duration is not a universal substitute for implementing the skip path.

## 9. Interaction Tokens

### Interactive State Transitions (Relative Color Syntax)

Relative colors can derive states from a base when supported. In OKLCH, multiplying lightness
by less than one lowers it in both themes; a theme switch does not reverse arithmetic. Select
direction and amount by actual base, background and intended contrast, then measure the result.
Do not assume any formula guarantees accessible hover/pressed states.

Use [CSS relative-color semantics](https://www.w3.org/TR/css-color-5/) and target-browser evidence.
If a fallback is needed, ensure an unsupported enhancement leaves a valid state. Check `@property`
inheritance/initial-value effects before registering base or derived colors; no blanket
base-only registration rule applies.

### Focus Rings (`--control-focus-ring`)

Use a visible indicator with applicable contrast and obscuration checks under
`foundation-accessibility.md`. Transparent grey, a specific hue or a token name cannot guarantee
contrast. Test real adjacent colors, themes and forced-color behavior before claiming compliance.

## 9. Verification

### Invariants (Automated)

Use token graph/stylesheet validation and the scoped candidate checks below. A regex cannot prove
a variable resolves, that a literal is a color rather than a selector/string, or that a UI conforms.
Check actual computed styles for affected themes, states, portals and runtime overrides.

## 10. Workflow: Adding Tokens

#### Step 1: Update Generation Script

Locate the owned source; reuse a suitable token or add a justified role/value there. This step
means editing a generator only if the project actually generates tokens.

#### Step 2: Run Generator

Run the existing generation/validation command where applicable. Inspect the diff and verify
reference integrity, intended values and consumer behavior; do not edit generated output directly.

#### Step 3: Update This Document

Update the project's owning token catalog/API documentation when its contract changes. This
portable kit rule is not a second registry of each consuming application's token values.

## Automated Checks

`agentkit verify` harvests the existing JSON shape below and scans configured `sourceRoots`.
These are review candidates with policy severity, not automatic accessibility/security findings.
Inspect context before repair; preserve justified token, brand, runtime and framework exceptions.

Color-definition exclusions belong only to the relevant color checks. For a nonconventional
definition file, propose a narrow exclusion in the owning check/authorized project overlay.
Do not put it in global `verify.exclude` unless every check is inapplicable. Do not exclude all
CSS or test/story files: they can contain component styles or independent cascade/stacking defects.
Palette utilities in CSS `@apply` and source strings remain scanned.

Coverage is bounded by the runner's supported file types, source roots, line-based regex and comment
handling. Constructed utility names, multiline expressions and unsupported template languages
need an appropriate parser/build check or explicit unverified scope. For detector changes, exercise
violating and legitimate fixtures through the real runner where available, including token-file
exclusions that leave unrelated checks active. Empty/skipped/malformed coverage is not a pass.

```agentkit-checks
[
  {
    "id": "zero-hex",
    "pattern": "#[0-9a-fA-F]{3}(?:[0-9a-fA-F](?:[0-9a-fA-F]{2}(?:[0-9a-fA-F]{2})?)?)?\\b",
    "globs": [
      "*.css",
      "*.scss",
      "*.tsx",
      "*.ts",
      "*.jsx",
      "*.js"
    ],
    "exclude": [
      "**/primitives.css",
      "**/semantics.css",
      "**/*.tokens.css"
    ],
    "severity": "medium",
    "message": "Hex literal candidate — check semantic-token policy and legitimate brand/data/selector context"
  },
  {
    "id": "raw-color-fn",
    "pattern": "\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\\(",
    "globs": [
      "*.css",
      "*.scss",
      "*.tsx",
      "*.ts",
      "*.jsx",
      "*.js"
    ],
    "exclude": [
      "**/primitives.css",
      "**/semantics.css",
      "**/*.tokens.css"
    ],
    "severity": "medium",
    "message": "Color expression candidate — check token policy; semantic color composition can be intentional"
  },
  {
    "id": "raw-tailwind-color",
    "pattern": "\\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|shadow)-(?:black|white|(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00|950))\\b",
    "globs": [
      "*.css",
      "*.scss",
      "*.tsx",
      "*.ts",
      "*.jsx",
      "*.js"
    ],
    "severity": "medium",
    "message": "Palette utility candidate — inspect actual utility config and semantic/brand exception"
  },
  {
    "id": "hardcoded-z-index",
    "pattern": "(?:\\bz-index\\s*:\\s*|\\bzIndex\\s*:\\s*)-?[0-9]",
    "globs": [
      "*.css",
      "*.scss",
      "*.tsx",
      "*.ts",
      "*.jsx",
      "*.js"
    ],
    "severity": "medium",
    "message": "Numeric stacking candidate — check project tiers, local stacking context and justified reset"
  },
  {
    "id": "important",
    "pattern": "!important",
    "globs": [
      "*.css",
      "*.scss"
    ],
    "severity": "medium",
    "message": "Important declaration — inspect cascade/layer ownership and justify necessary override"
  },
  {
    "id": "direct-margin",
    "pattern": "^\\s*margin\\s*:",
    "globs": [
      "*.css",
      "*.scss"
    ],
    "severity": "low",
    "message": "Margin review candidate — gap, auto centering and negative offsets have different semantics"
  }
]
```
