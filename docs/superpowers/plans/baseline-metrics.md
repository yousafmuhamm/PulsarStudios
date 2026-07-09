# Performance Baseline — Pulsar Studios Redesign

**Baseline captured:** 2026-07-09  
**Commit:** `a72320bdcfc79a06efff177963f1361f0ec82853`

## Build Information

- **Build tool:** Vite v8.1.3
- **Build command:** `npm run build`
- **Configuration:** Production minified build with code splitting
- **Build status:** Success (378ms)

## Asset Chunk Sizes

| Asset | Raw Size (KB) | Gzipped (KB) |
|-------|---------------|--------------|
| three-CrvDaWRP.js | 502.6 | 124.4 |
| gsap-DaioLQeF.js | 129.6 | 47.9 |
| main-D4qDfBnM.js | 47.4 | 16.2 |
| main-SqEKlCgC.css | 28.6 | 6.7 |

**Total JS:** 679.6 KB raw / 188.5 KB gzipped  
**Total CSS:** 28.6 KB raw / 6.7 KB gzipped  
**Total Assets:** 708.2 KB raw / 195.2 KB gzipped

## Notes

- All chunks are generated via Vite's default code splitting strategy.
- The `three` chunk contains the Three.js library and associated geometry/material utilities.
- The `gsap` chunk contains GSAP animation library dependencies.
- The `main` JS chunk contains application code and project data.
- The `main` CSS chunk contains all global styles and component styling.

## Load Performance (To Be Captured)

The following metrics should be captured manually by opening the site in a browser with DevTools Network tab, throttled to "Fast 4G":

| Metric | Value |
|--------|-------|
| Total transferred | *[User to capture via browser DevTools]* |
| Time to First Contentful Paint (FCP) | *[User to capture via browser DevTools]* |
| Time to Interactive (TTI) | *[User to capture via browser DevTools]* |
| First JS chunk blocking paint | *[User to note which chunk blocks first paint]* |

**How to capture:**
1. Run `npm run preview`
2. Open browser DevTools → Network tab
3. Set throttling to "Fast 4G"
4. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)
5. Record total transferred size, FCP time, and TTI time
6. Note which JS chunk downloads first and if it blocks rendering

## Future Optimization Targets

Based on this baseline:
- **three chunk (502.6 KB raw)** is the largest asset and primary optimization target
- **gsap chunk (129.6 KB raw)** is a secondary target for code-splitting or lazy loading opportunities
- **Total JS (679.6 KB raw)** exceeds Vite's default warning threshold of 500 KB/chunk

Recommended optimizations to measure against this baseline:
- Dynamic imports for lazy-loaded Three.js components
- GSAP feature-based tree-shaking or lazy initialization
- CSS purification and critical path optimization
- Asset preloading and font optimization
