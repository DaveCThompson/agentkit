---
description: Scale-evaluate a request, then produce an approved implementation plan (feature or architecture).
---

# Plan Workflow

Turn a feature request into an approved, phased implementation plan — after bouncing anything too
small to `/quick-fix`.

## Goal
An approved plan in `docs/working/` (e.g. `TICKET-{name}.md`) with phased steps and a verification
plan.

## Inputs required (ask if missing)
- Feature request or approved PRD.
- Affected files/components (identify during recon).

## Safety + scope
- **Scale Evaluator**: If the task is clearly ≤30 lines / ≤5 files, **STOP** and suggest `/quick-fix`.
- Do NOT start implementing before plan approval.
- Only touch: `docs/working/` (prefixed with `TICKET-`).

## Skill routing (explicit)
- `plan-feature` — default, for medium-scope features (1–5 files).
- `plan-architecture` — if the feature needs new data models, complex state, or cross-cutting change.
  For large epics needing full UX specification, start with `/prd` instead.

## Procedure
1. **Reconnaissance**: Read the selected skill's `SKILL.md`; locate affected files via search.
2. **Design-token gate** (if the project ships a design system): map any primitive token to its
   semantic equivalent per `.agent/rules/foundation-design-tokens.md` before locking the plan.
3. **Options**: Evaluate 2–3 approaches with brief trade-offs.
4. **Draft**: Write the plan to `docs/working/TICKET-{name}.md` with phases + a verification plan.
5. **Review**: Notify the user and request approval.

## Notes
- After approval, proceed to `/build`.
