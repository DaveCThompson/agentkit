---
trigger: model-decision
description: Consult when designing hover, focus, click and completion states for cards and lists — coordinated feedback, actual action availability, semantic hit targets and scannability.
tier: kind:app
domain: layout
---

# Interaction Patterns

Make affordances match the action actually available. Preserve navigation, selection, completion
and secondary actions; a particular hover palette or card implementation is a project convention.

## 1. Promoted Indicator Pattern (Sync-Hover)

For a card with one primary action, coordinating the parent and its decorative CTA can clarify
the target. Use the project's selectors, including focus-visible/focus-within where appropriate.
Do not show a pressed/selected state merely because a pointer hovered it, or highlight an unrelated
secondary action as if it were the primary one. Verify touch has sufficient cues without hover.

<a id="2-inert-completion-policy"></a>

## 2. Completion and action availability

Distinguish completion from availability. A completed task may still support viewing, reopening,
downloading or another action. Keep those actions operable and visibly discoverable.
Only a genuinely unavailable action loses its interactive affordance and, where appropriate,
its Tab stop. Preserve readable status and avoid leaving a focusable invisible control.
Flat or recessed styling is optional; do not impose a shadow policy on all terminal records.

## 3. Whole-Card Interaction Model (Fitts's Law)

An enlarged target can improve acquisition, but is not suitable for every selectable row or card.
Use a real link for navigation, preserving modified-click/open-in-new-tab behavior; use a button
for an action. A custom button needs equivalent keyboard semantics, including Enter/Space, but
`role="button"` is not correct for a navigation link.

Keep secondary controls as separate valid targets rather than nesting interactive elements in a
primary button/link. A stretched-link or delegated-card pattern needs tests for text selection,
overlap, focus and event ordering. `stopPropagation()` can stop bubbling; it does not cancel a
link's default action or repair invalid nested markup. Use event handling only for the intended
semantics. See [HTML links](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element)
and `foundation-accessibility.md`.

## 4. Neutral Scannability

Prefer subdued feedback in dense lists when it fits the design, while preserving meaning and
contrast. Brand or alert colors can be correct for their actual roles; neither a neutral token nor
“darken light mode/lighten dark mode” proves legibility. Inspect composed backgrounds and focus,
hover, selected, unavailable and completed states across supported themes.
