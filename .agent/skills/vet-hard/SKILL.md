---
name: vet-hard
description: Full adversarial red team review with multiple hostile personas. Use for critical features or high-risk changes.
tier: core
---

# Vet Hard

Comprehensive adversarial review using multiple hostile personas to find vulnerabilities, edge cases, and failure modes.

## When to Use

- Critical features (auth, payments, data integrity)
- High-risk architectural changes
- Before production deployment
- When stakes are high and failure is costly

## When NOT to Use
This is a heavyweight adversarial red-team pass reserved for high-stakes changes. Route elsewhere when:
- It's a routine plan sanity-check, not a critical/high-risk change → `vet-simple` (right-size the effort — don't red-team a copy tweak).
- You want a standard code-quality / pattern review rather than a threat model → `audit-code`.
- The goal is to fix the branch to repo standard, not produce a threat report → `review-raise-bar`.

## Artifacts

- `docs/working/REVIEW-VET-REDTEAM-{name}.md` — Full adversarial review report

## Approach

### Phase 1: Context & Threat Model

1. **Read the Plan**: Understand intended behavior
2. **Identify Assets**: What's valuable? (User data, performance, UX, security)
3. **Threat Actors**: Who might exploit this? (Malicious users, buggy code, edge cases)
4. **Attack Surface**: Where are the entry points?

### Phase 2: Multi-Persona Review

Assume **5 hostile personas**, each with different goals:

#### Persona 1: Security Hacker
**Goal**: Find exploits, data leaks, XSS vectors

**Questions**:
- Can I inject malicious code through inputs?
- Can I access data I shouldn't?
- Can I bypass authentication/authorization?
- Are there CSRF vulnerabilities?
- Is sensitive data logged or exposed?

#### Persona 2: Performance Saboteur
**Goal**: Make the app slow or crash

**Questions**:
- Can I trigger infinite loops or recursion?
- Can I cause memory leaks?
- Can I upload huge files to DOS the app?
- Can I trigger expensive re-renders?
- Are there N+1 query patterns?

#### Persona 3: Chaos Monkey (Race Conditions)
**Goal**: Break things through timing and concurrency

**Questions**:
- What if two users do this simultaneously?
- What if the network is slow?
- What if the user clicks rapidly?
- What if state updates out of order?
- What if the component unmounts mid-operation?

#### Persona 4: Accessibility Auditor (Hostile)
**Goal**: Find ways this breaks for disabled users

**Questions**:
- Can I navigate without a mouse?
- Can I understand this with a screen reader?
- Can I see this with low vision?
- Can I use this with motor impairments?
- Are color contrasts sufficient?

#### Persona 5: UX Saboteur
**Goal**: Confuse or frustrate users

**Questions**:
- Can I get into an unrecoverable state?
- Are error messages helpful or cryptic?
- Can I lose my work?
- Is the UI misleading?
- Are there confusing edge cases?

### Phase 3: Attack Vector Documentation

For each persona, document **3-5 attack vectors**:

**Format**:
```markdown
### Attack Vector: {Name}
- **Persona**: {Which persona found this}
- **Severity**: Critical | High | Medium | Low
- **Likelihood**: High | Medium | Low
- **Attack**: [Step-by-step how to trigger]
- **Impact**: [What breaks]
- **Mitigation**: [How to prevent]
- **Test Case**: [How to verify the fix]
```

### Phase 4: Failure Mode Analysis

**FMEA Table**:
| Failure Mode | Cause | Effect | Severity | Likelihood | Detection | RPN | Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Memory leak | URL not revoked | Browser slowdown | 7 | 6 | 3 | 126 | Add cleanup |
| Null crash | No guard clause | App crash | 9 | 4 | 8 | 288 | Add null check |

**RPN** (Risk Priority Number) = Severity × Likelihood × Detection (1-10 scale)
- **RPN > 200**: Critical, must fix
- **RPN 100-200**: High, should fix
- **RPN < 100**: Medium/Low, consider fixing

### Phase 5: Stress Testing Scenarios

Design **5 stress test scenarios**:

1. **Rapid Fire**: User clicks button 50 times in 1 second
2. **Slow Network**: Simulate 3G connection with 5s latency
3. **Huge Data**: Upload 100MB file
4. **Concurrent Users**: 10 users editing same data
5. **Browser Chaos**: Resize window, change tabs, go offline mid-operation

For each scenario:
- **Expected Behavior**: What should happen?
- **Actual Risk**: What might break?
- **Mitigation**: How to handle gracefully?

### Phase 6: Code Review (Hostile)

Scan the implementation plan for:
- **Missing Error Handling**: Every async operation needs try/catch
- **Unvalidated Inputs**: Every user input needs validation
- **Missing Cleanup**: Every effect needs cleanup
- **Hardcoded Values**: Magic numbers, brittle assumptions
- **Missing Types**: `any` types, missing null checks

### Phase 7: Rollback & Recovery

**Questions**:
1. Can we roll back this change without data loss?
2. Can users recover from errors?
3. Do we have monitoring/alerts for failures?
4. Is there a feature flag to disable this?
5. What's the blast radius if this breaks?

## Output Structure

