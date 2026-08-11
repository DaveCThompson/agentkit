---
name: vet-simple
description: Review for overlooked aspects, edge cases, and unintended consequences. Use for quick quality check before implementation.
tier: core
---

# Vet Simple

Lightweight quality review focused on finding what was missed in planning.

## When to Use

- After plan approval, before implementation
- Quick sanity check on architecture
- When you want a second pair of eyes
- Before handing off implementation

## When NOT to Use
This is a lightweight pre-implementation review of a *plan or architecture*. Route elsewhere when:
- Code already exists and you want it reviewed → `audit-code`.
- The change is high-stakes (auth, payments, data integrity) and needs a full adversarial threat model → `vet-hard`.
- You want the review to end in *repaired* work, not findings → `review-raise-bar`.

## Artifacts

- `docs/working/REVIEW-VET-{name}.md` — Review findings and recommendations

## Approach

### Phase 1: Context Loading

1. Read the plan or architecture document
2. Identify the core change and affected areas
3. List stated assumptions

### Phase 2: Overlooked Aspects

**Checklist**:
- [ ] **Edge Cases**: Empty states, loading states, error states
- [ ] **Accessibility**: Keyboard navigation, screen reader support, focus management
- [ ] **Mobile**: Touch targets, responsive layout, gesture conflicts
- [ ] **Performance**: Re-renders, memory leaks, bundle size impact
- [ ] **Error Handling**: Network failures, malformed data, race conditions
- [ ] **State Management**: Cleanup on unmount, stale closures, atom dependencies
- [ ] **Browser Compat**: Safari quirks, older browsers, polyfills needed
- [ ] **Security**: XSS vectors, data validation, sensitive data exposure

**For Each Item**:
- **Status**: Covered | Partially Covered | Not Covered
- **Impact**: Low | Med | High
- **Recommendation**: Specific action to address

### Phase 3: Unintended Consequences

**Questions to Ask**:
1. What other features might break?
2. Could this change confuse existing users?
3. Will this slow down other parts of the app?
4. Could this introduce global state issues?
5. Do existing users need data migration?
6. Can we easily revert this change if needed?
7. Can the change's behavior be explained back simply? If not, that's a complexity signal —
   recommend splitting or simplifying it before it's built.

### Phase 4: Quick Wins

Identify low-effort, high-value improvements:
- Missing guard clauses
- Obvious accessibility fixes
- Simple performance optimizations
- Better error messages

### Phase 5: Priority Scoring

**Scoring System**:
- **Critical (9-10)**: Blocks implementation, must fix
- **High (7-8)**: Significant risk, should fix before merge
- **Medium (4-6)**: Worth addressing, can be follow-up ticket
- **Low (1-3)**: Nice-to-have, optional

## Constraints

- Time-boxed: spend max 15 minutes on review
- Actionable: every finding must have a specific recommendation
- Prioritized: use the scoring system consistently
- Constructive: focus on what to add, not only what is wrong

