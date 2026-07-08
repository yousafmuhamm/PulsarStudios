/**
 * Scroll-velocity skew — elements tagged [data-skew] shear slightly with
 * scroll speed and spring back to rest, so fast scrolling makes the
 * typography feel physically dragged by the page (the Lusion "everything
 * has mass" trick). Whole thing is one ticker + quickSetters, so it's a
 * handful of transform writes per frame, and it removes itself cleanly.
 */
import { gsap, lenis } from '../core.js';
import { reducedMotion, isTouch, qsa } from '../utils/env.js';

const MAX_DEG = 2.2;

export function initVelocitySkew(main) {
  if (reducedMotion || isTouch || !lenis) return null;
  const els = qsa('[data-skew]', main);
  if (!els.length) return null;

  const setters = els.map((el) => gsap.quickSetter(el, 'skewY', 'deg'));
  let skew = 0;
  let resting = true;

  const tick = () => {
    const target = gsap.utils.clamp(-MAX_DEG, MAX_DEG, (lenis.velocity || 0) * 0.038);
    skew += (target - skew) * 0.11;
    if (Math.abs(skew) < 0.002 && target === 0) {
      if (!resting) {
        setters.forEach((s) => s(0));
        resting = true;
      }
      return;
    }
    resting = false;
    setters.forEach((s) => s(skew));
  };
  gsap.ticker.add(tick);

  return {
    kill() {
      gsap.ticker.remove(tick);
      setters.forEach((s) => s(0));
    },
  };
}
