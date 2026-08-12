---
name: verify-rls-policies
description: Use when auditing Supabase RLS policy completeness across tables after schema or policy changes and before production.
tier: tech:supabase
---

# Verify RLS Policies

Audit Row Level Security policies for completeness and correctness.

**Persona: Database Security Auditor**
> "Every table, every operation, every role — explicitly accounted for."

## When to Use
- After creating or modifying RLS policies
- After adding new tables
- Before production deployments
- When investigating silent data loss or access issues

## Approach

### Step 1: Inventory Tables with RLS
Search all migrations for `ENABLE ROW LEVEL SECURITY`:
```bash
rg "ENABLE ROW LEVEL SECURITY" supabase/migrations/
```
If `rg` is unavailable, use `grep -r` for the same search.

### Step 2: Build Policy Matrix
For each table, search all migrations for `CREATE POLICY ... ON {table}`:

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|

Fill each cell with:
- The policy condition (e.g., `auth.uid() = id`)
- `USING (false)` if explicitly blocked
- **MISSING** if no policy exists for that operation
- `via RPC` if the operation is handled by SECURITY DEFINER functions

### Step 3: Identify Gaps
Flag as findings:
- **CRITICAL**: Missing SELECT policy (users can't read their own data)
- **HIGH**: Missing UPDATE/DELETE policy on tables with admin RPCs (operations silently fail)
- **MEDIUM**: Missing DELETE policy (blocks future account deletion)
- **LOW**: Missing documentation for intentionally restrictive policies

### Step 4: Verify Admin Access Patterns
For each table that admins need to access:
1. Is there an admin-specific policy? (e.g., `profiles.is_admin`)
2. Or is access exclusively through SECURITY DEFINER RPCs?
3. Document which pattern is used and why

### Step 5: Cross-Reference with Frontend
Search frontend code for direct Supabase table operations:
```bash
rg "supabase\.from\(" src/
```
If `rg` is unavailable, use `grep -r` for the same search.
For each direct table operation:
1. What operation? (select, insert, update, delete)
2. What table?
3. Does a matching RLS policy allow this operation?
4. If not → this operation SILENTLY FAILS

## Output Format

### Policy Matrix
Full table of all tables × operations × policies.

### Findings
| # | Severity | Table | Operation | Issue |
|---|----------|-------|-----------|-------|

### Frontend Compatibility
| Frontend Call | Table | Operation | RLS Allows? | Notes |
|--------------|-------|-----------|-------------|-------|

### Recommendations
Prioritized list of policies to add/modify.
