---
name: walk
description: Use when the user invokes `/walk` or asks to work through an explanation or plan one point at a time.
tier: core
triggers: [walk, walkthrough, one by one, step by step]
---

# Walk

Turn the current explanation or plan into a user-paced walkthrough.

## When to Use

- The user invokes `/walk` or asks to take the points one at a time.

## Approach

1. Use the points from the latest relevant answer unless the user supplies another list.
2. State how many points exist, then explain only the first point in plain language.
3. Include the practical action or consequence when one exists.
4. End with `Say next when you're ready.` Continue with exactly one point per user cue, in the
   original order.
5. If no points are identifiable, ask which statement the user wants explained.

## Definition of Done

- [ ] One point is explained per turn.
- [ ] The original order and meaning are preserved.
- [ ] The user controls when the walkthrough advances.

## Evidence and Provenance

T3 direct kit-owner request. Producer: staff · GPT-5.

## What we deliberately did NOT do

We did not advance through later points without the user's cue.
