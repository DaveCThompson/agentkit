---
name: debug-standard
description: Systematic root cause analysis for reproducible bugs. Use when user reports a bug that can be reproduced.
tier: core
required-tools: [codebase-mcp]
---

# Debug Standard

Forensic analysis: Observe → Hypothesize → Investigate → Fix → Verify.

## Scope Escalation
If fix touches >5 files or shared API, escalate to `debugging-deep`.

## Approach

### Phase 1: Reproduce
Document precisely:
- Steps to reproduce (numbered)
- Expected vs actual behavior
- Environment (browser, OS)

### Phase 2: Hypothesize

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
Generate **3-4 hypotheses** tracing from data source downstream:

**Hypothesis Format**:
- **#1** [Hypothesis] — Confidence: High/Medium/Low — Evidence Needed: [What to check]
- **#2** [Hypothesis] — Confidence: High/Medium/Low — Evidence Needed: [What to check]

When debugging UI styling issues:
- verify the computed property is valid before tuning values
- verify dependent tokens or configuration exist in the runtime path, not just the source file you edited
- prefer proving a property is dropped, overridden, or never resolved before adjusting numbers by feel

### Phase 3: Root Cause
Confirm with evidence (file:line reference). Plan holistic fix.

### Phase 4: Implement & Verify
1. **Failing repro test FIRST**: write the test that reproduces the bug, watch it fail
2. Implement the fix; the repro test goes green
3. Run the Graduated Verification Gate (`foundation-testing.md` §1) at the fix's blast radius

If a runtime or human lane remains, report the exact pending check and follow
`foundation-browser-usage.md`.

## Reflexion
Before implementing:
- What regression risks?
- What edge cases might fail?
- What if data is malformed?

## Constraints
- Fix pattern, not just instance
- If fix fails, iterate (max 3 attempts)
- No code until root cause confirmed
