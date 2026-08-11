---
status: ready
updated: <YYYY-MM-DD>
landed: []
---
<!-- Machine-readable status (pattern-agent-orchestration.md §2, "Status as DATA"). Generated views
     and the staleness checks in `agentkit check --hygiene` read THIS block, which is what retires
     hand-maintained status lines (one live commit had to fix 19 of them at once).
       status:        same vocabulary as the **Status** line below — ready → in-progress → reported
                      → merged, off-ramps blocked / needs-human-verify.
       updated:       the date this header last matched reality. Bump it when you change status.
       landed:        completion SHAs. VERIFY each is an ancestor of main (`git merge-base
                      --is-ancestor <sha> <main>`) BEFORE writing it — this field is machine-read,
                      so an unverified SHA here is worse than one in prose.
       supersedes / superseded-by: optional ticket filenames.
     The prose **Status** line below still works and still reads; the CLI accepts either. Keep both
     during migration — do not delete the prose form. -->

# TICKET-<nn> — <concise imperative summary of the outcome>

<!-- Canonical ticket scaffold. Field contract: .agent/rules/pattern-agent-orchestration.md §2
     ("Ticket metadata contract"). Copy this file, fill placeholders, delete the guidance comments.
     Filename convention: TICKET-<nn>-<slug>-<tier>.md
       - <nn>  = single-writer stable ID number (navigational identity only; NOT priority/sequence,
                 minted once by the human or the one decompose pass — never parallel-worker-minted).
       - <slug> = the UNIQUE key, lowercase-kebab.
       - <tier> = staff | senior | junior, last segment, so a wave's tier spread reads in one listing. -->

**Status**: ready
<!-- Vocabulary: ready → in-progress → reported → merged, plus off-ramps blocked / needs-human-verify.
     needs-human-verify = machine gate passed but an Acceptance item needs a human/device/staging check
     the worker cannot self-confirm; such a ticket is NOT done and the merge-train must not auto-land it. -->
**Priority**: P2 (<one-line why — the cost of not doing this>)
**Depends**: none
<!-- Foundation ticket + any real edge, by exact filename; "none" if truly independent. -->
**Agent Tier**: junior
<!-- How CAPABLE a model the ticket needs (staff | senior | junior), independent of **Verify**.
     Tier-from-boundedness: Decision + Acceptance fully bound the result → junior;
     judgment left open (ambiguity × blast radius) → senior/staff. Optional trailing (model hint: …). -->
**Verify**: machine
<!-- How done-ness is PROVEN (machine | browser | real-device | staging) — orthogonal to tier.
     Anything non-machine is declared HERE at decompose time, not discovered mid-wave. -->
**Files**: `<path/glob>`, `<path/glob>`
<!-- Predicted file surface as globs — a hypothesis re-verified at merge time, never trusted blindly. -->
**Complexity-note**: <omit unless needed>
<!-- Optional: one-line flag for cost the LOC/globs hide — a vendored/transplant that is a domain-coupled
     rewrite not a copy, or a heavy refactor near a shared surface, so the tier isn't mis-sized. -->
**Reserves**: <omit unless needed>
<!-- Optional: scarce sequential values this ticket claims (migration numbers, enum values, ports).
     Assigned at decompose/partition, never minted by workers; two tickets with intersecting Reserves
     must not run concurrently. -->
**Parallel-safe-with**: <TICKET-nn-slug-tier>, …
<!-- Orchestrator-verifiable hint: tickets whose Files surfaces are disjoint from this one. -->
**Conflicts-with**: none
<!-- Every known overlap you could not design away; name the ticket + the shared surface. -->

## Context
<!-- Why this ticket exists: the true state today and the gap. Anchor every finding to a selector,
     pattern, or function name — NEVER a bare line number; line numbers rot under concurrent edits.
     Write the current truth, gap, and user impact in clear, concise language. -->
<What is true now, what's wrong or missing, and where — referenced by symbol/pattern, not line no.>

## Decisions already made (guardrails — do NOT relitigate)
<!-- The fixed choices a worker must not reopen: API shape, naming, "do not touch X", verified facts.
     These bound the design space downward — the tighter they are, the lower the safe tier. -->
- <Guardrail 1 — a decision that is closed, with its reason if non-obvious.>
- <Guardrail 2>

## Plan
<!-- Ordered, concrete steps. Each maps to a file/change a worker can execute without re-deciding scope. -->
1. <Step>
2. <Step>

## Acceptance
<!-- Testable done-conditions — each maps to a command, assertion, or observable behavior (the ticket's
     slice of the graduated gate). "Works correctly" is not acceptance. Mark any human-only item —
     it makes **Verify** non-machine and terminates the ticket at needs-human-verify, not done. Keep
     one observable claim per checkbox. -->
- [ ] <Machine-checkable condition — e.g. `<pkg> run typecheck` clean.>
- [ ] <Behavioral/observable condition.>
- [ ] <Human-only item, if any — flag it here as the reason **Verify** is non-machine.>

## What we deliberately did NOT do
<!-- Name the plausible adjacent changes this ticket intentionally leaves out. This keeps scope
     implicit where the ticket is clear and explicit where omission could change the work. -->
- <Out-of-scope change, or "Nothing beyond the stated scope.">
