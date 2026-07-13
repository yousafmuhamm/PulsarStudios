# Real Projects Showcase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 8 fictional projects with the user's 8 real client sites, presented in a full-screen A+C gallery on `/projects` (brand-tinted slides + drifting index rail + live-site links), while keeping the home carousel unchanged with real screenshots.

**Architecture:** The site generates all HTML at build time from `src/data/projects.js` + template functions in `src/templates/pages.js` (driven by `scripts/pages-plugin.js`). We swap the data to real projects, capture real screenshots as assets, rewrite the `/projects` template + page module + styles into the A+C gallery, drop the per-project detail pages, and leave the home carousel's markup/animation untouched.

**Tech Stack:** Vite 8, vanilla JS, GSAP + Lenis, SCSS, the custom `pulsar-pages` build plugin. No test framework — verification is build-output + on-device/visual checks (consistent with prior phases).

## Global Constraints

- **Project order (fixed):** `dr-shiny, xandrea-harshey, chick-n-fish, demarks360, trail-construction, west-pine, yeong-won, bw-plumbing`.
- **Live URLs (verbatim):** dr-shiny=`https://www.drshinycarwash.com`, xandrea-harshey=`https://www.xandreaharshey.com`, chick-n-fish=`https://chicknfish.ca`, demarks360=`https://demarks360.ca`, trail-construction=`https://trail-construction-ltd.vercel.app`, west-pine=`https://west-pine-strategies.vercel.app`, yeong-won=`https://soap-phi.vercel.app`, bw-plumbing=`https://have-not-decided-yet.vercel.app`.
- **Truthful copy only** — no fabricated metrics, quotes, testimonials, or roles.
- **Dark theme + electric accents** (Phase 2) — gallery lives in it; per-slide tint layers the project's palette accent over `#0d0d0f`.
- **60fps desktop + mobile** — no per-frame JS transform writes (Phase-3 scroll-rail lesson). Use CSS scroll-snap + `animation-timeline: scroll()` + IntersectionObserver.
- **No WebGL on touch** (mobile policy) — the gallery is pure DOM/CSS, so it already satisfies this.
- **HTML files are generated + gitignored** — edit templates/data, never the generated `.html`. Rebuild to regenerate.
- **Branch safety** — all work on `redesign/phase-4-projects`; `main` keeps the current showcase.
- **Visit-live links:** `<a href="{url}" target="_blank" rel="noopener">Visit live site ↗</a>`.
- **Frequent commits**, one per task. Prefix `feat:` / `content:` / `refactor:` / `chore:`.

---

## Task 1: Real project data

**Files:**
- Modify: `src/data/projects.js` (replace the 8 entries + `getProject`/`nextProject` stay)

**Interfaces:**
- Produces: `projects` array of 8 objects with fields `{ slug, title, sector, city, year, url, tagline, tags, palette }`. `getProject(slug)` and `nextProject(slug)` unchanged. Consumed by every template + the pages plugin.

