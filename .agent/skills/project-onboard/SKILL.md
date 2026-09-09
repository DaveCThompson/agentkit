---
name: project-onboard
description: Load project context index-first — read the routers (AGENTS.md, KB trigger table, working README), not the corpus; deep pass only for a genuinely unfamiliar repo. Use when starting a new session or on a significant context switch.
tier: core
required-tools: [codebase-mcp, agentkit]
---

# Project Onboard

Orient by reading the project's maps, then the documents governing the task. Resolve the docs root,
KB-equivalent and sanctioned layout from repository instructions; the paths below are defaults.
The routing contract lives in `governance/docs-standard.md` §(d), with layout exceptions in §(g–h).
Use `.agentkit.json` `docs.kbRoot` when declared; it defaults to `docs/knowledge-base`.

> Scoped recon of one *unfamiliar area* (a module or domain) before working in it — landmines,
> hidden constraints, exemplars — is `blindspot-pass`, not this skill. Onboard reads the whole-repo
> routers; blindspot-pass goes deep on one surface.

## Approach

### Light onboard (default) — read the routers only

1. **`AGENTS.md`** — the entrypoint: protocol, rule surface, project shape.
2. **KB README trigger table** (`<docs-root>/knowledge-base/README.md`) — the map of durable
   spec/strategy/decision, phrased as *when to read it*. Read the table; do **not** read the docs
   it points to yet. Respect ⚠ drift markers — a flagged doc is verify-before-trust.
3. **Working index** (`<docs-root>/working/README.md`) — locate the caller's active work item.
   Read its authoritative status, accepted decisions, remaining outcomes and proof obligations.
   Check actual branch/HEAD and task-relevant status through read-only Git inspection when relevant;
   an index or branch-state note is not evidence of the current checkout.
4. **Manifest scan** — `package.json` (or equivalent): scripts, workspaces, key dependencies.

Stop when governing constraints, relevant surfaces and current work identity are known. Read counts
are not completion criteria. Do not install tools or start a server merely to orient.
Committed generated guidance can be read on a fresh clone without local CLI setup. Diagnosis and
updates additionally need the computer's runnable kit binding and prerequisites; a missing binding
does not authorize install, sync or lock deletion. Follow `governance/migration-checklist.md` for
the operator path and preserve inherited ownership when the checkout moved.

### Route, don't read

Individual KB docs are read **at the moment of need**, not during onboarding:

- When the task names files, match them against KB `applies-to` globs — mechanically via
  `agentkit check --kb <paths…>` where the CLI is available — and read what matches.
- Otherwise, scan the trigger table for rows matching the session's task.
- Read the matching governing documents fully. A missing match is a coverage limit, not a reason
  to invent a relevant document or read the entire corpus.

### Truth ranking — when the routers disagree

Choose evidence for the question:

- Current behavior: current source and applicable runtime evidence. A green command only supports
  the behavior it exercised.
- Intended behavior: accepted requirements and later user decisions. Existing code can violate them.
- Checkout or integration state: actual Git refs, ancestry and task-relevant changes.
- Work status: the authoritative work item under `pattern-docs-artifacts.md`,
  "Status-of-Record Contract". Scheduling indexes derive that status.
- History: changelog entries and commits establish what was recorded at that time.

State material contradictions with their evidence and owner. Do not silently reinterpret intended
behavior from code or mark work complete from a changelog claim. On resume, distinguish accepted
decisions from assumptions and preserve completed work, superseded scope and unresolved acceptance
for the readiness or implementation owner; onboarding itself does not approve a new plan.

### Index-health check (flag, don't compensate)

If an index is absent, misleading or only a title list, report the routing limitation and point its
owner to `maintain-docs`. Use bounded filename/content discovery for the task's governing documents.
Do not compensate with a corpus scan or repair an index as part of a read-only onboarding request.

### Deep onboard (exception) — only on explicit request or a genuinely unfamiliar repo

Triggers: the user asks for a deep/full onboard, or you have never worked in this repo and the
task is architectural (not a scoped fix). Adds:

1. Foundation docs in the resolved KB (project overview, vision, terminology —
   whichever the project keeps).
2. The project's architecture-and-stack overview, if present and relevant.
3. A scan of `.agent/rules/*.md` headings (full reads only for rules matching the task).
4. For structural code questions, use `use-codegraph` for server-specific reachability, bounded
   freshness checks and targeted source fallback. The declared graph dependency is conditional on
   that need; unrelated MCP availability is not a graph probe. Do not index just to satisfy onboarding.

## Verification / Definition of Done

- [ ] Governing instructions, relevant surfaces and the current work item are identified, or the
      precise missing context is stated.
- [ ] The handoff preserves intended outcomes, decisions, assumptions and remaining work. It need
      not repeat facts already established in the session.
- [ ] Evidence conflicts, index limitations and any deep-discovery reason are explicit.
