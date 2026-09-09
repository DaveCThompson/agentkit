---
name: worker-bootstrap
description: Establish readiness for a new or resumed worker assignment. Use before editing to verify the accepted input, selected base, ownership, and task-required environment.
tier: core
---

# Worker Bootstrap

Establish what this worker may change and whether its remaining assignment can proceed. The kernel
`pattern-agent-orchestration.md` owns identity and metadata (§2), isolation (§5), and coordination
ownership (§6). A green baseline supplies comparative evidence, not proof that every later failure
was caused by this worker.

## When to Use

Use at assignment entry or when a resumed attempt's base/environment changed. Reuse still-valid
readiness on an unchanged attempt. Solo orientation usually uses `project-onboard`; ready workers
continue with `worker-execute`. A blocked bootstrap can always return through `worker-report`.

## Approach

### Phase 1: Ingest the assignment

Read the actual accepted ticket/plan/payload and acknowledge its content revision. Check the
deliverable kind, outcomes, exclusions, decisions, remaining acceptance, writable paths/resources,
completion artifacts, and proof ownership. Verify local-only inputs are accessible.

Read the resolved execution context from kickoff: active attempt, selected repository/target ref,
launch SHA, isolation mode, provisioning/Git owner, and existing action/target grants. Missing
material identity or ownership blocks dependent writes; do not guess from remote main or a default
branch. Per-run setup is resolved by the coordinator, not recreated by the worker.

### Phase 2: Isolate (per kernel §5 mode)

**Worktree independent committer:** use the assigned isolated checkout. Provision one at the exact
launch SHA only if that setup belongs to this worker and is authorized. Inspect existing paths,
branch names, and state before creation; do not create a second checkout because a harness already
provisioned one. A clone is an alternative only when authorized and it preserves the same base and
input delivery contract.

**Shared-tree-disjoint author:** use the assigned tree. No branch, checkout, stage, commit, reset,
stash, push, generation, or cleanup mutations belong to the worker. Record the coordinator's
attributed starting state for owned paths. Global dirty state is expected; inspect overlap within
the declared surface and report unexpected overlapping work. Read-only Git inspection is allowed
unless the assignment forbids it.

### Phase 3: Verify base and task-required capabilities

1. Observe actual repository, branch, HEAD, and relevant dirty state. A new isolated worker starts
   at the assigned launch SHA. A resumed worker checks ancestry from its recorded start and
   reconciles accepted owned commits/deltas; equality with the original SHA is not required.
2. Confirm cited existing targets and contracts. Intended new files need a valid declared
   destination/ownership boundary, not an already-existing file or parent folder.
3. On mismatch, preserve staged, tracked, untracked, and useful ignored work. Report the exact
   discrepancy and retained state. The provisioning owner can choose a fresh correct checkout
   after preserving inputs. Zero local commits does not authorize reset or deletion.
4. Inspect dependencies and commands needed by the assignment. Install only when required,
   authorized, and owned by this setup; honor the project's lock/install procedure. Static
   instruction work need not install dependencies or start a server.
   Distinguish committed project intent/guidance from computer-local kit binding and prerequisites.
   A relocated clone retains its inherited lock. Missing local setup limits CLI/native proof,
   not independently authorized source work; use `governance/migration-checklist.md` and name
   the setup owner instead of installing, syncing or resetting ownership as a bootstrap side effect.
5. Reuse valid baseline evidence under `foundation-testing.md` §1A, or collect missing focused
   proof. State command, environment, result, covered state, and limitations. An inherited failure
   needs evidence and a bounded disposition; it is neither automatic permission for unrelated
   repair nor proof this worker caused it.
6. Probe optional discovery only when useful. Compose `use-codegraph` for graph capability and
   freshness, or use current-source search. An unavailable optional graph does not block editing.

For a shared tree, tests observing changing sibling files cannot establish a stable combined
baseline. Request the coordinator's stable snapshot or identify the limited proof surface.

### Phase 4: Orient and reconcile remaining work

Use `project-onboard` for the assignment's routed context without repeating completed onboarding.
Consume `implement-flight-check` for implementation readiness, passing existing base/proof
evidence so it checks changed facts only. Research/review work instead checks its evidence inputs
and output contract.

Compare the accepted plan with later decisions and completed phases. Resume valid remaining
outcomes. For transplant work, identify relevant upstream characterization tests and required
compatibility; explain any unsafe or unavailable behavior proof before adaptation.

### Phase 5: Declare readiness

Return ready, ready-with-limits, or blocked with the covered assignment/attempt, actual base/state,
remaining work, applicable evidence, and the exact limitation/next owner. Limits name which actions
can proceed and which transition remains gated. No successful install, commit, or push is required
to report a blocker.

Proceed with independently authorized work when readiness supports it. Stop dependent writes for
unresolved base, ownership, scope, or required-capability failures. Never edit the coordinator's
board or silently expand the assignment to repair its environment.

## Definition of Done

- The accepted input, active attempt, base, and path/resource ownership are established.
- Existing work is preserved; new and resumed base checks use the correct relation.
- Required capabilities and proof have results or precise limitations.
- The coordinator receives an actionable readiness outcome; ready work can enter `worker-execute`.
