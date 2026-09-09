---
description: Produce a right-sized implementation plan while preserving the accepted work contract.
---

# Plan Workflow

Resolve the desired outcome, existing artifact, accepted decisions, exclusions and authority.
Choose depth by uncertainty, coupling, consequences and reversibility, not line or file counts.

- Use `plan-feature` for a well-understood change with bounded dependencies.
- Use `plan-architecture` for consequential technical boundaries, data models or cross-system design.
- Use `plan-prd` only when the user problem or interaction/state model still needs definition.
- Use the relevant `explore-*` skill for an unresolved question before committing to an option.

A small task may need only a brief plan. Do not reject a planning request because it could fit
`implement-quick-fix`. Reuse the caller's PLAN, ARCH, PRD, ticket or linked contract, including its
identity and revision. Record assumptions as assumptions and acceptance as observable outcomes.

Return the plan and consequential unresolved decisions. A planning-only request stops at the plan.
If implementation was already authorized and no decision expands that grant, continue through the
appropriate implementation route without demanding redundant approval or an exact sign-off phrase.
