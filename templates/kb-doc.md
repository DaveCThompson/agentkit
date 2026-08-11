---
applies-to:
  - "src/example/**"          # code globs — what this doc is the truth ABOUT
  - "src/other/**"
last-verified: YYYY-MM-DD      # date last checked against the code; feeds doctor staleness
---

# SPEC-<topic>

<!-- KB doc template. Canonical spec: governance/docs-standard.md §(c),(d).
     - Prefix the FILENAME: SPEC- / PRD- / STRATEGY- / RUNBOOK- / DECISION- (kebab-case, no spaces).
     - The `applies-to` + `last-verified` frontmatter is MANDATORY — it makes routing mechanical
       (agentkit check --kb) and staleness detectable (agentkit doctor).
     - Add this doc to its subdir README trigger table with a one-line "read it when…" phrasing.
     - If you use the DECISION- prefix, use the four-heading body shown at the bottom instead. -->

> **Related rule:** `.agent/rules/<rule>.md` (if a rule enforces this spec — bidirectional drift link).

One-sentence statement of what this doc is the durable truth about.

## <Section>

The actual contract / spec content.

## Source files

- `src/example/thing.ts` — <what lives here>

<!-- ============ DECISION- docs use THIS body instead of the above ============
# DECISION-<question>

## Status
Accepted | Superseded by DECISION-<x> | Proposed

## Context
What forced the decision. What was true at the time.

## Decision
The choice, stated so no one re-litigates it.

## Consequences
What this makes easy, what it makes hard, what it forecloses.
============================================================================= -->
