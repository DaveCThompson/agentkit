---
trigger: model-decision
description: Consult when touching Supabase — keepalive/pause prevention, security (RLS, SECURITY DEFINER search_path), migrations.
tier: tech:supabase
domain: transport
---

# Supabase Rule

Guidance for the actual Supabase project, configuration, migrations and maintenance contract.
Use `tech-supabase-auth.md`, `tech-supabase-migrations.md` and `foundation-security.md`
for effective access and upgrade semantics. Locate the project's backend specification; do not
assume a particular KB path, table, function or secret name exists.

## Keepalive & Pause Prevention

### Database Heartbeat Policy

Check the project's plan and current [pausing policy](https://supabase.com/docs/guides/platform/free-project-pausing).
Free-plan low-activity evaluation is not a precise “one query resets a seven-day timer” contract.
A successful Edge Function response/log alone does not establish sufficient database activity
or availability. Correlate actual user/database activity and platform notices with the requirement.

If a heartbeat is an authorized operational requirement, use an existing bounded least-privilege
query or supported health signal and record its actual result. Do not query a presumed `profiles`
table, create recurring work, widen grants or use an administrative key merely to keep a project
awake. A heartbeat is not an uptime guarantee. Discuss the supported availability option when the
requirement exceeds the plan, without changing billing or service state absent authority.

## Security

### Service Role Usage

- Use the caller/role with only the access the maintenance operation needs. Internal execution or a
  shared endpoint secret does not itself justify bypassing RLS for all work.
- Secret/service-role credentials belong only in trusted server components with their own validated
  authorization and bounded operation. Keep them out of clients, URLs, logs and source.
- Inspect the actual key type, authorization header/session and client separation. Elevated access
  depends on the effective request identity; an initialized client name does not prove its role.
  Preserve legitimate user-scoped RLS and do not attach an unrelated user session to an admin path.
- Consult current [API key guidance](https://supabase.com/docs/guides/getting-started/api-keys)
  and [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).
  Key migration, rotation or protection changes require their actual action/target authority.
- Test needed legitimate access and denial on authorized disposable data. A configuration read is
  not proof of deployed endpoint authorization or database permissions.

## Migrations

### Drift Prevention

- For extension-dependent changes, inspect availability, installed version/schema and required
  privileges; `pg_extension` records installed extensions, not everything available to install.
- Record actual prerequisites and any manual dashboard steps in the existing migration/runbook
  location, including target and owner. Do not perform installation, deploy or set secrets merely
  because the document mentions them.
- Follow the migration runner's history and test supported fresh/upgrade paths, final definitions,
  data and access under `tech-supabase-migrations.md`. Report unperformed service checks explicitly.
