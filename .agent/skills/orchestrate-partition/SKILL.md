---
name: orchestrate-partition
description: "Compute file-surface disjointness for a ready ticket set — the concurrent-safe subset, watch-file heads-ups for shared surfaces, and the isolation-mode recommendation. Use when deciding which tickets may run in parallel and how isolated their workers must be."
tier: core
verified-against: 2026-07-04
---

# Orchestrate Partition

Given the **ready set** for one wave, decide — from checkable path-set facts, not vibes — which
tickets can run **concurrently**, which shared files need a **watch** heads-up, which pairs carry a
landing-order precedence (**`must-precede`**), and which isolation mode
(`pattern-agent-orchestration.md` §5) the wave should run under. This is the
disjointness engine `orchestrate-sequence` calls per wave; it can also run standalone to sanity-
check a proposed pairing. Shared contracts (ticket metadata, isolation modes, hypothesis rule,
manifest) live in `pattern-agent-orchestration.md` — delegate, don't restate.

## When to Use

- `orchestrate-sequence` handed you a wave's ready set and needs lanes + a mode.
- You are about to spawn two workers and want a deterministic answer to "can these two tickets
  safely share a tree?"
- A ticket's `**Files**` line changed mid-flight and the wave's disjointness must be recomputed.

## When NOT to Use

- Ordering, dependency, or foundation-detection questions → `orchestrate-sequence` (partition
  assumes ordering is already settled; it only slices one ready set). Phase 2a is not an exception:
  it *detects* a precedence and hands the edge over — it never assigns a wave number.
- Merge-time surface verification of a *finished* branch → the merge-train's re-scan
  (`pattern-agent-orchestration.md` §6); partition is the pre-flight, not the landing check.
- A single ticket — there is nothing to partition; run it.
- You are a worker: your lane and mode come from the Status Board; do not re-partition your own
  wave to justify a wider surface.

## Approach

### Phase 1: Expand each ticket's surface (hypothesis → path set)
0. **First-run scaffold (fail loud).** Confirm `.agentkit.json` has an `orchestration` block per
   `pattern-agent-orchestration.md` §4. Missing → STOP and scaffold it (print the starter block for
   the user to paste and confirm) before computing any partition — never silently assume it exists.
1. For each ticket, expand its `**Files**` globs (`pattern-agent-orchestration.md` §2) into a
   concrete file-path set: `git ls-files` filtered by the glob. Record set size per ticket.
2. Treat every set as a **hypothesis** (§6). An empty expansion is a red flag — the glob matches
   nothing that exists; return that ticket as *unpartitionable* rather than calling it disjoint.

### Phase 2: Grow surfaces with real edges
Predicted globs miss consumers and new deps; grow each set with evidence before intersecting.
1. *Accelerator:* code-graph / codebase-memory (`search_graph`, `trace_path`, `search_code`) —
   add each surface file's direct importers and imports to a **read-halo** around the write set.
2. *Fallback (always available):* `grep -l` for import/require of each surface file's basename
   across the repo to build the same read-halo; where a ticket already has a started branch,
   `git fetch origin <mainBranch>` first, then add `git diff --name-only <base>...<branch>` output
   to its **write set** — actual edits beat predictions. `<base>` is `origin/<mainBranch>` unless the
   ticket recorded a different base. **Fetch, then diff against `origin/<mainBranch>`; never trust the
   local ref** — a stale local `mainBranch` corrupts the write set, exactly as
   `worker-bootstrap`/`worker-report` guard against.
3. Keep write set and read-halo distinct per ticket. WHY: write∩write is a collision; write∩read
   is only a watch.

### Phase 2a: Declared-new-symbol pass (the surface no file holds yet)
Phases 1–2 can only ever see files that **already exist**: a glob expands against `git ls-files`, an
importer grep matches text on disk. A symbol a sibling ticket is *about to create* is therefore
invisible to both — it lives in no file, so both tickets look perfectly disjoint while one of them
needs the other's output to exist first. This pass reads the **tickets** instead of the tree; it is
static ticket-text parsing, never a live import graph, because the import it is looking for cannot
resolve yet by construction.
1. **Build the producer map.** For each ticket, parse its **Decision lines** and **new-file entries**
   for *declared* new exported symbols, recording `symbol → producing ticket` plus the declared
   destination file. `orchestrate-decompose` Phase 4 requires that declaration explicitly — those
   lines are this pass's only input contract, so a ticket that names no exports contributes nothing
   and cannot be inferred at. Do not guess a symbol from prose ("adds a preview helper"); an
   undeclared export is a decompose defect, and the honest move is to report the ticket as
   **low-confidence for Phase 2a** (Phase 5.1 already escalates the mode on low confidence).
