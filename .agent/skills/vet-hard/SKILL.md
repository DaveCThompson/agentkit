---
name: vet-hard
description: Use for adversarial review of high-consequence proposals or implementations, testing security, concurrency, resource and recovery hypotheses within the requested scope.
tier: core
---

# Vet Hard

Test high-consequence proposals or implementations against plausible abuse, concurrency and recovery
failures. Deliver an adversarial review, not production changes or an automatically executed attack.

## When to Use

Use for requested threat review or material risk in authorization, payments, data integrity,
resource ownership or architecture. Use `vet-simple` for a routine plan check, `audit-code` for
ordinary code review, and `review-raise-bar` when repair is the requested outcome.

## Approach

### Phase 1: Context & Threat Model

Read the accepted behavior, exclusions, relevant implementation and actual base/target state.
Identify protected assets, entry points, trust boundaries, attacker-controlled inputs and privileged
operations. Separate user-facing behavior from internal assumptions. Carry existing authority and
file/resource boundaries from the caller; `foundation-security.md` and
`pattern-external-mutation.md` own permission rules.

### Phase 2: Select Adversarial Lenses

Choose lenses by failure mechanism rather than filling a persona quota:

- **Security:** injection at an actual interpreter, cross-user/tenant access, confused deputies,
  credential disclosure, CSRF where ambient credentials apply, and fail-open authorization.
- **Resource exhaustion:** unbounded input, amplification, recursion, memory lifetime, expensive
  queries/renders and work that continues after cancellation.
- **Concurrency:** duplicate requests, reordered responses, concurrent edits, stale owners,
  cancellation after dispatch, retry after an uncertain result, and partial writes.
- **Accessibility:** keyboard, assistive technology, low vision and motor-input barriers on
  applicable interfaces.
- **Recovery and UX:** lost work, ambiguous success, misleading state, unavailable undo and
  a user stranded after failure.

Follow the important path through callers, validation, side effect and response. Look for
counterevidence such as existing constraints, safe rendering APIs or idempotency ownership before
promoting a plausible attack into a finding.

### Phase 3: Attack Vector Documentation

For each material hypothesis, record preconditions, trigger, protected outcome, mechanism,
source/runtime evidence, counterevidence, confidence and a discriminating test.
Classify it as supported, refuted or unresolved. Plan-only risks stay unverified; a source
pattern alone does not prove a reachable exploit. Zero findings is valid after relevant hypotheses
are assessed.

### Phase 4: Failure Mode Analysis

Trace causes through effects and detection/recovery boundaries. Assess severity from impact and
likelihood from evidenced preconditions; name uncertainty. Keep policy blocking separate.
Use numerical risk scoring only when the project has an agreed rubric. Do not invent an RPN
threshold or a remediation estimate from the category label.

### Phase 5: Stress Testing Scenarios

Choose workloads and schedules that discriminate the identified failure modes: interrupted writes,
duplicate delivery, boundary-size data, slow dependencies, contention or teardown during work.
Define the intended outcome and observable assertion before a run. Test both failure containment
and legitimate operation.

Designing a stress scenario does not authorize executing it. Run only within the granted target,
load and data boundary, preferring disposable fixtures. If unsafe or unavailable, return the test
design, evidence gap and owner. Use `foundation-testing.md` for evidence identity, behavioral
before/after proof and bounded alternatives; do not run a second broad gate merely for this review.

### Phase 6: Code Review

Inspect validation at trust boundaries, error handling at its owning boundary and cleanup for
resources actually acquired. Check who owns cancellation and late results. Do not require
try/catch around every async call or cleanup for effects that acquire nothing.
Trace type escapes and hardcoded assumptions to an actual failure path.

### Phase 7: Rollback & Recovery

Determine what reversal preserves and what it cannot restore: persistent writes, external effects,
schema compatibility and useful local/ignored state. Inspect user recovery, detection and blast
radius. Evaluate an existing feature flag or containment mechanism where relevant; their absence
is not automatically a defect. A Git revert alone does not establish data recovery.

## Output

Reuse the caller's report destination or work item; create a durable `REVIEW-` artifact only when
handoff or risk warrants it. Lead with the verdict and supporting evidence:

- Scope/state, threat model and relevant lenses assessed.
- Findings: identity, preconditions, mechanism, evidence/counterevidence, impact, confidence,
  policy gate, mitigation and discriminating test.
- Refuted material hypotheses and unresolved coverage with next check/owner.
- Recovery limits and remaining decisions.

Do not prefill conclusions, example vulnerabilities, estimates or green recovery claims.

## Definition of Done

Material hypotheses have evidence-backed dispositions or explicit proof gaps. Proposed mitigations
address the demonstrated mechanism and preserve legitimate use. The report distinguishes a completed
bounded review from completed implementation or release verification. No minimum finding count,
mandatory persona count or unauthorized mutation remains.
