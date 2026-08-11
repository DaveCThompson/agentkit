---
name: orchestrate-decompose
description: "Use when a big/undecomposed ticket or feature must be split into parallel-ready, metadata-tagged tickets before orchestration. Turns one monolith into N collision-minimal tickets carrying the full ticket-metadata contract, then hands off to orchestrate-sequence."
tier: core
verified-against: 2026-07-04
---

# Orchestrate Decompose

The **front-end of the orchestration pipeline**: take one monolithic ticket, feature request, or
approved `PLAN-*` and split it into N tickets that are *born* parallel-safe — disjoint `**Files**`
surfaces, explicit `**Depends**` edges, a solo-first foundation carved out, and every field of the
ticket-metadata contract (`pattern-agent-orchestration.md` §2) filled in. Downstream,
`orchestrate-sequence` orders what you emit and `orchestrate-partition` verifies disjointness —
this skill is the inverse of partition: partition *analyzes given* tickets; decompose *designs*
tickets to be disjoint in the first place. Shared contracts (tiers, metadata, gates) live in
`pattern-agent-orchestration.md` — delegate, never restate.

## When to Use

- A single large ticket (e.g. a `TICKET-mobile-experience` monolith) was pointed at
  `orchestrate-sequence` and bounced: it consumes *ready, decomposed* tickets, not epics.
- A feature request or approved `PLAN-*` is too big for one worker and must become a parallel wave.
- An existing ticket's scope has grown until its `**Files**` surface collides with everything —
  it needs re-splitting before any orchestration is honest.

## When NOT to Use

- Tickets already carry `**Files**`/`**Depends**`/`**Agent Tier**` and just need ordering →
  `orchestrate-sequence`.
- A single small change (≤30 lines, ≤5 files) → `implement-quick-fix`; one medium well-bounded
  change → `plan-feature` then `implement-feature`. Orchestration overhead exceeds the work.
- The user problem, states, or interaction model are still undefined → `plan-prd` first. You
  cannot decompose a feature nobody has defined — splits made against an imagined UX are rework.
- You need file-surface disjointness for tickets that already exist → `orchestrate-partition`.

## Approach

### Phase 1: Ingest and qualify the monolith
0. **First-run scaffold (fail loud).** If the project's `.agentkit.json` has no `orchestration`
   block, scaffold it FIRST (kernel §4) — before decomposing; every downstream skill fail-louds on
   its absence.
1. Read the input — a `TICKET-*`, a feature request, or an approved `docs/working/PLAN-*.md`.
2. **Definition gate:** if the problem/UX is not pinned (no acceptance criteria, states, or scope
   boundary anywhere), stop and route to `plan-prd`. Decomposing an undefined feature produces
   confidently-wrong tickets.
3. Extract the deliverable list: every user-visible outcome and every technical prerequisite the
   monolith names. This list, not the prose, is what gets partitioned.

