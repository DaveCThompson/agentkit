---
trigger: always
domain: testing
---

# Testing & Verification

Support each completion claim with evidence for the outcome and state actually checked.
This rule owns evidence validity and lifecycle gates; skills supply domain-specific proof, not
copied gate recipes.

## 1. Lifecycle-Aware Verification Gate

Select project-equivalent commands and environments from the acceptance criteria and repository
configuration. Do not invent lint, typecheck, build, server or browser requirements for a project
that does not have or need them. Absence of an applicable check is a coverage limit, not a pass.

| Lifecycle point | Required evidence |
| --- | --- |
| Focused local proof | Relevant static checks and tests for the changed behavior; packaging/build checks when affected. Documentation needs source, reference and contract checks. |
| Final tree | One applicable broad gate on the final standalone or integrated candidate. A worker normally supplies focused proof and names the integration owner. |
| Release boundary | Final-tree evidence plus applicable packaging, target-environment, migration and required human checks. See `verify-pre-deploy.md`. |

Map consequential acceptance outcomes to proof, not just commands. Record each required lane
(machine, runtime, human, docs, landing) with owner, result or pending check, and the transition
it gates. Include relevant lanes; at a parallel handoff account for each core lane, using justified
non-applicability where necessary. Do not split one behavior ticket merely because it needs mixed
proof. A pending required acceptance item blocks integration and completion unless an explicit
project policy assigns it only to a later transition. It never silently becomes green.

Focused evidence can support `reported` with the final-tree gate pending. A human-owned check
remains `needs-human-verify` until confirmed; preserve its authoritative work item through closure.

### 1A. Evidence identity and cite-or-run

Record the proposition checked, exact relevant state, method/command, true result, environment,
coverage and limits. Local and CI evidence are reusable when these still match. A branch name is
mutable; identify the accepted commit or working-tree content, including relevant untracked inputs.
An index tree alone does not identify unstaged work.

Moving or promoting a report does not by itself invalidate its proof. Reassess the proposition,
relevant source identity and environment premises; cite matching evidence and run only missing or
changed proof. Verify preservation and navigation separately. An exact whole-tree receipt can become
stale after a document edit while narrower source-bound evidence remains valid for its stated claim.

Use `agentkit receipt` when practical; `agentkit receipt --check` must pass before later reuse.
The receipt digest excludes ignored files and its own verification store. Include separate content
identity for ignored evidence when the claim depends on it. A stale receipt is missing evidence.

Finalize authored/generated candidate content before the broad gate. Keep post-gate receipts in
the existing excluded verification store. Any later tracked edit requires reconciliation and
evidence for the actual final identity; a documentation attestation must not hide a changed tree.

- Read the runner's true exit code and actual result, not a filter's exit or an invented pass count.
  Prefer one normal project command per gate. If filtering output, retain the runner result.
- Never claim runtime, staging, release or complete acceptance from a narrower static/local check.
- For reproducible software bugs, establish a collected test failing on the intended behavior,
  then the same behavioral assertion passing after repair. Preserve input, expected outcome and
  before/after state; setup/import failure is not behavioral red.
- Reuse a supplied valid reproduction. If the fixture or oracle changes, explain why against the
  intended contract and re-establish applicable before/after evidence. A renamed test keeps provenance.
- When safe reproduction is unavailable, or authorized containment must precede it, record the
  reason, alternative evidence, causal confidence and missing proof. Containment is not a verified
  repair of an untested symptom. High-risk unresolved evidence may still block implementation/release.
- A diagnosis-only request can end unresolved with discriminating evidence and the next useful
  probe. A reproduction-only request can finish with intentional red; it does not authorize repair.

#### 1B. Cite-or-Run

Verify cited paths, revisions, counts and breadth claims against actual files, Git or runner output.
Label proposed paths as new. Confirm all relevant consumers before claiming universal coverage.
A successful fetch establishes what a source says, not independent verification of its claims.
An empty, excluded, malformed or skipped scan cannot substantiate a complete invariant pass.

#### 1C. Red-Proof (Detection Proof)

When claiming a new or changed gate detects a violation, exercise a meaningful violating fixture
and a conforming fixture in a safe isolated environment. Preserve their actual results. Do not
manufacture destructive sabotage or require a new counterexample for every wording/expectation edit.
Disclose test, fixture and threshold changes; an independent reviewer checks whether the oracle
still represents the intended behavior. Author tier is not evidence that a gate is sound.

## 2. Refactor Verification (behavior-preserving)

Identify the relevant external contract and semantic risks: evaluation order, identity, mutation,
exceptions, timing and compatibility where affected. Use existing tests and focused characterization
for meaningful gaps. Green tests are bounded evidence, not proof of all behavior.
An intentional visible-contract change belongs to behavior-change scope; do not silently rewrite
expectations to relabel it a refactor.

## 3. Documentation Truthfulness

Name the exact checks that ran, state they cover the relevant artifact revision, and preserve
unverified scope. A design expectation is not runtime assurance. Completion records state actual
outcomes, not planned verification.
Document age is a review signal, not semantic drift. Checker success covers only its named roots,
checks and exclusions. An unknown ancestry result is incomplete evidence, not a pass or proof of
non-ancestry; one integrated partial-fix commit does not establish whole-ticket acceptance.

## 4. No New Errors

Fix introduced failures within scope. Investigate a failed check before changing its expectation.
A baseline comparison can support attribution but is not causal certainty. Preserve the same
command/environment when comparing; use an isolated baseline, never reset a live tree to test blame.
Report unrelated failures and their effect on acceptance. Escalate when new authority or information
is needed, or further approaches no longer yield useful evidence—not after an arbitrary command count.

## 5. Know Where Tests Are Collected

Confirm discovery globs, execution environment and collection. A passing runner that did not
collect the new test has not checked it. Prefer actual observable outcomes over implementation-text
assertions, except for contractual literals, serialization and routing metadata.

## 6. Prefer Existing Test Seams

Test pure logic directly when that expresses the behavior. Use integration/runtime tests for effects
that a pure seam omits. Extract production code only within authorized implementation/refactor scope;
a test-only request does not authorize extraction. Keep reproduction fixtures owned by their issue
so concurrent investigations do not overwrite or clean each other's evidence.

## 7. Determinism & Mock Quality

Anchor clocks and randomness where they affect assertions. Keep fixtures aligned with real schemas
and model relevant failures; mocks do not prove a live service contract. Use non-secret test identities,
never live credentials or destructive targets. Platform-specific harness details belong in the
project's testing guidance and applicable technology rules.
