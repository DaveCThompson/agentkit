---
name: audit-layout
description: Review layout consistency (spacing, alignment, grid usage). Use to ensure visual consistency across components.
tier: kind:app
---

# Audit Layout

Measurement-first layout audit: inspect real rendering at real breakpoints — overflow, reflow,
layout shift — before reading a single stylesheet. Static token scans corroborate; they don't
lead. Diagnose only; no code changes.

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
max-widths, and source roots from `project-invariants.md`. A violation of a documented invariant
is automatically **Critical**.

### Step 1: Runtime Inspection (the gate — no findings before this)
Browser-driven: follow `foundation-browser-usage.md` for capability, profile, lane ownership, and
evidence selection. At **each canonical breakpoint band** (from `project-invariants.md`), not just
"desktop and mobile":
1. **Overflow:** any horizontal scroll on the page body is an automatic **High**. Wide content
   (tables, code, diagrams) must scroll inside its own container. Identify the offending element
   via DevTools, not by guessing.
2. **Layout shift (CLS):** DevTools Performance panel → Layout Shift regions, or Lighthouse CLS.
   Attribute each shift to its source (unsized media, late fonts, injected content). Record the
   score — "it jumps a bit" is not a finding.
3. **Reflow-triggering animation:** Performance panel during interactions/intro animations —
   flag anything animating layout properties (`width`, `height`, `margin`, `font-weight`)
   instead of transform/opacity; layout work >16 ms per frame drops frames
   (see `foundation-performance.md` §5).
4. **Alignment/rhythm:** overlay DevTools grid/flex inspectors on section boundaries — do
   siblings share the same content spine and gutter, or does each section invent its own?
5. **Safe areas:** full-bleed elements respect mobile safe-area insets.

### Step 2: Static Corroboration
Scan the project's source roots (see `project-invariants.md`) to trace runtime symptoms to code:
- Spacing via tokens — magic-number paddings/margins are drift vectors
- Parent `gap` over child external margins (rogue margins break composability)
- Container/max-width primitives used instead of ad-hoc wrappers
- Media queries hit the canonical bands, not invented one-off widths
A static smell with no visible runtime symptom is a **Low** consistency note, not a defect.

## Findings Model
Per finding: **Severity** (Critical = invariant violation or broken layout at a real band;
High = overflow/CLS with measured evidence; Medium = inconsistent rhythm across siblings;
Low = token-hygiene drift), **evidence** (breakpoint + screenshot/DevTools attribution +
file:line), and a **concrete failure scenario** ("at the tablet band the card grid overflows,
forcing body horizontal scroll"). Not a style-nit list — every Medium+ names what a user sees.
Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.

## Definition of Done
- [ ] Every canonical breakpoint band inspected, not just two viewports
- [ ] Zero unexplained horizontal body scroll, or each occurrence filed with its element
- [ ] CLS measured and each shift attributed to a source
- [ ] Animations checked for layout-property abuse
- [ ] Static scan cross-referenced to runtime symptoms with file:line
- [ ] Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.
- [ ] Remediation handed to `implement-quick-fix` / `refine-code` — zero code changed
