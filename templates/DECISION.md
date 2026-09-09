---
status: proposed
applies-to:
  - "src/example/**"
last-verified: YYYY-MM-DD
---

# DECISION-<kebab-topic>

<!-- Canonical spec: governance/docs-standard.md §(c). Co-locate this file in the KB (or, for the
     kit, in governance/) NEXT TO the spec it constrains, so a spec's `applies-to` glob surfaces the
     decision as a constraint. No sequential numbering. Immutable once `status: accepted` — supersede
     with a NEW file, never rewrite the rationale.

     THE ADMISSION TEST — all three must hold, or this is not a DECISION-:
       1. Hard to reverse      — changing our mind later carries meaningful cost.
       2. Surprising w/o context — a future reader meets the code and asks "why on earth this way?"
       3. A real trade-off     — genuine alternatives existed; one was chosen for specific reasons.
     Fails the test? A small locked fact belongs in project-invariants.md or a spec section, not here.
     Keep this doc SMALL: a one-paragraph Context is fine; drop the optional sections when empty. -->

<!-- Frontmatter owns status: proposed | accepted | superseded. Add supersedes: with an actual
     older decision filename when applicable. Use actual code/config globs and verification date.
     Record acceptance provenance in Context when accepted; do not maintain a body status.
     Remove optional empty metadata/sections. -->

## Context
<The forces at play — why this even came up. 2–5 sentences.>

## Decision
<What was chosen. 1–3 sentences.>

## Consequences
<What becomes easier / harder; what agents must now respect going forward.>

## Options considered   <!-- optional — include only when the alternatives aid a future reader -->
- **<Option A (chosen)>** — <why>
- **<Option B>** — <why not>

## Revisit trigger   <!-- optional — the condition under which we would reopen this -->
<e.g. "flip to Option B if <constraint> changes.">

## What we deliberately did NOT do

<Material alternative or scope excluded by this decision.>
