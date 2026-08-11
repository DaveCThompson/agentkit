---
name: codebase-mcp
description: Codebase Memory MCP — knowledge-graph comprehension layer (search_graph, trace_path, get_code_snippet, query_graph). The standard pre-change comprehension step.
mcp-name: codebase-memory-mcp
mcp:
  command: codebase-memory-mcp
check-command: codebase-memory-mcp --help
doc-urls: (local tool — run `codebase-memory-mcp --help`; graph UI at http://localhost:9749 when `--ui=true`; no public docs page)
last-verified: 2026-08-10
---

# Codebase MCP (`codebase-memory-mcp`)

**What it is:** a local MCP server (verified `codebase-memory-mcp 0.8.1`) that indexes a repository
into a code knowledge graph and serves structural queries. It is the fleet's standard *comprehension*
layer — the first-pass map you consult before reading files or changing code.

Tools the server exposes (from `--help`):
`index_repository`, `search_graph`, `query_graph`, `trace_path`, `get_code_snippet`,
`get_graph_schema`, `get_architecture`, `search_code`, `list_projects`, `delete_project`,
`index_status`, `detect_changes`, `manage_adr`, `ingest_traces`.

**Install / provision (per project):**
- Binary on PATH (verified callable). `codebase-memory-mcp install [-y]` registers the server
  into detected agents (Claude Code, Codex CLI, Gemini CLI, OpenCode, Antigravity, …); `update` /
  `uninstall` manage it.
- Registered per project by `agentkit sync` when `.agentkit.json` declares
  `"tools": ["codebase-mcp"]`: Claude gets `.mcp.json`, Codex gets `.codex/config.toml`, and
  OpenCode gets root `opencode.json` under `mcp.<name>` with a native command array. It's
  `agentkit init`'s starting recommendation for every new project
  (`governance/DECISION-default-tool-baseline.md`) — drop it if the codebase is small enough that
  Grep/Read already comprehend it in one pass.
- ⚠ Known stale registration: some tools keep a copy in a global config (per-user docs folder, or a
  cloud-synced Documents tree). If `agentkit doctor` reports a stale registration, point the config
  at the project-local `.mcp.json` that sync generates, and prefer project-local config for OpenCode.

**Index a repo (first use):** run the `index_repository` tool on the repo root (or
`codebase-memory-mcp cli index_repository '{"path":"<root>"}'` for a one-shot). Confirm with
`list_projects` (root_path matches) and `index_status`. Use `full` for first-time / review-grade
indexing; `moderate`/`fast` only for time-boxed exploration (state the limitation in the handoff).

**How to use it well (skills that declare `required-tools: [codebase-mcp]`):**
- **plan / implement / explore-tech:** query the graph BEFORE proposing changes — `search_graph` to
  locate the symbol, pick the exact `qualified_name`, `trace_path` its callers/callees, then
  `get_code_snippet` for exact source; grep/read only what the graph cannot answer.
- **debug:** `trace_path` from the symptom site to candidate causes, and use the graph to find a
  working reference to diff against, instead of speculative file reading.
- **Reconcile Before Acting:** the current file + `git diff` outrank the graph. If a snippet range is
  stale or a trace contradicts an exact `search_code`, re-index once, then trust the working tree.
- **search_code** is graph-augmented grep for imports / exact call syntax; **get_architecture** gives
  module boundaries; **query_graph** (Cypher) only after `get_graph_schema`, always bounded by `LIMIT`.

**Fallback when unreachable:** state that the graph is down, fall back to Grep/Read for targeted
discovery, and note the degraded comprehension in the plan/handoff. Never block on the graph.

**`agentkit doctor` callability bar (decision 19):** the server is only "reachable" when (1) the
binary is present (`codebase-memory-mcp --help` exits 0), (2) this repo appears in `list_projects`
with a matching `root_path`, and (3) the graph is fresh (`index_status` = ready, no relevant
dirty/untracked files unindexed). A skill that leans on an unreachable/stale graph is broken.

**Skills that depend on it:** `plan-feature`, `plan-architecture`, `implement-feature`,
`implement-quick-fix`, `implement-refactor`, `explore-tech`, `debug-standard`, `debug-deep`
(and `research-synthesize` conditionally). The `use-codegraph` skill is the consumer-facing wrapper.
