# agentkit

[![CI](https://github.com/DaveCThompson/agentkit/actions/workflows/ci.yml/badge.svg)](https://github.com/DaveCThompson/agentkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Vendor-agnostic agent kit. Author each skill, rule, and workflow once in `.agent/`; generate
native vendor surfaces per project; detect drift with a lockfile; and flow worthwhile local
improvements back with `agentkit adopt`.

The source tree is shared across Claude, Codex, Gemini, OpenCode, and Antigravity. Vendor
differences live in `adapters.mjs`, not in mirrored authoring folders.

## Why this exists

Agent instructions tend to fork as soon as a project supports more than one coding tool. `agentkit`
keeps the authored policy in one place, selects stack- and project-specific overlays, and renders
the native surface each vendor expects.

## Layout

```
.agent/             the canonical kit source
agentkit.mjs        CLI: init | sync | check | adopt | inventory | doctor
adapters.mjs        vendor transforms (code, not folders)
agentkit.test.mjs   the safety net — run `npm test`
manifest.json       compiled index (never hand-edit)
integrations/       tool registry
governance/         contracts and settled decisions
templates/          project-facing templates
docs/               the project documentation convention
```

## Quick start

Use a selected clone of this repository and the Node runtime declared by `package.json`.
Create a machine-local bin directory, then pass its absolute path to setup and add it to PATH:

```bash
node "<kit>/agentkit.mjs" setup --bin-dir "<absolute-local-bin>"
agentkit init "<project>" --vendors claude --stack react --kinds app --tools codebase-mcp
agentkit check "<project>" --json
```

Select the vendors, stack, project kinds and tools the project needs. Optional tools are not
installed by selection. The launcher binds to the chosen kit checkout; there is no per-project
binding file. A clone can read committed generated guidance before local CLI setup.

Preview updates with `agentkit sync "<project>" --dry-run --json`, then explicitly sync after
reviewing its effects. Sync consumes the selected checkout's current source, including identified
uncommitted changes; it does not pull or upgrade in the background. Per-file pins are unsupported.
Use `exclude` for exact canonical rule/workflow paths or a whole `.agent/skills/<name>` bundle.
Skill files and resources are selected together; an individual skill-file path is not an exclusion ID.

The [operator checklist](governance/migration-checklist.md) covers setup, another computer,
template derivation, migration, recovery, rollback and retirement. Native and platform support
claims require their actual checks; a launcher/version probe establishes only local resolution.

## Development

### Upgrading to 1.0

Public skill and slash-command names are retained. The pending 1.0 contract includes:

- **Locks:** acquire with a fresh `--id <acquisition-id>` or retain the generated ID. Release
  requires that same ID. Legacy/foreign locks and abandoned operation guards fail closed;
  reconcile ownership and preserve state before explicitly authorized recovery. Ignore the local
  `.orchestrator.lock` and `.orchestrator.lock.guard` files. See the
  [orchestration contract](.agent/rules/pattern-agent-orchestration.md#6-single-writer-shared-state-and-lock-ownership).
- **Invariant verification:** exit 2 means incomplete declared-check coverage, even with
  `--warn-only`. Exit 1 means the finding threshold was met. Exit 0 means complete or justified
  not-applicable automated coverage without a failing threshold, not verification of prose rules.
  JSON includes coverage and execution errors. See `node agentkit.mjs verify --help`.
- **Coherent updates:** absent or empty legacy `pins` is compatible; nonempty/malformed values
  refuse before writes. Choose explicitly whether to retain the installation or remove pins after
  reviewing the whole update. See [the superseding decision](governance/DECISION-coherent-kit-updates.md).
- **Recovery and portability:** preserve inherited completed ownership on clones. Private
  `.agentkit.pending.json` retains interrupted operation bytes; `agentkit recover "<project>"`
  completes that operation and refuses intervening edits. Keep it and `*.agentkit-stage-*`
  Git-ignored. Adoption recovery is kit-root scoped. Git rollback separately preserves ignored
  evidence/local setup and restores coupled state with a compatible CLI.
- **Documentation:** `docs.kbRoot` declares one contained repository-relative KB directory;
  the default is `docs/knowledge-base`. Templates and audits use flat defaults and declared exceptions.

Review the combined canonical update, preserve local variants and evidence, then regenerate through
normal sync. Do not force-sync a fleet or delete local locks merely to complete an upgrade.

### Local checks

```bash
npm test
node agentkit.mjs sync .
node agentkit.mjs check . --quick
node agentkit.mjs check . --content
```

Adapter tests also require Python 3.11 or newer for the standard-library `tomllib` parser. Set
`AGENTKIT_TEST_PYTHON` to the intended executable when it is not the host default. This is a test
prerequisite, not a production dependency.

Native Gemini testing is opt-in: `AGENTKIT_TEST_GEMINI_BUNDLE` identifies the exact installed bundle
exporting `SkillManager`. An absent value explicitly skips that lane; it does not establish a native
pass. See the [vendor capability matrix](governance/vendor-capability-matrix.md) for its scope and
limits. CI configuration and actual run records own the Node/OS matrix and observed results; this
documentation does not claim those jobs or native checks ran.

Author changes in `.agent/`. Generated vendor files are never hand-edited. The distribution
repository keeps its own generated mirrors and lockfile local; consumer projects should commit
their generated surfaces and lockfile so fresh clones can discover the active agent surface and
drift remains visible.

## Self-hosting

This repository can sync itself for local development. Fleet roster, MCP config, generated rollups,
and project working state stay local and are gitignored. Public-safe templates ship as
`fleet.example.json` and `.mcp.json.example`.

## Contributing

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) for the source-of-truth rules and the
small verification gate.

## License

MIT — see [LICENSE](LICENSE).
