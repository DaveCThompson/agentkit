---
name: migration-checklist
description: The per-project Phase-E migration procedure — preconditions, steps, verification, rollback. Copy-based rewrite of a predecessor kit/specs/migration-checklist.md.
last-verified: 2026-07-03
---

# Migration Checklist (Phase E, per project)

*Supersedes `a predecessor kit/specs/migration-checklist.md`. Executors follow this mechanically; safety
lives in the CLI's guards and git tags, not the executor's judgment.*

## Preconditions (hard gate — do not start otherwise)
- [ ] Clean `git status` in the target project (commit or stash everything).
- [ ] Pre-migration tag pushed: `git tag pre-agentkit-$(date +%Y%m%d)` — this is the rollback path.
- [ ] `agentkit inventory` re-run since the Phase-A snapshot; any file that moved re-adjudicated.
- [ ] Kit tests green (`npm test` in the kit repo).

## Steps
1. Write `.agentkit.json`: vendors actually used, `stack` (drives tech packs), overlay globs for
   genuine project content (`domain-*`, `project-*`, plus anything the audit flagged), and
   **`sourceRoots`** — the array of real source directories this repo uses (e.g. `["src"]`,
   `["app","components","lib"]`, `["apps","packages"]`). The content-integrity guard and `verify-rules`
   read it as the single scan scope, so a non-`src/` layout is neither under-scanned nor false-flagged
   (defaults to a broad set when omitted). Mirror the same roots into
   `.agent/rules/project-invariants.md` (copy from `templates/project-invariants.md`) — the file
   kit-core rules delegate their concrete paths to.
   - **Claim every project-owned file explicitly.** Any `.agent/` file the project keeps that is NOT
     matched by an overlay glob (`domain-*`, `project-*`) MUST be named in `.agentkit.json`
     `overlay.rules`/`overlay.skills` (e.g. a custom `foundation-responsive` rule, a bespoke skill).
     A file that survives sync only because the kit happens not to ship it is **fragile** — the day
     the kit adopts that name, `sync --force` would treat the project's copy as an orphaned core file
     and prune/overwrite it. "Surviving by absence" is not a claim; list it.
   - **`tools`** — `agentkit init` starts every project with `["codebase-mcp", "fallow"]`
     (`governance/DECISION-default-tool-baseline.md`), as a recommendation to evaluate, not a fixed
     requirement. Drop `fallow` if there's no real JS/TS surface to scan; drop `codebase-mcp` if the
     codebase is small enough that Grep/Read already comprehend it without a graph. Keep what
     genuinely earns its keep on this project.
2. `agentkit sync <project> --dry-run` — review the incoming diff. Expected on first migration:
   mass UNTRACKED-DIFFERS refusals (pre-migration content is not lock-tracked yet).
3. Reconcile: files whose project variant should win → `agentkit adopt` them into the kit FIRST
   (or park with `--defer`); files where the kit wins → proceed.
4. `agentkit sync <project> --force` (safe: step 0 tagged everything; every change is one
   `git diff` away from review and one `git reset --hard <tag>` from rollback).
5. Delete now-orphaned legacy vendor files the lock never owned (old `.gemini/skills/` bulk
   mirrors, `.codex/skills/`), guided by the audit's wiring report — commit separately.
6. `agentkit check <project>` → expect zero unexplained drift.
7. Provision declared tools per `integrations/` registry; `agentkit doctor` → tool callability OK.
8. Run the project's `/verify-standard` (or equivalent smoke) — the agent surfaces still route.
9. Record before/after in `reports/migration-<project>.md`: file counts per surface, drift counts,
   refusals and how each was resolved, tool provisioning done.
10. Commit `.agentkit.json` + `.agentkit.lock` + generated surfaces; keep the pre-migration tag.

## Rollback
`git reset --hard <pre-migration-tag>` (project is fully self-contained — the kit holds no project
state beyond the flowback queue).

## Wave rules
Pilot: one project. Wave 2: 2–3 projects. Wave 3: the remaining app-shape projects. Bespoke:
any monorepo / sanctioned-layout outlier (see `docs-standard.md` §g), migrated on its own plan.
**Verification gate between waves** — a wave starts only when the previous wave's projects all pass
step 6–8. (The concrete roster and sequencing live in your local `fleet.json`, not here.)
