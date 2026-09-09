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

Reuse the caller's plan/report or respond in conversation. Create a `REVIEW-` artifact only when
a durable handoff adds value; follow `pattern-docs-artifacts.md`.

## Approach

### Phase 1: Context Loading

1. Read the plan or architecture document
2. Identify the core change and affected areas
3. List stated assumptions

### Phase 2: Overlooked Aspects

Select lenses for the actual stack, surface and risk. Browser/React checks apply only to those
targets; for CLI or service work inspect inputs, output contracts, I/O, concurrency and recovery.

**Candidate lenses**:
- [ ] **Edge Cases**: Empty states, loading states, error states
- [ ] **Accessibility**: Keyboard navigation, screen reader support, focus management
- [ ] **Mobile**: Touch targets, responsive layout, gesture conflicts
- [ ] **Performance**: Re-renders, memory leaks, bundle size impact
- [ ] **Error Handling**: Network failures, malformed data, race conditions
- [ ] **State Management**: Cleanup on unmount, stale closures, atom dependencies
- [ ] **Browser Compat**: Safari quirks, older browsers, polyfills needed
- [ ] **Security**: XSS vectors, data validation, sensitive data exposure

**For Each Item**:
- **Status**: Covered | Partially Covered | Not Covered | Not Applicable (with reason)
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

Report low-effort improvements only when their benefit follows from a concrete gap:
- Missing guard clauses
- Obvious accessibility fixes
- Simple performance optimizations
- Better error messages

### Phase 5: Priority Scoring

Rank by plausible impact, preconditions and confidence. Separate project blocking policy from
severity. Plan risks are hypotheses until supported by source or runtime evidence; do not turn an
unverified possibility into a confirmed defect.

## Constraints

- Keep the review lightweight. Stop when material assumptions and risks are assessed or the next
  useful check exceeds this review's scope; name that gap and owner.
- Actionable: every finding must have a specific recommendation
- Prioritized: explain impact without unsupported numeric scoring
- Read-only: do not modify the plan or implementation during a review.
- No finding quota: covered plans can return no findings.

## Definition of Done

The selected plan's material assumptions, affected behavior, failure paths and recovery have a
bounded assessment. Findings name evidence, uncertainty and a concrete next action. Unanswered
questions have an owner. Use `foundation-testing.md` for proof validity; the review itself does not
verify future implementation or grant repair authority.
