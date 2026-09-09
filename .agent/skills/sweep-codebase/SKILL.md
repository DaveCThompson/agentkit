---
name: sweep-codebase
description: Periodic detection sweep across code, docs, hygiene, or agent guidance that records actionable maintenance findings. Use for requested or scheduled maintenance scans, not targeted audits or repairs.
tier: core
required-tools: [fallow, agentkit]
---

# Sweep Codebase

Detect corroborated maintenance issues in the requested scopes. Write findings and authorized
ticket/index records only. Code, configuration, documentation repair, tool installation and
archival are separate actions.

## When to Use

- The user requests a broad or periodic maintenance scan.
- A scheduled task names code, docs, hygiene or agent-guidance coverage.
- Use the relevant audit skill for a targeted question, or `maintain-docs` for requested cleanup.

## Approach

### Scope and evidence

Choose the requested scopes and actual project roots before scanning. Honor an explicit schedule;
a lifecycle caller supplies its own scope. Reuse current relevant evidence and bound exploration
by the question, available tools and useful leads. Do not repeatedly widen discovery to produce
a minimum number of findings. Zero corroborated findings is valid.

Enumerate scoped files from the filesystem. Use explicit roots and `rg --no-ignore` when checking
ignored documentation or evidence stores. Keep tracked history, current source, accepted contracts
and tool coverage distinct. Git history or earned verification metadata may support age; never
use filesystem mtime. Missing history or usage telemetry is unknown, not evidence of neglect.

For each selected scope, report checked, partial or unavailable, with exclusions and material
limits. A successful invocation, empty output or accessible search tool does not establish
complete coverage.

### 1. Code Evolution (`scope: code`)

For applicable code projects, read the kit's `integrations/fallow.md` for installed scanner
mechanics and confirm supported options from its local help before use. Use diagnostic modes
for complexity/churn, duplication and reachability; do not execute auto-fix or alter suppressions.
The metadata dependency applies to this scope, not a docs-only scan.

When Fallow is unavailable or the language is unsupported, use applicable source searches and,
if available, [use-codegraph](../use-codegraph/SKILL.md). State the manual coverage and blind
spots; do not install a tool or invent a graph endpoint.

Use churn, large files, TODOs and repeated shapes to rank inspection. Corroborate each candidate:

- Duplication needs shared semantics and a concrete cost of divergence. Similar text, fixtures,
  vendored copies or intentional separation do not alone justify consolidation.
- A dead-code candidate needs reachability evidence that accounts for entrypoints, dynamic use,
  test consumers and configuration. Missing search hits are not proof an export is unused.
- Hotspots need a demonstrated maintenance problem, complexity risk or violated boundary.
  Commit/file/directory counts alone do not justify refactoring.

Record the location, behavior or contract affected, evidence and an observable outcome for any
proposed follow-up. This detector does not introduce utilities, remove dependencies or fix code.

### 2. Documentation Drift (`scope: docs`)

Prioritize docs with uncertain ownership or changed dependencies as leads: imported docs, runbooks,
strategy and inactive surfaces may merit attention. Do not treat an anecdotal drift rate or lack
of a live ticket as a verdict.

Use available agentkit content/taxonomy diagnostics or project equivalents for mechanical leads.
Retain exits, exclusions and incomplete coverage; corroborate semantic findings against current
sources. An index is the claim under test, never the enumeration source.

Check claimed paths/symbols, current versus proposed behavior, `applies-to` coverage, and
`last-verified` claims. Compare relevant source history with the last evidenced verification
where available; age alone is not staleness. A changelog mention of implementation does not
complete all acceptance or authorize archival. Keep unresolved proof and current truth visible.
Route proposed corrections to the authored owner, never generated mirrors.

### 3. Hygiene Sentinel (`scope: hygiene`)

Read [Artifacts Rule](../../../.agent/rules/pattern-docs-artifacts.md), especially **Changelog** and
**Status-of-Record Contract**, and the kit's `governance/docs-standard.md` for retention,
thresholds and sanctioned layout exceptions. Do not maintain a second numerical policy here.

Check archive navigation, current truth retained before rolls, live-store index completeness,
and discoverable pending work. Size/sprawl can guide review; file or directory counts without
a violated contract or concrete navigation cost are not findings. This scan proposes maintenance;
it does not roll, move, prune or close artifacts.

### 4. Agent Knowledge (`scope: agent`)

Inspect relevant canonical rules, skills and workflow routes for contradictory instructions,
missing targets or ambiguous activation. Show the conflicting conditions and their practical
effect; disagreement in wording alone is not a defect.

Resolve vendor hits back to canonical owners. Use [health-agent](../health-agent/SKILL.md) for
shipped-state diagnostics. Skill non-use is assessable only with relevant session telemetry;
without it, report usage unknown. Do not delete or merge a skill on a guessed usage count.

## Output and filing

Deduplicate by underlying issue and affected behavior across the actual live working and backlog
stores, including sanctioned distributed layouts. Search existing accepted tickets and proposals;
reuse the work identity when a finding belongs there. Repeated scans update owned evidence or
return it to that record's writer, rather than minting duplicates.

Use the kit's `templates/TICKET-TEMPLATE.md` and
[Parallel-Agent Orchestration — Shared Contracts](../../../.agent/rules/pattern-agent-orchestration.md),
§2 **Ticket metadata contract**, for accepted work. Preserve frontmatter status, updated date and
`landed` semantics; use P0–P3 priorities and applicable proof lanes. A scan is not
acceptance of its own proposed implementation: keep uncommitted proposals in the existing
`IDEA-*` feedback record or the scan's `REVIEW-*` until triaged. Use `ready` only when the actual
work contract is ready, not as a synonym for “scanner found something.”

Respect the project store and filename convention. Use its single allocator for stable IDs or
a unique slug with the required tier suffix; never allocate competing scan ordinals. Record
evidence, impact, confidence, exclusions and observable acceptance without copying a second
ticket template into this skill.

Update navigation only when an index exists and its write belongs to this task. An ephemeral
`backlog-status` view does not imply the backlog directory is absent; discover actual storage.
Leave scheduling/status-board writes to their single owner. Do not create a second backlog.

## Definition of Done

Selected scopes have explicit coverage results. Each filed finding has corroboration, a concrete
maintenance outcome and a duplicate check. Candidates remain distinguished from accepted work.
The requested scan ends when its scoped leads are assessed or the exact evidence limits are
reported. Return needed follow-ups without performing their repairs.

## What we deliberately did NOT do

Do not manufacture findings from counts or age, infer skill usage without telemetry, or turn
detection into installation, repair, archival or implementation.
