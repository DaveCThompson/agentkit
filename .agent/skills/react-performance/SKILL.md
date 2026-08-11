---
name: react-performance
description: React-specific performance guidance for render behavior, state flow, memoization tradeoffs, and async boundaries.
tier: tech:react
---

# React Performance Skill (Active Router)

**Purpose**: Provide React-specific performance guidance using the canonical repo rules plus targeted references. This skill can support either `audit-performance` or `performance`, but it is not a generic whole-app audit by itself.

## 1. Context Loading (Truth)
- [ ] **Load System Rules**: `view_file .agent/rules/foundation-design-system.md` (Check Bundle/network sections).
- [ ] **Load React Rules**: `view_file .agent/rules/tech-react.md` (Check Verification > Logic > Performance).
- [ ] **Load Skill References Sparingly**: Use `references/*.md` only when they add context beyond the canonical repo rules.

## 2. Active Verification (Grep Strategy)
Run these commands to find common performance killers:

### Bundle Size
- `grep -r "import .* from '.*'" src | grep -v "type"` (Check for barrel imports)
- `grep -r "lazy(" src` (Verify lazy loading is used for routes)

### Render Cycles
- `grep -r "useMemo" src` (Check whether memoization is justified or cargo-culted)
- `grep -r "useCallback" src` (Check whether callback stabilization is necessary or just noise)
- `grep -r "startTransition\\|useDeferredValue" src` (Check whether slow UI updates have proper priority boundaries)
- `grep -r "useEffect" src` (Check for derived-state loops or effect-driven render churn)

### Network / Async
- `grep -r "await" src` (Check for serial waterfalls inside loops)

## 3. Analysis
- **Compare findings against the "Verification" sections** in the loaded rule files.
- **Respect repo React posture**: Do not recommend `useMemo` / `useCallback` / `React.memo` by reflex. Prefer them only when profiling evidence or existing local patterns justify the cost.
- **Focus on React-specific causes**: render propagation, state ownership, unstable props, derived state, hydration boundaries, priority management, and expensive trees.
- **Escalate to the right lane**:
  - use `audit-performance` when the user wants findings only
  - use `performance` when a measured fix should be implemented
- **Report**: List Critical (Blocking) vs High (Fix soon) issues.
