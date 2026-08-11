# Knowledge Base — trigger index

Durable project truth. This index is the KB's **routing surface**: each row says *when to read* a
doc, not just its title. Read only the 1–3 docs relevant to your task — not none, not all.
`agentkit check --kb <paths>` matches the files you're touching against each doc's `applies-to` globs.

Canonical spec: `agentkit/governance/docs-standard.md` §(c),(d).

> **⚠ = known drift.** A ⚠ row cites commit provenance and what to distrust. **Docs without a ⚠ were
> not necessarily verified** — absence of a marker is not a guarantee of accuracy.

## Specs & contracts
| Doc | Read it when… |
|---|---|
| `SPEC-<topic>.md` | before changing anything under `src/<area>/**` |
| `SPEC-<other>.md` | ⚠ MAJOR DRIFT — cites files that no longer exist (per `working/REVIEW-YYYY-MM.md`, HEAD `<sha>`, YYYY-MM-DD). Verify before trusting. |

## Decisions
| Doc | Read it when… |
|---|---|
| `DECISION-<question>.md` | before proposing a change to <the settled thing> — the question is closed, don't re-litigate |

## Runbooks
| Doc | Read it when… |
|---|---|
| `RUNBOOK-deployment.md` | before deploying |

## Overview
| Doc | Read it when… |
|---|---|
| `overview/docs-structure-convention.md` | before creating or moving any doc |

<!-- Every KB subdir gets its own README trigger table. New doc → add a row here (or in the
     subdir's README) with a "read it when…" line, plus applies-to/last-verified frontmatter in the
     doc itself. Naming: SPEC-/PRD-/STRATEGY-/RUNBOOK-/DECISION- prefix, kebab-case, no spaces. -->
