---
trigger: model-decision
description: Consult when adding or organizing static content media — image processing workflow, content layout conventions, metadata standards, video workflow.
tier: tech:web
domain: performance
---

# Asset Pipeline & Content-Media Conventions

Preserve media fidelity, privacy and stable rendering through the project's actual asset pipeline.
Use existing scripts, storage and registries after inspecting them; a placeholder path or familiar
provider is not evidence that a tool, schema or access boundary exists.

## Image Processing Workflow

1. Accept source media in the authorized source store. Inspect sensitivity and metadata before
   placing anything in a publicly served directory. Preserve originals where required.
2. Choose format, dimensions and quality for content, transparency, browser support and measured
   transfer/decode cost. WebP at quality 80 is a trial setting, not a universal conversion rule.
   Use the actual installed conversion tool/script; do not invent `convert:webp` or install one.
3. Inspect output metadata with an available tool, such as Sharp when installed. Confirm dimensions,
   orientation and color handling; inspect fine text, diagrams and compression artifacts.
4. Move/register only within authorized ownership, preserving callers and originals as required.
   A directory named `_locked` inside public assets is not access control. Private media needs
   enforced delivery permissions and an appropriate cache policy.
5. Update the real registry/schema with exact output metadata and references. Paths such as
   `public/<content-area>/<slug>/` are illustrative, not required architecture.

## Content Layout Conventions

### Aspect Ratios

Choose ratios from content and placement. Square/4:3 technical panels and 16:9/21:9 cinematic
panels are useful options; do not crop important detail to meet them. Strips/full-bleed galleries
need an actual supported registry/layout API and narrow-screen checks.

### Object-Fit Support

Use `contain` when the full image must remain visible and `cover` when cropping is intentional.
Size the box and inspect its crop/focal point. Next.js `Image` can use CSS object-fit with intrinsic
dimensions; `fill` is not universally required. If using `fill`, provide a correctly positioned,
sized parent and appropriate `sizes`. Follow the installed version's
[Image contract](https://nextjs.org/docs/app/api-reference/components/image).

### Cache Busting

Prefer the build/CDN's content-hash or versioning contract. During iteration, a versioned filename
can disambiguate outputs; update all references. Renaming to an old “clean” URL can revive stale
cached content. Preserve deployed URLs or use an authorized cache/version migration.

## Metadata Standards

- Record actual intrinsic dimensions or the equivalent aspect-ratio contract and reserve the
  rendered space. Correct metadata helps avoid shifts but cannot guarantee all layout stability.
- Write alternatives for the image's purpose. Decorative images may need empty alt text; diagrams
  may need an adjacent explanation. Do not force a descriptive phrase onto every asset.
- Preserve meaningful licensing/provenance and remove sensitive metadata when required.

## Video Workflow

### Walkthrough video

- Treat substantive video as content with accurate dimensions, a useful poster and applicable
  captions/transcript/audio-description alternatives.
- Use the existing encoder/runbook after checking its actual flags and output. H.264 MP4 is a
  common delivery option; profile, CRF and resolution depend on text legibility, bandwidth and
  target decoders. Compare the encoded output, not only the exit code.
- Store/register through the actual schema. `localVideo()` and `provider: 'local'` are possible
  project APIs, not universal ones. Enforce private delivery outside public paths.
- Prefer native controls when suitable. Custom controls need equivalent keyboard, naming, focus,
  captions and playback access.

### Ambient loops

- Keep decorative loops unobtrusive and sized for their role. Duration/resolution/file budgets
  come from the project and measurement, not fixed 3–5s/500KB limits.
- Supply a useful still fallback and select it explicitly for reduced motion or data-saving
  behavior when applicable; those preferences do not automatically switch a video to its poster.
- Check autoplay rejection, loading failure, pause/stop/hide requirements and whether the asset
  delays primary content or becomes an expensive LCP candidate.
- Verify the chosen codec/output at actual sizes and in supported browsers, including a static
  poster-only path that remains useful.

### Future migration: Cloudinary

Evaluate a provider migration only when the current project's delivery, transformation, cost or
operational needs warrant it. Do not assume `SiteVideo`/`SiteImage` already support Cloudinary
or prescribe visitor/duration thresholds. If a migration is authorized, verify real SDK/API/schema
support, access control, identifiers, URLs and rollback. Uploading private media or enabling a new
integration requires the existing action/target grant; tool availability does not provide it.
