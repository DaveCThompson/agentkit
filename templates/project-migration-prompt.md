# Migrate an existing project to AgentKit

Replace the two placeholders and give this prompt to the agent working in the consuming project.
The operator checklist in the selected kit owns the procedure; this prompt supplies the task scope.

```text
Migrate this project using AgentKit at <absolute released kit checkout>.
Git action: <prepare a diff / commit locally / commit and push to named target>.

Include necessary project-local cleanup and migration. Preserve project instructions, application
work, useful local variants and ignored evidence. Complete routine work within this scope. Ask only
for consequential unresolved ownership/content decisions or missing required input.

Read this project's AGENTS.md and indexes, then the selected kit's governance/migration-checklist.md,
overlay-contract.md and mirror-contract.md. Record the actual kit/project paths, revisions, package
version, launcher binding and relevant local changes. A pulled kit and a consumer lock can describe
different source lines. Do not edit the lock to make their version strings agree.

Inventory and preserve the affected canonical files, generated outputs, settings, overlays and
local-only work. A pushed report does not include uncommitted or ignored state. Inspect pending
operations before further mutation and follow the selected kit's scoped recovery procedure.

Verify launcher resolution from the actual client's environment before accepting the portable hook.
Use the selected checkout's direct Node command for diagnosis while completing local setup. A working
command in another shell is not proof that the client can invoke it.

Preview sync with --dry-run --json. Read the complete file/settings effects, refusals, unresolved
ownership and unclaimed overlays. Reconcile useful variants as declared project overlays or preserve
them for separately authorized kit adoption. Keep distinct routing names and all still-used public
entry points. Do not copy old generated files over the incoming canonical source.

Reconcile legacy native settings contribution by contribution. Preserve unrelated servers, hooks and
permission policy. Once the replacement hook works and retirement is authorized, remove the exact
superseded hook, then sync and check again. Keep one intended kit SessionStart check. Unknown ownership
remains explicit; do not bulk-clear settings, discard locks, erase pins or use blanket force to bypass
a refusal. Force requires preservation and authority for the entire current overwrite/prune set.

Remove only exact recoverable vendor files proven inactive and superseded. Resolve kit governance
references in the selected kit checkout rather than assuming the consumer has a governance directory.
Repair upgrade-created broken routing at its canonical owner. Preserve historical evidence and keep
unrelated baseline documentation cleanup separately scoped.

Apply the reconciled update. Inspect the actual result, run check --json and the project's applicable
checks, then verify expected discovery and hook execution in the real client. Report unavailable
native checks as pending. Verify repeat-sync stability without bypassing the Git-dirty guard simply
to obtain a green repeat; use the scoped checkpoint or read-only comparison allowed by the procedure.

Follow the selected Git action only for this migration's config, completed lock, generated surfaces,
and necessary source/docs edits. Keep private preservation data and unrelated work out of the commit.
Report selected release, actual effects, preserved variants, checks, unresolved work and publication
status. Successful writes alone do not mean the migration is complete.
```

## What we deliberately did NOT do

This prompt does not authorize changes to other projects, kit-source adoption, unrelated cleanup,
publication beyond the selected Git action, or deletion of ambiguous project content.
