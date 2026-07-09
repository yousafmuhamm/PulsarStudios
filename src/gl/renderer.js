/**
 * One persistent WebGLRenderer on the fixed full-viewport canvas.
 * Owns the rAF loop (via gsap.ticker), resize, DPR cap and a scene
 * registry — page modules mount/unmount scenes around navigations.
 *
 * A scene is: { render(timeSec, dtSec), resize(w, h), dispose() }
 */
import * as THREE from 'three';
import { gsap } from '../core.js';
import { lowPower, reducedMotion } from '../utils/env.js';
import { createPost } from './post.js';
import { tier } from './quality.js';

// full-frame bloom + chromatic aberration; skipped on constrained devices
const POST_ENABLED = !reducedMotion && !lowPower;

class GL {
  constructor() {
    this.scenes = new Set();
    this.renderer = null;
    this.post = null;
    this.failed = false;
    this.cleared = true;
    this.paused = false; // tab hidden → stop drawing entirely
    this._lastDpr = 0;
  }

  init(canvas) {
    if (this.renderer || this.failed || !canvas) return;
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        // MSAA only pays off when drawing straight to screen — under the
        // post pipeline every scene renders into a target, so skip it there
        antialias: !lowPower && !POST_ENABLED,
        powerPreference: 'high-performance',
      });
    } catch {
      this.failed = true;
      return;
    }
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000, 0);
    this.setSize();

    if (POST_ENABLED) {
      this.post = createPost(this.renderer);
      this.post.resize(window.innerWidth, window.innerHeight);
    }

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    // stop rendering when the tab is backgrounded — pure battery/CPU waste
    this._onVis = () => {
      this.paused = document.hidden;
    };
    document.addEventListener('visibilitychange', this._onVis);

    if (!reducedMotion) {
      // adaptive quality: re-apply DPR live as the tier moves
      tier.start();
      tier.onChange(() => this.applyDpr());
      this.tick = this.tick.bind(this);
      gsap.ticker.add(this.tick);
    }
  }

  /** DPR from the current quality tier, re-applied only when it changes */
  applyDpr() {
    if (!this.renderer) return;
    const dpr = reducedMotion ? Math.min(window.devicePixelRatio || 1, 2) : tier.dpr();
    if (Math.abs(dpr - this._lastDpr) < 0.02) return;
    this._lastDpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    if (this.post) this.post.resize(window.innerWidth, window.innerHeight);
  }

  get ok() {
    return !!this.renderer;
  }

  setSize() {
    // DPR is owned by the adaptive tier; start at its current value
    this._lastDpr = 0;
    this.applyDpr();
  }

  onResize() {
    if (!this.renderer) return;
    this.setSize();
    this.scenes.forEach((s) => s.resize(window.innerWidth, window.innerHeight));
    if (reducedMotion) this.renderOnce();
  }

  add(scene) {
    if (!this.renderer) return;
    scene.resize(window.innerWidth, window.innerHeight);
    // Compile shaders off the main thread (KHR_parallel_shader_compile)
    // before the scene joins the render loop, so the first frame never
    // blocks on synchronous program linking.
    const mount = () => {
      if (scene._removed) return;
      this.scenes.add(scene);
      if (reducedMotion) this.renderOnce();
    };
    if (!reducedMotion && scene.scene && scene.camera && this.renderer.compileAsync) {
      this.renderer.compileAsync(scene.scene, scene.camera).then(mount, mount);
    } else {
      mount();
    }
  }

  remove(scene) {
    scene._removed = true;
    this.scenes.delete(scene);
    scene.dispose();
    if (!this.scenes.size && this.renderer) {
      this.renderer.clear();
      this.cleared = true;
    }
  }

  /** page hook: push extra RGB-split into the composite (0..~0.004) */
  pumpAberration(amount) {
    this.post?.setExtraShift(amount);
  }

  tick(time, dtMs) {
    if (this.paused) return;
    if (!this.scenes.size) {
      if (!this.cleared) {
        this.renderer.setRenderTarget(null);
        this.renderer.clear();
        this.cleared = true;
      }
      return;
    }
    this.cleared = false;
    const dt = Math.min(dtMs / 1000, 1 / 30);
    if (this.post) {
      this.post.setQuality(tier.value);
      this.post.begin(); // scenes render into the offscreen target
      this.scenes.forEach((s) => s.render(time, dt));
      this.post.end(); // bloom + composite to screen
    } else {
      this.renderer.clear();
      this.scenes.forEach((s) => s.render(time, dt));
    }
  }

  /** single static frame for prefers-reduced-motion */
  renderOnce() {
    if (!this.renderer || !this.scenes.size) return;
    this.renderer.clear();
    this.cleared = false;
    this.scenes.forEach((s) => s.render(0.4, 1 / 60));
  }
}

export const glx = new GL();
export { THREE };
