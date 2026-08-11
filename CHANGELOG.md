# Changelog

## [2026-08-10] — v0.2.0 — public extraction

### Added
- **Public release** of `agentkit` as a standalone, vendor-agnostic agent kit (MIT). Author once
  in `.agent/`; `agentkit sync` generates per-vendor native surfaces; `agentkit check` detects
  drift via a committed lockfile; `agentkit adopt` returns local improvements to the kit.
- Ship-safe templates for personal/local content: `fleet.example.json`, `.mcp.json.example`.
- `.gitignore` keeps fleet roster, MCP config, generated rollups, working docs, and external source
  material local-only — the public surface is the generic kit.

### Context
- This repo is extracted from an internal lineage (versions through **v0.17.0**). The prior
  release entries below are retained as generalized historical record; the public version line
  restarts at **v0.2.0**.

## [2026-08-10] — v0.17.0 — clear communication and sparse UI copy

### Added
- Added always-on communication guidance for clear, concise session messages, tickets, handoffs,
  reports, and technical prose.
- Added model-routed UI-copy guidance for contextual actions, headings, tooltips, feedback, errors,
  and empty/loading states.
- Added the `write-clear` skill for drafting, rewriting, and reviewing session, ticket, technical,
  and UI text.

### Changed
- Updated the handoff skill and ticket template to use a writing pass, observable acceptance criteria,
  and explicit out-of-scope closure.
- Updated the web-interface audit to prefer sentence case, sparse UI text, concise actions, and
  actionable errors.
- Added the communication contract to the repository `AGENTS.md`.
- Strengthened communication guidance with flat-language defaults, procedure/report separation,
  condition-first instructions, output patterns, and a deletion-first anti-slop pass.

### Evidence and provenance
- Need: improve session communication, ticket writing, and UI text (T2 observed from the direct user
  requirement).
- Design judgment: adopt the useful operational patterns from ASD-STE100 and SimpleEnglish without
  their global bans or fixed limits (T3 judgment).
- Provenance: staff · GPT-5.

### Verification
- `node agentkit.mjs sync .` — wrote 4 generated files, 0 prunes, 0 refusals; second dry run wrote
  0 files and pruned 0 files. The flat-language refinement sync wrote 2 generated files, 0 prunes,
  and updated 1 managed setting; its final dry run wrote 0 files and pruned 0 files.
- `node agentkit.mjs check . --quick` — all tracked files in sync.
- `node agentkit.mjs check . --content --taxonomy` — exit 0; existing warning-only citations remain.
- `node agentkit.mjs verify .` — 6 checks from 2 active rules; no invariant violations.
- `npm test` — 150/150 passed.

What we deliberately did NOT do: impose fixed word limits or a controlled dictionary by default, ban
metaphors or passive voice globally, require strict STE100 compliance, or force explicit wording when
UI context already makes it clear.

## [2026-08-10] — v0.16.0 — OpenCode MCP provisioning

### Changed
- Added native OpenCode project MCP generation in `opencode.json`, preserving user servers while
  key-merging the configured codebase-memory server.
- Updated the integration and vendor capability contracts to reflect OpenCode's current MCP
  configuration surface.

### Verification
- `npm test` — 150/150 passed.
- OpenCode 1.18.16 project smoke check — `codebase-memory-mcp connected` in
  `proj-portal-b` and `proj-resume`.

What we deliberately did NOT do: add a second MCP transport, publish an npm package that does not
exist, or overwrite user-owned OpenCode/agent configuration outside managed MCP keys.

## [2026-08-09] — v0.15.1 — wrap-up closes completed branches safely

### Changed
- Made `wrap-up` a safe frequent checkpoint: it retains active or incomplete branches with an
  explicit reason, while routing a clean completed branch to `land` for final push and deletion.
- Added a branch-closure decision to the wrap-up definition of done so completed feature branches
  cannot remain as unexplained residue.

### Verification
- `node agentkit.mjs sync . --dry-run` — 0 writes, 0 prunes, 0 refusals after self-sync.
- `npm test` — 149/149 passed on the unchanged final tree.
- `node agentkit.mjs check . --json --allow-branch` — clean.

KB consulted: `governance/docs-standard.md`, `.agent/skills/implement-session-land/SKILL.md`

## [2026-08-09] — v0.15.0 — lifecycle-aware verification and release-tree closure

### Changed
- Replaced the blanket full-validation-before-completion rule with lifecycle-aware proof: focused
  local checks, one broad gate per final SHA/tree, and release validation only at the release
  boundary. Local or CI evidence is citable when it covers the exact final SHA/tree.
- Removed the mandatory post-fast-forward rerun from session landing when the existing evidence
  covers the exact final tree; added upfront `machine`, `runtime`, `human`, `docs`, and `landing`
  ownership lanes to handoffs and worker reports.
- Made browser verification capability- and project-profile-aware, and removed duplicated browser
  prohibitions from individual skills/workflows. Playwright remains optional and profile-driven.
- Added project-owned browser profiles and exact-tree verification receipts (`agentkit receipt` and
  `agentkit receipt --check`) so evidence cannot be reused after the tree changes.
- Tightened session landing so the final step audits and closes clean merged worktrees and local
  branches, reports held dirty trees, and verifies that the remote release tree is the only retained
  mainline state after authorized cleanup.

### Reopened
- Reopened the Playwright/browser-tool decision in `docs/backlog/IDEA-additional-tool-integrations.md`
  using the reported Codex/Claude versus AntiGravity browser-testing evidence. The AntiGravity-specific
  restriction remains project-local until AgentKit can emit vendor profiles.

### Verification
- `node agentkit.mjs sync .` — wrote 25 generated files, 0 prunes, 0 refusals.
- `node agentkit.mjs sync . --dry-run` — 0 writes, 0 prunes, 0 refusals.
- `npm test` — 145/145 passed, 0 failed. The first invocation lacked the ignored `.tmp-test`
  scratch parent; after creating that test-only directory, the same command passed.
- `node agentkit.mjs check . --content --taxonomy --hygiene` — exit 0; existing citation warnings
  remained warn-only.
- `git diff --check -- .agent docs/backlog` — exit 0.
- `npm test` — 148/148 passed after adding profile and receipt coverage.

KB consulted: `governance/overlay-contract.md`, `governance/mirror-contract.md`,
`governance/best-practices.md`, `docs/backlog/IDEA-additional-tool-integrations.md`

What we deliberately did NOT do: add a fleet-wide Playwright dependency; encode proj-resume's
`verify:changed`, adaptive path/PDF/hosted lanes, test-consolidation timing, or AntiGravity-only
restriction in AgentKit; create an `AUDIT-test-inventory-2026-08.md` report when no such report
existed in this workspace; or run release validation without crossing a release boundary.

## [2026-08-01] — v0.13.1 — agent-asset boundary decided: operator owns the box, builder renders the text

