---
name: compose-editorial
description: Human-in-the-loop editorial composition. Generates concept variants for macro and micro review with structured comparison tables. Adapt this template for any editorial content workflow.
---

# Editorial Composition (Template)

Compose editorial content through structured concept generation and human review loops.

## When to Use
- Creating any long-form editorial content (newsletter editions, blog posts, case study narratives)
- When the user has raw research or source material and wants a polished output
- When editorial voice and angle matter (not just formatting)

## Approach

### Phase 1: Source Validation
1. Check research completeness against the content type's requirements.
2. If research is incomplete, flag which dimensions are missing and ask user to provide or skip.

### Phase 2: Macro Review — The Take (Generate → Compare → Select)
This is the highest-value editorial decision. Generate multiple options.

1. **Generate 3 candidate Takes** with distinct editorial angles:
   - **Variant A**: The most conservative, evidence-heavy take
   - **Variant B**: The boldest, most opinionated take
   - **Variant C**: The most actionable, prescriptive take
2. **Present a structured comparison table** to the user:

```markdown
| | Variant A (Conservative) | Variant B (Bold) | Variant C (Actionable) |
|---|---|---|---|
| **Core Claim** | [1 sentence] | [1 sentence] | [1 sentence] |
| **Angle** | Evidence-weighted | Contrarian position | Prescriptive recommendation |
| **Boldness** | ⬜⬜⬜ Low | ⬛⬛⬛ High | ⬛⬛⬜ Medium |
| **Risk** | Low — safe to publish | High — may be wrong | Medium — depends on execution |
| **Key Data Point** | [The anchor] | [The anchor] | [The anchor] |
| **Full Text** | [2–4 sentences] | [2–4 sentences] | [2–4 sentences] |
```

3. **STOP**: Ask user to pick one, request a remix ("combine A's evidence with B's boldness"), or reject all.
4. If rejected, ask what angle they want and regenerate.

### Phase 3: Micro Review — Sections & Headlines (A/B → Select)
For each section/segment, generate focused variants.

1. Generate 2 headline variants (A/B)
2. Generate 2 summary variants (A/B)
3. Present as a concise comparison:

```markdown
#### Section 1
| | A | B |
|---|---|---|
| **Headline** | [option] | [option] |
| **Summary** | [option] | [option] |
Pick: A or B for each row (or request remix)
```

4. User picks per-row or says "all A" / "all B".

### Phase 4: Assembly
1. Combine all selected/approved content into the final output.
2. Present the opening paragraph for final review.
3. User approves or requests adjustment.

### Phase 5: Iteration Loop
After presenting the assembled output:
- If user requests changes to any section, re-enter the relevant phase (macro or micro).
- Loop until user says **"ship it"**.

## Output
The final assembled content in the appropriate format for the project.

## Constraints
- Do NOT invent findings — all content must trace to the provided source material.
- Do NOT skip the macro review gate. The Take is the editorial soul — the user must actively choose.
- Do NOT present more than 3 macro variants (cognitive overload).
- Do NOT present more than 2 micro variants per item (decision fatigue).
- Always end the macro review with an explicit "Pick A, B, C, or remix?" prompt.
