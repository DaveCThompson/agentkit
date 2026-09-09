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
- Assume a capable recipient. Keep non-obvious methods, consequential constraints and useful
  completion criteria. Do not mandate counts of options, questions, findings or personas without
  a task-specific reason. Preserve exact formats when they define the requested capability.
- Shared rules own authority/evidence/artifact contracts; workflows route; skills own distinctive
  methods. Reference the shared owner rather than copying its recipe. Keep a short local reminder
  when it prevents a wrong action. Direct invocation must not depend on hidden parent context.
- Add supporting files only for substantial conditional detail, with an explicit read condition.
  Read selected instruction files fully. Do not split solely to meet a length target or add empty
  resource folders. Preserve useful specialist evidence instead of replacing it with generic checks.
- Preserve user intent, settled choices and existing grants. Advice, diagnosis, preparation,
  implementation, integration and publication have different endpoints. No template grants authority.
- Consolidate entry points only when intent, authority, inputs, method and completion coincide;
  inspect callers and generated routing first. Similar text or presumed low usage is not enough.
- Declare fixed, registered dependencies in `required-tools`; describe conditional use and fallback
  in the body. Use the dependency semantics below for native or runtime-selected capabilities.

### Dependencies and capability evidence

`required-tools` lists identifiers resolved through `integrations/<id>.md`, not arbitrary executable
names or host tool IDs. It records a skill's known integration dependencies, including conditional
ones. It does not enable a tool, select an execution mode, grant authority or prove availability.
Use these existing surfaces; do not invent a parallel capability registry or new frontmatter keys.

| Dependency | Declaration and task check |
| --- | --- |
| Fixed registered tool | Declare its integration ID, such as `codebase-mcp`, `fallow`, `agentkit` or `tailscale`. State the needed capability and fallback. |
| Registered tool used only in one mode | Still declare the ID. Name the applicable mode in the body, such as Fallow for sweep's code scope. Missing tooling limits that mode's evidence, not unrelated work. |
| Native host capability | Describe the needed search/fetch, shell, browser or interaction capability, current-runtime discovery and fallback in prose. Do not invent `web` or vendor API IDs for this registry. |
| Runtime-selected service | Describe how to select the actual MCP server, endpoint, identity and schema. Declare fixed registered dependencies if any; an empty or omitted list does not mean operational proof needs no tools. |

For example, `research-deep` discovers host retrieval and can use supplied evidence with stated
limits. `mcp-server-ops` discovers the deployment being examined; there is no universal server ID.
`health-agent` and `kit-contribute` use the registered agentkit CLI, with current-source fallback
when shipped-state comparison is unavailable. A composed consumer uses the dependency owner's
method; it need not copy every transitive probe or setup recipe.

The current CLI compiles skill declarations into manifest `requiredTools`. `doctor` instead probes
the selected fleet members' `.agentkit.json` `tools` lists; it does not derive those lists from skill
frontmatter or infer conditional modes. Outside quick mode it resolves each integration and executes
its `check-command` in each declaring project's directory through the platform shell, with a
20-second timeout. The command string has no kit-root placeholder expansion. Missing registry entries
fail; entries without a probe have unknown status; `--quick` skips these probes. Doctor also writes
its local run record, so it is not a pure read-only capability query.

An integration owns its capability reference, version-sensitive syntax, setup effects and a cheap
non-installing, non-mutating probe valid under that execution contract. A CLI-only integration does
not need an `mcp` block. A version/help exit establishes only that command's success in that context;
it does not establish live agent access, authentication, index freshness, analysis coverage, binary
provenance or successful service operation. Check the relevant live capability when the task needs
it, using the actual runtime's catalog/schema. Never infer parent/worker inheritance or absence.

Record unavailable, failed, stale, empty and non-applicable evidence distinctly. Follow the existing
action/target and ownership grant for discovery or provisioning. Necessary setup already covered by
that grant may proceed through its owner; a declaration or failed probe alone never authorizes
installation, registration, configuration, indexing, cleanup or broader access. Otherwise use the
documented fallback and identify which conclusion or transition remains unverified.

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
- Name the evidence kind as well as any tier: measured result, observed instruction text, observed
  runtime behavior, or engineering judgment. Textual contradiction is not a measured model failure.
- For material behavior changes, use realistic isolated forward tests when authorized. Give the
  evaluator raw tasks/artifacts and candidate instructions, not the author's expected answer. Judge
  actions, outcomes and preserved obligations; static metadata tests alone cannot prove judgment.
