/**
 * One persistent OGL Renderer on the fixed full-viewport canvas.
 * Owns the rAF loop (via gsap.ticker), resize, DPR cap and a scene
 * registry — page modules mount/unmount scenes around navigations.
 *
 * OGL twin of `renderer.js` (Three.js). Same public interface so
 * downstream consumers (main.js, pages/home.js, heroScene.js,
 * cardsScene.js) can switch import paths later without other changes.
 *
 * A scene is: { render(timeSec, dtSec), resize(w, h), dispose() }
 */
import {
  Renderer, Transform, Camera, Mesh, Program, Sphere, Plane, Geometry,
  RenderTarget, Texture, Vec2, Vec3, Color,
} from 'ogl';
import { gsap } from '../core.js';
import { lowPower, reducedMotion } from '../utils/env.js';
import { tier } from './quality.js';
import { createPost } from './oglPost.js';

// full-frame bloom + chromatic aberration; skipped on constrained devices
const POST_ENABLED = !reducedMotion && !lowPower;

// bag of OGL classes scenes need — mirrors the old `export * as THREE` shape
export const OGL = {
  Transform, Camera, Mesh, Program, Sphere, Plane, Geometry,
  RenderTarget, Texture, Vec2, Vec3, Color,
};

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
      this.renderer = new Renderer({
        canvas,
        alpha: true,
        // Three's WebGLRenderer defaults premultipliedAlpha:true, and
        // oglPost's composite shader writes premultiplied output (see its
        // header comment) to match. OGL defaults this to false — leaving it
        // off makes the browser treat the canvas's RGB as straight alpha, so
        // the premultiplied composite reads as a solid black canvas over the
        // whole page. Must match Three's default for the page to show
        // through correctly (Task C finding: fixes a fully-opaque hero).
        premultipliedAlpha: true,
        // MSAA only pays off when drawing straight to screen — under the
        // post pipeline every scene renders into a target, so skip it there
        antialias: !lowPower && !POST_ENABLED,
        powerPreference: 'high-performance',
        // scene rendering handles its own clearing (see tick/renderOnce);
        // OGL's autoClear would double-clear against our explicit calls
        autoClear: false,
      });
    } catch {
      this.failed = true;
      return;
    }
    this.renderer.gl.clearColor(0, 0, 0, 0);
    // Three's WebGLRenderer enables the float-color-buffer extensions
    // internally whenever a HalfFloatType render target is used; OGL does
    // not, and WebGL2 refuses to attach a HALF_FLOAT texture as a color
    // target until this is explicitly enabled (framebuffer status comes
    // back FRAMEBUFFER_INCOMPLETE_ATTACHMENT, so oglPost's sceneRT/bloom
    // targets silently fail to render into — the entire scene render was a
    // no-op with no console error). Must request this before oglPost builds
    // its half-float RenderTargets below (Task C finding).
    this.renderer.gl.getExtension('EXT_color_buffer_float');
    // ...and OES_texture_float_linear so the bloom/composite passes can
    // LINEARLY SAMPLE those half-float targets. Most desktop GL backends allow
    // half-float linear filtering implicitly, but ANGLE-on-Metal (Apple
    // silicon) strictly enforces the spec: without this extension, a LINEAR
    // fetch from a HALF_FLOAT texture returns ZEROS — silently, no error — so
    // the composite reads black and the whole hero vanishes on M-series Macs
    // while rendering fine elsewhere. Three's WebGLRenderer requests this
    // internally; OGL does not. (Root cause of "bubbles gone on M3 Pro".)
    this.renderer.gl.getExtension('OES_texture_float_linear');
    this.setSize();

    if (POST_ENABLED) {
      // Synchronous wiring (matches the Three.js renderer.js): building the
      // post pipeline inline in init() means bloom is live on the very
      // first frame. An async import here would race the first tick and
      // show a flash of unbloomed output before the pipeline finishes
      // loading.
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
    this.renderer.dpr = dpr;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.post) this.post.resize(window.innerWidth, window.innerHeight);
  }

  get ok() {
    return !!this.renderer;
  }

  /** current scene render target: the bloom input RT when post is on, else screen (null) */
  get sceneTarget() {
    return this.post ? this.post.sceneRT() : null;
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
    if (scene._removed) return;
    // OGL has no compileAsync (no KHR_parallel_shader_compile). Programs link
    // in their constructor, but most drivers defer the real cost — final
    // program validation + GPU upload — to the first draw that USES the
    // program. Under the live ticker that first draw lands on a visible frame,
    // producing a startup stutter (Three sidesteps this with compileAsync).
    // So warm the scene here with one off-loop render into the scene target,
    // absorbing the first-draw cost now (the preloader still covers the
    // screen), so the scene enters the ticker already hot.
    if (!reducedMotion && scene.scene && scene.camera) {
      try {
        if (this.post) this.post.begin();
        scene.render(0, 1 / 60);
        // discard the warm frame so it never reaches the screen unbloomed
        this.renderer.gl.bindFramebuffer(this.renderer.gl.FRAMEBUFFER, null);
        this.renderer.gl.clear(this.renderer.gl.COLOR_BUFFER_BIT | this.renderer.gl.DEPTH_BUFFER_BIT);
      } catch {
        /* warm-up is best-effort; a failure here must never block mounting */
      }
    }
    this.scenes.add(scene);
    if (reducedMotion) this.renderOnce();
  }

  remove(scene) {
    scene._removed = true;
    this.scenes.delete(scene);
    scene.dispose();
    if (!this.scenes.size && this.renderer) {
      this.renderer.gl.clear(this.renderer.gl.COLOR_BUFFER_BIT | this.renderer.gl.DEPTH_BUFFER_BIT);
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
        const gl = this.renderer.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
      const gl = this.renderer.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.scenes.forEach((s) => s.render(time, dt));
    }
  }

  /** single static frame for prefers-reduced-motion */
  renderOnce() {
    if (!this.renderer || !this.scenes.size) return;
    const gl = this.renderer.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.cleared = false;
    this.scenes.forEach((s) => s.render(0.4, 1 / 60));
  }
}

export const glx = new GL();
