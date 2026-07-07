/**
 * Page-transition veil — a full-viewport ink panel sweeping up with a
 * curved leading edge that flattens as it covers (and a trailing curve
 * on the way out). SVG path in a 100×140 box; the viewport occupies
 * y = 20…120, leaving headroom for the bulge on both edges.
 */
import { gsap } from '../core.js';
import { reducedMotion } from '../utils/env.js';

const TOP = 20; // viewBox y of viewport top
const OFF = 140; // fully offscreen (below)
const BULGE = 13;

export function createVeil() {
  const veil = document.querySelector('[data-veil]');
  const path = document.querySelector('[data-veil-path]');
  const brand = document.querySelector('[data-veil-brand]');
  if (!veil || !path) {
    return { cover: async () => {}, reveal: async () => {} };
  }

  const state = { top: OFF, bot: OFF, bulgeTop: 0, bulgeBot: 0 };

  const draw = () => {
    path.setAttribute(
      'd',
      `M 0 ${state.top} Q 50 ${state.top - state.bulgeTop} 100 ${state.top} ` +
        `L 100 ${state.bot} Q 50 ${state.bot + state.bulgeBot} 0 ${state.bot} Z`
    );
  };

  return {
    /** sweep up until the screen is covered; resolves at full cover */
    cover() {
      if (reducedMotion) {
        state.top = TOP;
        state.bot = OFF;
        state.bulgeTop = state.bulgeBot = 0;
        veil.classList.add('is-active');
        draw();
        return gsap.to(brand, { autoAlpha: 1, duration: 0.2 }).then();
      }
      veil.classList.add('is-active');
      state.top = OFF;
      state.bot = OFF;
      state.bulgeTop = state.bulgeBot = 0;
      draw();
      const tl = gsap.timeline();
      tl.to(state, {
        top: TOP,
        duration: 0.55,
        ease: 'expo.inOut',
        onUpdate() {
          state.bulgeTop = Math.sin(this.progress() * Math.PI) * BULGE;
          draw();
        },
      });
      tl.to(brand, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }, '-=0.2');
      return tl.then();
    },

    /** collapse upward, trailing edge curving down, revealing the new page */
    reveal() {
      if (reducedMotion) {
        veil.classList.remove('is-active');
        return gsap.to(brand, { autoAlpha: 0, duration: 0.15 }).then();
      }
      const tl = gsap.timeline();
      tl.to(brand, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0);
      tl.to(
        state,
        {
          bot: TOP,
          duration: 0.6,
          ease: 'expo.inOut',
          onUpdate() {
            state.bulgeBot = Math.sin(this.progress() * Math.PI) * BULGE;
            draw();
          },
          onComplete() {
            veil.classList.remove('is-active');
            state.top = state.bot = OFF;
            state.bulgeTop = state.bulgeBot = 0;
            draw();
          },
        },
        0.05
      );
      return tl.then();
    },
  };
}
