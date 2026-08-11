---
name: worker-execute
description: The guarded implement loop for a parallel worker — Decision lines as guardrails, every edit inside the ticket's declared Files surface, continuous self-check against Acceptance, graduated gate per change class. Use after worker-bootstrap passes and before worker-report.
tier: core
---

# Worker Execute

The implement loop for one worker in a parallel wave, guarded by the ticket's own contract lines.
Shared contracts live in `pattern-agent-orchestration.md` (the kernel). WHY the guardrails: the
orchestrator cleared collisions using your ticket's `**Files**` surface — an edit outside it is a
collision nobody checked for, and a "better idea" that overrides a Decision line silently breaks
the partition other workers were planned around.

## When to Use

- `worker-bootstrap` completed: verified base, green base gate, guardrails loaded.
- Resuming an in-progress worker ticket on an already-bootstrapped branch.

## When NOT to Use

- Environment not yet verified → `worker-bootstrap` first.
- Implementation complete, ready to close out → `worker-report`.
- You are integrating branches or updating the queue → the `orchestrate-*` skills (workers never
  merge to main or write the Status Board — kernel §6).
- Solo, non-parallel implementation → `implement-feature` / `implement-refactor` directly.

## Approach

### Phase 1: Load the guardrails
From the assigned ticket, before the first edit:
1. **Decision lines** — settled choices, not suggestions. You implement them; you do not relitigate
   them. If a Decision is impossible or contradicts observed reality, STOP and flag with evidence —
   do not silently pick an alternative.
2. **Acceptance list** — your continuous self-check target and your exit condition.
3. **`**Files**` globs** — your writable surface. Everything else in the repo is read-only to you.

### Phase 2: Route by ticket type
- Feature / new behavior → compose `implement-feature` (its phases: KB routing, code-graph
  comprehension, execution loop, hostile-QA self-correction).
- Restructuring with behavior invariants → compose `implement-refactor` (invariants list, safety
  net, atomic reversible steps).
The composed skill drives the *how* of each edit; this skill wraps it with the surface guard and
Acceptance loop below.

### Phase 3: Guarded edit loop
For every edit, in order:
1. **Surface check BEFORE writing**: the target path must match the ticket's `**Files**` globs.
   Deterministic backstop after each work chunk:
   `git diff --name-only <base>..HEAD` plus `git status --short` — every listed path must match the
   globs. This catches indirect writes (codegen, formatters) the pre-check misses.
2. **Out-of-surface need** → STOP, do not edit. Record the path + why it's needed; flag it to the
   orchestrator as a collision risk. Options are the orchestrator's: expand your surface, re-route
   to another ticket, or serialize. A worker never self-expands a surface.
3. **Gate per change class**: run the graduated gate (`foundation-testing.md` §1) at the tier the
   change demands — `lint` + `typecheck` always; focused domain tests on behavior/schema/route
   change; `build` when build-affecting. Use the project's one-command gate form — for Node repos
   the `gate:*` scripts (`npm run gate:types`, `npm run gate`, …) documented in `tech-node-gate.md`
   — a single allowlisted, prompt-free command per `pattern-command-shape.md`, not a
   `cd … && <runner> … | tail` compound. Keep every run's real result; it feeds the §3 report.
4. **Cite-or-run during execution:** any commit SHA, file path, or test count written into code,
   comments, or the deviation ledger MUST be verified first (`git log`/`ls`/the runner's real pass
   line). An unverified citation is a defect — the §3 report cite-or-runs all of them, but catching
   it during execution is cheaper than at report time.
5. **Acceptance re-read** after each composed-skill phase: which items are now satisfied, which
   remain, does any edit so far *violate* one? Drift caught mid-loop is cheap; at merge it is not.

### Phase 4: Deviation ledger
Maintain a running list of every departure from the ticket (approach changed, step skipped,
surprise dependency, out-of-surface flag raised) with the why. This becomes the
`deviations from plan` field of the kernel §3 completion report — deviations surfaced *before*
merge are the whole point of the report contract.

### Phase 5: Exit
Exit the loop only when (a) every Acceptance item is satisfied and the gate at the ticket's
blast-radius tier is green, or (b) a blocking flag (impossible Decision, out-of-surface need,
inherited red gate) is raised to the orchestrator. Either way, proceed to `worker-report` — even a
blocked ticket closes with a truthful report.

## Verification / Definition of Done

- [ ] `git diff --name-only <base>..HEAD` ⊆ the ticket's `**Files**` globs — verified by path-set
      comparison, or every exception STOP-flagged and recorded in the deviation ledger.
- [ ] Every Decision line either implemented as written or explicitly flagged — none silently
      overridden.
- [ ] Every Acceptance item checked off against observed behavior, not intention.
- [ ] Graduated gate ran at the change class's tier after each chunk; commands + real results
      retained. No unrun-green claims (`foundation-testing.md`).
- [ ] Deviation ledger current — empty is a valid (and reportable) state.

## Constraints

- Never merge to the main branch; never write the Status Board or any shared queue doc — single
  writer is the orchestrator (kernel §6).
- Never edit outside the declared `**Files**` surface; STOP-and-flag is the only escape hatch.
- Never `git stash`; on any merge/rebase conflict, stop and report per `git-protocol.md` §3.
- Commit WIP to your own branch to checkpoint; keep commits scoped to the ticket.
- Bugs discovered outside scope: note them in the deviation ledger for the report — do not fix.

## Output

A worker branch whose diff sits inside the declared surface, Acceptance satisfied (or a blocking
flag raised), gate evidence and deviation ledger in hand. Hand off to `worker-report`.
