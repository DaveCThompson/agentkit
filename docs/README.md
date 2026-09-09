# docs/

The default layout has four documentation roles, with a separate evidence store. The canonical
standard is [Docs / KB / CHANGELOG Standard](../governance/docs-standard.md). The synced
`pattern-docs-artifacts` rule routes to it; projects do not maintain another copy.
This kit declares `governance/` as its KB through `.agentkit.json` `docs.kbRoot`.

| Directory | Holds (the five-store test) | Nesting |
|---|---|---|
| [`knowledge-base/`](knowledge-base/README.md) | durable project truth; this kit's public contracts live in [`governance/`](../governance/README.md) | flat by default; a substantial topic library may use a nested index |
| [`working/`](working/README.md) | what's **IN FLIGHT** — active tickets/plans/reviews | flat |
| [`backlog/`](backlog/README.md) | not-yet-started items | flat |
| [`archive/`](archive/README.md) | completed work and retained history, outside default search | flat within `YYYY-MM/` |

`CHANGELOG.md` (repo root) holds what **WAS done**. `.agent/rules/` hold what an agent must **DO**.

Anything that is none of the five stores is **evidence** — quarantine it to
[`raw-research/`](raw-research/README.md) (peer of the KB, `.ignore`-excluded), never the KB.

## Lifecycle
```
backlog/TICKET-foo.md → working/TICKET-foo.md → archive/YYYY-MM/TICKET-foo.md
                                              ↘ knowledge-base/ (if a durable truth was established)

raw-research/inbox/   →   raw-research/SOURCE-|ANALYSIS-|PROMPT-YYYY-MM-DD-topic.md   →   promoted
   no rules                provenance header                                    verified contract
```
Evidence has its own lifecycle under the standard's section (f). Cite source material with its
provenance and limits; only assessed promotion makes it a project conclusion. Source count alone
does not require a folder. Search exclusion does not establish Git tracking or recoverability.
