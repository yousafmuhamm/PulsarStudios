/**
 * Home — WebGL hero orb cluster, pinned horizontal Featured Work,
 * philosophy ghost pass where the blobs faintly return.
 */
import { gsap, ScrollTrigger } from '../core.js';
import { basePage } from './base.js';
import { glx } from '../gl/renderer.js';
import { createHeroScene } from '../gl/heroScene.js';
import { createCardsScene } from '../gl/cardsScene.js';
import { isTouch, reducedMotion, qsa } from '../utils/env.js';

export function createHomePage(main) {
  let hero = null;
  let cards = null;

  // opacity choreography: intro × scroll fade, overridden by the ghost pass
  const intro = { v: 0 };
  const ghost = { v: 0 };
  let scrollP = 0;
  const applyOpacity = () => {
    if (!hero) return;
    hero.state.opacity = Math.max(intro.v * (1 - scrollP * 0.96), ghost.v);
  };

  return basePage(main, {
    setup() {
      // pinned horizontal Featured Work (desktop; touch gets native swipe)
      const pin = main.querySelector('[data-work-pin]');
      const track = main.querySelector('[data-work-track]');
      if (pin && track && !isTouch && !reducedMotion) {
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        gsap.to(track, {
          x: () => -dist(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: () => '+=' + dist(),
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }

      hero = createHeroScene();
      if (hero) {
        glx.add(hero);
        if (reducedMotion) {
          intro.v = 1;
          applyOpacity();
          glx.renderOnce();
        } else {
          const heroEl = main.querySelector('[data-hero]');
          ScrollTrigger.create({
            trigger: heroEl,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => {
              scrollP = self.progress;
              hero.state.y = -scrollP * 3.4;
              hero.state.scale = 1 - scrollP * 0.3;
              applyOpacity();
            },
          });

          // faint return behind the dark philosophy section
          const phil = main.querySelector('[data-philosophy]');
          if (phil) {
            const toGhost = (v) =>
              gsap.to(ghost, { v, duration: 1.2, ease: 'power2.out', onUpdate: applyOpacity, overwrite: 'auto' });
            ScrollTrigger.create({
              trigger: phil,
              start: 'top 65%',
              end: 'bottom 35%',
              onEnter: () => toGhost(0.14),
              onLeave: () => toGhost(0),
              onEnterBack: () => toGhost(0.14),
              onLeaveBack: () => toGhost(0),
            });
          }
        }
      }

      cards = createCardsScene(qsa('[data-gl-img]', main));
      if (cards) glx.add(cards);
    },

    enter() {
      if (hero && !reducedMotion) {
        gsap.fromTo(
          hero.state,
          { scale: 0.68 },
          { scale: 1, duration: 1.8, ease: 'expo.out', delay: 0.05 }
        );
        gsap.to(intro, { v: 1, duration: 1.4, ease: 'power2.out', delay: 0.05, onUpdate: applyOpacity });
      }
    },

    destroy() {
      if (hero) {
        glx.remove(hero);
        hero = null;
      }
      if (cards) {
        glx.remove(cards);
        cards = null;
      }
    },
  });
}
