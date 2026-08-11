---
name: plan-architecture
description: Create technical architecture specification with data models, component hierarchy, and risk analysis. Use after PRD approval for large features.
tier: core
required-tools: [codebase-mcp, fallow]
---

# Plan Architecture

Create a technical architecture specification.

## When to Use
- After PRD approval for large features
- Complex technical decisions
- Cross-cutting system changes

## Artifacts
- `docs/working/PLAN-<topic>.md`

## Approach

### Phase 1: Requirement Mapping

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
- Map PRD requirements to architectural components
- Verify constraints (existing patterns, dependencies)

### Phase 2: Options Evaluation
Generate **3-4 architectural options**.

Consult expert frameworks:
- **SOLID Principles**: Component design
- **CAP Theorem**: Data consistency (if applicable)
- **OWASP Top 10**: Security considerations

Use Socratic Debate for evaluation.

### Phase 3: Detailed Specification

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

#### Data Flow Diagram
Show how data moves through the system.

#### Data Model
Define types, interfaces, atoms/state.

#### Component Hierarchy
```
ParentComponent
├── ChildA
│   └── GrandchildA1
└── ChildB
```

#### State Management
Define atoms, derived state, effects.

#### File Manifest
**File Manifest**:
- [NEW] `<path/to/NewComponent.tsx>` — New component implementation
- [MODIFY] `<path/to/state-barrel>` — Add new atom for feature state

### Phase 4: Risk Analysis
Reflexion as **Chaotic Junior Developer**:
> "I will call functions in unexpected orders and ignore documentation."
- **Attack Vector 1**: How could this fail under rapid state changes or race conditions?
- **Attack Vector 2**: What breaks if API returns malformed or unexpected data?
- **Attack Vector 3**: What breaks if called before initialization?

### Phase 5: Phased Implementation
Break into atomic, verifiable phases.

## Constraints
- No code generation — architecture only
- No one-off patterns — leverage existing documented patterns
- Request user approval before BUILD phase

## The Architecture Doc Must End With
- **Decisions needing sign-off** — 2–4 specific choices the reader must approve before build. Lead
  the whole spec with the decisions most likely to change (data model, boundaries, contracts) and
  their change-cost; the mechanical phases come last (order by tweakability, not build sequence).
- **Verification** — how each phase is proven, with the commands scaled to blast radius per the graduated gate in `foundation-testing.md`.
- **Blast radius & rollback** — the systems each phase can affect and the per-phase revert path, so the plan is safe to execute incrementally.
