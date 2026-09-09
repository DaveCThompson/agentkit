---
name: close
description: Use only when the user invokes `/close` or asks to prepare the task for archive, including unresolved decisions and session-owned resource cleanup; ordinary repository wrap-up uses `implement-session-wrap-up`.
tier: core
triggers: [close session, prepare archive, session cleanup]
---

# Close

Prepare a finished or paused task for archive while preserving resumable work and shared resources.
Preparation is complete when its retained state and next action are usable, not when every proposal
has shipped.

## When to Use

Use only for an explicit `/close` or task archive-preparation request. Repository wrap-up and
landing do not themselves request conversation archival.

## Approach

### 1. Resolve the session state

Read the conversation and relevant current workspace state. Separate answered/superseded questions
from actual remaining commitments. Classify unresolved items by what they block, what can be safely
deferred, and what is optional.

For a required decision, finish independent authorized preparation and stop only the dependent
action. Existing authority carries through delegation. Do not ask again merely because wrap or land
is the next skill; ask when a consequential missing decision or new target remains unresolved.

For paused work, retain the accepted outcomes/exclusions, completed work, remaining Acceptance,
branch/diff or artifact identity, useful failed proof, pending lanes/owners, active writers, and
actual external effects. Put the resumption pointer in the existing active work item. Do not archive
the only pointer to unfinished work.

### 2. Finalize durable work

Use `implement-session-wrap-up` as a bounded local record operation, passing finished versus paused
intent, existing evidence, ownership, and remaining proof. Failed implementation proof does not bar
preservation of a paused task and does not become a verified-repair claim.

Call `implement-session-land` only when the requested scope and existing grants cover integration
or publication and its proof prerequisites hold. Pass completed wrap steps so they are not repeated.
A retained unpublished branch is a valid close outcome.

Update owned durable knowledge/status only when the session changed that truth. Route shared-file
corrections and flowback to their owner. Preserve explained deferred/candidate/sync-pending work;
do not force a new document or adoption to close the conversation.

### 3. Close session-owned resources

Resolve exact target, authority, ownership, inactivity, and preservation before cleanup. Use the
shared Git/resource safety in `git-protocol.md` and external-effect recovery in
`pattern-external-mutation.md`.

- Servers/processes: stop only task-started instances verified unused by other work. Retain shared,
  unknown, or externally managed instances.
- Transient notes/caches: remove only disposable task-owned state after preserving useful evidence.
  Do not erase durable project knowledge or account memory.
- Worktrees/branches: inspect actual HEAD preservation and tracked, untracked, and useful ignored
  contents. A clean Git status or vanished branch name alone is insufficient. Use Git-native
  non-force removal for eligible inactive targets; retain everything uncertain.
- Browser sessions: close task-opened tabs/sessions only after confirming they contain no unsaved
  user state. Preserve unrelated tabs.
- Unavailable controls: report the resource retained rather than guessing or using an unrelated
  control surface.

On partial cleanup or unknown publication, record observed effects and exact retained targets.
Resume from those facts; do not repeat a destructive/external action blindly.

### 4. Prepare the archive receipt

State one supported outcome: prepared, prepared with retained work, or not ready with the precise
preservation/decision blocker. These are receipt descriptions, not new ticket-status values.

Report material unresolved commitments, local/integrated/published state, proof limits,
resumption pointer and next owner/action, plus resources removed or retained with reasons.
Keep routine receipts concise. Do not declare ready when the only useful partial work is
unrecoverable or a required preservation check is unresolved.

Do not archive the conversation unless the user explicitly requested that final action. If archive
is authorized and its control is available, apply it only after preparation and report its real result.

## Definition of Done

- Remaining decisions and accepted work are preserved with a usable resumption pointer.
- Repository records reflect verified state without inventing integration or publication.
- Cleanup affected only authorized, inactive, session-owned resources with preservation established.
- The receipt distinguishes prepared-with-retention from blocked preparation and names the next action.
- Conversation archival occurred only under its explicit grant.

## Evidence and Provenance

Original capability: T3 direct kit-owner request. Producer: staff · GPT-5.
The lifecycle procedure follows the shared authority, preservation, and evidence contracts.

## What we deliberately did NOT do

We did not discard ambiguous work, stop shared services, erase durable memory, or infer that closing
a conversation completes its unfinished acceptance.