2. **Cross-reference every sibling.** For each *other* ticket, scan its Decision/Acceptance text and
   its Phase-1 expanded surface files for a reference to any symbol in the map it does not itself
   produce. Each hit is a consumer, and yields one `must-precede` edge in Phase 3.4.
3. **Two producers of one symbol is a contradiction, not a precedence.** If two tickets declare the
   same exported symbol, classify that pair **collision** (Phase 3.3) and report it for
   re-decomposition — there is no ordering that makes two authors of one export safe.
4. **Additive by construction.** With an empty producer map, or a map no sibling references, this
   pass emits nothing and Phase 3's verdicts are identical to a run without it. Phase 2a only ever
   ADDS edges; it never rewrites a surface-derived disjoint/watch/collision classification.

### Phase 3: Pairwise classification (deterministic)
For every ticket pair, compute set intersections and classify:
1. **Disjoint** — write sets and read-halos share nothing → concurrent-safe, no caveats.
2. **Watch** — one ticket's write set intersects only the other's read-halo → concurrent-safe
   *with* an explicit heads-up: `watch file <path> between <A> and <B>` (the reader may need a
   rebase or re-read after the writer lands).
3. **Collision** — write sets intersect → NOT concurrent in a shared tree, regardless of any
   `**Parallel-safe-with**` hint; a hint never overrides a computed collision (hints may only
   *waive* a watch, never a collision).
4. **Must-precede** — a Phase-2a cross-reference hit: producer `P` declares a new exported symbol
   that consumer `C` references. Emit `must-precede <P> before <C> (symbol <name>)`. This is a
   **precedence, not an exclusion, and it does not replace the pair's surface verdict** — items 1–3
   still classify the two surfaces (typically **disjoint**, which is exactly why the pair looked
   safe), and the precedence rides alongside that verdict. Both lanes may run concurrently in
   wall-clock terms; what the edge forbids is `C`'s wave *opening* before `P` has **landed**. A
   `**Parallel-safe-with**` hint cannot waive it: the hint speaks to file surfaces, and these
   surfaces genuinely are disjoint. Partition does not order — the edge goes to
   `orchestrate-sequence` Phase 3.3, the only place wave numbers are assigned.

### Phase 3a: Reserves allocation (E — scarce sequential values)

