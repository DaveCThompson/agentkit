---
name: security-fix
description: Remediate supplied security findings or investigate and repair vulnerabilities when security changes are requested. Use audit-security for scan-only assessment.
tier: core
conflicts-with: [audit-security]
---

# Security Fix

## When to Use

Use for authorized security repair. [audit-security](../audit-security/SKILL.md) owns read-only
assessment. Preserve the requested finding/subset and existing action/target grants under
[foundation-security](../../../.agent/rules/foundation-security.md) and
[pattern-external-mutation](../../../.agent/rules/pattern-external-mutation.md).

## Approach

### Phase 1: Intake and Threat Model

Consume a supplied finding's ID, evidence/state, protected outcome, unknowns, and authorized
surface. Recheck reachability and current premises before editing. Do not replace the requested
repair with a smaller unrelated finding. For open discovery, bound scanning to the requested system.

For each material candidate, identify:

- Attacker-controlled input or identity and its entry point.
- Protected data/operation and the enforcement boundary.
- Reachability, preconditions, privileges, and affected users.
- The concrete failure scenario, existing controls, evidence, and confidence.

Distinguish confirmed vulnerabilities, plausible candidates, and defensive enhancements.
Prioritize by exposure and consequence; labels such as injection or missing validation do not
determine severity alone. No confirmed finding is an acceptable outcome.

### Phase 2: Select the Repair

Trace the control that must hold at the actual trust boundary. Inspect authentication,
authorization, tenant/resource ownership, and error paths where relevant. A UI restriction is not
evidence that the server enforces access.

Choose an in-scope repair addressing the cause and legitimate use. Do not choose by line count.
Keep important unresolved findings with an owner and next action rather than declaring costly
work resolved. If the premise is stale, record what current evidence contradicts it.

### Phase 3: Secure the Boundary

Use the mechanism appropriate to the threat:

- Enforce authorization at the protected operation, including failure paths; an exception must
  not grant access.
- Keep SQL values in parameterized operations. Validate or allowlist structural choices such
  as identifiers that cannot be value parameters. Generic input sanitization is not a substitute.
  See [OWASP SQL injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).
- Prefer non-shell APIs for command execution. When a process is necessary, use the platform's
  argument API and validate supported operations rather than concatenate untrusted command text.
- Resolve path inputs against the intended allowed root. Check containment, symlink/reparse-point
  escape, and check/use races relevant to the operation before relying on a path check.
- Apply output-context encoding or an appropriate HTML sanitizer at the relevant sink.
  Input validation alone does not establish XSS protection.
- Evaluate CSRF against actual credential transport and state-changing endpoints; preserve the
  application's required session and origin checks.
- Review a vulnerable dependency's affected version, reachable API, and compatible repair using
  primary advisories and project policy.

#### Secrets and Diagnostic Evidence

Retrieve private credentials only in the server-side boundary through the project's existing
secret mechanism. Confirm the caller can invoke only the intended operation, and inspect
responses, client imports/build configuration, and logging paths for disclosure. A browser-visible
configuration value must be intentionally public.

For example, moving a private API key to a Vite-prefixed environment variable does not protect
it: VITE-prefixed values are included in client code.
See [Vite: environment variables](https://vite.dev/guide/env-and-mode#env-variables).
This is a boundary correction, not a prescription for another universal environment API.

Log an allowlisted event/code and safe correlation information through the project's redaction
path. Do not copy raw exceptions, request bodies, tokens, credentials, or sensitive identifiers
into reports or logs. Preserve useful failure diagnostics without exposing secrets.
See [OWASP logging: data to exclude](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#data-to-exclude).

An exposed credential may need rotation/revocation, deployment, and incident investigation.
A code repair does not prove those actions complete. Carry remaining operational actions and
owners; execute them only where existing authority covers the exact action and target.

### Phase 4: Verify

Exercise the repaired threat boundary with a bounded abuse/denial case and a legitimate-use case.
Include error or missing-context behavior when it caused the defect. Use disposable fixtures;
do not test an exploit against real users or mutate live security settings without applicable
authority.

Apply [foundation-testing](../../../.agent/rules/foundation-testing.md), Evidence identity and cite-or-run,
for behavioral failure/pass pairing, alternative-proof conditions, and evidence limits.
Use its Lifecycle-Aware Verification Gate for generic correctness checks. Generic green checks
do not establish denial, data isolation, or incident containment.

If safe threat reproduction is unavailable, record the specific reason, alternative evidence,
confidence, missing proof, and owner. Do not call an untested threat path verified.

### Phase 5: Report

Keep the supplied work item/finding identity. For task-authorized follow-ups, use
[pattern-docs-artifacts](../../../.agent/rules/pattern-docs-artifacts.md), Work Items and Status-of-Record
Contract, with stable TICKET identities and priority fields. A delegated author returns metadata
changes to its assigned owner. Reporting does not implicitly publish a PR or disclose a private finding.

## Definition of Done

Report the threat and evidence, boundary repaired, denial and legitimate-use results on the
relevant state, and unresolved code or operational remediation. Preserve required pending checks
with owners and gated transitions. Claim only the exposure and containment actually established.
End durable reports with "What we deliberately did NOT do."
