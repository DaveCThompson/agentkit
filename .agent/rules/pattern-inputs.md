---
trigger: model-decision
description: Consult when building or styling interactive controls — buttons, sliders, forms, selects, textareas, toggles, chips — sizing specs, state purity, touch targets, adornment slots.
tier: kind:app
domain: layout
---

# Input Patterns

Rules for interactive controls: Buttons, Sliders, Forms, and Toggles.

## 1. Buttons
*   **Typography:** All button text must be `var(--font-weight-semibold)` (600).
*   **State Purity:** Ghost/Tertiary buttons **MUST NOT** acquire borders on hover. Only darken background.
*   **Scale Physics:**
    *   **Stable Actions:** Primary and destructive buttons MUST NOT use transform- or filter-based hover/press motion.
    *   **Layered Actions:** Secondary, tertiary, outline, and on-solid buttons may animate the `::before` pseudo-element (background only), not the text.
    *   **Global active scale:** If scale is used, apply it only to the background layer and cap it at `scale(0.99)`.
*   **Theme Primaries:** Primary buttons MUST derive from `--control-bg-theme` and related semantic tokens. In dark mode they should start slightly off-white and lighten on hover, not darken.
*   **Touch Targets:** Small buttons (icon-only) must remain **20px**+ for hit area.

## 2. Sliders
*   **DOM Layering:** 3-layer architecture required.
    *   Parent (Layout) -> Child `.sliderThumbVisual` (Visual) -> `::before` (44px Hit Target z:-1) -> `::after` (32px Glow z:-2).
*   **Extreme Labels:** In dense contexts, show labels for `1` and `Max` only.
*   **Thumb Radius:** Must use `--radius-full`.

## 3. Forms & Inputs
*   **Global Styles**: Modal inputs must use `forms.css` globals, not inline styles.
*   **Selects**: Prefer native `<select>` for standard settings/forms. For specialized Canvas widgets (e.g., Output Format), use `@radix-ui/react-select` to ensure consistent styling and keyboard accessibility.
*   **Auto-Growing**: Use `AutoResizingTextarea` for form fields and surveys that should start as a single line and grow with content. It overrides global `forms.css` textarea styles to ensure a compact initial state (`36px` height).
*   **Grid Alignment**: For complex panels, use the "50% Width Grid Pattern" where the field takes exactly 50%.
*   **Complex Widgets**: For multi-field widgets (e.g., Advanced Role), use a 2-column grid with `gap: var(--spacing-2)` and micro-labels (10px) to maintain density.
- [ ] **Checkboxes**: Use `align-items: center` on parent flex container for optical alignment.
- [ ] **Adornments & Slots**: Standard primitives (`Input`, `AutoResizingTextarea`) support an optional `endAdornment` slot.
  - **Positioning**: Must be contained within the input's visual chrome.
  - **Padding**: Primitives MUST increase internal padding-right when the slot is populated (typically `var(--spacing-10)`) to prevent text overlap.
  - **Context**: Actions in this slot (e.g., Microphone for STT) should be tertiary/ghost style and not interfere with focus ring or base layout logic.

## 4. Toggles & Chips
*   **SegmentedToggle:** Best for high-signal UI (e.g., theme switching). Must use `layoutId` logic and `inset: 0` z-index for Framer Motion sliding background.
*   **SegmentedControl:** Preferred for forms and ratings. Supports `row`, `column`, and `grid` layouts.
    *   **Ratings:** For scales > 5 (e.g., 1-10), MUST use `layout="grid"` to ensure mobile responsiveness and prevent horizontal overflow.
    *   **Likert Annotation Copy:** Scale annotations beneath the control MUST use human-readable rating language from the shared `ratingLabels` map (for example `Very poor`, `Okay`, `Exceptional`), never numeric midpoint markers like `3` or `5`.
    *   **Selection Feedback:** Selected-value summaries should sit on a visually separate line below the annotations with enough vertical spacing to read as feedback, not part of the scale.
*   **ToggleChip Width:** Chips must maintain identical width in selected/unselected states (use transparent border to reserve space).
*   **Integrated Labels:** Use `RadioChipGroup` with integrated labels (`gap: var(--spacing-2)`) over manual wrapping.

## 5. Specifications

### Button Sizes
- **Size `m`** — Height: 36px, Radius: 10px, Icon Radius: 12px
- **Size `s`** — Height: 30px, Radius: 10px, Icon Radius: 10px

### Chip Specs
- **Bg Selected** — `grey-200` (Light) / `grey-700` (Dark)
- **Transition** — 0.15s `--ease-smooth`
- **Dot Size** — 6px

## 6. Verification

### Invariants (Automated)
- [ ] **Button Weight**: `grep "font-weight" src/**/*Button*` (Must be `var(--font-weight-semibold)`).
- [ ] **Touch Targets**: Small buttons must be 20px+ hit area.

### Logic (Manual/Reasoning)
- [ ] **State Purity**: Do ghost buttons avoid acquiring borders on hover?
- [ ] **Scale Physics**: Is press feedback using `scale(0.98)` not smaller?

---

## See Also
- `foundation-design-tokens.md` — For button and chip styling tokens.
- `foundation-accessibility.md` — For interactive control accessibility criteria.
