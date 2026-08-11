---
description: Restructure code with zero behavior change, guarded by an invariant + DX-standards check.
skill: implement-refactor
---

# Refactor Workflow

Code restructuring that preserves 100% functional parity.

## Goal
Improved structure/readability with behavior unchanged.

## Inputs required (ask if missing)
- Target file/directory.
- Refactor objective (e.g. "extract component", "flatten structure").

## Safety + scope
- Do NOT change feature behavior. If a bug is found, note it — do not fix it here.
- Do NOT add new dependencies.
- Only touch the target area and its immediate dependants.

## Skill routing (explicit)
- `implement-refactor`.

## Procedure
1. **Reconnaissance**: Follow `implement-refactor`'s `SKILL.md`; map all references to the target.
2. **Execution**: Apply changes in small, logical steps.
3. **DX-standards alignment**: Bring touched code into line with `.agent/rules/pattern-code-standards.md`
   (export style, barrel files, `// WHY:` comments) and any design-token invariants.
4. **Verification**: Run the project's verification commands (lint + build/typecheck + relevant
   tests) and confirm behavior is unchanged.
5. **Summarize**: Note the before/after structure in a `docs/working/LOG-*.md` if durable.

## Notes
- If behavior must change, use `/plan` instead.
