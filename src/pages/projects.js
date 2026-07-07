/**
 * Projects listing — rows reveal on scroll; on hover the thumbnail
 * chases the cursor (lerped) and swaps per row.
 */
import { gsap } from '../core.js';
import { basePage } from './base.js';
import { isTouch, reducedMotion, qsa } from '../utils/env.js';

export function createProjectsPage(main) {
  const cleanup = [];

  return basePage(main, {
    setup() {
      if (isTouch || reducedMotion) return;

      const float = main.querySelector('[data-plist-float]');
      const img = main.querySelector('[data-plist-img]');
      const list = main.querySelector('[data-plist]');
      if (!float || !img || !list) return;

      const xTo = gsap.quickTo(float, 'x', { duration: 0.55, ease: 'power3' });
      const yTo = gsap.quickTo(float, 'y', { duration: 0.55, ease: 'power3' });
      let visible = false;

      const onMove = (e) => {
        xTo(e.clientX + 22);
        yTo(e.clientY - float.offsetHeight / 2);
      };
      const show = () => {
        if (visible) return;
        visible = true;
        gsap.to(float, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
      };
      const hide = () => {
        visible = false;
        gsap.to(float, { autoAlpha: 0, scale: 0.85, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
      };

      list.addEventListener('mousemove', onMove);
      list.addEventListener('mouseleave', hide);
      qsa('[data-prow]', main).forEach((row) => {
        const enter = () => {
          if (img.getAttribute('src') !== row.dataset.thumb) {
            img.setAttribute('src', row.dataset.thumb);
            gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 0.5, ease: 'power3.out' });
          }
          show();
        };
        row.addEventListener('mouseenter', enter);
        cleanup.push(() => row.removeEventListener('mouseenter', enter));
      });
      cleanup.push(() => {
        list.removeEventListener('mousemove', onMove);
        list.removeEventListener('mouseleave', hide);
      });
    },

    destroy() {
      cleanup.forEach((k) => k());
      cleanup.length = 0;
    },
  });
}
