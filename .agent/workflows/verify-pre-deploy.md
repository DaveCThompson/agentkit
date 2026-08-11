---
description: Pre-production GO/NO-GO verification — automated checks plus a project-defined manual-flow gate.
---

# Verify Pre-Deploy Workflow

Run at the release boundary before promoting to production. Combines the one broad final-tree gate,
release-specific checks, and manual verification prompts into a single GO / NO-GO recommendation.

## Goal
A defensible GO / NO-GO decision with every gate marked PASS / FAIL.

## Inputs required (ask if missing)
- **Critical-flow list**: the project's must-pass manual flows (define once in
  `docs/knowledge-base/` or `AGENTS.md`; referenced here as `T1..Tn`). Ask for it if absent.
- Target environment (staging -> prod, function deploy, etc.).
- Final commit SHA/tree identity. Cite local or CI final-tree evidence when it covers this exact
  state; do not repeat an identical broad gate merely because this workflow is a new boundary.

## Gates

### 1. Build verification
Run or cite the project's broad final-tree gate (lint + typecheck/build + tests). All must report 0
errors/failures, and cited evidence must cover the exact release SHA/tree.

### 2. Data-layer audit (if the project has a database)
Run `audit-security` (and `audit-auth-db` on stacks that ship it). Require: no CRITICAL, and no
HIGH without a documented exception.

### 3. Migration validation (if the project has migrations)
- [ ] Migrations are idempotent (guarded creates / `CREATE OR REPLACE`).
- [ ] Constraints cover every value the code writes.
- [ ] Privileged/`SECURITY DEFINER` functions pin their search path.
- [ ] Seed data runs clean against a fresh schema.

### 4. Environment verification
- [ ] Production env vars set (list them in the project's deploy doc).
- [ ] CORS / CSP / allowed-origins include the production domain.

### 5. Manual test gate
Confirm the project's critical flows (`T1..Tn`) have been manually verified. **STOP** and ask:
> "Have you completed manual verification for the critical flows?"

### 6. GO / NO-GO decision
```
PRE-DEPLOY VERIFICATION
Build:        PASS/FAIL
Data Audit:   PASS/FAIL (X findings)
Migrations:   PASS/FAIL/N-A
Environment:  PASS/FAIL
Manual Tests: PENDING/COMPLETE
RECOMMENDATION: GO / NO-GO
```

## When to use
- Before merging staging -> main, deploying serverless functions, or after major auth/DB changes.

## Notes
- Steps 2–3 are conditional: skip cleanly on projects without a database or migrations.
