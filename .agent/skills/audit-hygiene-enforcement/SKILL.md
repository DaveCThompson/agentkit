---
name: audit-hygiene-enforcement
description: Verify project hygiene invariants — changelog rolled and titled, archives indexed, working docs within limits. Detect-only; maintain-docs performs the cleanup.
tier: core
required-tools: [agentkit]
conflicts-with: [maintain-docs]
---

# Hygiene Enforcement Skill

Detect documentation and lifecycle drift. Use `maintain-docs` for authorized cleanup.
An audit may write its requested report; it does not move files, change status or close tickets.

## When to Use

Use for a scoped hygiene review of the changelog, active documents, archive navigation or stale
work records. `audit-docs` handles semantic documentation truth.

## Approach

### Run the Existing Checks

Use the available AgentKit CLI's content, taxonomy and hygiene checks for the requested scope.
Consult its local help for supported invocation. Record version, selected scope, errors and
exclusions. If unavailable, perform a bounded manual check and label missing automated coverage.
Do not rebuild the CLI or change configuration as part of detection.

### Check Lifecycle and Navigation

- Read `pattern-docs-artifacts.md`, **Changelog**, for the live rolling window; do not keep a
  second numeric threshold here. Check title, dated entries and archive-chain links. Compare the
  installed check's limits with that policy and report discrepancies.
- Enumerate working documents from the filesystem, including ignored files within scope.
  Compare filing locations with the artifact policy and applicable project layout exceptions.
- Recommend archival only after checking completion evidence, remaining acceptance and successor
  pointers. A changelog claim is a lead, not proof that every requirement is complete.
- Check archive indexes and both incoming and outgoing links for proposed or historical moves.
  No archive, deletion or untracking is authorized by a hygiene finding.
- Apply directory naming and rule-coverage checks only where an applicable project convention
  requires them. Not every new implementation pattern needs a new rule.

### Triage Status Signals

Use the ticket's frontmatter as status of record, including `updated` and verified `landed`
ancestry. Preserve supported legacy parsing; use `pattern-agent-orchestration.md` and
`pattern-docs-artifacts.md` for shared semantics.

An ancestor SHA can identify a base, reference or partial implementation. Flag contradictory
completion claims only with completion-context evidence and the remaining acceptance checked.
Do not infer publication from ancestry or completion from a removed branch.

Staleness is a triage signal, using configured thresholds and Git history or explicit record
dates, never filesystem mtime. A pending required proof lane keeps its owner and gating transition.
Derived scheduling views are allowed; conflicting manually maintained status copies are findings.
Heuristic flags do not authorize automatic closure or reprioritization.
An unresolved target ref or ancestry error makes that lane incomplete; preserve actual findings
alongside the error. Age of `last-verified` does not prove semantic drift. Evidence-capture filenames
are outside lifecycle naming checks; an exemption there must not hide a violating active ticket.

## Output and Definition of Done

Report each selected lens as `finding | checked-clean | not-applicable | not-verified`.
Include the policy, evidence, proposed correction or destination, uncertainty and next owner.
Preserve tool disagreements with concrete counterevidence; zero tool findings do not prove complete
coverage. Reuse the caller's report/work identity and approved evidence location.
The audit is complete when the bounded checks and gaps are reported. No cleanup or status mutation
is implied.
