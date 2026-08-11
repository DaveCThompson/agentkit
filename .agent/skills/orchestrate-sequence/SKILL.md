---
name: orchestrate-sequence
description: "Turn a set of backlog tickets into a dependency-ordered plan of waves and lanes, with a solo-first foundation ticket detected automatically. Use when multiple tickets are ready and you must decide what runs when, and in what order parallel workers branch."
tier: core
verified-against: 2026-07-04
---

# Orchestrate Sequence

Compute the **execution order** for a ticket set: build a dependency DAG from ticket metadata,
detect the shared-code foundation that must land first, then partition each wave into parallel
lanes. Extends `backlog-status.md` (which only *reads* distributed ticket metadata) with ordering
and partitioning. All shared contracts — tiers, ticket metadata, the manifest, isolation modes,
single-writer Status Board, the orchestrator lock — live in `pattern-agent-orchestration.md`;
this skill delegates to them and never restates them.

## When to Use

- Two or more tickets are ready and you must decide waves, lanes, and branch-off points before
  spawning workers.
- A queue re-plan: a wave finished, tickets were added/closed, and the remaining order must be
  recomputed.
- You suspect one ticket is a hidden bottleneck (shared code everyone rides) and want that
  detected deterministically instead of by feel.

## When NOT to Use

- **Tickets aren't decomposed yet** — you have one monolithic ticket, or tickets that lack the §2
  metadata (`**Files**`/`**Depends**`/`**Agent Tier**`) → run `orchestrate-decompose` FIRST to split
  the monolith into parallel-ready, tagged tickets. This skill *consumes* ready tickets; it does not
  author them. (Pointing it at an untagged monolith is the common first-move mistake.)
- One ticket, no ordering question → just run it (`implement-feature` / `implement-quick-fix`).
- You already have a wave and only need file-surface disjointness, watch-list heads-ups, or an
  isolation-mode recommendation → `orchestrate-partition` (this skill calls it per wave, plus once
  set-wide at Phase 3.3 for the declared-new-symbol pass).
- You want a read-only backlog snapshot with no plan → the `backlog-status` workflow.
- You are a worker executing an assigned ticket → follow your ticket + the completion-report
  contract (`pattern-agent-orchestration.md` §3); workers never sequence or write the board.

## Two modes
- **`--preview`** (safe in plan mode): compute and PRINT the waves/lanes plan with **no side effects**
  — skip the lock (Phase 1.2) and the board write (Phase 6). Use this to propose the plan for approval.
- **execute** (post-approval): the full flow including the lock and the Status Board write. Phases that
  write are execution-only and cannot run under plan mode — this skill's write half is a
  post-approval action, not a planning one.

## Approach

