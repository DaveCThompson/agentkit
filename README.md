# agentkit

Canonical, vendor-agnostic agent kit. Author every skill / rule / workflow once in `.agent/`;
`agentkit sync` generates real native files per vendor per project; `agentkit check` tells
IN-SYNC from STALE from LOCALLY-EDITED from CONFLICT via a committed lockfile; `agentkit adopt`
flows local improvements back to the kit.

One `.agent/` source of truth propagates to multiple vendor surfaces (Claude, Codex, Gemini,
OpenCode, Antigravity) without mirrored directories — vendor differences live as code in
`adapters.mjs`.

## Layout
```
.agent/           the kit — same shape as every project (the only thing propagated)
agentkit.mjs      CLI: init | sync | check | adopt | inventory | doctor
adapters.mjs      vendor transforms (code, not folders)
agentkit.test.mjs the safety net — run `npm test`
manifest.json     COMPILED index (never hand-edit)
fleet.example.json  roster template (copy to gitignored fleet.json for your own fleet)
integrations/     tool registry (one flat file per external tool)
governance/       the spec docs + settled decisions (flat)
templates/        project-facing templates
docs/             the doc tree: working/ backlog/ archive/ knowledge-base/ (see docs/README.md)
```

## Quick start (a project)
```
node <kit>/agentkit.mjs init <project> --vendors claude --stack react --tools codebase-mcp
node <kit>/agentkit.mjs check <project>
```
See `governance/migration-checklist.md` for migrating an existing project.

## Self-hosting
This repo is also a kit-managed project: it syncs its own `.agent/` to its own vendor surfaces.
Your fleet roster (`fleet.json`), MCP config (`.mcp.json`), generated rollups (`reports/`), and
your `docs/` working state stay local — they are gitignored. Ship-safe templates live alongside
(`fleet.example.json`, `.mcp.json.example`).

## License
MIT — see `LICENSE`.