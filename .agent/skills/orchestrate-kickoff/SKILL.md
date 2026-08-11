---
name: orchestrate-kickoff
description: Emit one paste-ready launch block per ticket — isolation setup, category-routed doc onboarding, collision heads-ups, and tier — so parallel workers start with zero hand-editing. Use when launching a partitioned wave of parallel workers.
tier: core
---

# Orchestrate Kickoff

Turn a partitioned wave into launched workers. For every ticket in the wave, emit **exactly one
self-contained fenced block** the operator (or a subagent spawn) receives verbatim — the block IS
the worker's session-opening prompt. All shared contracts (tiers, ticket metadata, completion
report, isolation modes, the manifest, the orchestrator lock) live in
`pattern-agent-orchestration.md`; this skill only assembles them into launch blocks. It never
restates them — a contract copied into a block is a contract that drifts.

## When to Use

- A wave has been partitioned (`orchestrate-partition` output in hand: isolation mode, disjoint
  surfaces, collision list) and workers must now be launched.
- Re-launching a single ticket after a worker stalled, reported red, or abandoned its branch.

## When NOT to Use

- No partition exists yet → run `orchestrate-partition` first; kickoff consumes its mode and
  collision output, it does not compute disjointness itself.
- Finished branches need integrating → `orchestrate-merge-train`.
- You are a worker who received a block → execute the block; close out via `worker-report`.
- One ticket, one agent, no parallelism → `implement-feature` or `implement-quick-fix` directly;
  the orchestration overhead buys nothing.

## Approach

### Phase 1: Preconditions (deterministic, fail closed)

0. **First-run scaffold (fail loud).** Confirm `.agentkit.json` has an `orchestration` block
   (`statusBoard`, `tierRoster` — the roster resolves tier→model for every block). Missing → stop and
   print the starter block per `pattern-agent-orchestration.md` §4 for the user to paste; never
   silently assume the roster exists (normally `orchestrate-sequence` scaffolded it already).
1. Acquire the orchestrator lock: `node "<kit>" lock acquire .` (write-if-absent, per
   `pattern-agent-orchestration.md` §6). If held (exit 1), refuse — two kickoffs mean two Status
   Board writers.
2. `git status --short` on the main tree must be clean. Dirty tree → stop; commit or flag per
   `git-protocol.md` (never stash).
3. Confirm every wave ticket carries `**Agent Tier**` and `**Files**` (kernel §2). A ticket
   missing either goes back to `orchestrate-partition` — do not guess metadata at launch time.

### Phase 2: Resolve per-ticket inputs (read, don't invent)

For each ticket, gather the seven block ingredients:

1. **Isolation setup** — mode comes from the partition result (kernel §5). Worktree mode: branch
   name from the manifest's `branchNamePattern`, worktree path under its `worktreeRoot`.
   Shared-tree-disjoint mode: the ticket's assigned disjoint file surface (globs) from the
   partition output.
2. **Integration-base SHA (required field)** — resolve the wave's integration base ref in priority
   order: the board-recorded per-effort base if one already exists for this wave/ticket, else the
   manifest's `baseBranch`, else the manifest `mainBranch` — matching the ref-selection order
   `orchestrate-partition` (`<base>` is `origin/<mainBranch>` unless the ticket recorded a
   different base) and `worker-report` (`origin/<mainBranch>` or your recorded base) already use.
   Then resolve that ref to a concrete SHA (`git rev-parse <ref>` after confirming the tree is
   current) and pass the **resolved SHA** in every block — which ref gets resolved may vary, but a
   concrete SHA is always required. `worker-bootstrap` asserts
   `git merge-base --is-ancestor <sha> HEAD` before any edit. WHY: live incident — workers branched
   off a ~56-commit-stale base and the ticket's declared files did not exist there. A block without
   this SHA is defective.
3. **Tier → model** — the ticket's declared tier, resolved through the manifest roster **or the
   run's roster override if one was passed** (kernel §4): the override shadows the manifest for
   this run only. State tier + the resolved model in the block; never route by model brand.
4. **Doc onboarding** — read the category→docs routing table in `project-invariants.md` and select
   the rows matching the ticket's category. This skill CONSUMES that table; it hardcodes no rows —
   the table is the project's knob, kickoff is portable.
