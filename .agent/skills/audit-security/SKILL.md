---
name: audit-security
description: Detect security issues — vulnerabilities, exposed secrets, unsafe patterns. Scan-and-report ONLY; use security-fix to remediate.
tier: core
conflicts-with: [security-fix]
---

# Audit Security

Evidence-first security audit centered on the two places projects actually bleed: the
**client/server boundary** and **secret hygiene**. Diagnose only; no code changes.

> **Authority:** `foundation-security.md` is the binding contract (hard-stop paths, prohibited
> actions, storage hygiene, CSP). This skill is the *detection method* for that contract — do not
> restate it, enforce it.
>
> **Fix counterpart:** scan-only (detection + report). To remediate and write backlog tickets,
> use the `security-fix` skill (Sentinel).

**Persona: Security Engineer** — "I assume all inputs are malicious, and every grep miss ships."

## When to Use
- Before major releases or after adding dependencies
- After any change near auth, env handling, or storage
- Periodic health checks

## When NOT to Use
- You want findings fixed in the same pass → `security-fix`
- Database/RLS-specific review → `verify-rls-policies` (this skill covers app-layer only)

## Approach

### Step 0: Load Context
Read `foundation-security.md` and the project's source roots, env-var conventions, and
client/server split from `project-invariants.md`. Any violation of a hard-stop rule in
`foundation-security.md` is automatically **Critical**.

### Step 1: Secret Hygiene (grep-driven, exact commands in the report)
Scope all greps to the project's source roots (see `project-invariants.md`); exclude lockfiles,
fixtures, and docs — but report the exclusions so the reader can audit the audit.
- Grep for hardcoded credentials: `key|token|secret|password|credential|bearer` plus known
  prefixes (`sk-`, `sk_live`, `ghp_`, `AKIA`, `eyJ` for inline JWTs, PEM headers).
- Verify secret source files (`.env*`, `*.local`) are git-ignored **and** not already tracked
  (`git ls-files` beats reading `.gitignore` — a listed pattern doesn't untrack a committed file).
- Check git history is not the leak: a secret deleted in HEAD but present in history is still
  exposed. Flag for rotation, not just removal.

### Step 2: Client/Server Boundary (the highest-value check)
- **Server-only env vars must never reach client bundles.** Grep client-side code for server env
  access; check for framework "public" prefixes (`NEXT_PUBLIC_`, `VITE_`, etc.) wrapping values
  that are actually secrets. A service-role or admin key in a client bundle is a **Critical**
  finding regardless of whether it's "only staging."
- Verify no privileged operation (admin mutation, billing, role change) trusts client-supplied
  identity or flags without server-side re-validation.
- Confirm browser storage holds no plaintext secrets and reads go through a schema-validated
  wrapper (contract in `foundation-security.md` §3).

### Step 3: Validation & Auth Posture
- **Fail-closed:** trace error paths in access checks — an exception or validation failure must
  land on *denied*. A `catch` that returns success is Critical.
- **Timing-safe comparison** for any secret/hash check — flag `===`/`==` on secrets.
- **No weakened auth:** diff-aware check for lowered password rules, disabled protections, or
  test bypasses left enabled in production paths.

### Step 4: Supply Chain & Config
- `npm audit` (or the project's equivalent): High/Critical advisories are findings; note whether
  the vulnerable path is actually reachable.
- Unapproved new dependencies since last audit; dangerous script flags; missing/relaxed CSP
  directives without a justifying comment (contract in `foundation-security.md` §5).

## Findings Model
Per finding: **Severity** (Critical / High / Medium / Low), **evidence** (file:line or command +
output), **concrete failure scenario** ("attacker with the bundle extracts X and can Y"), and a
**remediation pointer** for `security-fix`. Severity tracks exploitability × blast radius — a
leaked credential is Critical even if "internal," because rotation cost is already incurred.
Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.

## Definition of Done
- [ ] Every grep/command run is listed verbatim in the report (reproducible audit)
- [ ] Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.
- [ ] Client bundle checked for server-only env vars and privileged keys
- [ ] Fail-closed and timing-safe checks traced, not assumed
- [ ] Each Critical/High has a named failure scenario, not a category label
- [ ] Report ends with a Pass/Fail call and a prioritized handoff for `security-fix` — zero code changed
