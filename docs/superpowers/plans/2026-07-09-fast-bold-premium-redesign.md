# Fast, Bold & Premium Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Pulsar Studios' site feel fast first (cut ~350 KB of JS, lazy-load WebGL, lighten the render pipeline), then premium (bold dark art direction, rich micro-interactions, real interactive project rooms).

**Architecture:** Keep the existing vanilla-JS + Vite + Three.js + GSAP/Lenis architecture. No framework, no rewrite. Optimize the current GL layer, then layer design + interaction polish on the now-fast foundation. Ship in four independent phases; each phase is independently verifiable and shippable.

**Tech Stack:** Vite 8, Three.js 0.185 (tree-shaken), GSAP 3 + Lenis, SCSS. No test framework exists (vanilla front-end) — verification is **measured build output + real-device/visual checks**, not unit tests.

## Global Constraints

- **No visual regression** in Phase 1 — the site must look identical before/after the perf pass.
- **`three` chunk ≤ 150 KB** after Phase 1 (from 503 KB); critical-path JS ≤ ~180 KB.
- **Preserve real URLs** for every page (`/`, `/about.html`, `/projects.html`, `/projects/<slug>`) for SEO/shareability.
- **Honor `reducedMotion` / `lowPower`** flags everywhere (existing `src/utils/env.js`).
- **Palette tokens** are canonical in `src/styles/_tokens.scss`: violet `#6533FF`, cyan `#31C6E8`, lime `#B8FF2C`, near-black `#0D0D0F`. Do not hardcode hexes elsewhere.
- **Frequent commits** — one per task minimum. Conventional-commit prefixes (`perf:`, `feat:`, `style:`, `refactor:`).
- **Verify before claiming done** — every "Expected" block must be actually observed, not assumed. Never claim a size/speed win without the build number.

---

## Phase 0 — Baseline & Safety Net

Capture the current state so every later "faster/smaller" claim is measurable, and so we can catch regressions.

### Task 0.1: Record the performance baseline

**Files:**
- Create: `docs/superpowers/plans/baseline-metrics.md`

**Interfaces:**
- Produces: a committed baseline doc later tasks compare against (chunk sizes, TTI).

- [ ] **Step 1: Clean build**

Run: `npm run build`
Expected: build succeeds, `dist/` produced.

- [ ] **Step 2: Record chunk sizes**

Run: `find dist -name "*.js" -o -name "*.css" | xargs ls -l | awk '{print $5, $9}' | sort -rn`
Record every JS/CSS chunk size. (Baseline known: three ≈ 503 KB, gsap ≈ 130 KB, main ≈ 47 KB, css ≈ 29 KB.)

- [ ] **Step 3: Record a load waterfall**

Run: `npm run preview` and open the site in a browser with DevTools → Network, throttled to "Fast 4G". Note: total transferred, time to first contentful paint, and which JS blocks first paint.

- [ ] **Step 4: Write `baseline-metrics.md`**

Table with columns: asset, size (KB), gzipped (KB). Plus TTI/FCP notes. Header: "Baseline captured <date>, commit <sha>".

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/baseline-metrics.md
git commit -m "docs: record pre-optimization performance baseline"
```

### Task 0.2: Visual-regression reference snapshots

**Files:**
- Create: `docs/superpowers/plans/visual-baseline/` (screenshots)

**Interfaces:**
- Produces: reference screenshots to diff against after Phase 1 (which must be visually identical).

- [ ] **Step 1: Capture reference screenshots**

With `npm run preview` running, capture full-page screenshots of `/`, `/about.html`, `/projects.html`, and one project page (`/projects/nova-labs.html`) at desktop (1440px) and mobile (390px) widths. Save to `docs/superpowers/plans/visual-baseline/`. (Use the agent-browser skill or a manual screenshot — the point is a before/after reference.)

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/visual-baseline/
git commit -m "docs: capture visual baseline screenshots for regression check"
```

---

## Phase 1 — Performance Optimization

The felt-speed fix. Each task is independently shippable and independently reversible.

### Task 1.1: Tree-shake Three.js (the ~350 KB win)

**Files:**
- Modify: `src/gl/renderer.js:8` (the `import * as THREE` line and the `export { THREE }` at bottom)

**Interfaces:**
- Consumes: nothing new.
- Produces: an unchanged public surface — `renderer.js` still exports a `THREE`-shaped object with the same members, so every downstream `THREE.Xxx` usage keeps working. No other file changes.

