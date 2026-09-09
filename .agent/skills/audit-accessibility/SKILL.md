---
name: audit-accessibility
description: Use to audit selected web flows against WCAG 2.2 AA and project accessibility requirements, with measured evidence and explicit coverage limits.
tier: kind:app
---

# Audit Accessibility

Audit the requested surfaces against WCAG 2.2 AA and the project's accessibility contract.
Diagnose only; do not change application code. Route authorized remediation to
`implement-quick-fix` or `plan-feature` according to scope.

## When to Use

Use for accessibility review of interactive changes, reported barriers, or a release's selected
flows. A bounded audit is not a conformance claim for an entire application.

## Approach

### Step 0: Load Context

Identify the target pages, states, complete processes, supported input modes and themes.
Read `foundation-accessibility.md` and applicable project requirements. Record project policy
separately from WCAG criteria: a heading convention or named focus token is not itself a WCAG rule.
Use `foundation-testing.md` for evidence validity and `foundation-browser-usage.md` for runtime
capability and missing proof. Static review can identify risks while runtime confirmation is pending.

### Step 1: Gather Evidence

- Run an available accessibility scanner for the selected scope. Record tool/version, rule tags,
  exclusions, violations and incomplete checks. Lighthouse accessibility and axe are distinct
  tools; a clean automated scan establishes only its tested rules, not full accessibility.
- Traverse each selected flow with keyboard controls. Check logical focus order, visible focus,
  activation, dismissal and focus return. Composite widgets may use arrows within a single Tab
  stop. A modal may contain focus while open if keyboard users have a working exit.
- Spot-check accessible names, roles, values, states, landmarks, error association and announcements
  with a named screen reader/browser combination. Include dynamic status and validation states.
- Measure contrast in applicable themes and states. Under
  [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), normal text needs
  4.5:1 and large text 3:1; large means at least 18 pt or 14 pt bold, with equivalent sizing for
  relevant scripts. Check incidental and logotype exceptions. Under 1.4.11, necessary control or
  graphic information needs 3:1 against adjacent colors, subject to that criterion's exceptions;
  this is not a blanket border requirement.

### Step 2: WCAG 2.2 Delta Checks

Use the [WCAG 2.2 normative criteria](https://www.w3.org/TR/WCAG22/) for exact conditions and
exceptions before recording a violation.

- **2.4.11 Focus Not Obscured (Minimum, AA):** check that author-created content does not entirely
  hide a focused control. Consult the criterion's notes for user-positioned and user-opened content.
  **2.4.12 Enhanced** and **2.4.13 Focus Appearance** are AAA; assess them only if in scope.
  For 2.4.12 check that no part is obscured. For
  [2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html), measure qualifying
  indicator area against a 2 CSS-pixel perimeter and 3:1 contrast between the same pixels in
  focused/unfocused states. Check the user-agent exceptions; a literal enclosing border is not required.
- **2.5.7 Dragging Movements (AA):** test a non-drag single-pointer alternative; assess essential
  and unmodified user-agent exceptions.
- **2.5.8 Target Size (Minimum, AA):** measure 24×24 CSS-pixel targets; check spacing, equivalent
  control, inline, user-agent and essential exceptions before failing a smaller target.
- **3.2.6 Consistent Help (A):** compare repeated help mechanisms across the page set.
- **3.3.7 Redundant Entry (A):** inspect repeated information within a process, including reuse
  mechanisms and applicable exceptions.
- **3.3.8 Accessible Authentication (Minimum, AA):** inspect cognitive tests, alternatives and
  assistance such as password-manager and paste support. Evaluate the alternative, assistance,
  object-recognition and personal-content provisions in the
  [criterion guidance](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html).

### Step 3: Systemic Checks

Check semantic relationships, text alternatives, form instructions, zoom/reflow and text spacing
where they affect the selected flows. Toggle reduced-motion preferences for moving surfaces.
Apply 2.2.2's pause/stop/hide conditions and essential exception to automatically moving content.
Select other applicable A/AA criteria from the standard; this checklist is not the entire standard.

## Findings Model

For each finding, record the affected task/user, criterion and level or project rule, exact state,
evidence method/result, source location, impact severity and remediation pointer. Name exceptions
considered. Separate policy blocking from impact severity.

For each selected lens return `finding | checked-clean | not-applicable | not-verified`, with scope
and reason. Missing runtime evidence needs the exact remaining check and owner. Follow the shared
evidence policy; keep only necessary, redacted artifacts in the caller's approved evidence location.

## Definition of Done

- The selected flows and applicable criteria have evidence or explicit coverage limits.
- Scanner, keyboard, screen-reader and contrast results name the method actually used; unrun
  checks remain unverified.
- Findings distinguish measured barriers, static risks and project-policy violations.
- Remediation preserves finding identity and remaining proof. No application code changed.
