# PULSAR STUDIOS®

Production-quality agency website — Lusion-inspired experience architecture:
smooth-scroll storytelling, a real-time WebGL hero, kinetic typography,
seamless page transitions.

## Stack

- **Vite** (vanilla JS, ES modules) — no framework
- **Three.js** — persistent WebGL layer (hero orb cluster, card hover distortion)
- **GSAP + ScrollTrigger** — all animation and scroll choreography
- **Lenis** — smooth scrolling, synced to ScrollTrigger via the gsap ticker
- **SCSS** — design tokens as CSS custom properties
- Hand-rolled client-side router — fetches pages, swaps `<main>`, runs the
  curved-veil transition; the WebGL canvas and chrome survive navigation

## Commands

```bash
npm install
npm run dev        # dev server (pages are generated on boot; template/data edits full-reload)
npm run build      # production build → dist/
npm run preview    # serve the production build
```

## How pages are made

Every HTML file is **generated** from template functions — don't edit
`index.html` & co. directly (they're gitignored build artifacts):

| Source                        | Generates                              |
| ----------------------------- | -------------------------------------- |
| `src/data/projects.js`        | all case-study content (8 projects)    |
| `src/templates/pages.js`      | Home, About, Projects, project details |
| `src/templates/chrome.js`     | header, menu, contact, footer, veil    |
| `src/templates/placeholder.js`| deterministic SVG placeholder art      |
| `scripts/pages-plugin.js`     | the Vite plugin that writes it all     |

## Swapping in real content

1. **Projects** — edit `src/data/projects.js` (title, brief, approach, quote,
   stats, palette). Pages, listing rows, home cards and sitemap update on save.
2. **Images** — replace the generated files in `public/assets/img/projects/`
   with real `…-thumb / -hero / -a / -b` assets, and change the `.svg`
   extension in the `img()` helper of `src/templates/pages.js` (one line).
   Keep 4:3 for thumb/a/b and 16:10 for hero.
3. **Reel** — `src/ui/reel.js` currently draws a canvas placeholder; swap the
   `<canvas>` for a `<video>` in `src/templates/chrome.js` and drop the ticker.
4. **Team / brands / stats** — constants at the top of `src/templates/pages.js`.
5. **Domain** — search `pulsarstudios.com` (canonical/OG/sitemap in
   `src/templates/chrome.js` + `scripts/pages-plugin.js`).

## Architecture notes

- Page modules (`src/pages/*`) export `init / enter / destroy`; `destroy`
  kills all ScrollTriggers (via `gsap.context`) and disposes GL resources —
  `ScrollTrigger.getAll().length` stays flat across navigations.
- `prefers-reduced-motion`: Lenis off, reveals become plain fades, the GL
  scene renders one static frame.
- Touch devices: no custom cursor/magnetics, Featured Work becomes a native
  swipe carousel.

## Performance & interactivity systems

- **Adaptive quality** (`src/gl/quality.js`): a frame-time watchdog on the
  gsap ticker moves a 0..1 `tier.value` down when the machine can't hold
  ~60fps and back up when it has headroom (fast drop, slow recover, with
  hysteresis so it never oscillates). The renderer reads it for live DPR;
  post reads it to halve bloom passes and thin effects under stress. One
  build, lush on an M-series Mac and smooth on weak hardware.
- **Scroll-sync (anti-jank)** (`src/gl/cardsScene.js`): the Lusion lesson —
  a fixed canvas reading `getBoundingClientRect()` mid-tick catches
  compositor-moved positions and the planes drift/snap. Fix: batch all rect
  reads at the top of the tick (one layout flush) and lerp each plane toward
  its slot so desync resolves as smooth motion. Measured worst-frame during
  scroll dropped from ~56ms to ~22ms.
- **Tab pause**: the render loop stops entirely when `document.hidden`.
- **3D**: project cards use a perspective camera and tilt/pop toward the
  cursor (`rotate3d`-style, lerped). The hero orb has a procedural
  environment reflection (glossy 3D read, no cubemap) and depth-based Z
  parallax so blobs separate by distance under the pointer. Scroll velocity
  feeds blob surface turbulence + composite RGB-split (`glx.pumpAberration`).
