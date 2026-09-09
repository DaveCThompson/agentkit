# Changelog

## Unreleased

No unreleased changes.

## [2026-08-30] — v0.3.0 — writing-style system

### Changed
- Added a core writing-quality rule and `write-content` skill for reader-centered, format-aware prose,
  with anti-homogenization checks that preserve meaning and avoid universal style bans.
- Added a research ticket to validate the attached guide's claims before adopting decoding, retrieval,
  evaluation, or fine-tuning techniques as standards.
- Promoted verified research and a revised architecture plan for portable writing-style management,
  explicit local storage, provenance, deterministic builds, and cross-vendor routing evaluation.
- Added a dated research follow-up that narrows stylometric claims, adds stability evidence metadata,
  and keeps profile/exemplar and originality thresholds as locally testable policies.
- Settled project-local-only writing-style storage; cross-project roots and shared-profile overrides are
  out of scope for version one.
- Settled the writing skill names: `write-content` for sustained prose and `write-ui-copy` for short
  interface text.
- Renamed the direct agent-to-user communication skill from `write-clear` to `respond-clearly` and
  narrowed its ownership to answers, status, decisions, blockers, and next steps.
- Added a 40-case final-name routing fixture with deterministic hard-negative mutation checks and a
  separate boundary for host-specific model-routing observations.
- Fixed generated executable-script headers so adopted Node-based skills preserve their shebang and
  remain directly runnable from every supported vendor copy.
- Removed the separate `write-in-style` skill and workflow; named styles are optional context for the
  appropriate writing skill.
- Vetted and adopted scoped artifact authority: `style.md` governs qualitative voice only, generated
  diagnostics remain advisory, invalid contracts fail closed, and stale diagnostics are labeled.
- Routed sustained content work from `write-clear` to the new writing-quality guidance.
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
- `node agentkit.mjs sync .` — passed; generated surfaces synchronized.
- `node agentkit.mjs check . --quick` — passed.
- `npm test` — 179/179 passed.
- `git diff --check` — passed.
- `node agentkit.mjs check . --content` — exited 0 with existing warning-level references in
  knowledge-base documentation.
- `node agentkit.mjs check . --taxonomy` — known baseline findings in existing documentation; no
  new taxonomy repair was included in this release update.

KB consulted: `governance/docs-standard.md`, `governance/canonical-manifest.md`,
`governance/vendor-capability-matrix.md`, `governance/RESEARCH-2026-08-30-writing-style-system.md`,
`governance/RESEARCH-2026-08-30-writing-style-system-followup.md`.

What we deliberately did NOT do: delete ignored local knowledge-base or research files. They remain
local by design and are not part of the public distribution.

## [2026-08-21] — v0.2.6 adopt: .agent/rules/pattern-docs-artifacts.md
- Content fix adopted from `resumint` (.agent/rules/pattern-docs-artifacts.md)


## [2026-08-21] — v0.2.5 adopt: .agent/skills/audit-docs/SKILL.md
- Content fix adopted from `resumint` (.agent/skills/audit-docs/SKILL.md)


## [2026-08-21] — v0.2.4 adopt: .agent/skills/maintain-docs/SKILL.md
- Content fix adopted from `resumint` (.agent/skills/maintain-docs/SKILL.md)


## [2026-08-21] — v0.2.3 adopt: .agent/skills/implement-session-land/SKILL.md
- Content fix adopted from `resumint` (.agent/skills/implement-session-land/SKILL.md)


## [2026-08-21] — v0.2.2 adopt: .agent/skills/plan-prd/SKILL.md
- Content fix adopted from `resumint` (.agent/skills/plan-prd/SKILL.md)


## [2026-08-21] — v0.2.1 adopt: .agent/workflows/prd.md
- Content fix adopted from `resumint` (.agent/workflows/prd.md)


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
