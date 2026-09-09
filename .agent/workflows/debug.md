---
description: Diagnose, reproduce or repair a bug using discriminating evidence and scoped authority.
---

# Debug Workflow

Determine the requested outcome: diagnosis, reproduction-only, or repair. A bug report can justify
investigation; a diagnosis-only request does not authorize production changes. Carry the supplied
symptom, environment, evidence, exclusions and existing repair grant into `debug-standard`.

Use `debug-deep` when the cause remains ambiguous or intermittent and its hypothesis-driven method
adds value. Escalation follows evidence, not a fixed number of failed attempts or hypotheses.
Preserve unresolved findings and the current reproduction rather than restarting the problem.

`foundation-testing.md` owns repair proof: meaningful failing evidence before a fix, the same
behavioral oracle afterward, and explicit bounded alternatives when a safe automated reproduction
is infeasible or containment must come first. Reuse a valid reproduction. Setup failures do not
prove the bug, and weakening the oracle does not prove repair.

Return the requested outcome. A meaningful red reproduction can complete a test-only task.
Diagnosis can end with a supported cause or bounded uncertainty. Repair needs defect-specific
evidence and applicable regression checks; do not invent success because the broad suite is green.
