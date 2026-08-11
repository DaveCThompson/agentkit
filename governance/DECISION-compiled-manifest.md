---
status: accepted
applies-to:
  - "manifest.json"
  - "agentkit.mjs"
last-verified: 2026-07-03
---

# DECISION-compiled-manifest

**Status:** Accepted (Round 5, decision 28)

## Context
`manifest.json` carries routing metadata (`triggers`, `appliesTo`, `requiredTools`, `conflictsWith`,
`generatedTargets`, hashes) — but those same facts also live in SKILL.md frontmatter and adapter
output. Two hand-maintained declarations of one fact are guaranteed to diverge: that is the exact
drift disease this tool exists to cure, reappearing **inside** the anti-drift tool.

## Decision
The manifest is **compiled, never authored.** `sync`/`inventory` derive every field from a single
source: triggers/appliesTo/requiredTools from frontmatter, hashes + generatedTargets computed,
`conflictsWith` from the B1 routing table. A hand edit to `manifest.json` is itself drift and `check`
says so. Field-by-field sources are specified in `canonical-manifest.md`.

## Consequences
- One source per field; the manifest can be regenerated from scratch and must reproduce byte-for-byte.
- The orthogonality gate becomes **semantic** (compare triggers/outcomes/tools from the compiled
  metadata) rather than a description grep.
- Contributors edit frontmatter and the routing table, never the manifest — a workflow the generated
  header and `check` both enforce.

## Revisit trigger
A routing fact emerges that has no natural home in frontmatter or the routing table and genuinely
needs to be authored directly — then it needs its own declared single source, not a manifest hand-edit.
