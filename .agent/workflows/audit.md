---
description: Route scoped or full scan-only audits and report findings with explicit coverage.
---

# Audit Workflow

Resolve the requested target and lenses. Default to `code` only when no lens can be inferred.
An unknown explicit lens needs clarification, not silent substitution. Auditing authorizes
inspection and the requested report, not repairs, deployments or destructive probes.

## Skill routing

| Lens | Skill |
| --- | --- |
| code, structure, dx | `audit-code` |
| accessibility | `audit-accessibility` |
| design | `audit-design-system` |
| layout | `audit-layout` |
| typography | `audit-typography` |
| performance | `audit-performance` |
| security | `audit-security` |
| auth-db | `audit-auth-db`, when available for the stack |
| rls | `verify-rls-policies`, when available for the stack |
| web, web-interface | `audit-web-interface` |
| docs | `audit-docs` |
| refactor | `audit-refactor-opportunities` |
| rules, invariants | `verify-rules` |
| maintenance, hygiene | `audit-hygiene-enforcement` |

For `full` or `all`, inventory the project's applicable lenses across this table, including
security, performance, docs and hygiene. Explain exclusions; unavailable required coverage remains
incomplete. Deduplicate overlapping web/design checks without silently dropping obligations.
Read each selected skill and its applicable references. Run serially unless parallel work is
authorized and its resources and report ownership are disjoint.

## Synthesize and return

Preserve the caller's report destination; otherwise use a flat `REVIEW-<topic>.md` in the resolved
working store when a durable report is useful. Each lens ends with findings, checked-with-no-findings,
not-applicable with a reason, or incomplete with the missing evidence and next check. State the
actual surface and method; a clean subset is not a whole-project pass.

Consolidate repeated root causes while preserving affected surfaces, severity, evidence and
consequences. Existing evidence storage and the shared documentation rules own raw artifacts.
Recommended repairs may route to `security-fix`, `performance-fix` or an implementation skill,
but execution requires repair authority. Background diagnostics are not a remediation shortcut.
