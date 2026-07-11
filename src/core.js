/**
 * Shared singletons: gsap + ScrollTrigger + Lenis, wired together once.
 * Everything else imports from here so there is exactly one ticker.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from './utils/env.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };

export let lenis = null;

export function initScroll() {
  if (reducedMotion) return null; // native scroll, simple fades elsewhere
  // On touch devices, native scrolling + momentum is what users expect; Lenis
  // hijacking touch makes it feel "wonky" and can fight the browser's own
  // scroll. Run Lenis for the wheel (desktop) glide only, and let touch pass
  // straight through to the native scroller.
  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.09, // a touch more float — silkier glide without feeling laggy
    wheelMultiplier: 1,
    syncTouch: false, // do not smooth/hijack touch — native momentum instead
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function lockScroll() {
  if (lenis) lenis.stop();
  else document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll() {
  if (lenis) lenis.start();
  else document.documentElement.style.overflow = '';
}

export const scrollY = () => (lenis ? lenis.scroll : window.scrollY);
export const scrollLimit = () =>
  lenis
    ? lenis.limit
    : document.documentElement.scrollHeight - window.innerHeight;
