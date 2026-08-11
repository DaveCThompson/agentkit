# Governance — trigger index

The kit's specs, standards, and settled decisions. Read the one row that matches what you're about to
do — this table is the routing surface, not a table of contents.

**Specs & standards** tell you *how* to do something. **`DECISION-*` docs** tell you *why* a settled
question was answered the way it was, so you don't re-litigate it — each carries a revisit trigger for
the only conditions under which it reopens.

## Specs & standards

| Doc | Read it when… |
|---|---|
| `docs-standard.md` | before touching any project's `docs/`, `CHANGELOG.md`, or KB — the four-dir model, the one CHANGELOG dialect, harvest-then-roll, and the KB routing contract |
| `audit-rubric.md` | running a Phase-A project audit, or calibrating what a 1 vs a 3 means on any of the 10 dimensions |
| `best-practices.md` | authoring or reviewing a skill/rule/workflow before it enters the canonical kit |
| `canonical-manifest.md` | you need a specific `manifest.json` field's single source of truth (paired with `DECISION-compiled-manifest.md` for the why) |
| `mirror-contract.md` | changing how canonical `.agent/` sources map to generated vendor surfaces (the operational contract; `DECISION-vendor-generation.md` is the why) |
| `overlay-contract.md` | deciding whether a file is kit-owned (core/tech) or project-owned (overlay), or moving one between tiers |
| `migration-checklist.md` | running a per-project Phase-E migration — preconditions, steps, verification, rollback |
| `vendor-capability-matrix.md` | adding/adjusting a vendor adapter, or re-verifying a vendor's native surfaces against its live docs |

## Decisions (settled — don't re-litigate)

| Doc | Read it when… |
|---|---|
| `DECISION-vendor-generation.md` | before proposing any change to how vendor files are produced — junctions, symlinks, submodules, or "just edit the generated file" |
| `DECISION-superset-authoring.md` | before adding/removing frontmatter in a base SKILL.md, or wondering why the base carries fields some vendors ignore |
| `DECISION-flat-over-nested.md` | before adding a folder or nesting level, or proposing a skill-count cap — "fewer folders, not fewer skills" |
| `DECISION-flowback-loop.md` | before changing `adopt`, `kit-contribute`, or the wrap-up path — the project→kit contribution loop that keeps this from being attempt #4 |
| `DECISION-lockfile-state-model.md` | before touching `.agentkit.lock`, `check`'s verdicts, or any date/staleness/recency logic (mtime is banned here) |
| `DECISION-compiled-manifest.md` | before hand-editing `manifest.json` (don't) or changing how a manifest field is derived |
| `DECISION-settings-key-merge-scope.md` | before making `sync` write anything to a vendor settings file beyond hook + MCP keys + the `permissions.allow` baseline (it must not touch `defaultMode` / `deny` / `trustedDirectories` / memory) |
| `DECISION-always-latest-upgrades.md` | before adding version-pinning behavior or a deliberate-upgrade flow — sync always converges on HEAD; pins are the exception |
| `DECISION-cloud-sync-stay-mitigated.md` | before proposing to move the fleet off cloud-synced, or when a cloud-synced residual (conflict copies, hydration) bites |
| `DECISION-canonical-agent-dir.md` | when the `.agent/` vs `.agents/` (Codex) distinction confuses you, or before renaming the canonical source dir |
