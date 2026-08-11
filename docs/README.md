# docs/

Four-directory model. Every doc lives in exactly one of these. Canonical spec:
`governance/docs-standard.md`, mirrored into every project by the `pattern-docs-artifacts` rule.
A project does **not** hand-write a second convention doc — see that standard, §(a).

| Directory | Holds (the five-store test) | Nesting |
|---|---|---|
| [`knowledge-base/`](knowledge-base/README.md) | what **IS** true — durable project truth | by topic (each subdir has a README) |
| [`working/`](working/README.md) | what's **IN FLIGHT** — active tickets/plans/reviews | flat |
| [`backlog/`](backlog/README.md) | not-yet-started items | flat |
| [`archive/`](archive/README.md) | what's **FINISHED** — grouped by month, disposable, out of default search | flat within `YYYY-MM/` |

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
Evidence has its own three-tier lifecycle, and only the promoted tier may be cited
(`governance/docs-standard.md` §(f); the `research-curate` skill walks it).
