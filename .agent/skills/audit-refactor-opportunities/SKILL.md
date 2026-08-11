---
name: audit-refactor-opportunities
description: Identify code smells and refactoring opportunities without fixing. Use for tech debt assessment.
tier: core
required-tools: [fallow]
---

# Audit Refactor Opportunities

Identify code smells and refactoring opportunities.

## When to Use
- Tech debt assessment
- Planning refactoring sprints
- Understanding codebase health

## When NOT to Use
This skill *catalogues* smells and opportunities **without fixing them**. Route elsewhere when:
- You intend to make the fixes now → `refine-code` (small in-place polish) or `implement-refactor` (planned structural change).
- You want a correctness / type-safety / architecture review rather than a debt inventory → `audit-code`.

## Approach

### Step 1: Project Invariants (Required)
**Before auditing**, check `.agent/rules/` for code style constraints:
- `AGENTS.md` — established patterns
- `*.md` — code organization rules
- Flag any violation of documented patterns as higher priority.

### Step 2: Codebase-Specific Duplication Awareness

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
**Before flagging duplication**, read `.agent/rules/pattern-feature-scaffolding.md` §§1+3:
- §1 (Clone Doctrine): Lab/wizard surfaces MUST be cloned from proven DNA, not built fresh. Cloned
  surfaces are **mandated duplication** — do not flag as a code smell.
- §3 (Convergence): When a stabilized clone has drifted, promoting shared logic IS a valid
  refactoring opportunity. Classify as "mechanical clone promotion candidate."

Use this rubric for each duplicate pair:
1. Is the duplicate a clone created under the Clone Doctrine? → **Mandated — skip.**
2. Is the duplicate a stabilized clone that has drifted significantly? → **Promotion candidate — flag Medium.**
3. Is the duplicate an organic copy-paste without doctrinal basis? → **Genuine smell — flag High.**

### Step 3: Focus Areas
- **Code Smells**: Duplication (rubric above), long functions, deep nesting
- **Pattern Violations**: Inconsistent patterns across similar code
- **Naming**: Unclear or inconsistent naming
- **Complexity**: Overly complex logic that could be simplified
- **Dead Code**: Unused exports, commented code

### Measurement Method
Use `git diff --no-index -U0` pairwise on cloned directories to get changed-line counts for convergence assessment.

### Checklist
- [ ] Duplicated logic that could be shared
- [ ] Functions >50 lines that could be split
- [ ] Deeply nested conditionals (>3 levels)
- [ ] Inconsistent patterns for similar operations
- [ ] Unclear variable/function names
- [ ] Dead or commented-out code

### Output
Prioritized list of refactoring opportunities with effort estimates (Low/Medium/High).
Every lens ends in findings or an explicit clean attestation — name what was checked and state it came back clean; a lens with neither is an under-delivered audit, not a pass.

## Constraints
- **Identify only** — do NOT fix
- Fixes go through `/refactor` or `/quick-fix`
- Raw command output goes to `docs/working/evidence/` (gitignored); findings docs cite the evidence file by name.