- [ ] **Step 1: Replace the `projects` array** with the 8 real entries (keep the file's header comment updated to reflect real work + screenshot naming). Use exactly these (truthful, drawn from the live sites — user has approved correcting any):

```js
export const projects = [
  {
    slug: 'dr-shiny', title: 'Dr Shiny', sector: 'Mobile Car Wash', city: 'Calgary', year: '2025',
    url: 'https://www.drshinycarwash.com',
    tagline: 'Premium mobile car wash & detailing, booked in under a minute.',
    tags: ['web', 'design', 'booking ux'], palette: ['#31c6e8', '#0d1b2a'],
  },
  {
    slug: 'xandrea-harshey', title: 'Xandrea Harshey', sector: 'Enterprise Group', city: 'Calgary', year: '2025',
    url: 'https://www.xandreaharshey.com',
    tagline: 'A multi-company enterprise brand built to signal scale and trust.',
    tags: ['web', 'design', 'brand'], palette: ['#c9a24b', '#15171c'],
  },
  {
    slug: 'chick-n-fish', title: 'Chick N Fish', sector: 'Restaurant', city: 'Calgary', year: '2025',
    url: 'https://chicknfish.ca',
    tagline: 'A halal fish & chips shop with appetite-first online ordering.',
    tags: ['web', 'design', 'ordering'], palette: ['#c0603a', '#1c2b22'],
  },
  {
    slug: 'demarks360', title: 'Demarks360', sector: 'Events', city: 'Calgary', year: '2025',
    url: 'https://demarks360.ca',
    tagline: 'A cinematic 360° slow-motion video booth, booked around dates.',
    tags: ['web', 'design', 'motion'], palette: ['#e0b25a', '#141008'],
  },
  {
    slug: 'trail-construction', title: 'Trail Construction', sector: 'Construction', city: 'Alberta', year: '2025',
    url: 'https://trail-construction-ltd.vercel.app',
    tagline: 'Structural carpentry and beam installs, building since 1988.',
    tags: ['web', 'design', 'lead-gen'], palette: ['#4a9d5b', '#14170f'],
  },
  {
    slug: 'west-pine', title: 'West Pine Strategies', sector: 'Property Management', city: 'Calgary', year: '2025',
    url: 'https://west-pine-strategies.vercel.app',
    tagline: 'Luxury furnished rentals and hands-on property management.',
    tags: ['web', 'design', 'brand'], palette: ['#c9a24b', '#14161b'],
  },
  {
    slug: 'yeong-won', title: 'Yeong Won', sector: 'Skincare Brand', city: '—', year: '2025',
    url: 'https://soap-phi.vercel.app',
    tagline: 'A luxury stem-cell renewal soap, presented like a treatment.',
    tags: ['web', 'design', 'brand'], palette: ['#b79a7d', '#17130f'],
  },
  {
    slug: 'bw-plumbing', title: 'BW Plumbing', sector: 'Plumbing', city: 'Calgary', year: '2025',
    url: 'https://have-not-decided-yet.vercel.app',
    tagline: 'Trusted Calgary plumbing and Poly-B replacement, done right.',
    tags: ['web', 'design', 'lead-gen'], palette: ['#3b7dd8', '#0e1524'],
  },
];
```

- [ ] **Step 2: Keep `getProject` and `nextProject`** exactly as they are at the bottom of the file (the gallery index uses `nextProject`).
- [ ] **Step 3: Build to confirm no reference breaks yet.** Run `npm run build`. It WILL still generate the old detail pages/art from the templates (those are removed in later tasks) — that's expected; just confirm the build doesn't crash on the new data shape.
  Expected: build succeeds. (Templates referencing removed fields like `p.brief` may render empty strings — fine for now; Task 4/5 rewrite them.)
- [ ] **Step 4: Commit.**
```bash
git add src/data/projects.js
git commit -m "content: replace placeholder projects with 8 real client sites"
```

## Task 2: Capture + process real screenshots

**Files:**
- Create: `public/assets/img/projects/<slug>-hero.png` and `<slug>-thumb.png` for all 8 slugs (real screenshots)
- Modify: `scripts/pages-plugin.js` (stop generating placeholder SVG art — see Step 4)

**Interfaces:**
- Produces: real raster screenshots at the paths the home carousel (`<slug>-thumb`) and gallery (`<slug>-hero`) reference. Note the extension changes from `.svg` to `.png` — templates in later tasks must reference `.png`.

- [ ] **Step 1: Capture full desktop screenshots** of all 8 live sites (URLs in Global Constraints). Use agent-browser (installed at `/Users/muhammadyousaf/.npm-global/bin/agent-browser`): for each, `agent-browser open <url>`, `wait --load networkidle`, then `screenshot`. Hero shots already exist in `/tmp/real-sites/` (`1-drshiny.png` … `8-undecided.png`) — reuse those, mapping by the order in Global Constraints.
- [ ] **Step 2: Produce two sizes per project** into `public/assets/img/projects/`:
  - `<slug>-hero.png` — the large gallery image (≤ ~1600px wide, compressed).
  - `<slug>-thumb.png` — the home-carousel thumb (≤ ~1200px wide, compressed).
  Use `sips` (macOS, no deps) to resize/compress, e.g. `sips -Z 1600 --setProperty formatOptions 70 /tmp/real-sites/1-drshiny.png --out public/assets/img/projects/dr-shiny-hero.png`. Keep each file reasonably small (target < ~250KB); if a PNG is large, convert to a compressed format the build accepts.
- [ ] **Step 3: Verify all 16 files exist** and are non-trivial size: `ls -la public/assets/img/projects/*-hero.png public/assets/img/projects/*-thumb.png` → 16 files, none 0 bytes.
- [ ] **Step 4: Stop generating placeholder SVG art.** In `scripts/pages-plugin.js`, remove the four `write('public/assets/img/projects/${p.slug}-{thumb,hero,a,b}.svg', projectArt(...))` lines inside the `projects.forEach` loop, and remove the now-unused `projectArt` import + its `loadFresh('src/templates/placeholder.js')` line. Delete the old placeholder SVGs: `rm -f public/assets/img/projects/*.svg` (they're for the old fake slugs).
- [ ] **Step 5: Build + confirm no missing-asset or `projectArt` errors.** Run `npm run build`. Expected: builds; no reference to `projectArt`.
- [ ] **Step 6: Commit.**
```bash
git add public/assets/img/projects/ scripts/pages-plugin.js
git commit -m "feat: real project screenshots; stop generating placeholder SVG art"
```

## Task 3: Home carousel uses real screenshots (no layout change)

**Files:**
- Modify: `src/templates/pages.js` (the `renderHome` work-card markup — image `src` + alt, tags, name)

**Interfaces:**
- Consumes: `projects` (Task 1), `<slug>-thumb.png` (Task 2).
- Produces: unchanged home layout/animation; cards now show real work.

- [ ] **Step 1: Point the work-card `<img>` at the real thumbs.** In `renderHome` (in `src/templates/pages.js`), the work cards reference `/assets/img/projects/<slug>-thumb.svg`. Change the extension to `.png` and ensure the `alt` uses the real title/sector (e.g. `${p.title} — ${p.sector} · Pulsar Studios`). Ensure tags render from `p.tags` and the name from `p.title`. Do NOT change any class names, `data-*` attributes, structure, or the pinned-carousel/GL-hover wiring.
- [ ] **Step 2: Build + visually verify the home carousel** shows the 8 real thumbnails with correct names/tags, and the pinned horizontal scroll + hover still work. Run `npm run build && npm run preview`; open `/`, scroll to Featured Work. (Use agent-browser to screenshot if helpful.)
  Expected: real screenshots in the carousel; layout/animation identical to before.
- [ ] **Step 3: Commit.**
```bash
git add src/templates/pages.js
git commit -m "feat: home carousel shows real project screenshots"
```

## Task 4: The A+C gallery template (`/projects`)

**Files:**
- Modify: `src/templates/pages.js` (rewrite `renderProjectsList` into the gallery markup)

**Interfaces:**
- Consumes: `projects` (Task 1), `<slug>-hero.png` (Task 2).
- Produces: `renderProjectsList(projects)` returns the full `/projects.html` gallery. Markup contract for Task 6 (JS) and Task 5 (CSS): each slide is `<section class="gslide" data-gslide data-index="N" style="--slide-accent:{palette[0]}; --slide-deep:{palette[1]}">`; the index rail is `<nav class="gindex" data-gindex>` with `<button class="gindex__item" data-gindex-to="N">`; the progress fill is `<span class="gindex__progress" data-gallery-progress>`.

- [ ] **Step 1: Rewrite `renderProjectsList(projects)`** to emit the gallery. Keep the shared chrome (header/menu/contact/veil/preloader/footer) exactly as the other pages use it (copy the wrapper pattern from the existing `renderProjectsList`/`renderAbout`). The `<main data-page="projects">` contains:
  - A `<div class="gallery" data-gallery>` wrapping 8 slides.
  - Per project, a slide:
    ```html
    <section class="gslide" data-gslide data-index="${i}"
             style="--slide-accent:${p.palette[0]}; --slide-deep:${p.palette[1]}">
      <div class="gslide__bg"></div>
      <figure class="gslide__media">
        <img src="/assets/img/projects/${p.slug}-hero.png" alt="${p.title} — ${p.sector}"
             loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">
      </figure>
      <div class="gslide__info">
        <p class="mono gslide__eyebrow">Project ${String(i + 1).padStart(2, '0')} / 08 · ${p.city}</p>
        <h2 class="gslide__name" data-reveal="scatter">${p.title}</h2>
        <p class="mono gslide__meta">${p.sector} · ${p.tags.join(' · ')} · ${p.year}</p>
        <p class="gslide__tagline">${p.tagline}</p>
        <a class="gslide__visit pill pill--ghost" href="${p.url}" target="_blank" rel="noopener" data-magnetic data-cursor="Visit site">Visit live site &#8599;</a>
      </div>
    </section>
    ```
  - After the slides, the index rail + progress:
    ```html
    <nav class="gindex" data-gindex aria-label="Project index">
      ${projects.map((p, i) => `<button class="gindex__item" type="button" data-gindex-to="${i}"><span class="gindex__bar"></span>${p.title}<span class="mono gindex__n">${String(i + 1).padStart(2, '0')}</span></button>`).join('')}
    </nav>
    <div class="gindex__progress-track" aria-hidden="true"><span class="gindex__progress" data-gallery-progress></span></div>
    ```
- [ ] **Step 2: Update the `<head>` title/description** for the projects page to reflect real work (e.g. title "Work — Pulsar Studios", description mentioning real client sites). Keep canonical `/projects.html`.
- [ ] **Step 3: Build + confirm `/projects.html` generates** with 8 slides + index. Run `npm run build`; `grep -c 'data-gslide' projects.html` → 8; `grep -c 'data-gindex-to' projects.html` → 8.
- [ ] **Step 4: Commit.**
```bash
git add src/templates/pages.js
git commit -m "feat: A+C gallery markup for the projects page"
```

## Task 5: Gallery styles (`_gallery.scss`)

**Files:**
- Create: `src/styles/_gallery.scss`
- Modify: `src/styles/main.scss` (import the partial)
- Modify: `src/styles/_projects.scss` (remove old list styles OR leave if the home carousel references them — verify first)

**Interfaces:**
- Consumes: the markup classes from Task 4 (`gslide`, `gindex`, etc.) and CSS vars `--slide-accent` / `--slide-deep`.
- Produces: the full-screen snap gallery visuals; 60fps (no JS-driven transforms).

- [ ] **Step 1: Create `src/styles/_gallery.scss`** implementing:
  - `.gallery` — the scroll container: `scroll-snap-type: y mandatory; height: 100vh; overflow-y: auto;` (or let the page scroll and snap sections — pick page-level snap: apply `scroll-snap-align: start` to `.gslide` and rely on the document scroller so Lenis/ScrollTrigger stay consistent). Each `.gslide` is `min-height: 100svh; scroll-snap-align: start; position: relative; display: flex; align-items: flex-end;`.
  - `.gslide__bg` — `position:absolute; inset:0;` background `radial-gradient(60% 70% at 72% 42%, var(--slide-accent), transparent 70%)` over `var(--slide-deep)`; subtle, sits behind media.
  - `.gslide__media img` — large, floated toward the right, `border-radius`, big shadow, slight `rotate(-2deg)`; `max-width` and responsive; on mobile it stacks above the info.
  - `.gslide__name` — viewport-scale display type (reuse `--wt-display`, tight tracking), light on the tinted bg.
  - `.gslide__visit` — the pill (already styled globally); ensure it reads on the tint.
  - `.gindex` — `position: fixed; right: clamp(16px,2vw,32px); top: 50%; transform: translateY(-50%);` column of buttons, right-aligned; active item (`.is-active`) gets full opacity + the lime `.gindex__bar`. Hidden `@media (max-width: 720px)` (mobile uses the progress bar instead).
  - `.gindex__progress-track` — fixed thin bar (bottom on mobile, or along the rail on desktop); `.gindex__progress` fills via `animation-timeline: scroll()` (compositor-only, like the Phase-3 global rail).
  - Reduced-motion: no float/tilt transitions; static.
- [ ] **Step 2: Import it** — add `@use 'gallery';` (or `@import`, matching the file's existing convention) to `src/styles/main.scss`.
- [ ] **Step 3: Reconcile `_projects.scss`** — `grep -rn "plist\|projects__\|work-card" src/templates/pages.js` to see if the old projects-list classes are still referenced anywhere. If the gallery fully replaces the list and nothing else uses those classes, delete the dead rules from `_projects.scss`; if the home carousel or another page uses shared classes there, leave those. Document what you kept/removed.
- [ ] **Step 4: Build + visually verify** the gallery: full-screen slides, snap scroll, the index rail on the right, per-slide brand tint, the screenshot floating. Run `npm run build && npm run preview`; open `/projects.html`. Screenshot with agent-browser.
  Expected: premium full-screen gallery; each slide tinted to its brand; index rail present.
- [ ] **Step 5: Commit.**
```bash
git add src/styles/_gallery.scss src/styles/main.scss src/styles/_projects.scss
git commit -m "feat: full-screen A+C gallery styles"
```

## Task 6: Gallery behaviour (`pages/projects.js`)

**Files:**
- Modify: `src/pages/projects.js` (rewrite: index-rail active tracking + click-to-navigate; drop the old plist float logic)

**Interfaces:**
- Consumes: markup from Task 4 (`[data-gslide]`, `[data-gindex]`, `[data-gindex-to]`). Uses `basePage` wrapper (existing) and the reveals system (scatter fires automatically via `data-reveal="scatter"` — no work needed here).
- Produces: `createProjectsPage(main)` returning the `basePage`-wrapped page object. No WebGL. No per-frame scroll JS.

- [ ] **Step 1: Rewrite `createProjectsPage`** to:
  - Query `const slides = qsa('[data-gslide]', main)` and `const items = qsa('[data-gindex-to]', main)`.
  - **Active tracking via IntersectionObserver** (cheap, no scroll-frame JS): observe each slide with `threshold: 0.5`; on intersect, add `.is-active` to the matching `items[index]` and remove from the rest.
  - **Click-to-navigate:** each `[data-gindex-to]` button on click → `slides[+btn.dataset.gindexTo].scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })`.
  - Register the observer + listeners; return cleanup that disconnects the observer and removes listeners (mirror the existing cleanup pattern with `basePage`).
  - Guard for empty (`if (!slides.length) return basePage(main, {})`).
- [ ] **Step 2: Remove the old plist float/hover code** entirely (the cursor-chasing thumbnail logic) — the gallery doesn't use it.
- [ ] **Step 3: Confirm the page module is wired** — check `src/pages/index.js` (`makePage`) maps `data-page="projects"` to `createProjectsPage`; it already does (we're rewriting the same module), so no change unless the export name changed (keep `createProjectsPage`).
- [ ] **Step 4: Build + verify interaction** — `npm run build && npm run preview`, open `/projects.html`: scrolling lights the correct index item; clicking an index name scrolls to that slide; the names scatter in on enter. Use agent-browser to confirm the active class toggles (`eval` reading `.is-active`).
  Expected: index tracks scroll; click navigates; scatter plays; no console errors.
- [ ] **Step 5: Commit.**
```bash
git add src/pages/projects.js
git commit -m "feat: gallery index tracking + click-to-navigate (no per-frame JS)"
```

## Task 7: Drop per-project detail pages + fix sitemap

**Files:**
- Modify: `scripts/pages-plugin.js` (stop generating `projects/<slug>.html`; fix sitemap URLs)
- Modify: `src/templates/pages.js` (remove `renderProjectDetail` if now unused)
- Delete: generated `projects/*.html` (gitignored, just stop generating + remove any committed ones)

**Interfaces:**
- Consumes: nothing new.
- Produces: no `/projects/<slug>.html` pages; sitemap lists only `/`, `/about.html`, `/projects.html`.

- [ ] **Step 1: Stop generating detail pages.** In `scripts/pages-plugin.js`, remove the `inputs[\`project-${p.slug}\`] = write(\`projects/${p.slug}.html\`, renderProjectDetail(...))` line from the `projects.forEach` loop (the whole loop may now be empty after Task 2 removed the art writes — if so, remove the `projects.forEach` entirely). Remove `renderProjectDetail` from the destructured `loadFresh('src/templates/pages.js')` import.
- [ ] **Step 2: Fix the sitemap** — change the `urls` line to `const urls = ['/', '/about.html', '/projects.html'];` (drop the `...projects.map(... /projects/<slug>.html)`).
- [ ] **Step 3: Remove `renderProjectDetail`** from `src/templates/pages.js` if nothing references it anymore (`grep -rn renderProjectDetail src/ scripts/`). Also remove `src/templates/placeholder.js` if `projectArt` is now unreferenced (`grep -rn projectArt src/ scripts/`) — delete the file if dead.
- [ ] **Step 4: Delete stale generated detail pages** from disk: `rm -rf projects/` (the generated `projects/<slug>.html` dir; it's gitignored). Confirm the build no longer recreates it: `npm run build && ls projects/ 2>/dev/null && echo "STILL THERE" || echo "gone"`.
- [ ] **Step 5: Build + confirm** only `/`, `/about.html`, `/projects.html` generate, and `grep -c "<loc>" public/sitemap.xml` → 3. No dead imports.
- [ ] **Step 6: Commit.**
```bash
git add scripts/pages-plugin.js src/templates/pages.js public/sitemap.xml
git commit -m "chore: drop per-project detail pages; link to live sites instead"
```

## Task 8: Full verification sweep

**Files:** none (verification + docs)

- [ ] **Step 1: Full build + smoke** — `npm run build && npm run preview`. Visit `/` (home carousel = real work), `/about.html` (unchanged), `/projects.html` (gallery). All render, no console errors. Screenshot each with agent-browser.
- [ ] **Step 2: Verify the 8 live links** open the correct sites (`grep -o 'href="https://[^"]*"' projects.html` lists the 8 real URLs; spot-check they match Global Constraints).
- [ ] **Step 3: Reduced-motion + no-WebGL check** — emulate `prefers-reduced-motion`; the gallery must be readable/navigable with no scatter/parallax. Confirm the gallery uses no WebGL (no `[data-gl]` dependency on the projects page).
- [ ] **Step 4: Perf sanity** — the gallery must hold 60fps (no per-frame JS). This is the Phase-3 lesson; the design uses IntersectionObserver + CSS scroll-timeline only. Note for the user to confirm on their M3 Pro + phone (the reliable measurement).
- [ ] **Step 5: Update the design spec's open items** — mark the taglines/URL as resolved in a short note, or leave the spec as the record.

## Self-Review Notes

- **Spec coverage:** data model → Task 1; screenshots → Task 2; home unchanged → Task 3; A+C gallery (markup/style/behaviour) → Tasks 4/5/6; case pages dropped + sitemap → Task 7; verification → Task 8. All spec sections mapped. ✔
- **No test framework:** verification is build-output + visual/on-device, consistent with Phases 1–3. Each task has a concrete "Expected" observation.
- **Type/name consistency:** data fields (`slug/title/sector/city/year/url/tagline/tags/palette`) are used identically across Tasks 1/3/4; markup contract (`data-gslide`, `data-gindex-to`, `--slide-accent`) defined in Task 4 and consumed verbatim in Tasks 5/6.
- **Ordering:** Task 1 (data) → 2 (assets) unblock everything; 3/4/5/6 build the surfaces; 7 cleans up; 8 verifies. Tasks 4→5→6 are sequential (shared markup contract). Screenshots (Task 2) gate the visual tasks.
- **Risk:** the gallery's scroll-snap + Lenis interaction is the main unknown — Task 5 Step 1 notes to use document-level snap so Lenis/ScrollTrigger stay consistent; Task 8 flags the on-device perf check.
