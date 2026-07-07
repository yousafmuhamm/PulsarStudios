/**
 * About — parallax hero lines, draggable team carousel, brand marquees
 * (handled by pageFx), count-up stats (reveals), expertise accordion.
 */
import { gsap } from '../core.js';
import { basePage } from './base.js';
import { qsa, isTouch } from '../utils/env.js';

export function createAboutPage(main) {
  const cleanup = [];

  return basePage(main, {
    setup() {
      /* expertise accordion — single row open at a time */
      const rows = qsa('[data-xrow]', main);
      rows.forEach((row) => {
        const btn = row.querySelector('.xrow__head');
        const panel = row.querySelector('.xrow__panel');
        btn.addEventListener('click', () => {
          const isOpen = btn.getAttribute('aria-expanded') === 'true';
          rows.forEach((other) => {
            const ob = other.querySelector('.xrow__head');
            const op = other.querySelector('.xrow__panel');
            if (ob.getAttribute('aria-expanded') === 'true' && other !== row) {
              ob.setAttribute('aria-expanded', 'false');
              gsap.to(op, {
                height: 0,
                duration: 0.5,
                ease: 'power3.inOut',
                onComplete: () => (op.hidden = true),
              });
            }
          });
          if (isOpen) {
            btn.setAttribute('aria-expanded', 'false');
            gsap.to(panel, {
              height: 0,
              duration: 0.5,
              ease: 'power3.inOut',
              onComplete: () => (panel.hidden = true),
            });
          } else {
            btn.setAttribute('aria-expanded', 'true');
            panel.hidden = false;
            gsap.fromTo(
              panel,
              { height: 0 },
              { height: 'auto', duration: 0.65, ease: 'power3.inOut' }
            );
          }
        });
      });

      /* team carousel — native scroll-snap + desktop drag-to-scroll */
      const carousel = main.querySelector('[data-team-carousel]');
      if (carousel && !isTouch) {
        let down = false;
        let startX = 0;
        let startScroll = 0;
        let moved = 0;

        const onDown = (e) => {
          down = true;
          moved = 0;
          startX = e.clientX;
          startScroll = carousel.scrollLeft;
        };
        const onMove = (e) => {
          if (!down) return;
          const dx = e.clientX - startX;
          moved = Math.max(moved, Math.abs(dx));
          if (moved > 6) carousel.classList.add('is-dragging');
          carousel.scrollLeft = startScroll - dx;
        };
        const onUp = () => {
          down = false;
          requestAnimationFrame(() => carousel.classList.remove('is-dragging'));
        };
        const onKey = (e) => {
          if (e.key === 'ArrowRight') carousel.scrollBy({ left: 320, behavior: 'smooth' });
          if (e.key === 'ArrowLeft') carousel.scrollBy({ left: -320, behavior: 'smooth' });
        };

        carousel.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        carousel.addEventListener('keydown', onKey);
        cleanup.push(() => {
          carousel.removeEventListener('pointerdown', onDown);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          carousel.removeEventListener('keydown', onKey);
        });
      }
    },

    destroy() {
      cleanup.forEach((k) => k());
      cleanup.length = 0;
    },
  });
}
