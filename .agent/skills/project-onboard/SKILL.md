---
name: project-onboard
description: Load project context index-first — read the routers (AGENTS.md, KB trigger table, working README), not the corpus; deep pass only for a genuinely unfamiliar repo. Use when starting a new session or on a significant context switch.
tier: core
---

# Project Onboard

Orient by reading the project's **maps**, then route to individual docs only when the session's
task matches them. The read side of the KB contract (`governance/docs-standard.md` §d) exists so
onboarding costs ~5 file reads, not a corpus scan.

> Scoped recon of one *unfamiliar area* (a module or domain) before working in it — landmines,
> hidden constraints, exemplars — is `blindspot-pass`, not this skill. Onboard reads the whole-repo
> routers; blindspot-pass goes deep on one surface.

## Approach

### Light onboard (default) — read the routers only

1. **`AGENTS.md`** — the entrypoint: protocol, rule surface, project shape.
2. **KB README trigger table** (`docs/knowledge-base/README.md`) — the map of every durable
   spec/strategy/decision, phrased as *when to read it*. Read the table; do **not** read the docs
   it points to yet. Respect ⚠ drift markers — a flagged doc is verify-before-trust.
3. **`docs/working/README.md`** — the active queue and branch truth (plus the branch-state note in
   `docs/working/` if the project keeps one).
4. **Manifest scan** — `package.json` (or equivalent): scripts, workspaces, key dependencies.

Target: ~5 file reads. Orientation is done when you know the protocol surface, where durable
truth lives, and what's in flight.

### Route, don't read

Individual KB docs are read **at the moment of need**, not during onboarding:

- When the task names files, match them against KB `applies-to` globs — mechanically via
  `agentkit check --kb <paths…>` where the CLI is available — and read what matches.
- Otherwise, scan the trigger table for rows matching the session's task.
- Honor the **"read 1–3 KB docs" rule** (docs-standard §d): not none, not all.

### Truth ranking — when the routers disagree

Onboarding reads several surfaces and they will not always agree. The order is fixed:

> **code > status board > CHANGELOG narrative**

A **CHANGELOG entry is a point-in-time record**, true when written and superseded by every later
entry — never a statement of current behavior. This is not hypothetical: an agent briefed from a
changelog head carried a "shipped" claim into a review brief after a later wave had changed the
behavior out from under it. When a status board and a doc's prose disagree, the board wins; when the
board and the code disagree, the code wins and the board's owner is told — you do not adjudicate
program state from an onboarding seat.

### Index-health check (flag, don't compensate)

If the KB README is a bare title list instead of a trigger table, that is a docs-standard §d
defect: **flag it to the user and suggest `maintain-docs`**. Do NOT compensate by reading the
whole KB — that hides the defect and burns the context the contract exists to protect.

### Deep onboard (exception) — only on explicit request or a genuinely unfamiliar repo

Triggers: the user asks for a deep/full onboard, or you have never worked in this repo and the
task is architectural (not a scoped fix). Adds:

1. Foundation docs under `docs/knowledge-base/` (project overview, vision, terminology —
   whichever the project keeps).
2. The architecture-and-stack overview under `docs/knowledge-base/overview/`.
3. A scan of `.agent/rules/*.md` headings (full reads only for rules matching the task).
4. Codegraph: if MCP tools are available, use `use-codegraph` to confirm the repo is indexed; run
   `index_repository` if missing. Use graph queries to identify the feature slice, callers, and
   shared dependencies before broad source-file reads.

## Verification / Definition of Done

- [ ] Light onboard stayed within the router set (~5 reads); every further doc read is justified
      by a trigger-table row or `applies-to` match.
- [ ] The onboard output states which tier ran and, for deep, what triggered it.
- [ ] A non-trigger-table KB index was flagged, not silently compensated for.
