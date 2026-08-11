---
name: implement-refactor
description: Code restructuring without behavior change. Use when improving code organization while preserving functionality.
tier: core
required-tools: [codebase-mcp, fallow]
---

# Implement Refactor

Restructure code without changing user-facing behavior.

## When to Use
- Code cleanup
- Reducing tech debt
- Improving maintainability
- Extracting shared patterns

## Approach

### Phase 1: Scope Definition

#### Comprehension: Code Graph First
Build understanding from the code graph before proposing or making changes (see
`integrations/codebase-mcp.md`):
1. **Confirm availability + freshness** — `list_projects`; if this repo is absent, `index_repository`
   on its root; check `index_status` when freshness matters, and re-index if relevant files are
   dirty/untracked.
2. **Locate + disambiguate** — `search_graph` (symbols / feature language) or `search_code` (imports,
   exact call syntax); pick the exact `qualified_name`; `trace_path` on that full name for
   callers / callees / data flow.
3. **Read exact source** — `get_code_snippet` on the chosen `qualified_name`; `get_architecture` for
   module boundaries.
4. **Reconcile Before Acting** — the current file + `git diff` outrank a stale graph. If a snippet
   range is stale or a trace contradicts an exact `search_code`, re-index once, then trust the
   working tree.
5. **Fallback** — if the MCP server is unreachable, use Grep/Read for targeted discovery and note in
   the handoff that graph comprehension was degraded. Never block on the graph.
1. **Refactoring Goal**: Specific code smell or tech debt
2. **Behavior Invariants**: List behaviors that MUST NOT change
3. **Scope Boundaries**: In-scope vs out-of-scope files

### Phase 2: Safety Net
- List existing tests
- Define manual verification for each invariant

### Phase 3: Refactoring Plan

#### Reuse Before You Add (Duplicate / Dead-Code Check)
Before introducing a new utility, hook, component, or dependency, prove it does not already exist
(see `integrations/fallow.md`):
1. **Duplication scan** — `npx --no-install fallow dupes --skip-local` (cross-directory clones);
   raise signal with `--min-tokens <n>` or `--mode semantic` when noisy.
2. **Don't delete on a hunch** — before removing an "unused" export/dep, confirm reachability with
   `fallow dead-code --trace <file>:<export>` or `--trace-dependency <name>`.
3. **Orient before editing** — `fallow inspect --file <path>` (or `--symbol <FILE:EXPORT>`) bundles
   the evidence for a target.
4. **Fallback** — if fallow is unavailable, search for existing implementations via the code graph
   (`search_graph` / `search_code`) or Grep, and state in the plan that the duplicate check was manual.
List atomic transformation steps.

**Reflexion Loop**: Act as **Hostile Reviewer**:
> "I review for long-term maintainability, not just correctness."
Identify 3 ways the proposed refactoring could break existing behavior or introduce subtle regressions. Revise the plan to address these risks.

### Phase 4: Execution
For each step:
1. Make one change
2. Verify behavior unchanged
3. Run `lint` + `typecheck` (the always tier of `foundation-testing.md` §1)
4. Repeat

### Phase 5: Verification
Run the Graduated Verification Gate (`foundation-testing.md` §1–2) at the behavior-change tier —
behavior preservation is PROVEN by the touched domain's focused tests plus `build`, not asserted.
- [ ] All behavior invariants verified
- [ ] Touched domain's tests + build pass — actually ran on this branch, no unrun-green claims
- [ ] No regressions

## Constraints
- **NO behavior changes**
- If bug discovered, note but do NOT fix (separate concern)
- Each transformation independently reversible
