---
name: remind
description: Use when the user invokes `/remind` or asks what the current session is about, what happened, and where it stands.
tier: core
triggers: [remind, session recap, where are we]
---

# Remind

Reorient the user using the conversation and verified workspace state.

## When to Use

- The user invokes `/remind` or returns to a session without its context.

## Approach

1. Separate completed actions from proposals, intentions, and failed attempts.
2. Report four compact sections: **Purpose**, **Completed**, **Current state**, and **Next**.
3. Put every unresolved user decision under **Next**. If none remains, state the next concrete
   action.
4. Label missing or uncertain history. Never reconstruct it as fact.

## Definition of Done

- [ ] The user can identify the goal and current state in one pass.
- [ ] Completed work is evidence-backed.
- [ ] The next action or decision is explicit.

## Evidence and Provenance

T3 direct kit-owner request. Producer: staff · GPT-5.

## What we deliberately did NOT do

We did not infer actions from missing or compacted conversation history.
