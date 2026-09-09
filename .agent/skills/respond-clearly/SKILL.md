---
name: respond-clearly
description: Draft, rewrite, or review the agent's direct responses to the current user when the message needs simple, concise wording, a clear status, decision, blocker, or next step. Do not use for sustained content, UI copy, or writing-style management.
tier: core
triggers: [clear response, concise response, explain clearly, status update, decision explanation, next steps]
conflicts-with: [write-content, write-ui-copy, manage-writing-style]
---

# Respond clearly

Use this skill for the agent's direct communication with the current user: answers, status updates,
explanations, decisions, blockers, and next steps. Consult `foundation-communication.md` for the
general prose standard.

This is a communication skill, not a general copy editor. Route sustained website, help, report, or
content-heavy UI work to `write-content`; route short product interface text to `write-ui-copy`; route
writing-profile mutations to `manage-writing-style`.

## Approach

1. Identify the user's question, current state, decision, or requested action.
2. Lead with the result, current state, action, or decision. Add only the evidence or context needed.
3. Preserve facts before tightening: scope, conditions, exceptions, numbers, uncertainty, safety
   qualifiers, and exact literals.
4. Write one fact per sentence and one topic per paragraph. Use direct verbs, simple tenses, stable
   terms, periods, and lists.
5. Remove repetition and filler. Preserve material probability, attribution and evidence limits;
   a reported claim or hypothesis must not become an established fact. Keep the requested tone.
6. Restore explicit wording when an omission could change the user's action or understanding.
7. End with the next action, blocker, assumption, uncertainty, or decision needed when one exists.

## Response patterns

- Answer: answer → material qualification or evidence.
- Status: result → evidence → next action or blocker.
- Error: what happened → cause, if known → recovery action.
- Decision: decision → reasons or constraints → consequence.
- Handoff: current state → completed work → remaining action → owner or dependency.

## De-slop pass

Delete words and phrases that add tone but no fact, such as `absolutely`, `simply`, `just`, `clearly`,
`importantly`, `it is worth noting`, and `in order to`.

Replace inflated wording with direct wording: `utilize` → `use`, `leverage` → `use`, `prior to` →
`before`, `facilitate` → `help`, `enables you to` → `can`, and `dive into` → `read` or `examine`.

Delete vague claims such as `robust`, `powerful`, `seamless`, and `comprehensive` unless they name a
measurable property. Resolve `as needed` or `and/or` only when the actual condition or allowed choices
are established; otherwise keep the uncertainty explicit rather than inventing precision.

## Review output

- For a rewrite, show the revised text first.
- For a review, report only material issues and show a replacement when useful.
- Explain a tradeoff only when the change affects meaning, scope, tone, or product behavior.
- Do not narrate tool calls or repeat an unchanged summary.

## Definition of done

- The user can find the answer, state, action, blocker, or decision quickly.
- The message preserves all material facts and qualifiers.
- The same concept uses the same term.
- The wording sounds natural when read aloud.
- The next action or missing decision is clear when one exists.

## What we deliberately did NOT do

- We did not make this a general content-writing, copy-editing, or UI-copy skill.
- We did not delete meaning to make a response shorter.
- We did not use a universal banned-word list or optimize for an AI-detector score.
