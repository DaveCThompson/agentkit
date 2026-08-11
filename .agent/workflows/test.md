---
description: Generate unit/integration/reproduction tests following the project's existing test patterns.
skill: implement-test
---

# Test Workflow

Generate tests that match established project conventions.

## Goal
Test file(s) with passing tests and good coverage of the target code.

## Inputs required (ask if missing)
- Target file or component to test.
- Test type: `unit`, `integration`, or `reproduction` (for bugs).

## Safety + scope
- Do NOT modify production code — test files only.
- Only touch test files adjacent to the target or in the project's test directory.

## Skill routing (explicit)
- `implement-test`.

## Procedure
1. **Discovery**: Follow `implement-test`'s `SKILL.md`; identify existing test patterns in the
   target directory.
2. **Planning**: Enumerate cases — happy path, edge cases, error cases. For reproduction tests,
   ensure the bug is captured first.
3. **Execution**: Write the test file per naming conventions with proper assertions.
4. **Verification**: Run the project's test command against the new file.

## Notes
- For bug reproduction, create the failing test here, then continue in `/debug`.
