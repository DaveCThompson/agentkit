---
description: Create meaningful unit, integration or reproduction tests within the requested test boundary.
skill: implement-test
---

# Test Workflow

Use `implement-test` with the requested behavior, test mode and allowed production-code boundary.
Follow the project's runner and conventions. Reuse valid coverage and choose an oracle that
distinguishes the intended behavior from the defect.

A reproduction-only request can end with a meaningful failing test and an evidenced expected
failure. It does not authorize the production fix. Coverage work normally expects green tests;
setup errors, skipped assertions or changed expectations do not establish the desired outcome.
Return commands, observed results, covered behavior and remaining gaps without silently escalating
from test generation into remediation.