5. **Collision heads-ups** — the shared files/modules `orchestrate-partition` flagged for this
   ticket, plus which sibling ticket also touches them.
6. **Protocol** — the multi-track rules of engagement (Phase 3, item 4).
7. **Skill injection** — skills do not travel into subagents: a spawned worker never sees the
   orchestrator's loaded skills, so a skill's discipline reaches the worker only if the block
   carries it. When the ticket's work matches a skill (research → `research-deep`, an audit →
   the matching `audit-*`), paste the relevant SKILL.md discipline — or its distilled rules —
   into the block. Naming the skill is not enough; the worker cannot load it.

### Phase 3: Assemble the block (the hard requirement)

Emit **ONE fenced block per ticket**. Single block, paste-ready, zero operator hand-editing: every
placeholder is resolved by the orchestrator before emitting. If the operator would need to edit
anything inside the fence, the block is defective — fix the generator, not the paste. WHY: hand-
edited launch prompts are where wave discipline dies; N tabs × M edits is N×M silent drift.

Block anatomy, in order:

1. **Setup commands with machine-checkable preamble** — every block opens with a preamble that
   states the exact base ref and exact branch name, so the worker can verify before touching code:
   ```text
   Base ref:     <resolved-integration-SHA>
   Branch name:  <resolved-branch-name>
   ```
   Worktree mode: `git worktree add` of a fresh worktree off latest main with the ticket branch,
   then the project's dependency install. Shared-tree-disjoint mode: fresh branch only, plus the
   assigned surface stated as an explicit allowlist: "you may edit ONLY these paths — touching
   anything else is a defect, stop and report instead." **Always include the integration-base SHA
   from Phase 2.2** with the instruction that `worker-bootstrap` must assert
   `git merge-base --is-ancestor <sha> HEAD` before editing — a worker on a stale base edits
   files that don't exist yet. End with: **"Commit to the declared branch before ending; never
   `wip:` on a foreign branch."**
2. **Orientation** — instruct the worker to run `project-onboard` first, then read the docs
   selected in Phase 2.4, in order. Onboarding is composed, not restated. State the **truth ranking**
   in the block: **code > status board > CHANGELOG narrative**. A changelog entry is a point-in-time
   record that later entries supersede — a worker briefed from the changelog head can carry a
   superseded "shipped" claim straight into its work, which has happened.
3. **The ticket** — id, path, tier (with the resolved model per Phase 2.3), Decision/Acceptance
   lines. **Transplant tickets** (a vendored/transplant `**Complexity-note**`, kernel §2): the
   block prescribes the opening move — *port the upstream characterization tests first, get them
   green, then refactor under them*. WHY: a domain-coupled rewrite without a characterization
   harness has no proof of behavior preservation.
4. **Multi-track protocol** — stay inside the declared surface; never edit the Status Board
   (single writer, kernel §6); never push or merge (privileged roles only, kernel §1); commit to
   your branch per `git-protocol.md`; close out with the `worker-report` completion report
   (kernel §3); on ambiguity or surface overflow, stop and report — do not improvise scope.
5. **Collision heads-ups** — the flagged shared surfaces and the sibling that shares them, so the
   worker treats those files as escalate-first territory.
6. **Injected skill discipline** — the Phase 2.7 payload, pasted into the block (a name-drop is
   not an injection). **Audit-shaped tickets** use the proven substitute for bespoke audit agents:
   spawn a read-only Explore subagent instructed to *read the matching `audit-*` SKILL.md as its
   rubric*, return **candidates with verbatim evidence** (quoted lines, selector-anchored per
   kernel §2), and have the main thread verify every attestation before anything is recorded. No
   bespoke `async-*` audit agents exist — this pattern is the replacement.

### Phase 3a: Portable ad-hoc worker-preamble snippet (survivable outside kit)

When the kit skills are not driving the launch (operator pasting into a terminal, subagent spawn
from a non-kit system), the worker still needs a self-contained preamble. Publish this block as the
opening of every worker prompt that cannot rely on `worker-bootstrap`:

