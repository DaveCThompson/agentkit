---
trigger: model-decision
description: Consult when adding or organizing static content media — image processing workflow, content layout conventions, metadata standards, video workflow.
tier: tech:web
domain: performance
---

# Asset Pipeline & Content-Media Conventions

Rules for managing high-fidelity assets and rich content-media structures (case studies, longform
pages, galleries — whatever the project's content registry calls them).

## Image Processing Workflow

1. **Source**: Accept high-res PNG/JPG in `apps/<app>/public/`.
2. **Convert**: Use the project's webp-conversion script (`convert:webp` by convention, or `node scripts/webp.mjs`) with 80% quality.
3. **Verify**: Run `sharp` metadata check to get exact `width` and `height`.
4. **Migrate**: Move to the project's public content-asset path (e.g., `public/<content-area>/[slug]/`; use the project's `_locked/` path for private content).
5. **Register**: Update the content registry (e.g., `packages/content/src/<content-registry>/[slug].ts`) with exact metadata.

## Content Layout Conventions

### Aspect Ratios
- **Technical Splits**: Prefer 1:1 (square) or 4:3 for technical deep-dives to minimize vertical scroll drift.
- **Cinematic Full-Bleed**: Use 21:9 or 16:9 for high-impact mood boards.
- **Mobile Progressions**: Use `gallery` with `layout: 'strip'` and `width: 'full-bleed'`.

### Object-Fit Support
- Use `objectFit: 'contain'` for assets that must not be clipped (e.g., UI dashboards, technical diagrams).
- Use `objectFit: 'cover'` (default) for cinematic textures and mood boards.
- **CONSTRAINT**: Always set `fill={true}` in the rendering component if `objectFit` is used to ensure the Next.js `Image` component respects the container's aspect-ratio.

### Cache Busting
- During iterative design loops, use semantic versioning in filenames (e.g., `-v2.webp`) to bypass browser and dev server caches. 
- Finalize by renaming to the clean semantic name once the design is approved.

## Metadata Standards
- **Width/Height**: Always use the ACTUAL pixel dimensions from the WebP file in the `MediaRef` object. This prevents layout shift during hydration.
- **Alt Text**: Be descriptive. "Lens interpolation math" is better than "Image of a lens".

## Video Workflow

### Walkthrough video
- Treat substantive walkthrough video as a first-class content asset, not as an embedded afterthought.
- Always generate and register a real poster image alongside the video.
- Capture and store exact intrinsic dimensions for stable layout.
- Encode as H.264 MP4 using the ffmpeg command from the project's asset-management runbook (path in `project-invariants.md`) (profile main, CRF 20, 720p or 1080p).
- Store under `apps/<app>/public/<content-area>/{slug}/` (or `the private/_locked asset path ` for private/locked content).
- Register in content as `localVideo()` with `provider: 'local'`.
- Render playback video with native browser controls; custom controls require a separate accessibility review.

### Ambient loops
- Keep loops silent, short (3-5 seconds), and visually supportive rather than explanatory.
- Always verify a static poster or image fallback for reduced-motion mode.
- Avoid introducing loop assets that become LCP candidates on primary reading surfaces.
- Encode as H.264 MP4 at 720x720 (or smaller) using the ffmpeg command from the project's asset-management runbook (path in `project-invariants.md`) (profile baseline, CRF 23, target under 500 KB).
- Store under `apps/<app>/public/<content-area>/{slug}/` (or `the private/_locked asset path ` for private/locked content).
- Register in content as `localVideo()` with `provider: 'local'`.
- Test that the poster image is good on its own (will be shown when `prefers-reduced-motion` or `Save-Data` is on).

### Future migration: Cloudinary
- The `provider: 'cloudinary'` branch exists in `SiteVideo` and `SiteImage` as infrastructure for a future migration.
- Cloudinary is not currently in active use. Revisit when traffic exceeds ~1,000 visitors/month or walkthroughs consistently exceed 5 minutes.
- If/when migrating: use Cloudinary MCP for agent-assisted upload; register publicIds shaped as `<content-area>/{slug}/walkthrough/{name}` and `<content-area>/{slug}/loop/{name}`.
