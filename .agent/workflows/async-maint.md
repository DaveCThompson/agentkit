---
description: Run requested or configured background diagnostics and return uniquely identified health reports.
gemini: false
---

# Async Maintenance Workflow

Run a requested job or an already configured recurring diagnostic. This catalog does not create a
schedule, authorize remediation, or grant ongoing access. Use the host's scheduling mechanism when
the user requests recurring work, preserving their notification preferences.

## Select and bound the job

| Job | Evidence and limit |
| --- | --- |
| Dependencies | Project-supported audit/outdated report; distinguish advisories, applicability and unavailable data. |
| Bundle | Comparable build/chunk measurements with configuration and baseline identity. |
| Git history | Churn and ownership leads, corroborated before treating them as defects. |
| Accessibility or contrast | Route to `audit-accessibility`; automated coverage is not a complete WCAG verdict. |
| Code/docs/hygiene/agent sweep | Route to `sweep-codebase` with the requested scope. |

Choose a cadence only when configuring a requested schedule. It depends on project risk and cost,
not a universal weekly/monthly rule. Report archival is a separate `maintain-docs` operation,
not an age-triggered deletion job.

## Execute and return

1. Resolve the actual project command and read its side effects. Bound runtime, output, network and
   shared resource use. Installing tools, upgrading dependencies or changing CI needs separate scope.
2. Give this run a unique identity and exclusive report path in the resolved working-docs store,
   such as `REVIEW-<job>-<UTC-time>-<run-id>.md`. A date alone does not prevent collisions.
   Keep raw artifacts in the project's existing evidence store; do not invent nested directories.
3. Run the diagnostic and record source/candidate identity, command, coverage, result and limits.
   Failures, timeouts and missing data are outcomes, not clean attestations.
4. Return actionable findings and recommendations. File canonical tickets only when filing is part
   of the grant. Do not overwrite another run, update shared indexes without their writer, publish
   reports, or repair source as an incidental maintenance step.

Source changes remain out of scope. Retain pending work with its owner and next action.