**Context:** `src/gl/renderer.js:8` does `import * as THREE from 'three'` and re-exports it (`export { THREE }`). The namespace import defeats tree-shaking → the whole 503 KB library ships. Grep confirmed only these classes are used across `src/`: `WebGLRenderer, WebGLRenderTarget, Scene, Camera, PerspectiveCamera, Group, Mesh, ShaderMaterial, BufferGeometry, BufferAttribute, PlaneGeometry, SphereGeometry, Color, Vector2, Vector3, CanvasTexture, HalfFloatType, LinearFilter, ClampToEdgeWrapping, NoBlending, SRGBColorSpace`.

- [ ] **Step 1: Replace the namespace import with named imports + a re-export shim**

In `src/gl/renderer.js`, replace line 8:

```js
import * as THREE from 'three';
```

with:

```js
import {
  WebGLRenderer, WebGLRenderTarget, Scene, Camera, PerspectiveCamera,
  Group, Mesh, ShaderMaterial, BufferGeometry, BufferAttribute,
  PlaneGeometry, SphereGeometry, Color, Vector2, Vector3, CanvasTexture,
  HalfFloatType, LinearFilter, ClampToEdgeWrapping, NoBlending, SRGBColorSpace,
} from 'three';

const THREE = {
  WebGLRenderer, WebGLRenderTarget, Scene, Camera, PerspectiveCamera,
  Group, Mesh, ShaderMaterial, BufferGeometry, BufferAttribute,
  PlaneGeometry, SphereGeometry, Color, Vector2, Vector3, CanvasTexture,
  HalfFloatType, LinearFilter, ClampToEdgeWrapping, NoBlending, SRGBColorSpace,
};
```

Keep the existing `export { THREE };` at the bottom of the file as-is.

- [ ] **Step 2: Verify no other `import * as THREE` exists**

Run: `grep -rn "import \* as THREE" src/`
Expected: **no matches** (only `renderer.js` had it, now removed).

- [ ] **Step 3: Verify no newly-missing classes**

Run: `grep -rohE "THREE\.[A-Z][A-Za-z]+" src/ | sort -u`
Expected: every class listed appears in the named-import list above. If any is missing (e.g. a class not caught earlier), add it to both the import and the `THREE` shim.

- [ ] **Step 4: Build and measure the win**

Run: `npm run build`
Then: `find dist -name "*.js" | xargs ls -l | awk '{print $5, $9}' | sort -rn | head`
Expected: the `three-*.js` chunk drops from ~503 KB to **~120–150 KB**. Record the number.

- [ ] **Step 5: Visually verify no regression**

Run: `npm run preview`, open `/`. Confirm the blob hero, bloom, cursor, and transitions all still work identically. Compare against `visual-baseline/`.
Expected: pixel-identical behavior.

- [ ] **Step 6: Commit**

```bash
git add src/gl/renderer.js
git commit -m "perf: tree-shake three.js via named imports (503KB -> ~150KB)"
```

### Task 1.2: Lazy-load the WebGL layer

**Files:**
- Modify: `src/main.js` (the `glx.init` boot sequence and its import)
- Modify: `src/router.js` (any direct `glx` scene mounts — make them await the GL module)

**Interfaces:**
- Consumes: `glx` from `renderer.js`.
- Produces: a `loadGL()` async function that dynamic-imports the renderer; callers `await loadGL()` before using `glx`. Page is interactive before GL resolves.

**Context:** `src/main.js` statically imports `glx` and inits it during boot, so the 150 KB GL chunk is on the critical path. We defer it: the page paints and becomes interactive, then GL loads and fades the canvas in.

- [ ] **Step 1: Convert the static GL import in `main.js` to a dynamic import**

In `src/main.js`, remove `import { glx } from './gl/renderer.js';` from the top. Where boot currently calls `glx.init(...)`, replace with a deferred loader that runs after first paint:

```js
// after the page's critical chrome is up, load the heavy GL layer
async function loadGL() {
  const { glx } = await import('./gl/renderer.js');
  glx.init(document.querySelector('[data-gl]'));
  document.documentElement.classList.add('gl-ready'); // CSS fades canvas in
  return glx;
}
```

Call `loadGL()` **after** the preloader/first-page-enter path, not before. Store the resolved `glx` (or the promise) where the router can await it.

- [ ] **Step 2: Make router GL usage await the loader**

