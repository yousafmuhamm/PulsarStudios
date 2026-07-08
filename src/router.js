/**
 * Hand-rolled client-side router: intercepts internal links, fetches the
 * target page, swaps <main> under the transition veil, and drives page
 * module lifecycles (init / enter / destroy). The WebGL canvas and all
 * chrome outside <main> persist across navigations.
 */
import { ScrollTrigger, scrollToTop } from './core.js';
import { makePage } from './pages/index.js';

export class Router {
  constructor({ veil }) {
    this.veil = veil;
    this.busy = false;
    this.onClick = this.onClick.bind(this);
    this.onPop = this.onPop.bind(this);
  }

  start() {
    history.scrollRestoration = 'manual';
    this.main = document.querySelector('main');
    this.page = makePage(this.main);
    this.page.init();
    document.addEventListener('click', this.onClick);
    window.addEventListener('popstate', this.onPop);
    document.addEventListener('router:go', (e) => this.navigate(e.detail));
    return this.page;
  }

  onClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-router-ignore'))
      return;
    const href = a.getAttribute('href');
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;

    e.preventDefault();
    if (url.pathname === location.pathname) {
      scrollToTop();
      return;
    }
    this.navigate(url.pathname);
  }

  onPop() {
    this.navigate(location.pathname, true);
  }

  async navigate(path, fromPop = false) {
    if (this.busy) return;
    this.busy = true;
    document.dispatchEvent(new CustomEvent('ui:close-overlays'));

    const fetched = fetch(path)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .catch(() => null);

    // animation promises stall when the tab is backgrounded mid-gesture
    // (rAF suspension freezes the gsap clock) — never let that wedge
    // navigation: the veil just won't be seen if we proceed uncovered
    const bounded = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
    await bounded(this.veil.cover(), 1400);
    const html = await fetched;
    if (html === null) {
      location.href = path; // graceful fallback to a hard load
      return;
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newMain = doc.querySelector('main');
    if (!newMain) {
      location.href = path;
      return;
    }

    // teardown old page (kills its ScrollTriggers, disposes GL scenes)
    this.page.destroy();

    document.title = doc.title;
    const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
    if (desc) document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
    document.querySelector('link[rel="canonical"]')?.setAttribute(
      'href',
      doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || location.href
    );
    document.body.dataset.page = newMain.dataset.page;

    this.main.replaceWith(newMain);
    this.main = newMain;
    if (!fromPop) history.pushState({}, '', path);
    scrollToTop();

    this.page = makePage(newMain);
    this.page.init();
    ScrollTrigger.refresh();

    // reveal overlaps the new page's entrance
    const revealDone = Promise.race([
      this.veil.reveal(),
      new Promise((r) => setTimeout(r, 1600)),
    ]);
    this.page.enter();
    newMain.setAttribute('tabindex', '-1');
    newMain.focus({ preventScroll: true });
    await revealDone;
    this.busy = false;
  }
}
