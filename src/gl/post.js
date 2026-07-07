/**
 * GL postprocessing for the persistent canvas.
 *
 * The scene layer is a *transparent overlay* over the HTML page, so this
 * pass is written to preserve premultiplied alpha — bloom only brightens
 * where there is actual content, and empty pixels stay fully transparent
 * so the CSS background (and page text) shows through untouched.
 *
 * Pipeline per frame:
 *   scenes ─▶ sceneRT (MSAA, half-float)
 *            ├─▶ bright-pass ─▶ blur H ─▶ blur V   (half res, ×2 iterations)
 *            └─▶ composite (scene + bloom + scroll-velocity RGB split) ─▶ screen
 *
 * Owned and driven by renderer.js. Gated off on low-power / reduced-motion
 * upstream, so this module assumes it should run when it exists.
 */
import { THREE } from './renderer.js';
import { lenis } from '../core.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const BASE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
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

function makeRT(w, h, extra = {}) {
  return new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
    depthBuffer: false,
    stencilBuffer: false,
    type: THREE.HalfFloatType,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    ...extra,
  });
}

export function createPost(renderer) {
  const BLOOM_SCALE = 0.5;

  // fullscreen triangle
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const cam = new THREE.Camera();
  const quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(geo);
  quadScene.add(quad);
  const blit = (mat) => {
    quad.material = mat;
    renderer.render(quadScene, cam);
  };

  const brightMat = new THREE.ShaderMaterial({
    vertexShader: BASE_VERT,
    fragmentShader: BRIGHT_FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tMap: { value: null },
      uThreshold: { value: 0.55 },
      uKnee: { value: 0.28 },
    },
  });
  const blurMat = new THREE.ShaderMaterial({
    vertexShader: BASE_VERT,
    fragmentShader: BLUR_FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: { tMap: { value: null }, uDir: { value: new THREE.Vector2() } },
  });
  const compMat = new THREE.ShaderMaterial({
    vertexShader: BASE_VERT,
    fragmentShader: COMPOSITE_FRAG,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: THREE.NoBlending,
    uniforms: {
      tScene: { value: null },
      tBloom: { value: null },
      uBloom: { value: 0.72 },
      uAberr: { value: new THREE.Vector2() },
    },
  });

  let sceneRT, brightRT, blurA, blurB;
  let bw = 1;
  let bh = 1;
  let aberr = 0; // smoothed scroll-driven RGB split

  function resize(w, h) {
    const dpr = renderer.getPixelRatio();
    const fw = Math.max(1, Math.round(w * dpr));
    const fh = Math.max(1, Math.round(h * dpr));
    bw = Math.max(1, Math.round(fw * BLOOM_SCALE));
    bh = Math.max(1, Math.round(fh * BLOOM_SCALE));

    if (!sceneRT) {
      sceneRT = makeRT(fw, fh);
      brightRT = makeRT(bw, bh);
      blurA = makeRT(bw, bh);
      blurB = makeRT(bw, bh);
    } else {
      sceneRT.setSize(fw, fh);
      brightRT.setSize(bw, bh);
      blurA.setSize(bw, bh);
      blurB.setSize(bw, bh);
    }
  }

  // bind the offscreen target and clear it; scenes render into it as usual
  function begin() {
    renderer.setRenderTarget(sceneRT);
    renderer.clear();
  }

  // bloom + composite to screen
  function end() {
    // bright-pass
    brightMat.uniforms.tMap.value = sceneRT.texture;
    renderer.setRenderTarget(brightRT);
    renderer.clear();
    blit(brightMat);

    // two separable gaussian iterations
    const passes = [
      [brightRT, blurA, [1 / bw, 0]],
      [blurA, blurB, [0, 1 / bh]],
      [blurB, blurA, [1.6 / bw, 0]],
      [blurA, blurB, [0, 1.6 / bh]],
    ];
    for (const [src, dst, dir] of passes) {
      blurMat.uniforms.tMap.value = src.texture;
      blurMat.uniforms.uDir.value.set(dir[0], dir[1]);
      renderer.setRenderTarget(dst);
      renderer.clear();
      blit(blurMat);
    }

    // scroll-velocity → RGB split, smoothed, with a faint idle baseline
    const v = lenis ? Math.abs(lenis.velocity || 0) : 0;
    const target = clamp(0.0006 + v * 0.00006, 0, 0.004);
    aberr += (target - aberr) * 0.15;
    compMat.uniforms.uAberr.value.set(aberr, 0);

    compMat.uniforms.tScene.value = sceneRT.texture;
    compMat.uniforms.tBloom.value = blurB.texture;
    renderer.setRenderTarget(null);
    blit(compMat);
  }

  function dispose() {
    geo.dispose();
    brightMat.dispose();
    blurMat.dispose();
    compMat.dispose();
    sceneRT?.dispose();
    brightRT?.dispose();
    blurA?.dispose();
    blurB?.dispose();
  }

  return { resize, begin, end, dispose };
}