In `src/router.js`, anywhere it references `glx` to mount/unmount scenes, ensure it `await`s the shared GL promise from Step 1 (pass it in or import a `glReady` promise). If GL hasn't loaded yet, scene mounts queue until it resolves.

- [ ] **Step 3: Add the CSS fade-in for the canvas**

In `src/styles/_chrome.scss` (or wherever `.gl` is styled), add:

```scss
.gl { opacity: 0; transition: opacity 0.6s ease; }
.gl-ready .gl { opacity: 1; }
```

- [ ] **Step 4: Build and confirm the chunk is split out**

Run: `npm run build`
Expected: the `three` chunk is emitted as a **separate async chunk** (not merged into `main`). Confirm `main-*.js` shrank.

- [ ] **Step 5: Verify lazy load in the network waterfall**

Run: `npm run preview`, DevTools → Network (Fast 4G throttle), reload `/`. Confirm the `three` chunk loads **after** the HTML/CSS/main and first paint — not before. Confirm the canvas fades in.
Expected: first paint no longer blocked by the 150 KB GL chunk.

- [ ] **Step 6: Verify reduced-motion + no-WebGL paths still work**

Emulate `prefers-reduced-motion: reduce` (DevTools rendering tab) and reload. Confirm the site is fully usable with the static/one-frame path.
Expected: no errors, content readable.

- [ ] **Step 7: Commit**

```bash
git add src/main.js src/router.js src/styles/_chrome.scss
git commit -m "perf: lazy-load the WebGL layer after first paint"
```

### Task 1.3: Trim GSAP imports

**Files:**
- Modify: `src/core.js` (GSAP + plugin imports)

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `Lenis`.
- Produces: same named exports (`gsap`, `ScrollTrigger`, `initScroll`, `lenis`), smaller footprint.

**Context:** GSAP is 130 KB. Confirm only the used plugins are imported (likely just `ScrollTrigger`). Remove any barrel import that drags in all plugins.

- [ ] **Step 1: Audit GSAP usage**

Run: `grep -rohE "gsap\.[a-zA-Z]+|ScrollTrigger|SplitText|Flip|Draggable|MotionPath" src/ | sort -u`
Record which GSAP plugins are actually used.

- [ ] **Step 2: Ensure `core.js` imports only those**

In `src/core.js`, confirm imports are the specific submodule paths (e.g. `import { gsap } from 'gsap';` and `import { ScrollTrigger } from 'gsap/ScrollTrigger';`) — NOT `import 'gsap/all'`. Remove any unused plugin registration.

- [ ] **Step 3: Build and check the gsap chunk**

Run: `npm run build` then check the `gsap` chunk size.
Expected: same or smaller; no plugin bloat. Record the number.

- [ ] **Step 4: Verify scroll + animations still work**

Run: `npm run preview`, scroll every page. Confirm reveals, scrub, pin, marquee all animate.
Expected: no regression.

- [ ] **Step 5: Commit**

```bash
git add src/core.js
git commit -m "perf: import only used GSAP plugins"
```

### Task 1.4: Make the bloom pipeline proportional to tier

**Files:**
- Modify: `src/gl/post.js:179-199` (the blur-pass selection)
- Modify: `src/gl/quality.js:20` (starting tier bias for mid devices)

**Interfaces:**
- Consumes: `quality` value already passed into post via `setQuality`.
- Produces: fewer default blur passes on non-high tiers; unchanged high-tier look.

**Context:** `post.js` already halves blur passes when `quality <= 0.6` (4 → 2). We bias the default so mid devices *start* in the cheaper path and only climb to 4 passes with proven headroom, and start the tier slightly lower so first frames are smooth.

- [ ] **Step 1: Lower the high-quality threshold for 4-pass bloom**

In `src/gl/post.js`, the passes selection uses `quality > 0.6`. Change the threshold to `quality > 0.8` so 4-pass bloom is reserved for genuinely high-headroom devices; everything else uses the 2-pass path (visually near-identical after bloom).

- [ ] **Step 2: Bias the starting tier down slightly**

In `src/gl/quality.js:20`, the constructor sets `this.value = lowPower ? 0.55 : 1`. Change the non-lowPower start from `1` to `0.75` so mid devices begin smooth and the adaptive tier climbs up only with headroom (it already probes upward).

- [ ] **Step 3: Build + verify look on high tier**

