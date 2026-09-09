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

1. Collect task steps from available conversation and check results. Inspect only material state
   likely to have changed. Distinguish historical proof from current claims; qualify missing
   evidence rather than rerunning broad checks to produce a checklist.
2. Reconcile steps against the latest accepted scope. Exclude cancelled or superseded commitments
   from outstanding work; note their removal only when material to understanding the session.
   Label optional recommendations as optional, not required work.
3. Use **Completed** and **Outstanding** sections.
4. Mark verified completed steps with `[x]`. Mark incomplete, blocked, uncertain, or user-decision
   steps with `[ ]`.
5. Include pending verification, cleanup, documentation, commit, push, and decisions only when
   they belong to the requested workflow. Do not hide an accepted item because another blocks it.
6. Add a short qualifier to uncertain items instead of marking them complete. If nothing remains,
   say so under **Outstanding**. Listing an action does not authorize performing it.

## Definition of Done

- [ ] Every known completed step has a checked item.
- [ ] Every known accepted remainder or decision has an unchecked item.
- [ ] Checkbox state matches verified reality.

## Evidence and Provenance

T3 direct kit-owner request. Producer: staff · GPT-5.

## What we deliberately did NOT do

We did not claim knowledge beyond the available conversation and workspace evidence.