### Phase 2: Find split seams from the codebase, not from imagination
Split along two seam classes. The primary is **file-surface / subsystem boundaries** so tickets are
collision-minimal by construction — disjoint `**Files**` where possible. The second is the
**verification-mode seam**: where machine-checkable proof ends and device/staging/visual proof
begins (kernel §2's `**Verify**` axis) — a deliverable straddling both is two tickets, not one.
1. *Accelerator:* code-graph / codebase-memory (`get_architecture` for module boundaries,
   `search_graph` / `trace_path` to find which subsystems each deliverable touches and where
   import edges cross).
2. *Fallback (always available):* map the terrain with shell —
   `git ls-files 'src/**' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn` to see subsystem
   directories, then `grep -rl <symbol-or-feature-term>` per deliverable to find its real file
   footprint. Never split on a boundary you haven't seen in the tree.
3. Assign each deliverable to the subsystem(s) it touches. Deliverables landing in the same
   subsystem merge into one candidate ticket; a deliverable spanning two subsystems either splits
   along the seam or declares the overlap explicitly (Phase 4).
4. **Verification-mode seam:** for each deliverable, name how its done-ness will be proven —
   machine-checkable (typecheck/test/build) or device/staging/visual. A deliverable whose proof
   spans both splits at that seam even when its file surface stays inside one subsystem — Phase 5's
   "Mixed-verification ⇒ split" rule sizes the resulting tickets.

### Phase 3: Detect the solo-first foundation
1. Look for the shared surface several candidates all ride: a shared component, config, type/
   schema file, token layer, or barrel that appears in ≥2 candidates' footprints.
2. Carve that surface into its **own foundation ticket**. Every rider then lists it in
   `**Depends**` and *drops the shared files from its own `**Files**` line*.
3. WHY: `orchestrate-sequence` will detect a foundation by fan-out and run it solo-first — workers
   branch off the commit that contains it. Authoring it as an explicit ticket here is what turns a
   guaranteed merge pile-up into one serialized slot; leaving it smeared across N tickets forces N
   rebases and a collision-classified wave.

### Phase 4: Emit each ticket with the full contract
Write every ticket so downstream skills need zero guessing — a complete ticket is what lets a
lower-tier worker run safely. Scaffold each ticket from `templates/TICKET-TEMPLATE.md` (the canonical
§2 field layout) so no field is synthesized by hand. Each ticket carries:
- `**Status**: backlog|ready` · `**Priority**` · `**Depends**:` (foundation + any real edge).
- `**Agent Tier**: staff|senior|junior` — chosen by *ticket shape* per
  `pattern-agent-orchestration.md` §1: ambiguity × blast radius × how completely your Decision +
  Acceptance lines bound the outcome. A mechanical, fully-bounded ticket is junior even if the
  epic was scary.
- `**Verify**: machine|browser|real-device|staging` (kernel §2) — how done-ness is *proven*,
  declared per ticket NOW. Any gesture/visual/real-device Acceptance item makes the ticket
  non-`machine`; declaring it at decompose time sets the tier expectation and the merge-train's
  `needs-human-verify` hold from the start, instead of a mid-wave discovery.
- `**Verification lanes**:` (kernel §2) — the upfront owner/evidence map for `machine`, `runtime`,
  `human`, `docs`, and `landing`; mark every lane `complete`, `pending`, or `not applicable` only
  when its owner and evidence target are named. Project profiles may add project-owned lanes.
- `**Files**:` — predicted glob surface from the Phase 2 footprint. A hypothesis, re-verified at
  merge time (kernel §6) — but make it an honest one: globs you saw expand, not directories you hope.
- `**Complexity-note**:` (kernel §2) — for any **vendored/transplant** unit, READ the upstream
  file's real coupling (imports, domain types) *before* sizing. A "vendor X" line that is a
  domain-coupled rewrite, not a copy, undersells cost in `**Files**` — a real mis-tiering made the
  long pole look cheap. Name the hidden cost here so `orchestrate-sequence` sizes the tier from
  coupling, not text.
- `**Parallel-safe-with**:` / `**Conflicts-with**:` — declare every known overlap you could not
  design away. An undeclared overlap is a defect; a declared one is a watch-list entry.
- **Decision lines** — the guardrails a worker must not cross (API shape, naming, token choices,
  "do not touch X"). These bound the design space downward, enabling a lower tier.
  **Declare every new exported symbol the ticket will create — by name, with its destination file —
  one Decision line per export** ("exports `generatePreviewCheckpoint` from a new file
  checkpoint.ts"). This is a requirement, not a style preference: `orchestrate-partition`'s Phase 2a
  builds its `symbol → producing ticket` map by parsing exactly these lines, and it is the *only*
  signal that can see a symbol before any file contains it — a glob expansion and an importer grep
  both read files that already exist. An undeclared new export is therefore invisible to partition,
  a sibling ticket that consumes it gets classified `disjoint`, and the two are co-scheduled into
  one wave with the consumer branching off a base where the symbol has never existed. Declaring it
  is what lets partition emit the `must-precede` edge that splits the wave. Symmetrically, when a
  ticket's work *consumes* a symbol a sibling is creating, name that symbol in its Decision or
  Acceptance text — the cross-reference needs both ends.
- **Acceptance** — a testable done-condition list: each item maps to a command, assertion, or
  observable behavior forming that ticket's slice of the graduated gate (`foundation-testing.md`).
  "Works correctly" is not acceptance; "`npm run typecheck` clean + nav renders at 375px" is.
  **Mark any human-only item** (real device, staging, visual QA the machine gate can't cover) — it
  is what makes the ticket's `**Verify**` mode non-`machine`, and a ticket carrying one terminates
  at `needs-human-verify`, not `done` (kernel §2/§6). Setting that expectation at decompose time is
  what stops the merge-train from later auto-greening it.

For any ticket whose internals still need real design before a worker can start, compose
`plan-feature` (medium, requirements clear) or `plan-architecture` (cross-cutting, data models)
and link the resulting `PLAN-*` from the ticket. Do not inline a full design doc into a ticket.

### Phase 5: Right-size the set
Sizing heuristic — apply to every candidate before writing it:
- **Independently implementable:** one worker, one branch, no mid-flight handoff to a sibling.
- **Independently verifiable:** its Acceptance list runs green without any sibling ticket landed
  (foundation excepted — it lands first by construction).
- **Too granular** if coordination cost dominates: two tickets that always change together, share
  reviewers, and ship in one commit are one ticket. Merging N micro-tickets costs N gate runs and
  N branches for one logical change.
- **Too coarse** if its `**Files**` surface intersects a sibling's, or a worker could not finish
  it in one focused session. Split along the seam the overlap reveals.
- **Mixed-verification ⇒ split.** If a candidate's Acceptance spans machine-checkable AND
  device/staging proof, split at that seam so each emitted ticket carries a single `**Verify**`
  mode. WHY: a mixed ticket cannot terminate cleanly — its machine half is mergeable immediately
  while its human half holds the whole row at `needs-human-verify`, so the merge-train blocks
  landed green work behind a pending device check; splitting yields one `merged` row and one
  honestly-parked row.
- Target shape: each ticket ≈ one `implement-feature` run (roughly 1–5 files of change). When in
  doubt, prefer slightly coarser — merge cost is real, split cost is a later re-run of this skill.

### Phase 6: Write and hand off
1. Write tickets per the four-directory docs model (`pattern-docs-artifacts.md`), naming each
   **`TICKET-<slug>-<tier>.md`** — the tier is the last segment (`TICKET-mobile-nav-staff.md`,
   `TICKET-analytics-events-junior.md`), so the whole wave's tier spread is legible in one file
   listing (kernel §2). **The slug is the unique key — never add a numeric prefix or counter**
   (`TICKET-01-…`): under parallelism two agents independently grab the same next number (a real
   collision happened). Slug-only names collide only when scope genuinely overlaps — the defect you
   *want* surfaced. `docs/backlog/` for not-yet-started work, `docs/working/` only for what starts
   now. Flat, no nesting; lowercase-kebab keeps it taxonomy-clean.
2. Mark the source monolith superseded: point it at the emitted ticket names; do not delete it
   silently.
3. Hand off to `orchestrate-sequence` — it will DAG, foundation-order, and wave the set, calling
   `orchestrate-partition` per wave. Report the emitted ticket list (exact filenames:
   `TICKET-37-mobile-nav-staff.md`, never "wave-2: mobile"), the foundation ticket, and any
   declared overlaps so the orchestrator starts with your collision map, not a cold read.

## Verification / Definition of Done

Authoring-only skill: it changes no product code, so the gate is contract completeness — every
downstream skill must be able to consume the output with zero guessing.

- [ ] Every emitted ticket carries the full §2 contract: `**Status**`, `**Priority**`,
      `**Depends**`, `**Agent Tier**`, `**Verify**`, `**Verification lanes**`, `**Files**`,
      `**Parallel-safe-with**`/`**Conflicts-with**` — plus a `**Complexity-note**` on any
      vendored/transplant or hidden-coupling ticket, written after actually reading the upstream
      source.
- [ ] Each emitted ticket declares exactly one `**Verify**` mode — no ticket's Acceptance mixes
      machine-checkable and device/staging/visual proof (Phase 5's Mixed-verification split).
- [ ] Ticket filenames are slug-only (`TICKET-<slug>-<tier>.md`, no numeric counter); each slug is
      unique across `docs/backlog/` + `docs/working/`.
- [ ] Every emitted ticket has Decision lines and a testable Acceptance list; no ticket's
      done-condition is a vibe.
- [ ] Every new exported symbol any emitted ticket will create is declared by name on a Decision
      line, with its destination file — `orchestrate-partition` Phase 2a reads nothing else, so an
      undeclared export cannot produce the `must-precede` edge that keeps its consumer out of the
      producer's wave.
- [ ] Pairwise `**Files**` surfaces are disjoint, OR each overlap is declared in
      `**Conflicts-with**` — no silent intersections. Spot-check with `git ls-files` expansion.
- [ ] If ≥2 tickets rode a shared surface, a foundation ticket exists and every rider `**Depends**`
      on it.
- [ ] Tier choices trace to ticket shape (ambiguity × blast radius × boundedness), not to the
      epic's original scariness.
- [ ] Tickets landed in `docs/backlog/` / `docs/working/` per the docs model; the source monolith
      points at its successors.

## Reflexion

- Could `orchestrate-partition` classify every pair from these tickets *as written*, without
  asking you anything? If not, a `**Files**` line or overlap declaration is missing.
- Could it build its Phase 2a producer map from these Decision lines alone? A ticket that says "adds
  a preview helper" without naming the export answers no — and the sibling that imports that helper
  will be classified `disjoint` and scheduled alongside it.
- Did any split come from the feature's prose structure instead of the tree? Re-run Phase 2 —
  seams live in the codebase, not the requirements doc.
- Would a junior-tier worker, given only one ticket, know exactly where to stop? If not, the
  Decision lines are too thin for the tier you assigned.

## Constraints

- Author tickets only — never implement, never edit product code, never write the Status Board
  (that is the lock-holding orchestrator's, `pattern-agent-orchestration.md` §6).
- `**Files**` lines are hypotheses grounded in observed paths; never invent globs for directories
  you did not enumerate.
- Deterministic gates over judgment (kernel §8): footprints come from code-graph or
  `git ls-files` + `grep`, and every accelerator step states its shell fallback.
- Do not decompose an undefined feature — route to `plan-prd`; do not orchestrate a single small
  change — route to `implement-quick-fix`.
- **Sequencing tables cite exact filenames (W2-1):** any sequencing/wave table the decompose output
  contains must name the exact artifact filename/slug (`TICKET-37-mobile-nav-staff.md`), never an
  invented "wave+number" key the reader cannot find by directory listing. A table row that says
  "Wave-2: auth" is defective — write "`TICKET-37-mobile-nav-staff.md`: auth refactor" instead.
- Git discipline per `git-protocol.md` if any branch work is needed (fresh branch, no stash).

## Output

N `TICKET-*.md` files in `docs/backlog/` (or `docs/working/`), each carrying the full §2 metadata
contract plus Decision lines and Acceptance; a named foundation ticket where one exists; the
superseded monolith annotated; and a handoff summary for `orchestrate-sequence` listing tickets,
dependencies, and declared overlaps.
