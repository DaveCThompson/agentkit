---
trigger: glob
globs: ["supabase/migrations/**", "supabase/seed.sql"]
tier: tech:supabase
domain: transport
---

# Migration Safety Rule

## Idempotency Requirements

Determine how this project applies and records migrations. A versioned migration normally advances
a known prior state once; a repeatable seed or repair script may need safe reruns. Do not add
`IF NOT EXISTS` or `CREATE OR REPLACE` mechanically: skipping an incompatible existing object can
hide schema drift, and replacing a routine does not by itself reconcile callers or privileges.

Use the project's ordered migration history. Preserve already deployed history unless a deliberate
repair procedure covers every affected environment. Test the supported fresh-install and upgrade
paths. If a script promises reruns, test those too, including partially applied state where feasible.
[Supabase migration tracking](https://supabase.com/docs/guides/deployment/database-migrations#how-migration-tracking-works)
distinguishes repository files from the target database's applied history.

### Required Patterns

Choose DDL according to the intended transition, not a universal syntax ban:

- Qualify objects and identify the exact schema/table/routine signature.
- If checking an existing constraint, include its owning relation/schema and verify its definition;
  a same-named constraint on another table is not evidence of the desired state.
- Verify an existing column, index or function is compatible before treating an existence guard
  as success. A no-op must not conceal a missing correction.
- Review data backfills, locks, transaction boundaries, concurrent access and old/new application
  compatibility. Choose bounded rollout/recovery steps where the change requires them.
- Serialize migrations against the same target. Do not reset, deploy or repair a real database
  merely to validate authored SQL; use authorized disposable fixtures.

## CHECK Constraint Completeness

Trace the actual writers, RPCs, seed/import paths and consumers for the affected values.
Separate legitimate domain states from malformed or unauthorized writes; do not add every observed
value to an allowlist. Check existing data before tightening a constraint, and define how invalid
rows are corrected, quarantined or rejected.

Account for nullability, transition states, defaults and application compatibility.
A CHECK expression that permits NULL does not replace NOT NULL; use the intended constraints
and test accepted and rejected cases. See [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).
Do not assume project-specific entitlement or auth filenames exist.

## Function Security

Use `foundation-security.md` and `tech-supabase-auth.md` for effective access and privileged
routine boundaries. Inspect the deployed function definition, owner, language, search path and
EXECUTE grants after the migration. Use a trusted path or empty path with appropriately qualified
references; never assume `public` is safe simply because it is the default schema.

Include the intended security attributes in the authoritative migration and verify they survive
the project's replacement/alter sequence. A function-level ALTER may be valid; its ordering and
final state need proof. Neither a CREATE spelling nor a path setting alone establishes access safety.

## Verification Trigger

Apply this rule to migration and seed changes, and to repair proposals that alter applied history.
Report the target identities, paths exercised, observed schema/data/access outcomes, recovery limits
and unverified environments. Generic green application tests are not database migration proof.
