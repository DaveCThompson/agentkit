---
description: Load sufficient project context index-first and preserve current intent on resume.
skill: project-onboard
---

# Onboard Workflow

Use `project-onboard` with the actual task scope and whether this is a fresh start or a resume.
The skill owns context routing, question-specific evidence ranking, tool fallback and the depth
decision. Stop when sufficient context is loaded; do not impose an additional document quota here.
