# Knowledge Base — trigger index

Durable project truth. This index is the KB's **routing surface**: each row says *when to read* a
doc, not just its title. Read the relevant governing matches fully. Zero matches is valid; missing
routing coverage needs a bounded source/document fallback, not an invented citation quota.
`agentkit check --kb <paths>` matches the files you're touching against each doc's `applies-to` globs.

Canonical spec: the resolved kit checkout's `governance/docs-standard.md` §(c),(d).

> **⚠ = known drift.** A ⚠ row cites commit provenance and what to distrust. **Docs without a ⚠ were
> not necessarily verified** — absence of a marker is not a guarantee of accuracy.

## Specs & contracts

| Doc | Read it when… |
|---|---|

## Decisions

| Doc | Read it when… |
|---|---|

## Runbooks

| Doc | Read it when… |
|---|---|

## Overview

| Doc | Read it when… |
|---|---|
| `.agent/rules/pattern-docs-artifacts.md` (project-root path) | before creating or moving docs; do not duplicate the synced convention |

<!-- Every KB subdir gets its own README trigger table. New doc → add a row here (or in the
     subdir's README) with a "read it when…" line, plus applies-to/last-verified frontmatter in the
     doc itself. Naming: SPEC-/STRATEGY-/RUNBOOK-/DECISION- prefix, kebab-case, no spaces.
     PRD- belongs to working lifecycle storage, not whole-document KB promotion. -->

Add rows only for existing documents. Use the KB declared by `docs.kbRoot` when it differs from
the default location. A newly scaffolded project may have no durable documents yet.
