---
trigger: glob
globs: "supabase/**"
tier: tech:supabase
domain: security
---

# Auth & Database Security Rule

> **Related Knowledge Base:** docs/knowledge-base/SPEC-supabase.md (RLS model, RPC security, metadata sync).

## RPC Function Requirements

All Supabase RPC functions MUST:

1. **Search path hardening**: Include `SET search_path = public` in the function definition (not just via ALTER after creation)
2. **User identity validation**: If the function accepts a `p_user_id` parameter, verify `p_user_id = auth.uid()` before proceeding. Exception: admin RPCs that operate on other users.
3. **Admin authorization**: Admin RPCs MUST check `profiles.is_admin` as the authoritative source. JWT metadata (`app_metadata.role`) may be used as a fast check but MUST fall back to `profiles.is_admin`.
4. **Structured returns**: Return `json_build_object('success', boolean, 'error', text)` — never raise raw exceptions to the client.
5. **Exception handling**: Include `EXCEPTION WHEN OTHERS` to catch unexpected errors without leaking internal state.
6. **Documentation**: Include a `COMMENT ON FUNCTION` describing purpose and security model.

## Migration Requirements

1. **Column completeness**: Every column referenced in RPCs, triggers, or frontend code MUST exist in a migration that runs BEFORE the referencing code.
2. **CHECK constraint coverage**: Every value written by ANY code path (RPCs, seed.sql, frontend, webhooks) MUST be included in the CHECK constraint.
3. **Idempotency**: Use `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS` before `CREATE POLICY`.
4. **Seed.sql validation**: `seed.sql` must be insertable against a fresh schema (all referenced columns and CHECK values must exist).

## Metadata Sync Requirements

1. **Field completeness**: The `sync_user_metadata` trigger MUST sync every field that `auth-atoms.ts` reads from JWT metadata.
2. **Forced refresh**: After any operation that changes subscription state (grant, revoke, redeem), the frontend MUST call `supabase.auth.refreshSession()`.
3. **Admin flag**: `is_admin` must be synced to metadata OR the frontend must query `profiles.is_admin` directly — never rely solely on JWT for admin status.

## RLS Policy Requirements

1. **Full coverage**: Every table with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` must have explicit policies for SELECT, INSERT, UPDATE, DELETE — even if some are `USING (false)`.
2. **Admin operations**: Admin CRUD must go through `SECURITY DEFINER` RPCs, not direct table access.
3. **Documentation**: Tables with intentionally restrictive policies (e.g., `USING (false)` on `access_codes`) must have a `COMMENT ON TABLE` explaining why.

## Verification Triggers

This rule should be checked when:
- Creating or modifying any Supabase migration
- Creating or modifying any RPC function
- Modifying `auth-atoms.ts` or `entitlements.ts`
- Modifying `sync_user_metadata` trigger
- Adding new tier values or access control concepts
