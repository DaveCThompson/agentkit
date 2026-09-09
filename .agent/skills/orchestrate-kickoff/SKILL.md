---
name: orchestrate-kickoff
description: Prepare or dispatch resolved worker assignments after partitioning. Use when a wave needs launch prompts or a stopped assignment needs a fenced replacement attempt.
tier: core
---

# Orchestrate Kickoff

Turn a partitioned schedule into usable worker prompts and, when authorized, launched attempts.
The kernel `pattern-agent-orchestration.md` owns assignment (§2), report (§3), execution context
(§§4–5), and coordination/attempt ownership (§6).

## When to Use

- A partitioned wave needs prepared prompts or actual dispatch.
- A stopped worker assignment needs relaunch after its state has been reconciled.

If ownership/partition is unknown, resolve it with `orchestrate-partition` first. Use
`orchestrate-merge-train` for finished output. A small solo task does not need orchestration.

## Approach

### Phase 1: Distinguish preparation from dispatch

A preparation-only request returns launch blocks. It does not acquire a lock, mutate the board,
provision branches, change ticket status, spawn workers, or require publishing capability.
Unresolved execution inputs can be listed outside the block; call it a draft until they are resolved.

For authorized dispatch, consume the kernel's resolved per-run context, coordinator, effective
roster, selected base, and lock/waiver. Borrow the caller's acquisition when composed. Only a new
owner acquires with a fresh UUID under kernel §6; never release a borrowed or foreign acquisition.
Check required capabilities before the affected action, not every possible capability in advance.

### Phase 2: Resolve per-ticket inputs (read, don't invent)

Read and carry the accepted assignment revision and its linked plan, including ignored inputs.
Resolve:

- Deliverable kind, outcomes, exclusions, Decision/Acceptance, and writable files/resources.
- Completion-artifact ownership: ticket/status, report, and fragment paths if assigned.
- Source repository, selected integration target ref, launch SHA, and worker start state.
- Isolation mode, Git/provisioning owner, worker identity, and new active attempt.
- Existing grants for implementation, commit, publication, and cleanup with their exact targets.
- Applicable proof lanes, owners, evidence targets, and transitions blocked by pending checks.
- Watch surfaces, qualified prerequisites, shared resources, and reservations from partition.
- Tier/model from the effective roster or explicit run override; record actual runtime availability.

Use the project's category/doc router when present. Otherwise select the relevant governing
contracts from its existing indexes. Do not invent `project-invariants.md` or a universal truth
ranking: current behavior, intended behavior, and work status have different evidence owners.

For a replacement, establish that the previous writer is stopped/fenced before dispatch. Record the
retained output, completed work, remaining acceptance, and accepted revision. Late output from the
old attempt remains historical. A retry needs changed conditions or a revised diagnosis.

### Phase 3: Assemble the block

Produce one coherent block per assignment, suitable for the actual recipient and shell. Include
resolved inputs from Phase 2 and verified paths to `worker-bootstrap`, the relevant specialist
skill, and `worker-report`.

Check whether the recipient can read those instructions and local artifacts. Prefer accessible
paths. If it cannot, provide the bounded instruction/input payload it needs with its source
revision. Do not assume skill or MCP inheritance in either direction. Do not copy the whole kernel
into each prompt or change ignore policy to transfer a ticket.

Make setup ownership explicit:

- Worktree independent committer: the assigned provisioning owner creates or selects an isolated
  checkout at the exact launch SHA. Avoid duplicate branch creation by both preamble and bootstrap.
  Install only dependencies the assignment needs under the project's procedure.
- Shared-tree-disjoint author: use the assigned tree and path allowlist. The coordinator owns
  Git, generation, and combined proof. Include no worker branch/stage/commit/push commands.
- Existing attempt: reconcile its ancestry and partial work; do not require fresh-base equality
  or discard work to make a preamble pass.

For transplanted code, carry the behavior/compatibility contract and characterization evidence.
Where safe and feasible, characterize the upstream behavior before adapting it. Do not assume all
upstream tests are portable or bless known defects as desired behavior.

A research, review, or instruction-authoring assignment gets its own deliverable and evidence
checks. Do not launch an extra review subagent or force a product build loop merely because a
matching audit skill exists.

### Phase 3a: Recipients without skill loading

Render a bounded standalone procedure only when paths cannot carry the instructions. It must cover
assignment/attempt acknowledgement, selected base, scope, readiness, proof, reporting, and the
earliest permitted exit. Use the actual shell if commands are included. State unavailable setup
rather than emitting a supposedly portable Bash recipe.

### Phase 4: Launch and record

In preparation mode, deliver the blocks and stop. In dispatch mode, launch through an available
authorized runtime and record actual success or failure. If spawning is unavailable, return
prepared blocks for operator launch; printed prompts are not launched workers.

Only after a launch is confirmed does the coordinator record the active attempt and update the
ticket's authoritative status under kernel §2. Keep the scheduling view derived. Confirm the worker
received the accepted input revision. Preserve a local-only delivery route for ignored artifacts.

Keep the acquisition through composed coordination; release only when its owner ends the operation.
A child train receives the same ownership context, not instructions to reacquire or release it.

## Definition of Done

- Prepared blocks name exact inputs, scope, base, ownership, proof, and recipient-readable instructions.
- Shared-tree prompts contain no worker Git mutation; preparation produced no execution effects.
- A relaunch has an inactive old writer, retained state, and distinct active attempt.
- Claimed launches are confirmed and recorded by the coordinator; unavailable dispatch stays prepared.
- The report distinguishes prepared, launched, and blocked assignments and names the next consumer.
