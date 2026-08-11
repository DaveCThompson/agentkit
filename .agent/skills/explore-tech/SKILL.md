---
name: explore-tech
description: Evaluate technical options (libraries, architecture patterns, performance tradeoffs). Use when exploring "how should we build this?" or "what library/approach should we use?"
tier: core
required-tools: [codebase-mcp]
---

# Explore Tech

Evaluate technical solutions, libraries, and architecture patterns.

## When to Use
- Evaluating library or framework options
- Exploring architectural approaches
- Analyzing performance tradeoffs
- Comparing implementation strategies

## Approach

### Phase 1: Problem Definition

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
Ask 3-5 probing questions to clarify:
- What problem are we solving?
- What are the constraints (performance, bundle size, learning curve)?
- What existing patterns must we integrate with?

### Phase 2: Options Analysis
Generate **3-4 distinct options** that differ meaningfully in approach.

For each option, evaluate:
- **Pros**: Benefits, alignment with existing patterns
- **Cons**: Complexity, maintenance burden, learning curve
- **Effort**: Low / Medium / High

### Phase 3: Recommendation
Synthesize findings into a clear recommendation with rationale.

## Constraints
- No code generation — exploration only
- No new dependencies not in `package.json` without explicit approval
- End with: "Which direction feels most aligned with our goals?"