For every ticket that declares a `**Reserves**` field (kernel §2):
1. Collect all `**Reserves**` claims across the ready set (e.g. "migration-slot: v4", "funnel-stage:
   checkout", "port: 3001").
2. Detect overlaps: any two tickets claiming the same scarce value (same migration number, same
   port) cannot run concurrently — classify at least one pair as **collision** (Phase 3.3) even if
   their file surfaces are disjoint. WHY: reserves are for values two workers cannot independently
   mint; a value collision is a shared resource, not a mere watch.
3. When distributing reserves across non-overlapping sets, assign each value to exactly one ticket
   and note the allocation on the Status Board so downstream `orchestrate-merge-train` can
   re-check against actual landed state.

### Phase 4: Select the concurrent-safe subset
1. Build the collision graph (tickets = nodes, collisions = edges). Greedily select an
   independent set, taking tickets in `**Priority**` order; collided leftovers are **deferred**
   back to the caller for the next wave.
2. Emit the watch-list for every kept *watch* pair — these lines go verbatim onto the Status
   Board (written by the orchestrator, never by this skill when run by a non-lock-holder).
3. **Split every `must-precede` pair across the subset boundary.** The edge is not a collision, so
   it never enters the collision graph and neither ticket is dropped from the wave set — but the
   producer and consumer cannot both sit in the *emitted* subset. Keep the **producer**; return the
   **consumer** as deferred with reason `must-precede`, naming the producer and the symbol. State
   the reason explicitly: a `must-precede` deferral is waiting on a **landing**, not on a surface,
   so unlike a collision deferral it is not resolved by a better lane assignment or a wider
   isolation mode. Emit every edge verbatim regardless of which side was kept —
   `orchestrate-sequence` Phase 3.3 is what turns the edge into a wave number.

### Phase 5: Recommend the isolation mode
Map the classification result onto `pattern-agent-orchestration.md` §5:
1. **`worktree`** if ANY of: a kept pair is *watch*-classified on a code (non-doc) file; any
   ticket's surface touches dependency manifests (`package.json`, lockfiles) or build/tooling
   config; any expansion was empty or low-confidence (fallback-only, high-fan-in area). Cost is
   per-worktree install — pay it when collision risk or dep drift is real.
2. **`shared-tree-disjoint`** only when every kept pair is fully **disjoint** including
   read-halos, and no ticket changes dependencies. Cheaper; safe only while provably disjoint.
3. State the deciding fact next to the recommendation (e.g. "worktree: T12 and T15 watch-overlap
   on a shared util barrel"). A mode without its reason is unauditable.
4. **Cost caveat on memory-constrained hosts.** On memory-constrained hosts (especially Windows +
   cloud-synced-synced trees), per-worktree installs plus concurrent type-aware lint/typecheck can
   invert the reliability calculus — `shared-tree-disjoint` run sequentially may be strictly more
   reliable than parallel `worktree`. The fail-closed default in Constraints still stands for
   high-collision waves (escalate toward `worktree`, never away from it on uncertainty); on a
   genuinely low-collision wave, state this host cost as part of the Phase 5.3 deciding fact rather
   than defaulting to `worktree` by reflex.

### Worked fixture — the pair Phase 2a exists for
Two tickets, no `**Depends**` between them, file-disjoint on every surface either one can see. This
is the live failure shape the pass closes; a run that cannot reproduce these outputs has not
implemented Phase 2a.

```text
TICKET-alpha-preview-checkpoint-senior
  Files:    preview/**
  Decision: exports generatePreviewCheckpoint from a NEW file preview/checkpoint.ts

TICKET-beta-run-summary-senior
  Files:    summary/**
  Decision: the run-summary header calls generatePreviewCheckpoint for its stamp

Phase 1   alpha -> {preview/panel.ts}          beta -> {summary/view.ts}
          checkpoint.ts does not exist, so no glob expands to it
Phase 2   read-halos disjoint — no importer grep can match a file that is not on disk
Phase 2a  producer map:  generatePreviewCheckpoint -> alpha
          beta's Decision text references it and beta does not produce it  => hit
Phase 3   items 1-3:  disjoint  (write sets and read-halos share nothing) — UNCHANGED
          item 4:     must-precede alpha before beta (symbol generatePreviewCheckpoint)
Phase 4   collision graph is still empty; alpha is kept, beta is deferred with
          reason must-precede (NOT collision), and the edge is emitted verbatim

handed to orchestrate-sequence Phase 3.3 -> Phase 5.1
          wave 1 = alpha        wave 2 = beta        wave(alpha) < wave(beta)
```

**Regression statement.** Delete beta's Decision reference — now no ticket references a declared new
symbol it does not produce — and Phase 2a's cross-reference yields zero hits, zero `must-precede`
edges, and the pair's `disjoint` verdict, the kept subset, the watch-list and the isolation mode are
byte-for-byte what Phases 1–5 produced before this pass existed. That is the invariant: **Phase 2a is
purely additive**; disjoint/watch/collision behavior for a set with no declared-new-symbol
cross-reference is unchanged.

## Verification / Definition of Done

Diagnose-only skill: it changes no files except (when run BY the lock-holding orchestrator) the
Status Board rows it feeds to `orchestrate-sequence`. Evidence bar:

- [ ] Every ticket's surface was expanded to a concrete path set; empty expansions are reported
      as unpartitionable, not silently dropped.
- [ ] Every pair carries a classification (disjoint / watch / collision) derived from set
      intersection — the sets, not the verdicts, are what a reviewer could re-run.
- [ ] Phase 2a ran and its **producer map is stated** — `symbol → producing ticket` for every
      declared new export in the set. An empty map is a valid result, but it must be *reported* as
      empty, not omitted: silence is indistinguishable from a skipped pass.
- [ ] Every `must-precede` edge names producer, consumer, AND the symbol that induced it. An edge
      without its symbol is unauditable — a reviewer cannot re-derive it from the tickets.
- [ ] Every `must-precede` pair still carries its own surface verdict (normally `disjoint`); no such
      pair was silently upgraded to `collision` or downgraded to `watch`. Both are wrong: a
      collision would strand the consumer, a watch would let it co-schedule with its producer.
- [ ] Any ticket whose new exports could not be read off Decision lines is reported as
      low-confidence for Phase 2a rather than assumed to declare none.
- [ ] No collision pair remains in the concurrent subset; no hint overrode a computed collision.
- [ ] Each watch pair has an explicit `watch file <path> between <A> and <B>` line.
- [ ] The isolation-mode recommendation names its deciding fact and matches §5's criteria.
- [ ] Deferred tickets are returned to the caller with the colliding counterpart named, and each
      deferral states which kind it is — `collision` (a shared surface) or `must-precede` (a
      pending landing). The two resolve differently, so an unlabelled deferral is a defect.

## Reflexion

- Could a model without code-graph tools reproduce this partition? If any classification rests on
  accelerator-only evidence, re-derive it via the grep fallback before shipping the plan.
- Did any "disjoint" verdict skip the read-halo? Import edges are exactly what static `**Files**`
  globs miss — that shortcut is how shared-tree corruption happens.
- Did any pair read as `disjoint` mainly because *both* sides are creating new files? That is the
  Phase 2a blind spot exactly: nothing on disk can contradict you. Re-read both tickets' Decision
  lines for a declared export one of them consumes before shipping that verdict.
- Did a `must-precede` edge quietly become something else? Turned into a collision it strands the
  consumer for a surface conflict that does not exist; folded into `orchestrate-sequence`'s soft
  edges it becomes a mere co-scheduling exclusion with no ordering, and the consumer can still
  branch off a base where the symbol has never existed. Neither is the edge's semantics.
- Is every `must-precede` edge traceable to a *declared* symbol, or did one come from inferring
  intent out of a ticket's prose? An inferred edge is a guess wearing a deterministic edge's
  clothing — the fix belongs upstream in `orchestrate-decompose` Phase 4, not here.

## Constraints

- Never edit `TICKET-*` files or worker branches; partition observes and recommends.
- Single-writer rule holds: only the lock-holding orchestrator writes the Status Board
  (`pattern-agent-orchestration.md` §6). Standalone runs return results as output only.
- Deterministic gates over judgment (§8): intersections are computed with real path sets;
  `git diff --name-only` re-scan at merge time still happens regardless of this pre-flight.
- Fail closed: uncertain or unexpandable surfaces escalate the mode toward `worktree` and shrink
  the concurrent subset — never the reverse.
- Git discipline per `git-protocol.md` (fresh branches, no stash, stop on conflict).

## Output

For the given ready set: the concurrent-safe subset (lanes), the watch-list lines, the
**`must-precede` edge list**, the deferred tickets with their counterparts and deferral kind, and
one isolation-mode recommendation with its deciding fact — handed back to `orchestrate-sequence`
for the Status Board.

The classification vocabulary is four terms, and the fourth is a different *kind* of statement from
the first three:

| Verdict | What it asserts | Effect |
| :--- | :--- | :--- |
| `disjoint` | surfaces share nothing | concurrent, no caveat |
| `watch` | one write set meets the other's read-halo | concurrent + a heads-up line |
| `collision` | write sets intersect | not concurrent in a shared tree |
| `must-precede` | `P` declares a new export `C` consumes | surfaces stay disjoint; both may run; `P` must **land** before `C`'s wave opens |

`must-precede` lines are emitted as `must-precede <P> before <C> (symbol <name>)` and consumed by
`orchestrate-sequence` Phase 3.3 as a peer of `**Depends**`. **Upstream dependency:** the edge is
only as complete as the tickets' Decision lines — `orchestrate-decompose` Phase 4 requires every new
exported symbol to be declared by name, and Phase 2a can detect nothing that was never declared.
