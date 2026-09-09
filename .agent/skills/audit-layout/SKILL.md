---
name: audit-layout
description: Review layout consistency (spacing, alignment, grid usage). Use to ensure visual consistency across components.
tier: kind:app
---

# Audit Layout

Inspect real rendering to establish overflow, reflow and layout-shift findings. Use source reading
to locate targets and corroborate causes. Without runtime access, report static risks and missing
proof explicitly. Diagnose only; no code changes.

## When to Use
- After adding new components or a responsive surface
- Reports of overflow, misalignment, or content jumping
- Periodic visual-consistency check before releases

## When NOT to Use
- Token/color/theming adherence → `audit-design-system`
- Text styling and hierarchy → `audit-typography`
- Contrast or focus visibility → `audit-accessibility`
- You want the layout fixed in the same pass → `implement-quick-fix` / `refine-code`, fed by
  this report

## Approach

### Step 0: Load Invariants
Read `foundation-design-system.md` (its `## Verification` section) plus `pattern-structure.md`
for container/section contracts. Take the project's canonical breakpoint bands, container
max-widths, and source roots from the project's context. Record impact severity separately from
invariant compliance and blocking policy. If container-query rules conflict, report the specific
conflict; a filename prefix does not settle precedence.

### Step 1: Runtime Inspection
Browser-driven: follow `foundation-browser-usage.md` for capability, profile, lane ownership, and
evidence selection. Select widths from the target's breakpoint and container behavior, including
narrow parent containers and transition boundaries. Record tested widths and untested bands:
1. **Overflow:** identify the offending element and affected task. Compare page-body and nested
   scrolling with the content's intended behavior. Wide tables, code and diagrams may need their
   own scroller; assess accessibility and local policy before assigning impact.
2. **Layout shift (CLS):** DevTools Performance panel → Layout Shift regions, or Lighthouse CLS.
   Attribute each shift to its source (unsized media, late fonts, injected content). Record the
   score — "it jumps a bit" is not a finding.
3. **Animation cost:** record layout, paint and frame timing during relevant interactions.
   Animating layout properties is a candidate cost, not proof of dropped frames. Compare total
   work with the target's refresh rate and workload; transform/opacity also need measurement
   when expensive content or compositing is involved.
4. **Alignment/rhythm:** overlay DevTools grid/flex inspectors on section boundaries — do
   siblings share the same content spine and gutter, or does each section invent its own?
5. **Safe areas:** full-bleed elements respect mobile safe-area insets.

### Step 2: Static Corroboration
Scan the project's source roots (see `project-invariants.md`) to trace runtime symptoms to code:
- Spacing via tokens — magic-number paddings/margins are drift vectors
- Parent `gap` over child external margins (rogue margins break composability)
- Container/max-width primitives used instead of ad-hoc wrappers
- Media queries hit the canonical bands, not invented one-off widths
A static pattern can establish a policy violation or suggest a runtime risk. State which claim
it supports; do not fabricate a rendered symptom or automatically assign severity.

## Findings Model
Per finding: **impact severity**, **invariant and blocking policy**, **evidence**
(container/viewport width + screenshot/DevTools attribution +
file:line), and a **concrete failure scenario** ("at the tablet band the card grid overflows,
forcing body horizontal scroll"). Not a style-nit list — every Medium+ names what a user sees.
Each selected lens is `finding | checked-clean | not-applicable | not-verified`, with scope and
reason. Apply `foundation-testing.md` to evidence; missing runtime proof names a check and owner.

## Definition of Done
- [ ] Selected breakpoint and container conditions inspected; remaining coverage named
- [ ] Observed horizontal body scroll explained, or a specific inspection gap recorded
- [ ] Applicable shifts measured and attributed, or measurement gap recorded
- [ ] Relevant animations assessed with timing evidence or an explicit pending check
- [ ] Static evidence distinguished from confirmed runtime symptoms, with source locations
- [ ] Necessary redacted evidence stored in the caller's approved location with its identity
- [ ] Remediation handed to `implement-quick-fix` / `refine-code` — zero code changed
