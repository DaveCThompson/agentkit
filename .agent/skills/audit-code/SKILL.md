---
name: audit-code
description: Technical code review for architecture, type safety, and patterns. Use for pre-merge review or code quality audit.
tier: core
---

# Audit Code

Multi-perspective review: Architect + QA perspectives with Red Team mindset.

## When NOT to Use
This skill *diagnoses* code quality — it reports, it does not change code. Route elsewhere when:
- You want the issues fixed in place, not just reported → `refine-code` (small polish) or `implement-refactor` (structural change from a plan).
- You're inventorying tech debt / smells to plan a refactor sprint → `audit-refactor-opportunities`.
- The change is high-stakes (auth, payments, data integrity) and needs an adversarial threat model → `vet-hard`.
- You're reviewing a *plan or architecture* before code exists → `vet-simple`.
- The goal is to review another agent's branch **and raise it to repo standard** (ending in repaired work) → `review-raise-bar`.

## Step 1: Project Invariants
**Before auditing**, check `.agent/rules/`:
- `AGENTS.md` — code patterns and prohibitions
- `*.md` — behavioral rules
- the project's architecture-and-stack overview (under `docs/knowledge-base/overview/`) — project boundaries, feature isolation, core-kernel dependency direction.
- Flag invariant violations as **Critical**.

## Step 2: Technical Review (Architect)
- [ ] Architectural soundness
- [ ] Dependency hygiene
- [ ] Type safety (`as any`, missing guards)
- [ ] Pattern adherence
- [ ] Core-kernel direction: production files in the project's core/kernel layer must not import domain slices. The concrete kernel path and the domain-slice list live in `project-invariants.md` (or a `domain-*` rule).
- [ ] Feature isolation: feature slices should not import sibling feature internals unless the dependency has been promoted to a shared layer.

## Step 3: QA Review
- [ ] Edge cases: loading, empty, error states
- [ ] Error handling coverage
- [ ] Accessibility: keyboard, screen reader
- [ ] Testability

## Step 4: Prioritize

**Priority Levels**:
- **Critical (9-10)** — Crashes, data loss, security vulnerabilities.
- **High (7-8)** — Breaks primary functionality or violates core invariants.
- **Medium (4-6)** — Inconsistent UI, minor tech debt, or non-blocking bugs.
- **Low (1-3)** — Stylistic issues, typos, or cosmetic improvements.

## Step 5: Meta-Analysis
If multiple low-priority findings cluster → identify systemic issue.

## Constraints
- Cite evidence: "@filename:line"
- Reference rules: "Violates AGENTS.md line X"
- Do not auto-fix — report and await decision
- Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.

## Output
Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.
```markdown
## Critical
- [Finding] @file:line — Violates [Rule]
## Systemic Issues
- [Pattern across findings]
```
