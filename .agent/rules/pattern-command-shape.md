---
trigger: always
description: Consult before shell calls to choose inspectable command structure, explicit working directories, safe quoting and true result capture under the current runtime's permission and tool contracts.
domain: tooling
---

# Command Shape (permission-friendly shells)

Make commands inspectable, correctly scoped and faithful to the current tool's execution contract.
Permission matching, persistent cwd/environment and available file tools vary by runtime.
Command shape improves clarity; it never grants authority or justifies bypassing a refusal.

## 1. One logical command per call

Prefer separate calls for independent steps; batch only when dependency, latency or an atomic
operation warrants it and each effect is authorized. Capture each meaningful result.
Use the tool's documented argument/environment support and quote paths for the actual shell.
Do not assume shell state persists across calls or that every compound is parsed the same way.

<a id="2-never-prefix-cd"></a>

## 2. Set the working directory explicitly

Prefer an explicit tool working-directory parameter or a supported command-specific directory flag.
Avoid a redundant `cd … &&` prefix. If the tool lacks a cwd parameter, a correctly checked directory
change can be necessary; confirm failure prevents the dependent action. Never rely on an unverified
persisted directory for a destructive command.

## 3. Dedicated tools over shell utilities

Use purpose-built file/search/edit tools when available and appropriate. Otherwise normal shell
reading/search, including `rg`, is valid. No tool name universally guarantees prompt-free execution.
Follow the current editing constraints; do not substitute shell writes for a required patch tool.
Check actual paths and scope before every mutation, including indirect script outputs.

<a id="4-no-inline-for--while-loops"></a>

## 4. Bounded iteration

Prefer clear bounded calls or an existing reviewed script over dense loops. A genuine batch loop
is valid when its target set, per-item errors and partial completion are explicit.
Moving the same effects into Node or another interpreter does not make them safer or approved.
Do not choose an allowlisted interpreter to evade a restricted command.

<a id="5-no-command-substitution--nor-here-strings-for-messages"></a>

## 5. Substitution and literal text

Avoid hidden execution and fragile nested quoting. Capture a needed value with a read-only call
and validate it before use, or use a documented argument API. Some runtimes permit substitutions
or literal here-documents/here-strings; inspect expansion rules rather than making universal
permission-engine claims. In particular, unquoted substitutions and interpolated strings can run
code or expose secrets. Use simple arguments or a real message file for authorized Git messages
under `git-protocol.md`; do not create one merely to satisfy a ritual.

## 6. Redirect-and-check, not pipe-and-parse

Preserve the runner's real exit and useful output. Prefer tool-returned output; an authorized owned
output file can help with large results, but redirection is a filesystem write and may expose data.
A filtered pipeline can mask failure unless upstream status is captured correctly for that shell.
Use `foundation-testing.md` for evidence and actual project gate commands. Existing Node/Python
gate conventions apply only where configured; a familiar command name is not proof it exists.

## What still (correctly) prompts — do not try to shape around these

Respect the current sandbox/permission policy and `pattern-external-mutation.md`.
Network access, publication, deletion and process control have different effects; a read-only fetch
is not inherently a mutation, and not every host prompts for it. Explicit denial remains a boundary.
Resolve exact action, target, authority and preservation before outward/destructive effects.
A helper script must preserve those checks; it cannot launder a denied operation through an
allowlisted head or a broader rule. Do not change permission configuration to finish routine work.
