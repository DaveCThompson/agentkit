---
trigger: model-decision
description: Consult before building or changing GSAP timelines, responsive CSS/scroll composition, text reveals or gated entry — property ownership, interruption, visible fallbacks and reduced motion.
tier: tech:gsap
domain: motion
---

# GSAP Motion Patterns

Preserve the intended endpoint, accessible content and ownership through playback, interruption
and teardown. Choose techniques from actual competing properties and lifecycle evidence;
a visual style or hook count is not a universal correctness rule.

Read the project's motion contract and installed GSAP/plugin/framework versions. The
`gsap-css-layout` skill owns complete conditional examples. Read its project-root path
`.agent/skills/gsap-css-layout/SKILL.md`, not a path relative to a generated rule's location.
For Motion/Framer Motion projects, also consult the applicable `tech-framer-motion.md` rule.

## 1. Hybrid Motion Architecture

Use GSAP where its timeline, text or scroll methods fit the installed stack and requested result.
Do not introduce a second library just because an effect is cinematic. Scope selectors to the
owned component/region, using `useGSAP`/context or explicit element references as applicable.
Separate style ownership from tool choice: different systems may safely control different properties.

## 2. CSS Variable Proxy (Critical for Dual-Driver Elements)

When drivers compete for the same style, compose independent inputs via CSS variables, separate
wrappers, or an explicit ownership handoff. Direct inline writes can override stylesheet expressions;
they are not forbidden when that property belongs to the current driver and cleanup is correct.

A progress variable can preserve responsive geometry as the container changes. It is value
composition, not a GPU guarantee: a variable consumed by width still changes layout.
For opacity/visibility proxies, verify the complete visible endpoint, skipped motion, interruption
and restoration of prior owned values. Do not clear all inline styles on a shared element.
See the skill's **Responsive geometry with a CSS variable proxy** and **Visibility proxy with a
complete lifecycle** examples, plus `foundation-performance.md`.

## 3. Text Reveal (SplitText)

