---
name: use-codegraph
description: Use the local codebase-memory MCP knowledge graph for code discovery. Use when locating symbols, imports, callers, callees, ownership boundaries, dependency paths, architecture clusters, impact areas, or targeted snippets before reading files or changing code.
tier: core
---

# Use Codegraph

Use `codebase-memory-mcp` as the first-pass map for structural discovery. Treat current source files and
`git diff` as the final evidence when the graph and working tree disagree.

## Workflow

### 0. Reachability

Before checking freshness, confirm MCP is reachable at all: can I call any MCP tool here? (`list_projects`
or any other cheap call.) In a **spawned subagent** context, expect **NO** — MCP tools do not propagate
to a subagent launched via the Agent/Task tool. On unreachable: declare grep degraded-mode
**explicitly** up front (e.g. "graph discovery unavailable — using rg + targeted reads"), stop
attempting MCP calls, and proceed straight to the fallback (§4). Never fall back silently, and never
burn repeated failed MCP calls chasing a server that was never going to answer.

### 1. Confirm Availability and Freshness

1. Run `list_projects` and select the project whose `root_path` matches the repository.
2. If it is missing, run `index_repository` on the repository root.
3. **Assert index freshness before trusting a "ready" graph.** Compare last-indexed state against
   repo HEAD / recent commits via `index_status` and `detect_changes`. If stale: trigger a
   reindex, or fall back to grep **explicitly** — state that the graph is stale and results may
   be incomplete. Never fall back silently.
4. Check `git status --short` for task-relevant modified or untracked files.

`ready` means the graph is queryable — not fresh. Live incident: a graph reported ready but missed
same-day symbols, so agents fell back to grep without knowing coverage was incomplete. A stale
index that presents as fresh is worse than an absent one — same shape as a masked-green gate
(`foundation-testing.md`: never claim green on unrun evidence), one layer up. Run a full re-index
before a high-confidence review when relevant files are dirty, untracked, or being changed by
another agent. Re-index again if a result conflicts with the working tree.

Use `full` for first-time indexing, end-to-end review, or work that must include tests. Use `moderate`
or `fast` only for time-boxed exploration, inspect the indexer's exclusion report, and state the
limitation in the handoff.

### 2. Find and Disambiguate the Symbol

1. Use `search_graph` with a narrow label or file pattern.
2. Choose the exact `qualified_name` from the results.
3. Use `get_code_snippet` with that qualified name.
4. Use the full qualified name in `trace_path`, especially for common names such as `handlePointerDown`.

Short names can collide. Wrappers, closures, and import aliases can also leave real callers absent from
the graph. If a trace is empty or implausible, use `search_code` for exact imports and call sites, then
read only the targeted source files.

### 3. Choose the Smallest Useful Query

- Use `search_graph` for symbols and natural-language feature discovery.
- Use `search_code` for string literals, imports, and exact call syntax.
- Use `trace_path` for caller, callee, data-flow, and cross-service questions.
- Use `get_architecture` for module boundaries and architecture clusters.
- Use `detect_changes` for candidate impact areas, then reconcile them with `git diff` and current source.
- Use `query_graph` only after `get_graph_schema`; keep Cypher bounded with `LIMIT`.

Do not interpret broad `detect_changes` output or an empty `impacted_symbols` list as proof of impact or
no impact. See the project's code-graph MCP guide (if present, under `docs/knowledge-base/`) for tested recipes and failure recovery.

### 4. Reconcile Before Acting

Read the durable Knowledge Base contract, then the graph-identified source. If a snippet has the wrong
range, stale code, or a trace contradicts an exact source search:

1. Re-index once and retry the exact qualified-name query.
2. Fall back to `search_code`, `rg`, or targeted file reads if the mismatch remains.
3. Base edits and review findings on the current file and diff, not the stale graph result.

If the MCP server is unavailable, use `rg` and targeted file reads and state that graph discovery was
unavailable — this should already have been declared in Step 0, not discovered here.

## Guardrails

- Do not dump the whole graph or run unbounded Cypher.
- Do not index generated output, secrets, local agent settings, or optional graph snapshots.
- Keep API keys, user data, and PII out of graph queries and logs.
- Mention the useful graph query path, any re-index, and any source fallback in the handoff.
