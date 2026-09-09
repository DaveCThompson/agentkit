# Changelog

## [1.1.1] — 2026-09-09 — Let existing consumers take a release

### Fixed
- Refresh a `borrowed` managed block when the on-disk bytes still match the lock record. Previously
  only `introduced` blocks were compared against the recorded value; a `borrowed` block was compared
  against the new desired content, so every release refused and the block was permanently wedged. An
  edited block still refuses, and a legacy `unresolved` block still refuses by design: that record
  proves membership only, so the kit must not overwrite content it cannot show it wrote. The operator
  removes that one contribution to re-establish introduction, which the message and the migration
  checklist now state plainly.
- Compare object settings contributions by value rather than by serialization. Key order alone no
  longer conflicts, so a project whose `opencode.json` already declares the same MCP server with
  reordered keys is no longer refused, and reordering an adapter's object literal is not a breaking
  change for consumers.
- Report the value the kit wanted alongside the current value in a settings conflict, and describe
  the disposition that matches the actual ownership. The message previously printed two identical
  hashes and told the operator to restore an edited introduced value that did not exist.
- Add `.writing/` to the ignore lines sync maintains in a consumer. The writing store's own ignore
  file lives inside the ignored directory and is therefore never committed.
- Report one `OWNERSHIP-UNRESOLVED` verdict per native file instead of one per record.

### Changed
- State once, in an always-loaded rule, that `governance/`, `integrations/`, `templates/` and
  `reports/` citations resolve against the selected kit checkout rather than the consumer project,
  with an explicit fallback when that checkout is unavailable. 24 of 25 shipped citations previously
  gave a consumer's agent no way to resolve them, and `check --content` cannot detect this because it
  resolves those roots against `kitRoot`.
- Correct the `.ignore` header: sync does not install it.

### Evidence and provenance
- Need: an independent downstream-readiness review judged 1.1.0 not consumable by a 0.3.x project.
  Reproduced on synthetic consumers built from the kit's own historical shapes, not on either real
  project.
- New suite `agentkit.downstream.test.mjs`: six tests, all failing before these repairs except the
  preservation control. The control was additionally verified to fail against a deliberately weakened
  guard, so it detects a regression rather than passing vacuously.
- Not covered: no native client was launched, and neither real consumer has been migrated. Vendor
  surface claims remain file-shape evidence.

## [1.1.0] — 2026-09-09 — Reconcile project upgrades and writing styles

### Added
- Add a project migration kickoff covering preservation, selected kit identity, launcher readiness,
  exact legacy hook retirement, canonical reference resolution and scoped verification.
- Add content, interface-copy and direct-response skills, a writing-quality rule, and project-local
  style management. Retain the public `write-clear` entry point and its ticket/handoff method.
- Add explicit style status, reviewed-context resolution and rollback recovery. New profiles start
  as drafts. Project and style locks cover mutations; private preimages preserve recovery after
  interruption, and intervening edits refuse automatic restoration.

### Fixed
- Show unresolved settings ownership in human sync and dry-run output without exposing settings values.
  Successful file application does not imply completed ownership reconciliation.
- Preserve script shebangs during generation and strip only the generated header during adoption.
- Resolve documentation governance from the selected kit when consumer projects lack that directory.
- Repair writing initialization, rollback, excluded/purged exemplars, alias collisions, CLI sample
  fidelity and false review status. Keep private writing data separate from shipped guidance.
- Retain approved exemplars against every eligible chunk instead of the capped candidate view, so a
  large corpus no longer deletes approvals from still-included sources. The 50-row cap still bounds
  the presented `exemplar-candidates.jsonl`, and approval selects from that presented list. Refuse
  recovery when style-lock ownership changed, before restoring any data, and journal a style lock only
  after acquiring it. Select the journal and lock identity inside the recovery guard so a stale
  operation cannot reverse a later committed mutation. Report operation identity, pending lock cleanup
  and committed-versus-restored disposition when project-lock release fails.
- Clarify nested delegation authority, uncertain wait results and inherited PRD reconciliation.

### Evidence and provenance
- Need: reported project upgrades left duplicate/unavailable hooks, mismatched local source versions
  and dead governance references. A synthetic legacy-hook migration reproduces preservation and exact
  retirement without changing unrelated policy; this is not a real-project migration result.
- Provenance: home-branch writing work, reviewed and adapted on 1.0.1 by the coordinator with independent
  staff Astra/high review. Seven collected writing regression assertions fail on the incoming code;
  repaired-code checks cover those boundaries plus interruption, concurrency and filesystem links.
- Preserve the existing Windows/Linux Node 20/22/24 CI matrix and all four prior suites. New fixture
  routing labels are evaluation inputs, not measured model-routing behavior. Native-client and real
  project rollout results remain separately owned; no fleet migration is claimed by this release note.

