---
name: audit-web-interface
description: Use for bounded static triage of web UI code covering accessibility, forms, motion, typography and loading patterns. Route unanswered runtime questions to the relevant specialist audit.
argument-hint: <file-or-pattern>
tier: tech:web
---

# Web Interface Guidelines Audit

Review the requested files or pattern (`$ARGUMENTS`) without editing them. If no target is supplied,
infer a bounded surface from the task and state it. This is static triage, not whole-site
conformance or measured performance verification.

## When to Use

Use for a focused UI-code review across several interface concerns. Use a specialist audit when
the request already names a deeper accessibility, layout, typography, token or performance question.

## Context Loading

Identify the actual framework, rendered surface and applicable project policy before choosing lenses.
Read relevant rules and bridge notes only:

| Lens | Bridge | Read when |
| --- | --- | --- |
| Accessibility | [accessibility](references/accessibility.md) | Controls, semantics or input access change |
| Animation | [animation](references/animation.md) | Motion, interruption or animation ownership changes |
| Composition | [composition](references/composition.md) | Component/state boundaries change |
| Forms | [forms](references/forms.md) | Input, validation or submission changes |
| Images | [images](references/images.md) | Media sizing, loading or alternatives change |
| Hydration | [hydration](references/hydration.md) | Server/client rendering must reconcile |
| Interactive states | [interactive states](references/interactive-states.md) | Focus, hover, active or touch states change |
| Performance | [performance](references/performance.md) | Rendering or delivery may affect responsiveness |
| Typography | [typography](references/typography.md) | Reading, wrapping or numeric comparison changes |

Canonical policy lives in the applicable `.agent/rules/` and project specs. Load `tech-react.md`
only for React; framework-specific notes are not universal requirements. Read `pattern-ui-copy.md`
when reviewing product text. A bridge or filename prefix cannot override a conflicting requirement;
report the exact conflict and use the governing task/project contract.

## Approach

### Static Triage

Inspect source and affected primitives, including accessible naming through labels or composition.
Use `verify-rules` for relevant harvested checks rather than copying grep recipes.
Assess pattern matches in context: computed values, runtime setters, framework behavior and
documented exceptions can change the conclusion.

Consider these additional lenses when applicable:

- Navigation: preserve browser link behavior and URL state for views that should be bookmarkable
  or shareable. Do not require every transient UI state in a query parameter.
- Destructive actions: assess confirmation, undo and recovery against consequence and product intent.
- Touch: inspect scroll containment, gesture ownership and focus without unnecessarily disabling zoom.
- Themes: check declared color scheme and browser chrome against shipped themes.
- Locale: check locale-aware date/number output and its server/client consistency.
- Copy: apply the shared UI-copy rule in the actual interface context.

### Corroborate and Route

State whether a candidate is a demonstrated code/policy defect or an unverified runtime risk.
Follow `foundation-testing.md` for evidence and `foundation-browser-usage.md` for applicable
runtime capabilities. Route a material unanswered question to `audit-accessibility`,
`audit-layout`, `audit-typography`, `audit-design-system` or `audit-performance`.
Do not invoke every specialist merely because its lens appears in this menu.

## Output and Definition of Done

Group concise findings by file with source location, behavior, evidence, impact and applicable
rule/blocking policy. Each selected lens is `finding | checked-clean | not-applicable |
not-verified`, with scope and reason; pending proof names the check and owner.
A clean source scan is not a runtime pass. Zero findings is valid.
Use the caller's existing report/evidence location, retaining only needed redacted output.
No source, rule or configuration changes are part of this audit.
