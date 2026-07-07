/**
 * Full-screen menu overlay — clip-paths in, links reveal with a
 * staggered masked animation. Keyboard accessible: focus is trapped
 * while open, Escape closes, aria-expanded mirrors state.
 */
import { gsap, lockScroll, unlockScroll } from '../core.js';
import { reducedMotion, qsa } from '../utils/env.js';

export function initMenu() {
  const menu = document.querySelector('[data-menu]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const label = document.querySelector('[data-menu-label]');
  if (!menu || !toggle) return;

  const words = qsa('.menu__word', menu);
  const idx = qsa('.menu__idx', menu);
  const foot = menu.querySelector('[data-menu-foot]');

  let open = false;
  let busy = false;
  let lastFocus = null;

  gsap.set(words, { yPercent: 115 });
  gsap.set([foot, ...idx], { autoAlpha: 0 });

  const setState = (isOpen) => {
    open = isOpen;
    toggle.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
    label.textContent = isOpen ? 'Close' : 'Menu';
  };

  const doOpen = () => {
    if (open || busy) return;
    busy = true;
    lastFocus = document.activeElement;
    setState(true);
    lockScroll();
    menu.style.visibility = 'visible';
    const dur = reducedMotion ? 0 : 1;
    gsap
      .timeline({ onComplete: () => (busy = false) })
      .fromTo(
        menu,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.7 * dur, ease: 'expo.inOut' }
      )
      .to(words, { yPercent: 0, duration: 0.9 * dur, ease: 'power4.out', stagger: 0.07 }, '-=0.25')
      .to(idx, { autoAlpha: 1, duration: 0.5 * dur, stagger: 0.06 }, '<0.1')
      .to(foot, { autoAlpha: 1, y: 0, duration: 0.6 * dur }, '<');
    menu.querySelector('a, button')?.focus({ preventScroll: true });
  };

  const doClose = (instant = false) => {
    if (!open) return;
    setState(false);
    const dur = reducedMotion || instant ? 0 : 1;
    busy = true;
    gsap
      .timeline({
        onComplete: () => {
          menu.style.visibility = 'hidden';
          gsap.set(words, { yPercent: 115 });
          gsap.set([foot, ...idx], { autoAlpha: 0 });
          busy = false;
        },
      })
      .to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.55 * dur, ease: 'expo.inOut' });
    unlockScroll();
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', () => (open ? doClose() : doOpen()));

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') doClose();
    if (e.key === 'Tab') {
      // simple focus trap: menu links + the toggle button
      const focusables = [...qsa('a, button', menu), toggle].filter((el) => el.offsetParent !== null || el === toggle);
      const i = focusables.indexOf(document.activeElement);
      if (e.shiftKey && (i === 0 || i === -1)) {
        e.preventDefault();
        focusables[focusables.length - 1].focus();
      } else if (!e.shiftKey && i === focusables.length - 1) {
        e.preventDefault();
        focusables[0].focus();
      }
    }
  });

  // navigation / contact-open from inside the menu closes it
  menu.addEventListener('click', (e) => {
    if (e.target.closest('[data-menu-link]')) doClose();
  });
  document.addEventListener('ui:close-overlays', () => doClose(true));
  document.addEventListener('menu:close', () => doClose());

  return { close: doClose };
}
