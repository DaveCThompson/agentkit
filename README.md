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

Run the CLI directly from a clone of this repository:

```bash
node <kit>/agentkit.mjs init <project> --vendors claude --stack react --tools codebase-mcp
node <kit>/agentkit.mjs check <project>
```

Use `--vendors` and `--stack` to select the surfaces a project actually needs. See
`governance/migration-checklist.md` for migrating an existing project.

## Development

```bash
npm test
node agentkit.mjs sync .
node agentkit.mjs check . --quick
node agentkit.mjs check . --content
```

Author changes in `.agent/`. Generated vendor files are never hand-edited. The distribution
repository keeps its own generated mirrors and lockfile local; consumer projects should commit
their generated surfaces and lockfile so fresh clones can discover the active agent surface and
drift remains visible.

## Self-hosting

This repository can sync itself for local development. Fleet roster (`fleet.json`), MCP config
(`.mcp.json`), generated rollups (`reports/`), and project working state stay local and are
gitignored. Public-safe templates ship as `fleet.example.json` and `.mcp.json.example`.

## Contributing

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) for the source-of-truth rules and the
small verification gate.

## License

MIT — see [LICENSE](LICENSE).
