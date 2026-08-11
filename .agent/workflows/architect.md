---
description: Produce a technical architecture specification after PRD approval.
skill: plan-architecture
---

# Architect Workflow

Create a technical architecture spec — the second node in the epic pipeline
(`/prd` -> `/architect` -> `/build`). Also the target of `/explore architecture`.

## Goal
An architectural blueprint in `docs/working/TICKET-{name}.md` (or `ARCH-{name}.md`): data model,
component hierarchy, state management, file manifest, and risk analysis.

## Inputs required (ask if missing)
- Approved PRD (or a clear feature brief for the architecture branch of `/plan`).
- Existing architecture docs in `docs/knowledge-base/`.

## Safety + scope
- Do NOT modify application code.
- Only touch `docs/working/`.

## Skill routing (explicit)
- `plan-architecture`.

## Procedure
1. **Foundation**: Follow `plan-architecture`'s `SKILL.md`; review the relevant foundation/tech rules.
2. **Options**: Evaluate 3–4 architectural approaches with trade-offs.
3. **Specification**: Document the data model, component hierarchy, and file manifest; use diagrams
   for complex flows.
4. **Risk analysis**: Hostile review for failure modes.
5. **Review**: Present to the user for approval.

## Notes
- After approval, proceed to `/build`. This is the pipeline's architecture node; `/plan` routes its
  architecture branch here rather than duplicating the spec.
