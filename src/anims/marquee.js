/**
 * Infinite marquee. The element must contain a single "chunk" child;
 * it is cloned to fill the row and advanced on the gsap ticker.
 * Only marquees may move linearly — everything else in the site eases.
 */
import { gsap } from '../core.js';
import { reducedMotion } from '../utils/env.js';

export function marquee(el) {
  const chunk = el.firstElementChild;
  if (!chunk) return { kill() {} };

  const speed = parseFloat(el.dataset.marqueeSpeed) || 60; // px/s
  const dir = parseFloat(el.dataset.marqueeDir) || 1;
  const pauseOnHover = el.hasAttribute('data-marquee-hover');

  let chunkW = 0;
  let clones = [];
  let pos = 0;
  let vel = reducedMotion ? 0 : speed;
  let targetVel = vel;

  const measure = () => {
    chunkW = chunk.offsetWidth;
    if (!chunkW) return;
    const needed = Math.max(2, Math.ceil((window.innerWidth * 2) / chunkW));
    while (clones.length < needed - 1) {
      const c = chunk.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      el.appendChild(c);
      clones.push(c);
    }
  };
  measure();

  const all = () => [chunk, ...clones];

  const tick = (_t, dtMs) => {
    if (!chunkW) {
      measure();
      return;
    }
    const dt = Math.min(dtMs / 1000, 0.05);
    vel += (targetVel - vel) * Math.min(1, dt * 6);
    pos = (((pos + vel * dir * dt) % chunkW) + chunkW) % chunkW;
    const x = -pos;
    all().forEach((c) => (c.style.transform = `translate3d(${x}px,0,0)`));
  };

  if (!reducedMotion) gsap.ticker.add(tick);

  const enter = () => (targetVel = 0);
  const leave = () => (targetVel = speed);
  if (pauseOnHover && !reducedMotion) {
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
  }

  const onResize = () => measure();
  window.addEventListener('resize', onResize);

  return {
    kill() {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('mouseenter', enter);
      el.removeEventListener('mouseleave', leave);
      clones.forEach((c) => c.remove());
    },
  };
}

export const initMarquees = (root) =>
  [...root.querySelectorAll('[data-marquee]')].map(marquee);