```text
## Worker preamble (paste at session start)

# 1. Verify base
BASE=<resolved-integration-SHA>
git merge-base --is-ancestor "$BASE" HEAD || { echo "STALE BASE: $BASE is not an ancestor of HEAD"; exit 1; }

# 2. Create branch (fresh, never on main)
git checkout -b <resolved-branch-name>

# 3. Verify surface exists
for f in <ticket-files-globs>; do ls $f 2>/dev/null || { echo "SURFACE MISSING: $f does not exist on this base"; exit 1; }; done

# 4. Install deps
ci install   # or npm ci / cargo fetch / pip install -r requirements.txt

# 5. Run gate on pristine base (lint + typecheck at minimum)
<npm|lint|typecheck command> || { echo "BASE NOT GREEN — environment defect, not code"; exit 1; }

# 6. Commit to branch before ending; never wip: on a foreign branch
```

This block is **always present** in the kickoff output — it is the portable fallback so a worker
launched outside the kit still has a deterministic start. The kit's `worker-bootstrap` skill is the
richer version; this snippet is the survivable minimum. WHY: realistic waves include workers the
orchestrator cannot control — a pasteable preamble is the contract's boundary, not an accelerator.

### Phase 4: Launch and record

1. **Accelerator:** spawn one subagent per block, block as the prompt, model per the resolved
   roster (override-aware, Phase 2.3). **Shell fallback (always works):** print the blocks; the
   operator pastes one per fresh terminal/tab session. The block content is identical either way
   — that is the point.
2. After each launch, record ticket → branch → tier → resolved model → launch state on the Status
   Board, plus the wave's integration-base SHA and any per-run roster override (kernel §4 —
   overrides are board-recorded, never ephemeral prose). The orchestrator is its only writer.
3. **Flip the launched ticket's own `**Status**` to `in-progress` — at launch, not at completion.**
   Status changes at **two owned moments**: kickoff is the orchestrator's, completion is the
   worker's. The completion half already works in practice; the kickoff half is what gets skipped,
   and the result is a ticket header lagging the board by a full lifecycle stage. In the live run
   this comes from, **five of seven** child tickets still read "Ready for peer review" while their
   build lanes were running. A ticket header may never lag the board by a full stage.
4. Keep the lock until the wave is handed to `orchestrate-merge-train` or aborted; release on exit.

## Verification / Definition of Done

This skill emits prompts, not code — the gate in `foundation-testing.md` belongs to the workers
and the merge train. Kickoff's own bar:

- [ ] Orchestrator lock held; `git status --short` was clean at launch.
- [ ] Exactly one fenced block per ticket; no placeholder (`<...>`, `{...}`, TODO) survives inside
      any fence.
- [ ] Every block names: setup, **the resolved integration-base SHA** (with the
      `worker-bootstrap` ancestor assertion), tier + resolved model, category-routed docs,
      collision heads-ups, and the worker protocol including the `worker-report` close-out.
- [ ] Any per-run roster override is applied to every block AND recorded on the Status Board.
- [ ] Every transplant ticket's block opens with the characterization-first move.
- [ ] Every ticket whose work matches a skill carries that skill's discipline pasted into its
      block — skills never travel into subagents by name alone.
- [ ] Doc routing was read from `project-invariants.md` this session — not recalled from memory.
- [ ] Isolation mode matches the partition result; disjoint surfaces (if any) appear verbatim in
      their blocks.
- [ ] Status Board updated by the orchestrator only.

## Constraints

- Never compute partition/disjointness here — consume `orchestrate-partition` output only.
- Never restate kernel contracts inside blocks; cite `pattern-agent-orchestration.md` and compose
  `project-onboard` by name.
- Never hardcode doc-routing rows or roster models in this skill — both are project knobs
  (`project-invariants.md`, the manifest).
- Blocks grant no push rights and no Status Board write access to workers, ever.
- Harness-neutral: subagent spawn and worktrees are accelerators; the paste-into-tabs and
  plain-branch fallbacks must remain first-class in every block.

## Output

- N fenced launch blocks (one per ticket), emitted in dependency order.
- A Status Board updated with the launched roster.
- A handoff note: which tickets launched, in which mode, and what `orchestrate-merge-train` should
  expect back.
