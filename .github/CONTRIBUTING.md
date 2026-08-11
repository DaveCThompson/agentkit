# Contributing

`agentkit` is a small public distribution repository. Keep changes generic,
reproducible, and easy to verify from a clean clone.

## Source of truth

- Author skills, rules, and workflows only in `.agent/`.
- Do not hand-edit generated vendor surfaces. Run `node agentkit.mjs sync .`
  when adapter output needs verification.
- Do not commit fleet rosters, local MCP configuration, reports, private docs,
  or other machine-specific state.
- A change to `.agent/` needs a `CHANGELOG.md` entry with its evidence and
  provenance.

## Verification

Run these commands before opening a pull request:

```bash
npm test
node agentkit.mjs check . --quick
node agentkit.mjs check . --content
```

The CI workflow runs the same checks. Keep the existing test suite green and
add a regression test when behavior changes.

## Adding an agent asset

Use a flat, kebab-case name. Make the description a routing surface that says
when the asset applies. Keep project-specific material in an overlay or in the
consuming project. Declare required tools and a fallback when an asset depends
on an external tool. Follow [the authoring standard](../governance/best-practices.md).

## Pull requests

Explain the behavior change, affected vendor surfaces, and verification. Keep
generated output out of the authored diff unless the change specifically tests
an adapter or public template.
