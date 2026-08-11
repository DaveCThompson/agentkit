---
trigger: model-decision
description: Consult before scaffolding a new wizard/lab/dashboard-shaped surface or converging duplicated clones — clone-to-create, shared-kernel dependency direction, when to parameterize (3+ clones).
tier: kind:app
domain: code-quality
---

# Feature Scaffolding Patterns

Start new repeated-shape surfaces (wizards, labs, dashboards) by cloning a proven sibling rather
than rebuilding the scaffold — build-from-scratch attempts drift from the established structure and
produce inconsistency. Then converge duplicated code deliberately, never fossilize it.

> **Related Knowledge Base:** docs/knowledge-base/SPEC-feature-scaffolding.md (shared-kernel inventory, convergence roadmap).

## 1. Clone to Create
- New wizard-shaped or lab-shaped surfaces MUST start by cloning a proven existing surface (one with
  declarative field/phase config, generic rendering, and responsive behavior already solved).
- Preserve the existing DNA — gesture, phase rail, footer, scroll, and CSS Module patterns — unless
  a spec explicitly says otherwise.
- **In-repo clone vs external reference:** this rule covers cloning a proven *sibling in this repo*.
  Extracting the *semantics* of an **external** reference (a library, another repo, another language)
  and reimplementing it natively is a different job — use the `reference-hunt` skill, not a clone.

## 2. Shared Kernel Boundary
- Shared behavior lives in a dedicated core module (e.g. `features/<domain>-core/`).
- **Dependency direction is one-way:** domain features may import the core; core modules must never
  import a domain slice. A kernel that grows domain-specific branches is a defect.

## 3. Converge After Creation
- Once a cloned surface stabilizes, low-divergence repeated files MAY be promoted into shared,
  parameterized components — but only when the adapter seam is explicit, behavior is unchanged, and
  tests cover every consuming domain.
- **Parameterize only shapes proven across ≥3 clones.** Fewer than three is not yet a pattern.
- Trajectory is incremental convergence toward a typed config/props seam. Big-bang rewrites are
  ruled out — do one sibling group per session.
- **Eject hatch:** a surface that genuinely must diverge on a promoted piece copies the kernel file
  back into its own slice and owns it. The kernel is never edited to accommodate one consumer.
- "Clone to create" is not a license to keep byte-identical code duplicated forever.

## 4. Divergence Is Sometimes Correct
A surface whose lineage predates the convergence pattern, or that carries genuinely unique domain
concerns, should remain deliberately divergent — record why in the shared-kernel inventory doc, not
as special-case branches inside the kernel.

## Verification
- [ ] New wizard/lab plans name the clone source.
- [ ] Shared extractions keep the core's dependency direction clean (no domain imports in core).
- [ ] Mechanical convergence includes tests for every consuming surface.
- [ ] Promotions update the shared-kernel inventory doc.
- [ ] No kernel file contains consumer-specific branches (use the eject hatch instead).
