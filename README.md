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