Run: `npm run preview` on a capable machine. Confirm bloom still looks rich once the tier climbs (hero blobs glow as before).
Expected: no visible quality loss at rest on desktop.

- [ ] **Step 4: Verify smoothness on a throttled profile**

DevTools → Performance → CPU 4× slowdown, reload, scroll. Confirm frame rate holds and the tier settles to the cheaper path without oscillating.
Expected: smoother start, no jank spikes.

- [ ] **Step 5: Commit**

```bash
git add src/gl/post.js src/gl/quality.js
git commit -m "perf: reserve 4-pass bloom for high tier, start mid devices smooth"
```

### Task 1.5: Loading hygiene — fonts, hints, image lazy-load

**Files:**
- Modify: `index.html`, `about.html`, `projects.html`, `projects/*.html` (font preload + hints)
- Modify: `src/data/projects.js` if image handling needs a `loading` attr (thumbs already `loading="lazy"` in markup — verify)

**Interfaces:**
- Consumes: existing font files in `public/assets/fonts/`.
- Produces: `font-display: swap`, correct preload, lazy images.

**Context:** Fonts are already preloaded (34 KB + 31 KB). Confirm `font-display: swap` is set in `_fonts.scss`; confirm all project `<img>` use `loading="lazy"` (index.html already does). Add `font-display` if missing.

- [ ] **Step 1: Confirm/add `font-display: swap`**

Run: `grep -n "font-display" src/styles/_fonts.scss`
If absent, add `font-display: swap;` to each `@font-face`.

- [ ] **Step 2: Confirm all project images are lazy**

Run: `grep -rn "work-card__img\|project.*<img" index.html projects.html projects/ | grep -v 'loading="lazy"'`
Expected: no matches (all already lazy). Add `loading="lazy" decoding="async"` to any that lack it.

- [ ] **Step 3: Build + Lighthouse pass**

Run: `npm run build && npm run preview`. Run Lighthouse (Performance) on `/`.
Expected: performance score improved vs. baseline; no "render-blocking resources" flag for the GL chunk.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "perf: font-display swap, lazy images, loading hints"
```

### Task 1.6: Phase 1 verification & baseline diff

**Files:**
- Modify: `docs/superpowers/plans/baseline-metrics.md` (add "after Phase 1" column)

- [ ] **Step 1: Rebuild and record final sizes**

Run: `npm run build` then record all chunk sizes. Add an "After Phase 1" column to `baseline-metrics.md`.
Expected: `three` ≤ 150 KB; total critical JS ≤ ~180 KB; measurable total-transfer drop.

- [ ] **Step 2: Confirm exit criteria met**

Verify against Global Constraints: three ≤ 150 KB ✔, WebGL lazy-loaded (waterfall) ✔, no visual regression (diff against `visual-baseline/`) ✔.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/baseline-metrics.md
git commit -m "docs: record Phase 1 performance results vs baseline"
```

---

## Phase 2 — Bolder Art Direction (design-only)

Zero added JS. Pure SCSS + markup. Makes it feel expensive. (Bite-sized steps; expand at execution time per task.)

### Task 2.1: Commit to the dark theme in tokens
- Modify `src/styles/_tokens.scss`: set page background to near-black `#0D0D0F`, foreground to a warm off-white, accents to violet/cyan/lime. Update `theme-color` meta in all HTML heads to `#0D0D0F`.
- Verify every page reads correctly on dark; fix any hardcoded light colors found via `grep -rn "#F2F1EF\|#fff\|white" src/styles/`.
- Commit: `style: commit to dark theme base`.

### Task 2.2: Oversized kinetic display typography
- Modify `src/styles/_base.scss` / `_home.scss`: introduce viewport-scale (`clamp()`) display sizes for section titles; tighten leading; establish a clear type scale. Keep JetBrains Mono for labels.
- Verify responsive behavior 390px → 1440px; no overflow.
- Commit: `style: oversized kinetic display type scale`.

### Task 2.3: Negative space + cinematic vertical rhythm
- Modify section spacing tokens: increase section padding, add deliberate empty space before major sections.
- Verify pacing on scroll; no cramped sections.
- Commit: `style: cinematic spacing and vertical rhythm`.

### Task 2.4: Light polish — vignette + grain tuning
- Modify `src/styles/_grain.scss`: tune grain opacity for dark bg; add/soften vignette so the frame reads as lit.
- Commit: `style: tune grain and vignette for dark theme`.