What we deliberately did NOT do: replace main with the older branch, change the portable-hook policy,
copy private project settings, remove legacy public skills, or claim external backups are securely erased.

## [1.0.1] — 2026-09-09 — Preserve legacy rule trigger compatibility

### Fixed
- Accept the legacy `trigger: model_decision` spelling during validation and route it with the
  canonical model-decision behavior, preserving existing project-owned rule files.

## [1.0.0] — 2026-09-07 — Comprehensive agent-kit update

### Breaking changes
- Advance each project as one coherent kit on explicit sync. Reject nonempty or malformed legacy
  pins before mutation. Keep absent/empty legacy pins compatible and use explicit asset exclusions
  for opt-outs. No background upgrade, network pull or per-file version resolver is introduced.
- Introduce lock schema 2, explicit source/transform identity and typed settings acquisition.
  Preserve borrowed and ambiguous legacy settings. Known conflicts stop the whole plan before writes;
  force cannot waive invalid schema, containment, routing or unsupported adoption.
- Require a meaningful title for changelog-fragment assembly and retain the original fragments.
  Assembly is not combined verification, archival or permission to discard evidence.
- Require an acquisition ID to release an orchestrator lock. Serialize cooperating local
  acquire/release operations with an exclusive guard; reject foreign, malformed and legacy state.
  Existing callers must retain and supply the acquired ID. Recovery is explicit and ownership-checked.
- Return verifier exit 2 for incomplete declared-check coverage, including under `--warn-only`.
  Preserve readable findings across individual rule read/discovery failures and report coverage,
  exact source errors, exclusions and unautomated obligations separately from findings.

### Added
- Support optional Git-ignored working/backlog index companions. Keep published navigation portable
  while retaining hard missing-link checks, stale-row detection and combined local index coverage.
- Add a machine-local launcher setup and explicit pending-operation recovery. Portable project hooks
  use the launcher without embedding a checkout path. Interrupted operations retain private exact
  before/after bytes; intervening edits stop recovery. Consumer sync does not publish kit metadata.
- Add independent preservation, settings acquisition, metadata adoption, migration and interruption
  regressions. Add parsed native MCP and isolated Gemini discovery tests, and Windows/Linux CI lanes
  for Node 20, 22 and 24. Configured CI lanes remain unexecuted until an authorized CI run.
- Register the concrete agentkit and Tailscale CLI dependencies. Document conditional/native
  capabilities and distinguish version probing from tool, project or deployment readiness.
- Detect raw palette utility candidates across stylesheet and supported source files. Keep
  token-definition exceptions local to their color checks so unrelated checks still run.
- Add lock ownership/race, verifier coverage/fault and actual all-vendor packaging regressions,
  including meaningful missing-target and malformed/unreadable-input negative controls.

### Changed
- Resolve physical Git roots for verification receipts, including Windows short-path and filesystem
  aliases. Retain child-directory exclusion and invalidate receipts when source content changes.
- Preflight the complete Codex TOML file and reject unowned semantic server collisions. Validate
  accumulated canonical metadata and native routes before adoption, and resolve required workflow
  skills against the actual selected tree. Reject raw nonstring MCP scalars without coercion.
- Reject forbidden raw TOML controls before publication, including quoted keys and comments.
  Keep valid escapes, tabs and CRLF; report a redacted source line without adding a parser dependency.
- Include redacted native target, ownership and reconciliation context in settings refusals.
  Parse the documented setup/changelog value flags and report missing-title failures in human output.
- Validate transformed destinations, metadata and native routing collisions. Preserve canonical
  metadata during supported generated-body adoption and reject unsupported inverses. Quote native
  YAML/TOML scalars and translate the supported local-stdio MCP fields explicitly.
- Generate selected Gemini skills without duplicate standard-skill copies in combined Codex/Gemini
  installs. Stop emitting the non-skill template entry point; retain all 71 standard skill names.
- Narrow default command grants and require explicit opt-in for broader runners. Track introduced,
  borrowed and unresolved settings independently so removal cannot claim user-owned values.
- Align documentation consumers with a declared KB-root mapping, proportional records and retained
  evidence. Treat unknown ancestry as incomplete verification, not a clean result.
- Refactor all 71 operational skills and 20 workflow routers. Retain all public skill and workflow
  names, the specialist references and the four already-correct communication mappings.
- Reconcile shared authority, evidence, artifact, orchestration and lifecycle contracts across
  canonical rules, skills, workflows, templates and governance. Preserve public entry points and
  domain expertise while removing conflicting recipes, ritual counts and imported project assumptions.
- Correct 38 of 39 rules; retain the already-contextual UI-copy rule. Preserve compatible heading
  targets and conditional specialist techniques while correcting misleading routing descriptions.
