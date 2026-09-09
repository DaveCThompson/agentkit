---
name: audit-auth-db
description: Use for read-only review of Supabase identity, schema, authorization and entitlement propagation after auth or database changes, or when access decisions disagree.
tier: tech:supabase
---

# Audit Auth & Database

Trace identity, authorization and data integrity from entry point to database and back.
This is a read-only audit; a report or suspected vulnerability does not authorize schema changes,
credential operations or live abuse tests. Shared authority belongs to `foundation-security.md`
and `pattern-external-mutation.md`.

## When to Use

Use after auth/schema/RPC changes, inconsistent access decisions, or entitlement refresh and
revocation failures. Use `verify-rls-policies` for a policy-only question.

## Approach

### Phase 1: Discover the Contract and Schema

Read applicable project requirements and `tech-supabase-auth.md`. Locate migration and seed
sources, exposed schemas, auth clients, server handlers, triggers and permission tests.
Discover the actual authority source and entitlement model; do not assume table or module names.

Trace representative writes and reads end-to-end. Check migration ordering, final column types,
defaults, nullability, CHECK values and foreign keys against every relevant writer, including
webhooks, RPCs and seeds. Distinguish inspection of seed compatibility from an executed fresh-schema
test. A migration file alone does not prove that the target database applied it.

### Phase 2: RLS Policy Audit

Use `verify-rls-policies` for effective-access inventory and the caller/table/operation matrix.
Include exposed tables without RLS. Reuse that matrix rather than creating a competing policy
presence checklist. Intentionally denied direct access and authorized RPC-only operations are
valid designs; compare them to actual clients and intended behavior.

### Phase 3: RPC Security Audit

For callable functions, including invoker functions that reach privileged helpers:

- Trace effective callers through explicit grants, role membership, defaults and PUBLIC privileges.
  Do not start anonymous-exposure review only from explicit grants to `anon`.
- Inspect definer identity, effective RLS bypass, input control and the authorization check before
  privileged work. A supplied user/tenant identifier must not confer authority.
- Check final search-path configuration and resolution of relations, operators and helper calls.
  Accept an empty search path with qualified relations or a trusted, explicitly hardened path.
  Inspect who can create objects in any searched schema; `public` is not inherently trusted.
- Verify anonymous operations have a stated purpose and controls suited to abuse potential.
  Review error disclosure and the public return contract without requiring a particular JSON shape
  or catch-all exception handler.

Consult [Supabase function security and privileges](https://supabase.com/docs/guides/database/functions)
and the target PostgreSQL version's function guidance when assessing hardening. CREATE-only text
searches miss later ALTER, grant/revoke and ownership changes.

### Phase 4: Metadata Propagation

Trace the discovered chain: authority record → propagation mechanism → token/session/cache →
server and UI consumers. List fields each consumer needs and their sources. Exercise or inspect
grant, downgrade, revocation, failed synchronization, token expiry and refresh behavior.
Identify where stale claims remain usable and whether that duration meets the security contract.
A UI refresh is not proof of server-side revocation.

### Phase 5: Admin Authorization Consistency

Locate privileged checks across UI, server handlers, functions and policies. Compare each to the
accepted authority model and freshness requirements. Multiple representations can be valid if
their trust and synchronization contracts are explicit. UI gates are convenience, not enforcement.
Check fail-closed paths and cross-user/tenant access as well as legitimate administrative access.

### Phase 6: Entitlements Alignment

Compare entitlement values and transitions to schema constraints and consumers. Inspect precedence
and defaults for absent, expired or conflicting grants. Map important access decisions to actual
tests and report missing outcomes; do not equate test-file existence with coverage.

### Phase 7: Edge Function Security

Check caller authentication, operation authorization, input bounds, error disclosure and abuse
controls at exposed handlers. Evaluate CORS against intended browser origins; CORS is not caller
authorization. Preview domains need access only when the deployment contract includes them.

## Output and Definition of Done

Return the scope and state reviewed, effective-access matrix, significant propagation paths,
findings with evidence and impact, and remaining proof. Use a diagram only when the propagation
path is hard to follow in prose. Each selected lens is `finding | checked-clean | not-applicable |
not-verified`; a source-only audit cannot claim live database verification.
Separate impact severity, policy blocking and uncertainty using `foundation-testing.md`.
Redact credentials, tokens and personal data before storing evidence.

The audit is delivered when important access and data paths are assessed or have a specific gap,
next check and owner. Findings may be zero. No schema, policy, application or credential changes
are part of this skill.
