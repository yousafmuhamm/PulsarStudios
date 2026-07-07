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

// full-frame bloom + chromatic aberration; skipped on constrained devices
const POST_ENABLED = !reducedMotion && !lowPower;

class GL {
  constructor() {
    this.scenes = new Set();
    this.renderer = null;
    this.post = null;
    this.failed = false;
    this.cleared = true;
  }

  init(canvas) {
    if (this.renderer || this.failed || !canvas) return;
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !lowPower,
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

    if (!reducedMotion) {
      this.tick = this.tick.bind(this);
      gsap.ticker.add(this.tick);
    }
  }

  get ok() {
    return !!this.renderer;
  }

  setSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    if (this.post) this.post.resize(window.innerWidth, window.innerHeight);
  }

  onResize() {
    if (!this.renderer) return;
    this.setSize();
    this.scenes.forEach((s) => s.resize(window.innerWidth, window.innerHeight));
    if (reducedMotion) this.renderOnce();
  }

  add(scene) {
    if (!this.renderer) return;
    this.scenes.add(scene);
    scene.resize(window.innerWidth, window.innerHeight);
    if (reducedMotion) this.renderOnce();
  }

  remove(scene) {
    this.scenes.delete(scene);
    scene.dispose();
    if (!this.scenes.size && this.renderer) {
      this.renderer.clear();
      this.cleared = true;
    }
  }

  tick(time, dtMs) {
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