### Phase 1: Bootstrap + acquire the right to orchestrate
1. **First-run scaffold (fail loud).** Confirm `.agentkit.json` has an `orchestration` block
   (`statusBoard`, `tierRoster`, `mainBranch`) per `pattern-agent-orchestration.md` §4. If it's
   missing, **stop and print the starter block** (with this repo's real values) for the user to paste
   and confirm — do not silently assume `statusBoard`/`tierRoster` exist and fail three phases later.
2. **(execute mode only)** Acquire the write-if-absent orchestrator lockfile per
   `pattern-agent-orchestration.md` §6: `node "<kit>" lock acquire .` (exit 1 = held). If held: stop —
   another orchestrator owns the queue. The file check is the gate, not convention. **Skipped in
   `--preview`** (a preview writes nothing, so it takes no lock).
3. **Clean-tree gate binds to kickoff, not to planning.** If this run cuts worker branches (it
   feeds straight into `orchestrate-kickoff`), `git status --short` must be empty first. A
   **planning-only** pass — board write, no branches — may legitimately run on a dirty tree while
   other work is in flight: record the in-flight state on the board (Phase 6) instead of blocking.
   Branching per `git-protocol.md`.
4. **Verify the integration base exists:** `git rev-parse --verify <base>` on the manifest
   `mainBranch` / the board's recorded base. A board pointing at a merged/deleted base is a real
   incident class — catch it here deterministically, resolve to the current branch (or the branch
   the base merged into), and rewrite the base before sequencing against it.
5. **Per-run roster override:** accept an optional roster override
   (`pattern-agent-orchestration.md` §4) that shadows the manifest `tierRoster` for this run only.
   Phase 5 resolves tiers against this effective roster; Phase 6 records the override on the board
   so the run is reproducible.

### Phase 2: Harvest ticket metadata
1. Scan ticket files as `backlog-status.md` does (`docs/working/TICKET-*.md`, plus
   `docs/backlog/TICKET-*.md` where the project keeps one).
2. For each ticket, read the bold-line fields defined in `pattern-agent-orchestration.md` §2:
   `**Status**`, `**Depends**`, `**Files**`, `**Agent Tier**`, `**Verify**`,
   `**Parallel-safe-with**` / `**Conflicts-with**`, and any `**Complexity-note**` — the note
   overrides a cheap-looking `**Files**` line when sizing a lane's real long pole.
3. A ticket missing `**Files**` or a tier cannot be scheduled into a parallel lane — do not invent a
   surface for it. If *most* of the set is untagged (an undecomposed backlog), stop and route to
   `orchestrate-decompose` — sequencing an untagged set is guesswork. If it's a lone straggler in an
   otherwise-tagged set, queue it solo at the end and flag the gap.

### Phase 2.5: Lane granularity — extract runnable slices into standalone tickets
1. A schedulable lane binds a worker branch to exactly **one standalone `TICKET-<slug>.md`**. Real
   backlogs carry multi-item tickets where only a *slice* is runnable now — a client-only
   sub-section inside a ticket otherwise blocked on a backend, a layout slice inside a
   device-gated ticket. Name the principle behind that last seam: it is the `**Verify**` axis
   (kernel §2) — the layout slice is machine-checkable while the rest of the device-gated ticket is
   not, so extract it so each emitted ticket carries a single Verify mode. Sequencing the slice
   without a ticket emits a lane no worker can be assigned to.
2. For each intended runnable unit, verify a standalone ticket exists carrying its own `**Files**`
   + `**Agent Tier**`. If the unit is a slice, **extract it**: write a new `TICKET-<slug>-<tier>.md`
   with the full §2 metadata, and add a parent→child pointer in the parent ticket so the remaining
   parent scope neither drifts nor double-schedules. Only then schedule it.
3. This is the one sanctioned ticket edit (see Constraints): a structural split preserving total
   scope. Silent scope or ordering mutation stays forbidden.

### Phase 2.6: Premise pre-flight — verify the ticket's premise still holds at HEAD
1. Before any ticket is scheduled into a wave, verify its premise still holds at HEAD: grep
   `CHANGELOG.md`, `docs/archive/**`, and `git log --oneline` for the ticket's ID/slug and the key
   symbols its Acceptance names.
2. Spot-check that the files/functions the ticket cites still exist (`git ls-files`, a targeted
   read) — a ticket can be premise-suspect even with no ID/slug hit if what it cites is gone.
3. A hit (the ticket's work already landed) or a dead citation (a file/function it names no longer
   exists) makes the ticket **premise-suspect**: mark it `blocked` on the board with the evidence,
   EXCLUDE it from the wave, and report it for human reconciliation — never schedule it.
4. Distinct from the base-verification in Phase 1.4, which checks the BASE (does the integration
   ref exist); this checks the ticket's WORK (does its premise still hold against that base).
   Cross-ref kernel §6's pre-flight clause (resume safety — pre-flight already-done work).

### Phase 3: Build the dependency DAG
1. **Explicit edges:** each `**Depends**` entry is an edge (dependency → dependent).
2. **Implicit edges:** intersect the expanded `**Files**` glob sets pairwise. Any non-empty
   intersection between two tickets *without* an explicit `**Parallel-safe-with**` waiver is a
   soft edge — they may not share a wave lane unless `orchestrate-partition` clears them.
   - *Accelerator:* code-graph / codebase-memory (`search_graph`, `trace_path`) to expand each
     surface with real import edges — predicted globs miss consumers.
   - *Fallback:* expand globs with `git ls-files` pattern matching, then `grep -l` for imports of
     each surface file. `**Files**` is a hypothesis (`pattern-agent-orchestration.md` §6) — the
     expansion is your first re-verification, not the last.
3. **Precedence edges (`must-precede`):** run `orchestrate-partition`'s Phase 2a declared-new-symbol
   pass over the **whole ticket set, here, before any wave is cut** — not per wave. (The per-wave
   partition call in Phase 5.2 happens *after* the sort and so can no longer change which wave a
   ticket lands in; precedence has to exist before the sort or it cannot bind.) Partition returns
   `must-precede <P> before <C> (symbol <name>)` for each pair where producer `P` declares a new
   exported symbol consumer `C` references — a symbol that exists in no file yet, which is exactly
   why items 1–2 are blind to it. Add each as a **hard edge `P` → `C` in this same DAG**, a peer of
   item 1's `**Depends**` edges. It is **not** a variant of item 2's soft edge; the two mechanisms
   stay distinct because they constrain different things:
   - a **soft edge** (item 2) is a *co-scheduling exclusion* — "not in the same lane". It
     constrains lane assignment **inside** a wave and asserts no order whatsoever.
   - a **`must-precede` edge** is *precedence* — `P`'s wave index must be strictly less than `C`'s
     (Phase 5.1). Both tickets may still run concurrently in wall-clock terms; what it forbids is
     `C`'s wave *opening* before `P` has **landed**, because `C` branches off a base that must
     already contain the symbol.
   Folding a `must-precede` edge into the soft-edge set is the specific defect to avoid: it would
   put the pair in different lanes of the **same** wave, which is precisely the arrangement that
   fails. A `must-precede` edge duplicating an existing `**Depends**` edge is a harmless no-op; one
   pointing *opposite* to a `**Depends**` edge is a contradiction and must surface as a cycle in
   item 4 — report it, never drop one side to make the sort succeed.
4. Cycle check: run a topological sort over the explicit and `must-precede` edges together. A cycle
   means contradictory `**Depends**` / `must-precede` lines — stop and report the cycle's tickets;
   never break it by silently dropping an edge.

### Phase 4: Detect the solo-first foundation
1. For every **ready** ticket (all deps satisfied), count how many *other* tickets' expanded
   surfaces intersect its own. Call this its fan-out.
2. A ready ticket whose fan-out covers **half or more of the remaining ready set (minimum 2)** is
   a **foundation**: shared code everyone rides. Force it to run **alone, as its own wave, ahead
   of its lane** — parallel workers then branch off the commit that contains it, instead of each
   colliding with it mid-flight.
3. If two ready tickets both qualify, order them by mutual dependency, else by `**Priority**`;
   each still runs solo. WHY: a foundation merged late forces N rebases; merged first it costs one
   serialized slot.

### Phase 5: Cut waves and lanes
1. Topologically sort the DAG into **waves**: wave N = all tickets whose dependencies — `**Depends**`
   edges AND `must-precede` edges (Phase 3.3) alike — are fully satisfied by waves < N. Foundation
   tickets are their own single-ticket waves (Phase 4). A `must-precede` consumer therefore lands in
   a strictly later wave than its producer *by construction*; there is no separate later pass that
   enforces the ordering, and none is needed.
2. Within each wave, hand the ready set to `orchestrate-partition`: it returns the concurrent-safe
   subset (the **lanes**), the watch-file heads-ups, the `must-precede` edge list, and the
   recommended isolation mode (`pattern-agent-orchestration.md` §5). Tickets it defers slide to the
   next wave. If this call surfaces a `must-precede` edge Phase 3.3 did not already hold (a ticket's
   `**Files**` or Decision lines changed mid-flight), it is a **new DAG edge, not a lane problem**:
   add it and re-cut from Phase 3.3 rather than patching the wave in place — a precedence discovered
   after the sort cannot be honoured by lane assignment.
3. Assign each lane a branch name from the manifest's `branchNamePattern` and a tier→model
   resolution from the **effective roster** — the per-run override when one was accepted
   (Phase 1), else the manifest `tierRoster` (`pattern-agent-orchestration.md` §4). Only a
   staff-tier, push-capable role integrates (§1 privileged-role gate).

### Phase 6: Write the Status Board (execute mode only — in `--preview`, print this instead of writing)
1. Write the plan to the manifest's `statusBoard` — the single queue-of-record. Per
   `pattern-agent-orchestration.md` §6 the orchestrator is its **only** writer; workers read it,
   never edit it.
2. Board rows: wave · lane · ticket · tier · branch · isolation mode · watch-files · **status** (from
   the §2 vocabulary — a ticket with a human-only Acceptance item starts flagged so it lands at
   `needs-human-verify`, never auto-`done`). Mark the foundation ticket's wave `solo-first` with a WHY.
   Also record: any per-run roster override in effect, the verified (or rewritten) integration
   base, every `must-precede` edge with its symbol (so `orchestrate-merge-train` can re-check the
   landing order against what actually merged), and — on a dirty planning-only pass — the in-flight
   tree state (Phase 1).
3. Release the orchestrator lock (`node "<kit>" lock release .`) only when handing off or
   completing — not between waves.

## Verification / Definition of Done

Diagnose-and-plan skill: it changes no product code, so the gate is evidence quality, not tests.

- [ ] Orchestrator lockfile was acquired before any board write, and its owner id recorded.
- [ ] The declared-new-symbol pass (Phase 3.3) ran over the **whole** ticket set before wave-cutting,
      and every `must-precede` edge it returned is in the DAG as a peer of `**Depends**` — none
      folded into the item-2 soft-edge (co-scheduling) set.
- [ ] For every `must-precede` edge, the written board shows the producer's wave index strictly less
      than the consumer's. This is checkable from the board alone, without re-reading the tickets.
- [ ] Topological sort completed with zero cycles over explicit **and** `must-precede` edges (or the
      run stopped with the cycle reported).
- [ ] Every schedulable ticket appears in exactly one wave/lane; unschedulable tickets are listed
      with the missing field named.
- [ ] Every lane binds to a standalone ticket file; any runnable slice was extracted per Phase 2.5
      with its parent pointer in place before scheduling.
- [ ] Every scheduled ticket passed the Phase 2.6 premise pre-flight — no ticket describing
      already-landed work entered a wave.
- [ ] The integration base passed `git rev-parse --verify` (or was rewritten and the rewrite noted
      on the board).
- [ ] Foundation detection ran on checkable facts (intersection counts), and any foundation ticket
      occupies a single-ticket wave ahead of its dependents.
- [ ] Each multi-ticket wave was partitioned by `orchestrate-partition`, and its isolation mode is
      recorded on the board.
- [ ] The Status Board at the manifest's `statusBoard` path contains the full plan and was written
      by this orchestrator only.

## Reflexion

- Did any pair land in the same lane on judgment alone? Re-run the set intersection — lanes are
  computed, never eyeballed.
- Would a model without code-graph tooling reach the same waves? If not, the fallback expansion
  was skipped — redo Phase 3 with `git ls-files` + `grep`.
- Did a `must-precede` edge get treated as a soft edge — same wave, different lanes? That is the
  exact failure the edge exists to prevent: the consumer branches off a base where the producer's
  symbol has never existed, and the wave only survives if the lanes happen to interleave favourably.
- Are the waves the same ones a run *without* Phase 3.3 would have produced? For a set where no
  ticket consumes a sibling's declared new symbol they must be identical — `must-precede` only ever
  adds edges. If they differ, an edge was invented from prose rather than read off a Decision line.

## Constraints

- Never mutate a ticket's scope or ordering — this skill orders tickets; scope belongs to the
  ticket owner. The ONE sanctioned exception is the Phase 2.5 structural extraction: splitting a
  runnable slice into its own ticket (full §2 metadata + parent→child pointer) preserves total
  scope and is required before a lane can exist. Silent rewrites remain forbidden.
- Single writer: only the lock-holding orchestrator writes the Status Board.
- `**Files**` stays a hypothesis end-to-end; merge-time re-scan with `git diff --name-only` is the
  merge-train's job, not a reason to skip expansion here.
- Prefer deterministic gates (`git status --short`, set intersection, topo-sort success) over
  model judgment at every decision point (`pattern-agent-orchestration.md` §8).
- Git discipline per `git-protocol.md`: fresh branch per worker, no stash, stop on conflict.

## Output

The wave/lane plan written to the manifest's `statusBoard`, plus a short summary to the user:
wave count, lane widths, the foundation ticket (if any) with its fan-out number, any
`must-precede` edges with the wave split they forced, deferred or unschedulable tickets, and the
per-wave isolation modes.
