# Pulsar Studios — Fast, Bold & Premium Redesign

**Date:** 2026-07-09 (revised)
**Status:** Draft for review
**Author:** Brainstormed with Claude (superpowers/brainstorming)

---

## 1. Goal & Context

Pulsar Studios is a web-development company; its own site is its top sales asset and
must demonstrate the craft it sells. The current site is already technically
sophisticated (Three.js blob hero with fresnel shaders + ~2.4s "pulsar" pulse, adaptive
quality tier, GSAP + Lenis smooth scroll, custom cursor, preloader/veil transitions,
film grain, bloom + RGB-split post-processing, a clean data-driven project system).

**The problem the user actually reported:** the site *feels slow* and *looks a bit bland*
— despite there being very little content. Investigation showed these are linked: the
site looks cheap **because** it loads slow. Fixing speed makes the existing craft read as
premium.

Benchmark reference: [lusion.co](https://lusion.co) (Awwwards/FWA-winning creative-dev
studio) — but the user explicitly chose **fast + bold + real-work** over **heavy signature
3D**. So this spec is NOT the maximalist persistent-world/curly-tube build; it is a
performance-first premium polish.

### Measured diagnosis (evidence)
- **Built bundle 1.3 MB**, of which:
  - `three` chunk **503 KB** (77% of JS) — caused by a single `import * as THREE from 'three'`
    in `src/gl/renderer.js`, which defeats tree-shaking. Only ~20 Three classes are actually
    used (all named-importable). **Named imports should cut this to ~120–150 KB.**
  - `gsap` chunk 130 KB, `main` app JS 47 KB, CSS 29 KB.
- Everything loads **upfront on every page** — WebGL bundle not lazy-loaded.
- Render pipeline is heavy for the payload: offscreen RT + bright-pass + 4 blur passes +
  composite every frame (MSAA, half-float) to bloom a few blobs. Beautifully engineered
  (`quality.js` adaptive tier is genuinely strong) but high fill-rate for what's on screen.

### Decisions locked during brainstorming
- **Performance:** Full optimization pass, done **FIRST**, before any new visual features.
- **Wow direction (user-chosen, in priority order):**
  1. **Bolder art direction** (design-only, zero JS weight)
  2. **Rich micro-interactions** (cheap weight, high felt-quality)
  3. **Interactive project rooms** with live-site embeds for real client work
- **Explicitly deferred/dropped:** persistent-world camera architecture and the curly-tube
  volumetric hero. Not chosen. May revisit later once the fast foundation exists.
- **Real projects:** user has real, live client websites (live URLs) to showcase; current
  8 projects in `src/data/projects.js` are fictional placeholders to replace.

---

## 2. Phase 1 — Performance Optimization (do this first)

Goal: make the site *feel* fast. Target: < 150 KB critical JS, < 2s time-to-interactive on
mid mobile, 60fps desktop / smooth mobile. No visual regression.

### 2.1 Tree-shake Three.js (biggest single win, ~350 KB)
- Replace `import * as THREE from 'three'` in `src/gl/renderer.js` with named imports of only
  the used classes, re-exported as a `THREE`-shaped object so downstream `THREE.Xxx` usage is
  untouched. Used set (confirmed by grep): `WebGLRenderer, WebGLRenderTarget, Scene, Camera,
  PerspectiveCamera, Group, Mesh, ShaderMaterial, BufferGeometry, BufferAttribute,
  PlaneGeometry, SphereGeometry, Color, Vector2, Vector3, CanvasTexture, HalfFloatType,
  LinearFilter, ClampToEdgeWrapping, NoBlending, SRGBColorSpace`.
- Verify the `three` chunk drops to ~120–150 KB after build. No behavior change.

### 2.2 Lazy-load the WebGL layer
- Dynamic-import the GL bundle (`renderer.js` + scenes + post) so it loads *after* first
  paint, not before. The page is readable/interactive immediately; the canvas fades in when
  ready. Keeps first-load JS tiny.
- Static/CSS hero placeholder shows instantly; WebGL upgrades it progressively.

### 2.3 Defer / trim GSAP + Lenis
- Audit GSAP usage; import only used plugins. Ensure Lenis + GSAP aren't blocking first paint.
- Consider deferring smooth-scroll init until after first interaction on slow devices.

### 2.4 Lighten the render pipeline (proportional to payload)
- Make the full bloom pipeline **conditional on there being bright content on screen** and on
  the quality tier — drop from 4 blur passes to 2 by default, keep 4 only on high tier.
