/**
 * Home — WebGL hero orb cluster, pinned horizontal Featured Work,
 * philosophy ghost pass where the blobs faintly return.
 */
import { gsap, ScrollTrigger } from '../core.js';
import { basePage } from './base.js';
import { loadGL } from '../main.js';
import { isTouch, reducedMotion, qsa } from '../utils/env.js';

export function createHomePage(main) {
  let hero = null;
  let killGlow = null;
  let destroyed = false;
  // ScrollTriggers/tweens created after the async GL chunk resolves land
  // outside basePage's gsap.context() (setup() has already returned by
  // then), so they aren't swept by ctx.revert() — track and kill them here.
  let glTriggers = [];

  // opacity choreography: intro × scroll fade, overridden by the ghost pass
  const intro = { v: 0 };
  const ghost = { v: 0 };
  let scrollP = 0;
  const applyOpacity = () => {
    if (!hero) return;
    hero.state.opacity = Math.max(intro.v * (1 - scrollP * 0.96), ghost.v);
  };

  // --- GL (lazy) ---------------------------------------------------------

  let glx = null;
  let entered = false;
  let heroReady = false;

  async function setupGL() {
    const gl = await loadGL();
    if (destroyed) return; // page torn down before the chunk resolved
    glx = gl;

    const { createHeroScene } = await import('../gl/heroScene.js');
    if (destroyed) return;

    hero = createHeroScene();
    if (hero) {
      glx.add(hero);
      if (reducedMotion) {
        intro.v = 1;
        applyOpacity();
        glx.renderOnce();
      } else {
        const heroEl = main.querySelector('[data-hero]');
        glTriggers.push(
          ScrollTrigger.create({
            trigger: heroEl,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6, // smoothing on the handoff — the cluster drifts, never snaps
            onUpdate: (self) => {
              scrollP = self.progress;
              hero.state.y = -scrollP * 3.4;
              hero.state.scale = 1 - scrollP * 0.3;
              applyOpacity();
            },
          })
        );

        // faint return behind the dark philosophy section
        const phil = main.querySelector('[data-philosophy]');
        if (phil) {
          const toGhost = (v) =>
            gsap.to(ghost, { v, duration: 1.2, ease: 'power2.out', onUpdate: applyOpacity, overwrite: 'auto' });
          glTriggers.push(
            ScrollTrigger.create({
              trigger: phil,
              start: 'top 65%',
              end: 'bottom 35%',
              onEnter: () => toGhost(0.14),
              onLeave: () => toGhost(0),
              onEnterBack: () => toGhost(0.14),
              onLeaveBack: () => toGhost(0),
            })
          );
        }
      }
    }

    // Featured Work cards intentionally render as plain <img> thumbnails now
    // (no WebGL warp/hover-distortion) — the GL cards scene made the tall
    // screenshots read as cropped/off, so we show them clean instead. The
    // hero blob scene above is unaffected. (createCardsScene left imported
    // but unused-on-home; kept for a possible future toggle.)
    heroReady = true;
    // enter() may have already run (and found no hero yet) if the GL
    // chunk resolved after the reveal — play the intro now instead.
    if (entered) playHeroIntro();
  }

  function playHeroIntro() {
    if (!hero || !heroReady || reducedMotion || hero._introPlayed) return;
    hero._introPlayed = true;
    // the cluster is already breathing in while the words reveal, so
    // the page arrives "alive" instead of assembling piece by piece
    gsap.fromTo(
      hero.state,
      { scale: 0.62 },
      { scale: 1, duration: 2.4, ease: 'expo.out' }
    );
    gsap.to(intro, { v: 1, duration: 1.1, ease: 'power2.out', onUpdate: applyOpacity });
  }

  return basePage(main, {
    setup() {
      // pinned horizontal Featured Work (desktop; touch gets native swipe)
      const pin = main.querySelector('[data-work-pin]');
      const track = main.querySelector('[data-work-track]');
      if (pin && track && !isTouch && !reducedMotion) {
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const scrollTween = gsap.to(track, {
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

        // cards rise + settle as they come in from the right of the
        // horizontal track (containerAnimation maps triggers to track x)
        qsa('.work-card', main).forEach((card) => {
          gsap.from(card, {
            y: 90,
            rotation: 2.5,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              containerAnimation: scrollTween,
              start: 'left 95%',
              once: true,
            },
          });
        });
      }

      // hero glow follows the cursor (drives the ::before radial-gradient)
      const heroEl = main.querySelector('[data-hero]');
      if (heroEl && !isTouch && !reducedMotion) {
        const cur = { x: 68, y: 42 };
        const target = { x: 68, y: 42 };
        const onMove = (e) => {
          target.x = (e.clientX / window.innerWidth) * 100;
          target.y = (e.clientY / window.innerHeight) * 100;
        };
        let wx = -1;
        let wy = -1;
        const glowTick = () => {
          cur.x += (target.x - cur.x) * 0.05;
          cur.y += (target.y - cur.y) * 0.05;
          // custom-property writes repaint the whole hero gradient — only
          // touch style when the value moved a visible amount
          const qx = Math.round(cur.x * 4) / 4;
          const qy = Math.round(cur.y * 4) / 4;
          if (qx !== wx || qy !== wy) {
            wx = qx;
            wy = qy;
            heroEl.style.setProperty('--hx', qx + '%');
            heroEl.style.setProperty('--hy', qy + '%');
          }
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        gsap.ticker.add(glowTick);
        killGlow = () => {
          window.removeEventListener('pointermove', onMove);
          gsap.ticker.remove(glowTick);
        };
      }

      // GL is a separate async chunk (loaded by main.js after first paint).
      // Kick off scene creation without blocking setup()/gsap.context(),
      // which must stay synchronous. `destroyed` guards against the page
      // being torn down (router nav away) before the chunk resolves.
      //
      // On touch devices we skip WebGL ENTIRELY — no canvas, no render loop,
      // no GPU cost — so weak mobile hardware stays smooth for scrolling and
      // taps. The hero instead gets a pure-CSS glow (html.touch .hero, see
      // _home.scss) that echoes the blob colours. Desktop is unaffected.
      if (!isTouch) setupGL();
    },

    enter() {
      entered = true;
      playHeroIntro();
    },

    destroy() {
      destroyed = true;
      killGlow?.();
      killGlow = null;
      glTriggers.forEach((t) => t.kill());
      glTriggers = [];
      if (hero) {
        glx?.remove(hero);
        hero = null;
      }
    },
  });
}
