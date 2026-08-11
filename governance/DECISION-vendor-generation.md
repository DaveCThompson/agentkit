---
status: accepted
applies-to:
  - "adapters.mjs"
  - "agentkit.mjs"
  - ".claude/**"
  - ".codex/**"
  - ".gemini/**"
  - ".opencode/**"
last-verified: 2026-07-03
---

# DECISION-vendor-generation

**Status:** Accepted (Round 1, decision 1 — extended Round 3 §16, Round 5 §29, Round 6 §34)

## Context
Every AI tool needs its skills/rules/workflows in its own native directory. The original design
junction-linked one source tree into each vendor dir, but cloud-synced flattens Windows junctions into
real duplicate trees that then diverge silently — the single root cause of the fleet's drift. The
alternatives (symlinks, git submodules/subtrees) share the same hidden-machinery failure class on
this cloud-synced setup.

## Decision
Author each asset **once** in canonical `.agent/`; a code transform (`adapters.mjs`) generates
**real, plain-copied vendor files** — no junctions, no symlinks, no submodules. Generation runs over
the **merged** project tree (core + overlay) so overlay skills also reach vendor surfaces. Vendor
differences live in code, never in mirrored per-vendor folders. Every generated text file carries the
header `# GENERATED FROM agentkit .agent/… — edit the source, run 'agentkit sync'`. See
`mirror-contract.md` for the operational contract.

## Consequences
- `check` hashes **both layers** — the `.agent/` source AND the generated vendor file — so a hand-edit
  to either is drift (the content-integrity guard). A hand-edited vendor file is never a feature.
- `sync` prunes generated files **it previously wrote and only those** (lockfile-verified) when a skill
  leaves the selection, so no orphaned files keep routing agents to dead procedures.
- Vendors sit on a generation spectrum: Claude needs the **most** (no native `.agent/` path — its
  `.claude/` is load-bearing), Antigravity needs **none** (reads `.agent/` natively). A new vendor is
  one more transform function, never a redesign.
- Inspectable, boring, greppable — the opposite of the junction machinery it replaces.

## Revisit trigger
A vendor gains a robust native reader for `.agent/` (like Antigravity), collapsing its adapter to
validation-only; or the fleet leaves cloud-synced (see `DECISION-cloud-sync-stay-mitigated.md`), which would
reopen whether symlinks are safe again.
