/**
 * Play Reel overlay — fullscreen, revealed with a clip-path wipe.
 * The "video" is a generated 2D-canvas gradient render (placeholder;
 * swap for a real <video> when a reel exists).
 */
import { gsap, lockScroll, unlockScroll } from '../core.js';
import { reducedMotion } from '../utils/env.js';

const ORBS = [
  { c: [101, 51, 255], s: 0.55, p: 0 },
  { c: [49, 198, 232], s: 0.42, p: 2.1 },
  { c: [184, 255, 44], s: 0.3, p: 4.2 },
];

export function initReel() {
  const root = document.querySelector('[data-reel]');
  const canvas = root?.querySelector('[data-reel-canvas]');
  if (!root || !canvas) return;

  const ctx2d = canvas.getContext('2d');
  let t = 0;
  let lastFocus = null;
  let open = false;

  const draw = (_time, dtMs) => {
    t += Math.min(dtMs / 1000, 0.05);
    const { width: w, height: h } = canvas;
    ctx2d.fillStyle = '#0D0D0F';
    ctx2d.fillRect(0, 0, w, h);

    ctx2d.globalCompositeOperation = 'lighter';
    ORBS.forEach((o) => {
      const x = w * 0.5 + Math.sin(t * 0.32 + o.p) * w * 0.27;
      const y = h * 0.5 + Math.cos(t * 0.26 + o.p * 1.3) * h * 0.24;
      const r = Math.min(w, h) * o.s * (1 + Math.sin(t * 0.9 + o.p) * 0.08);
      const g = ctx2d.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},0.55)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx2d.fillStyle = g;
      ctx2d.fillRect(0, 0, w, h);
    });
    ctx2d.globalCompositeOperation = 'source-over';

    ctx2d.textAlign = 'center';
    ctx2d.fillStyle = '#F2F1EF';
    ctx2d.font = `600 ${Math.round(w * 0.085)}px Archivo, sans-serif`;
    ctx2d.fillText('PULSAR®', w / 2, h * 0.52);
    ctx2d.font = `400 ${Math.round(w * 0.014)}px "JetBrains Mono", monospace`;
    ctx2d.fillStyle = 'rgba(242,241,239,0.6)';
    ctx2d.fillText('R E E L   —   2 0 2 6', w / 2, h * 0.58);

    // timecode
    const tc = `00:${String(Math.floor(t % 60)).padStart(2, '0')}:${String(
      Math.floor((t * 24) % 24)
    ).padStart(2, '0')}`;
    ctx2d.textAlign = 'left';
    ctx2d.fillText(`TC ${tc}`, w * 0.04, h * 0.93);

    // drifting scanline
    const sy = ((t * 40) % (h + 80)) - 40;
    ctx2d.fillStyle = 'rgba(242,241,239,0.05)';
    ctx2d.fillRect(0, sy, w, 2);
  };

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  };

  const doOpen = () => {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    lockScroll();
    root.setAttribute('aria-hidden', 'false');
    root.style.visibility = 'visible';
    size();
    if (!reducedMotion) gsap.ticker.add(draw);
    else draw(0, 16);
    gsap.fromTo(
      root,
      { clipPath: 'inset(50% 0% 50% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: reducedMotion ? 0 : 0.85, ease: 'expo.inOut' }
    );
    root.querySelector('[data-reel-close]')?.focus({ preventScroll: true });
  };

  const doClose = (instant = false) => {
    if (!open) return;
    open = false;
    root.setAttribute('aria-hidden', 'true');
    gsap.to(root, {
      clipPath: 'inset(50% 0% 50% 0%)',
      duration: reducedMotion || instant ? 0 : 0.7,
      ease: 'expo.inOut',
      onComplete: () => {
        root.style.visibility = 'hidden';
        gsap.ticker.remove(draw);
      },
    });
    unlockScroll();
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-reel-open]')) doOpen();
    else if (e.target.closest('[data-reel-close]')) doClose();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) doClose();
  });
  window.addEventListener('resize', () => open && size());
  document.addEventListener('ui:close-overlays', () => doClose(true));
}
