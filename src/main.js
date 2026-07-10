/**
 * Boot: environment classes → Lenis → GL renderer → chrome (cursor,
 * menu, contact, reel, veil) → router → preloader → first page enter.
 */
import './styles/main.scss';
import { gsap, ScrollTrigger, initScroll } from './core.js';
import { isTouch, reducedMotion } from './utils/env.js';
import { createVeil } from './gl/transitions.js';
import { initCursor } from './anims/cursor.js';
import { magnetize } from './anims/magnetic.js';
import { runPreloader } from './ui/preloader.js';
import { initMenu } from './ui/menu.js';
import { initContact } from './ui/contact.js';
import { initReel } from './ui/reel.js';
import { Router } from './router.js';

// The OGL layer (renderer + scenes + the `ogl` package, ~16.5KB gzip) is
// split into its own async chunk so it never blocks first paint — the
// canvas upgrades in once the chunk resolves. `loadGL()` is idempotent
// (shared promise) so main.js and page modules can all await the same
// init without racing or double-initializing.
let glReady = null;
export function loadGL() {
  if (!glReady) {
    glReady = import('./gl/renderer.js').then(({ glx }) => {
      glx.init(document.querySelector('[data-gl]'));
      return glx;
    });
  }
  return glReady;
}

const html = document.documentElement;
html.classList.add('js');
if (isTouch) html.classList.add('touch');
if (reducedMotion) html.classList.add('reduced-motion');

// global film-grain + vignette overlay
const grain = document.createElement('div');
grain.className = 'grain';
grain.setAttribute('aria-hidden', 'true');
document.body.appendChild(grain);

// global scroll-progress rail — a thin vertical line on the right edge that
// fills as you move through the page. Persists across navigations (lives
// outside <main>), driven by the ScrollTrigger set up in boot().
const scrollRail = document.createElement('div');
scrollRail.className = 'scroll-rail';
scrollRail.setAttribute('aria-hidden', 'true');
scrollRail.innerHTML = '<span class="scroll-rail__fill" data-scroll-rail></span>';
document.body.appendChild(scrollRail);

// Boot is spread across macrotasks so no single task blocks the main
// thread for long (TBT); the preloader covers the screen throughout.
const nextTask = () => new Promise((r) => setTimeout(r, 0));

async function boot() {
  initScroll();
  const preloaderDone = runPreloader();

  await nextTask();
  initCursor();
  magnetize(document); // header/menu chrome (page content re-scans on navigation)
  initMenu();
  initContact();
  initReel();

  // Text splits measure line breaks — wait for the real fonts (bounded)
  // so masks are built against final metrics, not the fallback face.
  await Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 1200)),
  ]);

  await nextTask();
  // Fire-and-forget: the GL chunk loads in the background after the
  // critical chrome/first-paint path. Page modules (home.js) await
  // loadGL() themselves before touching glx, so this doesn't need to
  // block anything here — the preloader still covers the screen.
  loadGL();

  const router = new Router({ veil: createVeil() });
  const page = router.start();

  // The scroll-rail fill is driven entirely by CSS scroll-driven animation
  // (animation-timeline: scroll()) — see _chrome.scss. That runs on the
  // compositor with ZERO per-frame main-thread work. An earlier JS version
  // (a ScrollTrigger writing transform every scroll tick to a will-change'd
  // element) halved framerate to 30fps by thrashing the compositor against
  // the live WebGL canvas; the CSS timeline has no such cost.

  if (import.meta.env.DEV) {
    // QA hooks: leak checks + tween inspection across navigations.
    // NB: must be the instances from core.js — a dynamic import('gsap')
    // would create a second gsap whose ticker never runs.
    window.__ST = ScrollTrigger;
    window.__gsap = gsap;
  }

  await preloaderDone;
  ScrollTrigger.refresh();
  page.enter();
}

boot();
