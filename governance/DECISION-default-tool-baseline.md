---
status: accepted
applies-to:
  - "agentkit.mjs"
  - "governance/migration-checklist.md"
  - "integrations/codebase-mcp.md"
  - "integrations/fallow.md"
last-verified: 2026-07-05
---

# DECISION-default-tool-baseline

**Status:** Accepted (2026-07-05)

## Context
`codebase-mcp` (knowledge-graph comprehension) and `fallow` (dead-code/dupe/complexity scanner)
were opt-in per project — a project only got them if someone remembered to list them in
`.agentkit.json`'s `tools` array. In practice every fleet member that reached for either tool
ended up wanting both: comprehension before changing code, and a reuse/dead-code gate before
adding or deleting it. Leaving them opt-in meant new projects silently missed the fleet's actual
working baseline, and `agentkit doctor`/skill `required-tools:` gates had nothing to check by
default.

## Decision
`agentkit init` now defaults `tools` to `["codebase-mcp", "fallow"]` for every greenfield
project (`agentkit.mjs` `initProject`) as a **starting recommendation, not an unconditional
mandate**. It's the right starting point because it matches what every fleet member that reached
for either tool ended up wanting — but it's still a default to evaluate, not a rule to enforce.
Drop `fallow` when the project has no real JS/TS surface to analyze (a docs-only or config-only
repo); drop `codebase-mcp` when the codebase is small enough that Grep/Read already comprehend it
in one pass and a graph adds indexing overhead without earning it back. The migration checklist
states the same default-and-evaluate framing for projects onboarded manually.

## Consequences
- New projects start with both declared; whoever runs `agentkit init` (or the migration checklist)
  is expected to look at the actual project — size, stack, real need — and drop what doesn't fit,
  not treat the default as fixed.
- `agentkit doctor` should be run early on any project that keeps the default, to confirm
  callability rather than assuming the declaration alone means either tool works.
- Existing migrated projects are unaffected until they reconcile — `tools` is read from each
  project's own `.agentkit.json`; this only changes what a **new** `init` writes. A reconcile
  brief may prompt an existing project to reconsider its `tools` list, but sync does not silently
  inject anything.
- Skills that declare `required-tools: [fallow]` / `required-tools: [codebase-mcp]` can assume
  those tools are common, not universal, when reasoning about a project's likely setup — the
  fallback-when-unreachable path in each integration doc is the normal case for a project that
  opted out, not just a degraded edge case.

## Revisit trigger
If most new projects end up dropping one of the two, the default itself is wrong, not just the
per-project judgment call — reopen and narrow the default rather than keep recommending something
most projects decline.
