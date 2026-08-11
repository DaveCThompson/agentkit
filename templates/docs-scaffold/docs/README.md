# docs/

Four-directory model. Every doc lives in exactly one of these. Canonical spec:
`knowledge-base/overview/docs-structure-convention.md` and `agentkit/governance/docs-standard.md`.

| Directory | Holds (the five-store test) | Nesting |
|---|---|---|
| [`knowledge-base/`](knowledge-base/README.md) | what **IS** true — durable project truth | by topic (each subdir has a README) |
| [`working/`](working/README.md) | what's **IN FLIGHT** — active tickets/plans/reviews | flat |
| [`backlog/`](backlog/README.md) | not-yet-started items | flat |
| [`archive/`](archive/README.md) | what's **FINISHED** — grouped by month, disposable, out of default search | flat within `YYYY-MM/` |

`CHANGELOG.md` (repo root) holds what **WAS done**. `.agent/rules/` hold what an agent must **DO**.

Anything that is none of the five stores is **evidence** — quarantine it to `docs/raw-research/` (peer of
the KB, `.ignore`-excluded), never the KB.

## Lifecycle
```
backlog/TICKET-foo.md → working/TICKET-foo.md → archive/YYYY-MM/TICKET-foo.md
                                              ↘ knowledge-base/ (if a durable truth was established)
```
