# Changelog

## Unreleased

### Changed
- Generalized public documentation, governance examples, templates, and agent-infrastructure
  guidance so the kit no longer publishes consuming-project names, private audit artifacts, or
  internal ticket identifiers.
- Clarified the distribution-repository exception: this kit keeps generated vendor mirrors and
  its lockfile local, while consuming projects commit their generated surfaces.
- Added a public contribution guide, pull-request checklist, and CI content-integrity check.
- Sharpened the Supabase RLS verification skill's routing description and portable search fallback.

### Evidence and provenance
- Need: publish a reusable kit without leaking consuming-project details.
- Provenance: repository review and clean public-surface verification.

### Verification
- `node agentkit.mjs sync .` — 0 writes, 0 prunes.
- `node agentkit.mjs check . --quick` — passed.
- `node agentkit.mjs check . --content` — passed on the clean tracked public surface.
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
