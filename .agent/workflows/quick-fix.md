---
description: Atomic fix for small bugs or tweaks (≤30 lines, ≤5 files) with a scope guard.
skill: implement-quick-fix
model: haiku
---

# Quick Fix Workflow

Atomic resolution of a small, well-understood issue.

## Goal
Rapid resolution with full technical verification.

## Inputs required (ask if missing)
- Brief description of the issue.
- Location (if known).

## Safety + scope
- **Scope guard**: Do NOT exceed 30 lines or 5 files — if larger, escalate to `/plan`.
- If the change touches config/security paths, **STOP** and notify (see `security` rule).

## Skill routing (explicit)
- `implement-quick-fix`.

## Procedure
1. **Diagnosis**: A quick search / file view to locate the issue.
2. **Execution**: Follow `implement-quick-fix`'s `SKILL.md`; apply the fix.
3. **Verification**: Run focused local proof (lint + build/typecheck as applicable); run or cite the
   one broad gate only when this is the standalone final tree.
4. **Summarize**: Brief explanation of what changed.

## Notes
- Use `/debug` when the cause is unknown. `/quick-fix` is for "I know exactly what to change".
