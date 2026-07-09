# OGL Port Sub-Plan — Replace Three.js with OGL

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** Replace Three.js (~514 KB raw / 127 KB gzip) with OGL 1.0.11 (~29 KB minzip) as the WebGL engine, with the visual output matching the current site **exactly** (baseline screenshots in `docs/superpowers/plans/visual-baseline/` are the acceptance bar).

**Architecture:** OGL's API is deliberately Three-like: `Renderer` (owns the GL context), `Camera`, `Transform` (scene graph root), `Mesh`, `Program` (raw GLSL), `Geometry` / `Sphere` / `Plane`, `RenderTarget`, `Texture`, `Vec2`/`Vec3`/`Color`. The port swaps class-for-class where possible and reconciles the shader built-in differences (the main risk).

**Tech Stack:** OGL 1.0.11, Vite 8, GSAP/Lenis (unchanged), SCSS (unchanged).

## Global Constraints

- **Visual output must match the current site exactly** — verify each GL task's result against the matching baseline screenshot; the hero blob glow, card hover distortion, and bloom must look identical.
- **Preserve the public interface of `renderer.js`** — it exports `glx` (with `.init/.add/.remove/.ok/.renderOnce/.pumpAberration` and the scene contract `{ render(timeSec, dtSec), resize(w,h), dispose() }`) consumed by `main.js`, `pages/home.js`, `heroScene.js`, `cardsScene.js`. Keep these signatures identical so consumers don't change.
- **Honor `reducedMotion` / `lowPower`** flags (`src/utils/env.js`) exactly as today.
- **Keep the adaptive `quality.js` tier** working (drives DPR + bloom passes).
- **Delete `src/gl/three.js` and remove the `three` dependency only after** the whole port is verified — not before.
- **Frequent commits**, one per task. Prefix `refactor:` or `perf:`.

## OGL API Translation Reference (Three → OGL)

| Three.js | OGL 1.0.11 |
|---|---|
| `new WebGLRenderer({canvas, alpha, antialias})` | `new Renderer({canvas, alpha:true, ...})` → `renderer.gl` is the context |
| `renderer.setPixelRatio(dpr)` / `setSize(w,h)` | `renderer.dpr = dpr` / `renderer.setSize(w,h)` |
| `renderer.setRenderTarget(rt)` + `render(scene,cam)` | `renderer.render({ scene, camera, target: rt })` |
| `new Scene()` | `new Transform()` (scene-graph root) |
| `new PerspectiveCamera(fov,agilaspect,near,far)` | `new Camera(gl,{fov,aspect,near,far})` |
| `camera.position.z = 8` | `camera.position.z = 8` (same) |
| `new Group()` | `new Transform()` |
| `mesh.add`/`group.add(mesh)` | `mesh.setParent(parent)` |
| `new Mesh(geo, material)` | `new Mesh(gl, { geometry, program })` |
| `new ShaderMaterial({vertexShader, fragmentShader, uniforms, transparent, depthWrite})` | `new Program(gl, { vertex, fragment, uniforms, transparent, depthWrite, cullFace })` |
| uniforms `{ u: { value: x } }` | uniforms `{ u: { value: x } }` (same shape) |
| `new SphereGeometry(1, segs, segs)` | `new Sphere(gl, { radius:1, widthSegments:segs, heightSegments:segs })` |
| `new PlaneGeometry(1,1)` | `new Plane(gl, { width:1, height:1 })` |
| `new BufferGeometry()` + `setAttribute` | `new Geometry(gl, { position:{size,data}, uv:{...} })` |
| `new WebGLRenderTarget(w,h,{type,minFilter,...})` | `new RenderTarget(gl, { width, height, type, minFilter, magFilter, depth:false })` |
| `new CanvasTexture(canvas)` | `new Texture(gl, { image: canvas })` |
| `new Color('#6533FF')` | `new Color('#6533FF')` (OGL has Color) or pass `[r,g,b]` |
| `new Vector2/3` | `new Vec2/Vec3` |
| `THREE.HalfFloatType` | `gl.HALF_FLOAT` (or renderer ext) — OGL RenderTarget `type: gl.HALF_FLOAT` |
| `THREE.LinearFilter` etc. | `gl.LINEAR`, `gl.CLAMP_TO_EDGE` (raw GL enums) |

**Shader built-ins (CRITICAL — the main risk):** Three auto-injects `modelViewMatrix, projectionMatrix, normalMatrix, modelMatrix, position, normal, uv`. **OGL auto-injects the same names** (`modelMatrix, modelViewMatrix, projectionMatrix, normalMatrix, cameraPosition` uniforms; `position, normal, uv` attributes) — so the existing GLSL should mostly compile unchanged. BUT: OGL does not add a `precision` line automatically in all cases and does not define `viewMatrix` the same way. Verify each shader compiles; add `precision highp float;` to vertex shaders if missing (fragments already have it). If a built-in is missing, pass it as an explicit uniform.

