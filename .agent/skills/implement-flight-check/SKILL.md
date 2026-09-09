---
name: implement-flight-check
description: Check whether accepted work is ready to implement or resume. Use when scope, current targets, remaining plan premises, or required environment/proof capabilities need reconciliation before editing.
tier: core
---

# Flight Check Skill (Pre-Implementation)

Return actionable readiness for the requested work. Reuse the caller's accepted ticket, plan,
embedded plan, or clear instruction; do not require a second artifact or a filename change.
`foundation-testing.md` owns proof validity and lifecycle gates.

## When to Use

Before implementation or after an interruption changes relevant scope, source, or environment.
Consume valid prior readiness from onboarding/bootstrap; refresh changed facts rather than replaying
the whole checklist.

## Approach

### 1. Context Loading

Read the accepted outcome, exclusions, decisions, assumptions, and Acceptance from the caller's
actual work identity. Inspect later accepted decisions and completed phases. Identify remaining
valid work and any conflicting premise. Do not treat a historical plan step as current merely
because its target still exists.

Check authority for the requested deliverable and affected resources. Routine choices inside
accepted scope can proceed. A material conflict or new action/target needs direction only if
existing authority does not settle it.

### 2. File Reconnaissance

Read the current target files and relevant governing contracts through available file tools.
Verify existing paths, intended new destinations, imports, and observable contracts the plan depends
on. New files are legitimate; absent existing targets need investigation.

Observe repository/branch and owned dirty state where relevant. Preserve concurrent work; global
cleanliness is not a precondition for disjoint authoring. Shared-tree Git and ownership checks
belong to `git-protocol.md` and the kernel's isolation contract.

### 3. Safety Check

Resolve the project's actual validation commands and required environments from acceptance,
configuration, and prior evidence. A CLI/docs task does not need a server, browser, or nonexistent
lint script. If a runtime lane requires a server, inspect its owner and state before provisioning;
reuse a suitable running instance and do not restart a shared one.

Use `foundation-browser-usage.md` for runtime capability policy. Optional discovery tools do not
gate readiness. Dependencies need installation only when required, authorized, and owned by this task.

Reuse valid baseline evidence under `foundation-testing.md` §1A or collect missing focused checks.
Record known failures, uncertainty, and the actions they block. An unrelated failed check is not
authority to repair unrelated code; absence of required proof is not a pass.

### 4. Readiness result

Return a concise readiness disposition, not a new ticket-status enum:

- Ready: remaining scope, targets, authority, and required capabilities are established.
- Ready with limits: identify what can proceed independently and the exact pending proof/action,
  its owner, and the transition it blocks.
- Blocked: identify the material missing input, conflicting premise, or capability and the next
  useful action. Preserve useful partial work and failing evidence.

Pass the same work identity, remaining outcomes, evidence references, and limitations to the
implementer. No timestamp expiry, mandatory reapproval, installation, or server startup is implied.

## Definition of Done

The implementer can identify the valid remaining work, inspected targets, applicable proof,
known baseline limitations, and any blocked transition without repeating readiness discovery.
