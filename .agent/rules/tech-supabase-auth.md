---
trigger: glob
globs: "supabase/**"
tier: tech:supabase
domain: security
---

# Auth & Database Security Rule

Preserve intended access through the actual identity, privilege and migration model. Inspect
effective access; a policy count or familiar function template cannot establish security.
Use `foundation-security.md` for authority and `foundation-testing.md` for evidence validity.

Read the project's auth/database specification and locate migrations, clients, server handlers,
entitlement authority and session consumers. Names such as `profiles.is_admin`, `auth-atoms.ts`
and `sync_user_metadata` are possible project choices, not kit requirements.

## RPC Function Requirements

- Prefer invoker execution when caller privileges express the intended operation. Use definer
  execution for an identified privilege boundary; inspect the owner's privileges and RLS bypass,
  including indirect helpers. Authorize the operation before privileged work.
- Give each definer function an explicit safe function-level `search_path`. An empty path with
  schema-qualified relations is a supported Supabase pattern. Alternatively, use only trusted
  schemas with `pg_temp` explicitly last. Check object resolution, including helpers, operators,
  types and dynamic SQL. An empty path does not excuse unqualified relations; `public` is safe
  only when its effective CREATE privileges and contents meet the trust boundary. Inspect final
  CREATE/ALTER configuration, not just whether CREATE contains a particular literal.
- Derive caller identity from authenticated request context. For self-service operations, derive
  the target from that identity or reject a different supplied ID. Reject absent identity
  explicitly when required: SQL NULL comparisons are not a reliable procedural denial branch.
  Cross-user/tenant and service operations need their own verified grant; a parameter is not one.
- Discover the authoritative admin/entitlement source and freshness contract. Do not authorize
  from user-editable metadata or UI state. Validate trusted claims or live records according to
  that contract; do not invent a required profile table or JWT-first fallback sequence.
- Inspect effective EXECUTE through PUBLIC, explicit grants, role membership and creator-specific
  default privileges. Restrict unintended execution and grant intended callers using exact
  function signatures. Create a privileged function and restrict grants in one transaction where
  supported, avoiding an exposure window. Default-privilege changes affect future objects;
  reconcile existing functions separately. Include exposed schemas and reachable wrappers when
  assessing API access; private placement alone does not prove a helper unreachable.
- Preserve the public result/error contract. Expected denials may use deliberate exceptions or
  typed results; unexpected failures must not become apparent success. Sanitize client-visible
  errors and retain redacted diagnostics. Use exception handling with defined rollback,
  propagation and observability semantics, not unconditional `WHEN OTHERS` or catch-all JSON.
- Document consequential function purpose, callers and security model in migration comments or
  `COMMENT ON FUNCTION`, following project convention.

Primary guidance: [PostgreSQL function hardening](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
and [Supabase functions and privileges](https://supabase.com/docs/guides/database/functions).
Check the target PostgreSQL version before adopting version-dependent syntax.

## Migration Requirements

- Order schema and code dependencies so every referenced column/type/function exists before use.
  Check nullability, defaults, foreign keys and allowed values against relevant writers, including
  RPCs, seeds, webhooks and old clients still supported during an upgrade.
- Constraints express intended valid data. Do not widen a CHECK merely to accept a buggy writer.
  Inspect existing rows before tightening constraints; plan compatible backfills and deployment
  ordering where data or live consumers require them.
- Follow the migration runner's version/history contract. Use repeatable/idempotent operations
  when required, but `IF NOT EXISTS` does not prove an existing object has the right definition.
  Assert expected prior state or reconcile it explicitly. `CREATE OR REPLACE FUNCTION` has
  signature/return-type limits and preserves existing ownership/permissions; check those too.
- Verify both a fresh schema with seeds and upgrades from supported prior states for material
  schema changes. Exercise data preservation, final definitions/grants and failed/retried steps
  where applicable. A fresh reset alone does not prove an upgrade. Never reset a real target
  as a verification shortcut; use authorized disposable databases.

See [Supabase migration history and deployment](https://supabase.com/docs/guides/deployment/database-migrations).
Migration source describes intended state; applied history/catalog evidence describes the target.

## Metadata Sync Requirements

- Trace authority record → propagation → token/session/cache → server and UI consumers. Record
  required fields, defaults, issuer trust, synchronization failures and allowed staleness.
- Test grant, downgrade, revocation, expiry and failed refresh against actual consumers. Refresh
  sessions or invalidate caches where the chosen design needs it; a client refresh cannot revoke
  every already-issued token or enforce a server decision by itself.
- Keep UI visibility and authoritative enforcement distinct. If old claims can retain access,
  compare that window with the accepted revocation requirement and use the project's enforcement
  mechanism. Do not mandate JWT copies of fields that consumers never read.

[Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
explains user-editable metadata, trusted app metadata and JWT freshness limits.

## RLS Policy Requirements

- Inventory relevant exposed tables, including tables without RLS, plus views and function paths.
  Inspect final RLS enable/FORCE state, ownership, role membership, schema/table grants and policy
  definitions after all migrations. Enforce RLS on client-exposed tables whose access depends on it.
- Map meaningful caller/tenant/operation cases to intended allowed rows and fields or denial.
  RLS with no applicable policy defaults to deny. Missing SELECT/INSERT/UPDATE/DELETE policies can
  be intentional; do not add access to fill a four-policy quota. Document deliberate direct-deny
  or RPC-only paths near their definitions and compare them to real callers.
- Account for ALL and command-specific policies, USING versus WITH CHECK, permissive OR and
  restrictive AND composition, and read requirements of writes/returned rows. Grants and RLS
  solve different parts of access. Inspect owners, superusers, BYPASSRLS and privileged views/RPCs.
- Admin operations may use direct policies, server mediation or narrowly authorized definer RPCs.
  Select the existing design that enforces the contract; keep service credentials out of clients.
- Test legitimate use and denial using disposable identities/rows. Inspect returned rows and
  actual state: filtered reads and zero-row writes can succeed without performing the intended
  operation. Include cross-user/tenant, anonymous, forged target and privileged cases as relevant.

[PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) owns the
policy semantics. `verify-rls-policies` supplies the focused matrix; `audit-auth-db` traces the
full identity and entitlement path.

## Verification Triggers

Apply these checks when changing migrations, grants, policies, RPCs, auth clients/server handlers,
metadata propagation, session handling or access concepts, even outside the activation glob.
Record exact reviewed/applied state, method, outcomes and missing live/runtime proof. A static
audit can finish with limits; it cannot certify deployed access or authorize production mutation.
