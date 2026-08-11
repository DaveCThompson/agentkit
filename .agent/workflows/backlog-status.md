---
description: Generate an ephemeral backlog view from distributed TICKET-* files — no second manual backlog.
model: haiku
---

# Backlog Status Workflow

Generate an on-demand overview of working tickets by reading the distributed `TICKET-*` files,
instead of maintaining a parallel `docs/backlog/` that drifts.

## Goal
A scannable, ephemeral status view derived from the `TICKET-*.md` files themselves.

## Inputs (optional)
- Status filter: `open` (`ready`/`in-progress`), `done` (`reported`/`merged`), `all` (default: `open`).
- Tier filter: `staff`, `senior`, `junior`, `all` (default: `all`) — read from the filename suffix.

## Procedure
1. **Scan — enumerate from the FILESYSTEM.** Glob `docs/working/TICKET-*.md` **and**
   `docs/backlog/TICKET-*.md`. Never build the list from a README: the index is the claim under
   test, and a ticket missing from it is exactly the one a sweep needs to catch. (A live bulk pass
   took "all 19" from an index and missed the unindexed 20th, which still read `ready` after it had
   merged.)
2. **Read metadata** — the real fields, per the ticket contract
   (`pattern-agent-orchestration.md` §2), in this precedence:
   - `status` from YAML frontmatter, else the `**Status**:` bold line (both are valid; the CLI reads
     either, and so do you).
   - `**Priority**` (`P0`–`P3`), `**Agent Tier**`, `**Verify**`, `**Depends**` — bold lines.
   - `updated` / `landed` from frontmatter where present.
   - The H1 for the title, and the tier suffix from the filename.
3. **Filter**: Apply the status/tier filters.
4. **Generate view**: Write `LOG-ticket-status-view.md` under `docs/working/` with
   `| Ticket | Title | Status | Priority | Tier | Verify | Depends |`, backlog and working sectioned
   separately.
5. **Cross-check, don't re-derive**: run `agentkit check --hygiene`. It reports landed-in-backlog and
   non-ancestor `landed:` SHAs, and prints the **generated human-gate view** (every
   `needs-human-verify` artifact). Surface those alongside the table rather than hand-assembling a
   second gate list — a hand-written one omitted a gate that was correctly marked on both its ticket
   and the board.
6. **Summarize**: total open count, anything blocked or awaiting a human gate, and a link to the view.

## Notes
- Never modifies any `TICKET-*` file — the generated view is disposable and regenerable at will,
  with zero merge-conflict risk.
- This exists specifically so the project needs no second, hand-maintained backlog.
- **Read only fields that exist.** Earlier versions of this workflow named `scope`, `category` and
  `created`, which appear in no ticket and in no template — a documented field set that was fiction.
  If you need a new axis, add it to the §2 contract and the template first.

## Example usage
- `/backlog-status` — all open tickets · `/backlog-status open staff` — open staff-tier tickets ·
  `/backlog-status all` — everything.
