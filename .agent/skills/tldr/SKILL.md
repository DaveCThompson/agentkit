---
name: tldr
description: Use when the user invokes `/tldr` or asks for a three-point ultra-short recap of the latest answer or current session.
tier: core
triggers: [tldr, short recap, three bullets]
---

# TL;DR

Compress the requested scope without changing its meaning.

## When to Use

- The user invokes `/tldr` or requests this exact short format.

## Approach

1. Default to the latest substantive assistant answer. Use the whole session only when the user
   names the session or asks for broader context.
2. Select three material points from that source. For task-status recaps, prioritize result,
   current state, and next action or blocker when they exist; conceptual explanations need none
   of those fields. For a sparse source, subdivide truthfully or state an explicit absence rather
   than manufacturing a third claim.
3. Return exactly three Markdown bullets. Each bullet contains at most nine whitespace-delimited
   words, excluding the bullet marker.
4. Add no heading, introduction, conclusion, or new recommendation.
5. Preserve the central claims and material uncertainty or attribution before secondary detail.
   Correct a known error briefly within the format; do not repeat it as established fact or imply
   exhaustive coverage.

## Definition of Done

- [ ] The response contains exactly three bullets.
- [ ] Every bullet contains fewer than ten words.
- [ ] The three bullets preserve the material meaning.

## Evidence and Provenance

T3 direct kit-owner request. Producer: staff · GPT-5.

## What we deliberately did NOT do

We did not claim that three short bullets preserve every transcript detail.
