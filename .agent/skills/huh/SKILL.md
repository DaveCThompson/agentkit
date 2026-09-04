---
name: huh
description: Use when the user invokes `/huh` or asks to hear the latest explanation again in one line of simple English.
tier: core
triggers: [huh, simple English, say that again]
---

# Huh

Restate the latest explanation without adding a second explanation.

## When to Use

- The user invokes `/huh` or says the preceding explanation was unclear.

## Approach

1. Use the latest assistant explanation, or the specific point named by the user.
2. Preserve its central meaning and required next action.
3. Return one plain-English sentence on one line, with no heading, list, aside, or follow-up.
4. If no explanation is available, say that in one line.

## Definition of Done

- [ ] The response is one line and one sentence.
- [ ] Common words replace avoidable jargon.
- [ ] No material condition or action changed.

## Evidence and Provenance

T3 direct kit-owner request. Producer: staff · GPT-5.

## What we deliberately did NOT do

We did not add background detail; `/walk` handles progressive explanation.
