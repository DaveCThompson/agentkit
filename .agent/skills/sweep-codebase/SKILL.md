---
name: sweep-codebase
description: Periodic detection sweep across 4 scopes (code, docs, hygiene, agent) that files backlog tickets for findings. Use for scheduled maintenance scans, not targeted audits.
tier: core
required-tools: [fallow]
---

# Sweep Codebase Skill

Logic for analyzing the codebase and generating maintenance tickets.

## Instructions

When performing a sweep, follow the logic for the requested scope(s):

### 1. Code Evolution (`scope: code`)

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
- **Git Hotspots**: Scan git history (7 days). If a file has >3 commits, flag for refactor review.
- **Pattern Repetition**: Look for similar logic across files (e.g., UI hooks, data mapping).
- **Tech Debt**: Search for `// TODO`, `// FIXME`, or large files (>500 lines).
- **Action**: Create `TICKET-SCAN{##}-{slug}.md` tickets for refactoring or consolidation.

### 2. Documentation Drift (`scope: docs`)

**Trigger**: `land` Phase 2 (the session's docs deep-clean). There is **no calendar** — a hygiene
sweep with its own schedule is a schedule nobody keeps, while one attached to a step already in the
operator's habit actually runs.

**Order by ownership, not by recency.** Drift concentrates where **no program owns the docs**. In a
full-tree review, 100% of runbooks and every doc ported in from another repo needed correction,
while actively-worked specs were half-maintained — the work itself partly maintains what it touches,
and nothing maintains the rest. So partition by directory and take the un-owned surfaces first:

1. Docs ported in from another repo, runbooks, strategy docs — anything with **no live ticket
   pointing at it**.
2. Everything else.

- **Mechanical first**: run `agentkit check --content` and `agentkit check --taxonomy` and start from
  their output. Both index directions and every citation class are already covered there; do not
  hand-roll what the checker owns.
- **Stale PRDs**: Check `docs/working/*.md`. If a doc hasn't been touched in 14 days but references files changed this week, flag as "Stale".
- **Orphaned Docs**: Find PRDs marked "Implemented" in `./CHANGELOG.md` that are still in `docs/working/`.
- **Rule Drift**: Identify new UI patterns in the feature tree not yet present in `.agent/rules/`.
- **Enumerate from the filesystem.** Glob each directory; the index is the claim under test, never
  the enumerator.
- **Action**: Create `TICKET-SCAN{##}-{slug}.md` tickets to update or archive documentation.

### 3. Hygiene Sentinel (`scope: hygiene`)
- **Changelog**: If `./CHANGELOG.md` > 500 lines, trigger archival.
- **Working Files**: If `docs/working/` > 6 files, trigger cleanup.
- **Feature Sprawl**: If the feature tree exceeds 15 directories, flag for domain grouping.
- **Action**: Create `TICKET-SCAN{##}-{slug}.md` tickets for housekeeping tasks.

### 4. Agent Knowledge (`scope: agent`)
- **Rule Conflicts**: Scan `.agent/rules/*.md` for contradictory instructions (e.g., CSS naming).
- **Cross-Refs**: Verify that all `SKILL.md` files correctly link to their relevant rules or workflows.
- **Skill Usage**: Identify if a custom skill (like `audit-typography`) hasn't been used despite relevant changes.
- **Action**: Create `TICKET-SCAN{##}-{slug}.md` tickets to tune the agent's guidance.

## Output Structure

### Ticket Template (`docs/backlog/TICKET-SCAN{##}-{slug}.md`)
```markdown
# TICKET-SCAN{##}-{slug}: [Concise Title]

**Status**: Backlog
**Priority**: [high|med|low]
**Area**: [code|docs|hygiene|agent]
**Source**: sweep-[scope]

---

## Context
[Why this ticket was generated]

## Recommended Action
[Specific steps to resolve]

## Files Affected
- [Paths]
```

### Ticket Naming Convention
- **Format**: `TICKET-SCAN{##}-{slug}.md`
- **SCAN{##}**: Sequential scan number (e.g., SCAN01, SCAN02)
- **slug**: Short kebab-case description (e.g., `audit-deps-no-cve`)
- See `.agent/rules/pattern-docs-artifacts.md` for the canonical prefix table.

**Examples**:
- `TICKET-SCAN01-audit-security-coverage.md`
- `TICKET-SCAN02-docs-drift.md`

### Backlog Index
After creating tickets, update the backlog index if the project keeps a `docs/backlog/` directory
(one line per new ticket). Repos using the ephemeral `backlog-status` view have no backlog dir — the
`backlog-status` workflow regenerates the view on demand, so there is nothing to update.

## Constraints
- **Idempotency**: Do not create duplicate tickets for the same issue. Search `docs/backlog/` before generating.
- **High Signal**: Only create tickets for actionable items. Avoid noise.
