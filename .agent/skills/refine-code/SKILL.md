---
name: refine-code
description: Polish recently written or reviewed code for clarity, consistency, and simplicity — small in-place improvements. For structural reorganization from a plan use implement-refactor.
tier: core
conflicts-with: [implement-refactor]
---

# Code Refinement & Simplicity 💎

Expert system architecture and development with an unwavering commitment to code simplicity. Identify and eliminate unnecessary complexity, transforming convoluted solutions into elegant, maintainable code.

## When NOT to Use
This skill *edits* code for small, in-place clarity and simplicity wins. Route elsewhere when:
- The change follows a plan or moves modules/boundaries → `implement-refactor` (already in this skill's `conflicts-with`).
- You want a diagnosis without touching code → `audit-code` (quality review) or `audit-refactor-opportunities` (smell/debt inventory).
- The change alters behavior rather than preserving it → `implement-feature` / `implement-quick-fix`.

## Core Principles

1.  **Simplicity First**: Every line of code should have a clear purpose. If it doesn't contribute directly to solving the problem, it shouldn't exist.
2.  **Readability Over Cleverness**: Code is read far more often than it's written. Optimize for human understanding, not for showing off technical prowess.
3.  **Minimal Abstractions**: Only introduce abstractions when they are truly necessary to manage complexity. A "simple" duplicate is often better than a "complex" DRY abstraction.

## Refinement Tactics

### 1. Guard Clauses & Early Returns
Eliminate deep nesting and `else` blocks by handling edge cases and errors early.
- **Bad**: `if (doc) { if (doc.valid) { ... } else { return null; } } else { return null; }`
- **Good**: `if (!doc || !doc.valid) return null; ...`

### 2. Variable Reduction (SSA - Single Static Assignment)
Minimize mutable state. Prefer `const` and direct initialization. If a variable is only used once to pass to a function, consider inlining it.

### 3. Boolean Predicates
Extract complex logic into well-named boolean variables or helper functions to make the intent clear.
- **Example**: `const isEligibleForBonus = user.yearsActive > 2 && user.performanceRating > 4;`

### 4. Function Splitting (Single Responsibility)
If a function does more than one thing, split it. Aim for high cohesion and low coupling.

## Hotspot Identification

Look for these signals that code needs refinement:
- **Over-engineering**: Generic solutions for specific problems.
- **Redundant Patterns**: Repeating the same boilerplate when a utility could simplify.
- **Prop Drilling**: Passing state through too many layers (consider Composition or Context).
- **Multi-responsibility Hooks**: Hooks that manage 5+ independent states.

## Verification

Before finalizing a refinement:
1.  Does it pass all existing tests?
2.  Is the code *objectively* shorter or easier to read?
3.  Did I preserve the exact original behavior?
