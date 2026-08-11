---
name: verify-rules
description: Run the invariant checks that rules declare, harvested and executed by `agentkit verify`. Use to validate token/spacing/z-index/casing compliance before a merge or release.
tier: core
---

# Verify Rules

Automated verification of project invariants. The checks are **not** restated here — each rule owns
its own automatable checks in an `agentkit-checks` block, and `agentkit verify` harvests them from
every active rule and runs them against the project's `sourceRoots` (from `.agentkit.json`). This
skill is the conductor + interpreter, not a second copy of the checks (which is how the old grep list
drifted and hardcoded a src-only scan).

## When to Use
- Before major releases or merges
- After large refactoring efforts
- As part of an `/audit full` pass
- When onboarding, to gauge codebase health

## When NOT to Use
- You want the violations *fixed*, not just reported → this skill is report-only; route fixes to
  `refine-code` (in-place) or the matching `*-fix` skill.
- You need a semantic/architecture review rather than mechanical invariants → `audit-code`.

## Approach

### Phase 1: Run the harvested checks
```bash
agentkit verify            # human-readable; exit 1 only if a Critical fires
agentkit verify --json     # machine-readable findings for scripting
```
The output names, per finding: `severity`, `file:line`, the check `id`, the owning rule, and the
message. `verify` reports the source roots it scanned and how many checks it harvested from how many
active rules — if that count is 0, the active rules declare no `agentkit-checks` blocks yet.

### Phase 2: Triage by severity
- **Critical** — must fix before merge (e.g. raw hex where a token is required). `verify` exits 1.
- **High / Medium / Low** — advisory; review and fix or consciously accept. `verify` exits 0 so it
  never blocks on style-tier findings.
Group your report by severity, not by check type.

### Phase 3: Tune the scope (project-owned, not skill-owned)
False positives are fixed in config or in the owning rule, never by editing this skill:
- **Token-definition files** (where raw values legitimately live) → add their globs to
  `.agentkit.json` `verify.exclude`.
- **Wrong scan scope** → fix `sourceRoots` in `.agentkit.json` (a layout that isn't under src must
  declare its real roots).
- **A check is wrong/missing** → edit the `agentkit-checks` block in the rule that owns the invariant
  (e.g. `foundation-design-tokens.md`, `pattern-code-standards.md`), then flow it back with
  `kit-contribute`.

> **Authoring note — patterns run as Node `RegExp` over UTF-8.** `agentkit verify` executes each
> harvested pattern through Node's `RegExp` against UTF-8-decoded text, so non-ASCII character
> classes (curly quotes, em/en dashes, apostrophes) match by codepoint and are safe. When
> hand-verifying such a pattern, use `rg` (always Unicode) or the runner itself — **never** a Git
> Bash `grep` with a non-ASCII bracket class. In a non-UTF-8 locale that bracket class degrades to
> its raw byte set (e.g. `[—–]` becomes `{E2,80,94,93}`), so every UTF-8 `E2 80 xx` sequence —
> curly quotes and apostrophes included — matches bytewise and floods false positives.

### Phase 4: Judgment checks the harvester can't grep
A few invariants are structural, not line-greppable — verify these by hand and fold into the report:
- **Directory casing** — feature/module directories under the source roots must be strictly
  lowercase (mixed case breaks imports on case-sensitive filesystems).
- **Magic pixel values** — bare `px` values that should be `var(--spacing-*)`/`var(--radius-*)`;
  noisy to grep (borders, viewport math), so review in context rather than as a blanket check.

## Output Format
```markdown
## Verification Results (agentkit verify)

### Critical (Must Fix)
- [ ] [check-id] @file:line — [message]

### High / Medium (Review)
- [ ] [check-id] @file:line — [message]

### Judgment checks
- [x] Directory casing: all lowercase
- [ ] Magic px: [count] to review

### Pass
- [x] [checks with zero findings]
```

## Constraints
- **Report only** — do not auto-fix violations.
- The checks live in the rules, not here — never restate or hardcode a grep in this skill.
- Scope is `sourceRoots`; `verify` already skips `node_modules`, `dist`, and vendor surfaces.
