/**
 * Magnetic buttons — [data-magnetic] elements ease toward the cursor
 * inside their bounds (gsap.quickTo) and spring back on leave.
 */
import { gsap } from '../core.js';
import { isTouch, reducedMotion, qsa } from '../utils/env.js';

export function magnetize(root = document) {
  if (isTouch || reducedMotion) return { kill() {} };

  const handlers = [];

  qsa('[data-magnetic]', root).forEach((el) => {
    if (el.dataset.magnetized) return;
    el.dataset.magnetized = '1';
    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });

    const move = (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * 0.34);
      yTo(dy * 0.34);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    handlers.push({ el, move, leave });
  });

  return {
    kill() {
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
        delete el.dataset.magnetized;
        gsap.set(el, { x: 0, y: 0 });
      });
    },
  };
}
