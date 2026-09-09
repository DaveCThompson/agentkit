---
name: write-clear
description: Use for ticket and handoff writing, meaning-preserving copy edits, or an explicit write-clear request. Prefer respond-clearly for direct agent responses, write-content for sustained prose, and write-ui-copy for short interface text.
tier: core
triggers: [clear writing, concise writing, rewrite, copy edit, session communication, ticket writing, UI copy]
---

# Write clearly

This public entry point remains available for existing callers. Route sustained content and short UI
work to `write-content` and `write-ui-copy`; use `respond-clearly` for direct responses. Preserve the
ticket, handoff and meaning-inventory method below when an existing invocation includes those jobs.

Turn the user's intent into text the intended reader can understand and act on without losing
meaning. [Flat communication](../../../.agent/rules/foundation-communication.md) owns shared prose
constraints and output patterns. Read [UI copy](../../../.agent/rules/pattern-ui-copy.md) for product text;
load it only when UI wording is in scope.

## When to Use

- Draft or tighten a message, ticket, handoff or technical document.
- Review confusing, verbose or inconsistent wording.
- Shape UI text in the context where the user will read it.

## Approach

1. Identify the audience, purpose and decision or action the text supports. Preserve the requested
   output and tone; an explanation may have no next action.
2. Inventory the meaning before editing: claims, attribution, requirements, proposals, conditions,
   exceptions, numbers, uncertainty, safety qualifiers and exact literals.
3. Choose a structure that exposes the main point and its material support. Keep procedures
   distinguishable from descriptions so readers know whether an action is required or merely
   being reported.
4. Tighten wording and remove repetition using the shared prose rule. Keep one term for the same
   concept and retain complete grammar where the text calls for sentences.
5. Compare the revision with the meaning inventory. Check whether any deletion changed who acts,
   when, under what conditions, with what confidence or authority. Restore wording when its
   omission could change the reader's action.

## De-slop pass

Remove phrasing that contributes neither meaning nor an intentional requested tone. Replace
inflated verbs with direct verbs, for example `utilize` → `use` and `prior to` → `before`.
Replace vague praise such as `robust` or `seamless` with the property actually supported, or omit it.

Distinguish filler hedging from evidence limits: remove “I just wanted to mention”; preserve
“likely caused by X; unverified.” Do not turn a reported claim, hypothesis or proposal into an
established fact. Preserve attribution and probability when they affect interpretation.

Resolve ambiguous conditions or choices only when the evidence supports the intended meaning.
If “as needed” or “and/or” hides a material unresolved choice, expose that uncertainty rather than
inventing a precise requirement. Do not restate a known error as fact; correct it briefly and
make any material departure from the supplied source clear.

## Apply by output

### Tickets and handoffs

Write an imperative outcome title and distinguish current truth from the gap. Carry settled
decisions, exclusions and existing authority forward. Acceptance criteria should describe
observable outcomes rather than ceremonial activity. Use ordered implementation steps when
they help the recipient; do not invent settled decisions to make the ticket appear ready.

Keep exact UI wording only when contractual. Otherwise capture intent and constraints so the
implementer can choose suitable copy. Reuse the work identity and recipient-appropriate detail
rather than duplicating a plan into another report.

### UI copy

Review wording in its actual surrounding interface, using the shared UI rule. Test whether
omitting the object or explanation still leaves the action and consequence clear. Retain required
instructions and accessible meaning at the point of use. A shorter label is not an improvement
when it conceals a consequential distinction.

### Compressed communication

Use the selected source and the command's requested format. Prioritize its central point and
material qualifier over secondary detail; do not imply exhaustive coverage. Preserve differences
between historical evidence and current state. A recap does not authorize its listed actions.

## Review output

- For a rewrite, show the revised text first.
- For a review, report material issues and provide a replacement when useful.
- Explain a tradeoff when it changes meaning, scope, tone or product behavior.
- Follow the shared artifact contract for durable reports, including
  `What we deliberately did NOT do` when required. Do not add report boilerplate to a short
  conversation response.

## Deliberate boundaries

Use fixed word counts, a controlled dictionary or full STE compliance only when the user or
project contract requests them. Preserve exact literals and necessary technical terms. Never
make prose concise by deleting meaning or resolve factual uncertainty through copy editing alone.

## Definition of done

The reader can find the main point and any actual action or decision. Claims retain their
conditions, attribution and evidence limits. Terminology is consistent, and wording remains
natural in its intended context. Any material departure from the source is visible.
