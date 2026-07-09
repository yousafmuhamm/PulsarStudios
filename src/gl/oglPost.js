/**
 * OGL twin of `post.js` — GL postprocessing for the persistent canvas.
 *
 * The scene layer is a *transparent overlay* over the HTML page, so this
 * pass is written to preserve premultiplied alpha — bloom only brightens
 * where there is actual content, and empty pixels stay fully transparent
 * so the CSS background (and page text) shows through untouched.
 *
 * Pipeline per frame:
 *   scenes ─▶ sceneRT (half-float)
 *            ├─▶ bright-pass ─▶ blur H ─▶ blur V   (half res, ×2 iterations)
 *            └─▶ composite (scene + bloom + scroll-velocity RGB split) ─▶ screen
 *
 * Owned and driven by oglRenderer.js. Gated off on low-power / reduced-motion
 * upstream, so this module assumes it should run when it exists.
 *
 * Framebuffer-state note: every pass below — including the final blit to
 * the screen — goes through `renderer.render({ scene, camera, target })`.
 * OGL's Renderer caches the currently-bound framebuffer in
 * `renderer.state.framebuffer` and only issues `gl.bindFramebuffer` when
 * that cache is stale (see `Renderer.bindFramebuffer`). If any code path
 * here bound a framebuffer with raw `gl.bindFramebuffer` calls instead,
 * the cache would go stale and a later `renderer.render({target: null})`
 * could silently no-op the rebind, leaving the composite drawn into an
 * offscreen target instead of the screen (black canvas). So this module
 * never touches `gl.bindFramebuffer` directly — `renderer.render()` is the
 * only thing that binds framebuffers, for every single pass, screen
 * included, keeping the cache authoritative throughout.
 */
import { Geometry, Camera, Mesh, Program, RenderTarget, Vec2 } from 'ogl';
import { lenis } from '../core.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const BASE_VERT = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const BRIGHT_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform float uThreshold;
uniform float uKnee;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(tMap, vUv);
  float l = max(c.r, max(c.g, c.b));           // premultiplied → transparent = 0
  float s = smoothstep(uThreshold, uThreshold + uKnee, l);
  gl_FragColor = vec4(c.rgb * s, c.a * s);
}`;

const BLUR_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uDir;   // texel size along the blur axis
varying vec2 vUv;
void main() {
  vec4 sum = texture2D(tMap, vUv) * 0.227027;
  sum += texture2D(tMap, vUv + uDir * 1.3846) * 0.316216;
  sum += texture2D(tMap, vUv - uDir * 1.3846) * 0.316216;
  sum += texture2D(tMap, vUv + uDir * 3.2307) * 0.070270;
  sum += texture2D(tMap, vUv - uDir * 3.2307) * 0.070270;
  gl_FragColor = sum;
}`;

