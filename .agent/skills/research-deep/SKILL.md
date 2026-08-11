---
name: research-deep
description: Conduct deep research on a topic using web search and analysis. Use when you need comprehensive understanding of a topic.
tier: core
---

# Research Deep

Conduct deep research on a topic.

## When to Use
- Need comprehensive understanding
- Exploring new technologies
- Investigating best practices

## Approach


### Phase 1: Define Research Questions
- **Force-Ranked Questions**: Create exactly 6 specialized, force-ranked questions.
- **Hypothesis Generation**: What do we believe to be true?
- **Key Unknowns**: What specific data is missing?

### Phase 2: Information Gathering (Tiered Source Hierarchy)
- **Tier 1 (Frontier/Primary)**: Official docs, source code, primary research papers.
- **Tier 2 (Expert)**: Recognized expert blogs, technical whitepapers.
- **Tier 3 (Community)**: High-quality forums (StackOverflow with high votes), community discussions.
- **BLOCK**: Generic Medium posts, SEO-spam, Reddit (unless specific expert subreddits).

### Phase 3: Synthesis & Verification
- **Cascading State Integrity**: If Domain changes → Reset Persona → Reset Methodology.
- **Personnel-Driven Frameworks**: Use appropriate frameworks (e.g., AI Lead = RAGAS, not PESTLE).
- **Conflict Resolution**: Cross-reference conflicting sources; prioritize Tier 1.

### Phase 4: Recommendations
- Summarize learnings with specific citations.
- Note technical implications for project.
- Identify next steps.

## Output
Research notes with tiered sources cited, written to `<docs-root>/raw-research/inbox/` (the tier-1
evidence store; preserve upstream filenames). Promotion to the knowledge-base research ledger
happens only via `research-curate` — never write research output into `docs/knowledge-base/`
directly.
