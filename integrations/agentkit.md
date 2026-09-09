---
name: agentkit
description: Local agentkit CLI for shipped-state diagnosis and authorized managed transfer. Version probing does not verify project state.
check-command: agentkit --version
doc-urls: [agentkit.mjs, README.md, governance/mirror-contract.md]
last-verified: 2026-09-07
---

# Agentkit CLI

This entry registers the concrete CLI dependency used by shipped-state diagnostics, invariant
verification, onboarding and documentation maintenance. Each consumer declares the dependency;
it applies when that consumer needs the CLI-backed part of its method.
It adds no MCP server or installation step. Its need is the kit's own shipped-state comparison
and flowback methods. Evidence: observed CLI source/help and consumer methods; staff-tier
engineering judgment, Astra/high assignment.

The operator setup, clone, recovery and retirement procedure lives in
[migration checklist](../governance/migration-checklist.md). `agentkit setup --bin-dir <local-bin>`
requires an existing absolute bin directory and creates a launcher bound to the selected checkout
and Node executable; the operator adds it to PATH. An existing different launcher requires reconciliation.
The portable hook is `agentkit check . --quick --json`. No per-project binding file is required.
Setup is an explicit local write, not an effect of declaring this integration or probing its version.

## Resolve and probe

The package's `bin.agentkit` points to `agentkit.mjs`; `package.json` owns the supported Node
version. Doctor runs `agentkit --version` through the project shell. A successful probe establishes
that the resolved command can print a version. Verify executable provenance separately; it does
not establish project configuration, shipped-state agreement or permission to transfer content.

The command must resolve on that shell's PATH. An existing kit checkout is also usable directly:
`node "<kit-root>/agentkit.mjs" --version`, after resolving the actual checkout. Doctor does not
substitute `<kit-root>` or discover vendor hook paths. Thus its PATH probe can fail while this
explicit Node invocation works; report both facts without requiring an installation. A version
probe does not need to run check, sync, inventory or doctor.

## Use and fallback

Use [health-agent](../.agent/skills/health-agent/SKILL.md) for diagnosis and
[kit-contribute](../.agent/skills/kit-contribute/SKILL.md) for owned change dispositions.
Their methods own shipped-state checks, conflict handling and managed transfer. Inspect installed
subcommand help before unfamiliar operations. `doctor` writes a local run record; `inventory`
compiles metadata; sync/adopt have broader writes. None is a substitute for the version probe.
`recover [project]` finishes retained operation bytes and stops on intervening edits. Adoption recovery
uses the kit root. Private pending/staged files remain ignored and preserved until reconciled;
they are not committed clone state. Check the installed help before a version-dependent mutation.

If no runnable CLI/Node path is available, use scoped canonical source and Git evidence. Keep
lock-based comparison and managed transfer explicitly unavailable. Existing authorized canonical
edits may continue; generated outputs and machine metadata remain with their tooling owner.
Provision only when necessary and covered by the existing action/target grant, through that owner.
See [dependency semantics](../governance/best-practices.md#dependencies-and-capability-evidence).
