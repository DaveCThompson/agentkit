---
name: review-peer
description: Verdict-first review of a capable agent's or peer's work — adopt/adapt/reject findings with file:line evidence, fixing only clear, unambiguous defects. Use for senior-to-senior review; for raising below-standard work to repo quality use review-raise-bar.
tier: core
---

# Review Peer

Judge a capable peer's work on the evidence and say what you found. The deliverable is verdicts —
adopt / adapt / reject with proof — not a repaired branch. Fix only what is unambiguously broken;
everything that requires judgment stays a finding for the author to weigh.

## When to Use

- Reviewing work by a senior/staff-tier agent or an experienced developer
- The author is trusted to act on findings — you owe them judgment, not rework
- A second opinion on a branch, plan, or review before it lands

## When NOT to Use

- The work is below repo standard and should end up repaired → `review-raise-bar`.
- Pre-implementation vetting of an idea or plan → `vet-simple` / `vet-hard`.
- A codebase-wide quality audit, not one agent's work → `audit-code`.
- Small in-place cleanup with no review scope → `refine-code`.

## Approach

### Phase 1: Recon on the real work

1. Identify the artifacts and files produced by the other agent.
2. Build an evidence list from the actual repo — `git diff`, the real files — not just from the
   other agent's summary or prose.
3. Load only the standards that materially apply to the reviewed work.

### Phase 2: Multi-lens pass

Review through the same five lenses as `review-raise-bar`:

1. **DX** — code standards, executability, concrete file targets and verification steps
2. **UI** — visual system, layout/token/containment rules
3. **UX** — discoverability, accessibility, realistic on target devices, sequencing
4. **Docs** — right locations and names, truthful, non-duplicative, source-of-truth aligned
5. **Scope** — right-sized, explicit non-goals and acceptance criteria

### Phase 3: Verdicts with evidence

Classify every major finding:

- **Adopt** — correct and should remain (say why in one line; don't pad)
- **Adapt** — directionally right, needs stronger constraints/scope/evidence (state exactly what)
- **Reject** — not justified by the codebase, standards, or user goals (cite the contradicting
  file:line or rule)

Every Adapt/Reject verdict carries `file:line` evidence or a named rule. A verdict without
evidence is an opinion, not a review.

### Phase 4: Surgical fixes only

Fix directly ONLY defects that are unambiguous and within quick-fix scope (≤30 lines, ≤5 files):

- a broken invariant a rule states explicitly (wrong token, missing `sideEffects`, taxonomy-wrong
  filename)
- a failing gate (lint/typecheck error introduced by the reviewed work)
- a factual error in docs (a claim the code contradicts)

Anything judgment-flavored — architecture, naming preferences, scope calls, "I'd have done it
differently" — stays a finding. Run the graduated gate (`foundation-testing.md` §1) on whatever
you touched.

### Phase 5: Report

Deliver a concise findings report: verdicts grouped Adopt/Adapt/Reject, what you fixed directly
(with the gate results), and what the author should decide. Update an existing
`docs/working/REVIEW-*.md` before creating a new one (`pattern-docs-artifacts.md`); create one
only when a durable review artifact adds value beyond the conversation.

## Reflexion

Before delivering, verify:
- Did I review the actual code/docs, not the author's prose about them?
- Does every Adapt/Reject verdict carry file:line or rule evidence?
- Did I stay surgical — or did I drift into raise-bar repair that the author didn't ask for?
- Are my direct fixes each unambiguous, small, and gate-verified?
- **Could I explain each major change back simply?** A change whose behavior I can't restate
  concisely is a complexity signal — recommend splitting or simplifying it, not just approving it.

## Constraints

- Do not repair the branch wholesale — that is `review-raise-bar`'s job; route there if the work
  turns out to be below standard.
- Do not claim verification you did not run; name exact commands for anything you touched.
- Do not create a `REVIEW-` artifact when the conversation summary suffices.
- Do not soften Reject verdicts into Adapts to be polite — evidence decides.

## Output

- Verdict report (Adopt / Adapt / Reject with evidence), inline or as an updated
  `docs/working/REVIEW-*.md`
- Surgical fixes committed with the graduated gate run on the touched surface
- An explicit routing note if the work actually needs `review-raise-bar`
