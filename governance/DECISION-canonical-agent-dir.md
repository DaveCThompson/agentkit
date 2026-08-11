---
status: accepted
applies-to:
  - ".agent/**"
  - "AGENTS.md"
  - "adapters.mjs"
last-verified: 2026-07-03
---

# DECISION-canonical-agent-dir

**Status:** Accepted (Round 1 decision 5 + Round 6 decision 41)

## Context
Two nearly identical directory names are in play: `.agent/` (singular) and `.agents/` (plural). All 7
projects, the starter-kit, and the golden template already use `.agent/` singular — only the old
`a predecessor kit` governance docs used `.agents/`. Making it worse, **Codex's own native skill surface is
`.agents/skills` (plural)** per its docs, so the plural dir legitimately appears *beside* the canonical
singular one in a synced project — a documented human footgun.

## Decision
The canonical source of truth is **`.agent/` (singular)**, everywhere. The `a predecessor kit` docs that used
`.agents/` are rewritten. Codex's generated skill subset still goes to its native **`.agents/skills`**
(plural) — that is a generated vendor surface, not the source — and `.codex/config.toml` is Codex's
config surface for the hook/MCP key-merge (no generated `.codex/skills`; that surface doesn't exist).

## Consequences
- The `.agents/`-beside-`.agent/` footgun is handled in text: the generated-file header plus one line
  in the AGENTS.md template state which directory is the source.
- Renaming the canonical dir later would touch every project, adapter, and doc — this is settled to
  stop the singular/plural question from recurring.
- Vendor-surface facts (Codex `.agents/skills`, Antigravity's native `.agent/` reading) are recorded in
  `vendor-capability-matrix.md` and re-verified against live docs.

## Revisit trigger
The emerging SKILL.md / AGENTS.md open convention standardizes on a different canonical directory name
that the ecosystem adopts broadly.
