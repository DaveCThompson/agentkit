---
name: worker-execute
description: Execute an accepted worker assignment within its declared files and resources, preserving decisions and proof ownership. Use after readiness is established, including a direct ticket route that delegates this loop.
tier: core
---

# Worker Execute

Carry out the assigned deliverable and preserve the contract used to partition it. Shared identity,
scope, and reporting requirements live in `pattern-agent-orchestration.md` §§2–3; execution stays
within those boundaries even when another skill supplies the domain method.

## When to Use

Use after `worker-bootstrap` or equivalent established readiness, or resume a valid active attempt.
A direct solo ticket can use this loop without a board or parallel setup. Unresolved readiness
returns to `implement-flight-check` or `worker-bootstrap`; completed or blocked work uses
`worker-report`.

## Approach

### Phase 1: Load the guardrails

Read the accepted revision, active attempt, deliverable kind, Decision lines, exclusions, Acceptance,
and writable files/resources. Reconcile completed work and later accepted decisions before resuming.

A material impossible decision needs evidence and a coordinator disposition. Continue routine
implementation choices and independent work already inside the accepted outcome. The worker cannot
revise a binding file boundary; request a collision-checked assignment revision before dependent edits.

### Phase 2: Route by ticket type

Use the method appropriate to the requested deliverable:

- Feature/new behavior: `implement-feature` for planned work, `implement-quick-fix` for a bounded
  small change, or the accepted embedded steps for a self-contained ticket.
- Behavior-preserving restructuring: `implement-refactor`.
- Bug diagnosis/repair: `debug-standard` or `debug-deep`, preserving diagnosis-only versus repair
  authority and supplied reproduction evidence.
- Test-only or reproduction-only: `implement-test`; intentional red can be the requested result.
- Review/audit: the matching review or audit skill with its read-only boundary.
- Research or documentation: the matching research/writing skill, with artifact/source checks.

A composed skill does not add release, cleanup, broad refactoring, or new-artifact duties to the
assignment. Keep the same accepted work identity; do not create a second plan to enter a route.

### Phase 3: Guarded edit loop

1. Before each write, resolve its target against the assignment allowlist. Include indirect outputs
   from formatters, generators, tests, and tools. If a command can write beyond that boundary,
   narrow it or return the need to the coordinator before running it.
2. After a meaningful work chunk, compare actual attributed changes with the accepted surface.
   In a worktree, inspect committed changes from the recorded start plus staged, unstaged, and
   untracked outputs. In a shared tree, compare owned paths with their captured starting contents;
   global dirty paths are not all this worker's work.
3. Preserve foreign changes. Unexpected edits within an owned path require reconciliation; do not
   revert them to recover an earlier baseline. Only the coordinator revises ownership after checking
   collisions.
4. Collect focused proof appropriate to changed outcomes under `foundation-testing.md` §1.
   Reuse matching evidence under §1A. Changed assumptions, failures, or new edits justify additional
   checks; a skill transition does not.
5. Check remaining Acceptance against actual results. Preserve unperformed runtime/human/docs
   lanes and their owners; a green generic command cannot close them.

In shared-tree-disjoint mode the coordinator owns every Git mutation, generation, and combined proof
snapshot. Do not stage, commit, switch branches, or checkpoint with Git. An independent worktree
committer may checkpoint owned work only within its assignment grant.

### Phase 4: Deviation ledger

Record material in-scope adjustments, skipped work, unexpected dependencies, and scope requests with
their reasons. Preserve accepted coordinator revisions and changed prerequisite evidence. Do not log
every keystroke or reopen settled choices merely because another approach exists.

For bug repairs, carry the same behavioral assertion across before/after proof, or the specific
reason and alternative evidence allowed by `foundation-testing.md` §1A. For gate changes, disclose
oracle/fixture/threshold changes and preserve meaningful detection evidence under §1C. Do not invent
causal certainty from a green baseline.

### Phase 5: Exit

Return through `worker-report` when the requested deliverable is complete, required proof needs
another owner, the attempt is blocked/failed, or cancellation ends the work. Use existing status
vocabulary; keep progress and attempt disposition separate from work status.

For required pending proof, name the check, owner, and gated transition. Continue independent
authorized work when possible. Stop dependent work for missing authority, binding scope changes, or
uncertainty that further safe investigation cannot resolve. A progress request gets an interim
snapshot and does not by itself terminate an active assignment.

## Definition of Done

- Actual writes stay in the accepted revision's files/resources; any scope need is returned before expansion.
- Decisions, exclusions, and remaining Acceptance are preserved through the chosen domain route.
- Evidence supports the claimed outcomes and identifies pending lanes and final-tree owner.
- Material deviations and useful partial/negative evidence are ready for the report.
- Completion, pending proof, interruption, and an interim update are not conflated.
