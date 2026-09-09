---
name: health-agent
description: Diagnose the health of the agent system itself — drift between kit, .agent sources, and generated vendor surfaces; tool reachability; config accuracy. Use when something about skills/rules/commands seems stale, missing, or inconsistent.
tier: core
triggers: [agent health, drift, stale skills, vendor mismatch]
required-tools: [agentkit]
---

# Health Agent

Diagnose the requested project or fleet boundary. Return evidence and remediation routes.
Diagnosis does not authorize sync, provisioning, configuration edits, or removal.

## When to Use

- A skill or command appears stale, missing, or inconsistent across vendor surfaces.
- A clone, return to work, or diagnostic has exposed a possible kit-state problem.
- The user requests agent-system health; use `optimize-agent` for process-friction analysis.

## Approach

### Phase 1: Mechanical status

Required local capability: a runnable agentkit CLI and its Node runtime. Resolve it from the
known kit checkout or documented installation first. A configured vendor hook may provide a
path, but no particular vendor or SessionStart hook is required. Here `agentkit` means that
verified executable, or `node "<kit-root>/agentkit.mjs"`. Do not install tools to answer a
diagnostic question.

Run `agentkit check . --json` for shipped-state comparison. Preserve its exit, project identity,
coverage, and file verdicts across canonical sources and generated outputs. A clean Git status
does not prove agreement with the shipped lock.

If the CLI is unavailable, inspect the relevant canonical files, configuration, generated
provenance headers, and available Git history/diffs. Report what these establish: local edits,
missing paths, or contradictory wiring. Mark lock-based shipped-state comparison unavailable;
do not label the project in sync or reconstruct verdicts from Git alone.

Use `agentkit doctor --json` only for a fleet question and when its local report output is within
scope. Otherwise inspect the needed project's evidence. Tool callability, legacy pin rejection,
flowback queue, advisory document age, and conflict copies are diagnostic dimensions; probe only those needed
to answer the question. An unavailable probe is distinct from an empty result.

### Phase 2: Interpret → route

These are proposed routes until remediation of the action and target is already authorized.
Carry existing grants forward; do not ask again merely because a different skill will act.

| Verdict | Interpretation and route |
| --- | --- |
| IN-SYNC | Compared content agrees with shipped state; this does not prove runtime behavior. |
| STALE | Kit source advanced. Review an ordinary sync dry-run for the affected project. |
| LOCALLY-EDITED | A kit-owned file differs locally. Route its owned change to `kit-contribute`. |
| CONFLICT | Both sources advanced. Preserve both edits; use a three-way base only when it hash-matches the recorded source. An unavailable base leaves reconciliation pending. |
| NEW | Selected content has not shipped yet. Inspect selection and the sync plan. |
| MISSING | Expected content is absent. Determine whether this is an intended removal, incomplete generation, or selection problem before restoration. |
| ORPHAN | Previously shipped content left selection. Inspect the prune plan and any retained edits. |
| UNTRACKED-DIFFERS | Content occupies an expected managed path without matching shipped ownership. Inspect provenance and preserve it for an adopt, overlay, or discard decision. |
| Tool unreachable | Check the declared integration and actual project setup; propose provisioning or declaration correction only after establishing which is wrong. |
| Unknown verdict or failed check | Retain the raw result and coverage limit; inspect the installed CLI's meaning rather than guessing a repair. |

`sync --force` is project-wide, not file-scoped. A single-file discard does not authorize it.
Before an authorized forced sync, the executing owner must inspect the entire
`agentkit sync . --dry-run --force --json` plan, including writes and prunes, and reconcile
settings/managed-key effects with the current lock. Preserve affected work. If the whole scope
is not covered, leave the item pending. See
[kit-contribute](../kit-contribute/SKILL.md) for dispositions and
[external mutation](../../../.agent/rules/pattern-external-mutation.md) for action/target authority.

### Phase 3: Config accuracy

Compare configuration with the actual project: selected vendors, stack and package/workspace
manifests, tool declarations, exclusions, legacy pins, and overlay ownership. A missing dependency in one manifest
is a lead, not proof that a tech pack is obsolete; account for workspace and non-package setup.

Use the operator path in `governance/migration-checklist.md` for portable binding, inherited ownership,
rollback and retirement. Inspect managed settings as well as files; an older check that omits them
cannot establish complete sync health. Pending operation state is incomplete, not a successful sync.
Do not repair legacy pins by silently removing them, or treat a missing binding as install authority.

Check wiring claims against provenance and source ownership. Generated mirrors are inspection
surfaces; changes go to the canonical owner and generation owner. Resolve shared-file discrepancies
to their writer using [Parallel-Agent Orchestration — Shared Contracts](../../../.agent/rules/pattern-agent-orchestration.md).

## Definition of Done

Return the requested boundary's findings, supporting verdicts, coverage limits, and routed next
actions. Use file-level detail for material discrepancies; counts are optional summaries, never
coverage proof. No findings is valid. Unavailable comparison remains unresolved evidence rather
than a false clean result. Authorized remediation may continue through its owner; a diagnostic
request ends with the diagnosis.

## What we deliberately did NOT do

Do not hand-copy or edit generated mirrors, infer permission from drift, or broaden a project
diagnosis into a fleet remediation.
