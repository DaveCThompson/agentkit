---
name: vendor-capability-matrix
description: Per-vendor native surfaces, what the adapter generates, degradation strategy, and canonical doc URLs for re-verification.
last-verified: 2026-07-03
doc-urls: https://code.claude.com/docs/llms.txt, https://developers.openai.com/codex, https://antigravity.google/docs, https://geminicli.com/docs/, https://opencode.ai/docs/
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
| Rules | three-way by `trigger:` — `always` → `.claude/rules/*.md`; `glob` → path-scoped via `paths:` frontmatter (**verified live 2026-07-03**); `model-decision` → menu-hidden `rule-` skill at `.claude/skills/rule-<name>/` (description-gated, `user-invocable: false` — **verified 2026-07-09**) | via AGENTS.md text | `.agent/rules/` native (activation frontmatter) | via GEMINI.md text | via AGENTS.md text |
| Subagent defs | `.claude/agents/*.md` (with `model:` hints) | ❌ | ❌ | ❌ | ❌ |
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
  generated commands in `proj-portfolio/.gemini/commands/` + geminicli.com docs.