```markdown
# VET REDTEAM: {Feature Name}

**Review Date**: {YYYY-MM-DD}
**Plan Reviewed**: {Link}
**Reviewer**: vet-hard (Multi-Persona Adversarial)

---

## Executive Summary

**Overall Risk**: Critical | High | Medium | Low
**Recommendation**: Block | Major Revisions | Minor Fixes | Proceed

**Key Findings**:
- {Count} Critical issues
- {Count} High-priority issues
- {Count} Medium-priority issues

**Must-Fix Before Merge**: {List critical items}

---

## Threat Model

**Assets at Risk**:
- User data (uploaded images)
- Application performance
- User experience

**Threat Actors**:
- Malicious users (XSS, data theft)
- Buggy implementations (race conditions)
- Edge cases (null refs, slow networks)

**Attack Surface**:
- File upload input
- Image preview rendering
- State management (atoms)

---

## Attack Vectors by Persona

### Security Hacker

#### AV-SEC-001: XSS via Image Metadata
- **Severity**: Critical
- **Likelihood**: Medium
- **Attack**: Upload image with malicious EXIF data containing `<script>` tags
- **Impact**: XSS if metadata is rendered without sanitization
- **Mitigation**: Sanitize all image metadata before display
- **Test Case**: Upload image with `<script>alert('XSS')</script>` in EXIF comment field

#### AV-SEC-002: Path Traversal in Object URL
- **Severity**: High
- **Likelihood**: Low
- **Attack**: Manipulate `sourceImageAtom` to point to `file:///etc/passwd`
- **Impact**: Potential file system access
- **Mitigation**: Validate that URLs are blob: protocol only
- **Test Case**: Attempt to set atom to `file://` URL

[Continue for all personas...]

---

## Failure Mode Analysis

| Failure Mode | Cause | Effect | Sev | Like | Det | RPN | Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Memory leak | URL not revoked | Slowdown | 7 | 6 | 3 | 126 | Add cleanup |
| Null crash | No guard | Crash | 9 | 4 | 8 | 288 | Add null check |
| Race condition | Rapid clicks | Duplicate uploads | 6 | 7 | 4 | 168 | Debounce |

**Critical (RPN > 200)**: 1 item
**High (RPN 100-200)**: 2 items

---

## Stress Test Scenarios

### Scenario 1: Rapid Fire Upload
- **Test**: Click upload 50 times in 1 second
- **Expected**: Only one file dialog opens
- **Risk**: Multiple dialogs, state corruption
- **Mitigation**: Debounce upload trigger, disable button during upload

[Continue for all scenarios...]

---

## Code Review Findings

### Missing Error Handling
- **File**: `{Component}.tsx`
- **Line**: 23
- **Issue**: No try/catch around the risky async / browser-API call
- **Fix**: Wrap in try/catch, surface a user-facing error on failure

### Unvalidated Input
- **File**: `{Component}.tsx`
- **Line**: 18
- **Issue**: No bound on untrusted input size
- **Fix**: Add an explicit size/length cap; reject oversized input

[Continue for all findings...]

---

## Rollback & Recovery

- ✅ **Rollback**: Can revert without data loss (no DB changes)
- ⚠️ **Recovery**: Users can't recover from upload errors (no retry)
- ❌ **Monitoring**: No error tracking for failed uploads
- ✅ **Feature Flag**: Can disable via a feature flag
- ✅ **Blast Radius**: Limited to the touched feature only

**Recommendations**:
1. Add error tracking (the project's telemetry service)
2. Add retry mechanism for failed uploads
3. Add feature flag in config

---

## Priority Breakdown

| Priority | Count | Must Fix Before Merge |
| :--- | :--- | :--- |
| Critical | 1 | ✅ Yes |
| High | 2 | ✅ Yes |
| Medium | 5 | ⚠️ Consider |
| Low | 3 | ❌ No |

---

## Final Recommendation

**Major Revisions Required**

**Blockers** (Must fix before merge):
1. [AV-SEC-001] Sanitize untrusted input/metadata to prevent XSS
2. [FMEA] Add null guard clause (RPN 288)
3. [Code Review] Add file size validation

**High Priority** (Should fix before merge):
1. [AV-PERF-001] Add memory leak prevention
2. [AV-CHAOS-001] Debounce rapid clicks

**Follow-Up Tickets**:
- Add error tracking
- Add retry mechanism
- Improve accessibility (keyboard shortcuts)

---

## Estimated Remediation Effort

- **Blockers**: 4 hours
- **High Priority**: 2 hours
- **Total**: 6 hours

**Revised Timeline**: Add 1 day to implementation schedule.
```

## Constraints

- **Exhaustive**: Cover all 5 personas
- **Specific**: Every attack vector needs a test case
- **Quantified**: Use RPN scoring for failure modes
- **Actionable**: Every finding needs a mitigation
- **Honest**: Don't sugarcoat risks

## Reflexion

Before finalizing, verify:
1. Did I find at least 3 attack vectors per persona?
2. Did I calculate RPN for all failure modes?
3. Did I design 5 stress test scenarios?
4. Are my mitigations specific and testable?
5. Did I identify blockers vs nice-to-haves?
