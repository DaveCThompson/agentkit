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
- `node agentkit.mjs sync .` — self-sync (regenerates this repo's local vendor surfaces).
- `node agentkit.mjs check . --quick` — drift check (also runs from the session-start hook).
- `node agentkit.mjs doctor` — fleet rollup; `inventory` — variant matrix.
- `npm test` — REQUIRED green before committing CLI or adapter changes.

## Communication and writing

Use the canonical writing guidance for sessions, tickets, reports, handoffs, and product UI text:

- `.agent/rules/foundation-communication.md` — clear, concise session and technical prose.
- `.agent/rules/pattern-ui-copy.md` — sparse, contextual UI copy.
- `.agent/skills/write-clear/SKILL.md` — drafting, rewriting, and review workflow.
- `.agent/skills/respond-clearly/SKILL.md` — direct agent responses.
- `.agent/skills/write-content/SKILL.md` — sustained reader-facing prose.
- `.agent/skills/write-ui-copy/SKILL.md` — short interface text.
- `.agent/skills/manage-writing-style/SKILL.md` — explicit project-local style data operations.

Defaults are GENERATED from `.agent/agents-defaults.md` into the block below — do not edit inside it.
Keep both markers where the defaults should appear; remove them to opt out.

<!-- >>> AGENTKIT DEFAULTS >>> (generated — do not edit; run 'agentkit sync') -->
### Communication

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

### Delegation

- Keep delegation one level deep. Include "Do not spawn additional agents; return further delegation
  needs to the parent" in every worker assignment.
- Match the status-check interval to the assignment's expected duration. A fixed short tick on
  long-running delegated work is waste.

This is behavioural guidance, not an enforced limit. Nothing in the runtime prevents a subagent from
delegating, so the restriction has to travel in the assignment text the parent writes.
<!-- <<< AGENTKIT DEFAULTS <<< -->

## Workflows (slash commands)
<!-- >>> AGENTKIT WORKFLOWS >>> (generated — do not edit; run 'agentkit sync') -->
| Command | What it does |
| --- | --- |
| `/architect` | Create a technical architecture specification from an accepted problem and constraints. |
| `/async-maint` | Run requested or configured background diagnostics and return uniquely identified health reports. |
| `/audit` | Route scoped or full scan-only audits and report findings with explicit coverage. |
| `/backlog-status` | Derive an on-demand ticket view from canonical artifacts without maintaining a second backlog. |
| `/build` | Implement an accepted contract with risk-appropriate proof and truthful remaining acceptance. |
| `/close` | Prepare a task for archive while preserving pending work and session-owned resources. |
| `/debug` | Diagnose, reproduce or repair a bug using discriminating evidence and scoped authority. |
| `/explore` | Route open questions to concept, technical, visual or interaction exploration. |
| `/huh` | Repeat the latest explanation in one line of simple English. |
| `/land` | Land the scoped session on its authorized integration target with proof and safe cleanup. |
| `/onboard` | Load sufficient project context index-first and preserve current intent on resume. |
| `/plan` | Produce a right-sized implementation plan while preserving the accepted work contract. |
| `/prd` | Define product outcomes, states and acceptance when those decisions are still open. |
| `/quick-fix` | Apply a small, well-understood change with a risk-based scope guard. |
| `/refactor` | Restructure code while preserving the agreed observable behavior and compatibility. |
| `/remind` | Reorient the user to the session purpose, completed work, current state, and next action. |
| `/research` | Research open questions and map supported findings to the project without implying approval. |
| `/ship` | Deliver one ticket against its accepted contract and close out its actual state truthfully. |
| `/test` | Create meaningful unit, integration or reproduction tests within the requested test boundary. |
| `/tldr` | Give exactly three bullets summarizing the requested scope, each under ten words. |
| `/todo` | List every known completed and outstanding session step as Markdown checkboxes. |
| `/verify-pre-deploy` | Assess release readiness on the exact candidate with applicable proof and explicit pending gates. |
| `/walk` | Walk through the selected explanation one point per user-controlled turn. |
| `/wrap-up` | Close out scoped local work with reusable proof and honest remaining state. |
| `/writing-style` | Manage a project-local writing-style profile by initializing, adding samples, updating diagnostics, inspecting evidence, and approving or excluding sources. |
<!-- <<< AGENTKIT WORKFLOWS <<< -->
