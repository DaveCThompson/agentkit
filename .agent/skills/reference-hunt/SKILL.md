---
name: reference-hunt
description: Use existing source code as the specification when the user can't describe what they want in words — extract the reference's semantics, then reimplement natively in the target stack. Use when the user points at a library/repo/site and says "build something like this", especially across languages or frameworks.
tier: core
triggers: [reference, build something like this, port, reimplement, code as spec]
---

# Reference Hunt

When the words run out and the user gestures at working code — "build something like this" — the
reference *is* the spec. Extract what it guarantees (the *what*), then reimplement in the target
stack's idioms (the *how*). Separating those two is the whole skill.

## When to Use

- The user points at a library, repo, website, or vendored file as the thing to match.
- Requirements are clearer in someone's working code than in prose.
- Porting behavior across a language or framework boundary.

## When NOT to Use

- Cloning a proven sibling *inside this repo* → `pattern-feature-scaffolding.md` "Clone to Create"
  (same-repo DNA reuse, not semantic extraction from a foreign reference).
- Evaluating which library/approach to adopt in the first place → `explore-tech`.
- You can already state the spec in words → skip straight to `plan-feature`.

## Approach

### Phase 1: Obtain the reference
Identify the concrete source: a repo, a vendored file, a library's source, or an accessible page.
No source = no reference-hunt — do not reverse-engineer from observed behavior alone unless the user
explicitly asks for that.

### Phase 2: Extract semantics (the *what*)
Before writing anything, document the reference's observable contract: behaviors, guarantees, edge
cases, timing/ordering, error handling, and the *deliberate* design choices (vs incidental detail).
Note bugs you spot — you will not reproduce them.

### Phase 3: Validate the summary
Confirm the semantics summary with the user before implementing — catching a misread here is cheap;
catching it after a full port is not. This is cite-or-run (`foundation-testing.md` §1B) applied to
comprehension.

### Phase 4: Reimplement natively (the *how*)
Recreate the same contract in the target stack's idioms and conventions — NOT a line-by-line
translation. Prove the behavior doesn't already exist here first (duplicate/dead-code check per
`plan-feature`'s "Reuse Before You Add") before adding new utilities.

### Phase 5: Map coverage
Link each behavior in the Phase 2 summary to its counterpart in the new implementation; call out
every conscious divergence (dropped a reference bug, chose a different trade-off) with the why.

## Verification / Definition of Done

- [ ] Graduated gate for the code written (`foundation-testing.md` §1) — lint+typecheck always,
      focused tests on the ported behavior.
- [ ] Every extracted behavior maps to an implementation counterpart or a documented divergence — no
      silent gaps.
- [ ] License honored: extracting *semantics* is fine; copying substantial source verbatim is a
      `foundation-security.md` concern — flag it, don't smuggle it.

## Constraints

- Separate *what* (reference's spec) from *how* (target's conventions) — never let the reference's
  idioms leak into a foreign stack.
- Surface reference bugs; don't faithfully reproduce them.
- No unapproved dependencies just because the reference used them (`foundation-security.md`).

## Output

A semantics summary + a native implementation + a coverage map (behavior → counterpart / divergence).
