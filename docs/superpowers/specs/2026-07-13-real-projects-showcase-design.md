# Phase 4 — Real Projects Showcase (A+C Full-Screen Gallery)

**Date:** 2026-07-13
**Status:** Draft for review
**Author:** Brainstormed with Claude (superpowers/brainstorming + visual companion)

---

## 1. Goal & Context

Replace the 8 fictional placeholder projects (Nova Labs, Kepler Finance, …) on the
Pulsar Studios site with the user's **8 real client websites**, presented in a
premium, Lusion-quality way. This is the credibility payoff of the whole redesign:
the studio's own site finally shows real work.

The user's 8 live sites (presentation order fixed by the user):

| # | Slug | Name | Industry / one-liner | Live URL | Palette (from site) |
|---|------|------|----------------------|----------|---------------------|
| 1 | `dr-shiny` | Dr Shiny | Mobile car wash & detailing, Calgary — booking-first site | https://www.drshinycarwash.com | cyan/teal on dark (#31c6e8) |
| 2 | `xandrea-harshey` | Xandrea Harshey | Multi-company enterprise / holding co | https://www.xandreaharshey.com | gold on charcoal |
| 3 | `chick-n-fish` | Chick N Fish | Halal fish & chips restaurant, online ordering | https://chicknfish.ca | forest green on cream |
| 4 | `demarks360` | Demarks360 | 360° slow-motion event video booth, Calgary | https://demarks360.ca | champagne/gold |
| 5 | `trail-construction` | Trail Construction | Structural carpentry & beam installs, Alberta (since 1988) | https://trail-construction-ltd.vercel.app | green on dark |
| 6 | `west-pine` | West Pine Strategies | Luxury furnished rentals & property management, Calgary | https://west-pine-strategies.vercel.app | gold/cream |
| 7 | `yeong-won` | Yeong Won | Luxury stemcell renewal soap / skincare brand | https://soap-phi.vercel.app | warm neutral |
| 8 | `bw-plumbing` | BW Plumbing | Plumbing & Poly-B replacement, Calgary | https://have-not-decided-yet.vercel.app | navy/blue |

Screenshots of all 8 captured to `/tmp/real-sites/` during brainstorming (desktop
hero shots). These get processed into project assets.

### Decisions locked during brainstorming
- **Content: minimal + truthful.** Per project: number, name, city, a short **real**
  one-liner (industry · what it does · year), the live URL, and a prominent
  **"Visit live site ↗"**. **No fabricated metrics, quotes, or testimonials** —
  these are real clients; invented claims could backfire. Screenshots + animation
  do the selling.
- **Presentation: A+C hybrid full-screen gallery** (validated visually):
  full-bleed brand-tinted slides (A) + a drifting right-side index rail (C) +
  progress rail.
- **Home page: UNCHANGED.** Keep the existing horizontal "Featured Work" carousel
  and its WebGL card-hover effects exactly as-is; only swap in real screenshots +
  names. No layout change.
- **Individual case-study pages (`/projects/<slug>.html`): DROPPED.** With minimal
  copy and a live URL for every project, a thin internal page adds nothing; the
  gallery links straight to the live site.
- **Safety: build on a branch.** The current showcase stays on `main`. Merge the
  new gallery only if it lands; otherwise nothing is lost.

---

## 2. Data Model Changes

`src/data/projects.js` currently has fields: `slug, title, sector, year, tags,
roles, palette, brief, approach, quote, quoteAuthor, stats`. For real projects we
simplify to the truthful minimum and add the live URL:

```js
{
  slug: 'dr-shiny',
  title: 'Dr Shiny',
  sector: 'Mobile Car Wash',      // short industry label
  city: 'Calgary',                // NEW — shown in slide meta
  year: '2025',
  url: 'https://www.drshinycarwash.com',   // NEW — the live site
  tagline: 'Premium mobile detailing, booked in under a minute.', // NEW — one real sentence
  tags: ['web', 'design', 'booking ux'],   // kept — small mono chips
  palette: ['#31c6e8', '#0d1b2a'],         // kept — drives the per-slide tint [accent, deep]
}
```

- **Removed for real projects:** `brief`, `approach`, `quote`, `quoteAuthor`,
  `stats`, `roles` (roles optional — drop unless we want the small credits line).
