---
name: research-synthesize
description: Apply external research findings to project context. Use when you have research documents and need to map them to actionable recommendations.
tier: core
required-tools: [codebase-mcp]
---

# Research Synthesize

Apply external research findings to the project.

## When to Use
- Have research documents to process
- Need to map findings to project constraints
- Filtering relevant insights

## Approach

### Phase 1: Research Ingestion
- Document inventory
- Cross-reference themes

### Phase 2: Relevance Filtering
Score each finding:

**Finding Evaluation Format**:
- **Finding**: [Description] — Relevance: 1-5, Feasibility: 1-5, Alignment: 1-5

**Threshold**: Discard if Relevance < 3 OR Feasibility < 3.

### Phase 3: Mapping to Existing Systems

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
- Map to design tokens/components
- Note adaptation requirements
- Check dependency constraints

### Phase 4: Recommendation Synthesis
- Ranked recommendations
- Implementation hints
- Open questions

## Output
`docs/working/REVIEW-research-application-<feature>.md` ending with: "These are the top recommendations. Ready for PRD scoping?"

## Constraints
- No original ideation — recommendations trace to research
- No new dependencies without approval
- No code generation
