---
description: Implement a feature from an approved plan, with per-phase verification and a hostile-QA gate.
---

# Build Workflow

Implement a feature from an approved plan: flight-check -> phased build -> hostile QA -> user gate
-> wrap-up.

## Goal
Feature fully implemented, verified, and documented in `docs/working/` (prefixed with `LOG-`).

## Inputs required (ask if missing)
- Approved plan path in `docs/working/` (prefixed with `TICKET-` or `ARCH-`).
- Running development server (project's `dev` command).

## Safety + scope
- Do NOT deviate from the approved plan without user consent.
- Only touch files named in the implementation plan.

## Skill routing (explicit)
- `implement-flight-check` — pre-implementation env/plan verification.
- `implement-feature` — the actual build.

## Procedure
1. **Pre-Flight**: Run `implement-flight-check` to confirm env + plan are ready.
2. **Phase-by-phase execution**: Run `implement-feature`; implement each phase, then run the
   project's verification commands (lint + build/typecheck) after every phase.
3. **Code standards check**: Verify the diff conforms to `.agent/rules/pattern-code-standards.md`
   (export style, file structure, import ordering, `// WHY:` / `// CONSTRAINT:` comments).
4. **Hostile QA**: Perform an adversarial self-review of your own code before handing off.
5. **Lifecycle Gate**: Apply `foundation-testing.md` and `foundation-browser-usage.md`; stop only
   when a declared runtime or human lane requires user/reviewer action.
6. **Wrap-Up**: Call `/wrap-up` to finalize documentation and cleanup.

## Notes
- For small tweaks, use `/quick-fix`. To debug a failure, use `/debug`.
