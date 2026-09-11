---
status: accepted
applies-to:
  - ".agent/output-styles/**"
  - ".claude/output-styles/**"
  - "adapters.mjs"
  - "agentkit.mjs"
last-verified: 2026-09-10
---

# DECISION-output-style-surface

**Status:** Accepted (2026-09-10, PLAN-vendor-policy-surface, four review rounds)

## Context

Claude's default prose is verbose in a way the other vendors in this fleet are not. The fix belongs
on a Claude surface, not in the vendor-neutral rules, and Claude Code has a feature built for exactly
this: an output style changes how Claude responds without changing what it knows, and applies to
every response (`code.claude.com/docs/en/output-styles`, verified 2026-09-10).

Nothing in the kit could ship one. The two existing tiers of vendor customization both start from a
neutral asset — tier 1 transforms one canonical asset per vendor, tier 2 filters a neutral asset by a
`vendors` field. An output style has no Codex, Gemini or OpenCode equivalent to abstract over. It is
vendor-shaped by nature. That is the tier-3 case, and it had no home.

## Decision

`.agent/output-styles/*.md` is a canonical asset type. The Claude adapter emits
`.claude/output-styles/<name>.md`; every other adapter emits nothing for the type.

**Why a new canonical directory, against invariant 4** (`AGENTS.md`: no new folder without proving a
prefixed flat file cannot do the job). A flat `.agent/output-style-<name>.md` would work mechanically.
It was rejected because the asset needs a *type*, not a *name prefix*: `classifyAgentFile` derives the
entry type from the first path segment, adapters dispatch on that type, and routing-name uniqueness is
already type-scoped. A prefix convention would put type information in a filename that the loader
would then have to re-parse, which is the pattern the directory map exists to avoid. The directory is
flat and holds one file kind, so it adds a type, not a nesting level.

**Why not a per-vendor tree**, meaning a canonical directory named for the vendor with the asset
nested beneath it. `DECISION-vendor-generation` forbids mirrored per-vendor folders; that shape is the
drift class the kit was built to remove. A type-named directory whose adapter happens to be
single-vendor is not the same thing.

Two validations are enforced at plan time because both failures are invisible at authoring time:

- **Name/filename agreement.** Claude resolves a style's identity from frontmatter `name` when
  present, otherwise the filename. The `outputStyle` setting names one of them. Requiring agreement
  gives a referential check one answer.
- **Explicit `keep-coding-instructions`.** The native default is `false`, and a custom style without
  it silently drops Claude Code's built-in software-engineering instructions. Omission is an error,
  never an implicit `false`.

`force-for-plugin` is never generated. It activates a style without the user choosing.

## Consequences

- `agentkit check` hashes both layers, so a hand-edit to source or generated file is drift, exactly
  as for every other asset.
- Consumer projects commit their generated surfaces, so a style travels with a clone.
- The style file is inert until a project selects it through `vendorDefaults`. Shipping the asset is
  not activation.
- Adding a sixth entry type cost one line in `TYPE_BY_DIR` plus one adapter branch. A seventh
  vendor-only type would cost the same.

## Revisit trigger

Another vendor gains an output-style-equivalent surface, which would make the asset neutral and move
it to tier 1 or 2. Or Claude Code changes the file location or frontmatter contract.
