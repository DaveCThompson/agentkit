---
trigger: model-decision
description: Consult when composing page layout — Container/PageShell/PageSection composition, hero patterns, card clickability, SurfaceCard tiers, breakpoints, Radix dialog a11y.
tier: kind:app
domain: layout
---

# Structure Patterns

Compose layouts from the project's actual primitives, dimensions and responsive contract.
Preserve intended containment and interaction semantics; component names from another app are
not requirements. Read `foundation-design-system.md` and the applicable project specification.

## 1. Layout & Containers

- Locate the existing content-boundary primitive and its real import/API before using it.
  `Container`, `PageShell` and `@app/ui` are possible local contracts, not kit-provided APIs.
- Reuse established max-widths and gutters. A deliberately wider header than body/footer may be
  correct; neither equalizing them nor imposing 1200/1240px is a portable fix.
- Trace which wrapper owns padding, width and page grid. Avoid doubled gutters or accidental
  containment. Full-bleed backgrounds can contain a constrained child; full bleed is not every
  page's default. Preserve existing shell containment when its consumers depend on it.

## 2. Page Sections

- Reuse the actual section primitive when its heading, spacing and body layout fit.
  If `PageSection` owns an intro container, do not add a redundant outer container.
  Use `contentContained` or `fullWidth` only if the real API defines those semantics.
- Select card-panel versus open-grid heroes from the page's content and approved design.
  Existing `PageHero`/`EditorialLead` components may own their own containers; inspect them.
  These patterns remain useful without requiring portfolio-specific components or page categories.

## 3. Cards & Lists

- Give actionable cards recognizable hover, focus and pressed feedback using the local design
  system. Scaling/lift is optional; test clipping, text stability and reduced motion.
- Enlarge a primary hit target when this preserves selection and secondary actions.
  Do not nest controls in a link/button or turn every row into a button.
  Apply `pattern-interactions.md` for navigation/action semantics.

## 4. Surfaces & Modals

- Prefer existing surface variants and depth tokens when they express the intended hierarchy.
  `SurfaceCard` and `premium`/`floating`/`matte` are conditional examples, not required APIs.
- Preserve the project's radius/concentricity geometry. Account for border and padding; inspect
  actual nested edges rather than normalizing all corners to a copied number.

## 5. Adaptive Layouts

- Use the project's responsive bands and intrinsic layout constraints. Ordinary CSS `var()`
  custom properties cannot parameterize a media-query condition; build-time variables or an
  existing preprocessing/custom-media system are separate mechanisms.
- Use container queries when component behavior depends on an eligible ancestor's size and the
  target supports the needed features. Discover existing infrastructure and examples rather than
  asserting none exist. Check containment's effect on sizing.
- Account for safe-area insets on affected full-bleed controls/content without double padding.
  Check zoom/reflow, narrow parent containers, long text and supported writing directions.

## 7. Modals & Dialogs

- Use the actual dialog implementation's naming, description, dismissal and focus contract.
  For Radix, `Dialog.Title` and optional `Dialog.Description` supply automatic associations
  when composed correctly. A wrapper may expose a different API; inspect the rendered result.
- A meaningful visually hidden title/description is valid when it needs announcement, not merely
  to satisfy a component count. For complex content, a description may be unhelpful.
  Radix documents removing the description and supplying `aria-describedby={undefined}`;
  explicit ARIA linking is also valid when it targets real, appropriate content.
- Verify an accessible name, applicable modal focus containment, Escape behavior, focus return
  and background interaction. Library usage alone is not an accessibility pass.
  See [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog).

## 8. Verification

### Invariants (Automated)

- Trace container/section call sites to actual prop definitions and token values. Use the project's
  compiler/linter and existing invariant checks for contractual patterns.
- A search for nested containers is a candidate for doubled gutters, not a universal violation.
  Do not introduce a global grep requiring a particular wrapper or prop.

### Logic (Manual/Reasoning)

- Compare content spines, gutters, nested corners and intended full-bleed regions at relevant
  widths. Check overflow, safe areas and dynamic content.
- Exercise primary/secondary hit targets, selection, keyboard operation and modal focus behavior.
- Record actual rendered evidence and untested conditions under `foundation-testing.md`.
