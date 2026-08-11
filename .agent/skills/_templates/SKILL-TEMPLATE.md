---
name: skill-name-verb-noun
description: "[What it does]. Use when [trigger conditions]."
# Optional superset fields — stripped from vendor surfaces, read by the kit for routing/health:
# triggers: [keyword, phrase]        # words that should route the model here
# tier: core                         # core | overlay | tech:<stack> (default inferred from name)
# conflicts-with: [other-skill]      # skills that must not run in the same pass
# required-tools: [tool-name]        # tools that must be provisioned (see integrations/)
# verified-against: 2026-07-04       # date/ref of the last context this skill was validated in
---

# Skill Name

Brief description of what this skill enables.

## When to Use

- Trigger condition 1
- Trigger condition 2

## When NOT to Use

State the boundary and route to the right sibling — this is what keeps the skill fleet unambiguous.
- When [adjacent situation] → use `other-skill` instead.
- When [another situation] → use `another-skill` instead.

## Quick Reference (if using modular references)

**Quick Reference Checklist**:

- **Category 1** — [...] See: `references/category1.md`
- **Category 2** — [...] See: `references/category2.md`

## Approach

### Phase 1: [Name]

Steps to complete phase 1...

### Phase 2: [Name]

Steps to complete phase 2...

## Verification / Definition of Done

State the concrete bar this skill must clear before its work is "done". Skills that change code
invoke the lifecycle-aware gate in `foundation-testing.md` (focused local proof during
implementation; one broad gate on the final tree; release validation at the release boundary) —
never claim green on unrun commands. Diagnose-only skills state the evidence the output
must be backed by and the artifact it produces.

- [ ] [Concrete, checkable done-condition 1]
- [ ] [Concrete, checkable done-condition 2]

## Reflexion

Before delivering, verify:
- [Key check 1]
- [Key check 2]

> **Adversarial Tip**: [Optional: Add a hostile persona prompt here if relevant, e.g., "Assume Hostile Reviewer persona..."]

## Constraints

- Constraint 1
- Constraint 2

## Output

Expected artifacts or deliverables.

---

## Notes for Authors

> [!IMPORTANT]
> **Character Limit:** Each SKILL.md must be ≤12,000 characters.

### Naming Convention

- **Folder:** `kebab-case` (e.g., `audit-web-interface`)
- **Skill name (frontmatter):** `verb-noun` (e.g., `audit-web-interface`)
- **Header:** `Title Case` (e.g., `# Audit Web Interface`)

### Modular References Pattern

If your skill has detailed reference material exceeding ~5,000 characters, split into:

```
skills/my-skill/
├── SKILL.md          # Index with Quick Reference
└── references/
    ├── category1.md  # Detailed references with examples
    └── category2.md
```

### Progressive Disclosure

The agent sees only `name` and `description` initially. Full content loads when activated.

**Good description:**
```yaml
description: Audits layout for spacing violations. Use when reviewing CSS.
```

**Bad description:**
```yaml
description: Helps with code.
```
