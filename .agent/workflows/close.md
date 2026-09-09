---
description: Prepare a task for archive while preserving pending work and session-owned resources.
skill: close
---

# Close Workflow

Use `close` for an explicit request to prepare this task for archive. Pass the latest scope,
remaining work, resource ownership, existing grants and verification receipts.

The skill owns the choice between finished closeout and a recoverable pause, and invokes local
wrap or landing only when applicable and authorized. Do not separately run every lifecycle skill.
Return what is finalized, what remains, where it resumes, and which resources were closed or
retained. Unknown ownership or pending acceptance must not be erased to make the task look complete.
