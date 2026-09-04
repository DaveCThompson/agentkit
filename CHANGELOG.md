# Changelog

## [0.3.1] — 2026-09-04 — CI runtime maintenance

### Changed
- Upgraded `actions/checkout` and `actions/setup-node` from v4 to v7. Both actions now use the
  Node.js 24 runtime instead of the deprecated Node.js 20 runtime.

### Evidence and provenance
- Need: keep the public CI workflow on supported action runtimes without changing its Node.js 22
  test matrix.
- Evidence: official action releases identify v7 as the current major; the GitHub-hosted runner is
  v2.337.0, above v7's minimum runner requirement of v2.327.1.

### Verification
- `node agentkit.mjs sync .` twice — both runs wrote 0 and pruned 0.
- `node agentkit.mjs check . --quick` — passed at kit/lock v0.3.1.
- `node agentkit.mjs check . --content` — all citations resolved.
- `node agentkit.mjs check . --taxonomy` — exit 0 at the existing baseline of 3.
- `npm test` — 150/150 passed.
- `git diff --check` — passed.

## [0.3.0] — 2026-09-04 — session control commands

### Added
- Added `/tldr`, `/huh`, `/walk`, `/remind`, `/close`, and `/todo` as canonical skills with paired
  workflows. Command-capable vendors expose the slash commands; Codex receives the source skills
  plus its `wf-` workflow views.
- Added guarded session-resource cleanup to `/close`: it checks unresolved user decisions,
  session-owned servers, transient memory, worktrees, browser sessions, durable documentation,
  and chat archive readiness without deleting ambiguous or shared state.
- Enabled the Codex vendor for this repository's local self-sync. Generated `.agents/` output
  remains ignored in the public distribution.

### Changed
- Generalized public documentation, governance examples, templates, and agent-infrastructure
  guidance so the kit no longer publishes consuming-project names, private audit artifacts, or
  internal ticket identifiers.
- Clarified the distribution-repository exception: this kit keeps generated vendor mirrors and
  its lockfile local, while consuming projects commit their generated surfaces.
- Added a public contribution guide, pull-request checklist, and CI content-integrity check.
- Sharpened the Supabase RLS verification skill's routing description and portable search fallback.
- Ratcheted the taxonomy baseline from 12 to 3 after the public extraction. The remaining notices
  are dormant waivers for optional, gitignored local knowledge stores.

### Evidence and provenance
- Need: publish a reusable kit without leaking consuming-project details.
- Provenance: repository review and clean public-surface verification.
- Need: direct kit-owner request for compact recap, plain-language repetition, paced explanation,
  session orientation, closeout, and complete progress-list controls.
- Evidence: T3 direct request. Provenance: staff · GPT-5.

### Verification
- `node agentkit.mjs sync .` twice — second run wrote 0 and pruned 0.
- `node agentkit.mjs check . --quick` — passed at kit/lock v0.3.0.
- `node agentkit.mjs check . --content` — all citations resolved.
- `node agentkit.mjs check . --taxonomy` — exit 0; 3 dormant local-store waiver notices,
  baseline 3 with no regression.
- `node --test --test-name-pattern "D2 snapshot" agentkit.test.mjs` — 1/1 passed.
- `npm test` — 150/150 passed.
- `git diff --check` — passed.

What we deliberately did NOT do: delete ignored local knowledge-base or research files. They remain
local by design and are not part of the public distribution.

## [0.2.0] — 2026-08-10 — public extraction

### Added
- Public standalone release of `agentkit` as a vendor-agnostic agent kit under the MIT license.
- Canonical `.agent/` authoring surface with vendor-specific generation and lockfile drift checks.
- Ship-safe templates for local fleet configuration and MCP configuration.
- Test coverage for selection, generation, synchronization, drift detection, adoption, and content
  integrity.

### Changed
- Reorganized the repository as a public distribution kit. Private fleet rosters, local reports,
  working state, generated mirrors, and external source material remain ignored.
- Preserved vendor differences in adapter code instead of mirrored authoring trees.

### Verification
- `npm test` — 150/150 passed.
- `node agentkit.mjs check . --quick` — passed.

Earlier internal development history is intentionally omitted from this public changelog.
