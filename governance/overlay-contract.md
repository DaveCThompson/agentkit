---
name: overlay-contract
description: What the kit owns vs what a project owns, and how a file moves between the two.
last-verified: 2026-07-03
---

# Overlay Contract

Three tiers (tier is **manifest metadata**, never folder nesting — `skills/` stays flat):

1. **CORE** — universal engineering workflow. Kit-owned. `sync` ships and may prune them; a local
   edit is drift that `check` surfaces (flow back, promote to overlay, or discard).
2. **TECH-DEPENDENT** (`tier: tech:<x>` frontmatter) — shipped only when the project's
   `.agentkit.json` `stack` declares that tech. Kit-owned while shipped.
3. **PROJECT / OVERLAY** — `domain-*`, `project-*`, and anything the project's `.agentkit.json`
   `overlay` globs claim. **The kit never touches these.** They still reach vendor surfaces:
   adapters transform the merged tree (core + overlay), and the lock marks the outputs
   `project-generated`.

## Ownership rules
- Convention does the heavy lifting: `domain-*`/`project-*` are overlay-by-default;
  `foundation-*`/`pattern-*` are core-by-default. `.agentkit.json` globs override convention.
- `.agentkit.json` `overlay` accepts the typed arrays `rules`/`skills`/`workflows`/`paths` — a
  currently-undocumented but supported catch-all for any overlay path/glob not covered by the typed
  arrays — **and** a flat `claims` array. `claims` is accepted alongside the typed arrays (all glob
  entries are pooled into one match set) and uses the exact same glob semantics as the rest of
  `overlay.*` (matches the full path, any path segment, or the extension-stripped stem). Prefer the
  typed arrays when the asset type is known; `claims` is for a flat list that doesn't need to
  distinguish rule/skill/workflow.
- **Generalizability gates core-ness.** A `foundation-`/`tech-`/`pattern-` rule that names concrete
  paths, env systems, or single-framework idioms is mis-tiered — parameterize it or make it overlay
  (`governance/best-practices.md`, Rules §). Convention picks the *default* tier; honest
  generalizability decides whether it may actually stay there.
- The lockfile is the ownership record. A `.agent` file with a core lock entry is kit-shipped even
  if it later falls out of the selection (it becomes ORPHAN → prune, never silently re-owned).
- **Routing names are globally unique** across core + overlay. Two assets routing as one name is an
  error `check` reports (decision 34).
- Overlay content lives in the project's git history — the kit repo never stores it.

## Moving a file between tiers
- **Core → overlay** (project wants its own fork): add a glob to `.agentkit.json` overlay, remove
  the file's lock entry (kit-contribute does this), rename to a `project-*`/`domain-*` name so the
  collision lint stays clean.
- **Overlay → core** (a project skill deserves the fleet): generalize it (strip project paths and
  domain nouns), then `agentkit adopt <file>` — provenance lands in the kit CHANGELOG.
- **Pins**: `.agentkit.json` `pins` freeze a core file at an older kit version. `doctor` lists every
  pin so they don't rot. A pin is an exception with a reason, not a parallel fork.

## Sync attribution
The lock's full-ISO `syncedAt` timestamps the last sync for churn attribution — run sync at session
boundaries.