### Task 2.5: Phase 2 visual verification
- Screenshot all pages; compare to intent; confirm no perf regression (re-run build size check).
- Commit doc update.

---

## Phase 3 — Rich Micro-interactions

Built on GSAP already shipped — negligible weight. (Bite-sized steps; expand at execution time.)

### Task 3.1: Contextual custom cursor states
- Modify `src/anims/cursor.js`: add label states driven by `data-cursor` attributes already in markup ("Explore", "Open", "Visit site ↗", "Drag"); scale/refract near interactive els.
- Verify each state triggers on the right elements; touch devices unaffected.
- Commit: `feat: contextual cursor states`.

### Task 3.2: Scatter/reform headline animation
- Modify `src/anims/splitText.js` + `reveals.js`: add a scatter→reform reveal variant; apply to one headline per section via a `data-reveal="scatter"` hook.
- Verify on scroll-in; honors reduced-motion (no scatter, plain fade).
- Commit: `feat: scatter/reform headline reveal`.

### Task 3.3: Alive hover states + extend magnetic
- Modify `src/anims/magnetic.js` + button/link/card SCSS: considered hover/active micro-states; extend magnetism to key CTAs.
- Verify feel on desktop; no layout shift.
- Commit: `feat: alive hover states and expanded magnetism`.

### Task 3.4: Transition choreography + scroll indicator
- Modify `src/gl/transitions.js` timing + add a side scroll-progress/section indicator component.
- Verify navigation feels weighted; indicator tracks scroll.
- Commit: `feat: refined transitions and scroll indicator`.

### Task 3.5: Phase 3 verification
- Exercise every interaction on desktop + touch + reduced-motion. Confirm no perf regression.

---

## Phase 4 — Interactive Project Rooms (real client work)

**Blocked on user inputs (see spec §7):** real client URLs, screenshots, iframe-embed confirmation. Do not start until provided.

### Task 4.1: Extend the project data model
- Modify `src/data/projects.js`: add `url` (live link) and `screenshots[]` fields to the schema; keep existing fields. Replace the 8 fictional entries with the user's real projects (data provided by user).
- Verify pages generate for each real slug.
- Commit: `feat: real project data with live URLs and screenshots`.

### Task 4.2: Elevate the project index cards
- Modify `projects.html` + `_projects.scss` + `cardsScene.js`: apply new art direction + micro-interactions to the grid; warped-image hover, lean-on-hover, mono metadata.
- Verify hover/scroll; perf holds.
- Commit: `feat: elevated project index`.

### Task 4.3: Case-study room per project
- Modify `src/templates/pages.js` / project page template + `_case.scss`: rich layout — large screenshots, story (brief→approach→results), animated metric numbers, quote.
- Verify one project end-to-end.
- Commit: `feat: rich case-study room layout`.

### Task 4.4: Live browser-frame embed
- Add a lazy `<iframe>` of the client URL mounted only when in view, with static screenshot placeholder + "Visit live site ↗" `<a>` fallback. Handle `X-Frame-Options`-blocked sites by falling back to screenshot-only.
- Verify embed loads lazily; fallback works for a blocked site.
- Commit: `feat: lazy live-site embed with fallback`.

### Task 4.5: Phase 4 verification
- Verify all real projects render, embeds lazy-load, live links work, perf budget held (re-run build size + Lighthouse).

---

## Self-Review Notes

- **Spec coverage:** Phase 1 ↔ spec §2 (all 5 optimizations mapped to Tasks 1.1–1.5). Phase 2 ↔ spec §3. Phase 3 ↔ spec §4. Phase 4 ↔ spec §5. Sequencing (spec §6) preserved: perf → art → interaction → rooms. Open items (spec §7) gate Phase 4. ✔
- **No test framework:** verification adapted to build-size measurement + visual/device checks (honest fit for a vanilla front-end). Phase 1 tasks all carry a measurable "Expected" number.
- **Type/name consistency:** `loadGL()` (1.2), `THREE` shim surface (1.1), `setQuality`/tier (1.4) referenced consistently.
- **Granularity note:** Phase 1 is fully bite-sized (this is the precise, must-be-perfect part the user asked for). Phases 2–4 are structured at task level with per-task commit points; each task's micro-steps get expanded when that phase begins (they depend on Phase 1's outcome and, for Phase 4, on user-provided data). This avoids writing detailed steps against a codebase state that Phase 1 will change.
