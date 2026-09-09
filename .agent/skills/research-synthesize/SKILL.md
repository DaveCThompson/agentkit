---
name: research-synthesize
description: Apply external research findings to project context. Use when you have research documents and need to map them to actionable recommendations.
tier: core
required-tools: [codebase-mcp]
---

# Research Synthesize

Apply external research findings to the project.

## When to Use

- Have research documents to process
- Need to map findings to project constraints
- Filtering relevant insights

## Approach

### Phase 1: Research Ingestion

- Identify the caller's question, accepted project decisions, exclusions and report destination.
  Reuse the current work item; separate accepted constraints from provisional assumptions.
- Inventory supplied findings with their provenance, evidence limits and contradictions. Cross-reference
  themes without treating repeated upstream claims as independent corroboration.
- Resolve the project's docs root and sanctioned layout through repository instructions. A forensic
  report may cite exact inbox material with content identity and uncurated status. Use `research-curate`
  when durable curation or claim promotion is needed; no filing-only move, extra source folder or
  copied report is required. Direct upstream links need no local copy or full promotion.

### Phase 2: Relevance Filtering

Assess relevance to the decision separately from evidence confidence, likely benefit/risk, and
implementation effort. Unknown is a valid assessment. Map material findings to actual project
constraints before judging feasibility. Retain relevant but difficult findings as constraints,
risks or deferred options with reasons. Dismiss irrelevant findings briefly; do not silently drop
a compatibility limit or costly migration requirement. Use scoring only with meaningful anchors
when it helps compare real alternatives.

### Phase 3: Mapping to Existing Systems

Identify the affected project contract and select evidence for that question:

- Current code structure: use `use-codegraph`, which owns reachability, bounded refresh and targeted
  source fallback. The declared graph dependency applies only to this structural discovery. Current
  files and relevant diffs settle claims about current code when an index is stale.
- Intended behavior or strategy: read accepted requirements and decisions; do not infer acceptance
  from existing code or an external recommendation.
- Operational or domain constraints: use relevant runtime evidence, runbooks, policy or primary
  documentation. State version/environment and unsupported applicability assumptions.

Map findings to concrete affected surfaces: an API contract, data lifecycle, deployment constraint
or, for UI work, design tokens/components. Note adaptation, dependency and compatibility costs.
Bound discovery to the decision. Do not index a repository for a question that code cannot answer.

### Phase 4: Recommendation Synthesis

- Prioritize recommendations by decision impact, support and constraints, with implementation hints
  tied to inspected project surfaces.
- Keep adopted decisions, recommendations, deferred options and unresolved conflicts distinct.
  No change is a valid supported conclusion; evidence promotion is not acceptance of a commitment.
- State what could change the recommendation and any remaining check/decision owner. Stop when the
  project implications are supported or the precise remaining uncertainty is identified.

## Output

Write to the caller's supplied report destination. For direct invocation without a destination,
use `<docs-root>/working/REVIEW-research-<topic>.md` in the resolved layout. The research router
passes this same destination; do not create a second application report.

Include findings and evidence, project mappings, recommendation dispositions and relevant next
actions. End with `What we deliberately did NOT do`. A PRD or implementation handoff is appropriate
only when the requested work calls for it; no fixed sign-off question is required.

## Constraints

- No original ideation — recommendations trace to research
- No new dependencies without approval
- No code generation
- No strategy/spec commitment changes without authority for those decisions. Report an unaccepted
  recommendation with evidence and its decision owner instead.

## Definition of Done

- Material findings map to inspected project constraints or an explicit applicability gap.
- Important hard findings and contradictory evidence retain a disposition.
- One report preserves the caller's work identity, accepted decisions and unresolved assumptions.
- Recommendations are distinguishable from accepted or implemented behavior; code remains unchanged.
