---
status: accepted
applies-to:
  - ".agent/skills/**/SKILL.md"
  - "adapters.mjs"
last-verified: 2026-07-03
---

# DECISION-superset-authoring

**Status:** Accepted (Round 3, decision 17 — three-peer vendor-perspective consensus)

## Context
Vendors parse different frontmatter: Claude reads `allowed-tools`, `orchestration:`, subagent
`model:` hints that Gemini and Codex ignore or choke on. Two ways to handle divergence: author each
asset to the **lowest common denominator** every vendor can parse, or author the full superset and
have adapters remove what a given vendor can't use. Authoring to the LCD throws away native
affordances (Claude subagents, hooks) permanently.

## Decision
The canonical `.agent/` base holds the **frontmatter superset**; adapters **strip downward** per
vendor and layer native affordances on top. Never author to the lowest common denominator, and never
fork a neutral procedure into per-vendor copies. Tier-gating governs what is exposed to model
context, not just what ships to disk.

## Consequences
- One source of truth per asset; native capability is preserved, not sacrificed to portability.
- If a per-vendor override would rewrite >30% of the base, that is a signal to **split the asset, not
  fork it** — overrides are added only when a concrete case proves it necessary, as a single flat
  file, never a folder tree.
- `check`/`doctor` support `--json` so agents can query drift/routing status programmatically without
  parsing human output.

## Revisit trigger
Adapter override files start proliferating (many assets need per-vendor content overrides), which
would mean the superset abstraction is leaking and the asset boundaries need re-cutting.
