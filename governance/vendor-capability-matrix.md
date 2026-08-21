---
name: vendor-capability-matrix
description: Per-vendor native surfaces, what the adapter generates, degradation strategy, and canonical doc URLs for re-verification.
last-verified: 2026-08-20
doc-urls: https://code.claude.com/docs/llms.txt, https://learn.chatgpt.com/docs/agent-configuration/subagents, https://learn.chatgpt.com/docs/agent-configuration/agents-md, https://learn.chatgpt.com/docs/extend/mcp, https://developers.openai.com/codex, https://antigravity.google/docs, https://geminicli.com/docs/, https://opencode.ai/docs/
---

# Vendor Capability Matrix

Every row carries **canonical doc URLs** (pages that stay current) so format assumptions are
re-verified against live docs, never stale model memory (decision 11). `doctor` reports this file
stale when `last-verified` exceeds threshold — that is the trigger to re-read the URLs and diff.

| Capability | Claude Code | Codex | Antigravity | Gemini CLI | OpenCode |
|---|---|---|---|---|---|
| Reads `.agent/` natively | ❌ | ❌ | ✅ (rules, skills, workflows) | ❌ | ❌ |
| Reads root `AGENTS.md` natively | ❌ (CLAUDE.md only — **verified live 2026-07-03**) | ✅ (durable entry point) | ✅ | ✅ (GEMINI.md primary; AGENTS.md via config) | ✅ |
| Skills surface | `.claude/skills/<name>/SKILL.md` | `.agents/skills/` (plural — per official docs; parent-dir discovery to repo root) | `.agent/skills/` (native; name==folder, flat) | ❌ (no skill primitive; commands only) | `.opencode/skills/` |
| Commands from workflows | `.claude/commands/*.md` | no native command surface → workflows ride in as `wf-`prefixed skills at `.agents/skills/wf-<name>/` | `.agent/workflows/` as slash commands (native) | `.gemini/commands/*.toml` (`description=`, `prompt=`) | `.opencode/commands/*.md` (native; filename→`/<name>`, `description` fm, body=template — **verified live 2026-07-08**) |
| Rules | three-way by `trigger:` — `always` → `.claude/rules/*.md`; `glob` → path-scoped via `paths:` frontmatter (**verified live 2026-07-03**); `model-decision` → menu-hidden `rule-` skill at `.claude/skills/rule-<name>/` (description-gated, `user-invocable: false` — **verified 2026-07-09**) | `always`/`glob` via AGENTS.md text; `model-decision` → `rule-`prefixed skill at `.agents/skills/rule-<name>/` (**2026-08-20**) | `.agent/rules/` native (activation frontmatter) | via GEMINI.md text | via AGENTS.md text |
| Subagent defs | `.claude/agents/*.md` (with `model:` hints) | `.codex/agents/*.toml` — required `name`, `description`, `developer_instructions`; optional `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, `skills.config` (**verified 2026-07-26**) | ❌ | ❌ | ❌ |
| Hooks | `.claude/settings.json` `hooks` (key-merged) | `.codex/config.toml` (repo config surface) | ❌ | ❌ | ❌ |
| MCP config | `.mcp.json` `mcpServers` (key-merged) | `.codex/config.toml` `[mcp_servers.*]` (managed block) | ❌ (n/a v1) | `.gemini/settings.json` (deferred v1) | `opencode.json` `mcp` (key-merged) |
| Entry-point stub | `CLAUDE.md` = `@AGENTS.md` import + Claude-only lines (**required** — verified live; Windows symlink needs admin, so @-import) | none needed (AGENTS.md native) | none needed | `GEMINI.md` thin redirect | none needed |

## Adapter posture per vendor
- **Claude — needs the MOST generation.** No native path to `.agent/`; its generated `.claude/` is
  load-bearing. Emits: skills, commands (1:1 from workflows — never also a passthrough skill),
  three-way rules (see matrix row), subagent defs, hooks + MCP key-merge, and a `permissions.allow`
  union baseline (decision 16 revised 2026-07-10). **Never touches Claude memory
  (`~/.claude/projects/**`, auto memory) or `defaultMode` / `permissions.deny` /
  `trustedDirectories` — those stay project-owned; only `permissions.allow` is kit-managed.** Two Claude-only frontmatter injections, both scoped to the `claude()` adapter:
  a workflow's `skill:` pairing hides the paired skill from the `/` menu, and `model-decision`
  rules become `rule-` skills — each via `user-invocable: false` (`CLAUDE_HIDE_FROM_MENU`), which
  keeps the asset model-invocable. `disable-model-invocation:` is the inverse (user-only) and is
  never emitted.
- **Codex** — skills subset → `.agents/skills`; optional `agents/openai.yaml` passthrough when a
  skill folder carries one; config key-merge → `.codex/config.toml` managed block. No generated
  `.codex/skills` (not a documented surface). Codex has **no** commands-from-workflows surface, so
  workflows are emitted as `wf-`prefixed skills at `.agents/skills/wf-<name>/` (the `wf-` prefix
  avoids colliding with a real skill of the same name, e.g. `vet-hard`). The `.agents/`-beside-`.agent/`
  footgun is handled in text: generated-file headers + one line in the AGENTS.md template name the source.
  **Custom agents** → `.codex/agents/<name>.toml`; every emitted agent's `developer_instructions`
  carries the `CODEX_DELEGATION_CONTAINMENT` preamble (`pattern-agent-orchestration.md` §14A) ahead of
  the agent's own body — a Codex custom agent IS a delegated worker, and skill discovery inside a
  spawned thread is model-discretionary, so the depth-0 clause cannot rely on the `rule-` skill being
  loaded. Canonical `model:`/`tools:` have no faithful Codex mapping and are dropped with a recorded
  warn (decision 4) rather than silently stripped. **`model-decision` rules** → `rule-`prefixed
  skills, mirroring Claude; `always`/`glob` rules deliberately stay on the AGENTS.md prose path,
  because emitting a mandatory rule as a discretionary skill is a downgrade, not a port.
- **Antigravity — zero generation.** Consumes `.agent/` directly; sync only validates (SKILL.md
  `name`==folder, flat layout, workflows shaped as low-logic routers). Local doc snapshots:
  `help-docs/antigravity_docs_*.md`.
- **Gemini CLI** — curated workflow subset → `.gemini/commands/*.toml` (opt out with `gemini: false`
  frontmatter). Not a bulk mirror.
- **OpenCode** — skills copy + workflows → native `.opencode/commands/*.md` (user-invoked slash
  commands, like Claude — not skills) + `package.json` created-if-absent; MCP servers → root
  `opencode.json` `mcp` key-merge using OpenCode's native local-server command-array shape.

## Rules of the game
- The canonical asset holds the **frontmatter superset**; adapters STRIP downward — never author to
  the lowest common denominator (decision 17).
- A new vendor = one transform function in `adapters.mjs` + one row here — never a redesign.
  (OpenRouter is model-routing, not a config surface: inherits whatever vendor CLI wraps it.)
- Any hand-edit to a generated vendor file is drift; `check` catches it on both layers.

## Verification log
- 2026-08-20 — Codex custom agents and the Codex rules row corrected. The prior matrix recorded
  `Subagent defs | Codex | ❌`, which was **false**: project custom agents are a documented surface at
  `.codex/agents/*.toml`. Evidence: the three `learn.chatgpt.com` URLs now in `doc-urls`, fetched live
  2026-07-26 (locally captured at `docs/raw-research/official-codex-docs/SOURCE-2026-07-26-codex-custom-agents.md`
  — note `docs/raw-research/**` is git-ignored, so the URLs, not that path, are the reproducible
  evidence for a fresh clone). **Domain
  reconciliation:** these pages live on `learn.chatgpt.com`; the older `developers.openai.com/codex`
  URL is retained in `doc-urls` because the 2026-07-03 corpus was fetched from it. Treat
  `learn.chatgpt.com` as canonical for agent-configuration pages as of this date.
  The false ❌ had a real cost: because no Codex agent or rule surface was generated, the delegation
  contract in `pattern-agent-orchestration.md` reached Claude (as a `rule-` skill) and reached Codex
  **not at all** — a live Codex subagent then fanned out an unrequested duplicate task through
  `codex_app.create_thread`. See `docs/working/TICKET-codex-delegation-containment-staff.md`.
  Re-verify by re-reading the three `learn.chatgpt.com` URLs and diffing the two rows above.
- 2026-07-09 — Claude skill-invocation controls verified against
  `code.claude.com/docs/en/skills.md#control-who-invokes-a-skill`: `user-invocable: false` hides a
  skill from the `/` menu while Claude can still auto-invoke it (its description stays in context);
  `disable-model-invocation: true` is the inverse (user-only, description NOT loaded). Basis for
  the workflow `skill:` pairing and the `model-decision → rule-` skill mapping. Commands and skills
  share one frontmatter schema (commands merged into skills per the same page). Pending one manual
  smoke check in a live session (`/wrap` menu + `/context` footprint) — record result here.
- 2026-07-08 — OpenCode commands surface verified live against `opencode.ai/docs/commands`:
  project-level `.opencode/commands/<name>.md` (plural dir), filename → `/<name>`, `description`
  frontmatter, markdown body is the prompt template (supports `$ARGUMENTS`/`@file`/`!shell`). This
  corrected the prior ❌ in the "Commands from workflows" row. Codex re-confirmed as having no
  project command surface (existing `official-codex-docs` research: skills + AGENTS.md only) — hence
  workflows-as-`wf-`skills there.
- 2026-08-10 — OpenCode MCP project config verified live against `opencode.ai/docs/mcp-servers`:
  local servers live under `opencode.json` `mcp.<name>` with `type: "local"`, an argv `command`
  array, and `enabled`; `.mcp.json` is not an OpenCode project config surface.
- 2026-07-03 — Claude memory/AGENTS.md/rules surfaces verified against live
  `code.claude.com/docs/en/memory` (this session). Codex `.agents/skills` + `.codex/config.toml`
  verified against `official-codex-docs/CODEX-OFFICIAL-DOCS-RESEARCH.md` (researched from live docs
  2026-07). Antigravity `.agent/` nativeness verified against `help-docs/antigravity_docs_skills.md`
  + `antigravity_docs_rules+workflows.md`. Gemini command TOML shape verified against the working
  generated commands in a representative consumer project's `.gemini/commands/` + geminicli.com docs.
