---
name: verify-rls-policies
description: Use when auditing Supabase RLS policy completeness across tables after schema or policy changes and before production.
tier: tech:supabase
---

# Verify RLS Policies

Compare effective database access with intended allow and deny behavior. Policy presence is only
one input. This is a read-only audit; report proposed corrections without granting access.

## When to Use

Use after schema, policy, grant or function changes, before a scoped database release check, or
when investigating filtered results and denied writes. `audit-auth-db` owns broader identity and
metadata propagation.

## Approach

### Step 1: Inventory Exposed Data and Final State

Discover exposed schemas, tables, views and callable functions from configuration, migrations and
actual callers. Start with all relevant tables, including those without RLS.
Reconcile ordered CREATE/ALTER/DROP and grant/revoke changes; historical CREATE POLICY matches
do not establish final policy state.

When a permitted database connection is available, inspect the target's catalogs and applied
migration state. Otherwise report the result as migration-derived, with live drift unverified.
Record table ownership, RLS enablement and FORCE state, roles/membership, table/schema grants,
policy definitions and privileged function paths.

### Step 2: Build an Effective-Access Matrix

Use one row per meaningful caller/table/operation case:

| Caller and path | Table/operation | Intended result | Effective grants and policy/function | Evidence/result |
| --- | --- | --- | --- | --- |
| <identity, tenant, direct or RPC> | <target and command> | <allow or deny, rows/fields> | <enforcement chain> | <state and proof or gap> |

Cover relevant owner, another user, another tenant, anonymous and privileged callers.
Account for command/role-specific and ALL policies, USING versus WITH CHECK, and permissive versus
restrictive composition. RLS enabled with no applicable policy defaults to deny; disabled RLS
does not. Grants and RLS are separate requirements. Superusers and BYPASSRLS roles bypass RLS;
owners normally do unless FORCE applies. Read the target version's
[PostgreSQL row security documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

### Step 3: Trace Indirect and Privileged Paths

Inspect views and RPCs that expose the same data under another effective identity.
A SECURITY DEFINER RPC can intentionally provide access denied to direct callers, but its own
authorization, privileges and search path need review (`audit-auth-db`, RPC Security Audit).
Do not recommend broader table policies merely because access is mediated through an RPC.

### Step 4: Compare Actual Operations

Locate database calls in the real client and server roots, including wrappers and generated access
layers. Determine operation, caller identity, target rows and expected result.
Check read prerequisites for UPDATE/DELETE and returned-row operations where applicable.
Distinguish permission errors, policy-check errors, filtered SELECT results and zero-row/no-op
mutations. An API returning no error does not prove that the intended row changed.

Use authorized disposable fixtures for behavioral checks: own-row success, foreign-row denial,
tenant separation, anonymous restrictions, privilege escalation and legitimate privileged use.
Inspect resulting rows as well as errors. Do not probe real users or mutate production as an audit
shortcut. Unavailable behavioral proof stays pending under `foundation-testing.md`.

### Step 5: Triage Gaps

Flag unintended exposure, blocked legitimate operations and mismatches between direct/RPC
consumers and the intended contract. Missing policies can be intentional default deny.
Rank impact from reachable operations and affected data, separately from a project's blocking
invariant. Do not invent future DELETE access merely to complete a CRUD grid.

## Output and Definition of Done

Deliver the matrix, source/target state, corroborating caller locations, findings and proposed
corrections. Each selected case is `finding | checked-clean | not-applicable | not-verified`.
Name exclusions, uncertain intent and the next check/owner for missing proof.
Preserve restrictive access when intent is unresolved. Redact tokens and personal data.
No policy, role, grant or application changes are made by this audit.
