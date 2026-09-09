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
**Before auditing**, read the project entrypoint and applicable rules:
- Root `AGENTS.md` — code patterns and prohibitions
- Relevant `.agent/rules/` files — behavioral rules
- the project's architecture-and-stack overview (under `docs/knowledge-base/overview/`) — project boundaries, feature isolation, core-kernel dependency direction.
- Record applicable invariant violations and their blocking policy separately from impact severity.

## Step 2: Technical Review (Architect)

Identify the base/target state and reviewed diff, separating concurrent edits. Trace the changed
behavior through affected callers, the main success path and a material failure path. Compare
actual behavior with the accepted outcome and exclusions. Inspect whether tests exercise that
contract, including boundary conditions and material fixture/oracle changes; use
`foundation-testing.md` for evidence validity and conditional proof. A green suite alone does not
establish that the changed behavior was tested.

- [ ] Architectural soundness
- [ ] Dependency hygiene
- [ ] Type safety (`as any`, missing guards)
- [ ] Pattern adherence
- [ ] Core-kernel direction: production files in the project's core/kernel layer must not import domain slices. The concrete kernel path and the domain-slice list live in `project-invariants.md` (or a `domain-*` rule).
- [ ] Feature isolation: feature slices should not import sibling feature internals unless the dependency has been promoted to a shared layer.

## Step 3: QA Review
- [ ] Edge cases: loading, empty, error states
- [ ] Error handling coverage
- [ ] Accessibility: keyboard, screen reader when the target has a user interface
- [ ] Testability

## Step 4: Prioritize

**Priority Levels**:
- **Critical** — Severe reachable security impact, data loss or widespread task failure.
- **High** — Broken primary functionality or a major failure with limited workaround.
- **Medium** — Bounded defects or material maintenance risk.
- **Low** — Minor consistency or clarity issue with a concrete consequence.

Explain impact rather than assigning a numeric score. Preserve mandatory gates even when impact
is small; record any explicit waiver separately.

## Step 5: Meta-Analysis
If multiple low-priority findings cluster → identify systemic issue.

## Constraints
- Cite evidence: "@filename:line"
- Reference rules: "Violates AGENTS.md line X"
- Do not auto-fix. Return findings; continue repair only when the caller has authorized that scope.
- Keep necessary redacted evidence in the caller's approved location and cite its identity.

## Output
Each selected lens is `finding | checked-clean | not-applicable | not-verified`, with scope and
reason. Name the missing check and owner for incomplete proof. Zero findings is valid.
```markdown
## Findings
- [Impact severity] [Finding] @file:line — [behavior/evidence, applicable rule and blocking policy]
## Coverage
- [Checked scope, actual result, limitations and next owner]
```
