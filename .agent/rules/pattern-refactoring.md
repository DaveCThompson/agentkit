---
trigger: model-decision
description: Consult before behavior-preserving refinement or structural refactoring — discovered design conventions, semantic preservation, responsibility boundaries and deletion evidence.
domain: code-quality
---

# High-Rigor Refactoring Standards

Preserve the relevant behavior while improving a concrete responsibility or readability boundary.
Use the repository's actual styling and design contract; a refactor does not authorize a new visual
language, broader cleanup or changed behavior.

## Purpose

Identify the external contract and semantic risks before editing: evaluation order/count, identity,
mutation, exceptions, side effects, timing, subscriptions, resource lifetime and accessible interaction.
Preserve documented compatibility and fragile exceptions. Use `foundation-testing.md` for evidence
validity and `implement-refactor` or `refine-code` for the appropriate transformation method.

## 📐 1. Layout Bounding & Extraction (CSS Modules)

### Policy

Follow the discovered styling system: CSS Modules, utility classes, scoped styles or another
established approach. Extract repeated layout responsibilities when that makes ownership clearer.
Do not convert valid Tailwind layouts to CSS Modules merely because this shared rule has a CSS example.

### Standard Bounding Classes

Names such as `.container`, `.flexRow`, `.cardList` and `.tabsContent` are illustrative semantic hooks,
not required classes. Preserve actual bounding widths, min-content behavior, gap, scrolling,
overflow and responsive/container conditions. Introducing a wrapper can change grid placement,
selectors, focus or measurement even when its CSS looks equivalent.

### 📝 Example: Layout Extraction

For a project using CSS Modules, moving a repeated card-list layout into its existing module may
clarify ownership. For a utility-first project, a shared layout component or consistent utilities
may serve the same purpose. Compare computed geometry at affected widths and content sizes;
do not substitute new padding, radii or gap values under the name of extraction.

## 🎨 2. Absolute Color String Eradication

### Policy

Where the project exposes semantic tokens, use them for semantic roles. Resolve actual definitions,
themes and exceptions under `foundation-design-tokens.md`. Do not invent token names or translate
raw values into the wrong semantic role just to remove literals.

### Mappings

Keep accepted brand, data-visualization and runtime-color cases when their contract requires them.
A primitive reference or fallback can be legitimate at an owned token/component API boundary;
follow documented project policy and inspect its effect. Fix accidental missing required tokens
at their source. Do not hide missing-token defects with an arbitrary fallback.

## 🎛️ 3. Tactile Feedback & States

### Button Overlays

Preserve existing rest, hover, focus, pressed, disabled and loading behavior. Pseudo-element scale
layers are a technique when they fit the design; they can also alter hit testing, stacking and text
rendering. Verify those effects if the refactor touches them.

### Segmented Controls (Capsule Pills)

Use the existing control component and shape. Capsule radii and sliding backgrounds are project
design choices, not generic refactor requirements. Do not globally restyle tabs while restructuring
one page. Preserve tab/selection semantics, keyboard operation, focus and motion preferences.

## 🔬 4. Checklist for Future Refactoring

- [ ] The intended clarity or ownership improvement is concrete.
- [ ] Actual design tokens, layout conventions and visual states remain compatible.
- [ ] Relevant semantic invariants and consumers have evidence or explicit coverage gaps.
- [ ] New wrappers, exports and dependency directions have been checked for unintended effects.
- [ ] Deliberate behavior changes are covered by the task's authority and described as such.

## 5. Modern Refine Patterns

### Transport Extraction

When live/dev or live/mock branching repeats across query hooks, an existing transport seam can
keep hooks focused on query contracts. Preserve authentication, cancellation, retries, errors and
cache identity; a new transport module is not required for a simple branch.

### Overlay Extraction

Extract overlay state into a hook or rendering into a component when it clarifies a dense page.
Keep focus restoration, modal containment, event propagation and ownership explicit.

### Conductor Preservation

Pages can act as readable conductors of state and focused views. Extract pure helpers or same-file
subcomponents when they expose a real boundary. Moving complexity behind a new name or splitting
by line count alone is not evidence of improved structure.

### Fragile Exceptions

Preserve narrow exceptions needed for visual stability or behavioral safety. Use existing
`// WHY:` and `// CONSTRAINT:` markers when they help future maintainers understand the boundary.
A proposed correction to an exception needs evidence and authority for the behavior change.

## 6. Dead-Code Deletion Hygiene

A deletion claim needs evidence of reachability and the full owned footprint, not only a green build.

- Inspect exports, dynamic registration, configuration, test importers and external consumers.
  A symbol used locally may lose an unnecessary export while its implementation remains required.
- When removing an authorized feature, locate associated styles, custom properties, media queries,
  assets and registrations. Remove only those proven exclusive to it; shared tokens and selectors
  may have other consumers. CSS unused-class checks alone do not establish runtime reachability.
- Search affected source and documentation for removed symbols and paths, including active work
  items. Update current canonical guidance through its owner; generated mirrors are regenerated,
  never hand-edited. Preserve historical evidence and re-evaluate live tickets whose premise changed.
  Use the shared document lifecycle and wrap/land owners for broader archival work.
- After mechanical import rewrites, inspect same-source duplicates, type-only imports, evaluation
  order and cycles. Run the applicable formatter/lint and consumer checks; do not assume regex
  replacement preserved module initialization.

### Intentionally-dormant features (the inverse case)

Retain intentionally disabled features with their owner, reason and current state. Inspect flags,
runtime routes and planned consumers before treating an unreferenced-looking file as dead.
Use a narrowly scoped scanner exception only when scanner configuration changes are authorized;
record the excluded signal and how it remains reviewable. Do not invent a project-specific ignore glob.

### Suppression hygiene (config-only noise reduction)

For authorized scanner tuning, use the installed tool's supported configuration and the applicable
`integrations/fallow.md` guidance. Keep explicit export-name exceptions backed by actual importers;
do not use wildcard suppression to hide uncertainty. Compare finding identities, roots, exclusions
and relevant counts before/after. Equal unused-file counts alone cannot prove that no signal moved
or disappeared. Retain meaningful violating fixtures for changed gates under `foundation-testing.md`.
Report unreachable tooling and missing evidence without installing it or running auto-fix implicitly.
