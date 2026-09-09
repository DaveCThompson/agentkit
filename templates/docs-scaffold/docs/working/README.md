# working/ — active queue

What's **IN FLIGHT** right now. Flat, no subdirectories. Only files with unresolved work stay here.

Prefixes include `TICKET-*`, `PLAN-*`, `PRD-*`, `REVIEW-*` and `LOG-*` (short-lived handoff only).
Keep draft requirements/design in the accepted work item. `SPEC-*` describes current truth in the KB.
If this queue keeps Git-ignored work, read its Git-ignored README.local.md companion when present.
Keep local rows there and public rows here. Both indexes point to work items; neither copies status.

When accepted work completes, scoped wrap-up may move the record to `../archive/YYYY-MM/` after
preserving its content and incoming/outgoing links. Required pending proof stays live here or has
an explicit live successor with its owner and next action. A local report is not a published result.
Promote applicable durable facts into `../knowledge-base/`; promotion does not approve a proposal.

| Item | Read it when… |
|---|---|

<!-- Add rows only for existing work items. Each row links the file and describes its scope;
     status stays in the work item. -->
