---
name: best-practices
description: Authoring standards for kit assets — how a skill, rule, or workflow must be shaped to enter the canonical kit.
last-verified: 2026-07-03
---

# Authoring Best Practices

*Folded from `a predecessor kit/specs/best-practices.md` (Apr 2026), trimmed to what the compiled manifest
and adapters now enforce mechanically. Phase B refines this with the fleet's best observed patterns.*

## Skills (`.agent/skills/<name>/SKILL.md`)
- Folder name == frontmatter `name` (Antigravity lint enforces; kebab-case).
- Frontmatter superset: `name`, `description`, `tier`, `triggers`, `applies-to`, `required-tools`,
  `conflicts-with`, `orchestration`, `allowed-tools`. Adapters strip downward per vendor.
- `description` is the routing surface: state WHEN to use it, in trigger language ("Use when …"),
  not what it is. One skill, one job — if two descriptions could answer the same prompt, merge or
  sharpen (`conflicts-with` documents the loser).
- Body: When to Use · Approach/phases · Definition of Done. Supporting files in `references/`
  (never a `rules/` subfolder — that drift is normalized to `references/`).
- A skill that leans on an external tool MUST declare it in `required-tools` and include fallback
  instructions for when the tool is unreachable (`doctor` verifies callability).

## Rules (`.agent/rules/<prefix>-<name>.md`)
- Prefixes: `foundation-` (always-on invariants) · `tech-` (stack-conditional) · `pattern-`
  (code-shape conventions) · `project-` / `domain-` (overlay-owned; never in the kit).
- Activation frontmatter: `trigger: always | glob | model-decision` (+ `globs:` when glob).
- **`model-decision` rules MUST carry `description:`** in trigger language ("Consult when …") —
  on description-gated vendors the description IS the routing surface; a missing one degrades
  routing to the bare rule name (the Claude adapter warns).
- The Claude adapter maps the three triggers three ways: `always` → always-on `.claude/rules/`;
  `glob` → path-scoped `.claude/rules/` (`paths:`); `model-decision` → a **menu-hidden `rule-`
  prefixed skill** (`.claude/skills/rule-<name>/`) so only its 2-line description occupies context
  until the model invokes it. Other vendors fold rule text into AGENTS.md/GEMINI.md unchanged.
- State the constraint and the reason in the first three lines; examples after.
- **Concrete architecture doesn't travel — parameterize or keep it overlay.** A kit-shipped
  (`foundation-`/`tech-`/`pattern-`) rule MUST NOT name concrete file paths, env systems
  (`import.meta.env`, a specific `/api/*` edge-proxy route), or single-framework idioms *as if
  universal* — a Vite-specific rule shipped into a Next.js repo makes agents write wrong code
  (observed: a `domain-openrouter` rule describing a Vite app, none of which existed in the target
  Next.js repo). Either **parameterize** with placeholders (`apps/<app>/`, `<source-roots>` — the
  `pattern-assets.md` style), or **classify it overlay-only** (`project-`/`domain-`, per
  `overlay-contract.md`). Overlay is the default for anything that can't be honestly generalized.
- **Manually copied overlay files carry provenance.** A `domain-*`/`project-*` file that was hand-copied
  (vendored) from another repo rather than authored in place MUST carry a "vendored from <repo>,
  reference-only" banner at the top — otherwise its origin and staleness are invisible and it gets
  mistaken for native, first-class content.

## Workflows (`.agent/workflows/<name>.md`)
- Low-logic routers that SEQUENCE skills — inputs required, decision points, exit criteria.
  A workflow that restates one skill is a defect: make it a command mapping only (1:1 workflow →
  command; never also a passthrough skill competing for routing).
- Frontmatter: `description` (used by Gemini command TOML + Claude command); `gemini: false` to
  keep it out of the curated Gemini set; `model:` (optional) pins a cheaper model for genuinely
  mechanical workflows (Claude passes aliases through; opencode drops non-`provider/model` forms).
- `skill: <name>` (or `skill: [a, b]`) declares the workflow's 1:1 implementation skill(s). On
  vendors whose slash menu would list both surfaces (Claude), the adapter hides the paired skill
  from user invocation (`user-invocable: false`) while keeping it model-invocable — `/wrap` then
  shows only the command. A dangling name is a sync warning, not an error.

## Universal
- Every asset add cites ≥1 concrete project need + an evidence tier (T1 measured / T2 observed /
  T3 judgment) **+ provenance (producer tier · model)**. Pure hypothesis lives in a project overlay
  or nowhere. Junior-tier-produced claims enter the feedback pool as `candidate`s; codification
  requires senior/staff re-verification (`pattern-agent-orchestration.md` §1 codification gate).
- No new folder or nesting level without proving a flat prefixed file can't do the job.
- Every artifact/report ends with **"What we deliberately did NOT do"**.
