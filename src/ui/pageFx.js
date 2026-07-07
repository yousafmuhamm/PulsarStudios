/**
 * Per-page shared behaviours: marquees, the hero scroll-progress line,
 * and the "scroll past the footer to auto-navigate" gesture.
 */
import { gsap, ScrollTrigger, scrollY, scrollLimit } from '../core.js';
import { initMarquees } from '../anims/marquee.js';
import { reducedMotion } from '../utils/env.js';

const ADVANCE_THRESHOLD = 950; // accumulated px of deliberate extra scroll

export function initPageFx(main) {
  const kills = [];

  const marquees = initMarquees(main);
  kills.push(() => marquees.forEach((m) => m.kill()));

  // page scroll progress line (hero)
  const prog = main.querySelector('[data-scroll-progress]');
  if (prog) {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        prog.style.transform = `scaleX(${self.progress.toFixed(4)})`;
      },
    });
    kills.push(() => st.kill());
  }

  // scroll-past-footer → navigate to the next page (debounced, deliberate)
  const next = main.querySelector('[data-next-page]');
  if (next && !reducedMotion) {
    const href = next.dataset.nextPage;
    const fill = next.querySelector('[data-next-fill]');
    let acc = 0;
    let navigating = false;

    const atEnd = () => scrollY() >= scrollLimit() - 4;
    const update = () => {
      if (fill) fill.style.transform = `scaleX(${Math.min(1, acc / ADVANCE_THRESHOLD)})`;
    };
    const bump = (delta) => {
      if (navigating) return;
      if (!atEnd() || delta <= 0) {
        acc = 0;
        update();
        return;
      }
      acc += delta;
      update();
      if (acc >= ADVANCE_THRESHOLD) {
        navigating = true;
        document.dispatchEvent(new CustomEvent('router:go', { detail: href }));
      }
    };

    const onWheel = (e) => bump(e.deltaY);
    let touchY = null;
    const onTouchStart = (e) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e) => {
      if (touchY === null) return;
      const y = e.touches[0].clientY;
      bump((touchY - y) * 2.2);
      touchY = y;
    };
    const decay = (_t, dtMs) => {
      if (acc > 0 && !navigating) {
        acc = Math.max(0, acc - (dtMs / 1000) * 600);
        update();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    gsap.ticker.add(decay);

    kills.push(() => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      gsap.ticker.remove(decay);
    });
  }

  return {
    kill() {
      kills.forEach((k) => k());
    },
  };
}
