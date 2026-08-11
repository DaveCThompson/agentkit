---
description: Universal audit router. Run a scoped or full, scan-only health audit citing rule/invariant violations.
---

# Audit Workflow

Universal audit router — verifies system health by routing a scope to the matching scan-only
`audit-*` skill, or running the full sequential sweep. **Scan-only: never auto-fix here.**

## Goal
A prioritized findings report citing specific rule/invariant violations, severity-ranked.

## Inputs required (ask if missing)
- Target scope (see routing table). Default: `code`.
- Target files/directories (optional; default = whole project).

## Skill routing (explicit) — choose exactly one
- `accessibility` -> `audit-accessibility`
- `code` -> `audit-code`
- `design` -> `audit-design-system`
- `layout` -> `audit-layout`
- `typography` -> `audit-typography`
- `performance` -> `audit-performance`
- `security` -> `audit-security`
- `web` / `web-interface` -> `audit-web-interface`
- `docs` -> `audit-docs`
- `refactor` -> `audit-refactor-opportunities`
- `rules` / `invariants` -> `verify-rules`
- `maintenance` / `hygiene` -> `audit-hygiene-enforcement`
- `structure` / `dx` -> `audit-code` using the code-standards rule as the primary checklist
- `full` / `all` -> **Full sweep** (below)
- else -> `audit-code` (default)

## Full sweep (scope = full)
Run sequentially, then synthesize: `audit-code` -> `audit-design-system` -> `audit-layout` ->
`audit-typography` -> `audit-web-interface`. Identify shared root causes across dimensions.

## Procedure
1. **Reconnaissance**: Identify scope; load the relevant rules from `.agent/rules/`.
2. **Execute**: Read the selected skill's `SKILL.md` and follow its checklist exactly.
3. **Synthesis**: Categorize findings by severity (Critical / High / Medium / Low). For a full
   sweep, consolidate all dimensions into one report.
4. **Report**: Persist to `docs/working/REVIEW-*.md` when a durable artifact is useful.
   Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.
   Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.

## Notes
- This router absorbs the per-dimension audit commands — there are no `audit-<dimension>` workflows.
- To *remediate* (not just detect), route to the `*-fix` skills (e.g. `security-fix`,
  `performance-fix`) or the `/async-maint` jobs. Use `/audit rules` as the alias for invariant checks.