- **Added:** `city`, `url`, `tagline`.
- `getProject(slug)` / `nextProject(slug)` helpers stay (nextProject still used by
  the gallery's index navigation).
- The 8 entries are replaced with the real data above, in the fixed order.

## 3. Assets (screenshots)

- Capture clean desktop screenshots of each of the 8 live sites (already have hero
  shots in `/tmp/real-sites/`; may re-capture full-page or key sections).
- Process into the existing naming scheme under
  `public/assets/img/projects/`: at minimum `<slug>-thumb` (home carousel) and
  `<slug>-hero` (gallery slide). Format: compressed (WebP/AVIF or optimized PNG);
  the current placeholders are SVG — real screenshots will be raster, so keep them
  reasonably sized and `loading="lazy"` where offscreen.
- The home carousel already references `<slug>-thumb`; the new gallery references
  `<slug>-hero`.

## 4. The New Gallery — `/projects.html` (A+C hybrid)

A full-screen, snap-scrolling gallery. One project owns the viewport at a time.

### Layout (per slide)
- **Full-bleed media**: the site's screenshot, floated large with a subtle tilt +
  parallax; behind it, a background tinted toward the project's `palette` accent
  (radial glow).
- **Name block (bottom-left)**: eyebrow (`Project 0N / 08 · City`), huge project
  name (viewport-scale display type), a mono meta line
  (`sector · tags · year`), and a **Visit live site ↗** pill linking to `url`
  (opens in new tab, `rel="noopener"`).
- **Index rail (right, from C)**: all 8 names always visible; the active one lit
  with the lime tick. Clicking a name flies/snaps to that slide. Doubles as a table
  of contents.
- **Progress rail (bottom)**: fills 0→1 across the 8 slides (reuse the CSS
  scroll-timeline approach from the global rail — compositor-only, no per-frame JS).

### Motion (Lusion-quality, honors reduced-motion + mobile)
- **On slide enter**: screenshot floats in with parallax + tilt; the giant name
  **scatters/reforms** (reuse the `data-reveal="scatter"` we built in Phase 3);
  background tint eases toward the brand accent.
- **Snap scroll** between slides (CSS scroll-snap; native, cheap).
- **Index rail** active-state tracks the current slide (IntersectionObserver per
  slide — cheap, no scroll-frame JS).
- **Reduced-motion**: no scatter/parallax — plain fade, static tint.
- **Mobile (touch)**: NO WebGL (consistent with the Phase-4-prior mobile policy);
  the gallery is pure CSS/DOM — screenshots + scroll-snap + the index collapses to a
  slim dots/progress indicator. Must stay 60fps on phone (no continuous JS loop).

### Structure / files
- New page template for the gallery in `src/templates/pages.js` (or a dedicated
  `src/templates/gallery.js` if the page function grows large — split by
  responsibility). Generates `/projects.html` from `projects` data.
- New behaviour module `src/pages/projects.js` (already exists — rewrite it) for
  the index-rail active tracking + click-to-navigate + scatter triggers. No WebGL
  dependency (the gallery uses screenshots, not GL planes) so it stays light and
  works on mobile.
- New SCSS partial `src/styles/_gallery.scss` for the slide/index/rail styles;
  imported in `main.scss`. The old `_projects.scss` (grid) can be removed once the
  gallery replaces it, OR kept if the home carousel references it — verify before
  deleting.

## 5. Home Page — Unchanged (real data only)

- Keep the existing horizontal "Featured Work" carousel, its pin/scroll behaviour,
  and the WebGL card-hover distortion **exactly as-is**.
- Only change: the 8 cards now reference the **real** projects (real `<slug>-thumb`
  screenshots, real names/tags) via the updated `projects` data. No layout/animation
  change. On mobile it already degrades (no WebGL) and shows the `<img>` thumbs.

## 6. Removed: Individual Case-Study Pages

- The per-project pages (`/projects/<slug>.html`) and their generation in the pages
  plugin/templates are removed. The gallery's **Visit live site ↗** replaces them.
- `nextProject()` stays (gallery index uses it); `getProject()` stays if referenced.
- Remove the placeholder project SVGs (`public/assets/img/projects/*-a/-b/-hero`
  for the old fake slugs) once real assets are in — don't leave dead placeholder art.
- Update `public/sitemap.xml` to drop the removed project URLs and keep `/`,
  `/about.html`, `/projects.html`.

## 7. Constraints (carry-over)

- **Dark theme + electric accents** (Phase 2) — the gallery lives in it; per-slide
  tint layers the brand accent over the near-black base.
- **60fps** desktop and mobile — gallery motion must not regress it. No per-frame JS
  transform writes (the Phase-3 scroll-rail lesson); prefer CSS scroll-snap /
  scroll-timeline + IntersectionObserver.
- **No WebGL on touch** — the gallery is DOM/CSS; consistent with mobile policy.
- **Truthful copy** — no invented metrics/quotes.
- **Branch safety** — new work on `redesign/phase-4-projects`; `main` keeps the
  current showcase until merge.

## 8. Open Items / Inputs

- **Real taglines/details per project**: draft truthful one-liners from the
  screenshots (industry + what the site does). User can correct any that are wrong
  (e.g. exact year, city, or a better one-line description).
- **`have-not-decided-yet.vercel.app` = BW Plumbing** — confirm this is the intended
  live URL for that project, or whether a final domain will replace it.
- **Roles/credits line**: include a small "what we did" credit per slide, or omit?
  (Default: omit — keep it minimal per the content decision.)

## 9. Out of Scope (YAGNI)

- Live iframe embeds of the client sites (deferred — link out instead; avoids
  X-Frame-Options issues and keeps it fast).
- Fabricated metrics, testimonials, case-study prose.
- CMS. Data stays in `projects.js`.
- Changing the home carousel's layout or animation.
