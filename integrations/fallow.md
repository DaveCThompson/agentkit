---
name: fallow
description: Fallow — duplicate/dead-code and code-health scanner. The "reuse before you add" check before writing new code.
check-command: npx --no-install fallow --version
doc-urls: https://www.npmjs.com/package/fallow
last-verified: 2026-07-03
---

# Fallow

**What it is:** a project-local CLI (verified `fallow 2.102.0`, signed) that analyses
TypeScript/JavaScript for unused code, circular dependencies, code duplication, complexity hotspots,
and architecture boundary violations. It is the fleet's "reuse before you add" gate — the mechanical
check that stops a utility/component being re-implemented and stops an "unused" symbol being deleted
on a hunch.

Real subcommands (from `fallow --help`, verified):
- **Analysis:** `dead-code`, `dupes`, `health`, `flags`, `security` (opt-in), `audit`
  (alias `review`; scoped to changed files, returns pass/warn/fail).
- **Workflow:** `watch`, `fix` (auto-fix safe unused-code findings).
- **Inspection:** `list`, `inspect`, `workspaces`, `explain`, `impact`.
- **Setup/CI:** `init`, `migrate`, `config`, `hooks`, `ci`, `ci-template`, `schema`.
- With no subcommand, `fallow` runs `dead-code` + `dupes` + `health` together.

The `--help` output ships its own agent playbook — cite it verbatim in skills:

| When the agent is about to… | Command |
|---|---|
| delete an "unused" export or file | `fallow dead-code --trace <file>:<export>` |
| delete an "unused" dependency | `fallow dead-code --trace-dependency <name>` |
| commit or open a PR | `fallow audit --base <ref>` |
| prioritize refactoring | `fallow health --hotspots --targets` |
| consolidate duplication | `fallow dupes --trace dup:<fingerprint>` |
| inspect a target before editing | `fallow inspect --file <path>` (or `--symbol <FILE:EXPORT>`) |

**Install / provision (per project):** `npm i -D fallow` — it is a devDependency, not global (verified
resolving `fallow 2.102.0`). Always invoke as `npx --no-install fallow …` so a missing dependency
fails fast instead of silently downloading.
Phase E provisions it in any managed project that declares `"tools": ["fallow"]` but lacks the
devDependency. `"fallow"` is `agentkit init`'s starting recommendation for every new project
(`governance/DECISION-default-tool-baseline.md`) — drop it if the repo has no real JS/TS surface
to analyze; don't keep it declared just because it's the default. `agentkit init` also scaffolds a
starter `.fallowrc.jsonc` with the noise-suppression levers below pre-wired (never overwriting an
existing `.fallowrc*`).

**How to use it well (skills that declare `required-tools: [fallow]`):**
- **plan / before writing new code:** `npx --no-install fallow dupes --skip-local` (cross-directory
  clones) so a helper isn't re-implemented; tune signal with `--min-tokens` / `--mode semantic`.
- **before deleting "dead" code:** never trust a first-pass read — `fallow dead-code --trace
  <file>:<export>` or `--trace-dependency <name>` proves reachability.
- **refactor / sweep:** `fallow health --hotspots --targets` picks refactor targets with evidence
  (complexity/churn), and `fallow dupes` finds consolidation candidates.
- **before editing a target:** `fallow inspect --file <path>` bundles the evidence you need first.
- **pre-commit / review gate:** `fallow audit --base <ref>` returns pass/warn/fail scoped to changed
  files (the `review` alias + `--brief` always exits 0 for orientation).

**Noise suppression (config-only) — quieting an honest scan without hiding signal.** The first real
`.fallowrc.jsonc` on a mature repo can surface hundreds of known-benign findings at once (a live
case saw a default config treat ~700/704 files as plugin entry points and report a false-clean 0;
the honest config then surfaced 337 dead-code findings + 112 duplication locations in one scan). Quiet that with config levers — no source edits, no `fallow fix`:
- `"ignoreExportsUsedInFile": true` — clears the "demote to non-exported, never delete" class
  (exports also consumed inside their own file). This aligns the scanner with the deletion-hygiene
  invariant instead of leaving that class to manual triage (~90 findings in the live case).
- `ignoreExports` by **explicit name, never `"*"`** — for test-only exports in vendored
  (byte-verbatim) code that production-mode dead-code analysis can't see as used. Contract: each
  name needs a cite-or-run verified test importer before it's added; fallow's default
  `stale-suppressions: warn` then keeps the list honest over time. The suppression work doubles as
  discovery — in the live case only 2 of 5 flagged exports had real test importers; the other 3
  were genuinely dead vendored surface a blanket ignore would have buried forever.
- `duplicates.ignore` for fixture/dev-data paths and vendored files — fixtures repeat literal
  shapes on purpose (readability over DRY), and vendored-file duplication is upstream's to fix
  (one fixtures file held 49 of the 112 dup locations).

**Suppression-change invariant:** after any suppression-only config change, the unused-file count
must be byte-identical before and after (live case: 27 → 27) — the cheap proof that no real signal
got hidden. Suppression-only changes still run the every-change gate tier
(`foundation-testing.md` §1).

**Fallback when unreachable:** search for existing implementations with the code graph
(`search_graph` / `search_code`) or Grep before adding any new utility, and state in the plan that the
duplicate check was performed manually.

**`agentkit doctor` callability bar:** fallow is "reachable" for a project when
`npx --no-install fallow --version` exits 0 (the local devDependency resolves and its signed native
binary verifies). A `required-tools: [fallow]` skill in a project without the devDependency is broken.

**Skills that depend on it:** `plan-feature`, `plan-architecture`, `implement-refactor` (and,
recommended, `sweep-codebase` / `audit-refactor-opportunities`).
