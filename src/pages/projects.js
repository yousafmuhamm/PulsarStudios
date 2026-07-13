/**
 * Full-screen project gallery — index-rail active tracking and
 * click-to-navigate. No WebGL, no per-frame scroll JS: active state
 * is driven by IntersectionObserver, navigation by scrollIntoView.
 */
import { basePage } from './base.js';
import { qsa, reducedMotion } from '../utils/env.js';

export function createProjectsPage(main) {
  const slides = qsa('[data-gslide]', main);
  const items = qsa('[data-gindex-to]', main);
  if (!slides.length) return basePage(main, {});

  let io = null;
  const cleanup = [];

  return basePage(main, {
    setup() {
      // Active-index tracking via IntersectionObserver — cheap, no scroll-frame JS.
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const idx = Number(entry.target.dataset.index);
            items.forEach((it, i) => it.classList.toggle('is-active', i === idx));
          });
        },
        { threshold: 0.5 }
      );
      slides.forEach((s) => io.observe(s));

      // Click an index name → scroll to that slide.
      items.forEach((btn) => {
        const handler = () => {
          const idx = Number(btn.dataset.gindexTo);
          slides[idx]?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        };
        btn.addEventListener('click', handler);
        cleanup.push(() => btn.removeEventListener('click', handler));
      });
    },

    destroy() {
      io?.disconnect();
      io = null;
      cleanup.forEach((off) => off());
      cleanup.length = 0;
    },
  });
}