---

## Task A: Add OGL, create the OGL renderer core (parallel file, not yet wired)

**Files:**
- Create: `src/gl/oglRenderer.js` (new — the OGL twin of `renderer.js`)
- Reference (do not modify yet): `src/gl/renderer.js`

**Interfaces:**
- Produces: `glx` object with identical surface to the current one: `init(canvas)`, `add(scene)`, `remove(scene)`, `ok` getter, `renderOnce()`, `pumpAberration(amount)`, `tick(time,dtMs)`, plus `renderer` (the OGL Renderer) and a re-exported `OGL` namespace object for scenes to use (`{ Transform, Camera, Mesh, Program, Sphere, Plane, Geometry, RenderTarget, Texture, Vec2, Vec3, Color }`).

- [ ] **Step 1:** Build `oglRenderer.js` mirroring `renderer.js`'s `GL` class structure (scene registry `Set`, gsap.ticker loop, DPR from `tier`, visibility pause, `compileAsync` → OGL has no compileAsync so just mount synchronously). Use the API translation table. Export `glx` and an `OGL` bag of the classes scenes need.
- [ ] **Step 2:** Wire the same `POST_ENABLED` gating and `tier`/`reducedMotion`/`lowPower` logic as the original.
- [ ] **Step 3:** Do NOT touch `main.js` or scenes yet. Confirm the file imports cleanly: `npm run build` still builds (the new file is unused/tree-shaken out, but must not have syntax errors — temporarily import it in `main.js` behind `if(false)` to force-include, build, then remove, OR run `node --check`-style validation via a throwaway import). 
- [ ] **Step 4:** Commit: `refactor: add OGL renderer core (parallel, unwired)`.

## Task B: Port the bloom post-processing pipeline to OGL

**Files:**
- Create: `src/gl/oglPost.js` (OGL twin of `post.js`)

**Interfaces:**
- Consumes: OGL `Renderer`, `RenderTarget`, `Program`, `Geometry` (fullscreen triangle), `Vec2`.
- Produces: `createPost(renderer)` → `{ resize(w,h), begin(), end(), dispose(), setQuality(q), setExtraShift(s) }` — identical surface to `post.js`.

- [ ] **Step 1:** Recreate the fullscreen-triangle blit, bright-pass, separable blur (same GLSL from `post.js` — the fragment shaders are plain and port verbatim), and composite (scene + bloom + RGB-split). Use OGL `RenderTarget` ping-pong. Keep `BLOOM_SCALE=0.4`, half-float targets, the exact uniform values (`uThreshold:0.55, uKnee:0.28, uBloom` logic, aberration math from `lenis.velocity`).
- [ ] **Step 2:** Match the pass-count-by-tier logic (4 passes when `quality>0.6`, else 2 — note: Task 1.4 will later change the threshold to 0.8, but port the CURRENT behavior first).
- [ ] **Step 3:** Wire `oglPost` into `oglRenderer`'s tick (begin → render scenes into target → end).
- [ ] **Step 4: Verify** — temporarily wire `oglRenderer` as the active renderer in `main.js` (feature-flag), build, `npm run preview`, and visually confirm bloom glow matches `visual-baseline/home-desktop.png`. Then revert the flag.
- [ ] **Step 5:** Commit: `refactor: port bloom post-processing to OGL`.

## Task C: Port the hero blob scene to OGL

**Files:**
- Modify: `src/gl/heroScene.js` (change imports Three→OGL, class construction; KEEP all physics/pointer/pulse logic identical)
- Reference: `src/gl/shaders.js` (blobVertex/blobFragment — GLSL unchanged unless a built-in is missing)

**Interfaces:**
- Consumes: `glx` + OGL classes from `oglRenderer`.
- Produces: `createHeroScene()` returning the same `{ scene, camera, state, render, resize, dispose }` contract.

