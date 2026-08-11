---
name: implement-test
description: Generate unit/integration tests following project patterns. Use when adding test coverage for existing or new components.
tier: core
---

# Implement Test

Generate tests following established project patterns. Node-first: test decisions, not wiring.

Use the project's existing runner in single-run (non-watch) mode — never introduce a new test
framework. The verification gate itself lives in `foundation-testing.md`; this skill covers how to
write the tests that feed it.

## When to Use
- Adding test coverage for new features
- Writing reproduction tests for bugs
- Extending coverage after refactoring
- TDD implementation

## Approach

### Phase 0: Extract Before You Test (Node-First)
Prefer pure-function tests over rendered-component tests:
1. If the logic under test lives inside a hook/component (decision, math, formatting, bucketing),
   **extract it into a sibling pure module first**, then unit-test that module directly with the
   project's runner in a node environment — no DOM harness.
2. Leave only orchestration (timers, subscriptions, DOM/pointer events) in the hook/component;
   cover that thin seam with an integration test or manual QA.
3. WHY: node-environment pure tests are fast, deterministic, and survive UI refactors; DOM-harness
   tests are slow and couple assertions to markup that changes for unrelated reasons.

### Phase 1: Test Discovery
1. Identify the unit under test; read sibling test files for the project's style and helpers.
2. **Confirm collection**: check the runner's config and verify its `include` globs will actually
   collect the new file's path + name. A test outside the globs silently never runs — a false
   sense of coverage (`foundation-testing.md` §5).
3. Confirm the environment the file needs (node vs DOM) and how the project declares it
   (per-file pragma, config glob, separate config).
4. For state-heavy components, note the state library and plan store seeding via its test
   provider/factory pattern.

### Phase 2: Test Planning
Plan per file:
- **Happy path**: core behavior works.
- **Edge cases**: empty states, boundary values, null/undefined inputs.
- **Error cases**: invalid inputs, failures, timeouts.
- **Accessibility** (UI only): keyboard access, role-based queries.
- Table-driven cases for contract-style suites (one `it.each`-style table beats N copies).

### Phase 3: Implementation
- **Naming**: follow the project's conventions (co-located `*.test.*`; a temporary repro-marked
  file for bug reproductions, renamed into its owning suite once the fix lands).
- **Determinism — time**: anchor time-dependent logic to a fixed baseline date with fake timers
  (`setSystemTime` or the runner's equivalent) so fixtures and the runner share one clock —
  prevents bucketing drift (`foundation-testing.md` §7).
- **Mocks match production schemas**: build fixtures from the real types with `Partial<T>`-style
  helpers so a test states only the fields it cares about; update centralized fixtures first when
  a schema changes. Mock external service seams, not internal modules.
- Prefer role/behavior queries over test-ids for UI tests.

### Phase 4: Verification
1. Run the new file with the project's runner in single-run mode and see it pass. For repro
   tests: see it FAIL first against the unfixed code — that failure is the point.
2. Close with the Graduated Verification Gate (`foundation-testing.md` §1) at the tier the
   surrounding change demands.

## Constraints
- Framework-agnostic discipline, project-specific commands: adapt to the repo's runner and
  scripts; do not restate or replace the gate in `foundation-testing.md`.
- Follow existing test patterns in the codebase before inventing new ones.
- Do not use snapshot tests unless explicitly requested.
- Keep exactly one active bug-repro file in the tree at any stable point.

## Output
- Test file(s) created, confirmed collected by the runner, and passing
