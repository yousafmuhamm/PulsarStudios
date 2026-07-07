/**
 * Custom cursor — lime dot + trailing ring. Grows over interactive
 * elements; morphs into a labelled circle over [data-cursor] targets
 * ("Drag", "Play", "Open"). Hidden entirely on touch devices.
 */
import { gsap } from '../core.js';
import { isTouch, reducedMotion } from '../utils/env.js';

const INTERACTIVE = 'a, button, input, select, textarea, label, [data-cursor]';

export function initCursor() {
  const rootEl = document.querySelector('[data-cursor-dot]')?.closest('.cursor');
  if (!rootEl || isTouch) return { kill() {} };

  const dot = rootEl.querySelector('[data-cursor-dot]');
  const ring = rootEl.querySelector('[data-cursor-ring]');
  const label = rootEl.querySelector('[data-cursor-label]');

  const mouse = { x: -100, y: -100 };
  const dotPos = { x: -100, y: -100 };
  const ringPos = { x: -100, y: -100 };
  let visible = false;
  let ringScale = 1;
  let ringScaleTarget = 1;

  gsap.set([dot, ring], { xPercent: 0, yPercent: 0, force3D: true, autoAlpha: 0 });

  const onMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!visible) {
      visible = true;
      dotPos.x = ringPos.x = mouse.x;
      dotPos.y = ringPos.y = mouse.y;
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
    }
  };

  const tick = (_t, dtMs) => {
    if (!visible) return;
    const dt = Math.min(dtMs / 1000, 0.05);
    const kDot = 1 - Math.exp(-dt * 38);
    const kRing = 1 - Math.exp(-dt * (reducedMotion ? 38 : 12));
    dotPos.x += (mouse.x - dotPos.x) * kDot;
    dotPos.y += (mouse.y - dotPos.y) * kDot;
    ringPos.x += (mouse.x - ringPos.x) * kRing;
    ringPos.y += (mouse.y - ringPos.y) * kRing;
    ringScale += (ringScaleTarget - ringScale) * kRing;
    dot.style.transform = `translate3d(${dotPos.x}px,${dotPos.y}px,0)`;
    ring.style.transform = `translate3d(${ringPos.x}px,${ringPos.y}px,0) scale(${ringScale})`;
  };
  gsap.ticker.add(tick);

  const onOver = (e) => {
    const labelled = e.target.closest?.('[data-cursor]');
    if (labelled) {
      label.textContent = labelled.dataset.cursor;
      rootEl.classList.add('has-label');
      ringScaleTarget = 1.9;
      return;
    }
    if (e.target.closest?.(INTERACTIVE)) {
      ringScaleTarget = 1.45;
    }
  };
  const onOut = (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest?.(INTERACTIVE)) {
      rootEl.classList.remove('has-label');
      ringScaleTarget = 1;
    } else if (!e.relatedTarget.closest?.('[data-cursor]')) {
      rootEl.classList.remove('has-label');
      ringScaleTarget = 1.45;
    }
  };
  let preDownScale = 1;
  const onDown = () => {
    preDownScale = ringScaleTarget;
    ringScaleTarget *= 0.82;
  };
  const onUp = () => (ringScaleTarget = preDownScale);
  const onLeaveDoc = () => {
    visible = false;
    gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 });
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  document.documentElement.addEventListener('mouseleave', onLeaveDoc);

  return {
    kill() {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeaveDoc);
    },
  };
}
