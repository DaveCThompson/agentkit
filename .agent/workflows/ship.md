---
description: Deliver one ticket against its accepted contract and close out its actual state truthfully.
---

# Ship Workflow

Resolve the existing ticket, its revision, decisions, exclusions, acceptance and current authority.
Reconcile prior work and remaining intent. Do not replace the work item, assume every ticket is a
feature, or equate the command name with a blanket push/deploy grant.

## Route the work

Use `implement-flight-check` for applicable readiness, then choose the needed method:
`implement-feature` for accepted feature work, `implement-quick-fix` for bounded changes,
`implement-refactor` for structural preservation, or `debug-standard` / `debug-deep` for
unresolved defects. A test-only or report-only ticket retains that boundary.
`worker-execute` applies only to an actual parallel-worker assignment under the orchestration
contract; it is not the default solo implementation loop.

## Verify and close out

The selected skill owns execution; `foundation-testing.md` owns applicable proof. Compare the
result to every accepted outcome and preserve pending lanes with owner, evidence gap and next
action. Update the canonical status field under `pattern-docs-artifacts.md`; a reported local
deliverable, integrated commit and published result are distinct.

Use `implement-session-wrap-up` for scoped local closeout, carrying the current receipt. Archive
only eligible completed work, or preserve an explicit successor for an accepted remainder.
Do not force `Done`, invent a commit SHA, publish ignored evidence, or rewrite all referencing
documents merely to make status appear final. Use `/land` only when landing is authorized.
