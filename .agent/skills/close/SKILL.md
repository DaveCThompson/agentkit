---
name: close
description: Use only when the user invokes `/close` or asks to prepare the task for archive, including unresolved decisions and session-owned resource cleanup; ordinary repository wrap-up uses `implement-session-wrap-up`.
tier: core
triggers: [close session, prepare archive, session cleanup]
---

# Close

Prepare a finished or paused task for archive without deleting ambiguous work or disrupting shared
resources.

## When to Use

- The user explicitly invokes `/close` or requests the full session-close procedure.

## Approach

### 1. Resolve the session state

1. Review the conversation and verified workspace state.
2. List every unanswered question, approval, decision, blocker, and incomplete commitment owed by
   the user or agent.
3. If a missing user decision changes what would be committed, pushed, stopped, or archived, stop
   and ask for it before final cleanup.

### 2. Finalize durable work

1. Route repository verification, changelog, and document lifecycle work through
   `implement-session-wrap-up`.
2. When the work is complete and the user authorized landing or pushing, route branch integration,
   stale-worktree cleanup, and remote verification through `implement-session-land`.
3. Update an existing wiki, knowledge-base, or status Markdown file only when the session established
   durable truth or changed active status. Keep event history in the changelog. Do not create a
   duplicate session summary.

### 3. Close session-owned resources

- **Servers and processes:** stop only instances started by this task and proven unused. Retain and
  report shared, unknown, or externally managed instances.
- **Transient memory:** clear disposable task notes, caches, and temporary agent state only when
  ownership and recoverability are known. Never erase account memory or durable project knowledge.
- **Worktrees:** enumerate with Git. Remove only clean, inactive worktrees whose branches are merged
  or gone. Retain dirty or ambiguous worktrees with the exact reason.
- **Browser sessions:** close only tabs or sessions opened by this task that contain no unsaved user
  state. Never close the user's unrelated tabs.
- If a required control surface is unavailable, report the resource as retained instead of guessing.

### 4. Prepare the archive receipt

Report unresolved decisions, landed or retained work, resources closed, resources retained,
documentation updated, verification evidence, and the next action. State that the task is ready for
archive. Do not archive the conversation unless the user explicitly asks for that final action.

## Definition of Done

- [ ] Outstanding decisions and incomplete work are explicit.
- [ ] Durable repository and wiki state are current.
- [ ] Only verified session-owned resources were closed.
- [ ] The archive receipt identifies every retained resource and reason.
- [ ] The task is prepared for archive but not silently archived.

## Evidence and Provenance

T3 direct kit-owner request. Producer: staff · GPT-5.

## What we deliberately did NOT do

We did not delete dirty worktrees, stop shared services, erase durable memory, or archive the task
without explicit authorization.