U4 design session, resolved by checking both repos before deciding (the maintainer's call). Finding:
**the operate-side kit already ships the agent-box pattern** — `templates/agent-project/agents/<domain>/`
with `AGENT.md` + `agent.toml` + `knowledge/` + `tools/`, relay hardening already in its template,
plus the hub projector — while builder has no agents surface at all. U4 as written would have
minted a second home for a pattern the operate kit already owns.

### Added
- **`docs/knowledge-base/DECISION-agent-asset-boundary.md`** (+ a "Kit decisions" section in the KB
  index): operator owns the box, skeleton templates, persona hardening, MCP wiring, hub projection;
  builder owns rendering contract text into harness registries (`.claude/agents/<name>.md`), the
  adapter fidelity work (`mcpServers` through the allowlist, YAML-sequence shape, duplicate-name
  rejection), and the roster-consistency check. One source, two projectors; neither kit forks the
  other's pipeline.

### Changed
- **TICKET-akit-u4** re-scoped to builder's half; stale pre-rename repo path in its header fixed.
  Q1's `.agent/agents/` home superseded; Q5's template content routed to operator's skeleton; Q4
  note: Codex subagent registry confirmed by the 2026-07-26 inbox evidence — Codex rendering
  belongs to the cross-vendor compiler program. Remaining open question (the box scan-root) rides
  the compiler program's Decision 2, gated on the maintainer.

## [2026-08-01] — v0.13.1 — the expiry-trigger store test + PRD dissolution become the standard

Adjudication of `F-prd-store-lifecycle` (the maintainer, after a worked greenfield-auth example). The store
question generalized into a criterion cleaner than the case: **a doc's store is named by its expiry
trigger** — expires when behavior changes → KB (`SPEC-`/`RUNBOOK-`); expires on a direction pivot →
KB (`STRATEGY-` incl. vision — a commitment is a present-tense fact even when its content describes
the future; `DECISION-`); expires when the work lands → lifecycle. The test reproduces the entire
existing `PREFIX_STORE` map and settles `PRD-` unambiguously: lifecycle.

### Changed
- **`governance/docs-standard.md`** §a — the expiry-trigger table + the **PRD dissolution
  contract**: a PRD is a composite bridging vision→spec, born in `working/`; on landing it
  dissolves — landed subset → `SPEC-` (as-is voice, divergences recorded as reality, may start as
  soon as any slice is real), unlanded remainder → strategy/backlog, record → archive with a
  closing header. Never parked whole in the KB. §c — `PRD-` moved to the lifecycle registry;
  `STRATEGY-` explicitly carries vision (no `VISION-` prefix minted — same store, same expiry;
  revisit only if practice demands); `ROADMAP-` registered in the standard at last (in the code's
  store map since 2026-07-25, never in the doc).
- **`PREFIX_STORE['PRD-']` → `'lifecycle'`** with red-proof: working/ and backlog/ PRDs were
  wrong-store findings (proj-resume's 9 FPs) and a KB-parked PRD was silently legal; now inverted —
  the KB-parked PRD is the true positive.
- **`plan-prd`** outputs `docs/working/PRD-{name}.md` — it had been laundering PRD content through
  a `TICKET-` filename. **`implement-session-land` §2.1** sweeps `PRD-` and dissolves (never
  `git mv`'s a PRD into the KB).
- Store-agnostic `PRD-` was **rejected**: it blinds the checker for the doc type with the worst
  staleness profile and would be the first prefix-level exemption — a new axis of checker decay.

### Fleet
- proj-resume: 9 `working/PRD-*` findings die; its 3 KB-parked PRDs become true positives — the next
  docs reconcile dissolves them into specs.

### Verification
- `npm test` 145/145 pass 0 fail (new test observed failing first: working/backlog PRDs flagged,
  KB PRD not — then inverted). `check --content` 0 · `check --taxonomy` 12/12 baseline ·
  `check --hygiene` 0. `agentkit sync` idempotent after mirror regen.

KB consulted: `governance/docs-standard.md`, `docs/backlog/IDEA-post-v06-feedback.md`,
`.agent/rules/pattern-docs-artifacts.md`

## [2026-08-01] — v0.13.1 — ci-job precision fix + proj-resume kit-HEAD intake committed

Post-release follow-through on the fresh proj-resume upgrade feedback (intake committed verbatim as
`b41e9cc` after the authoring session went idle; measured against `05489a6`).

### Fixed
- **`F-ci-job-prose-fp`** — the `ci-job` check's quote is now mandatory with a matching close
  (`([`'"])…\1`) and `/i` dropped so `[a-z]` genuinely enforces lowercase-kebab. Previously every
  prose "job <word>" in a repo whose domain vocabulary contains "job" was a phantom CI job — 156
  hard false positives on proj-resume (94% of its hard findings), which is what kept `--content` out
  of its CI gate. Red-proof observed: a fixture built from proj-resume's verbatim phrases produced 9
  false tokens (incl. Title-Case `Board`/`URLs`/`Description` via the `/i` defeat) before the fix,
  and exactly the one quoted fictional job after it. Accepted recall cost recorded in the code
  comment: unquoted or sentence-case citations are no longer checked. Fourth member of the
  checker-precision family (`F-dead-index-false-positives`, `F-content-check-illustrative-fps`, D2).

### Open, awaiting adjudication
- **`F-prd-store-lifecycle`** (senior, design): `PREFIX_STORE['PRD-'] = 'kb'` contradicts the kit's
  own lifecycle criterion (the `ROADMAP-` rationale two lines above it); proj-resume already practises
  promote-on-landing undocumented. A standards decision for `governance/docs-standard.md` §(a)/§(f),
  not a mechanical edit — gated on the maintainer.

### Verification
- `npm test` 144/144 pass 0 fail (runner's own pass line; new test observed failing first).
- `check --content` 0 · `check --hygiene` 0 on the kit.

KB consulted: `docs/backlog/IDEA-post-v06-feedback.md`, `.agent/rules/git-protocol.md` §6,
`foundation-testing.md` §1B

## [2026-07-31] — v0.13.0 — evening wave: peer review lands + three-lane parallel backlog attack

Late-evening session in two acts. Act 1: peer review of the v0.12.0 land (`review-peer`) — every
verification claim re-run and confirmed, zero rejects, four defects found and fixed (`5bb038b`):
the status-parse dialect gap (`**Status:**` vs `**Status**:` — two hand-copied parsers collapsed
into one `parseArtifactStatus`, red-proof observed on both consumers; the two live the maintainer-gated
tickets had been invisible to every hygiene check), the partially-rolled status board (fleet table
restating a stale kit version, TICKET-25 listed open after landing, release-train rows out of
order), and the unstamped `F-content-check-illustrative-fps` pool entry. Act 2: a three-lane
parallel wave off the freshly-landed main — kickoff `0b1ea6e` (tickets to `working/`, headers
flipped, two Files-line omissions corrected at partition time), one opus worker per staff/senior
ticket, one sonnet worker on the junior ticket, merge-train landing with the gate run between
lanes. All three lanes landed; all three tickets merged and archived same-session.

### Added
- **TICKET-23 — `must-precede` partition classification** (`2f15e53`, opus lane): partition Phase 2a
  ("declared-new-symbol pass") builds a `symbol → producing ticket` map from Decision lines — the
  only signal that can see a symbol before any file contains it — and emits `must-precede <P>
  before <C> (symbol <name>)` as a fourth verdict that rides ALONGSIDE the pair's surface verdict;
  two producers of one symbol classify `collision`. Sequence Phase 3.3 runs the pass set-wide at
  DAG-build time (per-wave would be after the sort — inert) and feeds the edges into the same
  topological sort as `**Depends**`; precedence stays visibly distinct from the soft co-scheduling
  exclusion. Decompose Phase 4 now requires declaring every new exported symbol. Worked fixture
  (the proj-b lane-04/lane-01 shape) embedded in partition with the additive-by-construction
  regression statement. Closes pool `F-orch-partition-import-dag`.
- **TICKET-24 — `domain:` topic routing** (`64a4bf8`, opus lane): all 37 `.agent/rules/*.md` carry
  exactly one `domain:` value (verified mechanically: every diff exactly +1/-0, frontmatter only);
  `governance/canonical-manifest.md` records the two-axis split (`tier:` = repo applicability,
  `domain:` = task topic; filter tier-first) and the closed 15-term vocabulary (all 13 proposed
  terms survive + `design-system` and `code-quality`, each closing a named gap);
  `templates/project-invariants.md` gains 11 injectable task-type → rule-subset rows for
  `orchestrate-kickoff` Phase 2.4. Render check observed: `sync` wrote 0 — `domain:` is source-only
  by construction (the rules adapter carries only `globs:` through). Closes pool
  `F-orch-rule-routing`.
- **TICKET-31 — the two outstanding red-proofs, observed** (`e56c66e`, sonnet lane): the
  deletion-impact sweep seen REFUSING on a scratch fixture (a `.agent/rules/` hit + a live ticket's
  `**Files**` hit), then seen clean after the fix; the `maintain-docs` applier seen refusing a
  fabricated finding (quote present nowhere in the file) with a deviation note while applying the
  true finding in the same run. Failing AND passing outputs recorded in the ticket; TICKET-27/28
  archive records carry closing pointers. No shipped mechanism modified. Closes the "Not verified"
  remainder the v0.12.0 entry declared — the docs-drift batch is now fully red-proofed.

### Fixed
- `checkHygiene`/`humanGates` status parse (`5bb038b`): both prose dialects accepted via one shared
  `parseArtifactStatus`; a ticket whose status cannot be parsed is no longer silently exempt from
  every check. Regression test covers both consumers (merged-but-open fires; the human gate reaches
  the generated view).
- `PROGRAM-STATUS.md` fleet table points at the checkpoint line instead of restating the kit
  version; Pending no longer claims TICKET-25 open or `check --content` red.

### Observed, not yet fixed
- `F-cli-sync-dirties-kit` demonstrated live on the kit itself: a flagged `check` run rewrote
  `manifest.json` (37 rule hashes) in the orchestrator's tree mid-wave. Folded into the sync
  release commit; the pool finding stays open and gains this evidence.
- Release tags stop at `v0.1.0` — the "release train all tagged" claim in `PROGRAM-STATUS.md` does
  not match `git tag`; recorded here rather than silently re-asserted.

### Verification
- Release state (post-merge-train + sync): `npm test` 143/143 pass 0 fail (runner's own pass line);
  `check --content` 0; `check --taxonomy` 12 findings, baseline 12, no regression;
  `check --hygiene` 0. `agentkit sync` idempotent (second run wrote 0). All three worker SHAs
  verified ancestors of main (`git merge-base --is-ancestor`) before being written to `landed:`.
- Worker-lane gates ran green on each branch before landing; each completion report carries the
  runner's own pass line.
- Wave mechanics note: all three worktrees snapshotted at `61fefd4` (pre-kickoff), so two lanes
  edited the pre-rename ticket paths — both merges resolved on the status/acceptance hunks only,
  completion state winning over kickoff state; one lane (T24) detected the stale base itself and
  re-branched from current main.

KB consulted: `.agent/rules/pattern-agent-orchestration.md`, `governance/docs-standard.md`,
`.agent/rules/git-protocol.md`, `templates/TICKET-TEMPLATE.md`

## [2026-07-31] — v0.12.0 — docs-drift hardening: indexes point, deletions propagate, the checker can see

Intake and execution of proj-resume's 2026-07-30 full-tree docs review (source ticket at proj-resume
`41b10d96`, review commit `9258c67b`). 18 proposals adjudicated in the feedback pool as
`F-proj-resume-docs-drift` — 13 adopt, 3 adapt, 2 already-shipped — then the mechanism half built.
Three mechanisms accounted for nearly all the drift it found: indexes that **restate** status
instead of pointing at it, a "done" path that never greps docs for what a branch **deleted**, and a
citation checker blind to every reference class except markdown links.

### Added
- **`governance/docs-standard.md`** — an index row points and never restates (with the worked
  before/after); volatile facts barred from durable docs (line numbers, hand-maintained counts —
  delete on sight, hand-copied command/CI expansions); bulk sweeps enumerate from the filesystem,
  never from an index; sweep by ownership, not recency; truth ranking code > status board >
  CHANGELOG narrative; the standard is the canon and a project does not hand-write a second copy.
- **`implement-session-land` §2.0** — the deletion-impact sweep, defined once. The git diff defines
  the scope, not the author's memory; five surfaces greped with `--no-ignore`; a deleted path on a
  live ticket's `**Files**` line forces a re-verdict. `implement-session-wrap-up` Phase 5,
  `worker-report` Phase 3, `/ship` step 4 and `pattern-refactoring.md` §6 all point at it. No new
  cadence or command — it rides the two steps already in the operator's habit.
- **CLI** — markdown-link resolution; `docs/` as a citing surface (KB bodies warn, index READMEs
  hard); cross-repo `<repo>:path` notation plus `externalRoots`; shared `<!-- taxonomy-ignore-line -->`
  suppression; CI job-name checking; `:line` warn tier; index **coverage** for `working/` +
  `backlog/`; owner/reason and dead-entry reporting on `taxonomyWaivers`.
- **`git-protocol.md` §6** — never edit another session's single-writer file; sync derived surfaces
  to the board rather than adjudicating program state from the maintenance seat.
- **The docs-truth pass** — `audit-docs` is now the read-only reviewer, with the finding schema
  (quote → correction → evidence → verdict) defined once as the handoff artifact; `maintain-docs` is
  the applier, required to re-confirm every quote and citation, empowered to deviate with evidence,
  and required to report deviations. `audit-docs` step 3 stops claiming a mechanism it never had and
  delegates to the CLI that now owns it. `maintain-docs` gains the inbound-reference sweep before
  any archive move and closes every pass by running the checker.
- **Status as data** — the kernel's §2 frontmatter block (`status`, `updated`, `landed`,
  `supersedes`/`superseded-by`) with the prose `**Status**` line still working; `landed-in-backlog`
  and `landed-not-ancestor` checks; a **generated** human-gate view built by globbing the lifecycle
  directories; the two-owned-moments table (kickoff flips the header, completion flips it again).
  All 8 backlog tickets migrated here first.
- **Truth ranking** in `project-onboard` and `orchestrate-kickoff`: code > status board > CHANGELOG
  narrative, with changelog entries named as point-in-time records that later entries supersede.

### Fixed
- **`check --content` is green (exit 0) for the first time** — it was red on 3 known false
  positives (`F-content-check-illustrative-fps`). All three closed by the resolver work rather than
  by degrading the prose that triggered them.
- **Real drift caught on the new checks' first run**: `docs/knowledge-base/README.md` pointed at two
  documents that have **never existed** in this repo at any path (verified against full history, not
  assumed to be deletions); `docs/README.md` cited a convention doc that does not exist.
- **The kit's own restated status** — `PROGRAM-STATUS.md` said v0.11.0 in its checkpoint line,
  v0.6.0 in one heading and v0.5.2 in another. Both READMEs restated ticket fields.
- Kit-relative globs never resolved (`integrations/*.md` reported as a phantom while the directory
  plainly exists) — the wildcard branch was unreachable past the kit-relative return.
- Cross-repo SHAs raised `could-not-determine` errors — a flowback ticket legitimately cites its
  source repo's commits, and this was firing on three tickets in this very branch. A SHA naming no
  object here is now silent: not ours, so not an ancestor, and not an error.
- `backlog-status` documented `scope`, `category` and `created` — a field set that appears in no
  ticket and in no template. Repointed at the fields that exist.
- **D2's basename set was `docs/`-only**, so a README citing a real rule by bare backticked basename
  (`pattern-docs-artifacts.md`) read as "renamed away". Caught at land time by the archive index this
  session wrote — the false positive whose only workaround was degrading correct prose. The set now
  includes `.agent/**` and the root entrypoints. (TICKET-25 case (a), missed in its first pass.)

### Verification
- `npm test` — 142 tests, 142 pass, 0 fail (was 126).
- `node agentkit.mjs check .` — `--content` 0, `--taxonomy` 0 (12 findings, baseline 12, no
  regression), `--hygiene` 0. `agentkit sync` clean.
- **Red-proofs observed, not asserted**: a seeded unindexed ticket took `--taxonomy` to exit 1
  (13 > 12) and removing it restored 0; waiver hygiene took the repo to 15 > 12 and the D5 ratchet
  (own each entry, never raise the baseline) brought it back to 12; seeding a landed SHA onto a
  backlog ticket took `--hygiene` to exit 1 with both new findings, and restoring returned 0.
- **Two premise corrections at apply time** — a TICKET-29 claim about `DOC_CONVENTION_ROOTS` was
  false (a passing test already asserted the opposite), and TICKET-26 predicted two dogfood
  violations where there were three. Both are recorded in the pool; both are what D1's
  reviewer→applier split exists to catch.
- Not verified: the seeded-fixture red-proofs in TICKET-27 (a deleted path named by a rule and a
  ticket) and TICKET-28 (a fabricated finding refused at apply time) have not been run. Both tickets
  are `reported`, not `merged`. All 18 proposals are now dispositioned and all six tickets built.

KB consulted: `governance/docs-standard.md`, `.agent/rules/pattern-agent-orchestration.md`,
`.agent/rules/pattern-docs-artifacts.md`, `templates/TICKET-TEMPLATE.md`

## [2026-07-26] — v0.11.0 — cross-vendor compiler plan: peer review, amendments applied, vendor evidence captured

Peer review (`review-peer`) of `docs/working/TICKET-builder-cross-vendor-agent-compiler.md` —
verdict **approve with amendments, zero rejects**. Every "current gaps" claim verified against real
code at line level (two repo evidence sweeps), all three cited Codex doc URLs fetched live and
confirmed, Claude subagent frontmatter checked against current `code.claude.com/docs/en/sub-agents.md`,
and all three coordinate tickets (operator, mayneview, umbrella) read and cross-checked.

### Changed
- Ticket amended in place (15 edits covering all 11 review findings): new **Decision 6** — the TOML
  reader is a dependency decision (first-ever runtime dep vs constrained in-repo parser; explicit
  approval required; approval ask widened to decisions 2–6). Decision 2 now records the umbrella
  `owned_servers` supersession ("implement one form, never both"; Builder + Mayneview derive from
  `.mcp.json`). Phase 2.2 no longer promises Claude method-level MCP allowlists (current docs:
  server-level only in `tools`/`disallowedTools` → decision-4 degradation unless Phase 0 proves
  otherwise; adapter allowlist must carry `disallowedTools`). Codex evidence routed through the
  research-store tiers before the vendor matrix may cite it. Smaller: tier-namespace clarification
  (render `model_tier` vs orchestration `tierRoster` vs asset-pipeline `tier`); Verification uses
  `check . --all` + bare-`check`-can-write-lock caveat for Phase 0 baseline capture; generated
  manifest now lists `.claude/agents/**` and `agents/<name>/**` wrappers (dot-distinct from
  `.agents/`); nested `AGENTS.md` = prompt-order precedence, deliberately not `AGENTS.override.md`;
  `docs/working/PROGRAM-STATUS.md` paths corrected; Phase 5.3 "committed to a branch" (stash
  forbidden); Phase 6.4 coordinates with TICKET-25 instead of absorbing it.
- Land deep-clean: `PROGRAM-STATUS.md` checkpoint rolled to 2026-07-26 with the cross-vendor
  program on the status of record (open work / Pending / live artifacts); `working/README` +
  `backlog/README` next-steps carry the review state and the `research-curate` follow-up. Premise
  sweep over working+backlog: 7 ACTIVE-KEEP, 0 archived (`IDEA-post-v06-feedback`'s
  dispositioned-batch + still-accumulating state judged by-design, not stale).

### Added
- Two tier-1 evidence drops for `research-curate`:
  `docs/raw-research/inbox/codex-custom-agents-fetched-2026-07-26.md` (`.codex/agents/*.toml`
  registry — required `name`/`description`/`developer_instructions`; embeddable `model`,
  `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, `skills.config`; per-server
  `enabled_tools`/`disabled_tools` deny-after-allow; nested `AGENTS.md` concatenation with
  cwd-terminated discovery) and
  `docs/raw-research/inbox/claude-subagent-frontmatter-fetched-2026-07-26.md` (full field table
  incl. inline `mcpServers`; MCP granularity server-level only; no-MCP = `disallowedTools: mcp__*`;
  plugin/background subagent restrictions). The stored Codex corpus (2026-07-03) covers runtime
  spawning only — the custom-agent registry facts were previously uncaptured in-repo.

### Verification
- Docs-only session; no code touched (`npm test` not run — nothing it gates changed).
- `node agentkit.mjs check . --content` run after the final edit: exactly the three pre-existing
  TICKET-25 false positives (`docs/research/`, `src/`, `open-webui-agent-network-ops`), exit 1
  pre-existing — no new findings introduced by the ticket edits or inbox drops. No code changes
  since that run.
- KB consulted: `governance/vendor-capability-matrix.md`, `governance/mirror-contract.md`,
  `governance/overlay-contract.md`, `docs/raw-research/README.md` + `inbox/README.md`.

## [2026-07-25] — v0.11.0 — feedback triage: 26 findings dispositioned, 7 CLI fixes, kernel/skill doc pass

Full triage of the post-v0.6.0 feedback pool (branch `feat/agent-fable-feedback-triage`). Every open
finding re-verified against HEAD before acting — 4 premises corrected, 1 ask dropped, 1 rejected
with written rationale, the rest fixed or ticketed. Executed as two Sonnet worker waves on disjoint
surfaces with orchestrator review + pathspec commits.

### Added
- `verify --fail-on <severity>` / `--warn-only` (default critical-only exit unchanged, pinned by
  test); `doctor` cwd scoping + `--all` (the advertised `[project-path]` positional now works);
  flat `overlay.claims` config array; `taxonomyBaseline` regression ratchet + glob-capable
  `taxonomyWaivers` (`c2d2866`).
- Kit self-gate green honestly: waivers for the two README-documented convention clusters
  (`knowledge-base/{research,prompts,golden-renders}/**`) + baseline 12 — red-proven at baseline 0,
  exit 0 at 12/12 (`eed633f`).
- `templates/project-invariants.md` "Doc routing (category → docs)" section — the table four
  kickoff/kernel sites consumed but nothing scaffolded (`10eac5c`).
- Backlog tickets 23 (partition `must-precede` DAG, staff), 24 (rule `domain:` routing), 25 (docs
  link resolver + content-check precision); U4 gains the adapters.mjs `stripFmTo`-strips-`mcpServers`
  design input (`dc96684`).

### Fixed
- **Refused-prune lock retention** (`c2d2866`): a refused prune's lock entry now survives with
  `refusedPrune: true` — previously it silently dropped, making the stale file permanently invisible
  to check/doctor and silently re-adoptable as project overlay. `mirror-contract.md` §4 states the
  invariant (`bdd0f44`).
- **Sibling-branch warn** (`c2d2866`): `planSync` warns when the kit clone is on a non-main branch
  (`--allow-branch` acknowledges). Pinned via `--git-dir`/`--work-tree`, never `-C`, which lets git
  discovery walk up and report the enclosing repo's branch.
- Dead-index precision: per-line scan honoring `<!-- taxonomy-ignore-line -->` + placeholder stems
  (`RESULT-N.md`); full-ISO `syncedAt` for sync attribution (`c2d2866`).
- KB vendor-corpus duplicate deleted (~2,100 lines; `raw-research/help-docs/` is the
  provenance-stamped keeper); `research-synthesize` output corrected to
  `docs/working/REVIEW-research-application-<feature>.md`; `research-deep` outputs bound to
  `docs/raw-research/inbox/`; `audit-docs` gains the self-contradiction lens (`825d39b`).

### Changed
- Kernel one-pass (`5f30308`): §4 optional `baseBranch` + mainBranch-as-default; `tierRoster`
  marked illustrative (project `.agentkit.json` is authority); §5/§6 lock waiver re-scoped to its
  threat model (concurrent orchestrators — single-interactive-session runs may skip at any
  headcount, backgrounded/resumed/multi-session always mandatory); §5 memory-cost caveat
  (Windows/cloud-synced can invert worktree reliability); "MCP tools don't travel into subagents".
- Skills (`8f290e2`): `orchestrate-sequence` Phase 2.6 premise pre-flight (dead-premise tickets
  blocked, never scheduled); decompose verify-seam class + mixed-verification⇒split; scaffold-gate
  parity in partition/merge-train; kickoff resolves board base → `baseBranch` → `mainBranch`;
  `use-codegraph` Step 0 reachability (spawned subagents expect no MCP); `worker-bootstrap` records
  discovery mode. Rules (`3fad179`): commit-hook OOM mechanism in `tech-node-gate` §1, symptom
  pointer in `git-protocol` §2.
- Feedback pool: 6 SHIPPED, 21 landed, 5 corrections, `orchestrate-run` DROPPED, vendor-clutter
  REJECTED (mirror-contract clause 9), 2 new findings (`F-cli-sync-dirties-kit`,
  `F-content-check-illustrative-fps`) (`b393ce5`, `78f6e29`).

### Verification
- `node --test agentkit.test.mjs`: 114 → **123/123 pass** (9 red-first tests), independently re-run
  by the orchestrator. `sync` idempotent (second run 0 writes); `check` / `check --taxonomy`
  (12 findings, baseline 12, exit 0) / `check --hygiene` / `verify` all exit 0.
  `check --content` exits 1 on three **pre-existing** false positives (historical/negated/cross-repo
  mentions; proven untouched by the batch via `git log ed9ba5a..HEAD`) — recorded as
  `F-content-check-illustrative-fps`, folded into TICKET-25.

## [2026-07-25] — v0.11.0 — the operate-side kit adoption: axis-gated permissions, python/service packs, mcp-server-ops refresh

Fixes the three CLI defects found by the the operate-side kit adoption (first Python-primary,
non-app fleet member) and gives the `tech:python` and `kind:service` axes their first assets
(`8af260d`); establishes the three-tier evidence model (`dc36730`).

### Added
- `tech-python-gate.md` (tier `tech:python`) — the sibling `foundation-testing.md` §1 promises;
  uv + committed lock, ruff check AND format, canonicalize-before-compare, no `ty` gate.
- `kind-service-containers.md` (tier `kind:service`) — the axis had zero assets; digest pinning,
  `read_only`/`cap_drop`/non-root, Compose secrets, healthcheck ordering.
- `research-curate` skill + three-tier evidence model in `governance/docs-standard.md` §(f);
  `docs/research/` renamed to `docs/raw-research/` with an `inbox/` tier-1 drop zone (`dc36730`).

### Fixed
- Permissions baseline now axis-gated like the asset catalog: non-app kinds no longer receive 10
  npm/npx allows into a tree with no `package.json`; python/docker blocks added where declared.
  Differential across every axis combination: app repos byte-identical; self-healing prune verified
  live (the operate-side kit 19 → 12 entries).
- Taxonomy store resolves per-path: `knowledge-base/research/**` reads as the research store
  (layout and linter agreed at last); `ROADMAP-` prefix + `docs/architecture/` area sanctioned.
- `init` scaffolds a root `AGENTS.md` + `CLAUDE.md` (`@AGENTS.md` import form) when none exists —
  a non-app repo previously joined with 82 assets and no project contract.
- `mcp-server-ops` refreshed off primary sources: native Streamable HTTP over the stdio bridge,
  `Origin`-validation as the DNS-rebinding MUST, no-token-passthrough added, spec-revision-pinned
  with a 2026-07-28 forward note. It ships to proj-knowledge on that repo's next pull.

### Verification
- Suite 106 → 113 green at `8af260d`; self-sync 0 writes; check clean.

Wave U0 of the post-kinds-harvest plan. Mechanical: the kit was the last unfixed victim of the
staleness it had itself accumulated across the four features below (never self-synced since the
kinds axis landed; version never bumped; `fleet.json`/CHANGELOG never updated).

### Added
- Explicit `"kinds": ["app"]` declared in the kit's own `.agentkit.json` (Decision A) — deliberate,
  keeps `tech-node-gate.md` shipping to the kit itself (the kit does run `node --test`). Previously
  absent and resolving to the same default; now stated, not accidental. Re-sync after the change is
  a byte-identical no-op (0 writes, 0 prunes), confirming the default was already correct.
- `proj-knowledge` (`../proj-knowledge`) registered in `fleet.json` as a fleet member (kinds
  agent-infra+knowledge per its own `.agentkit.json`; previously absent from the roster).

### Changed
- Version bumped 0.9.2 → 0.10.0 (`package.json`). `manifest.json` (COMPILED — never hand-edited)
  recompiled via `agentkit sync .`, which calls `compileManifest()` → `kitVersion()` → reads
  `package.json`'s `version` directly; `kitVersion` in the manifest now reads `0.10.0`.
- Real self-sync run for the first time since the kinds axis (3657fe4) and the tier-inheritance fix
  (1a661d9) landed: 4 writes (`.claude/rules/foundation-testing.md`, `.claude/rules/git-protocol.md`,
  `.claude/skills/rule-pattern-agent-orchestration/SKILL.md`, `.claude/rules/tech-node-gate.md`) + 14
  prunes (the leaked `audit-web-interface`/`react-performance` reference renders that 1a661d9 fixed
  for every other consumer — the kit itself hadn't re-synced to pick up its own fix). Matched the
  known dry-run exactly.
- `reports/inventory.{json,md}` and `reports/doctor-last-run.json` regenerated fresh against the
  merged (post-kinds, post-agent-infra-pack, post-tier-inheritance) kit state.

### Verification
- `node --test agentkit.test.mjs`: 99/99 before and after every step. `agentkit check . --json`:
  `clean: true` after self-sync, after the kinds edit, after the version bump, and at close-out.

## [2026-07-24] — v0.9.2 fix(selection): nested skill files inherit parent SKILL.md tier

Commit `1a661d9`, merged via `6b74a2b`. Nested skill files (`references/*.md` etc. under
`.agent/skills/<name>/`) carried no `tier:` frontmatter of their own, so `tierOf()` defaulted them
to `core` and they shipped unconditionally, bypassing the gate on their owning skill's `SKILL.md` —
14 orphaned reference files (9 `audit-web-interface` + 5 `react-performance`) leaked into every repo
regardless of stack/kind. Nested untiered files now inherit the sibling `SKILL.md`'s computed tier;
an explicit `fm.tier` on a nested file still wins; a skill folder with no `SKILL.md` sibling falls
back to the prior behavior. D2 selection snapshot updated to drop the 14 leaked entries; D3 coverage
added for tech:X / kind:X inheritance and explicit-tier override.

## [2026-07-24] — v0.9.2 feat(agent-infra): seed pack — mcp-server-ops + tailscale-private-serve

Commit `c6f80ca`, merged via `0593f79`. Seeds the `kind:agent-infra` pack (TICKET-akit-p4):
`mcp-server-ops` authored from `MCP-SANDBOX-SETUP-LEARNINGS.md` + the generalizable parts of
`open-webui-agent-network-ops/SKILL.md` (transport choice, bearer-auth hygiene, read-only-first
mounting, list-then-read-then-refuse-write smoke test); `tailscale-private-serve` graduated from
a predecessor kit's project overlay, generalized to drop this-repo specifics and shipped as a single
self-contained `SKILL.md` (bundled reference/script subfiles deliberately not carried over — they'd
default to `tier:core` and ship to every app repo regardless of kind gating).
`open-webui-agent-network-ops` deliberately not graduated — stays project-runtime-specific by
design. Kind-gating test added mirroring the `kind:app` pattern; differential dry-run on two app
repos confirmed byte-identical output (zero incremental impact on the app fleet).

## [2026-07-24] — v0.9.2 feat(kinds): language-neutral testing core + app-gated node gate

Commit `29447cb`. Splits `foundation-testing.md` into a stack-neutral core rule (`tier: core`) and a
new `tech-node-gate.md` (`tier: kind:app`) carrying the JS/npm/TS-specific verification mechanics
(`gate:*` npm scripts, `tsc -b` vs `--noEmit`, Windows heap bump, tsconfig alias mirroring,
Playwright page-typing, `.test.tsx` naming). Every paragraph of the original lands in exactly one
destination; no content deleted. Real-kit kind-gating test added; D2 snapshot extended with the one
genuinely new asset. 8/8 app-repo differential dry-runs showed a delta of exactly the two rules'
renders + mirrors.

## [2026-07-24] — v0.9.2 feat(kinds): repo-kind axis, default app, app catalog re-tiered

Commit `3657fe4`. Adds a `kinds` config axis (what a repo IS) alongside `stack` (what it's built
WITH): `loadConfig` defaults `cfg.kinds` to `['app']`; `selectEntries` gates `tier: kind:<k>` on
`cfg.kinds`, preserving overlay-glob/core-pin precedence unchanged. A kinds-absent config selects
byte-identically to pre-kinds (golden snapshot D2, red-proofed). Re-tiers 19 of the app/web catalog
from `core` to `kind:app` (6 skills, 13 rules); 8 assets that already carried a narrower `tier:
tech:X` were deliberately excluded (an asset carries its narrowest gate; gates only ever narrow).
Fleet differential dry-run gate (8 app repos + kit self-sync): selection sets and vendor-rendered
files byte-identical before/after; positive control (`kinds: [knowledge, agent-infra]` on
a predecessor kit) pruned exactly the 44 rendered forms of the 19 retiered assets.


## [2026-07-23] — v0.9.2 adopt: .agent/rules/pattern-agent-orchestration.md
- Content fix adopted from `proj-diagnostics` (.agent/rules/pattern-agent-orchestration.md)


## [2026-07-23] — v0.9.1 adopt: .agent/rules/git-protocol.md
- Content fix adopted from `proj-diagnostics` (.agent/rules/git-protocol.md)


## [2026-07-10] — v0.9.0 — pooled-feedback backlog TICKET-11…21 (waves 1–2)

Eleven tickets distilled from four consuming-repo feedback batches, executed as two lite waves
(8 + 3 parallel workers, single-writer orchestrator, pathspec commits) on
`feat/agent-fable-backlog-execution`.

### Added
- **git-protocol Rule 6 — concurrent sessions share nothing (TICKET-11)**: one session per working
  tree (worktrees otherwise, cloud-synced-synced repos named), pre-commit branch + staged-entry
  re-check, pathspec commits as the standing rule, pointer-only `git branch -f` wrong-branch repair.
- **Kernel contract additions (TICKET-13)**: required `**Runtime assumptions**` line in §3 reports
  + worker-report (typecheck green ≠ renders); §2 selector-anchoring (line numbers secondary);
  named lite-wave mode (2–3 workers, contracts only, escalation boundary); skill-injection guidance
  + Explore-as-audit-worker pattern in orchestrate-kickoff.
- **`templates/TICKET-TEMPLATE.md` (TICKET-14)**: canonical §2 bold-line contract + Context /
  Decisions / Plan / Acceptance, tier-from-boundedness and selector-anchoring comments;
  orchestrate-decompose points at it.
- **Audit conventions (TICKET-15)**: grep-uniform "every lens ends in findings or an explicit clean
  attestation" sentence + gitignored `docs/working/evidence/` convention across all 12 audit skills
  + router; blind-spot table section in `templates/project-invariants.md`.
- **`check --content` token validation (TICKET-17)**: design-token citations in rules verified
  against the consumer's defined custom properties (warn-only, zero-token repos silent); content
  pass rides `check --all`, plain `check` prints the hint. 4 new tests, red-proof captured.
- **`changelog.d/` scaffold (TICKET-21)**: fragment mechanism + explainer in docs-scaffold;
  prepend-newest race-tolerance rationale recorded in pattern-docs-artifacts; inventory rows absent
  from the kit now labeled `(not in kit)` (async-design/async-performance no longer read as live).

### Changed
- **Merge-time re-scan is fetch-first (TICKET-12)**: kernel §6 + orchestrate-merge-train +
  orchestrate-partition now mandate "fetch, then diff against `origin/<mainBranch>`; never trust
  the local ref" — aligns integration side with worker-bootstrap/worker-report.
- **Rule-text truth fixes (TICKET-16)**: pattern-error-handling (and pattern-refactoring's example)
  reference "the project's error tokens (see project-invariants.md)" instead of baked-in names;
  pattern-monorepo §4 warns vendored token names may resolve differently or render invisibly;
  foundation-browser-usage counts plan-approval with a browser step as the explicit request;
  vendored-file provenance banner note in governance. `pattern-assets` `tier: tech:web` confirmed
  against proj-diagnostics (pending portfolio confirm).
- **Sync guards are concurrency-aware (TICKET-18)**: git-clean guard bypasses sync's own
  reproducible output via `isOverlayClean` (decision 36 narrowed, user-edit protection intact,
  red-proof captured); `check`'s kit-moved-ahead nudge appends a defer-while-dirty caution. Suite
  70 → 75 tests.
- **Wrap-up skill (TICKET-19)**: shared-tree cite-or-run clarification; copy/content-only sessions
  carve out to light wrap.
- **Testing docs (TICKET-20)**: verify-rules documents the Node-RegExp execution model vs the Git
  Bash bytewise-Unicode grep trap; foundation-testing §5 mandates mirroring tsconfig path aliases
  in the test-runner config.

### Verification
- Both wave gates green on this branch: `agentkit sync` idempotent (23→0, then 4→0),
  `agentkit check` clean, `agentkit verify` no invariant violations, `npm test` 70/70 then 75/75
  (true exit codes, no pipes). Acceptance greps: error-token eradication zero-hit; attestation
  sentence uniform in 13 files.
- Wrap gate (post version-roll, exact results recorded in the wrap commit): `agentkit sync` ×2,
  `agentkit check`, `npm test` re-run on the final tree state before fast-forwarding main.

KB consulted: none (kernel rule + governance/docs-standard read as working references).

## [2026-07-10] — v0.8.0

### Changed
- **`trigger: model-decision` rules → menu-hidden `rule-` skills on Claude (TICKET-10)** — the
  claude adapter now maps the rule taxonomy three ways: `always` → always-on `.claude/rules/`,
  `glob` → path-scoped (`paths:`), `model-decision` → description-gated skill at
  `.claude/skills/rule-<name>/` (hidden from the `/` menu, body loads only on invocation). In this
  repo the always-on rules footprint drops from 16 files (~75 KB ≈ 19K tokens/session) to 5 files
  (~15 KB) + 11 two-line descriptions. Old `.claude/rules/<name>.md` copies are pruned by sync
  (lockfile-owned). Other vendors unchanged (they fold rules into AGENTS.md/GEMINI.md text;
  antigravity reads `.agent/` natively). `rule-`/skill name collision is a sync error; a
  model-decision rule without `description:` warns (routing degraded to its name).
- **All 17 model-decision rule sources gained `description:`** in "Consult when …" trigger
  language — the routing surface on description-gated vendors (superset authoring, decision 17).
- **Per-command `model:` hints** — `quick-fix` and `backlog-status` workflows pin `model: haiku`
  (mechanical, fully bounded). Claude passes aliases through; opencode drops non-`provider/model`
  forms (guard added).

### Backlog
- `F-claude-subagents` filed in the feedback pool (provenance-stamped): dormant `.agent/agents/`
  surface as future junior-tier subagent candidates.

### Added
- **Workflow `skill:` pairing (TICKET-08)** — a workflow may declare its 1:1 implementation skill
  (`skill: implement-session-wrap-up`); the Claude adapter hides that skill from the `/` menu via
  `user-invocable: false` (verified 2026-07-09 against code.claude.com/docs/en/skills.md) while
  keeping it model-invocable. Typing `/wrap` now shows only `/wrap-up`, not both surfaces. Authored
  on 7 pure 1:1 workflows (onboard, wrap-up, quick-fix, refactor, test, prd, architect); dangling
  refs warn without blocking sync. Other vendors byte-identical (asserted in tests).

### Changed
- `stripFmTo` gained an optional `extra` param for vendor-injected frontmatter keys
  (`CLAUDE_HIDE_FROM_MENU` constant isolates the verified field name).
- `governance/best-practices.md` §Workflows documents `skill:`; vendor-capability-matrix records
  the verified invocation-control semantics (+ log entry).

### Added
- **Codification gate + feedback provenance (TICKET-09)** — codifying a learning is now a
  privileged act like integrating code (`pattern-agent-orchestration.md` §1): only senior/staff
  codifies; junior-produced or provenance-absent findings enter the feedback pool as `candidate`s
  and are adopted only after a cited senior/staff re-verification.
- **§3 completion report `producer` field** (tier the worker ran at + model id) — ninth required
  field; learnings in a report inherit this provenance (`worker-report` updated to match).
- **Feedback-pool intake format** — new entries in `docs/backlog/IDEA-*feedback*.md` below the
  `<!-- provenance-required-below -->` marker require a `**Provenance**: <tier> · <model> ·
  <T1|T2|T3> · <source>` line; legacy entries above the marker are exempt, never retro-tagged.
- **`unstamped-feedback` hygiene lint** — `checkHygiene` flags post-marker entries lacking the
  Provenance line (severity `flag`); test proves both the red and green paths.

### Changed
- **`optimize-agent` direct-write loophole closed** — Phase 3 now routes through `kit-contribute`
  (adopt/overlay/discard) instead of editing `.agent/` directly, with a below-senior tier guard
  that files a provenance-stamped candidate and stops.
- `kit-contribute` Phase 2 opens with the codification gate (step 0); DoD adds "no junior-produced
  learning adopted without a cited re-verification".

### Added
- **`blindspot-pass` skill** — pre-work reconnaissance of an unfamiliar code area/domain (landmines,
  hidden context, exemplars, expert questions → reframed request). Adapted from the
  `finding-unknowns-skills` set; routes distinctly from `project-onboard` (whole-repo) and
  `explore-concept` (undefined problem).
- **`reference-hunt` skill** — use existing/external source as the spec: extract semantics → validate
  → reimplement natively → map coverage. Routes distinctly from `pattern-feature-scaffolding`'s
  in-repo "Clone to Create".

### Changed
- **Folded 6 `finding-unknowns` techniques into existing skills** (no new files): change-likelihood
  plan ordering + explicit decision gates (`plan-feature`/`plan-architecture`); solo deviation ledger
  (`implement-feature`); "make options genuinely different" + name-the-rejected-requirement
  (`explore-ui-design`/`explore-concept`); one-question interview mode (`explore-concept`); reviewer
  buy-in package (`implement-session-wrap-up`); explain-it-simply complexity signal
  (`review-peer`/`vet-simple`).
- **Codified 6 fleet-feedback learnings into rules/skills:** cite-or-run now covers breadth/coverage
  claims + Windows-portable `tsc` heap form (`foundation-testing`); overlay-only authoring bar for
  rules naming concrete paths/env/framework idioms (`best-practices` + `overlay-contract`);
  registration-time config-invariant standard (`pattern-code-standards`); documented CLI-absent
  degraded path (`kit-contribute` + `implement-session-wrap-up`).
- **Generalized + renamed `tech-webgl` → `tech-canvas-rendering`** (tier `tech:webgl` → `tech:canvas`):
  now theme-aware canvas/GPU rendering (runtime token resolution + `--dataviz-*` override family,
  repaint on `data-theme`, feature-detect against the browserslist floor, shared pure geometry for
  renderer + hit-test). `STACK_MARKERS`: `webgl` → `canvas` **meta-pack** (no required marker, never
  flagged — a 2D-canvas project without a GPU lib isn't falsely warned).
  - **DOWNSTREAM MIGRATION:** projects declaring `stack: ["webgl"]` in `.agentkit.json` must switch to
    `["canvas"]` to keep receiving the rule (e.g. `proj-prompt`). The kit repo itself declares `stack: []`.

### Backlog
- Filed 6 `agentkit` CLI/tooling recommendations as `F-cli-*` findings in
  `docs/backlog/IDEA-post-v06-feedback.md` (P1: warn when the sibling kit is on a non-`main` branch).
  Not implemented — CLI engineering deferred.

### Deliberately did NOT do
- Kept overlay/project-specific items out of the kit: the `domain-openrouter.md` rewrite,
  `SPEC-canvas-viz-architecture.md`, the wheel/radar entity split, and the portfolio review findings.
- Did not implement the batch-2 CLI changes (filed as backlog). Did not touch downstream repos'
  `.agentkit.json` (separate repos — flagged above).

- **Workflows now reach OpenCode and Codex** — the `opencode` and `codex` adapters previously
  emitted skills only, so every `.agent/workflows/*.md` was silently dropped for those two tools
  (they saw no `/plan`, `/ship`, `/vet`, ...). OpenCode now gets workflows as native slash commands
  at `.opencode/commands/<name>.md` (verified live against opencode.ai/docs); Codex, which has no
  command surface, gets them as `wf-`prefixed skills at `.agents/skills/wf-<name>/` (the `wf-` prefix
  avoids colliding with a real skill of the same name, e.g. `vet-hard`). Claude/Gemini/Antigravity
  unchanged. Adds a shared `workflowAsSkill()` helper + 2 focused adapter tests and extends the golden
  test; `vendor-capability-matrix.md` corrected (OpenCode command surface was stale-❌).

### Verification (TICKET-08/09/10 session, branch `feat/agent-fable-claude-optimization`, commit d4c96d6)
Run earlier this session; no code changes since (only the docs-only ticket-closeout commit f43132c
and this changelog roll followed):
- `node agentkit.mjs sync . --dry-run` → 23 writes, 11 prunes, 0 refusals (inspected before executing)
- `node agentkit.mjs sync .` → wrote 23, pruned 11 · second run → wrote 0, pruned 0 (idempotent)
- `node agentkit.mjs check .` → "all tracked files in sync" · `check . --content` → "all cited
  paths/scripts/asset-names resolve"
- `node agentkit.mjs verify .` → 6 checks harvested from 2 active rules, no invariant violations (exit 0)
- `npm test` → `# tests 66 · # pass 66 · # fail 0` (exit 0 via PIPESTATUS; +8 tests: skill-pairing ×3,
  model-decision mapping ×3 incl. prune-path red-proof, hygiene unstamped-feedback red+green, opencode
  model guard)
- Pending human checks (tickets held at `needs-human-verify`): `/wrap` menu shows only `/wrap-up`;
  `/context` rules footprint; model invokes `rule-pattern-error-handling` on an error-handling task.

KB consulted: none under `docs/knowledge-base/` (governance consulted: `best-practices.md`,
`vendor-capability-matrix.md`, `docs-standard.md` via pattern-docs-artifacts).

## [2026-07-06] — v0.7.0: deterministic-guardrail hardening (proj-resume + proj-portal-b feedback)

Batched feedback from live parallel runs (proj-resume waves 1–2 + proj-portal-b A–F), decomposed
into 7 tickets. Through-line: **make orchestration guardrails deterministic (machine-checkable)
instead of narrative (skippable prose)** — the live failures were a worker that built its own gate
then modified production code to pass it, a wave scattered across branches with work uncommitted, and
a ticket left "open" whose fix had already merged.

### Added
- **`agentkit check --hygiene`** — first-class git-based hygiene check (T2): flags an open ticket
  citing a SHA already merged to the main branch (`git merge-base --is-ancestor`, exit 1),
  uncommitted `docs/`, and stale tickets past `thresholds.staleTicketDays`; fail-closed
  `could-not-determine` on unresolvable refs. `.agentkit.json` gains `thresholds.staleTicketDays`.
  (+5 tests → 54.)
- **`/ship` workflow** (`.agent/workflows/ship.md`, T6) — cold-start → closed-ticket for ONE ticket:
  light onboard + `check --kb` standards routing → execute **routed by ticket shape**
  (`implement-feature` / solo `worker-execute` loop / `implement-quick-fix`) → validate at done tier
  → **drift-proof closeout**. Renamed from the planned `execute-ticket`.
- **`**Reserves**` ticket field** (kernel §2, T4) — reserve scarce sequential values (migration
  numbers, enum values, ports) that workers cannot independently mint; partition allocates,
  merge-train re-checks.

### Changed
- **`foundation-testing.md` §1** (T3) — codified two portable concepts every consumer inherits:
  **cite-or-run** (any SHA/path/test-count must be verified first) and **red-proof** (to claim a gate
  works, trip it — paste failing then passing output).
- **Kernel** (`pattern-agent-orchestration.md`, T3/T4) — conflict-of-interest tier rule (a worker
  never grades its own gate at junior tier); gate-shaping disclosure line in the §3 report;
  diff-vs-`Files` + cite-or-run added to the §8 deterministic-gates catalog; `.orchestrator.lock`
  gitignore mandate (§6); filename rule now permits a single-writer stable **ID number**
  (`TICKET-37-<slug>.md`) — ID ≠ priority ordinal, R14's parallel-mint collision stays dead.
- **Status-of-record contract** (`pattern-docs-artifacts.md` + `governance/docs-standard.md`, T1) —
  status lives in exactly one place; README = forward index, CHANGELOG/archive = history; ID-number
  vs priority-ordinal codified; junior-pack sections inside a `TICKET-` file sanctioned.
- **`implement-session-wrap-up`** (T6) — Phase 5 now runs the **drift-proof closeout** shared by
  `/ship` and `/wrap-up`: flip `**Status**`→Done + cite SHA, fix every referencing doc, README-trim.
- **`worker-report`** (T3) — out-of-surface edits are a **hard fail** that blocks `reported`;
  gate-touching tickets require pasted red-proof; report carries the gate-shaping line (8 fields).
- **`handoff`** (T5) — test assertions emitted as literal `expect(...)` snippets; junior pack
  defaults to **in-place in the ticket** (PLAN-split is the exception); Phase 1 verifies
  environment-coupled literals (`VERIFY:`/`VERIFIED:`); red-proofs as per-gate checkboxes.
- **`worker-execute`** (cite-or-run mid-loop), **`worker-bootstrap`** (stale-base gate reaffirmed),
  **`orchestrate-decompose`/`-kickoff`/`-partition`/`-merge-train`** (tables cite exact filenames;
  machine-checkable base+branch preamble + portable ad-hoc snippet; Reserves allocation/re-check),
  **`review-raise-bar`** (Phase 1 "map where the work lives" recon), **`audit-hygiene-enforcement`**
  (made detect-only per its contract; `2026-MM` hardcode removed; drift heuristics added).
- **`.gitignore`** — kit now ignores `.orchestrator.lock`, `.claude/worktrees/`,
  `.claude/settings.local.json` (dogfoods the §6 rule; closes backlog item **F-gitignore**).

### Verification
- `npm test` — 54/54 pass (5 new hygiene tests: merged-but-open flags/passes, uncommitted-docs,
  stale-ticket, fail-closed could-not-determine).
- `agentkit check .` — all tracked files in sync; `agentkit verify .` — no invariant violations.

KB consulted: governance/docs-standard.md; .agent/rules/pattern-agent-orchestration.md; foundation-testing.md

## [2026-07-05] — Default tool baseline: codebase-mcp + fallow for every new project

`codebase-mcp` and `fallow` were opt-in per project (`.agentkit.json` `tools`). In practice every
project that reached for either ended up wanting both, so opt-in just meant new projects silently
missed the fleet's actual working baseline. Now the default.

### Changed
- **`agentkit.mjs` `initProject`** — `tools` defaults to `["codebase-mcp", "fallow"]` for every
  greenfield `agentkit init`, instead of `[]`.
- **`governance/migration-checklist.md`** — Step 1 states the same default for projects onboarded
  manually; drop an entry only when genuinely inapplicable (e.g. `fallow` with no JS/TS to scan).
- **`docs/working/TICKET-reconcile-fleet-v052.md`** — Step 2 gained a conformance check: confirm
  both tools are declared and `doctor --project` reports them callable, since existing projects
  predate this default and won't get it injected silently by `sync`.
- **`integrations/fallow.md`**, **`integrations/codebase-mcp.md`** — each notes the new default in
  its provision section.

### Added
- **`governance/DECISION-default-tool-baseline.md`** — records the decision, why opt-in wasn't
  serving the fleet, and the revisit trigger (a stack with no legitimate use for one of the two).

### Verification
- `node --test agentkit.test.mjs` — 49/49 (no CLI logic changed beyond the one default value).
- `agentkit check --taxonomy .` — clean. `agentkit check --content .` — 0 phantoms.

KB consulted: `governance/docs-standard.md`, `governance/migration-checklist.md`

## [2026-07-05] — v0.6.0 — Orchestration + tooling hardening (batched fleet feedback)

The full pooled feedback from live parallel runs (portal, proj-resume, proj-web-a-web, proj-prompt, proj-portfolio)
in one batch — orchestration **R1–R15** + taxonomy/docs **D1–D3 + T1** (see
`docs/working/PLAN-v06-orchestration-and-tooling-hardening.md`). Theme: **the deterministic gate carries
it, never the model's judgment**, and honesty is symmetric — never trust an unverified "ready/green"
from any source, including your own. Skills authored by a four-way fable-5 fan-out on disjoint files
(each `check --content`-clean); kernel §2/§4 + CLI by the main session.

### Kernel contract (`pattern-agent-orchestration.md`)
- **`**Verify**` mode axis** (`machine|browser|real-device|staging`), orthogonal to `**Agent Tier**` —
  how a ticket's done-ness is *proven*, declared at decompose so `needs-human-verify` is set up front (R5).
- **`**Complexity-note**`** field — flags coupling the LOC/globs hide (a vendored/transplant *rewrite*,
  not a copy) so sequencing tiers from coupling, not text (R4).
- **Slug-only ticket names** — `TICKET-<slug>-<tier>.md`, no numeric counter two parallel agents can
  both grab (R14). **Per-run roster override** (R11). **`changelog.d/` convention** (R13).

### CLI (`agentkit.mjs`, +3 tests → 49)
- **`agentkit changelog-roll`** — assembles `changelog.d/<slug>.md` fragments into one dated
  `CHANGELOG.md` section and deletes them. Each lane writes its own fragment → a multi-lane merge train
  is **conflict-free** on the changelog (its sole guaranteed conflict) (R13).
- **`check --taxonomy` is now store-aware (D1)** — a valid prefix in the wrong store (a `RESEARCH-` in
  `docs/working/`, a `SPEC-` outside the KB) is flagged; existence-only was passing it.
- **`check --taxonomy` index-integrity (D2)** — a README trigger-table entry naming a doc that exists
  nowhere (renamed away) is flagged; `check --content` can't see backtick-quoted table text.

### Skills (fable-5)
- **worker-bootstrap:** stale-base HARD gate (assert declared files exist on the base + `merge-base
  --is-ancestor`; heal or STOP "stale base") (R12); baseline-green as a blocking "environment not green"
  stop (R1); characterization-tests-first for transplants (R6).
- **worker-report:** read the true exit code, never a `| tail`-masked number (R7); "pre-existing" claims
  rejected unless proven against `origin/main` (R2).
- **orchestrate-sequence:** Phase 2.5 extract a runnable slice into its own ticket (R8); clean-tree gate
  binds at kickoff, not a planning pass (R9); verify the integration base exists (R10); consume roster
  override (R11).
- **orchestrate-decompose:** slug-only names (R14); Complexity-note + transplant source-probe (R4);
  declare `**Verify**` mode (R5).
- **orchestrate-kickoff:** pass the resolved integration-base SHA to each worker (R12); characterization-
  first (R6); roster override (R11).
- **orchestrate-merge-train:** true-exit-code gate (R7); `changelog-roll` assembly as a train-level
  close-out (R13).
- **tooling:** wrap-up flags untracked `docs/` (R15); `use-codegraph` asserts index freshness / falls
  back to grep explicitly (T1); `audit-docs` status-drift check + post-rename README verify (D3/D2).
- **`foundation-testing.md`:** the `| tail` exit-code-masking mechanic now codified in the gate rule (R7).

### Verification
- `node agentkit.test.mjs` — **49/49** (+3: D1 store-aware, D2 index-integrity, R13 changelog-roll).
- `check --content` 0 phantoms; `check --taxonomy` clean; self-sync in sync at v0.6.0.


---

Older entries (2026-07-03 → 2026-07-05, v0.1.0 – v0.5.3) are archived in
`docs/archive/2026-07/CHANGELOG-2026-07-03-to-05.md`.
