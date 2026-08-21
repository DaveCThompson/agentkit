---
description: Create an approved Product Requirements Document for a large feature or epic.
skill: plan-prd
---

# PRD Workflow

Create a PRD for a large feature — the first node in the epic planning pipeline
(`/prd` -> `/architect` -> `/build`).

## Goal
An approved PRD in `docs/working/TICKET-PRD-{name}.md` defining user stories, a state matrix, and
success criteria (with a Definition of Done).

## Inputs required (ask if missing)
- Feature description or user request.
- Target audience / persona.
- Relevant existing documentation.

## Safety + scope
- Do NOT write code or draft technical architecture (that is `/architect`).
- Only touch `docs/working/`.

## Skill routing (explicit)
- `plan-prd`.

## Procedure
1. **Context**: Follow `plan-prd`'s `SKILL.md`; read the project vision in `docs/knowledge-base/`.
2. **Reconcile**: Before turning an older PRD or proposal into work, inspect the current app, current
   code, and accepted owner decisions. Classify each conflict as `current truth`, `durable rule`,
   `future backlog`, `implementation supersedes`, or `manual review`. A mismatch alone is not a
   product defect. Include a compact claim-disposition table only when the existing document predates
   substantial shipped work or conflicts with the current surface.
3. **Reconnaissance**: Scan for similar existing features to keep patterns consistent.
4. **Draft**: Generate the active PRD in `docs/working/TICKET-PRD-{name}.md`.
5. **Review**: Notify the user and request approval; present the reasoning behind key requirements.

## Notes
- After approval, proceed to `/architect`. This workflow is the pipeline's PRD node — it maps 1:1 to
  `plan-prd` but adds the epic handoff gate.
