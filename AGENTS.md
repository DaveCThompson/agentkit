# agentkit — the canonical vendor-agnostic agent kit

This repo is the **home of record** for the agent system. One `.agent/` source of truth;
vendor surfaces (`.claude/ .agents/ .gemini/ .opencode/`) are **generated** by the `agentkit` CLI,
never authored. This repo is also a kit-managed project: it syncs itself with its own tool and is
developed using its own skills. Your fleet roster, MCP config, and working docs stay local
(gitignored); ship-safe templates live alongside.

## Invariants (non-negotiable)
1. Author in `.agent/` only. A hand edit to a generated vendor file is drift; `agentkit check`
   will say so. (`.agents/` — plural — is Codex's *generated* skill surface. `.agent/` — singular —
   is the source. If you're editing, you want `.agent/`.)
2. `manifest.json` and `.agentkit.lock` are machine-written. Never hand-edit.
3. No mtime-based reasoning anywhere — staleness comes from the lock and git history.
4. Flat over nested: no new folder or nesting level without proving a prefixed flat file can't do
   the job. Vendor differences live in `adapters.mjs` as code, never as mirrored directories.
5. Every content change to `.agent/` ships with a CHANGELOG entry; version semantics:
   patch = content fix · minor = new asset/behavior · major = shape/contract change.

## Context-load order
1. This file.
2. `governance/overlay-contract.md` — what the kit owns vs projects.
3. `governance/mirror-contract.md` — how generation + drift detection work.
4. The specific `.agent/` asset you're touching, plus `governance/best-practices.md` for its shape.
5. The governance `DECISION-*.md` records — only for why-questions about a settled choice (append-only decision log).

## Operations
- `node agentkit.mjs sync .` — self-sync (regenerates this repo's own `.claude/`).
- `node agentkit.mjs check . --quick` — drift check (also runs from the session-start hook).
- `node agentkit.mjs doctor` — fleet rollup; `inventory` — variant matrix.
- `npm test` — REQUIRED green before committing CLI or adapter changes.

## Communication and writing

Use the canonical writing guidance for sessions, tickets, reports, handoffs, and product UI text:

- `.agent/rules/foundation-communication.md` — clear, concise session and technical prose.
- `.agent/rules/pattern-ui-copy.md` — sparse, contextual UI copy.
- `.agent/skills/write-clear/SKILL.md` — drafting, rewriting, and review workflow.

Defaults:

- Use flat, literal language. Write for one-pass reading.
- State the result or current state first. Add only material evidence and the next action, blocker,
  assumption, or decision.
- Write one fact per sentence and one topic per paragraph. Use direct verbs, stable terms, periods,
  and lists.
- Delete filler, hedging, praise, apology, meta-commentary, and decorative language.
- Preserve scope, conditions, exceptions, numbers, uncertainty, and exact literals.
- Do not narrate tool calls or repeat unchanged summaries.
- For UI, use sparse sentence-case text.
- For tickets, use imperative outcome titles and observable acceptance criteria.

## Workflows (slash commands)
<!-- >>> AGENTKIT WORKFLOWS >>> (generated — do not edit; run 'agentkit sync') -->
| Command | What it does |
| --- | --- |
| `/architect` | Produce a technical architecture specification after PRD approval. |
| `/async-maint` | Run non-blocking maintenance jobs (deps, bundle, git, a11y) that emit timestamped health reports. |
| `/audit` | Universal audit router. Run a scoped or full, scan-only health audit citing rule/invariant violations. |
| `/backlog-status` | Generate an ephemeral backlog view from distributed TICKET-* files — no second manual backlog. |
| `/build` | Implement a feature from an approved plan, with per-phase verification and a hostile-QA gate. |
| `/debug` | Debug with systematic root-cause analysis; a failing reproduction test is mandatory before any fix. |
| `/explore` | Exploration hub. Routes an ideation request to the matching explore-* skill before any plan is drafted. |
| `/land` | Land the session on origin/main — wrap-up + changelog, backlog/working archived clean, READMEs + status current with next steps, worktrees and merged branches closed, ff-merge pushed. |
| `/onboard` | Rapidly load project context by reading the routers (indexes), not the corpus — deep pass only for an unfamiliar repo. |
| `/plan` | Scale-evaluate a request, then produce an approved implementation plan (feature or architecture). |
| `/prd` | Create an approved Product Requirements Document for a large feature or epic. |
| `/quick-fix` | Atomic fix for small bugs or tweaks (≤30 lines, ≤5 files) with a scope guard. |
| `/refactor` | Restructure code with zero behavior change, guarded by an invariant + DX-standards check. |
| `/research` | Conduct external research and synthesize findings into project-specific recommendations. |
| `/ship` | Take a ticket and ship it — contract-driven implementation from Decision lines through Acceptance to a drift-proof closeout. |
| `/test` | Generate unit/integration/reproduction tests following the project's existing test patterns. |
| `/verify-pre-deploy` | Pre-production GO/NO-GO verification — automated checks plus a project-defined manual-flow gate. |
| `/wrap-up` | Session exit protocol — cite-or-run technical gate, changelog, archival, and opportunistic branch closure; full wrap (codify, session log) only on deterministic triggers. |
<!-- <<< AGENTKIT WORKFLOWS <<< -->
