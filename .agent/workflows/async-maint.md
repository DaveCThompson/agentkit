---
description: Run non-blocking maintenance jobs (deps, bundle, git, a11y) that emit timestamped health reports.
gemini: false
---

# Async Maintenance Workflow

Run asynchronous maintenance jobs that generate health reports without blocking development.
Ops-internal — not part of the curated interactive command set.

## Core pattern: timestamped artifacts
Every job writes a unique, dated file so runs never collide:
```
docs/working/REVIEW-{JOB}-{YYYY-MM-DD}.md
```
Benefits: zero merge conflicts, historical tracking, easy diffing, and simple age-based cleanup.

## Job catalog (adapt commands to the project's runner)
| Job | Frequency | Output | Purpose |
| :-- | :-- | :-- | :-- |
| Dependency audit | Weekly | `REVIEW-deps-YYYY-MM-DD.md` | Outdated packages + known CVEs |
| Bundle size | After build | `REVIEW-bundle-YYYY-MM-DD.json` | Bundle/chunk size tracking |
| Git history | Monthly | `REVIEW-git-analysis-YYYY-MM.md` | Churn, hotspots, contributors |
| Accessibility | On-demand | `REVIEW-a11y-YYYY-MM-DD.md` | Automated WCAG checks |
| Contrast | On-demand | `REVIEW-contrast-YYYY-MM-DD.md` | Contrast ratios vs WCAG AA/AAA |
| Report cleanup | Monthly | — | Archive stale reports to `docs/archive/` |

## Procedure
1. **Select** the job to run.
2. **Run** the project's corresponding maintenance command.
3. **Review** the generated report in `docs/working/`.
4. **Action**: Open `TICKET-*` items for critical findings; archive old reports periodically.

## CI schedule template (GitHub Actions)
```yaml
name: Async Maintenance
on:
  schedule:
    - cron: '0 2 * * 1'   # Weekly, Monday 02:00
  workflow_dispatch:
jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: <project maintenance command>          # emit REVIEW-*.md
      - uses: actions/upload-artifact@v4
        with: { name: maintenance-reports, path: docs/working/REVIEW-*.md }
```

## Best practices
- Always timestamp outputs; never overwrite existing reports.
- Artifact-only: these jobs generate files, never modify source.
- Reports must carry recommendations, not just data.
