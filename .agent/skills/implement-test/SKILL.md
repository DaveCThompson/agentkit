---
name: implement-test
description: Add unit, integration, or reproduction tests using the project's existing runner. Use for test coverage or a failing bug reproduction; test-only work does not authorize production refactoring.
tier: core
---

# Implement Test

## When to Use

Use for coverage, characterization, TDD tests, or a requested reproduction. Resolve whether the
deliverable is passing coverage or an intentional behavioral failure before choosing the test.

[foundation-testing](../../../.agent/rules/foundation-testing.md) owns runner collection, evidence validity,
and lifecycle gates. This skill owns selection of assertions, seams, and fixtures.

## Approach

### Phase 1: Test Discovery

Read the unit and sibling tests. Confirm runner configuration, filename/path collection, and
required environment. Use the existing runner in single-run mode; do not introduce a framework
to satisfy a testing preference.

Consume any supplied reproduction identity, intended behavior, unfixed state, and result.
An applicable existing repro need not be recreated. A no-edits request does not authorize writing
tests; provide the requested analysis from available evidence.

### Phase 2: Select the Behavioral Seam

Prefer an existing public seam. Pure decision, math, formatting, and bucketing functions are good
unit-test targets. Event ordering, rendering, subscriptions, and lifecycle ownership need the
integration seam where the defect occurs; a pure helper test cannot establish those behaviors.

Do not extract production logic for a test-only assignment. Where an authorized refactor makes
extraction justified, first capture behavior against the existing seam and verify extraction
separately. A preference for a node environment is not authority to change the system under diagnosis.

Plan meaningful assertions for core behavior, consequential boundaries, invalid input, errors,
and timeouts. For UI, prefer role/behavior queries and relevant keyboard checks. Table-driven
cases help when they express the same contract across inputs; do not multiply equivalent cases.

### Phase 3: Build Fixtures

Use the project's fixture/provider/factory patterns to seed state without bypassing the boundary
being tested. Match production schemas and construct complete valid objects; partial overrides
are useful when the factory supplies the remaining required fields. Avoid type assertions that
hide invalid fixtures.

Anchor time-sensitive tests to a shared fixed clock and control scheduling or random seeds when
they affect the contract. Restore test-owned timers, stores, and mocks between cases. Mock an
external service seam when isolation is required, while keeping the policy or transformation
under test real.

Use existing suites for regressions when practical. A temporary reproduction file belongs to
this issue and owner, not to a global singleton slot. Preserve other owners' repro files.
Rename or retire only owned temporary evidence when the task authorizes it and useful proof
remains discoverable; keep the assertion's identity through the move.

### Phase 4: Verify and Handoff

Confirm actual collection and assertion execution in single-run mode.

- Ordinary coverage: report the relevant passing assertions and remaining coverage limits.
- Reproduction-only: report the collected test's intended behavioral failure on the unfixed
  state and stop. Red is the requested deliverable; do not repair production to turn it green.
- Tests accompanying an authorized repair: pair the same assertion and intended outcome across
  unfixed/fixed states under Evidence identity and cite-or-run in the shared testing rule.

Setup/import failures are blocked proof, not behavioral red. Explain material oracle/fixture
changes from the intended contract; do not weaken expectations to obtain a pass. Re-establish
applicable before/after evidence when assertion meaning changes.

Use the shared Lifecycle-Aware Verification Gate for applicable checks. Do not duplicate it or
promise broad final-tree validation from a focused test run.

## Definition of Done

The requested test output is collected and exercises the intended seam. Return its identity,
behavioral assertion, fixture/input, relevant state, actual result, and evidence limits.
For a reproduction handoff, include the failing outcome and next repair owner without implying
new authority. Intentional red remains visible until an authorized repair satisfies it.
