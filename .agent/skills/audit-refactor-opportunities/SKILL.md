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
**Before auditing**, read root `AGENTS.md` and relevant `.agent/rules/` files for code-organization
constraints. Record applicable pattern violations and their blocking policy separately from impact.

### Step 2: Codebase-Specific Duplication Awareness

#### Duplicate and Dead-Code Evidence

Use the available Fallow analysis/trace modes described in `integrations/fallow.md`, verifying
version-specific flags through local help. Record scanned roots and exclusions. Do not install,
run auto-fix, or tune shared config as a side effect of this audit.
Inspect suspected dead exports against entry points, runtime registration, tests and external
consumers; an incomplete reachability model can produce false positives.
If Fallow is unavailable, use `use-codegraph` when callable or bounded `rg`/source inspection.
Report manual coverage and uncertain reachability; absence of scanner output is not a clean scan.
**Before flagging duplication**, read `.agent/rules/pattern-feature-scaffolding.md` §§1+3:
- Apply **Clone to Create** and **Converge After Creation** only to the applicable repeated-shape
  surfaces. Intentional duplication and later convergence are compatible.

Use this decision order for each candidate group:
1. Check stable common behavior, low divergence, explicit adapter seams and tests for every consumer.
   Apply the project's actual constraints. Repetition is a lead; a stable shared contract,
   justified variation boundary and consumer proof make a convergence candidate.
2. Keep unique or evolving behavior separate when extraction would introduce consumer branches,
   couple independent changes or obscure ownership. Explain the boundary being preserved.
3. Assess other copy-paste by duplicated maintenance burden and semantic equivalence. Text similarity
   alone is neither a refactor mandate nor a severity judgment.

### Step 3: Focus Areas
- **Code Smells**: Duplication (rubric above), long functions, deep nesting
- **Pattern Violations**: Inconsistent patterns across similar code
- **Naming**: Unclear or inconsistent naming
- **Complexity**: Overly complex logic that could be simplified
- **Dead Code**: Unused exports, commented code

### Measurement Method
Pairwise diffs and changed-line counts can support convergence analysis. Compare behavior, consumer
contracts and variability directly; low textual distance does not prove semantic equivalence.

### Checklist
- [ ] Duplicated logic that could be shared
- [ ] Long functions or deep nesting with a concrete comprehension or change-risk cost
- [ ] Inconsistent patterns for similar operations
- [ ] Unclear variable/function names
- [ ] Dead or commented-out code

### Output
Prioritized list of refactoring opportunities with effort estimates (Low/Medium/High).
Each selected lens is `finding | checked-clean | not-applicable | not-verified`. Record evidence,
scope and reason. Preserve important uncertain candidates with a next probe; do not invent findings
or exact effort estimates to fill a list. Separate impact, applicable invariant and blocking policy.

## Constraints
- **Identify only** — do NOT fix
- Fixes go through `/refactor` or `/quick-fix`
- Store necessary redacted evidence in the caller's approved evidence location.

## Definition of Done

Candidates explain the maintenance cost, preserved behavior, extraction boundary and relevant
counterevidence. Intentional divergence and incomplete reachability have explicit dispositions.
No code or scanner configuration changed.
