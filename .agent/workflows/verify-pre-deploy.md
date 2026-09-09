---
description: Assess release readiness on the exact candidate with applicable proof and explicit pending gates.
---

# Verify Pre-Deploy Workflow

Produce a release recommendation; invoking this check does not itself deploy. Resolve the exact
candidate, target environment and project release requirements. Use `foundation-testing.md` and
the project's verification profile for proof lanes and valid receipt reuse. Ask only for a missing
release decision that cannot be established from the accepted contract or project evidence.

## Applicable gates

- **Final-state gate:** run or cite the project's actual broad commands on the candidate being
  released. Do not invent lint, browser or server requirements for projects that do not have them.
- **Changed-risk checks:** carry security, performance, accessibility or data findings and their
  defect-specific proof. Use relevant audit skills when affected risk requires new coverage;
  a generic green suite does not discharge those obligations.
- **Data/migrations, when present:** check supported fresh-install and upgrade paths, ordering,
  compatibility, writes/constraints, effective privileges and recovery needs. Do not require
  every migration to be rerunnable or prescribe unsafe blanket SQL recipes.
- **Environment:** verify the relevant configuration and service boundaries without exposing
  secrets. Origins/CORS/CSP apply to relevant web surfaces, not every project.
- **Critical flows:** exercise the project's required manual or runtime flows through authorized,
  available capabilities. Preserve a genuinely human-only lane for its owner; do not demand
  duplicate human confirmation for already valid equivalent proof.

## Recommendation

For each required gate, report PASS, FAIL, PENDING or reasoned NOT APPLICABLE, its evidence and
candidate identity. Missing or malformed checks are not a clean pass. GO requires all blocking
obligations satisfied or an explicit authorized exception with its risk and owner.
Otherwise return NO-GO or PENDING with the next action; never present pending proof as release-ready.

Record the actual scope of the recommendation. A later candidate change invalidates affected
receipts; reconcile unknown deployment state before any separately authorized retry.
