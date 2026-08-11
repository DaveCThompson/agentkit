---
name: plan-feature
description: Creates lightweight implementation plan for medium features (1-5 files). Use when requirements are clear and no UX exploration needed.
tier: core
required-tools: [codebase-mcp, fallow]
---

# Plan Feature

Pattern-driven planning: Understand → Explore Options → Debate → Plan Atomically.

## Approach

### Phase 0: Knowledge Base Recon
- [ ] **KB routing (mechanical)**: run `agentkit check --kb <files-about-to-touch>` and read the
      1–3 matching KB docs — `applies-to` globs decide relevance, never memory.
From the project's KB index under `docs/knowledge-base/` (the map), read **only** the 1-3 specs/strategy docs that
govern the affected area — not none, not all. Treat any existing spec as the contract to extend,
not reinvent.

### Phase 1: Discovery

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
1. **Proof of Understanding**: One-sentence feature summary
2. **Impact Analysis**: Related components, shared state, design system implications

### Phase 2: Approach Evaluation
Generate **3-4 strategies** (not variations of one idea).

**Socratic Debate**:
- Proponent: Argues for the solution, highlighting benefits and pattern consistency.
- Adversary: Critiques the solution, finding complexity, maintenance burden, and holes.
- Synthesis: Resolves the debate with a stronger, modified solution and clear rationale.

**Approach Comparison**:
- **Approach A**: Pros — [...], Cons — [...], Effort — Low/Med/High
- **Approach B**: Pros — [...], Cons — [...], Effort — Low/Med/High

### Phase 3: File Changes

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

**File Changes**:
- [NEW] `path/to/file.tsx` — Description of changes
- [MODIFY] `path/to/existing.tsx` — Description of changes

Break into atomic, testable steps.

## Reflexion
Before finalizing, identify 3 risks:
1. If requirements change, how many files update?
2. Can this be tested in isolation?
3. Will next developer understand why?

## Constraints
- No code generation — plan only
- No one-off patterns
- Steps must be atomic and testable

## Output
`docs/working/PLAN-<topic>.md` with approach comparison, file changes, phased steps.

**Order by change-likelihood, not build sequence.** Lead the plan with the decisions most likely to
change — data models, API shapes, user-facing choices — each with its alternatives and the *cost of
changing it later*; compress the mechanical work (wiring, refactors, migrations, tests) near the
bottom. Planning exists to get feedback while changes are still cheap, so the reader hits the
expensive-to-reverse choices first.

The plan document MUST end with:
- **Decisions needing sign-off** — 2–4 specific yes/no or pick-one choices the reader must approve
  before build. Known unknowns get a stated default assumption + the signal that would flip it.
- **Verification** — the exact commands and ownership lanes that will prove the change works,
  scaled to `foundation-testing.md`: focused local proof during implementation, one broad gate on
  the final tree, and release validation only at a release boundary.
- **Blast radius & rollback** — one line naming what this change can break and the revert path if it does.
