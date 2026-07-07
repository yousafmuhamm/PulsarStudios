/**
 * RevealManager — declarative motion, driven by data attributes:
 *
 *   data-reveal="lines|words|chars|fade|image"  masked reveal at 'top 80%'
 *   data-reveal-load="..."                      same, but part of the page-enter timeline
 *   data-scrub-lines                            long paragraph, line-by-line scrubbed
 *   data-cta-fill                               char-by-char colour fill, scrubbed
 *   data-counter="48"                           count-up once in view
 *   data-parallax="-10"                         yPercent scrub against its section
 *   data-parallax-img                           clip-open once + inner image parallax
 *
 * All timelines/ScrollTriggers are created synchronously so a wrapping
 * gsap.context() collects them; kill() also reverts text splits.
 */
import { gsap, ScrollTrigger } from '../core.js';
import { Split } from './splitText.js';
import { reducedMotion, qsa } from '../utils/env.js';

const EASE_IN = 'power4.out';

export class RevealManager {
  constructor(root) {
    this.root = root;
    this.entries = [];
    this.loadTl = gsap.timeline({ paused: true });
    this.width = window.innerWidth;
    this.build();
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  /* ------------------------------------------------------------- build */

  build() {
    const { root } = this;

    if (reducedMotion) {
      // simple fades only — no splits, no scrubs, nothing masked
      qsa('[data-reveal], [data-reveal-load], [data-scrub-lines], [data-cta-fill]', root).forEach(
        (el) => {
          gsap.set(el, { visibility: 'visible' });
          gsap.from(el, {
            autoAlpha: 0,
            duration: 0.5,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          });
        }
      );
      qsa('[data-counter]', root).forEach((el) => {
        el.textContent = el.dataset.counter;
      });
      return;
    }

    qsa('[data-reveal]', root).forEach((el) =>
      this.addReveal(el, el.dataset.reveal, false)
    );
    qsa('[data-reveal-load]', root).forEach((el) =>
      this.addReveal(el, el.dataset.revealLoad, true)
    );
    qsa('[data-scrub-lines]', root).forEach((el) => this.addScrubLines(el));
    qsa('[data-cta-fill]', root).forEach((el) => this.addCtaFill(el));
    qsa('[data-counter]', root).forEach((el) => this.addCounter(el));
    qsa('[data-parallax]', root).forEach((el) => this.addParallax(el));
    qsa('[data-parallax-img]', root).forEach((el) => this.addParallaxImg(el));
  }

  /* one masked reveal (scroll- or load-triggered) */
  addReveal(el, kind, onLoad) {
    const entry = { el, kind, onLoad, played: false };
    const make = () => {
      let targets;
      let vars;
      if (kind === 'lines' || kind === 'words' || kind === 'chars') {
        entry.split = new Split(el, kind);
        targets = entry.split.targets();
        vars =
          kind === 'chars'
            ? { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: EASE_IN, stagger: 0.016 }
            : {
                yPercent: 0,
                duration: kind === 'words' ? 1.0 : 1.1,
                ease: EASE_IN,
                stagger: kind === 'words' ? 0.06 : 0.08,
              };
        gsap.set(targets, kind === 'chars' ? { yPercent: 60, autoAlpha: 0 } : { yPercent: 110 });
      } else if (kind === 'image') {
        const img = el.querySelector('img');
        targets = el;
        gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
        if (img) gsap.set(img, { scale: 1.25 });
        vars = { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE_IN };
        if (img) entry.imgTween = () => gsap.to(img, { scale: 1, duration: 1.4, ease: EASE_IN });
      } else {
        targets = el;
        gsap.set(el, { y: 28, autoAlpha: 0 });
        vars = { y: 0, autoAlpha: 1, duration: 1.0, ease: 'power3.out' };
      }
      el.classList.add('is-ready');
      entry.tl = gsap.timeline({ paused: true, onComplete: () => (entry.played = true) });
      entry.tl.to(targets, vars, 0);
      if (entry.imgTween) entry.tl.add(entry.imgTween(), 0);
    };
    make();
    entry.remake = make;

    if (onLoad) {
      this.loadTl.add(() => entry.tl.play(), this.loadTl.duration() > 0 ? '<0.14' : 0);
    } else {
      entry.st = ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: true,
        onEnter: () => entry.tl.play(),
      });
    }
    this.entries.push(entry);
  }

  addScrubLines(el) {
    const entry = { el, kind: 'scrub-lines' };
    const make = () => {
      entry.split = new Split(el, 'lines');
      const lines = entry.split.targets();
      gsap.set(lines, { yPercent: 70, autoAlpha: 0 });
      el.classList.add('is-ready');
      entry.tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          end: 'top 38%',
          scrub: 0.6,
        },
      });
      entry.tl.to(lines, { yPercent: 0, autoAlpha: 1, stagger: 0.22, ease: 'none' });
    };
    make();
    entry.remake = make;
    this.entries.push(entry);
  }

  addCtaFill(el) {
    const entry = { el, kind: 'cta-fill' };
    const make = () => {
      entry.split = new Split(el, 'chars');
      el.classList.add('is-ready');
      entry.tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 96%',
          end: 'top 55%',
          scrub: 0.4,
        },
      });
      entry.tl.to(entry.split.chars, { color: '#F2F1EF', stagger: 0.06, ease: 'none' });
    };
    make();
    entry.remake = make;
    this.entries.push(entry);
  }

  addCounter(el) {
    const target = parseFloat(el.dataset.counter);
    const obj = { v: 0 };
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => (el.textContent = Math.round(obj.v)),
        }),
    });
    this.entries.push({ el, kind: 'counter', st });
  }

  addParallax(el) {
    const amount = parseFloat(el.dataset.parallax) || -8;
    const section = el.closest('section') || el;
    const tl = gsap.to(el, {
      yPercent: amount * 4,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
    this.entries.push({ el, kind: 'parallax', tl });
  }

  addParallaxImg(el) {
    const img = el.querySelector('img');
    if (!img) return;
    gsap.set(el, { clipPath: 'inset(38% 0% 38% 0%)' });
    const open = ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () =>
        gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: EASE_IN }),
    });
    const drift = gsap.fromTo(
      img,
      { yPercent: -5.5 },
      {
        yPercent: 5.5,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
    this.entries.push({ el, kind: 'parallax-img', st: open, tl: drift });
  }

  /* ------------------------------------------------------------ public */

  /** page-enter reveals (hero content) — call after preloader/veil */
  playLoad() {
    this.loadTl.play();
    return this.loadTl;
  }

  onResize() {
    if (window.innerWidth === this.width) return;
    this.width = window.innerWidth;
    clearTimeout(this.resizeT);
    this.resizeT = setTimeout(() => {
      this.entries.forEach((entry) => {
        if (!entry.split || !entry.remake) return;
        if (entry.tl) {
          if (entry.tl.scrollTrigger) entry.tl.scrollTrigger.kill();
          entry.tl.kill();
        }
        entry.split.revert();
        if (entry.kind === 'scrub-lines' || entry.kind === 'cta-fill') {
          entry.remake();
        } else if (entry.played || entry.onLoad) {
          // already shown — resplit and pin to final state
          entry.split = new Split(entry.el, entry.kind);
          const t = entry.split.targets();
          gsap.set(t, { yPercent: 0, autoAlpha: 1 });
          entry.el.classList.add('is-ready');
        } else {
          entry.remake();
          entry.st?.kill();
          entry.st = ScrollTrigger.create({
            trigger: entry.el,
            start: 'top 80%',
            once: true,
            onEnter: () => entry.tl.play(),
          });
        }
      });
      ScrollTrigger.refresh();
    }, 220);
  }

  kill() {
    window.removeEventListener('resize', this.onResize);
    clearTimeout(this.resizeT);
    this.loadTl.kill();
    this.entries.forEach((e) => {
      e.st?.kill();
      if (e.tl) {
        e.tl.scrollTrigger?.kill();
        e.tl.kill();
      }
      e.split?.revert();
    });
    this.entries = [];
  }
}
