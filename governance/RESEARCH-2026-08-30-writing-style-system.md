---
applies-to:
  - "adapters.mjs"
  - "governance/vendor-capability-matrix.md"
  - ".agent/skills/write-content/**"
  - ".agent/rules/pattern-writing-quality.md"
last-verified: 2026-08-30
---

# Research: portable writing-style profiles and invocation

**Status:** Current
**Produced:** 2026-08-30
**Origin:** Primary architecture synthesis with two completed Luna research passes and direct
re-verification of cited sources
**Related plan:** [PLAN-writing-style-system.md](../docs/working/PLAN-writing-style-system.md)

This ledger promotes only claims that were rechecked against primary sources or the current repository.
The three raw research reports remain in the evidence inbox as provenance and candidate detail; this
document is the contract-facing synthesis.

## Promoted findings

### 1. Sample governance must separate permission concepts

**Claim:** A reusable writing profile needs separate authorship, rights basis, purpose, provenance,
retention, and sharing fields. User possession of text does not establish authorship or permission to
reuse it.

**Evidence:** 📄 [GDPR Article 5](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
sets purpose limitation, data minimization, storage limitation, security, and accountability principles
where it applies. 📄 [NIST Privacy Framework FAQ](https://www.nist.gov/privacy-framework/frequently-asked-questions)
describes a jurisdiction-agnostic risk framework with review, sharing, alteration, deletion, retention,
and authorized-access capabilities. 📄 The [U.S. Copyright Office writing guidance](https://www.copyright.gov/engage/docs/literary_works.pdf)
states that fixed writing is generally protected and use of another person's writing may require
permission or an applicable exception.

**Consequence:** The source manifest uses `authorship`, `rights_basis`, `authorization_scope`,
`purpose`, `sharing`, and `retention`. Non-self or unknown authorship with unknown rights remains
excluded from the active profile. This is a conservative product control, not a global legal conclusion.

### 2. Exclusion is not deletion

**Claim:** A source excluded from future builds is not deleted. A future purge operation needs separate
confirmation, path safety, derived-artifact invalidation, and an explicit statement about what metadata
may remain.

**Evidence:** 📄 NIST's framework FAQ identifies deletion and retention as separate privacy capabilities.
📄 [ICO storage-limitation guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/?q=online+identifiers)
describes review, erasure/anonymization, and the difference between taking data offline and deleting it.

**Consequence:** `exclude-source` is manifest-only. `purge-source` is a distinct confirmation-gated
operation and makes no secure-erasure claim beyond host filesystem and retention policy behavior.

### 3. Project-local style data is portable; shared roots must be explicit

**Claim:** The safe v1 default is the current project's `.writing` root. A user may opt into a shared
root through an explicit absolute CLI or environment override, but no hidden home-directory fallback
should select a mutation target.

**Evidence:** ✅ The current repository separates authored `.agent` assets from project-owned overlay and
runtime data in [overlay-contract.md](overlay-contract.md), and its adapters generate vendor surfaces
from canonical sources. 📄 [XDG Base Directory 0.8](https://specifications.freedesktop.org/basedir/0.8/)
requires configured base-directory paths to be absolute and distinguishes user data, config, state,
cache, and runtime data. This convention is Unix-oriented and does not define Windows behavior.

**Consequence:** One resolver owns precedence: explicit `--root`, explicitly set
`AGENTKIT_WRITING_HOME`, then project `.writing`. It returns path plus scope, rejects relative and
symlink roots in v1, blocks roots inside instruction/vendor surfaces, and reports the selected scope
before mutation. The shared-root mode does not imply shared project-specific runs or evaluation cases.

### 4. Determinism has an explicit boundary

**Claim:** Raw/stored input identity, host-decoded text, normalized analysis text, segmentation
observations, and operational run identity must remain separate. Byte-identical derived artifacts can
be promised only for identical inputs, policies, compiler/schema versions, and runtime fingerprints.

**Evidence:** 📄 [Node internationalization support](https://nodejs.org/api/intl.html) documents ICU-backed
internationalization and multiple ICU data modes. 📄 [Unicode Normalization Forms](https://www.unicode.org/reports/tr15/)
defines canonical versus compatibility normalization and warns that compatibility normalization can
erase formatting distinctions. 📄 [Unicode Text Segmentation](https://unicode.org/reports/tr29/)
defines default boundaries while allowing script and implementation variation.

**Consequence:** File-backed attachments record original-byte fidelity; host-decoded chat captures do
not claim original bytes. NFC is an explicit analysis view; NFKC is not applied to prose by default.
The runtime fingerprint includes Node, V8, ICU, CLDR, Unicode, locale, and granularity where available.
`run_id` and timestamps are operational metadata; `run_fingerprint` identifies reproducible inputs.

### 5. Vendor discovery and explicit invocation are different contracts

**Claim:** Natural-language routing is empirical and vendor-specific. Descriptions support discovery;
explicit commands or native skill invocation provide user control. File presence or compilation alone
does not prove live discovery or model selection.

**Evidence:** 📄 [Claude Code skills](https://code.claude.com/docs/en/slash-commands) documents descriptions,
automatic selection, direct `/name` invocation, and distinct user/model invocation controls. 📄
[Gemini Agent Skills](https://geminicli.com/docs/cli/using-agent-skills/) documents workspace/user skill
discovery, `activate_skill`, and confirmation. 📄 [OpenCode skills](https://opencode.ai/docs/skills)
documents project/global skill discovery, `skill({ name })`, and permissions. 📄 [Antigravity skills](https://antigravity.google/docs/skills?app=antigravity-ide)
documents `.agents/skills` as default with `.agent/skills` compatibility. ✅ The current `claude()`,
`codex()`, `gemini()`, `opencode()`, and `antigravity()` adapter functions were inspected directly.

**Consequence:** The capability matrix must separate discovery, explicit invocation, activation mode,
precedence, permission, path aliases, and verification date. Gemini needs both generated skills and
explicit workflow commands. Antigravity validation recognizes both path forms. Adapter tests separate
compiled, discovered, and invoked states; natural-language results are recorded per vendor/version/model.

### 6. Quality evaluation needs separate lanes

**Claim:** A useful v1 evaluation should report routing, semantic preservation, voice judgment,
originality, and task success separately. It should use deterministic local checks where possible and
blinded human review for voice and unresolved meaning judgments. No universal weighted style score is
supported.

**Evidence:** 📄 [NIST Measure](https://airc.nist.gov/airmf-resources/playbook/measure/) recommends
purpose-specific measures, documented uncertainty, test sets, tools, and human/domain expertise. 📄
[SummEval](https://aclanthology.org/2021.tacl-1.24/) evaluates multiple human dimensions rather than
one automatic metric. 📄 [MQM terminology](https://www.w3.org/community/mqmcg/mqm-terminology/) defines
analytic error types, severity, and root cause. These sources support the evaluation structure, not a
writing-style scale or universal threshold.

**Consequence:** The architecture uses a versioned fixture set with expected asset, invocation mode,
semantic obligations, format constraints, vendor/version/model, and profile identifiers. Compile-time
surface tests, live invocation smoke tests, recorded natural-language routing, semantic obligation
checks, local overlap flags, blinded voice review, and task checklists remain distinct lanes.

## Open verification items

- Verify `.agents/skills` discovery against the exact Codex CLI version used by each consuming project;
  repository tests currently provide local evidence but do not establish every installed CLI contract.
- Run live smoke checks for Gemini skill confirmation, Antigravity mixed `.agent`/`.agents` behavior,
  and vendor-specific precedence.
- Calibrate the 40-case routing fixture and proposed 90% recall starting point against a local baseline;
  neither number is a research-derived universal standard.
- Decide whether shared-root profiles keep run history with the profile or keep runs project-local.
- Decide whether `purge-source` is in the first implementation slice or remains an explicit manual
  operator path.

## What we deliberately did NOT do

- We did not claim GDPR, U.S. copyright, NIST, XDG, or vendor documentation applies identically to
  every user, jurisdiction, operating system, or agent version.
- We did not treat model-generated research reports as verified evidence without rechecking their
  primary sources.
- We did not define a universal sample count, style score, copyright threshold, retention period, or
  natural-language routing guarantee.
- We did not add a hosted profile service, vector store, embedding dependency, or vendor-authored source
  fork.
