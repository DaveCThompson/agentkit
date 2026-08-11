---
description: Debug with systematic root-cause analysis; a failing reproduction test is mandatory before any fix.
---

# Debug Workflow

Systematic debugging with hypothesis testing and reproduction rigor.

## Goal
A validated fix with a passing reproduction test and zero regressions.

## Inputs required (ask if missing)
- Bug description and steps to reproduce.
- Environment details (if specialized).

## Safety + scope
- Do NOT implement a fix without a **failing reproduction test** first.

## Skill routing (explicit)
- `debug-standard` — reproducible logic/UI bugs.
- `debug-deep` — intermittent, state-heavy, race-condition, or concurrency issues (use when
  standard debugging stalls or the bug touches many files).

## Procedure
1. **Reproduction (MANDATORY gate)**: Read `debug-standard`'s `SKILL.md`; write a test (e.g.
   `repro.test.*`) that **fails** on the current bug. No fix proceeds until this test exists.
2. **Hypothesis**: Generate 3–4 hypotheses before reading suspect code.
3. **Investigation**: Follow the selected skill; confirm the root cause with evidence
   (`@file:line`). Escalate to `debug-deep` if the cause resists standard analysis.
4. **Fix & verify**: Apply the fix; confirm the reproduction test passes; run focused local proof
   (lint + build/typecheck + tests as applicable), then follow the lifecycle gate for the final tree.

## Notes
- "Standard" = obvious logic/UI failures. "Deep" = races, HMR issues, complex async state.
