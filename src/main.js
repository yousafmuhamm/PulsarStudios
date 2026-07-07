/**
 * Boot: environment classes → Lenis → GL renderer → chrome (cursor,
 * menu, contact, reel, veil) → router → preloader → first page enter.
 */
import './styles/main.scss';
import { ScrollTrigger, initScroll } from './core.js';
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

initScroll();
glx.init(document.querySelector('[data-gl]'));

initCursor();
magnetize(document); // header/menu chrome (page content re-scans on navigation)
initMenu();
initContact();
initReel();

const router = new Router({ veil: createVeil() });
const page = router.start();

runPreloader().then(() => {
  ScrollTrigger.refresh();
  page.enter();
});
