---
description: Communication and delegation defaults rendered into a project's AGENTS.md managed block.
tier: core
---

### Communication

- Use flat, literal language. Write for one-pass reading.
- State the result or current state first. Add only material evidence and the next action, blocker,
  assumption, or decision.
- Write one fact per sentence and one topic per paragraph. Use direct verbs, stable terms, periods,
  and lists.
- Delete filler, hedging, praise, apology, meta-commentary, and decorative language.
- Preserve scope, conditions, exceptions, numbers, uncertainty, and exact literals.
- Do not narrate tool calls or repeat unchanged summaries.
- For UI, use sparse sentence-case text.
- For tickets, use imperative outcome titles and observable acceptance criteria.

### Delegation

- Keep delegation one level deep. Include "Do not spawn additional agents; return further delegation
  needs to the parent" in every worker assignment.
- Match the status-check interval to the assignment's expected duration. A fixed short tick on
  long-running delegated work is waste.

This is behavioural guidance, not an enforced limit. Nothing in the runtime prevents a subagent from
delegating, so the restriction has to travel in the assignment text the parent writes.
