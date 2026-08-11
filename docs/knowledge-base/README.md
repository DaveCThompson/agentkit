# Knowledge Base

**Purpose:** Durable project knowledge, implementation contracts, research
evidence, reusable references, and validated operational guides  
**Last updated:** 2026-05-30

Start here before treating any individual file as current direction. This
folder intentionally contains both active contracts and historical evidence.
The status tables below distinguish them.

## Kit decisions (builder-agentkit's own)

| Document | Status | Use |
| --- | --- | --- |
| [DECISION-agent-asset-boundary.md](DECISION-agent-asset-boundary.md) | Accepted 2026-08-01 | Operator owns the agent box/templates/personas; builder renders contract text + drift-checks — read before any subagent-roster work (U4, compiler D2) |

## Active Project Direction

| Document | Status | Use |
| --- | --- | --- |
| [STRATEGY.md](STRATEGY.md) | Active | Personalized AI Builder product strategy and locked v1 decisions |
| [SPEC-transverse.md](SPEC-transverse.md) | Active | Shared wizard primitives, extraction, scope, and handoff schema |
| [SPEC-assistant-wizard.md](SPEC-assistant-wizard.md) | Active | v1 Lifestyle/Productivity Assistant wizard |
| [SPEC-writer-wizard.md](SPEC-writer-wizard.md) | Active | Writer wizard |
| [SPEC-teacher-wizard.md](SPEC-teacher-wizard.md) | Active with known gap | Teacher wizard; multi-subject branching still needs a sub-spec |
| [SPEC-output-artifacts.md](SPEC-output-artifacts.md) | Active | Deterministic model-specific artifact generation contract |
| [proj-prompt-IMPLEMENTATION-HANDOFF.md](proj-prompt-IMPLEMENTATION-HANDOFF.md) | Active | Implementation guardrails for `proj-prompt` |
| [proj-prompt-AGENT-PRESET-BRIDGE.md](proj-prompt-AGENT-PRESET-BRIDGE.md) | Active | Manual artifact bridge from proj-prompt to the agent network |

## Agent Network Operations

| Document | Status | Use |
| --- | --- | --- |
| [MCP-SANDBOX-SETUP-LEARNINGS.md](MCP-SANDBOX-SETUP-LEARNINGS.md) | Validated | Cross-device Open WebUI + private read-only MCP runbook |
| [`open-webui-agent-network-ops`](../../.agents/skills/open-webui-agent-network-ops/SKILL.md) | Active skill | Portable Open WebUI hub operations and least-privilege tool guidance |
| [`tailscale-private-serve`](../../.agents/skills/tailscale-private-serve/SKILL.md) | Active skill | Tailnet-only HTTPS verification and repair workflow |

## Research Evidence

Use [research/README.md](research/README.md) as the ledger for completed
research. Research prompts and result files are evidence artifacts: preserve
their original dispatch context, including historical paths and model names,
unless a correction is needed to understand the result.

Five unrun deep-research prompts remain in
[`docs/working/research/`](../working/research/). Active specs may record
provisional product decisions while those studies are pending, but they must
not cite nonexistent result files.

## Fixtures

| Folder | Use |
| --- | --- |
| [golden-renders/assistant-atlas/](golden-renders/assistant-atlas/) | Canonical Lifestyle/Productivity Assistant fixture and model-specific renders |

## Reference Collections

| Folder | Classification | Guidance |
| --- | --- | --- |
| [prompts/](prompts/) | Legacy reusable prompt library | Use selectively; it predates this repo's current Codex workflow and is not a runtime contract |
| [help-docs/](../raw-research/help-docs/) | Vendor-doc mirror (provenance-stamped) — imported documentation snapshots | Use for reference only; each file carries a `source:` provenance stamp; imported snapshot links may remain site-relative |
| [reference/](reference/) | Legacy AI Bootcamp reference-authoring material | Keep as historical source material unless that product line is resumed |

## Superseded Documents

| Document | Replacement |
| --- | --- |
| [SPEC-assistant-flow.md](SPEC-assistant-flow.md) | [SPEC-assistant-wizard.md](SPEC-assistant-wizard.md) |
| [proj-prompt-side-prompt.md](proj-prompt-side-prompt.md) | Convenient launch prompt only; authoritative rules live in [proj-prompt-IMPLEMENTATION-HANDOFF.md](proj-prompt-IMPLEMENTATION-HANDOFF.md) |

## Documentation Rules

1. Keep active direction in `docs/working/` and durable contracts here.
2. Move completed tickets and superseded plans to [`docs/archive/`](../archive/).
3. Do not duplicate graduated artifacts between `working` and
   `knowledge-base`.
4. Give active documents a status and last-updated date.
5. Label provisional decisions when pending research has not produced results.
6. Treat imported snapshots and original dispatched prompts as historical
   evidence; improve their indexes rather than silently rewriting their source
   content.
