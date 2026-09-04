---
description: Prepare a task for archive by resolving session state, finalizing durable work, and closing session-owned resources.
skill: [close, implement-session-wrap-up, implement-session-land]
---

# Close Workflow

## Goal

Leave the repository, documentation, resources, and task in an archive-ready state without deleting
ambiguous or shared work.

## Procedure

1. Load `close` and run its session-state check.
2. Route repository finalization through `implement-session-wrap-up`; when completion and push are
   authorized, route final integration through `implement-session-land`.
3. Run `close`'s resource cleanup only after repository state is known.
4. Return its archive receipt. Do not archive the task automatically.
