---
name: orchestrate-decompose
description: Use when a large ticket, accepted plan, or defined request needs independently assignable work units before parallel scheduling. Preserve outcomes while separating file ownership, dependencies, and proof responsibilities.
tier: core
verified-against: 2026-07-04
---

# Orchestrate Decompose

Design worker assignments around actual implementation seams. `orchestrate-sequence` orders the
result and `orchestrate-partition` tests its predicted independence. Shared assignment contracts
live in `pattern-agent-orchestration.md` §2; this skill owns the decomposition method.

## When to Use

- A monolith cannot be assigned usefully to one worker.
- Overlapping assignments need a new split before dispatch.

Use direct implementation for a bounded single task, sequence for an already defined set, and
partition for a proposed pairing. If consequential outcomes are undefined, resolve those unknowns;
use `plan-prd` for undefined product behavior, not as a prerequisite for research or CLI work.

## Approach

### Phase 1: Ingest and qualify the monolith

Read the caller's ticket, approved plan, embedded plan, or accepted brief without renaming it.
Extract the requested deliverables, exclusions, settled decisions, assumptions, dependencies, and
existing authority. Separate completed outcomes from remaining work using current evidence.

Decide whether the request is a preview or authoring. Preview returns proposed splits only.
Authorized authoring may create the requested tickets and parent pointers. Neither requires
publishing capability, a lock/board mutation, or configuration scaffolding; execution setup belongs
to the coordinator under kernel §§4–6.

### Phase 2: Find split seams from the codebase, not from imagination

1. Enumerate the relevant source and artifact surface. Use `rg --files`, targeted reads, and
   available shell equivalents. For structural discovery, compose `use-codegraph` when useful;
   it owns graph dependencies, freshness, and fallback. A graph is optional.
2. Map each deliverable to the subsystem, data contract, and resource it changes. Read imports,
   consumers, and shared config rather than assigning from headings in the brief.
3. Group changes that implement one coherent outcome. Split where another worker can proceed
   against a stable interface and verify a meaningful result after prerequisites are available.
4. For vendored/transplant work, inspect upstream imports, domain types, compatibility quirks,
   and testability before sizing it. Record hidden adaptation cost in `Complexity-note`.
5. Identify external/shared resources such as fixtures, databases, browser sessions, output
   directories, and migration slots. Worktrees do not isolate these.

Mixed machine, runtime, docs, or human proof is not a split seam by itself. Keep the behavior
together with owned proof lanes. Split a verification task only when that creates useful independent
work and preserves the parent outcome and final proof owner.

### Phase 3: Detect the solo-first foundation

Find shared contracts that several candidates need to consume: a schema, API, component, config,
token layer, or barrel. A dependency used by several tickets may deserve a foundation assignment
that establishes a stable interface before consumers launch. Record the evidence, not a fan-out quota.

Remove foundation-owned writes from riders and add explicit dependencies. If the changes cannot
form a coherent foundation, serialize the shared ownership or keep the coupled work together.
Do not invent a foundation merely because two footprints intersect.

### Phase 4: Emit each ticket with the full contract

Use `templates/TICKET-TEMPLATE.md` and kernel §2 rather than an embedded competing template.
For each ticket:

- Preserve accepted Decision lines, observable Acceptance, exclusions, and the source work identity.
  Include an embedded plan when sufficient; route unresolved design to the appropriate planner.
- Declare intended modify/create/delete/rename paths. Include both rename endpoints and assigned
  completion artifacts: ticket/header, report, and changelog fragment if worker-owned. Explicit new
  paths are valid before they exist; vague future globs remain uncertain.
- Declare new cross-ticket exports by module/path and export name, and name the consumer's required
  producer contract. For example: `exports makeStamp from preview/stamp.ts`; its consumer says
  `requires preview/stamp.ts::makeStamp from TICKET-preview-stamp-senior.md`.
- Record changes to existing protocols too: expected behavior/version, stable reads versus new
  behavior, and compatibility assumptions. A file-disjoint incompatible contract needs precedence
  or a combined assignment.
- Declare overlap hints, `Depends`, and `Reserves` with exact artifact/resource identity.
  Hints do not override a computed collision.
- Choose recipient tier by boundedness and consequence under kernel §1. Keep it separate from
  proof mode. Assign applicable proof lanes, owners, evidence targets, and blocked transitions
  under `foundation-testing.md`; required pending acceptance blocks completion and, by default,
  integration unless explicit policy assigns a later gate.

Do not give a worker an obligation to write a coordinator-owned file. Keep publication and cleanup
grants distinct from implementation scope.

### Phase 5: Right-size and conserve the outcome

Check each candidate can be implemented by its assigned owner after declared prerequisites, with
a useful acceptance result. Combine micro-tickets whose coordination cost exceeds their independent
value. Split wide ownership only at a real seam; file count or one-session duration is not a contract.

Map every parent outcome to child acceptance or an explicit deferred disposition. Carry all
exclusions and material decisions. Check aggregate behavior and operational proof still has an
owner; a collection of locally green children may omit the original user outcome.

Run or request `orchestrate-partition` over intended paths and resources. Resolve conflicts before
calling the set parallel-ready. Return unknown or unmet dependencies visibly.

### Phase 6: Write and hand off

Preserve existing stable single-writer IDs. For new tickets, use the project's naming/store
convention and check uniqueness across its active stores. Workers do not mint parallel ordinals.

In authoring mode, write the assigned artifacts and update authorized parent pointers only after
the child contracts preserve its remainder. Do not call the parent complete merely because it was
split. In preview, show those proposed writes without applying them.

Return exact ticket paths, dependencies, foundation rationale if any, declared overlap/resource
constraints, and outcome coverage to the scheduler. No worker dispatch is implied.

## Definition of Done

- Every child has a usable kernel §2 contract and explicit writable completion artifacts.
- Intended future paths and cross-ticket contracts are visible to partition.
- Parent outcomes, exclusions, and pending proof are conserved with a named final owner.
- Real prerequisites and unresolved assumptions remain visible; scope is not invented.
- Only requested authoring occurred, or the preview remained read-only.
