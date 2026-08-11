---
name: audit-accessibility
description: WCAG 2.2 AA accessibility audit. Use to ensure the application is accessible to all users.
tier: kind:app
---

# Audit Accessibility

Measurement-first WCAG 2.2 AA audit. Every finding is backed by a tool result, a keyboard
traversal, a screen-reader announcement, or a measured contrast ratio — never "this looks
inaccessible." Diagnose only; no code changes.

> **Standards:** `foundation-accessibility.md` defines the project's a11y contract (landmarks,
> heading hierarchy, focus-ring token, reduced motion). This skill verifies it; it does not
> restate it.

## When to Use
- Before releases; after adding interactive components
- Compliance check against WCAG 2.2 AA

## When NOT to Use
- You want violations fixed in the same pass → `implement-quick-fix` (small) or `plan-feature`
  (structural), fed by this report
- Visual-consistency concerns without an a11y dimension → `audit-layout` / `audit-design-system`

## Approach

### Step 0: Load Context
Read `foundation-accessibility.md` and any project-specific a11y requirements referenced from
`project-invariants.md`. A violation of a documented invariant is automatically **Critical**.

### Step 1: Gather Evidence (the gate — no findings before this)
Runtime checks are browser-driven: follow `foundation-browser-usage.md` for capability, profile,
lane ownership, and evidence selection.

1. **Automated scan — axe** (via DevTools extension, Lighthouse a11y category, or axe-core CLI).
   Pass criterion: **zero violations** at WCAG 2.2 AA rule level. Record ruleset version and
   per-rule counts; axe catches ~30–40% of issues, so a clean scan is necessary, never sufficient.
2. **Keyboard traversal** — one full Tab pass per audited surface. Pass criteria: every
   interactive control reachable; focus order matches visual order; focus indicator visible on
   every stop; `Escape` closes overlays; no traps (can Tab out of every widget); skip link lands
   on main content.
3. **Screen reader spot-check** — name the tool (NVDA/Firefox, VoiceOver/Safari). Pass criteria:
   controls announce role + name + state; form errors are announced (live region or focus move);
   landmarks and one-h1 heading outline navigable.
4. **Contrast measurement** — measured ratios via DevTools contrast checker or axe, in **both
   themes** if the project ships light/dark. Pass: ≥4.5:1 normal text, ≥3:1 large text and UI
   component boundaries (WCAG 1.4.11).

### Step 2: WCAG 2.2 Delta Checks (beyond the 2.1 baseline)
- **Focus Appearance (2.4.11):** indicator ≥2 px, encloses the component, contrasts with both
  focused/unfocused states; uses the project's standard focus-ring token (see
  `foundation-accessibility.md`).
- **Focus Not Obscured (2.4.12):** focused element not hidden behind sticky headers/overlays —
  verify by scrolling while tabbing, not by reading CSS.
- **Dragging Movements (2.5.7):** every drag has a single-pointer alternative.
- **Target Size (2.5.8):** pointer targets ≥24×24 px (inline links and user-agent controls exempt).

### Step 3: Systemic Checks
- `prefers-reduced-motion` honored (toggle it and re-check moving elements); no auto-playing
  animation >5 s without pause.
- Semantic structure: landmarks, list validity, heading hierarchy — per
  `foundation-accessibility.md`.

## Findings Model
Per finding: **Severity** (Critical = blocks a user group from completing a task; High = major
friction with workaround; Medium = degrades experience; Low = best-practice gap), **WCAG
criterion** (e.g., "1.4.3 Contrast", "2.4.11 Focus Appearance"), **evidence** (tool output,
measured ratio, or traversal step), and a **concrete failure scenario** ("keyboard user cannot
dismiss the modal; focus is trapped behind the overlay"). No style nits without a criterion.
Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.

## Definition of Done
- [ ] axe scan run and recorded (ruleset, counts) — zero-violation baseline or each violation filed
- [ ] Full keyboard pass performed per surface; traps and order breaks filed
- [ ] Screen reader named and spot-check results recorded
- [ ] Contrast measured (both themes where applicable), not eyeballed
- [ ] Every finding cites a WCAG criterion + severity + failure scenario
- [ ] Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.
- [ ] Remediation handed to `implement-quick-fix` / `plan-feature` — zero code changed
