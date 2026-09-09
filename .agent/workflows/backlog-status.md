---
description: Derive an on-demand ticket view from canonical artifacts without maintaining a second backlog.
model: haiku
---

# Backlog Status Workflow

Read the resolved live ticket stores and their indexes. Enumerate actual `TICKET-*` files, including
locally ignored working docs; use bounded fallback if an index is incomplete. This is a read-only
status request, not permission to repair metadata, merge work or archive tickets.

Use `pattern-docs-artifacts.md` and `pattern-agent-orchestration.md` for lifecycle semantics:
frontmatter status is authoritative; legacy body status is a fallback. Distinguish ready, active,
blocked, reported, merged, closed and pending-human-proof states. Unknown or contradictory state
must remain visible. A reported deliverable is not necessarily landed or published; ancestry
evidence says nothing by itself about required acceptance.

Return a compact view of title/link, status, dependency/blocker, owner or next action where known.
Honor requested filters and state coverage limits. Show stale metadata as a candidate for review,
not an automatic status transition. Derive ordering from actual dependencies and priorities.

The default output is the reply. Persist only when requested, using the caller's path or an
exclusively owned output. Do not overwrite a shared LOG file or create a second manual backlog.
