/**
 * Project detail — hero image scale-in + parallax; body sections are
 * handled declaratively (scrub paragraphs, parallax images, stats).
 * The next-project block reuses the auto-advance gesture from pageFx.
 */
import { gsap, ScrollTrigger } from '../core.js';
import { basePage } from './base.js';
import { reducedMotion } from '../utils/env.js';

export function createProjectPage(main) {
  let heroImg = null;

  return basePage(main, {
    setup() {
      const heroFig = main.querySelector('[data-case-hero]');
      heroImg = heroFig?.querySelector('img');
      if (heroFig && heroImg && !reducedMotion) {
        gsap.set(heroImg, { scale: 1.18 });
        gsap.fromTo(
          heroImg,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: 'none',
            scrollTrigger: {
              trigger: heroFig,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      }
    },

    enter() {
      if (heroImg && !reducedMotion) {
        gsap.to(heroImg, { scale: 1, duration: 1.6, ease: 'expo.out' });
      }
    },
  });
}
