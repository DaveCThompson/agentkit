---
trigger: model-decision
description: Consult when touching Supabase — keepalive/pause prevention, security (RLS, SECURITY DEFINER search_path), migrations.
tier: tech:supabase
domain: transport
---

# Supabase Rule

**Version:** 1.0 | **Updated:** 2026-05-10

Guidelines for Supabase configuration, migrations, and runtime maintenance.

> **Related Knowledge Base:** docs/knowledge-base/SPEC-supabase.md (service-role vs anon key, target backend architecture).

---

## Keepalive & Pause Prevention

### Database Heartbeat Policy
Supabase pauses free-tier projects after 7 consecutive days of inactivity. "Activity" is defined strictly as **database read or write interactions**.

- **Requirement**: The `keepalive` Edge Function (or any heartbeat mechanism) **MUST** perform actual database activity.
- **Implementation**: Use the Supabase client to execute a lightweight query (e.g., `SELECT id FROM profiles LIMIT 1`).
- **Prohibition**: Empty responses (e.g., `204 No Content`) or logging-only functions are prohibited for keepalive purposes as they do not reset the inactivity timer.

---

## Security

### Service Role Usage
- **Edge Functions**: Internal maintenance tasks (like `keepalive` or `admin-stats`) should use the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS, provided they are protected by a shared secret or admin authentication.
- **Client Side**: Never expose the Service Role key to the client.

---

## Migrations

### Drift Prevention
- Always check `pg_extension` before deploying migrations that rely on extensions (e.g., `pg_cron`, `pg_net`).
- Document any manual dashboard steps required (e.g., enabling extensions or setting secrets) in the migration README.
