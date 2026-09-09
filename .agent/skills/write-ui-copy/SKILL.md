---
name: write-ui-copy
description: Draft or review short interface text such as buttons, labels, headings, tooltips, errors, empty states, and confirmations when the wording must fit a real UI state and action. Use when a named writing style is optional context for interface copy.
tier: core
triggers: [button label, UI copy, interface text, tooltip, error message, empty state, confirmation text]
conflicts-with: [write-content, manage-writing-style]
---

# Write interface copy

Use this skill for short text that appears inside a product interface. Consult `pattern-ui-copy.md`
and preserve the component's action, state, consequence, accessibility, and terminology constraints.

## Approach

1. Identify the interface surface, user action or state, consequence, audience, and space or platform
   constraints.
2. Preserve the product's established terms and the real control semantics. Ask for context when a
   label cannot be judged outside its surrounding UI.
3. Draft the shortest natural sentence-case wording that makes the action or state clear.
4. For errors, state the problem and the next action. For confirmations, make the consequence explicit.
5. Check accessible names, localization risk, truncation, tone, and consistency with nearby controls.
6. If the user names a style, load it as optional qualitative voice context. Style cannot override facts,
   required terminology, accessibility, safety, evidence, or the control's action.

## Boundaries

- Do not use this skill for sustained website content, help, reports, or long-form editorial prose; use
  `write-content` for those.
- Do not mutate a writing profile. “Add this to my writing style” belongs to `manage-writing-style`.
- Do not copy distinctive exemplar phrases into product text. Preserve meaning and write for the state.
- Do not force a fixed word count or a universal blacklist.

## Definition of done

- The control, state, consequence, or recovery action is clear in context.
- The text is concise, sentence case, accessible, and consistent with product terminology.
- The wording preserves required facts and does not imply an unsupported action or outcome.
- A named style, when used, affects voice only and does not weaken the UI contract.

## What we deliberately did NOT do

- Replace product semantics with a personal voice.
- Hide required instructions in tooltips or decorative text.
- Optimize copy for lexical diversity or AI-detector scores.
- Treat a style profile as permission to change an action, state, or consequence.
