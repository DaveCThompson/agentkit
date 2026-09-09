# docs/

Four documentation roles, with evidence alongside them when needed. Canonical spec:
the kit's `governance/docs-standard.md`, adapted to the project's documented layout.

| Directory | Holds (the five-store test) | Nesting |
|---|---|---|
| [`knowledge-base/`](knowledge-base/README.md) | what **IS** true — durable project truth | flat; declared topic-library exceptions have their own trigger index |
| [`working/`](working/README.md) | what's **IN FLIGHT** — active tickets/plans/reviews | flat |
| [`backlog/`](backlog/README.md) | not-yet-started items | flat |
| [`archive/`](archive/README.md) | completed records — grouped by month, retained, out of default search | flat within `YYYY-MM/` |

`CHANGELOG.md` (repo root) holds what **WAS done**. `.agent/rules/` hold what an agent must **DO**.

Anything that is none of the five stores is **evidence** — quarantine it to `docs/raw-research/` (peer of
the KB, `.ignore`-excluded), not unsupported project truth. Respect any existing evidence store and
local ignore policy. Search exclusion does not make a file disposable or prove Git can recover it.
If `.agentkit.json` declares `docs.kbRoot`, use that KB location and update this navigation accordingly.

## Lifecycle

```
backlog/TICKET-foo.md → working/TICKET-foo.md → archive/YYYY-MM/TICKET-foo.md
                                              ↘ knowledge-base/ (if a durable truth was established)
```

Archive only eligible work. Preserve pending acceptance in a live record or explicit successor,
and verify content recovery and navigation before moving local-only evidence.
