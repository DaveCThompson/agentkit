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

1. Use available conversation and check results. Inspect only material facts likely to have
   changed; do not run broad verification just to write a recap. Distinguish historical evidence
   from current claims, and qualify current state when it cannot be checked.
2. Reconcile the latest accepted scope and separate completed actions from proposals, intentions,
   superseded work, and failed attempts.
3. Report four compact sections: **Purpose**, **Completed**, **Current state**, and **Next**.
4. Put unresolved decisions that still affect accepted work under **Next**. Otherwise state the
   next concrete action, or `None; the requested work is complete` when supported.
5. Label missing or uncertain history. Never reconstruct it as fact. This recap does not itself
   authorize performing the actions it describes.

## Definition of Done

- [ ] The user can identify the goal and current state in one pass.
- [ ] Completed work is evidence-backed.
- [ ] The next action or decision is explicit.

## Evidence and Provenance

T3 direct kit-owner request. Producer: staff · GPT-5.

## What we deliberately did NOT do

We did not infer actions from missing or compacted conversation history.
