---
status: accepted
applies-to:
  - ".agent/**"
  - "manifest.json"
  - "governance/**"
  - "reports/**"
  - "integrations/**"
last-verified: 2026-07-03
---

# DECISION-flat-over-nested

**Status:** Accepted (Round 2 decision 12 + the anti-bloat guardrails, Round 6)

## Context
The steer "more isn't always better" is easy to misread as "fewer skills." Fleet evidence says the
opposite: the failure mode is **indistinguishability** (two skills a router can't tell apart), not
quantity — the richest skill source (56 skills) is a gold standard, while needless folders, deep
nesting, and grab-bag directories are the actual rot. A capped skill count would delete genuinely
useful, well-scoped skills to solve a problem skills don't cause.

## Decision
"Simpler" means **fewer folders and nesting levels, NOT fewer skills.** The kit repo stays the flat
shape of a project's `.agent/` — no `core/` wrapper, no per-vendor adapter folders, no `reports/`
subfolders. Prefer flat files with clear prefixes (`foundation-`, `tech-`, `pattern-`, `SPEC-`,
`RUNBOOK-`…) over subdirectories. Tiering is **manifest metadata** (`tier: core | tech:<x>`), never
folder nesting; `skills/` stays a single flat directory. Skill count is **measured, not capped** —
the pilot records description-token cost and misroute rate to settle "how many is too many" with data.

## Consequences
- Every new folder or nesting level must justify why a flat prefixed file wouldn't do; each phase
  reports folder-count and max-nesting-depth before/after and an unjustified increase is rejected.
- Routing quality is guarded by the semantic orthogonality gate (compare triggers/outcomes/tools) and
  trigger-grammar normalization — not by deleting skills.
- KB nesting-by-topic is the one sanctioned exception (see `docs-standard.md` §c); a consuming
  project's nested KB can be documented as an outlier when the layout is justified.

## Revisit trigger
The pilot's misroute measurement comes back high enough that tier-gated context loading isn't enough —
then the fix is smarter routing/gating, still not a hard skill cap.