- Make diagnosis, preparation, implementation, integration, publication and paused closure distinct
  outcomes. Preserve local-only evidence, accepted intent and required proof through handoffs.
- Preserve graph/research, security/RLS, WCAG, animation/diagram, React/performance and operational
  methods while correcting examples and making project-specific architecture and styling conditional.
- Route shared references through canonical project resources or an explicit kit-checkout resolver;
  preserve missing-selection and unavailable-tool boundaries in generated instructions.
- Align document/ticket/skill scaffolds, recovery guidance and dependency metadata with their owners.
  Existing historical evidence and public entry points are preserved; no operational skill is removed.

### Evidence and provenance
- Additional need: deployment, documentation and platform reviews demonstrated overwrite, wrong-source
  adoption, containment, settings-ownership and coverage defects. Three Astra/high implementation
  workers follow the reconciled synthesis and independent Astra/high design corrections. User choices
  favor coherent explicit updates and minimal machine-local setup, not customization layers.
- Need: static source reviews found cross-skill contradictions, technical example defects and
  state-preservation gaps. Staff Astra/high reviewers and an independent synthesizer informed the
  design; the coordinator adjudicated recommendations. Predicted behavior improvements require
  candidate testing, not reviewer consensus.
- KB consulted: governance contracts, authoring guidance, docs standard and verification profiles.

### Verification
- After the public-index and receipt-alias corrections, 324/324 tests pass on Windows Node 20,
  22 and 24 with zero skips. A publishable-files-only Windows Node 22 checkout passes self-sync,
  drift and content checks, then npm test: 323 pass, zero fail, one optional installed-Gemini check
  skipped. Both corrections passed independent Astra/high review. This is local rehearsal, not
  hosted CI or Linux/second-machine proof; those and remaining native-client lanes stay pending.
- After the acceptance repairs, combined platform suites pass 317/317 on Windows Node 20.20.2,
  22.19.0 and 24.19.0, with zero skips. Final record/generation reconciliation is coordinator-owned.
  Independent TOML parsing and installed Gemini discovery are included. Isolated native Codex 0.153.4
  project-config loading passes; its retained old-adapter behavioral assertion fails as expected.
- Isolated full-candidate generation across all adapters passes drift checking and a byte-identical
  repeat, including lock and manifest. The approved local Codex-block reconciliation retains an exact
  backup. Local self-sync updates generated mirrors and repeats byte-identically. Existing settings
  remain preserved. A separately approved, backed-up reconciliation clears the three remaining
  legacy ownership files, removes obsolete kit grants/hook and retains user-owned MCP permissions.
  MCP and entry-point bytes are unchanged; normal repeat sync and local drift checking are clean.
- The machine-local launcher resolves the selected checkout without a PATH change. No dependencies
  were installed for that binding, no other fleet project was migrated, and no publication occurred.
- Canonical source, dependency and reference checks pass. Content has no findings with the mapped KB
  included; taxonomy retains three existing dormant-waiver warnings at unchanged baseline three.
- Independent review accepts all six repairs and the CLI correction. Unchanged final reviewer
  probes pass all twelve boundary and five publication cases; the regression oracles are accepted.
  POSIX/CI execution, remaining native discovery/permissions and second-device proof
  remain pending. No integration, publication or broad cross-platform acceptance is claimed.
- The following results belong to the earlier skills-update phase, at its recorded inputs:
- Baseline `npm test`: 150 passed. Expanded suite: 182 passed, including five all-vendor
  packaging tests and lock/coverage fault regressions.
- Canonical YAML, dependency metadata and exact local references checked. All seven detector
  declarations exercised with violating, legitimate and scoped-exclusion fixtures.
- Twenty-three specialist runtime check groups passed in Node/Chrome with pinned React, GSAP and
  React Flow versions. Two paired Astra/high trials covered twelve tasks and nine adverse responses;
  they establish bounded outcomes, not a statistical model-performance or live-deployment claim.
- Exact canvas/Motion JavaScript snippets passed focused Chrome/Node checks; the Python containment
  example passed seven cases. These do not certify deployed consumers or every platform.
- Local implementation candidate only. Publication and consuming-project migration are separate actions.

## [0.3.1] — 2026-09-04 — CI runtime maintenance

### Changed
- Upgraded `actions/checkout` and `actions/setup-node` from v4 to v7. Both actions now use the
  Node.js 24 runtime instead of the deprecated Node.js 20 runtime.

### Evidence and provenance
- Need: keep the public CI workflow on supported action runtimes without changing its Node.js 22
  test matrix.
- Evidence: official action releases identify v7 as the current major; the GitHub-hosted runner is
  v2.337.0, above v7's minimum runner requirement of v2.327.1.
- KB consulted: none.

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
