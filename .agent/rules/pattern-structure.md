---
trigger: model-decision
description: Consult when composing page layout — Container/PageShell/PageSection composition, hero patterns, card clickability, SurfaceCard tiers, breakpoints, Radix dialog a11y.
tier: kind:app
domain: layout
---

# Structure Patterns

Rules for layout containers: Containers, Sections, Cards, and Surface Panels.

## 1. Layout & Containers
*   **Containment Priority**: For any content that needs to respect a max-width (1200px) and consistent horizontal padding (24px desktop / 16px mobile), you MUST use the `<Container>` component from `@app/ui`.
*   **Default Mode**: Full-bleed is the default for secondary or staged backgrounds. Containment is an opt-in child wrapper.
*   **PageShell**: The `PageShell` primitive must remain free of internal containment logic. It defines the page grid; the `<Container>` defines the content boundary within that grid.
*   **Footer**: The footer MUST use `<Container>` for its inner content, matching the 1200px constraint.
*   **Header**: The header bar uses `max-width: 1240px` (intentionally wider than Container). Do not normalize it to 1200px.

## 2. Page Sections
*   **Composition**: A standard page section should be composed of a `<PageSection>` wrapper.
*   **Prop Consistency**: `PageSection` owns the intro container automatically. Use `contentContained` when the section body should share that same left spine. Reserve `fullWidth` for intentionally full-bleed section bodies, and do not wrap an intro-bearing `PageSection` in an extra outer `<Container>`.
*   **Hero Treatment**: The portfolio uses two distinct hero patterns:
    *   **Card Panel Hero** (`PageHero`, `EditorialLead`): For index, utility, and case study pages. `PageHero` owns its own `<Container>`.
    *   **Open Hero Grid**: For identity and narrative-first pages (Home, About).

## 3. Cards & Lists
*   **Hover Fidelity**: Interactive cards (e.g., `WorkTeaserCard`) must use semantic hover states defined by the design system (e.g., scale-up, depth increase).
*   **Clickability**: Entry-point cards MUST be fully clickable. Do not rely on isolated "CTA" buttons inside the card as the primary hit area.

## 4. Surfaces & Modals
*   **Surface System**: Use `SurfaceCard` with tiered `variant` props (`premium`, `floating`, `matte`) to define material depth instead of ad-hoc shadows or background colors.
*   **Concentricity**: Nested elements must respect the radius math defined in the project's radius/concentricity spec (path in `project-invariants.md`).

## 5. Adaptive Layouts
*   **Responsive Bands**: The canonical breakpoint set is defined in the project's responsiveness spec (path in `project-invariants.md`). CSS custom properties cannot be used in media queries, so breakpoints are documented conventions, not tokens.
*   **Container Queries**: Components MAY use `@container` for internal layout switches when container-type infrastructure exists. No reference implementation exists yet.
*   **Safe-Area Insets**: Ensure layouts account for mobile safe-area insets on full-bleed elements.

## 7. Modals & Dialogs
*   **Accessibility Registration**: When using Radix-wrapped `Dialog` primitives from `@app/ui`, avoid manual `aria-labelledby` or `aria-describedby` linking.
*   **Automatic Linking**: Simply nest `<DialogTitle>` and `<DialogDescription>` within `<DialogContent>`. Radix UI automatically handles the mapping.
*   **Hidden Descriptions**: If a visual description is not desired, use the `<DialogDescription>` component with a `.visuallyHidden` utility class rather than omitting it or using manual ARIA attributes.

## 8. Verification

### Invariants (Automated)
- [ ] **Container Usage**: `grep -U "<Container[^>]*>\\s*<PageSection" apps/<app>/` (Should return zero matches for intro-bearing sections.)
- [ ] **Containment Prop**: `grep "contentContained" apps/<app>/` (Verify the explicit body-containment path is used where needed.)

### Logic (Manual/Reasoning)
- [ ] **Concentricity**: Do nested card elements have correctly derived border radii?
- [ ] **Hit Areas**: Are project teaser cards clickable across their entire surface?
