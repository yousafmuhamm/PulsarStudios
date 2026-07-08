/**
 * Custom cursor — a single fluid dot that *replaces* the native cursor
 * (html.has-cursor sets `cursor: none`). It stretches along its velocity
 * like a droplet, inverts over any background via mix-blend difference,
 * swells into a soft inverting disc over interactive elements, becomes a
 * lime labelled coin over [data-cursor] targets ("Open" / "Play" / "Drag"),
 * squashes on press, and steps aside over text fields so the native
 * I-beam and caret take over. Size changes animate width/height (not
 * scale) so the label text stays crisp.
 */
import { gsap } from '../core.js';
import { isTouch, reducedMotion } from '../utils/env.js';

const INTERACTIVE = 'a, button, label, summary, [data-cursor], [data-magnetic]';
const TEXTY = 'input, textarea, select';

const SIZE = { default: 18, link: 44, label: 72 };

export function initCursor() {
  const root = document.querySelector('[data-cursor-root]');
  const blob = root?.querySelector('[data-cursor-blob]');
  const label = root?.querySelector('[data-cursor-label]');
  if (!root || !blob || isTouch) return { kill() {} };

  document.documentElement.classList.add('has-cursor');

  const pos = { x: -100, y: -100 };
  const target = { x: -100, y: -100 };
  const prev = { x: -100, y: -100 };
  let visible = false;
  let mode = 'default';
  let press = 1;

  const sizeTo = gsap.quickTo(blob, 'width', { duration: 0.4, ease: 'back.out(1.8)' });
  const sizeToH = gsap.quickTo(blob, 'height', { duration: 0.4, ease: 'back.out(1.8)' });
  // NB: quickTo can't drive compound props like autoAlpha — plain opacity
  const fadeTo = gsap.quickTo(blob, 'opacity', { duration: 0.25, ease: 'power2.out' });

  const setMode = (next, labelText = '') => {
    if (mode === next && !labelText) return;
    mode = next;
    root.classList.toggle('has-label', next === 'label');
    if (labelText) label.textContent = labelText;
    const s = next === 'text' ? SIZE.default : SIZE[next] || SIZE.default;
    sizeTo(s);
    sizeToH(s);
    fadeTo(next === 'text' ? 0 : visible ? 1 : 0);
  };

  const onMove = (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    if (!visible) {
      visible = true;
      pos.x = prev.x = target.x;
      pos.y = prev.y = target.y;
      if (mode !== 'text') fadeTo(1);
    }
  };

  const tick = (_t, dtMs) => {
    if (!visible) return;
    const dt = Math.min(dtMs / 1000, 0.05);
    const k = 1 - Math.exp(-dt * (reducedMotion ? 60 : 26));
    prev.x = pos.x;
    prev.y = pos.y;
    pos.x += (target.x - pos.x) * k;
    pos.y += (target.y - pos.y) * k;

    // stretch along the blob's own motion — liquid, only in dot mode
    let sx = 1;
    let sy = 1;
    let ang = 0;
    if (mode === 'default' && !reducedMotion) {
      const vx = (pos.x - prev.x) / Math.max(dt, 0.001);
      const vy = (pos.y - prev.y) / Math.max(dt, 0.001);
      const speed = Math.hypot(vx, vy);
      const s = Math.min(speed * 0.00042, 0.48);
      sx = 1 + s;
      sy = 1 / (1 + s * 0.75);
      ang = (Math.atan2(vy, vx) * 180) / Math.PI;
    }
    blob.style.transform =
      `translate3d(${pos.x}px,${pos.y}px,0) translate(-50%,-50%) ` +
      `rotate(${ang.toFixed(1)}deg) scale(${(sx * press).toFixed(3)},${(sy * press).toFixed(3)})`;
    // keep the label upright regardless of the blob's stretch rotation
    if (mode === 'label') label.style.transform = `rotate(${(-ang).toFixed(1)}deg)`;
  };
  gsap.ticker.add(tick);

  const resolveMode = (t) => {
    if (!t || !t.closest) return setMode('default');
    if (t.closest(TEXTY)) return setMode('text');
    const labelled = t.closest('[data-cursor]');
    if (labelled) return setMode('label', labelled.dataset.cursor);
    if (t.closest(INTERACTIVE)) return setMode('link');
    setMode('default');
  };

  const onOver = (e) => resolveMode(e.target);
  const onDown = () => {
    press = 0.82;
  };
  const onUp = () => {
    press = 1;
  };
  const onLeaveDoc = () => {
    visible = false;
    fadeTo(0);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('mouseover', onOver);
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  document.documentElement.addEventListener('mouseleave', onLeaveDoc);

  gsap.set(blob, { width: SIZE.default, height: SIZE.default, opacity: 0 });

  return {
    kill() {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeaveDoc);
      document.documentElement.classList.remove('has-cursor');
    },
  };
}
