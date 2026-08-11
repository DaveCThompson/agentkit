# working/ — active queue

What's **IN FLIGHT** right now. Flat, no subdirectories. Only files with unresolved work stay here.
Prefixes: `TICKET-*` · `PLAN-*` · `SPEC-*` (draft) · `REVIEW-*` · `LOG-*` (short-lived handoff only).

When work completes, the wrap-up skill moves the file to `archive/YYYY-MM/` and, if the session made
something durably true, promotes that truth into `knowledge-base/` (harvest — don't let it ride to the
archive raw).

> **Epistemic caveat:** a doc here without a ⚠ drift marker has **not** necessarily been verified
> against current reality. Absence of the marker is not a freshness guarantee — check the date line.

## Routing table

**Next up:** `PROGRAM-STATUS.md` is the source of truth for where the program stands and what is
gated on the maintainer (checkpoint 2026-08-01). Per-ticket state lives in each ticket's own header, and
backlog items in `docs/backlog/README.md` — read them there rather than a summary here.

| Doc | Read it when… |
|---|---|
| `PROGRAM-STATUS.md` | you need the single source of truth for where the program stands — kit version, program phases, and what is gated |
| `TICKET-builder-cross-vendor-agent-compiler.md` | planning the generic agent render contract, Claude/Codex adapters, downstream Operator profile seam, tier mapping, or proj-resume regression proof; coordinates with U4 without replacing its status |
| `TICKET-akit-u4-subagent-roster-asset.md` | the subagent-roster asset design session; carries the 2026-07-25 adapter-strip design input |
| `TICKET-reconcile-fleet-docs.md` | reconciling any fleet project's `docs/` structure/naming/indexing to `governance/docs-standard.md` |

> **2026-07-31 late wave:** `TICKET-23`, `TICKET-24`, and `TICKET-31` ran as a three-lane parallel
> wave, merged, and were archived to `docs/archive/2026-07/` at the v0.13.0 release.

> The historical planning docs (`PLAN-kit-improvement`, `PLAN-v06-orchestration-and-tooling-hardening`,
> `IDEA-next-steps-and-problems`, the portal-v041 reconcile brief) were archived to
> `docs/archive/2026-07/` on 2026-07-05 — their programs are complete (through v0.6.0). Read them there
> for provenance; the live status is `PROGRAM-STATUS.md`.
>
> **2026-07-25 (v0.11.0 land):** the kinds-harvest program docs (`PLAN-agentkit-kinds`,
> `PLAN-agentkit-updates`, `TICKET-akit-p0…p5` — all shipped through v0.10.0, with commits verified
> ancestors of HEAD) and the version-dead `TICKET-reconcile-fleet-v052` brief (premise pinned to
> kit v0.5.2) were archived to `docs/archive/2026-07/`.
