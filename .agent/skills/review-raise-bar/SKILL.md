---
name: review-raise-bar
description: Raise below-standard work — typically a junior or cheaper-model agent's branch — to repo standard by directly fixing code, docs, validation, and workflow drift. Use when the review should end in repaired, higher-standard work rather than critique-only. For senior-to-senior verdict-first review use review-peer. Create or upgrade implementation plans only when the user explicitly asks for a plan or when a real blocker makes direct fixes unsafe or impossible.
tier: core
---

# Review Raise Bar

Turn "good enough" agent output into branch-quality work that matches the repo's DX, UX, and documentation standards.

## When to Use

- The user asks you to review work done by another agent and improve it
- A vet, audit, review, or implementation exists, but the real goal is to bring the branch up to repo standard
- Another agent's work is partially right but still needs direct fixes, cleanup, validation, and sharper judgment
- The user wants the review to end in repaired work, not just commentary
- The user explicitly asks for a plan in addition to the review

## When NOT to Use
This skill reviews **and directly repairs** a branch to repo standard — it ends in changed code, not a report. Route elsewhere when:
- The author is a capable peer and you owe them verdicts, not rework → `review-peer`.
- You want critique only, with no code changes → `audit-code`, `vet-simple`, or `vet-hard`.
- The task is a small in-place cleanup with no review scope → `refine-code`.
- You're inventorying tech debt to plan later → `audit-refactor-opportunities`.

## Inputs

- Existing artifacts to review:
  - `docs/working/REVIEW-*.md`
  - `docs/working/TICKET-*.md`
  - code changed by another agent
- Optional:
  - a request to produce or strengthen an implementation plan in `docs/working/`

## Quick Reference

- Project truth:
  - `docs/working/README.md`
  - a branch-state compatibility shim under `docs/working/`, if the project keeps one
  - `.agent/rules/pattern-docs-artifacts.md`
  - `.agent/rules/pattern-code-standards.md`
- Use relevant domain standards based on the work:
  - layout/UI: `docs/knowledge-base/specs/*.md`
  - design system/tokens: `.agent/rules/foundation-*.md`
  - docs hygiene: `docs/working/README.md`

## Approach

## Default Posture

Treat this skill as an execution-first review workflow.

Default behavior:
- inspect the real code and docs
- identify what is wrong or incomplete
- fix the problems directly
- run validation
- update docs so branch truth stays accurate

Do **not** stop at findings if the problems can be repaired safely in the current turn.

Only switch into plan-writing mode when:
- the user explicitly asks for a plan or handoff
- the work is too large or risky to complete truthfully in the current turn
- a hidden dependency, approval boundary, or product decision blocks direct repair

If a plan is needed, make that an exception, not the default output.

### Phase 1: Recon and Standards Loading

1. **Map where the work lives before reading any code.** For multi-agent output (scattered across branches or uncommitted trees), run `git branch -vv`, per-branch `git log --oneline -10`, and `git status --short` to locate every context where work exists. Only after the work is located does code review begin.
2. Identify the artifacts and files produced by the other agent.
3. Load the live branch index first, then the compatibility shim only if needed.
4. Load only the standards that materially apply to the reviewed work.
5. Build an evidence list from the actual repo, not just from the other agent's summary.

### Phase 2: Multi-Lens Review

Review the work through these lenses:

1. **DX**
   - Does it follow `.agent/rules/pattern-code-standards.md`?
   - Is the plan executable without hidden assumptions?
   - Are file targets, milestones, and verification steps concrete?
2. **UI**
   - Does it preserve the established visual system?
   - Does it respect layout, token, and containment rules?
3. **UX**
   - Are interaction recommendations discoverable, accessible, and realistic on the target devices?
   - Is the sequencing right, or are blockers/polish mixed together?
4. **Docs**
   - Are artifacts in the right locations and named correctly?
   - Is the documentation truthful, non-duplicative, and source-of-truth aligned?
5. **Scope**
   - Is the proposed work right-sized?
   - Are non-goals, phase boundaries, and acceptance criteria explicit?

Use these lenses to decide what must be fixed now, what can stay, and what needs stronger constraints before calling the work done.

### Phase 3: Judgment, Not Rubber-Stamping

For major findings from the reviewed work, classify them as:

- **Adopt** — correct and should remain
- **Adapt** — directionally right, but needs stronger constraints, scope, or evidence
- **Reject** — not justified by the codebase, standards, or user goals

Do not blindly preserve prior recommendations just because they are written down.

### Phase 4: Direct Upgrades

Update the work directly where there is merit:

- fix the code, styles, tests, validation, and docs that are below standard
- strengthen the reasoning
- remove drift or duplicated guidance
- add missing acceptance criteria
- add explicit verification
- fix artifact naming/location issues
- tighten scope and sequencing

If code or docs are weak in a way that blocks truthful planning, fix the blocker rather than describing it abstractly.

When reviewing implementation work, prefer this order:

1. repair the product or code regressions
2. repair validation and tests
3. repair docs and branch-truth drift
4. only then write a review artifact if it helps preserve truth or explain unresolved risk

### Phase 5: Plan Only When Needed

When the user explicitly asks for a detailed implementation plan, or when direct execution is blocked, create or upgrade a `docs/working/TICKET-*.md` that includes:

1. Goal and source artifacts
2. Clear guardrails and non-goals
3. Ordered milestones/phases
4. Exact files or file groups to inspect/change
5. "Do not do" warnings for each risky slice
6. A definition of **done really well**
7. A verification matrix with:
   - commands
   - manual checks
   - breakpoint/device checks where relevant

The plan must be executable by a junior developer without requiring mind-reading.

### Phase 6: Wrap-Up

Finish the work instead of leaving it hanging.

- If implementation or substantial artifact changes were made, route to the session wrap-up protocol.
- If the work is docs-only, still end with an honest mini wrap-up:
  - what was updated
  - what was not verified
  - what the next command/workflow should be

## Reflexion

Before finishing, verify:

- Did I review the actual code/docs, not just the prior agent's prose?
- Did I fix what I reasonably could instead of only critiquing it?
- If I wrote a plan, was it truly necessary?
- Would the branch be meaningfully stronger after my pass, not just better-described?
- Did I preserve the repo's source-of-truth model and artifact naming rules?
- If I recommended wrap-up, is the validation claim honest?

## Constraints

- Do not create duplicate "summary" docs when an existing `TICKET-` or `REVIEW-` should be updated
- Do not turn a plan into an execution log
- Do not claim verification you did not run
- Do not expand scope unless the reviewed work is clearly under-scoped
- Prefer editing the existing artifact when that keeps truth centralized
- Do not default to creating plans when the underlying issue can be fixed directly
- Do not leave known code or UX regressions in place just because you documented them well

## Output

Prefer:

- repaired code/docs/tests plus honest wrap-up
- updated `docs/working/REVIEW-*.md` only when a durable review artifact adds value

Use plans only when needed:

- updated or new `docs/working/TICKET-*.md`
- updated `docs/working/REVIEW-*.md`
- optional `docs/archive/2026-MM/LOG-*.md` when wrap-up is part of the ask
- a concise final summary explaining what was fixed, what remains, and what was verified
