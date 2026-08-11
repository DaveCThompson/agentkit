---
name: implement-quick-fix
description: Atomic code changes for small fixes (≤30 lines, ≤5 files). Use for bug fixes, minor tweaks, and small improvements.
tier: core
required-tools: [codebase-mcp]
---

# Implement Quick Fix

Atomic code changes for small-scope fixes.

## When to Use
- Bug fixes
- Minor tweaks (≤30 lines, ≤5 files)
- Small improvements with clear scope

## Scope Gate
If scope exceeds ≤30 lines or ≤5 files, **STOP** and escalate to `plan/feature`.

## High Risk Gate
If touching `/config/`, `/security/`, or `/.github/`, **STOP** and notify user.

## Approach

### Phase 1: Scope Confirmation
Confirm:
- Estimated lines of change
- Files affected
- No high-risk paths

### Phase 2: Analysis

#### Comprehension: Targeted Graph Lookup
Scope is small (≤30 lines), so use the graph surgically (see `integrations/codebase-mcp.md`):
`search_graph` to locate the exact symbol, `get_code_snippet` for its current source, and
`trace_path` only if the fix touches a shared symbol. Current file + `git diff` outrank a stale
graph; fall back to Grep/Read if the server is unreachable (note the degraded comprehension).
- Review holistic design principles
- Check for pattern consistency
- Identify regression risks

### Phase 3: Execution
1. Make the change (for a bug fix: failing repro test first — see `foundation-testing.md` §1)
2. Verify via the Graduated Verification Gate (`foundation-testing.md` §1): `lint` + `typecheck`
   always; a focused test if behavior changed; `build` only if the change is build-affecting
3. If errors, fix (max 3 attempts)

### Phase 4: Lifecycle Handoff
Record focused proof and the verification-lane owner. If this is a standalone final tree, run or
cite the one broad gate; if a runtime or human lane remains, report the exact pending check.

## Constraints
- If scope larger than expected, notify user immediately
- No hardcoded secrets or unauthorized network calls
