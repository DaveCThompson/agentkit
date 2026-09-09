---
applies-to:
  - "src/example/**"
  - "src/other/**"
last-verified: YYYY-MM-DD
---

# SPEC-<topic>

<!-- KB doc template. Canonical spec: governance/docs-standard.md §(c),(d).
     - Prefix the FILENAME: SPEC- / STRATEGY- / RUNBOOK- / DECISION- (kebab-case, no spaces).
       PRD- is a working lifecycle artifact; distill accepted as-is truth rather than moving it whole.
     - The `applies-to` + `last-verified` frontmatter is MANDATORY — it makes routing mechanical
       (agentkit check --kb); it does not establish semantic freshness automatically.
     - Replace all example globs, dates and paths with actual project values before filing.
     - Keep the document flat in docs.kbRoot (default docs/knowledge-base), or use a declared
       nested layout. Add it to the corresponding README trigger table.
     - For DECISION-, use templates/DECISION.md instead; that template includes status frontmatter.
     - Keep future requirements in the accepted ticket, PLAN or PRD. -->

> **Related rule:** `.agent/rules/<rule>.md` (if a rule enforces this spec — bidirectional drift link).

One-sentence statement of what this doc is the durable truth about.

## <Section>

The actual contract / spec content.

## Source files

- `src/example/thing.ts` — <what lives here>

## What we deliberately did NOT do

<Material exclusions or unsupported behavior relevant to this contract.>
