---
name: review-peer
description: Use for evidence-backed verdicts on another author's implementation or findings. Read-only unless repair is requested; use review-raise-bar when the intended outcome is repaired work.
tier: core
---

# Review Peer

Review the actual work and deliver evidence-backed verdicts. A plain review is read-only.
When the user also authorizes repair, make bounded corrections within that grant; use
`review-raise-bar` when the intended outcome is broader repair to repo standard.
Author reputation neither proves correctness nor grants write authority.

## When to Use

Use for a second opinion on a branch, implementation or prior findings. Use `vet-simple` or
`vet-hard` for pre-implementation risk review and `audit-code` for a broader code-quality audit.

## Approach

### Phase 1: Recon on the Real Work

Identify accepted outcomes, exclusions, base/target state, actual artifacts and reviewed diff.
In shared checkouts distinguish the reviewed work from concurrent edits before any authorized
repair. Use the caller's ownership record and `pattern-agent-orchestration.md`; do not claim or
change another writer's files. Load only standards that materially apply.

Read source and affected callers rather than relying on the author's summary. Prior reports are
claims to check. Reconcile stale premises against current code and later user decisions.

### Phase 2: Multi-Lens Pass

Select applicable lenses:

- **Behavior/correctness:** trace the changed contract through a success path and material failure
  or boundary path. Check side effects, compatibility, ownership and recovery. Inspect whether
  tests actually exercise the outcome and whether fixture/oracle changes weakened the proof.
- **DX:** executability, concrete file targets, type and dependency boundaries.
- **UI/UX:** visual consistency, discoverability, accessibility and target-device behavior where
  there is an interface. Static inspection cannot establish runtime behavior.
- **Docs:** truthful claims, appropriate homes, navigation and authoritative status.
- **Scope:** accepted outcome, exclusions and remaining acceptance.

Use `foundation-testing.md` for relevant evidence reuse and gaps. No repeated broad gate is
required merely because a review starts.

### Phase 3: Verdicts with Evidence

For proposed changes or supplied recommendations use **Adopt**, **Adapt** or **Reject**:
state what is supported, what must change, or the concrete counterevidence.
For a new defect, state the behavior, triggering conditions, location, impact and proposed correction.
Do not force every code observation into a prior-recommendation verdict.

Separate impact severity from invariant compliance and blocking policy. A review with no material
findings is valid; describe the checked scope and limits instead of inventing issues.

### Phase 4: Authorized Surgical Fixes

Skip edits for review-only requests. If repair is already authorized, recheck the target and fix
supported bounded defects such as an introduced failing gate, a factual documentation error or
a demonstrated behavior regression. Size is a routing signal, not authority.
Continue routine choices within the grant; return consequential new scope or collisions to the owner.

Use the shared testing contract for focused proof, including continuity of a bug's behavioral
assertion and disclosure of oracle changes. If safe reproduction is unavailable, record the specific
reason, alternative evidence, confidence and missing proof. Do not label an untested symptom repaired.
Git, integration and publication remain with their authorized owner.

### Phase 5: Report

Lead with verdict and material findings. Include reviewed state/scope, evidence, authorized fixes
if any, actual proof, limitations and decisions still needed. Use the caller's report identity;
create a durable `REVIEW-` artifact only when it adds value.
A completed review with pending runtime evidence does not imply completed implementation acceptance.

## Definition of Done

Verdicts refer to actual code/docs and the intended contract. Significant conclusions have evidence
or explicit uncertainty. Each selected lens is `finding | checked-clean | not-applicable |
not-verified`; missing proof names the check and owner.
Any edits were within repair authority and owned paths, with focused proof reported.
No mandatory commit, branch repair or new plan is part of a plain review.
