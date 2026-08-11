---
name: optimize-agent
description: Analyze recent interactions to identify friction and propose structural improvements to skills, workflows, or rules.
tier: core
---

# Optimize Agent

Analyze recent interactions to identify friction and propose structural improvements.

## When to Use
- Triggered by `/learn` workflow
- After a complex debugging session to capture lessons
- When the user points out a process failure ("You missed this rule")
- When you feel "stuck" or find yourself repeating mistakes via reflexion

## Persona
**Process Engineer** using **Root Cause Analysis**.
You are looking for *systemic* fixes, not just one-off corrections. You value rigor, clarity, and explicit protocols.

## Approach

### Phase 1: Diagnosis (The "Incident" Audit)
1.  **Identify the Failure/Friction**: What went wrong? (e.g., "Missed a UI rule", "Workflow was too vague", "Codebase assumption was wrong").
2.  **Trace the Root Cause**:
    - **Skill Gap**: Did the skill lack a specific step?
    - **Rule Gap**: Was a necessary constraint missing from `.agent/rules/*`?
    - **Process Gap**: Did we skip a verification step?
    - **Hallucination**: Did we invent a library or pattern?
3.  **Post-Mortem Classification**:
    - **One-off**: Human error. Note it, move on.
    - **Systemic**: Repeatable error. REQUIRES fix.

### Phase 2: Solution Design
1.  **Draft the Fix**:
    - **Rule Injection**: "Add Rule #108 to foundation-design-system.md..."
    - **Skill Sharpening**: "Add a 'Pre-Flight Check' step to the implementation skill..."
    - **Workflow Hardening**: "Add a specific question to the wrap-up checklist..."
2.  **Verify Generality**: Ensure the fix applies to *future* generic cases, not just this specific instance.

### Phase 3: Application
   - **Tier guard (codification gate — `pattern-agent-orchestration.md` §1):** if this session is
     running below senior tier, do NOT apply the fix. Append the proposal to the live feedback pool
     (for example, `docs/backlog/IDEA-<feedback-pool>.md`) with a `**Provenance**:` line (producer tier · model ·
     evidence tier · source) and stop — a senior/staff session adopts it after re-verifying.
   - Route the disposition through the `kit-contribute` skill (adopt to kit / promote to overlay /
     discard) — never edit generated vendor copies, and never bypass that routing with direct
     `.agent/` edits. Source edits happen inside that routing, in the same session.
   - Update Changelog: Note the process improvement in `./CHANGELOG.md` (under "Protocol Evolution").

## Reflexion
Before finishing, ask:
 - [ ] Is this rule too specific? (e.g., "Don't use textarea for *this* file" vs "Mandate PromptInputField globally")
 - [ ] Will this slow me down purely for bureaucracy? (Avoid low-value paperwork)
 - [ ] Does this conflict with an existing rule?

## Output
- Improvements dispositioned via `kit-contribute` (adopt / overlay / discard) — at senior tier or
  above; below that, a provenance-stamped candidate filed in the feedback pool instead
- `./CHANGELOG.md` entry
