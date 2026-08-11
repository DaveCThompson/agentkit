---
trigger: glob
globs: "supabase/migrations/**"
tier: tech:supabase
domain: transport
---

# Migration Safety Rule

## Idempotency Requirements

All Supabase migrations MUST be safe to run multiple times.

### Required Patterns
- `CREATE TABLE IF NOT EXISTS` — never bare `CREATE TABLE`
- `ADD COLUMN IF NOT EXISTS` — never bare `ADD COLUMN`
- `CREATE OR REPLACE FUNCTION` — never bare `CREATE FUNCTION`
- `DROP POLICY IF EXISTS` before `CREATE POLICY` (Postgres doesn't support `IF NOT EXISTS` for policies)
- `CREATE INDEX IF NOT EXISTS` — never bare `CREATE INDEX`

### Constraint Safety
For CHECK constraints:
```sql
-- WRONG: will error if constraint already exists
ALTER TABLE t ADD CONSTRAINT c CHECK (...);

-- RIGHT: check existence first
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'c') THEN
    ALTER TABLE t ADD CONSTRAINT c CHECK (...);
  END IF;
END $$;
```

Or use inline column CHECK (which is idempotent with ADD COLUMN IF NOT EXISTS):
```sql
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN (...))
```

## CHECK Constraint Completeness

Before creating or amending a CHECK constraint:

1. **Grep the entire codebase** for INSERT/UPDATE/upsert statements targeting the column
2. **Check all RPCs** that write to the column
3. **Check seed.sql** for any INSERT with that column
4. **Check entitlements.ts** and **auth-atoms.ts** for tier/status values they handle
5. Every value found MUST be in the CHECK constraint

## Function Security

All `SECURITY DEFINER` functions must include `SET search_path = public` in the function body (not just via ALTER):

```sql
-- RIGHT: search_path in CREATE
CREATE OR REPLACE FUNCTION my_func()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;

-- WRONG: search_path only via ALTER (lost on CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION my_func() ...;
ALTER FUNCTION my_func() SET search_path = public;
```

## Verification Trigger

This rule applies when:
- Creating any file in `supabase/migrations/`
- Modifying any existing migration
- Creating or modifying seed.sql
