---
description: Rapidly load project context by reading the routers (indexes), not the corpus — deep pass only for an unfamiliar repo.
skill: project-onboard
---

# Onboard Workflow

Rapid, index-first context loading for new agents or fresh sessions. This is a pure command
mapping to the `project-onboard` skill — its only job is to be that skill's slash command.

## Goal
Orientation across Protocol, Product, and Tech layers at router depth (~5 file reads); individual
docs are read later, at the moment a task matches them.

## Inputs required (ask if missing)
- None (automated orientation).

## Skill routing (explicit)
- `project-onboard`.

## Procedure
1. **Orientation**: Follow `project-onboard`'s `SKILL.md` (light onboard by default).
2. **Protocol**: Read `AGENTS.md` (rule surface by heading — not every rule file).
3. **Product**: Read the KB README **trigger table** in `docs/knowledge-base/` — the map, not the
   docs it points to. Flag a bare title list as a docs-standard §d defect.
4. **Tech**: Scan the manifest (`package.json` or equivalent).
5. **Branch truth**: Read `docs/working/README.md` and the current branch-state note in
   `docs/working/` if present.
6. **Deep pass (exception)**: Only on explicit request or a genuinely unfamiliar repo — the skill
   defines the added reads (foundations, architecture overview, rules scan, codegraph).

## Notes
- Mandatory for new agents or on a significant context switch.
- KB docs are read via routing (`agentkit check --kb`, trigger-table match, 1–3 docs max), never
  as an onboarding bulk read.
