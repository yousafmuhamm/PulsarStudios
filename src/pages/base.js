/**
 * Base page module — every page gets reveals, marquees, magnetic
 * buttons and footer fx. Page-specific behaviour plugs in via hooks:
 *   setup({ main })   runs inside the page's gsap.context()
 *   enter()           after the veil/preloader reveals the page
 *   destroy()         before the DOM is swapped out
 */
import { gsap } from '../core.js';
import { RevealManager } from '../anims/reveals.js';
import { magnetize } from '../anims/magnetic.js';
import { initPageFx } from '../ui/pageFx.js';

export function basePage(main, hooks = {}) {
  let ctx;
  let reveals;
  let fx;
  let mag;

  return {
    main,
    init() {
      ctx = gsap.context(() => {
        reveals = new RevealManager(main);
        fx = initPageFx(main);
        hooks.setup?.({ main });
      }, main);
      mag = magnetize(main);
    },
    enter() {
      hooks.enter?.();
      return reveals?.playLoad();
    },
    destroy() {
      hooks.destroy?.();
      fx?.kill();
      reveals?.kill();
      mag?.kill();
      ctx?.revert();
    },
  };
}
