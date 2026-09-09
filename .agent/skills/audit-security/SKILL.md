---
name: audit-security
description: Detect security issues — vulnerabilities, exposed secrets, unsafe patterns. Scan-and-report ONLY; use security-fix to remediate.
tier: core
conflicts-with: [security-fix]
---

# Audit Security

Trace reachable threats across the requested trust boundaries and check secret exposure.
Diagnose only; use `security-fix` for authorized remediation. `foundation-security.md` and
`pattern-external-mutation.md` own action and target authority.

## When to Use

Use for security review of changed authentication, data handling, dependencies, configuration or
exposed operations. For database policy details use `verify-rls-policies`; for the whole identity
and database propagation path use `audit-auth-db`.

## Approach

### Step 0: Scope the Threat

Identify target/base state, reviewed changes, source roots, deployment model and protected assets.
List entry points, caller control and privileged effects. Select additional checks by threat:
injection, cross-tenant access, request forgery, file handling, outbound requests, serialization or
resource exhaustion where the target exposes those mechanisms.
Do not imply that a client/server and secret scan covers all security properties.

### Step 1: Secret Hygiene

Choose detectors and commands that return locations or redacted findings. Start broad keyword
discovery with filename-only output, then inspect through a redacting mechanism; do not print or
persist raw credential-bearing lines. Record detector, location, credential type and exposure path,
not the value. Do not put credentials into command arguments.

Inspect tracked configuration and actual ignore/tracking state: an ignored pattern does not untrack
a file. Check relevant history because deletion from the current tree does not remove prior
exposure. Include fixtures, docs and build artifacts when their publication or data makes them
relevant. Explicitly list uninspected history, generated bundles and excluded directories.
A synthetic example may be harmless; determine whether a value is live/privileged without testing
a real credential outside granted authority.

Redact tokens, credentials and personal data before saving evidence. A gitignored directory is not
sufficient protection. If exposure is found, preserve only redacted proof and identify the scoped
rotation/revocation owner; do not rotate, rewrite history or publish the secret during an audit.

### Step 2: Client/Server Boundary

Trace imports, environment substitution and build output that could expose server credentials.
Framework public prefixes are signals; inspect the actual build boundary and credential capability.
A public identifier is not automatically a secret. A privileged key in a downloadable artifact is
a serious exposure regardless of an internal or staging label.

Trace admin, billing and role mutations from caller-supplied identity to server enforcement.
Check storage against the project's threat model and security contract, including schema validation,
trust in stored values and privileged information persistence.

### Step 3: Validation & Authorization

Trace denial and error paths at the enforcement boundary. Determine whether an exception can allow
the protected operation. Compare tenant/user ownership and privilege transitions, not only whether
an authentication helper is called.

Inspect timing-sensitive comparisons where attacker observations could reveal a secret; assess the
whole protocol and use of the platform's intended primitive. A grep match on equality alone is a
candidate, not a vulnerability verdict.
Review changed password/auth protections and test bypasses for production reachability.
For validation, follow input through normalization, validation and its eventual interpreter/sink.

### Step 4: Supply Chain & Configuration

Use the project's available dependency advisory tool without repair/install flags. Distinguish
advisory severity, installed affected version, reachable path and exploit preconditions.
Inspect relevant install scripts, new dependencies and relaxed security configuration.
Assess CSP and other controls against the actual deployment; a comment does not establish that a
weakened boundary is safe.

### Step 5: Corroborate Within Authority

Prefer source traces and disposable local fixtures for denial and legitimate-use checks.
Do not send attack traffic, access real users' data or perform external remediation solely because
the audit identified a threat. Missing capabilities and unsafe reproductions stay explicit under
`foundation-testing.md`; report the next bounded check and owner.

## Findings Model and Repair Handoff

Preserve the supplied finding/work identity and selected scope. Record entry point, attacker control,
protected operation, reachability, exact state, redacted evidence, counterevidence, confidence and
impact severity. State applicable invariant/blocking policy separately.
Include the proposed repair outcome, abuse-case denial check and legitimate-operation check.
Carry outstanding operational actions and their owners separately from local code repair.
Do not substitute a different finding because it is cheaper or infer containment from a green suite.

## Definition of Done

Each selected boundary is `finding | checked-clean | not-applicable | not-verified`, with scope
and reason. Commands/methods are reproducible without embedded sensitive data. High-impact findings
name a reachable failure scenario or clearly labeled uncertainty.
The report exposes exclusions and pending proof, and returns a prioritized handoff to
`security-fix`. Zero findings is valid. No application, credential, external-system or scanner
configuration mutations occurred.