Split only text whose DOM the animation owns. Use the installed
[SplitText API](https://gsap.com/docs/v3/Plugins/SplitText/) and preserve its accessibility support;
nested links or meaningful markup need additional inspection before splitting.

Masking is optional. When used, check descenders, accents, actual font metrics, line height, zoom
and line reflow; a fixed `0.12em` pad does not guarantee clearance. Choose mask wrappers/padding
from that measurement. Track and revert split DOM on teardown or resplitting, and rebuild dependent
animations when font/width changes affect the split. Removing a component is not proof every
plugin listener, wrapper or timeline was cleaned.

## 3a. Per-Target Parallelism with `parent.add(child, 0)`

When each target needs a multi-step sequence and the sequences should overlap, a child timeline
per target added at a shared parent position makes timing explicit. Explicitly positioned tweens
or a stagger can also express the contract. Unpositioned additions append at the timeline end;
looping over targets without positions can accidentally serialize their later steps.

Inspect the resulting start times/duration, including deliberate delays, repeats and overlap.
Before replacing a sequence, stop only the timeline/properties owned by that interaction.
Do not use a broad `killTweensOf` call to clear unrelated hover, scroll or animation drivers.
Keep local displaced/active trackers aligned with the actual terminal or cancelled state.
See [GSAP timeline positioning](https://gsap.com/docs/v3/GSAP/Timeline/add()/).

## 4. Orchestration

Choose easing and stagger from the project's motion language and reading order. Overshoot can
be intentional; check clipping, visual stability and user control. There is no mandatory easing
or per-item duration for every nav link or list.

Combine targets into one ordered group when they form one sequence; preserve logical order for
the language and layout. Use independent groups when their lifetimes or interaction differ.
Do not force a left-to-right order onto every writing direction.

## 5. FOUC Prevention + Gated Entry (Single Hook Rule)

Keep a gated hide and its reveal under one lifecycle owner. One `useGSAP` callback is a useful
implementation when they share dependencies; separate hooks are valid for independent properties
or lifetimes. Hook count alone cannot prove a flash or its absence.

Do not hide meaningful content while waiting indefinitely for a gate. Prefer visible defaults
and hide only once the reveal can run, or provide an explicit bounded failure/skip path.
A layout effect cannot hide server HTML retroactively after it has painted.

### CSS initial state + data-attribute override (SSR-safe pattern)

A CSS-hidden initial state is suitable only when the product needs it and delayed/failed JS,
closed gates and skipped motion have tested visibility fallbacks. A data-attribute override can
make completed state survive context restoration, but an attribute set only by JS does not solve
no-JS failure. Assign ownership of that attribute and restore/remove it deliberately on teardown.

### Client reveal wrappers: default-visible CSS + JS hide

Visible CSS defaults preserve content when startup never begins. Schedule any JS hide and reveal
together and handle errors after the hide. For ScrollTrigger gating, ensure users can still reach
the content if the trigger never activates. Reuse an existing reveal primitive when its lifecycle
fits; no universal `HeroReveal` or `GSAPReveal` component exists.

## 9. Page Entry Choreography (Three-Beat Rule)

Header → hero → body is an optional product choreography. Preserve it where specified, including
its readiness signals, without imposing fixed timings/components on every page. Essential content
must not be permanently hidden behind a missing header-complete signal.

A wrapper may collapse grid/flex children into one item; preserve the intended inner layout and
spacing through the project's styling system. Choose per-row, per-column or continuous stagger
from the actual visual order and scroll exposure. A modulo-column formula is useful for a repeated
row pattern, not a universal grid rule; recompute for responsive column counts.

## 6. `revertOnUpdate: true` for Reactive Dependencies

When a dependency change replaces a `useGSAP` animation, `revertOnUpdate: true` provides teardown
before rebuilding. If the owner deliberately updates one persistent timeline, use that lifecycle
instead. Track responsive and reduced-motion changes; preferences can change after hydration.

Check the installed [GSAP React lifecycle contract](https://gsap.com/resources/React/).
Verify Strict Mode setup/cleanup, dependency replacement, interruption and remount; do not promise
flash-free rendering solely from the option or an implementation-detail version claim.

## 6a. Killing Timelines Created Outside `useGSAP`

Late callbacks/event handlers need `contextSafe` where appropriate or explicit tracking/cleanup.
Remove owned listeners and timers as well as animations. Prevent completion callbacks from
rearming loops or updating an inactive controller after teardown.

If using an active/unmounted flag, initialize it on each setup as well as marking it inactive
on cleanup so development setup-cleanup-setup remains valid. Killing a tween does not automatically
apply the desired final visibility or mean successful completion; handle cancellation separately.

## 7. Single Animation Owner Per DOM Region

Assign ownership by element, property and lifetime. A subtree may have multiple coordinated
owners on independent properties or wrappers. Competing writers need composition or a handoff,
not an assertion that every overlap is a visual defect. Preserve live scroll styles when an intro
finishes and inspect parent/child transform or opacity composition when effects combine.

## 8. PagePresence + GSAP Coexistence (Updated)

Discover the actual route wrapper, mount/key policy and animation owners. A CSS class transition,
retained route tree or deliberate remount can all be valid designs. Remounting resets component
state and timelines; preserve or rebuild them according to the requested navigation contract.
Do not assume a component named `PagePresence` is inert, or prohibit `AnimatePresence` globally.

## 7. Grid Safety with GSAP

When hiding a grid child changes auto-placement, explicit columns can preserve a required logo
or control position. Apply them where the design requires fixed tracks, not automatically to
every child. Inspect min-content, gaps, padding and responsive track definitions.
A progress-linked gap can help a container that starts narrower than its gutters; compare actual
geometry before adding that coupling.

## 8. Cinematic Accessibility

Provide a static/reduced-motion alternative that keeps meaningful content and usable controls.
On a mid-animation preference change, reach the intended visible state and settle required
readiness without restarting loops. Test pause/stop/hide and flashing criteria where applicable.

Use `foundation-accessibility.md` for contrast criteria/levels/exceptions and keyboard behavior.
Glass opacity and a particular fade duration are project design choices. On dismissal or item
replacement, preserve focus by identity and move it to a logical available control when necessary;
do not always force focus to a container.

## 10. Typing and Content Rotation

Choose the text method by required deletion/replacement behavior. If TextPlugin's matching does
not produce the intended order, use a numerical proxy over grapheme clusters as the skill shows.
Do not use UTF-16 substring steps as a universal character model. Own only a dedicated text node
and restore its original content on teardown.

Use logical start alignment when a stable leading edge is intended; centered text may be
deliberate. Preserve line height while empty and verify actual glyph clipping.
Keep a stable accessible phrase for decorative typing. Announce a completed meaningful status
change when appropriate; do not require a live region to announce every decorative character.

## 11. Verification

- [ ] Visible endpoints cover normal, skipped, changed-preference, failed-gate and interrupted paths.
- [ ] Resize/scroll/navigation preserve responsive geometry and other property owners.
- [ ] Cleanup removes owned animations, listeners, timers and split DOM without restarting loops.
- [ ] Actual text, focus, clipping, reading order and motion alternatives remain usable.
- [ ] Relevant browser evidence supports visual claims; parsing/builds alone do not.
- [ ] Missing runtime/plugin/consumer proof is named under `foundation-testing.md`.
