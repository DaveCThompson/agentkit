---
description: Close out scoped local work with reusable proof and honest remaining state.
skill: implement-session-wrap-up
---

# Wrap-Up Workflow

Use `implement-session-wrap-up` for ordinary local session closeout. Pass the owned changes,
accepted outcomes, remaining proof lanes, existing receipts, grants and resource ownership.
The skill owns light/full trigger selection, the cite-or-run gate, documentation and flowback
dispositions. Do not duplicate those procedures or create a wrap/land recursion here.

Local wrap does not imply push, deployment, merging or app-task closure. Return completed work,
confirmed evidence and any retained remainder. If landing is separately authorized, return to
that caller with the receipt; otherwise stop at the local handoff.