- Reduce offscreen RT cost where the payload is small; keep the adaptive `quality.js` tier
  (it's good) but bias its defaults lower so mid devices start smooth.

### 2.5 Asset & loading hygiene
- Compress/lazy-load project images (already SVG thumbs — keep light; real screenshots must be
  responsive + compressed, KTX2/AVIF where raster).
- Preload only the critical font subset; `font-display: swap`.
- Add resource hints; ensure code-split per route so a page loads only what it needs.

### Phase 1 exit criteria (must verify with build output + a real device/throttle)
- `three` chunk ≤ 150 KB; critical-path JS ≤ ~180 KB.
- WebGL loads lazily (confirmed in network waterfall).
- No visual regression vs. current site.

---

## 3. Phase 2 — Bolder Art Direction (design-only, zero added JS)

Make it feel expensive purely through design. This is where "bland" gets fixed.

- **Commit to the dark theme.** Move base to near-black `#0D0D0F` (already a palette token);
  violet `#6533FF` / cyan `#31C6E8` / lime `#B8FF2C` become luminous accents. Dark makes the
  existing bloom read as luxurious instead of washed out. (Light mode optional toggle; dark is
  the identity.)
- **Oversized kinetic typography.** Push variable Archivo to viewport-scale display weights for
  section titles; JetBrains Mono as the technical counterpoint for labels/metadata. One
  expressive headline moment per section.
- **Dramatic negative space + cinematic pacing.** More breathing room; deliberate emptiness
  before big moments. Confidence reads as premium.
- **Light & grain.** Keep film grain (`_grain.scss`); add subtle vignette + refine bloom so the
  frame feels *lit*, not flat.
- **Refined color/light system** documented in `_tokens.scss` so it's consistent site-wide.

No new dependencies, no JS weight. Pure SCSS + markup.

---

## 4. Phase 3 — Rich Micro-interactions (cheap weight, high felt-quality)

The connective tissue that makes a site feel alive and expensive. Most primitives already
exist; we elevate + unify them.

- **Contextual custom cursor.** Extend the existing magnetic blob cursor with state labels —
  "Explore", "Open", "Visit site ↗", "Drag". Subtle scale/refract near interactive elements.
- **Scatter/reform text.** Tighten the existing `data-scrub-words` / split-text so headlines
  scatter and reform on scroll-in (the 2026 premium pattern).
- **Magnetic everything + alive hover states.** Extend magnetic behavior to key CTAs; buttons,
  links, and cards get considered hover/active micro-states (not default transitions).
- **Page-transition choreography.** Refine the existing `veil` transition timing so navigation
  feels intentional and weighted, not abrupt.
- **Micro-details.** Side scroll-progress + section indicator; refined preloader; scroll-velocity
  aberration retained but tuned; optional off-by-default hover sound.

All built on GSAP you already ship — negligible added weight.

---

## 5. Phase 4 — Interactive Project Rooms (real client work)

Replace fictional placeholders with real projects, presented richly. NOT the heavy persistent-
world version — self-contained, performant case-study experiences.

- **Data model.** Extend `src/data/projects.js`: add `url` (live client link) and real
  `screenshots[]`; keep `brief / approach / quote / stats`. Swapping placeholders for real work
  = edit this file + add compressed screenshots.
- **Project index.** Elevate the existing work grid/cards with the new art direction + micro-
  interactions: warped-image hover (reuse `data-gl-img` displacement), lean-on-hover, mono
  metadata.
- **Case-study "room" per project.** A rich single-project page (keeps real URL `/projects/<slug>`
  for SEO/shareability): large screenshots, story (brief → approach → results), metrics as big
  animated numbers, client quote, and a **live browser frame** — a framed `<iframe>` of the real
  client URL — plus a prominent **"Visit live site ↗"** action. Live, working, clickable proof
  is the credibility payload.
- **Performance-safe embeds.** `<iframe>` lazy-loaded (`loading="lazy"`), only mounted when the
  room is in view; static screenshot shown until then; real `<a>` fallback always present.
- **Next-project flow.** Reuse existing `nextProject()` for continuous browsing.

---

## 6. Sequencing & Rationale

Order is deliberate and non-negotiable:
1. **Phase 1 (perf) first** — you cannot judge "bland" fairly on a slow site, and you can't add
   features onto a heavy base. Fast foundation first.
2. **Phase 2 (art direction)** — highest wow-per-effort, zero weight; likely fixes most of "bland."
3. **Phase 3 (micro-interactions)** — cheap, big felt-quality lift.
4. **Phase 4 (project rooms)** — needs real user data (URLs + screenshots) to become real.

Each phase is independently shippable and independently reviewable.

---

## 7. Open Items / User Inputs Needed

- **Real project data:** per live client site — slug, title, sector, year, tags, roles, brief,
  approach, quote (+author), 3 metrics, **live URL**, screenshots (desktop + mobile, key pages).
- **Number of real projects** to feature (placeholder count is 8).
- **Light-mode toggle:** keep as option, or dark-only.
- **Live-embed policy:** confirm client sites allow iframing (some set `X-Frame-Options`); if a
  site blocks embedding, fall back to a screenshot + "Visit live site ↗" for that project.

---

## 8. Out of Scope (YAGNI)

- Persistent-world camera architecture (deferred — not chosen).
- Curly-tube volumetric hero (deferred — not chosen).
- Rebuilding the GL layer on a lighter engine (OGL) — the tree-shake gets most of the win
  without a rewrite.
- CMS integration (project data stays in `projects.js`).
- Multilingual content; full sound design.

---

## 9. Notes for Verification

- Phase 1 success is **measurable** — re-run `vite build`, compare chunk sizes, check a network
  waterfall on throttled mobile. Do not claim "faster" without the numbers.
- Phases 2–4 verified visually + on a real device, plus a Lighthouse/perf check to confirm the
  new features didn't regress the Phase 1 gains.
