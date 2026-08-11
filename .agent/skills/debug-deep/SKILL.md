---
name: debug-deep
description: Tree-of-thoughts debugging for elusive, intermittent bugs. Use when standard debugging fails or bug is hard to reproduce.
tier: core
required-tools: [codebase-mcp]
---

# Debug Deep

Paranoid debugging with false-premise detection and parallel investigation.

## Approach

### Phase 1: Challenge Premises
List every assumption in bug report. Test each as True/False:

**Assumption Testing Format**:
- **#1**: [Assumption] — Expected: [X] | Actual: [Y] | Verdict: TRUE/FALSE

### Phase 1.5: Copy Reference First

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
> [!IMPORTANT]
> If a **working reference** exists in the codebase (e.g., a similar component that works correctly), **copy it character-by-character first** before generating hypotheses. This prevents destructive over-engineering.

Steps:
1. Identify the working implementation (user often provides this)
2. Diff the broken vs working code line-by-line
3. Copy exact CSS/JS patterns, token names, and structure
4. Test if the bug is fixed before hypothesizing further

For rendering or motion bugs:
5. Compare the structural contract of working vs broken cases (container geometry, mount timing, visual treatment, state ownership)
6. Verify that any tokens, variables, or config used in the broken path are actually present in the runtime path

### Phase 2: Tree of Thoughts
> For each hypothesis, explore multiple investigation paths. Abandon dead ends immediately. Backtrack and try alternatives.

**Hypothesis Format**:
- **#1** Race condition (High confidence)
  - Path A: Add timing logs
  - Path B: Throttle test
  - Selected: A
- **#2** Stale cache (Medium confidence)
  - Path A: Clear cache
  - Path B: Inspect cache
  - Selected: B

Pursue multiple paths—don't converge prematurely.

### Phase 3: Fix Plan
- **Primary fix**: Detailed approach
- **Fallback plan**: Required before implementing

### Phase 4: Verify
1. **Failing repro test FIRST** — for intermittent bugs, make the repro deterministic (fake
   timers, seeded state) before fixing; watch it fail, then fix and watch it go green
2. Run the Graduated Verification Gate (`foundation-testing.md` §1) at the fix's blast radius

## Reflexion
Before implementing, verify fix won't:
- Fail under edge cases
- Introduce security vulnerabilities
- Degrade performance

## Constraints
- Must have fallback plan
- If fix fails, iterate (max 3 attempts)
- Document all assumption verdicts
