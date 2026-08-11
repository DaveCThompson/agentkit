---
name: react-flow-architect
description: Comprehensive instructions for building high-rigor React Flow diagrams following the project's strategy.
tier: tech:react-flow
---

# React Flow Architect Skill (V8 - THE RIGOR PACT)

Use this skill to create or review React Flow diagrams. This skill enforces the "Geometric Invariants" and "Clean UI" standards required to prevent invisible lines and routing bugs.

## 1. Compliance Checklist (V8)
Before implementation, verify:
*   [ ] **Casing**: All imports must use lowercase `reference/`. **NO EXCEPTIONS**.
*   [ ] **NO HEX COLORS**: Use `var(--diagram-edge-stroke)`. If a line is invisible, fix the theme variables.
*   [ ] **HMR Safety**: Use a static React Flow registry module owned by the current project rather than inline node/edge registration in JSX.
*   [ ] **1px Border**: Every container must have a visible 1px border.
*   [ ] **Data Separation**: Nodes/Edges must be defined in a `.ts` file, NOT in JSX. Use `<ReactFlowDiagram>` to render.
*   [ ] **Agentic Styling**: Forward flows must be dashed & animated. Feedback must be solid.
*   [ ] **Static Experience**: No `<Controls />`. Dragging and selection must be disabled in the host component.
*   [ ] **Scannability Pact**: Strip jargon (e.g., Environment -> Tools). Use Headline (Role) + Subtext (Function) structure.

## 2. The Scannability Pact (Clarity over Jargon)
To make diagrams accessible to non-technical audiences:
*   **Headline**: Identifies the Actor/Component (e.g., `Agent (LLM)`).
*   **Subtext**: Describes the primary action using concrete examples (e.g., `Plans, Thinks, & Decides`).
*   **Edge Labels**: Use plain language (e.g., `Tool Output` instead of `Observation`).
*   **Concrete over Abstract**: Prefer `Search, APIs` over `External Interfaces`.
Refer to this table to prevent "10,000 pixel lines":

**Handle ID Truth Table**:
- **Right** — Source: `right-source`, Target: `right`
- **Left** — Source: `left-source`, Target: `left`
- **Top (Center)** — Source: `top-source`, Target: `top`
- **Top (Left/Right)** — Source: `top-source-l` / `top-source-r`, Target: `top-l` / `top-r`
- **Bottom (Center)** — Source: `bottom-source`, Target: `bottom`
- **Bottom (L/R)** — Source: `bottom-source-l` / `bottom-source-r`, Target: `bottom-l` / `bottom-r`

## 3. The ID Invariant
**NEVER** guess a handle ID. Mismatched IDs result in invisible edges.

## 4. Verification Workflow
1.  **Hex Audit**: `grep -r "#" src/features/reference/components`.
2.  **Casing Audit**: Search for `features/Reference`.
3.  **ID Audit**: Compare Edge handle references against the **Truth Table**.

