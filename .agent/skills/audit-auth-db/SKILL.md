---
name: audit-auth-db
description: Comprehensive audit of authentication flows, database schema, RLS policies, RPCs, and entitlements engine.
tier: tech:supabase
---

# Audit Auth & Database

Perform a Staff Engineer-level audit of the auth and database systems.

**Persona: Staff Engineer — Security & Data Integrity**
> "I trace every data path end-to-end. I verify what's written matches what's read."

## When to Use
- Before pushing auth/DB changes to production
- After creating new migrations, RPCs, or triggers
- After modifying entitlements engine or auth atoms
- Periodic health check (monthly)

## Audit Checklist

### Phase 1: Schema Validation
1. List all migrations in `supabase/migrations/` — verify ordering is correct
2. For each column referenced in code (RPCs, triggers, auth-atoms.ts, entitlements.ts):
   - Verify the column exists in a migration
   - Verify the column's type matches what code expects
3. For each CHECK constraint:
   - List ALL values written by ANY code path (grep for table inserts/updates)
   - Verify every written value is in the CHECK
4. Run `seed.sql` mentally against the schema — would all INSERTs succeed?

### Phase 2: RLS Policy Audit
5. For each table with RLS enabled, build a policy matrix:
   | Table | SELECT | INSERT | UPDATE | DELETE |
   |-------|--------|--------|--------|--------|
   Fill in the policy condition or "MISSING" for each cell.
6. Flag any MISSING policies that could cause silent data loss
7. Verify `access_codes` intentionally blocks all client access (documented with COMMENT)

### Phase 3: RPC Security Audit
8. For each `SECURITY DEFINER` function:
   - [ ] Has `SET search_path = public` in CREATE (not just ALTER)
   - [ ] Validates user identity (auth.uid() check)
   - [ ] Admin RPCs check `profiles.is_admin`
   - [ ] Returns structured JSON (not raw exceptions)
9. For each function with GRANT to `anon`:
   - [ ] Document WHY anonymous access is needed
   - [ ] Verify it can't be abused (rate limiting, input validation)

### Phase 4: Metadata Propagation
10. Trace the full metadata sync chain:
    - Source (subscriptions table columns) → sync_user_metadata trigger → auth.users.raw_app_meta_data → JWT claims → auth-atoms.ts parsing
11. For each field auth-atoms.ts reads from metadata:
    - [ ] Field is included in sync_user_metadata trigger output
    - [ ] Field has a source in the database (column exists)
12. Verify frontend calls `refreshSession()` after state-changing operations

### Phase 5: Admin Authorization Consistency
13. List every admin check in the codebase:
    - Frontend (auth-atoms.ts)
    - Edge Functions
    - RPCs
14. Verify all check the SAME authority source
15. Flag any path that trusts JWT metadata without fallback to `profiles.is_admin`

### Phase 6: Entitlements Alignment
16. List every tier value in entitlements.ts decision tree
17. Cross-reference with CHECK constraint values — flag mismatches
18. Verify every access decision path has a test in entitlements.test.ts

### Phase 7: Edge Function Security
19. Verify CORS patterns match ALL deployment domains (staging, production, previews)
20. Verify rate limiting is implemented
21. Verify error responses don't leak internal details
22. Verify admin authorization in Edge Functions

## Output Format

Generate a markdown report with:
1. Summary: PASS/FAIL with finding count by severity
2. Findings table: # | Severity | Title | Status | Fix
3. Policy matrix for all tables
4. Metadata sync trace diagram
5. Recommendations prioritized by severity

Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.
Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.

## Severity Levels
- CRITICAL: System will fail or produce wrong results in production
- HIGH: Security risk, data integrity risk, or silent data loss
- MEDIUM: Inconsistency that causes confusion or maintenance burden
- LOW: Minor improvement or tech debt
