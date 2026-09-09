---
applies-to:
  - "docs/working/PLAN-writing-style-system.md"
  - ".agent/skills/manage-writing-style/**"
  - ".agent/skills/write-in-style/**"
  - ".agent/rules/pattern-writing-quality.md"
last-verified: 2026-08-30
---

# Research update: deterministic stylometric profiling and local writing-style systems

**Status:** Current
**Produced:** 2026-08-30
**Origin:** ChatGPT research sample, with decision-changing claims independently rechecked in-session
**Related plan:** [PLAN-writing-style-system.md](../docs/working/PLAN-writing-style-system.md)
**Supersedes in part:** [RESEARCH-2026-08-30-writing-style-system.md](RESEARCH-2026-08-30-writing-style-system.md)

This update addresses the newly supplied stylometric report. The raw report remains unmodified in the
research inbox. Its opaque export citations and future-dated access labels are not treated as
verification. Only the sources linked below were used for promoted claims, fetched 2026-08-30.

## Promoted findings

### 1. Attribution performance is not stable personal voice

**Claim:** Stylometric methods can show useful authorship discrimination without proving that a
measured trait is a genre-independent writing preference.

**Evidence:** 📄 [Eder, *Does Size Matter?*](https://dh2010.cch.kcl.ac.uk/academic-programme/abstracts/papers/html/ab-744.html)
reports that the acceptable sample size depends on language, genre, and text; its English-novel
experiment found samples below 5,000 words noisy, with other corpora reaching critical points between
5,000 and 10,000 words. It also reports that contiguous passages performed worse than distributed
word samples in the tested attribution settings.

**Consequence:** The profile is an evidence-labelled collection of observations, not an author
fingerprint. It records document coverage, genre labels when supplied, and leave-one-document-out
stability. A feature may be diagnostic without becoming a drafting instruction.

### 2. Corpus-size and sparsity cutoffs are product policies

**Claim:** The reviewed evidence does not justify a universal minimum corpus size, occurrence floor,
or leave-one-document-out percentage for every feature and genre.

**Evidence:** 📄 Eder's results vary by corpus and method setting. They establish a warning about
small-sample instability, not a universal threshold for a local one-author profile. The specific
policy values in the architecture are therefore ⚠ engineering defaults, not published constants.

**Consequence:** Version one may use transparent defaults: mark profiles below 5,000 words as limited,
require recurrence across at least three documents before a scalar observation becomes actionable,
and flag leave-one-document-out changes above 25% of the full estimate. Preserve the observation and
provenance even when the actionable instruction is suppressed. Store these policies in versioned
configuration so local validation can change them without changing the profile schema.

### 3. Profile-plus-exemplar superiority remains an open experiment

**Claim:** Current evidence does not establish that a static written profile plus exemplars is better
than either alone, nor that exemplars necessarily increase phrase leakage in this product.

**Evidence:** 📄 [Wang et al., *Catch Me If You Can? Not Yet*](https://arxiv.org/abs/2509.14543)
evaluates exemplar-based personalization across more than 400 authors and several domains, using
multiple style and authorship measures; its abstract reports stronger results for structured domains
than informal blogs and forums. It does not provide the requested four-arm comparison. 📄
[Cho et al., *Tuning-Free Personalized Alignment via Trial-Error-Explain In-Context Learning*](https://aclanthology.org/2025.findings-naacl.326/)
reports a different iterative method using generated negative examples and explanations, not a
static profile-plus-exemplar treatment.

**Consequence:** Keep approved exemplars, but treat them as a controlled input whose value and leakage
must be measured. Add an exploratory four-arm comparison—baseline, profile only, exemplars only,
profile plus exemplars—with semantic preservation, voice judgment, originality, and task success
reported separately. Do not encode a universal exemplar size or a fixed superiority claim.

### 4. Originality screening should expose spans for review

**Claim:** No universal overlap percentage or n-gram length is a defensible automatic plagiarism or
copyright decision for mixed website, help, report, and UI prose.

**Evidence:** ⚠ The supplied report's discussion is consistent with the existing research direction,
but its exact operational thresholds were not independently promoted here.

**Consequence:** Use deterministic exact-token indexing and longest-span reporting as a v1 diagnostic.
Show source locations, preserve boilerplate/product-name context, and require human review. Any
8-gram, 16-token, or other alert value remains a configurable project review heuristic, never a legal
or universal originality threshold and never an automatic deletion decision.

### 5. Specialist descriptions need semantic boundaries and abstention tests

**Claim:** A specialist description must state its action and scope independently of its name, and
the evaluation must include a genuine none-of-the-above case. Exact word count, verb-first framing,
and mandatory negative clauses remain local hypotheses.

**Evidence:** ⚠ This update retains the prior promoted routing evidence; the new report's cited
function-calling claims were not needed to alter that contract.

**Consequence:** Keep descriptions concise and functional, but test description variants rather than
freezing a research-derived word-count rule. Measure per-specialist precision, recall, false-positive
rate, and none-class recall with randomized candidate order.

## Required architecture changes

- Add `evidence_status`, per-document prevalence, per-genre coverage, and leave-one-document-out
  ranges to generated diagnostics.
- Keep `style.md` qualitative and human-reviewed; it must not receive an observation merely because a
  feature is measurable.
- Make all corpus, sparsity, and stability cutoffs explicit configuration with provenance and version.
- Keep exact phrase overlap reviewable and reversible; no universal auto-fail rule.
- Add the four-arm comparison to bounded validation, without making it a release claim.

## Open verification items

- Validate the 5,000-word, three-document, and 25% defaults on consenting local corpora before making
  them hard gates.
- Measure within-author cross-genre transportability, not only author-attribution accuracy.
- Calibrate exact-span review alerts against legitimate boilerplate and product terminology.
- Run the four-arm comparison with held-out content and independent semantic/voice/originality lanes.

## What we deliberately did NOT do

- We did not promote the raw ChatGPT report itself into a contract or alter its body.
- We did not treat Eder's attribution sample sizes as universal style-profile guarantees.
- We did not adopt fixed exemplar chunk sizes, a composite style score, or a universal overlap threshold.
- We did not claim that static profiles, exemplars, or their combination is superior without the missing
  controlled comparison.
