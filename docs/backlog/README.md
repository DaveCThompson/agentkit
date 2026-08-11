# backlog/ — not yet started

Identified but not yet picked up. Flat, no subdirectories.
Prefixes: `IDEA-*` · `PLAN-*` · `TICKET-*`. When an item is picked up, move it to `working/`.

> **Epistemic caveat:** a doc here without a ⚠ drift marker has **not** necessarily been verified
> against current reality. Absence of the marker is not a freshness guarantee — check the date line.

## Live backlog

**Next up:** the cross-vendor compiler's decisions 2–6 are gated on the maintainer
(`working/TICKET-builder-cross-vendor-agent-compiler.md`; D2 carries the U4 box scan-root — U4
closed as a design session by `DECISION-agent-asset-boundary.md`). Fleet reconciles are
quiet-tree-gated; two pool findings are open (`F-cli-sync-dirties-kit`, `F-verify-zero-hex-severity`).
Per-ticket readiness, tier, and parallel-safety live in each ticket's own header; read them there
rather than here.

> **2026-07-31:** the docs-drift hardening batch (`TICKET-25` … `TICKET-30`) shipped and moved to
> `docs/archive/2026-07/`. Later that day `TICKET-23`, `TICKET-24`, and `TICKET-31` were picked up
> for a parallel wave and moved to `docs/working/`.

| Doc | Read it when… |
|---|---|
| `IDEA-post-v06-feedback.md` | the live fleet-feedback pool — where a fleet finding is stamped, adjudicated, and routed to a ticket |
| `IDEA-additional-tool-integrations.md` | deciding whether to formalize a new `integrations/*.md` (ast-grep, Context7, Semgrep, Serena, Supabase/Sentry MCP) — parked with merit, not yet built |

## Provenance moved to archive (2026-07)

**2026-07-25 (v0.11.0 land):** `TICKET-08/09/10` (shipped v0.8.0), `TICKET-16` (v0.9.0),
`TICKET-22` (shipped on main 2026-07-18), and `IDEA-permission-prompt-reduction.md` (shipped
2026-07-11 as `pattern-command-shape.md`) → `docs/archive/2026-07/` — all verified shipped via <!-- taxonomy-ignore-line -->
changelog/commit evidence before archiving.

The consolidation- and migration-era per-project docs and the **shipped** feedback pools were archived
to `docs/archive/2026-07/` on 2026-07-05 — the programs that consumed them are complete (through
v0.6.0) and per-project work now runs in each repo via the generalized reconcile briefs (publish/pull):
- per-project `IDEA-*` (Phase-C ideation) and `IDEA-improvement-*` (Phase-E overlay backlogs) — 15 docs
- `IDEA-improvement-core-backlog.md` (the improvement program's input, A–J — shipped)
- `IDEA-orchestration-fleet-feedback.md` + `IDEA-taxonomy-docs-tooling-feedback.md` (SHIPPED in v0.6.0)
- `IDEA-parallel-orchestration-skillset.md` (built as the v0.5.0 orchestration kit)
- `PLAN-docs-remediation-*` (7 per-project — superseded by `working/TICKET-reconcile-fleet-docs.md`)
- `TICKET-codex-action-items.md` (migration-era, resolved)
- `TICKET-01…07-*` (proj-resume + proj-portal-b feedback batch — **SHIPPED in v0.7.0**, 2026-07-06)
