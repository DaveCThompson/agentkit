---
name: audit-rubric
description: The 10-dimension scoring rubric every Phase-A project audit uses. Evidence required for every score.
last-verified: 2026-07-03
---

# Audit Rubric — 10 dimensions, 0–3, evidence required

Every dimension is scored 0–3 **with cited evidence** (file paths, counts, quotes). A score without
evidence is invalid. Anchors below show a worked 1 vs 3 so parallel graders score against the same
scale. Scores are re-normalized by the synthesis pass — grade against the anchors, not your gut
calibration.

**Evidence tiers** (cite one per claim): **T1** = measured (file exists, count, hash, git date) ·
**T2** = observed behavior (a skill demonstrably fired/failed) · **T3** = judgment call (flag it as
such). Pure-hypothesis claims are rejected in the canonical kit.

## 1. Wiring integrity (the #1 risk)
Junction vs materialized copy vs real files; vendor↔`.agent` drift.
- **1:** vendor dirs are cloud-synced-materialized junction copies; ≥10 files differ between `.agent/`
  and a vendor mirror with no record of which is newer.
- **3:** all vendor dirs are real files, byte-identical to `.agent/` (or intentionally transformed),
  and nothing depends on links.
Report: per vendor dir — real/junction/materialized, count of files differing from `.agent/`.

## 2. Skills quality
Orthogonality, pushy trigger descriptions, definition-of-done, no naming drift.
- **1:** several skills answer the same prompt (`security` + `security-fix`); descriptions are
  passive ("helps with X"); no DoD sections.
- **3:** each skill names WHEN it fires and what done means; no two skills claim the same trigger; a
  routing test on ambiguous prompts would pick one winner.

## 3. Rules coverage
Valid prefixes (`foundation- / tech- / pattern- / project- / domain-`), activation frontmatter,
`git-protocol.md` present, no unforked "(Base Template)" tags.
- **1:** unprefixed grab-bag rules, no activation frontmatter, template placeholders still present.
- **3:** every rule prefixed + frontmatter-activated (always/glob/model-decision), git-protocol
  present and project-accurate.

## 4. Workflows
True orchestration vs single-skill passthrough; not empty.
- **1:** workflows are one-liners that restate a skill ("run the plan skill").
- **3:** workflows sequence 2+ skills with decision points, inputs required, and exit criteria.

## 5. Docs governance
Four-dir model (`docs/{knowledge-base,working,backlog,archive/YYYY-MM}`), per-subdir README indexes,
KB purity, taxonomy prefixes.
- **1:** KB mixes raw research corpora with contracts; no README indexes; loose files at docs root.
- **3:** four dirs enforced, every subdir has an index README, KB holds only durable truth with
  `SPEC-/PRD-/STRATEGY-/RUNBOOK-` prefixes.

## 6. CHANGELOG hygiene
Rolled/archived, single dialect, size.
- **1:** 2000+ lines, multiple entry formats, never archived.
- **3:** lean current file, one dialect, archived monthly under `docs/archive/YYYY-MM/`.

## 7. AGENTS.md substance
Entrypoint with invariants + context-load order, not a bare pointer.
- **1:** three lines pointing at `.agent/` with no invariants.
- **3:** states project posture, non-negotiable invariants, what to read in what order, and how
  vendors map onto `.agent/`.

## 8. Vendor parity
claude/codex/gemini/opencode exposure consistent + natively correct.
- **1:** vendors have stale or missing mirrors; Codex skills in a dir Codex never reads.
- **3:** every enabled vendor sees the same current skill set through its documented native surface.

## 9. Self-maintenance & tool-leverage
`health-agent`/`pattern-codify` present; skills actually lean on Codebase MCP for comprehension +
Fallow for duplicate-checks; declared tools provisioned.
- **1:** no health/codify machinery; `use-codegraph` exists but nothing references it; Fallow
  installed but never cited by a skill.
- **3:** session-end codify path exists; plan/implement skills name the tools they use and those
  tools are provisioned and callable.

## 10. Structural simplicity (scored INVERSELY)
Needless folders, deep nesting, grab-bag directories LOWER the score. Many well-scoped skills do NOT.
- **1:** nested skill trees (`skills/audit/accessibility/`), per-vendor content forks, `misc/` dirs.
- **3:** flat `skills/<name>/`, flat rules/workflows with prefixes, no directory that exists "just
  in case". 56 flat skills is fine; 3 nesting levels is not.

## Rubric-enforced rules
- Every "add" proposed by an audit must cite ≥1 concrete project need + an evidence tier.
- Every proposed folder/nesting level must justify why a flat file with a prefix wouldn't do.
- Every audit artifact ends with a **"What we deliberately did NOT do"** section.