- [ ] **Step 1:** Swap `THREE.Scene`→`Transform`, `PerspectiveCamera`→OGL `Camera`, `SphereGeometry`→`Sphere`, `ShaderMaterial`→`Program`, `Mesh`→OGL `Mesh`, `Color`→OGL `Color`, `Vector3`→`Vec3`. Keep the 5-blob config, physics loop, pointer shockwave, pulse math, collision, parallax — ALL identical.
- [ ] **Step 2:** Confirm `blobVertex`/`blobFragment` compile under OGL. Add `precision highp float;` to `blobVertex` if OGL errors on precision. Verify `normalMatrix`, `modelViewMatrix`, `projectionMatrix`, `modelMatrix`, `normal`, `position` resolve (OGL provides them). Fix any missing built-in by adding an explicit uniform.
- [ ] **Step 3: Verify** — build, preview home page, confirm the blob cluster looks identical to `visual-baseline/home-desktop.png`: pulsing, fresnel edges, iridescent sweep, glossy env reflection, cursor spring, click shockwave. This is the highest-fidelity-risk task.
- [ ] **Step 4:** Commit: `refactor: port hero blob scene to OGL`.

## Task D: Port the cards scene to OGL

**Files:**
- Modify: `src/gl/cardsScene.js` (imports + construction; KEEP hover/parallax/IntersectionObserver logic)
- Reference: `src/gl/shaders.js` (cardVertex/cardFragment)

**Interfaces:** `createCardsScene()` → same contract as today.

- [ ] **Step 1:** Swap `PlaneGeometry`→`Plane`, `CanvasTexture`→`Texture({image:canvas})`, `ShaderMaterial`→`Program`, filters/colorspace to raw GL enums (`gl.LINEAR`, `gl.CLAMP_TO_EDGE`; for SRGB, OGL Textures don't auto-convert — verify the card image colors match, adjust if needed). Keep the rgb-shift, rounded-mask, wave-distortion, parallax uniforms identical.
- [ ] **Step 2:** Verify `cardVertex`/`cardFragment` compile; `uv` attribute resolves under OGL.
- [ ] **Step 3: Verify** — build, preview `projects.html`, hover a card, confirm the distortion/rgb-shift/rounded corners match `visual-baseline/projects-desktop.png` behavior.
- [ ] **Step 4:** Commit: `refactor: port cards scene to OGL`.

## Task E: Switch renderer, wire everything, delete Three

**Files:**
- Modify: `src/main.js` (import `glx` from `oglRenderer` not `renderer`)
- Modify: `src/pages/home.js`, `heroScene.js`, `cardsScene.js` (import `glx`/classes from `oglRenderer`)
- Delete: `src/gl/renderer.js`, `src/gl/post.js`, `src/gl/three.js`
- Modify: `package.json` (remove `three` dependency)

**Interfaces:** Rename `oglRenderer.js`→`renderer.js` and `oglPost.js`→`post.js` (so paths stay stable), OR update all import paths. Prefer renaming to minimize churn.

- [ ] **Step 1:** Delete old `renderer.js`, `post.js`, `three.js`. Rename `oglRenderer.js`→`renderer.js`, `oglPost.js`→`post.js`. Update any internal imports.
- [ ] **Step 2:** Confirm all GL consumers import from the OGL-backed `renderer.js`. Run `grep -rn "from 'three'\|three.js'" src/` → expect ZERO matches.
- [ ] **Step 3:** `npm uninstall three`. Confirm `package.json` no longer lists `three`.
- [ ] **Step 4: Build and measure the win** — `npm run build`; confirm NO `three` chunk exists; measure the new GL chunk (OGL). Expected: GL chunk drops from ~127 KB gzip to ~15–35 KB gzip. Record raw+gzip in `baseline-metrics.md`.
- [ ] **Step 5: Full visual verification** — preview all four pages, compare against ALL baseline screenshots (home, about, projects, project). Hero, cards, bloom, transitions must match. Test reduced-motion path too.
- [ ] **Step 6:** Commit: `perf: replace three.js with OGL (127KB -> ~30KB gzip), delete three`.

## Task F: Regression sweep

- [ ] **Step 1:** Re-run the profiling (load timing + scroll FPS) from the controller's earlier method; confirm no runtime regression (still ~60fps).
- [ ] **Step 2:** Capture fresh screenshots at the same 4 pages; diff against baseline; confirm visual match.
- [ ] **Step 3:** Update `baseline-metrics.md` with final OGL numbers and a summary.
- [ ] **Step 4:** Commit: `docs: record OGL port results`.

## Self-Review Notes

- **Spec coverage:** replaces Three (spec §2.1 real goal), preserves exact look (user constraint), keeps quality tier + reduced-motion (global constraints). ✔
- **Risk concentration:** Tasks C (hero shaders) and B (bloom) are the fidelity risks — both have explicit visual-verification steps against baseline before commit.
- **Rollback:** each task commits independently; Task E is the point of no return (deletes Three) and only runs after B/C/D are individually verified. If any of B/C/D can't match the look, STOP and escalate to the user before Task E per the "match exactly" constraint.
- **No test framework:** verification is build-size + visual comparison against `visual-baseline/`, consistent with the parent plan.
