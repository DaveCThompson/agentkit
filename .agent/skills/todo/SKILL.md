---
name: todo
description: Use when the user invokes `/todo` or asks for a complete checkmark list of session steps completed and outstanding.
tier: core
triggers: [todo, progress checklist, completed and outstanding]
---

# Todo

Expose the session's complete known work state as a Markdown checklist.

## When to Use

- The user invokes `/todo` or asks for a completion and remainder checklist.

## Approach

1. Collect task steps from the conversation and verified workspace state.
2. Use **Completed** and **Outstanding** sections.
3. Mark verified completed steps with `[x]`. Mark incomplete, blocked, uncertain, or user-decision
   steps with `[ ]`.
4. Include pending verification, cleanup, documentation, commit, push, and decision work when they
   apply. Do not hide an item because another item blocks it.
5. Add a short qualifier to an uncertain item instead of marking it complete.

## Definition of Done

- [ ] Every known completed step has a checked item.
- [ ] Every known remainder or decision has an unchecked item.
- [ ] Checkbox state matches verified reality.

## Evidence and Provenance

T3 direct kit-owner request. Producer: staff · GPT-5.

## What we deliberately did NOT do

We did not claim knowledge beyond the available conversation and workspace evidence.
