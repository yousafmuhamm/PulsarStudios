# Pulsar Studios — Lusion-Tier Maximalist Redesign

**Date:** 2026-07-09
**Status:** Draft for review
**Author:** Brainstormed with Claude (superpowers/brainstorming)

---

## 1. Goal & Context

Pulsar Studios is a web-development company. Its own website is its single most
important sales asset — it must demonstrate the craft the company sells. The
current site is already high-quality (Three.js blob hero with fresnel shaders and
a ~2.4s "pulsar" pulse, GSAP + Lenis smooth scroll, custom cursor, preloader/veil
transitions, film grain, a clean data-driven project system). The goal is to push
it to **"extravagant, over-the-top, premium"** — benchmark: [lusion.co](https://lusion.co),
an Awwwards/FWA Site-of-the-Month-winning creative-dev studio.

Two intertwined objectives:
1. **Elevate the site** to Lusion-tier maximalism.
2. **Add real projects** — the user has **real, live client websites** (live URLs)
   to showcase. Current 8 projects in `src/data/projects.js` are fictional
   placeholders to be replaced with real work.

### Key research findings (Lusion)
- Premium ≠ many effects. It's **one committed idea, executed with real physics.**
  ("Commit to one hard idea and budget everything around it.")
- **Single hero object with real weight/inertia** — physics-mimicking easing.
- **Scroll moves a camera through true Z-depth** — fly *through* the scene, not
  scroll *past* flat 2D layers. Biggest single "premium" differentiator.
- **Scene-per-project** — each project is a self-contained 3D "room" entered/exited
  on scroll (museum-room pacing).
- **Signature volumetric effect** — Lusion's is "curly noise tubes with light
  scattering."
- **Baked + real-time blend** — "You don't need to do everything real-time." Heavy
  sims pre-rendered (Houdini/Redshift), blended with a live interaction layer.
- Dark theme, high contrast, generous negative space, cinematic pacing.

Sources: lusion.co; Codrops "Curly Tubes from the Lusion Website with Three.js";
Awwwards Lusion case study; utsubo.com "Best Three.js Websites 2026".

### Decisions locked during brainstorming
- **Ambition:** Full Lusion-tier maximalism (accepting build-time / perf / mobile risk).
- **Architecture:** Approach A — one persistent Three.js "world," camera-on-a-spline,
  stations in Z-depth, DOM as overlay, real URLs preserved. Baked video fallback on mobile.
- **Signature hero:** Curly volumetric tubes (Lusion-style) — made Pulsar's own via
  palette + the traveling pulsar-beat pulse.
- **Projects:** Real live client sites, presented as 3D rooms with live-site embeds.

---

## 2. Architecture — The Persistent World (Approach A)

Invert the current discrete-page model into **one Three.js world that boots once and
never tears down.** Scroll + navigation move a **camera along a spline** through Z-depth.
Sections are *places*, not pages.

### Components
- **`src/gl/world.js`** (new) — owns one `Scene`, one camera rig, and a camera path
  (`CatmullRomCurve3` through Z). Lenis scroll position maps to distance along the spline.
- **Stations** (`src/gl/stations/*.js`, new) — self-contained modules registered into
  the shared scene at fixed Z. Each exposes `onEnter / onExit / update(cameraDist)`.
  Distance + frustum culling means only 1–2 stations render at once. Station order:
  `hero` → `intro` → `philosophy` → **gallery corridor** (project stations) → `contact`.
- **DOM overlay** — HTML text/UI positioned over the canvas, synced to camera stations.
  Existing `data-reveal` / `data-scrub-words` system still drives copy reveals.
- **Routing** (`router.js` rewrite) — navigation becomes "animate camera to a station,"
  not "load a page." Deep links (`/projects/<slug>`) fast-travel the camera to that
  station's Z on load. Real URLs preserved via History API for SEO/shareability;
  no in-session reloads.

### Carried forward (absorbed, not discarded)
`renderer.js`, `post.js`, `quality.js`, `transitions.js`, `shaders.js`. The blob
`heroScene.js` seeds the pulsar accent; `cardsScene.js` logic informs project stations.

### Touch list
New `world.js` + `stations/`; rewrite `router.js`, `main.js` boot, `core.js` scroll
wiring. HTML files become lighter (content sources / overlay markup).

### Named tradeoff
One shared GPU budget. Every station must be disciplined on draw calls / shader cost.
Hard perf ceiling enforced by distance-culling (see §7).

---

## 3. Signature Curly-Tube Hero

The flagship / screenshot moment.

### Core effect (proven recipe)
- **Geometry:** multiple `TubeGeometry` instances whose paths are `CatmullRomCurve3`
  curves. Control points driven by **3D curl noise** (divergence-free simplex) — gives
  organic flowing motion. Each tube is a long, thin, glassy filament.
- **Material/light:** custom shader — **fresnel rim lighting + fake sub-surface light
  scattering** (edges glow, light appears to pass through). Bloom (existing `post.js`)
  makes highlights bleed = volumetric feel.
- **Motion:** noise field animates over time (tubes perpetually reflow). Cursor adds a
  curl-noise distortion pushing the field away from the pointer (reuse pointer-physics
  pattern from current `heroScene.js`).

### Pulsar's own twist (homage, not clone)
- **Palette lock** to existing tokens: violet `#6533FF` → cyan `#31C6E8` along tube
  length, lime `#B8FF2C` as scatter/edge accent. (Lusion is warm/mono; ours is
  electric violet-lime — distinct at a glance.)
- **The Pulsar beat (the differentiator):** every ~2.4s a bright energy pulse travels
  down the length of every tube (a moving intensity band in the shader) — a heartbeat
  firing through the filaments. Ties the new hero to the name + existing identity.
- **Composition:** tubes converge toward a bright core at screen-right (echoes current
  blob-cluster composition) — reads as energy streaming into a pulsar.

### Scroll behavior
Camera flies forward; tubes part and stream *past* the camera (fly *through* the tangle),
opening out into the intro station. True Z-depth, not a fade.

### Reference implementation path
Codrops "Curly Tubes from the Lusion Website" article + its open GitHub gist + Yuri
Artiukh's recorded build session — a vetted starting point to restyle and rhythm-sync.

### Performance
Tube geometry is the expensive part. Cap tube count (desktop ~8–12, low-power ~3),
compute paths on GPU where possible, target < ~4ms/frame mid-laptop. Mobile → baked
video loop of this exact hero.

---

## 4. Project Gallery Corridor & Case-Study Rooms

The centerpiece of "add my real projects." A **corridor in Z-depth** where each real
client project is a **station / 3D room** entered, explored, and exited on scroll.

### Corridor pass
Flying the main spline, each project appears as a large floating panel/portal showing
the project's hero screenshot on a subtly warped plane (reuse `data-gl-img` displacement),
with title + sector + year in mono type. Hover → panel leans, image parallaxes with depth.

### Entering a room
Click/scroll into a project → camera **branches off the main spline** into that project's
dedicated room (scene-per-project). Room contains:
- Live screenshot(s) presented large.
- Story: brief → approach → results.
- Real metrics as big animated numbers.
- **Live browser frame** — framed `<iframe>` of the real client URL — plus prominent
  **"Visit live site ↗"** action. This is the credibility payload: real, working, clickable proof.

### Data model
Extend `src/data/projects.js`: add `url` (live link) and real `screenshots[]`; keep
`brief / approach / quote / stats`. Replacing the 8 fictional entries with real ones =
edit this file + drop in captured screenshots. Every project auto-generates its corridor
panel and room.

### Flow
Exiting a room rejoins the corridor at the next project (existing `nextProject()` logic) —
continuous, no reload.

### Mobile fork
Corridor → vertical scroll of rich cards; rooms → clean full-screen case-study pages with
live-site embed. Same content, flat presentation.

---

## 5. Transitions, Cursor & Micro-interactions

- **No page reloads.** Navigation = camera flight with weighted/inertial easing (Lusion
  "real physics" feel). `veil` repurposed as an accent on fast-travel deep-link jumps,
  not every click.
- **Custom cursor states:** magnetic blob cursor gains contextual labels — "Explore"
  (corridor), "Enter ↗" (project), "Visit site" (live embed), "Drag" (draggable). Cursor
  subtly refracts the WebGL behind it near interactive elements.
- **Choreographed scroll copy:** keep `data-scrub-words` / `data-reveal` split-text;
  tighten timing so text scatters/reforms as stations enter.
- **Micro-details:** magnetic buttons (have), scroll-velocity RGB aberration (have),
  side scroll-progress + station indicator, optional sound-on-hover (off by default),
  refined preloader previewing the tubes assembling as assets load.

---

## 6. Visual System — Typography, Color, Layout

- **Commit to dark theme.** Near-black `#0D0D0F` base (already in palette tokens); violet/
  cyan/lime as luminous accents. Light mode optional toggle, but dark is the identity.
  (Current light `#F2F1EF` fights the neon.)
- **Typography as spectacle:** variable Archivo pushed to oversized editorial display
  weights (viewport-scale titles); JetBrains Mono as technical counterpoint for labels/
  metadata. One expressive kinetic headline per section reacting to scroll.
- **Space & pacing:** more breathing room, cinematic vertical rhythm, deliberate emptiness
  before big moments.
- **Grain + light:** keep film grain (`_grain.scss`); add subtle vignette + chromatic
  bloom so the frame feels lit, not flat.

---

## 7. Performance, Accessibility & Fallback

Guardrails so "maximalist" ≠ "broken on half of devices."

### Performance budget
- 60fps desktop / 30fps floor mobile; < 3s time-to-interactive.
- Distance-culling: only 1–2 stations render at once.
- Texture compression (KTX2/basis) for screenshots; lazy-load rooms on approach.

### Three-tier quality (via existing `quality.js` + `lowPower` / `reducedMotion`)
- **Full** — all live WebGL.
- **Reduced** — fewer tubes, simpler shaders.
- **Baked** — hero video loop + flat scroll (mobile default).
- Auto-detected, with manual override.

### Accessibility
- `prefers-reduced-motion` fully honored (static/baked, no camera flight).
- Every station keyboard-navigable; live-site embeds have real `<a>` fallbacks.
- All copy in real DOM (SEO + screen readers); canvas decorative (`aria-hidden`).
- Real URLs preserved per project (History API) — pages shareable + indexable.

### Progressive boot
Site readable/usable before WebGL finishes; heavy assets stream in; no blank-screen wait.

---

## 8. Open Items / User Inputs Needed

- **Real project data:** for each live client site — slug, title, sector, year, tags,
  roles, brief, approach, quote (+author), 3 metrics, **live URL**, and screenshots
  (desktop + mobile, key pages). User will capture screenshots.
- **Number of real projects** to feature (current placeholder count is 8).
- **Baked-asset tooling:** whether the user can produce a pre-rendered hero video for the
  mobile/baked tier, or whether we generate it from the real-time scene (e.g. capture a
  canvas recording) as the fallback source.
- **Light-mode toggle:** keep as option, or go dark-only.

---

## 9. Out of Scope (YAGNI)

- CMS integration (project data stays in `projects.js` for now).
- Real Houdini/Redshift sim pipeline (we use curl-noise real-time + optional canvas-captured
  baked fallback, not a full DCC render farm).
- Multilingual content.
- Sound design beyond an optional off-by-default hover toggle.
