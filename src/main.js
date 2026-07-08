/**
 * Boot: environment classes → Lenis → GL renderer → chrome (cursor,
 * menu, contact, reel, veil) → router → preloader → first page enter.
 */
import './styles/main.scss';
import { gsap, ScrollTrigger, initScroll } from './core.js';
import { isTouch, reducedMotion } from './utils/env.js';
import { glx } from './gl/renderer.js';
import { createVeil } from './gl/transitions.js';
import { initCursor } from './anims/cursor.js';
import { magnetize } from './anims/magnetic.js';
import { runPreloader } from './ui/preloader.js';
import { initMenu } from './ui/menu.js';
import { initContact } from './ui/contact.js';
import { initReel } from './ui/reel.js';
import { Router } from './router.js';

const html = document.documentElement;
html.classList.add('js');
if (isTouch) html.classList.add('touch');
if (reducedMotion) html.classList.add('reduced-motion');

// global film-grain + vignette overlay
const grain = document.createElement('div');
grain.className = 'grain';
grain.setAttribute('aria-hidden', 'true');
document.body.appendChild(grain);

// Boot is spread across macrotasks so no single task blocks the main
// thread for long (TBT); the preloader covers the screen throughout.
const nextTask = () => new Promise((r) => setTimeout(r, 0));

async function boot() {
  initScroll();
  const preloaderDone = runPreloader();

  await nextTask();
  glx.init(document.querySelector('[data-gl]'));

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
  const router = new Router({ veil: createVeil() });
  const page = router.start();

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
