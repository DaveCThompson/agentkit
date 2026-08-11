---
description: Take a ticket and ship it — contract-driven implementation from Decision lines through Acceptance to a drift-proof closeout.
---

# Ship Workflow

Cold-start → closed-ticket for ONE ticket: orient on the contract → implement (routed by ticket
shape) → verify → drift-proof closeout. The net-new value over `/build` is the closeout: the ticket
ends `Done` with its commit SHA cited and every referencing doc fixed, so status never drifts from
git reality.

## Goal
Ticket implemented to its Acceptance criteria, focused-proof evidence recorded, and lifecycle
ownership handed to the final tree, then closed out:
`**Status**` → `Done` + commit SHA cited, archived, and every referencing doc updated.

## Inputs required (ask if missing)
- Path to a `docs/working/TICKET-*.md` with Decision lines, Acceptance criteria, and a `**Files**`
  surface. An approved `PLAN-` is optional.
- A running dev server **only if the ticket's Acceptance needs one** (many tickets — CLI, rules,
  docs — do not). Do not require one by default.

## Safety + scope
- Honor the ticket's Decision lines — they are settled, not suggestions.
- Only touch files inside the ticket's `**Files**` surface; an out-of-surface need means STOP and
  re-scope, not silently widen (kernel §8 diff-vs-`Files`).
- Do NOT deviate from the ticket's Acceptance exit conditions.
- No push/deploy without an explicit user ask (`pattern-external-mutation.md`).
- Fresh branch, never on main; never `git stash`; stop on conflict (`git-protocol.md`).

## Procedure

1. **Orient (light onboard + standards).** Read the ticket; extract Decision lines, Acceptance
   criteria, and the `**Files**` surface. Route to the governing standards deterministically:
   `agentkit check --kb <ticket Files>` → the 1–3 KB docs + `.agent/rules/` that own the surface.
   Run `use-codegraph` for the affected area. *Lighter than `project-onboard`* — skip the
   vision/terminology/full-rules sweep.

2. **Execute — routed by ticket shape** (route by shape, not vibe):
   - **Plan-bearing** (approved `PLAN-`, or a ticket carrying a phased plan) → `implement-feature`,
     per plan, no deviation without consent; graduated gate after each phase.
   - **Self-contained** (Decision + Acceptance lines, no separate plan) → a **solo `worker-execute`
     loop**: `**Files**` surface guard, Decision lines as guardrails, Acceptance as the exit
     condition, the graduated gate per change class, and hostile-QA self-correction — minus the
     parallel/orchestrator machinery.
   - **Small** (≤30 lines, ≤5 files) → `implement-quick-fix`.

3. **Validate at the lifecycle boundary.** Run focused local proof for the ticket's change class.
   If this branch is the standalone final tree, run or cite the one broad final-tree gate; otherwise
   name the integration owner. Read the TRUE exit code — no pipe masking. Cite-or-run any
   SHA/path/test count. Do not claim green on unrun commands.

4. **Drift-proof closeout.** Route to `implement-session-wrap-up` Phase 5 (the shared closeout):
   flip the ticket `**Status**` → `Done` + cite the completion commit SHA, grep the ticket
   ID/filename across `docs/` and fix every referencing row/link, run the **deletion-impact sweep**
   if this ticket removed anything (`git diff --diff-filter=DR`; empty ⇒ free), README-trim, archive
   the ticket, and add the changelog entry. `/ship` and `/wrap-up` share this one anti-drift
   closeout — a ticket that deletes code cannot reach `Done` with a doc or rule still describing it.

5. **Report + STOP.** Summarize what shipped against the Acceptance criteria, the verification
   results, that the ticket is now `Done` + archived and referencing docs are updated, and name any
   outstanding runtime, human, docs, or landing lane. No push
   without an explicit ask.

## Notes
- Use `/build` when you have a generic approved plan without ticket-format Decision/Acceptance lines
  (it has no onboard bookend and ends in the generic session wrap-up).
- For small tweaks (≤30 lines, ≤5 files) you can invoke `/quick-fix` directly.
- For parallel-orchestrated multi-ticket waves, use the `orchestrate-*` pipeline instead.
