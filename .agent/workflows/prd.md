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
2. **Reconnaissance**: Scan for similar existing features to keep patterns consistent.
3. **Draft**: Generate the PRD in `docs/working/TICKET-PRD-{name}.md`.
4. **Review**: Notify the user and request approval; present the reasoning behind key requirements.

## Notes
- After approval, proceed to `/architect`. This workflow is the pipeline's PRD node — it maps 1:1 to
  `plan-prd` but adds the epic handoff gate.
