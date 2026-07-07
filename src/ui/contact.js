/**
 * Contact slide-in panel (right side, ~480px). No backend — the form
 * composes a mailto: on submit. Openers are delegated ([data-contact-open]
 * exists in the header, menu, and every footer CTA).
 */
import { gsap, lockScroll, unlockScroll } from '../core.js';
import { reducedMotion } from '../utils/env.js';

export function initContact() {
  const panel = document.querySelector('[data-contact]');
  const scrim = document.querySelector('[data-scrim]');
  const form = document.querySelector('[data-contact-form]');
  const note = document.querySelector('[data-contact-note]');
  if (!panel || !scrim) return;

  let open = false;
  let lastFocus = null;
  const dur = reducedMotion ? 0 : 1;

  const doOpen = () => {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    document.dispatchEvent(new CustomEvent('menu:close'));
    lockScroll();
    panel.setAttribute('aria-hidden', 'false');
    panel.style.visibility = 'visible';
    scrim.hidden = false;
    gsap.to(scrim, { opacity: 1, duration: 0.4 * dur });
    gsap.fromTo(
      panel,
      { xPercent: 102 },
      { xPercent: 0, duration: 0.7 * dur, ease: 'expo.out' }
    );
    panel.querySelector('input')?.focus({ preventScroll: true });
  };

  const doClose = (instant = false) => {
    if (!open) return;
    open = false;
    panel.setAttribute('aria-hidden', 'true');
    const d = instant ? 0 : dur;
    gsap.to(panel, {
      xPercent: 102,
      duration: 0.55 * d,
      ease: 'expo.inOut',
      onComplete: () => (panel.style.visibility = 'hidden'),
    });
    gsap.to(scrim, { opacity: 0, duration: 0.4 * d, onComplete: () => (scrim.hidden = true) });
    unlockScroll();
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-contact-open]')) {
      e.preventDefault();
      doOpen();
    } else if (e.target.closest('[data-contact-close]')) {
      doClose();
    }
  });
  scrim.addEventListener('click', () => doClose());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) doClose();
  });
  document.addEventListener('ui:close-overlays', () => doClose(true));

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent(`New project — ${data.get('name') || 'hello'}`);
    const body = encodeURIComponent(
      `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nBudget: ${
        data.get('budget') || 'not sure yet'
      }\n\n${data.get('message')}`
    );
    if (note) note.textContent = 'Opening your mail app…';
    window.location.href = `mailto:hello@pulsarstudios.com?subject=${subject}&body=${body}`;
  });
}
