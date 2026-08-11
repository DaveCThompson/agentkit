---
name: implement-feature
description: Full feature implementation from an approved plan. Use when you have an approved `docs/working/PLAN-<topic>.md` and are ready to build.
tier: core
required-tools: [codebase-mcp]
---

# Implement Feature

Full feature implementation from an approved plan.

## When to Use
- After `plan/feature` or `plan/architecture` approval
- Building new functionality
- Implementing approved designs

## Artifacts
- `docs/archive/2026-MM/LOG-<topic>.md` created on completion (via `/wrap-up`)

## Approach

### Phase 1: Pre-Flight Checklist
- [ ] **KB routing (mechanical)**: run `agentkit check --kb <files-about-to-touch>` and read the
      1–3 matching KB docs — `applies-to` globs decide relevance, never memory.

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
- [ ] Load approved `docs/working/PLAN-<topic>.md`
- [ ] From the project's KB index under `docs/knowledge-base/` (the map), read the 1-3 governing specs/strategy docs
      for the affected area — not none, not all
- [ ] View relevant files
- [ ] Acknowledge design system rules
- [ ] Confirm dev server is running

### Phase 2: Execution Loop
For each phase in the plan:
1. Implement changes
2. Run the Graduated Verification Gate (`foundation-testing.md` §1) at the tier this phase's
   change class demands: `lint` + `typecheck` always; focused domain tests on behavior/schema/route
   changes; `build` when the change is SSR/routing/build-affecting

**Deviation ledger (solo path).** Planning can't surface every unknown — some only appear while
building. Keep a running list of every departure from the plan (approach changed, step skipped,
surprise dependency) and every edge case discovered, each with the why and, for a deviation, whether
it's reversible. Prefer the reversible option and keep going; escalate an *irreversible* choice
before taking it. This is the solo equivalent of `worker-execute`'s Phase 4 ledger, and it feeds the
distillation + changelog in `/wrap-up` — an unlogged deviation is invisible drift.

**Anti-Hallucination**: Verify library APIs exist before using.

### Phase 3: Pre-Approval Self-Correction
Assume **Hostile QA** persona:
> "I'm a tester who gets paid per bug found."
- What edge cases are missed (empty states, error states, loading states)?
- What regression risks exist?
- What boundary conditions could break?
Fix silently before presenting.

### Phase 4: Lifecycle Gate
For a standalone final tree, run or cite the one broad final-tree gate from `foundation-testing.md`
§1 before claiming `done`. When this work feeds an integration tree, record focused local proof and
hand ownership of the broad gate to the integration owner. Never present unrun commands as green.
Apply `foundation-browser-usage.md` for any runtime or human lane; stop only when that lane requires
user or reviewer action.

### Phase 5: Cleanup & Documentation
- Remove dead code
- Add architectural invariant comments

## Constraints
- Do NOT deviate from plan without user consent
- No new lint errors
