---
name: verify-rules
description: Run the invariant checks that rules declare, harvested and executed by `agentkit verify`. Use to validate token/spacing/z-index/casing compliance before a merge or release.
tier: core
required-tools: [agentkit]
---

# Verify Rules

Run and interpret the invariant checks owned by active rules. `agentkit verify` harvests
`agentkit-checks` blocks and applies them to configured source roots. This skill does not
duplicate check definitions or silently repair configuration.

## When to Use

Use for mechanical invariant verification before a scoped merge/release gate or within a requested
audit. Use `audit-code` for semantic correctness; route authorized fixes to the relevant repair skill.

## Approach

### Phase 1: Run the Harvested Checks

Use the installed CLI, checking local help when its availability or invocation is uncertain:

```bash
agentkit verify
agentkit verify --json
```

Choose human or JSON output for the caller; do not run both merely to duplicate a check.
Record the version, target state, actual exit/result, rules and check count, roots, exclusions and
execution/harvest diagnostics. If the tool is unavailable, report the missing automated coverage
and use only bounded manual checks that can answer the requested question.

### Phase 2: Separate Findings from Coverage

A successful process exit is not a complete invariant pass. Inspect malformed blocks, invalid
patterns, skipped checks, inaccessible roots and other coverage errors independently of findings.
Zero checks cannot substantiate a full pass. Active rules without automatable declarations remain
outside the mechanical result; identify relevant obligations needing judgment or another method.

Preserve the check's reported severity. Report user impact and project blocking policy separately
when that severity is a policy classification. A diagnostic or coverage error cannot make an
existing violation disappear, and a violation does not describe the unverified scope.
Use `foundation-testing.md` for evidence validity and gated transitions.

### Phase 3: Propose Scope Corrections

In report mode, propose corrections without editing config, rules or source:

- Wrong roots: identify the real source paths and the missed coverage.
- Rule-specific exceptions: propose an exception in the owning check. Do not globally exclude a
  token-definition file merely because raw values are valid there; other checks may still apply.
- Incorrect or absent check: cite the owning active rule and an example of the intended distinction.
- Global exclusion: justify why every check is inapplicable to the excluded surface and name the
  coverage sacrificed.

If the user already authorized repair, continue within that scope through the appropriate owner.
Author canonical rules, not generated surfaces. Use `kit-contribute` only for an authorized
flowback task; a verification result does not grant it.

### Phase 4: Judgment Checks

Select obligations that matter to the target and cannot be established by regex. Examples include
import casing versus actual filenames on case-sensitive systems, or a pixel value's role in spacing,
borders and viewport math. Apply project conventions rather than a universal lowercase or no-pixel
rule.

When investigating a detector, inspect the runner's flags and UTF-8 decoding. Non-ASCII patterns
must be checked with the actual Node runner or an appropriate Unicode-aware tool; locale-dependent
byte matching can produce unrelated matches. Similar-looking regex results in another tool do not
prove equivalent semantics. For authorized detector changes, use meaningful violating and legitimate
fixtures under the shared testing contract.

## Output and Definition of Done

Return findings grouped by severity with check ID, owner, source location and evidence.
Report coverage separately: rules/checks executed, roots/exclusions, errors, unverified obligations
and the next check/owner. Each selected obligation is `finding | checked-clean | not-applicable |
not-verified`, with a reason for the latter two.

The task is complete when the requested verification and its limits are reported, even if coverage
is incomplete. Do not label the overall scope passing when required checks are missing.
No automatic source, rule or configuration changes are part of report-only verification.
