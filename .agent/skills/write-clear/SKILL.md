---
name: write-clear
description: Draft, rewrite, or review clear and concise session messages, tickets, handoffs, reports, technical prose, and product UI copy. Use when wording is confusing, verbose, inconsistent, or missing an actionable next step.
tier: core
triggers: [clear writing, concise writing, rewrite, copy edit, session communication, ticket writing, UI copy]
---

# Write clearly

Turn the user's intent into flat, literal, concise text. Consult `foundation-communication.md` for
general prose and `pattern-ui-copy.md` for product text.

## Approach

1. Identify the audience, purpose, and decision or action the text must support.
2. Classify the text as a procedure, explanation or report, ticket, or UI copy. Do not mix procedure
   and description in the same paragraph.
3. Preserve facts before tightening: scope, conditions, exceptions, numbers, uncertainty, safety
   qualifiers, and exact literals.
4. Lead with the result, current state, action, or decision. Add only the evidence or context needed.
5. Write one fact per sentence and one topic per paragraph. Use direct verbs, simple tenses, stable
   terms, periods, and lists.
6. Remove repetition, filler, hedging, praise, apology, meta-commentary, idiom, and decoration.
7. Keep complete grammar. Restore explicit wording when an omission could change the reader's action.

## Procedure and report patterns

- Procedure: use imperative steps, put conditions and warnings first, and use one action per step.
- Session update: result → evidence → next action or blocker.
- Error: what happened → cause, if known → fix.
- Incident: time → impact → cause → remediation.
- Release note: action or command → risk.
- Ticket: current state → gap → decision → acceptance.

## De-slop pass

Delete words and phrases that add tone but no fact, such as `absolutely`, `simply`, `just`, `clearly`,
`importantly`, `it is worth noting`, and `in order to`.

Replace inflated wording with direct wording: `utilize` → `use`, `leverage` → `use`, `prior to` →
`before`, `facilitate` → `help`, `enables you to` → `can`, and `dive into` → `read` or `examine`.

Delete vague claims such as `robust`, `powerful`, `seamless`, and `comprehensive` unless they name a
measurable property. Replace `as needed` with the actual condition. Replace `and/or` with the exact
allowed choices.

## Apply by output

### Session communication

State the result or current state first. Then give material evidence, the next action, and any
blocker, assumption, uncertainty, or decision needed. Do not narrate tool calls or repeat an
unchanged summary.

### Tickets and handoffs

- Write an imperative outcome title.
- State the current truth, gap, and user impact.
- Record settled decisions and constraints.
- Use ordered, implementable steps when they help.
- Make acceptance criteria observable, with one claim per checkbox.
- Use exact UI wording only when it is contractual; otherwise capture intent and constraints.

### UI copy

- Add text only when it clarifies an action, state, decision, risk, or accessibility need.
- Prefer sentence case and short, natural action labels.
- Omit an object when context makes it obvious; include it when omission creates ambiguity.
- Use tooltips for non-obvious, non-critical help—not as a hiding place for required instructions.
- For errors, state the problem and the next action; include the cause when known and useful.

## Review output

- For a rewrite, show the revised text first.
- For a review, report only material issues and show a replacement when useful.
- Explain a tradeoff only when the change affects meaning, scope, tone, or product behavior.
- End durable artifacts and reports with `What we deliberately did NOT do`.

## Deliberate boundaries

Use these structural rules by default. Use fixed word counts, a controlled dictionary, or full STE
compliance only when the user or project contract explicitly requests it. Do not force explicit wording
into UI when context is clear. Never make prose concise by deleting meaning.

## Definition of done

- The reader can find the result, action, state, blocker, or decision quickly.
- The text preserves all material facts and qualifiers.
- The same concept uses the same term.
- The wording sounds natural when read aloud.
- The next action or missing decision is clear when one exists.
