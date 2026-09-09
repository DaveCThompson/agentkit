---
trigger: glob
globs: "**/*.css"
tier: kind:app
domain: design-system
---

# System Foundations

Preserve the project's visual and interaction contract across themes, states and layouts.
Use its actual components, tokens and styling pipeline; this rule supplies design-system review
methods, not a mandatory palette, framework or product aesthetic.

Read the relevant project specification and maintained examples, using `project-invariants.md`
when present. `foundation-design-tokens.md` owns token semantics and mechanical candidate checks;
`foundation-accessibility.md` and `foundation-performance.md` own their respective constraints.

<a id="1-zero-hex-tolerance-critical"></a>

## 1. Token Use & Literal Exceptions

Use established semantic tokens for roles they actually represent. A raw color can be an
accidental bypass, a token definition, brand artwork, data input or a compatibility fallback;
inspect context before assigning impact or changing it. Token presence alone does not prove
theme or accessibility correctness.

Preserve explicit project restrictions and scoped exceptions. Fix a missing required token at
its owner rather than hiding a typo with a random value. A supported fallback can be intentional.
Do not treat every hex match as Critical or presume all primitives are generated. Use the token
rule's actual exclusion/severity model and report policy blocking separately from user impact.

## 2. File & Directory Casing

Follow the project's naming scheme and framework-required filenames. Match import casing to
the actual path, including assets and styles. Case-insensitive development filesystems can hide
mismatches that fail on a case-sensitive target; this does not make kebab-case uniquely correct.
Use the project's configured linter/compiler and relevant target build, without inventing a
filename plugin or renaming files merely to impose this kit's preferences.

## 3. CSS Modules & Styling

Use the established styling system: CSS Modules, utility classes, scoped styles or another
supported approach. Keep selectors aligned with actual DOM structure, state and component
boundaries. Child selectors and CSS Modules `composes` are techniques when supported; inspect
cascade, import order and ownership before sharing styles.

Keep runtime geometry, animation and CSS-variable bridges where inline values express the
contract. Do not introduce CSS Modules as a universal replacement. Dedicated exported HTML
email can need inline styles and literal fallback colors for client compatibility; verify those
clients and keep the exception scoped to that output.

## 4. Layout & Spacing

Choose layout from content and relationships. Reuse the project's spacing/density scale, container
primitives and responsive constraints when present. Flex/grid gap is useful for sibling spacing;
it does not replace every margin, inset or internal padding.

### Background Hierarchy (The Unwrapped Strategy)

Distinguish shell, workspace and content surfaces when the design uses that hierarchy. Token
names such as `--surface-bg-primary` are examples, not an installed catalog or fixed color order.
Preserve required opacity, layering and contrast in actual themes and transitions.

For concentric corners, compare outer radius, inner radius, padding and borders, including
clamping and unequal insets. Verify real geometry instead of copying a fixed pixel/token pairing.
Do not use undefined intermediate scale steps to recreate another project's card treatment.

## 5. Motion Physics

Use the project's motion language and interaction purpose. Preserve stable reading, focus and
target geometry; a hover effect is not inherently incompatible with a list or menu.
Measure layout/paint costs and avoid movement that disrupts the task.

Provide an appropriate reduced-motion alternative and implement its visible/state completion
path. Setting every duration to zero can skip events that code relies on. Confirm skip,
interruption and changed-preference behavior under `foundation-accessibility.md` and
`pattern-motion.md` when applicable. Pixel alignment and easing are contextual design decisions.

## 6. Spacing Invariants

Prefer clear ownership: the parent often owns spacing between children, while the child owns
internal spacing. Preserve valid auto-centering, logical margins, intentional overlap and
formatting-context behavior. A zero-margin rule can be a project convention, not a universal
CSS invariant.

Distinguish scale-based spacing from borders, geometry and runtime measurements before rejecting
a pixel value. Replacing margin with gap/padding can change collapse, hit areas or available space;
verify the affected layout instead of relying on string substitution.

## 7. Icons & Typography

Use actual icon assets/font axes and readable text roles. Choose icon size, optical sizing,
weight and line height from the component, font support, density and accessibility needs.
No universal 20px icon or text-xs/text-sm assignment applies.

