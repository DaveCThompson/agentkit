---
trigger: model-decision
description: Consult when writing or reviewing buttons, labels, headings, tooltips, errors, empty or loading states, toasts, and other product UI text.
tier: core
domain: ui-copy
---

# UI copy

Add text sparingly. Every word should clarify an action, state, decision, risk, or accessibility need;
otherwise the interface is usually better without it.

## Defaults

- Use sentence case unless the product has an established style.
- Prefer the shortest natural phrase that keeps the meaning.
- Keep implicit completion when the surrounding UI makes the referent clear. Add the object when
  leaving it out could make the action ambiguous.
- Use concise action labels for buttons. `Save` is better than `Save your report` when the current
  context already identifies the report. Use `Create report` when a heading or action needs the object.
- Use headings to identify the page, task, object, or state. Do not turn every heading into an
  instruction.
- Use stable terms for the same object or action across the product.

## Specific surfaces

- Tooltips are optional. Use one for an unfamiliar or icon-only control, definition, or consequence
  that cannot fit naturally in the UI. Keep it concise and do not place critical task instructions
  only in a tooltip.
- Feedback should state the result directly. Add the next action when one exists; avoid filler such as
  `successfully` or `Oops`.
- Error text should state what happened, the cause when known and useful, and the next action. Do not
  blame the user.
- Empty and loading states should explain the state only when it affects what the user can do next.
- Preserve exact product names, commands, identifiers, and contractually exact strings.

## Review

Read the text in its real UI context. Check whether:

- the user can tell what happened or what to do;
- the text adds meaning rather than repeating nearby labels;
- the action, object, and consequence are clear at the point of use;
- the wording remains natural when translated or read aloud; and
- the same concept uses the same term elsewhere.

Do not make UI copy artificially explicit, terse, or grammatical at the expense of clarity. A concise
fragment is appropriate for a label; explanatory text should still be a complete, natural sentence.
