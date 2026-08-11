# raw-research/ — external evidence & vendor-doc corpora

Reusable research inputs and raw vendor documentation. Peer of the knowledge-base, **not** part of
it. This tree is `.ignore`-excluded from default agent search — reach it on demand with
`rg --no-ignore <pattern> docs/raw-research`. **Beware the silent failure mode:** an excluded
tree's "no matches" is byte-identical to "searched, nothing there" — any verification sweep that
should cover this tree MUST use `--no-ignore`, or it reports consistency for a tree it never read
(`governance/docs-standard.md` §f).

**Evidence only, never contracts.** Nothing here is authoritative project truth. A durable fact
distilled from this material must be promoted (with its own verification) before anything relies on
it — cite the promoted doc, not this corpus.

> **Epistemic caveat:** a doc here without a ⚠ drift marker was **not** necessarily verified. These
> are third-party / point-in-time inputs; absence of the marker is not a freshness or accuracy signal.

## Three tiers, in order of ceremony

Canonical spec: [`governance/docs-standard.md`](../../governance/docs-standard.md) §(f).
The **`research-curate`** skill walks a file between them.

| Tier | Where | Naming | What it costs you |
| :--- | :--- | :--- | :--- |
| **1. Drop** | `inbox/` | **none** — any filename | nothing |
| **2. Curate** | here | `<TYPE>-YYYY-MM-DD-<kebab-topic>.md` + provenance header | one rename, one header |
| **3. Promote** | `governance/` (this repo's KB-equivalent) | the governing doc itself | verification + a home in a real contract |

Tier 1 is the point: capturing a source must cost nothing, or sources stop being captured.
**Nothing may cite `inbox/`.** Only tier 3 may be cited by a contract.

> **Note — this repo's tier 3 is `governance/`, not `docs/knowledge-base/research/`.** `agentkit` is
> a documented layout outlier (§i): its durable truth lives in `governance/`. Every other repo in the
> fleet promotes into `docs/knowledge-base/research/RESEARCH-YYYY-MM-DD-<topic>.md` with per-claim
> ✅/📄/⚠ markers.

**TYPE** is the one distinction that changes how far you trust a file — *did we write it?*

| TYPE | Means | Body editable after filing |
| :--- | :--- | :--- |
| `SOURCE-` | Externally authored — vendor doc copy, hosted research export, collaborator notes | **No.** Provenance header only. |
| `ANALYSIS-` | Our own synthesis, not yet promoted | Yes |
| `PROMPT-` | A research request, dispatched or not | Until dispatched |

A topic gets its own **folder** once it has a *second* source — the folder's `README.md` is then the
index, and a mirrored vendor corpus keeps its upstream filenames (renaming a mirror breaks its
correspondence with the source, which is the whole value of a mirror).

## Contents

### Curated evidence

Curated evidence files may be added here by a consuming project. Keep filenames self-describing,
include provenance headers, and promote only verified durable facts into the appropriate contract.

### Topic folders — vendor-doc corpora (`SOURCE-` material, upstream names preserved)

Consuming projects may add topic folders here for raw vendor documentation. Keep each corpus
self-contained with provenance and an index; do not assume a corpus is present in this kit repo.

### Drop zone

| | |
|---|---|
| `inbox/` | Uncurated drops. No rules, no index, **never cited.** |

---

**Renamed 2026-07-25: `docs/research/` → `docs/raw-research/`.** The old name collided with
`docs/knowledge-base/research/` in consuming repos — two stores with **opposite citation rules**
under near-identical paths. The three flat docs also lost their `RESEARCH-` prefix, which the
grammar now reserves for the promoted tier-3 ledger; they are `ANALYSIS-` (our own synthesis) and
gained produced-dates and provenance headers. `docs/research/` stays recognised for repos that have
not migrated.