When using variable icon fonts, preserve required axes when setting `font-variation-settings`;
a state attribute is one way to select the full intended declaration. Verify the font's supported
axis ranges and render actual glyphs at target sizes. See
[CSS font variation settings](https://www.w3.org/TR/css-fonts-4/#font-variation-settings-def).
Labels and meaningful icons retain accessible names; decorative icons remain excluded appropriately.

## 8. Theming & SVG

Prefer existing theme-aware color roles through CSS/custom properties or `currentColor` when
appropriate. SVG attributes, embedded brand values or runtime styles may be part of the intended
asset/animation API; do not erase them merely because they are inline.

If colors are cached imperatively, subscribe to the actual theme authority and invalidate stale
values. A MutationObserver suits a DOM-attribute source; context/store/media-query sources may
have better native subscriptions. Track cleanup and theme changes without assuming a
`data-theme` attribute on html.

Animated SVG needs completion, cancellation and teardown behavior for owned properties. Restore
prior styles only when that matches the ownership handoff; do not clear unrelated styles or
depend on `onComplete` as the sole cleanup path.

## 9. Feature Status Indicators

When preview, mocked or incomplete behavior affects a user's decision, disclose that limitation
at the relevant surface using the project's existing status pattern. State the actual limitation
and available action. Do not require a particular Banner, icon, uppercase label or top-level
warning when local contextual copy is sufficient. Apply `pattern-ui-copy.md`.

## 10. Miscellaneous System Invariants

- For unexpected fixed/absolute stretching, inspect containing block, insets, height/min-height,
  box sizing and content. Clearing `bottom` is one possible correction to an overconstrained
  box, not a universal fix; preserve intended viewport anchoring.
- Distinguish shared-plane stacking from component-internal layers. Use the project's shared
  tiers when elements compete across surfaces. A local named scale can clarify layers inside
  an isolated component, provided the isolation itself fits the design.
- Inspect stacking-context boundaries, portals and the browser top layer before raising numbers.
  No global noise/cursor max-tier constants belong to every project. Keep existing exceptional
  values only with the actual constraint and coverage, not a copied filename exemption.
- DOM order matters for some ties, but putting a selection toolbar last does not guarantee
  visibility or correct focus. Check its real stacking, clipping and navigation relationship.

<a id="verification"></a>

## 11. Verification

### Invariants (Automated)

Use the existing checks in `foundation-design-tokens.md`, the project's token validator and
applicable compiler/linter. Do not duplicate blanket hex/margin/z-index greps here.
Text matches are candidates; exclusions must remain scoped to the relevant check.

Verify real token references, imports/filename casing, selectors and component contracts.
Record configured roots, exclusions and checks not executed. An empty or incomplete scan is
not a full pass; `foundation-testing.md` owns evidence validity.

### Logic (Manual/Reasoning)

Check affected themes and states, focus/keyboard paths, overflow, spacing, portals and contrast.
Test relevant viewport and parent-container conditions with real content and text enlargement.
For changed animations, clipping or overlays, inspect actual rendered behavior and performance.
Report the tested state/method and remaining runtime proof instead of inferring it from a build.

## 12. Branding & Logo Architecture

Reuse the existing brand asset/API owner. Separate assets, inline SVGs and a shared registry are
valid choices according to reuse, theme, delivery and editing requirements. Do not introduce a
branding directory or global registry without an ownership need.

Resolve light/dark/system variants through the actual theme mechanism; no fixed hook or branding
flag is assumed. Preserve brand fidelity and accessible alternatives. If branding is disabled
or unavailable, use the product's intended fallback rather than inventing a “Generic Partner.”

## 13. Data-Attribute CSS Color Bridge

For a finite category/type palette, an attribute can select a component-local custom property
that descendants consume. Bind it to actual semantic roles or a documented palette boundary,
and provide the intended missing/unknown-category behavior. Primitive and semantic tokens are
different layers; “semantic primitive” is not a new token category.

Inspect DOM inheritance and portal scope under `foundation-design-tokens.md`. Prop/style-based
bridges can also be appropriate for runtime colors. Updating a data attribute does not require a
keyed remount; exiting/retained nodes can keep old values. Test the actual animation/theme lifetime
instead of assuming AnimatePresence guarantees propagation.

## 14. Global Tactility (Noise Overlays)

A noise texture is an optional project treatment. Preserve it when specified; do not add one
to every app. Choose blend mode, intensity and stacking against real themes and content.
Keep decoration out of the focus/accessibility and hit-test paths, and verify underlying text,
controls and dialogs remain readable.

High z-index, body placement, `translateZ(0)` or `will-change` does not guarantee performance or
coverage of the top layer. Measure paint/compositing and memory before promoting layers.
Blending/isolation affects the backdrop; see
[CSS compositing and blending](https://www.w3.org/TR/compositing-1/).
Respect the actual overlay owner during cleanup or theme changes.

## 15. Browser Clipping & Radius Inheritance

For clipped absolute/animated content, reproduce the defect on the affected browser and inspect
overflow, border radius, transforms, containing blocks and stacking. `isolation: isolate`
creates a stacking context; it is not a universal clipping fix. Keep workarounds supported by
their specific visual regression evidence.

`border-radius: inherit` is valid when the parent's computed radius is intended. Inspect the
cascade and parent value before replacing it. A static or dynamic aspect ratio can reserve space
only when its initial value matches the intended geometry; runtime variables alone do not prevent
hydration shifts. Verify loading and resized states under the actual image/component framework.

## 16. Responsive Strategy: Container Queries First

Prefer a size container query when a component's layout depends on its available parent size
and supported infrastructure fits. Use viewport media queries for viewport-dependent layouts and
media features/preferences. Intrinsic flex/grid layout may avoid a breakpoint entirely.

Locate or establish the appropriate query container and inspect its sizing effects; do not put
`container-type: inline-size` on every wrapper automatically. A size query styles eligible
descendants based on an ancestor container, not that same element based on its own size.
Check the target browser contract, named/nested container selection and fallback layout.
See the [CSS container-query specification](https://drafts.csswg.org/css-conditional-5/#container-queries).

Test a component in narrow and wide parent contexts as well as page breakpoints. Preserve valid
media-query behavior unless the requested change and evidence justify migration. No opportunistic
framework/layout migration is implied by an unrelated refactor.

## See Also

- `foundation-design-tokens.md` — token contract, generation ownership and scoped checks.
- `foundation-accessibility.md` — semantics, input support, focus and motion alternatives.
- `foundation-performance.md` — measured loading, rendering and compositing decisions.
- `pattern-refactoring.md` — preserve visual/behavioral contracts during structural changes.
