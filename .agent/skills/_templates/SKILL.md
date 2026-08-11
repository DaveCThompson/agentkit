---
name: _templates
description: Scaffolding templates for creating new skills. Not a real skill — used by the `optimize-agent` skill for generating new skill files.
---

# Skill Templates

This directory contains template files for scaffolding new skills. It is **not** a skill itself.

## Contents

- `SKILL-TEMPLATE.md` — The canonical template for a new `SKILL.md` file.

## Usage

When creating a new skill, copy `SKILL-TEMPLATE.md` into a new directory under `.agent/skills/[skill-name]/SKILL.md` and fill in the sections.

## Constraints
- Do not invoke this as a skill — it has no executable workflow.
- Do not delete the template; it is the source of truth for skill structure.
