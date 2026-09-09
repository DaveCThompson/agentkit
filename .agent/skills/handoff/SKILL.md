---
name: handoff
description: Prepare a handoff for another agent, developer, or future session. Use when work must continue elsewhere with its accepted scope, decisions, evidence, and authority intact.
tier: core
---

# Handoff Skill

Give the recipient enough context to continue the requested work without reopening settled choices.
Reuse the caller's work item or approved plan, including an embedded plan. A handoff is not
implementation or publication authority by itself.

## When to Use

- Another person, agent, or future session will continue the work.
- The recipient needs a concrete assignment or a recovery handoff after partial work.

If work continues in this session, keep working unless a durable handoff is requested. Use
`orchestrate-decompose` to split a monolith and a review skill to assess finished work.

## Approach

### Phase 0: Calibrate recipient support and task risk

Use `pattern-agent-orchestration.md` §1 for capability tiers. Choose detail from the recipient's
needs, uncertainty, and consequences separately. A capable recipient on a security-sensitive task
needs invariants, threat cases, evidence gaps, and action boundaries; risk alone does not require
a junior implementation pack. An external contractor is not necessarily a junior.

Default to a lean handoff. Add guided execution detail when the recipient or task calls for it.
Explain that choice only when it materially changes the deliverable.

### Phase 1: Preserve the request

Read the accepted brief, current implementation or evidence, and later decisions. Carry forward:

- The requested deliverable, user impact, outcomes, and exclusions.
- Settled decisions and material assumptions, keeping stated, inferred, and accepted claims distinct.
- Completed work and remaining acceptance. On resume, check whether later decisions or current
  behavior supersede any proposed step.
- Existing action/target grants and the earliest permitted exit: advice, diagnosis, preparation,
  implementation, integration, publication, or cleanup.
- Predicted files and resources, dependencies, and useful compatibility constraints.

Verify environment-coupled literals that affect execution: repository paths, config keys, ignore
patterns, ports, URLs, and command names. Mark unverified literals as unresolved and name how to
check them. Intended new paths are declarations, not missing existing files. Do not include
credentials or private machine details in ship-safe content.

Map consequential acceptance to applicable proof and its owner under `foundation-testing.md` §1.
Name the pending check and transition it gates. Do not equate a command's success with full outcome
coverage or require irrelevant proof lanes.

### Phase 2: Prepare one usable assignment

Use `templates/TICKET-TEMPLATE.md` when creating a ticket; `pattern-agent-orchestration.md` §2
owns its fields and `pattern-docs-artifacts.md` owns storage and status. Keep valid existing IDs
and filenames. Do not create a companion plan merely to satisfy a template.

For delegated work, resolve the kernel's assignment revision, deliverable kind, writable outputs,
base/target, and delivery contract. Include ticket/status and fragment/report paths only when the
recipient owns them; otherwise name their owner. An ignored ticket is not delivered by pushing a
branch. Supply the accepted content through an authorized accessible path or payload and confirm
the recipient can read it.
For another checkout/computer, name required local kit/tool setup separately from portable project
intent. Preserve inherited ownership, pending operation records and ignored evidence through a
verified authorized transfer. A hash establishes identity, not recipient access. Reuse proof only
while its source and environment premises match; a changed storage location alone requires no rerun.

Keep decisions, acceptance, and gotchas visible before execution detail. Cite exact artifact
filenames in sequencing tables. Use selectors or headings for source references, with line numbers
only as additional hints. Apply `write-clear` for wording.

### Phase 3: Add guided detail where it removes ambiguity

For a recipient needing more support, add the file order, integration points, and concrete examples
that prevent plausible mistakes. Include complete snippets only when they are useful and verified
against the actual imports, types, and runtime. Do not prewrite the entire solution by default.

Give tests discriminating assertions and fixtures: what failure they expose, what valid behavior
they retain, and where the runner collects them. Preserve before/after evidence requirements for
bug repairs and the bounded alternative-proof route in `foundation-testing.md` §1A. A new
detection gate needs a meaningful violating fixture, not ritual sabotage of every expectation.

Probe relevant failure modes: order-dependent calls, absent data, compatibility, interruption,
and reuse in another context. A diagram helps when the data flow or ownership is otherwise unclear.
Record residual uncertainty; do not claim there are no assumptions.

Keep execution detail in the same artifact unless a substantial, separately useful plan improves
navigation. Link any split both ways and preserve one owner of the accepted contract.

### Phase 4: Deliver at the requested boundary

For preparation-only work, return the artifact or proposed assignment without launching workers,
acquiring a coordination lock, changing a board, or requiring publishing capability. Continue later
actions only when already authorized. A resumed handoff includes the retained state, useful failed
proof, active/terminated attempt information where applicable, and the next owner/action.

## Definition of Done

- The recipient can locate and read the accepted input and identify the work that remains.
- Scope, exclusions, decisions, authority, and proof obligations survived the handoff.
- Material literals are verified or explicitly unresolved; support detail addresses real uncertainty.
- The requested handoff is delivered without implying execution, integration, or publication.
- Durable output ends with `What we deliberately did NOT do`.
