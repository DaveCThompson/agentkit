---
description: Manage a project-local writing-style profile by initializing, adding samples, updating diagnostics, inspecting evidence, and approving or excluding sources.
skill: manage-writing-style
---

Use `manage-writing-style` for this request.

Map the user's intent to one explicit operation:

- initialize a named style;
- add one or more explicitly supplied attachments or pasted-content blocks;
- update a named or default style from its included source manifest;
- inspect or audit style evidence;
- approve an exemplar, exclude a source, or purge a source only with explicit confirmation.

Resolve the current project and report the project-local `.writing` root before mutation when it is not
already clear. Do not perform writing or style imitation in this workflow; hand prose requests to
`write-content` or `write-ui-copy`.

## What we deliberately did NOT do

- Create a separate style-application workflow.
- Ingest the user's surrounding request as a sample.
- Share a profile across projects.
