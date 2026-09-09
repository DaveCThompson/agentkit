---
trigger: model-decision
description: Consult when building or styling interactive controls — buttons, sliders, forms, selects, textareas, toggles, chips — sizing specs, state purity, touch targets, adornment slots.
tier: kind:app
domain: layout
---

# Input Patterns

Use the project's real control APIs and design tokens while preserving name, role, value and
operation across input methods. Specific dimensions, palettes and wrappers are local choices;
`foundation-accessibility.md` owns the applicable accessibility criteria.

## 1. Buttons

- Follow the established typography/variant contract; semibold 600 is an option, not a universal
  weight. Primary colors must retain readable contrast through enabled, hover, focus and pressed states.
- Keep geometry stable across states. A transparent reserved border, inset decoration or background
  layer can prevent movement; a ghost button need not be forbidden from ever showing a border.
- Choose press/lift feedback from the motion contract. A separately animated background can keep
  text stable, but no fixed scale factor establishes correctness or performance.
- Check actual pointer targets, not just visible icons. WCAG 2.2 AA 2.5.8 uses 24×24 CSS px or its
  specified exceptions, including spacing; 20px is not a general minimum. The enhanced 44×44 target
  criterion is AAA; projects may require larger targets. See
  [target size (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## 2. Sliders

- Prefer native ranges or a proven accessible primitive when they fit. Custom sliders need a name,
  values, keyboard behavior and appropriate touch interaction; offer an alternative to dragging.
- Separate track, visual thumb, hit target and decorative glow when useful. Pseudo-elements can
  enlarge a target, but check clipping, overlap, stacking and actual pointer hit testing; negative
  z-index is not guaranteed to receive input.
- Choose endpoint/intermediate labels and thumb shape from domain meaning and local density.
  Do not impose three layers, a fixed glow size or a particular radius token.

## 3. Forms & Inputs

- Reuse established form styles and primitives through their real import/API; do not assume a
  global `forms.css`, `AutoResizingTextarea` or a fixed initial height exists.
- Prefer native `select` for straightforward choices. Use a custom selection widget when its
  behavior warrants it and verify naming, focus, keyboard, touch and selection states.
- Auto-growing textareas need usable minimum/maximum size, preserved selection, scroll behavior
  and long-content tests. Choose grids and labels for actual content, zoom and translation;
  a 50% field width or 10px label is not a portable density rule.
- Align checkboxes with their label's content and wrapping behavior, not a universal flex alignment.
- If a primitive supports adornments, reserve logical inline space for them so text does not
  overlap. Keep actions inside the visual chrome only where intended, give them accessible names,
  and preserve focus rings, disabled/read-only behavior and form submission semantics.

## 4. Toggles & Chips

- Choose semantics first: mutually exclusive values, independent toggles, tabs and actions need
  different roles and keyboard models. Use existing segmented/radio/chip primitives where suitable.
- A sliding background with Motion `layoutId` is optional decoration, not required selection logic.
  Check reduced motion and ensure state remains visible if animation never runs.
- Let longer rating scales wrap, scroll or use a grid according to the interaction and target widths.
  Use domain-appropriate labels with enough meaning to interpret the scale; numeric scales may
  be intentional. A local `ratingLabels` map is not universal.
- Keep selected/unselected sizing stable unless change is intentional. Separate explanatory scale
  labels from selected-value feedback. Group names and labels must remain associated after wrapping.

## 5. Specifications

### Button Sizes

Take height, radius, spacing and icon sizing from the actual component variants and target policy.
Document legitimate local dimensions where owned; do not create a second kit-wide size table.

### Chip Specs

Use the actual selected-state palette, timing and indicator geometry. Verify contrast, non-color
state cues, content fit and hit targets rather than requiring grey tokens or a 6px dot.

## 6. Verification

### Invariants (Automated)

- Use applicable semantic/ARIA lint and existing project token checks. Source search can locate
  control variants and dimensions, but computed target geometry and contrast need runtime evidence.
- Test validation, disabled/read-only/submitting transitions, value propagation and default button
  types using the project's existing tests.

### Logic (Manual/Reasoning)

- Exercise keyboard, touch, drag alternatives, long/localized labels, zoom/reflow and focus visibility.
- Check hover/press geometry, reduced motion, adorned text overlap and rating selection feedback.
- Report missing browser/assistive-technology coverage rather than treating dimensions as a pass.

## See Also

- `foundation-design-tokens.md` — token roles and contextual exceptions.
- `foundation-accessibility.md` — control accessibility criteria.
