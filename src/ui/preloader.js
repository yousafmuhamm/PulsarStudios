/**
 * Preloader — counter 0→100 + wordmark, then curtain lift.
 * Waits for fonts (with a timeout) so the hero reveal never FOUTs.
 */
import { gsap, lockScroll, unlockScroll } from '../core.js';
import { reducedMotion } from '../utils/env.js';

export function runPreloader() {
  const el = document.querySelector('[data-preloader]');
  if (!el) return Promise.resolve();

  const count = el.querySelector('[data-preloader-count]');
  const brand = el.querySelector('.preloader__brand');

  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 1400)),
  ]);

  if (reducedMotion) {
    return fontsReady.then(() => el.remove());
  }

  lockScroll();
  const obj = { v: 0 };
  const tl = gsap.timeline();
  tl.from(brand, { yPercent: 130, duration: 0.9, ease: 'power4.out' }, 0.1);
  tl.to(
    obj,
    {
      v: 100,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        count.textContent = String(Math.round(obj.v)).padStart(3, '0');
      },
    },
    0
  );

  // If the tab is backgrounded during load, rAF suspension freezes the
  // gsap clock and these tweens stall — the timeout guarantees the page
  // is never held hostage behind the preloader.
  const finish = new Promise((resolve) => {
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      el.remove();
      unlockScroll();
      resolve();
    };
    Promise.all([tl.then(), fontsReady]).then(() => {
      gsap
        .timeline({ onComplete: settle })
        .to([brand, count], { autoAlpha: 0, duration: 0.3, ease: 'power2.in' })
        .to(el, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.18');
    });
    setTimeout(settle, 6000);
  });
  return finish;
}
