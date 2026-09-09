---
trigger: model-decision
description: Consult when drafting or reviewing website content, technical help, reports, or content-heavy UI prose where audience, structure, voice, or specificity matters.
tier: core
domain: writing
---

# Writing quality

Shape the prose around the reader's job and the available evidence. Generic fluency is not a quality
standard: useful writing is specific, accurate, and recognizably suited to its audience and format.

## Reader and evidence contract

- Identify the audience, task, expected outcome, channel, and constraints before drafting.
- Establish claims, attribution, sequence, evidence, limits and any requested action before choosing
  sentences. A short edit does not require a separate brief or ledger artifact.
- Use concrete nouns, active verbs, examples, and observable claims. Do not inflate stakes or certainty.
- Keep facts, interpretation, recommendation, and speculation distinct. Mark uncertainty when it changes
  the reader's decision.
- Treat reference prose as evidence of choices, not a phrase bank. Preserve meaning without copying
  distinctive wording or forcing one template across the document.
- A named project-local style may guide qualitative voice, stance, rhythm, and specificity. It cannot
  override the user's brief, source facts, semantic qualifiers, evidence, format, accessibility/UI,
  rights, safety, or higher-priority instructions. Generated style diagnostics are advisory.

## Anti-homogenization pass

- Start with the useful subject, answer, finding, or action. Remove announce-then-answer preambles,
  structural counting, meta-commentary, and reasoning residue.
- Look for stock openings, ornamental synonyms, generic transition stacks, inflated framing, repeated
  sentence frames, habitual em dashes, and one-sentence paragraphs that have no clear purpose.
- Replace mannerisms with facts, examples, or a clearer sentence. Do not make random lexical changes just
  to appear less generated.
- Vary sentence openings, lengths, paragraph shapes, and punctuation when the meaning supports it. Do
  not ban a grammatical form or optimize for diversity as a score.
- Use negative constraints sparingly and locally. Name the failure being prevented, then specify the
  positive behavior that replaces it. A universal banned-word list is not a voice guide.

## Format fit

- Website content: connect a real reader problem to a specific promise, proof, and next action.
- Technical help: state the outcome, prerequisites, steps, expected result, and recovery path. Keep one
  action per step.
- UI copy: apply `pattern-ui-copy.md` in the real interface context. Prioritize action, state,
  consequence, accessibility, and stable terminology.
- Reports: lead with the finding, then give evidence, interpretation, limits, and recommendation. Do not
  present an inference as an observation.

## Review

Check the final text for task completion, semantic preservation, factual support, reader effort,
accessibility, consistent terminology, and natural cadence when read aloud. Treat lexical-diversity
metrics as diagnostic evidence only; they cannot replace human judgment about usefulness, correctness,
or voice.

Model decoding controls, style embeddings, retrieval pipelines, and fine-tuning methods may be useful
engineering hypotheses. They are not writing standards and must not be recommended as defaults without
evidence that the target runtime supports them and that they improve the reader's outcome.

## What we deliberately did NOT do

- We did not create a universal blacklist of words or punctuation.
- We did not require artificial novelty, fixed sentence-length targets, or a style imitation template.
- We did not treat an "AI detector" score or lexical-diversity score as a quality verdict.
- We did not turn unverified claims about sampling, retrieval, or fine-tuning into project requirements.