const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform float uBloom;
uniform vec2 uAberr;   // uv-space RGB split (grows with scroll velocity)
varying vec2 vUv;
void main() {
  vec2 d = uAberr;
  vec4 sr = texture2D(tScene, vUv + d);
  vec4 sg = texture2D(tScene, vUv);
  vec4 sb = texture2D(tScene, vUv - d);
  vec3 base = vec3(sr.r, sg.g, sb.b);
  float a = max(sr.a, max(sg.a, sb.a));
  vec4 bloom = texture2D(tBloom, vUv);
  vec3 rgb = base + bloom.rgb * uBloom;
  a = min(1.0, a + bloom.a * uBloom * 0.6);
  gl_FragColor = vec4(rgb, a);
}`;

function makeRT(gl, w, h) {
  return new RenderTarget(gl, {
    width: Math.max(1, w),
    height: Math.max(1, h),
    depth: false,
    stencil: false,
    type: gl.HALF_FLOAT,
    magFilter: gl.LINEAR,
    minFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
  });
}

export function createPost(renderer) {
  const BLOOM_SCALE = 0.4; // bloom is inherently soft — quarter-ish res is plenty
  const gl = renderer.gl;

  // fullscreen triangle
  const geo = new Geometry(gl, {
    position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
    uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
  });
  // no camera needed: BASE_VERT writes gl_Position directly from `position`,
  // no MVP matrices involved — renderer.render() tolerates camera:undefined.
  const cam = undefined;

  const brightProg = new Program(gl, {
    vertex: BASE_VERT,
    fragment: BRIGHT_FRAG,
    depthTest: false,
    depthWrite: false,
    cullFace: false,
    uniforms: {
      tMap: { value: null },
      uThreshold: { value: 0.55 },
      uKnee: { value: 0.28 },
    },
  });
  const blurProg = new Program(gl, {
    vertex: BASE_VERT,
    fragment: BLUR_FRAG,
    depthTest: false,
    depthWrite: false,
    cullFace: false,
    uniforms: { tMap: { value: null }, uDir: { value: new Vec2() } },
  });
  // Mirrors post.js's `transparent:true, blending:NoBlending` — Three's
  // NoBlending forces a raw overwrite (no GL blend equation) even though
  // the material is flagged transparent for sort-bucket purposes. OGL only
  // enables gl.BLEND when a Program's blendFunc is set (see Program.js:
  // `if (this.blendFunc.src) enable(BLEND)`), so simply never calling
  // setBlendFunc / passing `transparent:true` here reproduces the same
  // "compute final alpha in-shader, write it straight" behavior.
  const compProg = new Program(gl, {
    vertex: BASE_VERT,
    fragment: COMPOSITE_FRAG,
    depthTest: false,
    depthWrite: false,
    cullFace: false,
    uniforms: {
      tScene: { value: null },
      tBloom: { value: null },
      uBloom: { value: 0.72 },
      uAberr: { value: new Vec2() },
    },
  });

  const quad = new Mesh(gl, { geometry: geo, program: brightProg });

  // blit `prog` into `target` (target === null blits to the screen)
  function blit(prog, target) {
    quad.program = prog;
    renderer.render({ scene: quad, camera: cam, target, sort: false, frustumCull: false, clear: true });
  }

  let sceneRT, brightRT, blurA, blurB;
  let bw = 1;
  let bh = 1;
  let aberr = 0; // smoothed scroll-driven RGB split
  let quality = 1; // 0..1 from the adaptive tier
  let extraShift = 0; // scroll-velocity RGB split boost, set per frame by the page

  function resize(w, h) {
    const dpr = renderer.dpr || 1;
    const fw = Math.max(1, Math.round(w * dpr));
    const fh = Math.max(1, Math.round(h * dpr));
    bw = Math.max(1, Math.round(fw * BLOOM_SCALE));
    bh = Math.max(1, Math.round(fh * BLOOM_SCALE));

    if (!sceneRT) {
      sceneRT = makeRT(gl, fw, fh);
      brightRT = makeRT(gl, bw, bh);
      blurA = makeRT(gl, bw, bh);
      blurB = makeRT(gl, bw, bh);
    } else {
      sceneRT.setSize(fw, fh);
      brightRT.setSize(bw, bh);
      blurA.setSize(bw, bh);
      blurB.setSize(bw, bh);
    }
  }

  // bind the offscreen target and clear it; scenes render into it as usual
  function begin() {
    renderer.bindFramebuffer(sceneRT);
    renderer.setViewport(sceneRT.width, sceneRT.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  // bloom + composite to screen
  function end() {
    // bright-pass
    brightProg.uniforms.tMap.value = sceneRT.texture;
    blit(brightProg, brightRT);

    // separable gaussian — 4 passes at full quality, 2 when the tier drops
    // (halving blur passes is the cheapest big fill-rate win under stress)
    const passes =
      quality > 0.6
        ? [
            [brightRT, blurA, [1 / bw, 0]],
            [blurA, blurB, [0, 1 / bh]],
            [blurB, blurA, [1.6 / bw, 0]],
            [blurA, blurB, [0, 1.6 / bh]],
          ]
        : [
            [brightRT, blurA, [1.3 / bw, 0]],
            [blurA, blurB, [0, 1.3 / bh]],
          ];
    let lastDst = brightRT;
    for (const [src, dst, dir] of passes) {
      blurProg.uniforms.tMap.value = src.texture;
      blurProg.uniforms.uDir.value.set(dir[0], dir[1]);
      blit(blurProg, dst);
      lastDst = dst;
    }

    // scroll-velocity → RGB split, smoothed, with a faint idle baseline.
    // extraShift lets the page pump it further on fast flicks (interactivity).
    const v = lenis ? Math.abs(lenis.velocity || 0) : 0;
    const target = clamp((0.0006 + v * 0.00006 + extraShift) * quality, 0, 0.006);
    aberr += (target - aberr) * 0.15;
    compProg.uniforms.uAberr.value.set(aberr, 0);
    compProg.uniforms.uBloom.value = 0.5 + 0.22 * quality;

    compProg.uniforms.tScene.value = sceneRT.texture;
    compProg.uniforms.tBloom.value = lastDst.texture;
    blit(compProg, null);
  }

  function setQuality(q) {
    quality = q;
  }
  function setExtraShift(s) {
    extraShift = s;
  }

  function dispose() {
    gl.deleteProgram(brightProg.program);
    gl.deleteProgram(blurProg.program);
    gl.deleteProgram(compProg.program);
    for (const key in geo.attributes) {
      const attr = geo.attributes[key];
      if (attr.buffer) gl.deleteBuffer(attr.buffer);
    }
    const deleteRT = (rt) => {
      if (!rt) return;
      rt.textures.forEach((t) => gl.deleteTexture(t.texture));
      if (rt.depthBuffer) gl.deleteRenderbuffer(rt.depthBuffer);
      if (rt.stencilBuffer) gl.deleteRenderbuffer(rt.stencilBuffer);
      if (rt.depthStencilBuffer) gl.deleteRenderbuffer(rt.depthStencilBuffer);
      gl.deleteFramebuffer(rt.buffer);
    };
    deleteRT(sceneRT);
    deleteRT(brightRT);
    deleteRT(blurA);
    deleteRT(blurB);
  }

  return { resize, begin, end, dispose, setQuality, setExtraShift };
}
