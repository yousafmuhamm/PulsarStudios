/**
 * Hero scene — Pulsar's signature: a cluster of soft, translucent,
 * fresnel-lit blobs that beat like a pulsar (~every 2.4s), drift,
 * softly collide, and spring away from the cursor.
 *
 * Exposes `state` { y, scale, opacity } so the page module can
 * choreograph the scroll handoff and the philosophy "ghost" pass.
 *
 * OGL port (Task C): class-for-class swap from Three.js. See
 * docs/superpowers/plans/2026-07-09-ogl-port-subplan.md — "Scene-Target
 * Contract" — render() must draw into glx.sceneTarget, not the screen.
 */
import { glx, OGL } from './oglRenderer.js';
import { blobVertex, blobFragment } from './shaders.js';
import { lenis } from '../core.js';
import { lowPower, reducedMotion } from '../utils/env.js';

const PULSE_PERIOD = 2.4;

const COL_A = new OGL.Color('#6533FF');
const COL_B = new OGL.Color('#31C6E8');
const COL_EDGE = new OGL.Color('#B8FF2C');

// home positions as fractions of half-viewport (x right of centre), radius in world units
const BLOBS = [
  { fx: 0.42, fy: -0.06, fz: 0.0, r: 1.5 },
  { fx: 0.78, fy: 0.52, fz: -0.4, r: 0.92 },
  { fx: 0.86, fy: -0.62, fz: 0.2, r: 0.66 },
  { fx: 0.16, fy: 0.74, fz: -0.2, r: 0.46 },
  { fx: 0.05, fy: -0.78, fz: 0.3, r: 0.34 },
];

export function createHeroScene() {
  if (!glx.ok) return null;

  const gl = glx.renderer.gl;

  const scene = new OGL.Transform();
  const camera = new OGL.Camera(gl, { fov: 34, aspect: 1, near: 0.1, far: 40 });
  camera.position.z = 8;

  const group = new OGL.Transform();
  group.setParent(scene);

  // 72 segments is visually identical after bloom at these sizes and cuts
  // the vertex-noise workload by ~60% vs the original 110
  const segs = lowPower ? 40 : 72;
  const geometry = new OGL.Sphere(gl, { radius: 1, widthSegments: segs, heightSegments: segs });

  const count = lowPower ? 2 : BLOBS.length;
  const blobs = [];
  let viewW = 10;
  let viewH = 6;

  for (let i = 0; i < count; i++) {
    const cfg = BLOBS[i];
    const material = new OGL.Program(gl, {
      vertex: blobVertex,
      fragment: blobFragment,
      transparent: true,
      depthWrite: false,
      // Three's ShaderMaterial defaults `side: THREE.FrontSide` (back-face
      // culled) even though the original never set `side` explicitly.
      // OGL's Program also defaults cullFace to gl.BACK, so simply not
      // passing cullFace here matches Three's default. Explicitly passing
      // `cullFace:false` (as the API translation table's generic example
      // suggested) was wrong for this material: with depthWrite:false the
      // sphere's back faces then blended on top of the front faces every
      // frame, roughly doubling the alpha/color contribution per pixel and
      // washing the blobs out to near-white (Task C finding — this was the
      // main visual-fidelity bug, not a positioning or color-uniform issue).
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 0 },
        uAmp: { value: 0.16 },
        uSeed: { value: i * 7.31 + 1.7 },
        uTurb: { value: 0 },
        uColorA: { value: COL_A },
        uColorB: { value: COL_B },
        uColorEdge: { value: COL_EDGE },
        uOpacity: { value: 1 },
        uHueShift: { value: i / count },
      },
    });
    // OGL's Program picks its transparent blend func from the renderer's
    // premultipliedAlpha flag: (ONE, ONE_MINUS_SRC_ALPHA) when true, assuming
    // the fragment shader already outputs col*alpha. blobFragment outputs
    // straight (non-premultiplied) color — `vec4(col, alpha)` — matching
    // Three's NormalBlending, which always uses (SRC_ALPHA,
    // ONE_MINUS_SRC_ALPHA) for ShaderMaterial regardless of the renderer's
    // canvas-level premultipliedAlpha setting (that flag only affects how
    // Three composites the *canvas* against the page, not per-material
    // blending). Without this override, overlapping front/back-lit regions
    // of each sphere accumulate near-full color on every blend, washing the
    // whole cluster out to white (Task C finding).
    // Separate alpha blend so sceneRT accumulates PREMULTIPLIED content, which
    // is what the bloom composite (oglPost.js) reads ("premultiplied →
    // transparent = 0"). RGB uses straight (SRC_ALPHA, ONE_MINUS_SRC_ALPHA)
    // against the zero-cleared target → stores col*alpha (premultiplied). The
    // ALPHA channel must use (ONE, ONE_MINUS_SRC_ALPHA) so coverage accumulates
    // correctly instead of the two-arg form's srcA*srcA under-accumulation,
    // which drained the alpha and washed the blobs to near-invisible. This
    // mirrors Three's premultipliedAlpha blendFuncSeparate for the sceneRT.
    material.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const mesh = new OGL.Mesh(gl, { geometry, program: material });
    mesh.scale.set(cfg.r, cfg.r, cfg.r);
    mesh.setParent(group);
    blobs.push({
      cfg,
      mesh,
      material,
      pos: new OGL.Vec3(),
      vel: new OGL.Vec3(),
      home: new OGL.Vec3(),
      phase: i * 2.1,
    });
  }

  /* ---------------------------------------------------------- pointer */
  const pointerNdc = new OGL.Vec2(10, 10); // offscreen
  const pointerWorld = new OGL.Vec3(999, 999, 0);
  const rayVec = new OGL.Vec3();
  let pointerActive = false;
  let pointerSpeed = 0; // smoothed, ~0..2 — fast swipes push blobs harder
  let lastPX = 0;
  let lastPY = 0;
  let lastPT = 0;
  let burst = 0; // click shockwave, decays each frame

  const onPointer = (e) => {
    pointerNdc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const now = performance.now();
    if (lastPT) {
      const dt = Math.max(now - lastPT, 8);
      const d = Math.hypot(e.clientX - lastPX, e.clientY - lastPY) / dt; // px per ms
      pointerSpeed += (Math.min(d * 1.4, 2) - pointerSpeed) * 0.18;
    }
    lastPX = e.clientX;
    lastPY = e.clientY;
    lastPT = now;
    pointerActive = true;
  };

  // press anywhere in the hero → radial shockwave: blobs kick away from
  // the click and the pulse flashes, like tapping the surface of a pond
  const onDown = (e) => {
    if (state.opacity < 0.05) return; // hero not visible (scrolled past)
    if (e.target.closest('a, button, [data-magnetic]')) return;
    onPointer(e);
    updatePointerWorld();
    blobs.forEach((b) => {
      tmp.copy(b.pos).sub(pointerWorld);
      tmp.z = 0;
      const d = Math.max(tmp.len(), 0.35);
      tmp.normalize().multiply(Math.min(5.5 / d, 4.5));
      b.vel.add(tmp);
    });
    burst = 1;
  };

  if (!lowPower && !reducedMotion) {
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
  }

  const updatePointerWorld = () => {
    // ray from camera through NDC, intersected with the z=0 plane
    rayVec.set(pointerNdc.x, pointerNdc.y, 0.5);
    camera.unproject(rayVec);
    rayVec.sub(camera.position).normalize();
    const t = -camera.position.z / rayVec.z;
    pointerWorld.copy(camera.position).add(tmpScaled.copy(rayVec).multiply(t));
  };

  /* ------------------------------------------------------------ state */
  const state = { y: 0, scale: 1, opacity: 0 };
  let time = Math.random() * 10;
  let turb = 0; // smoothed scroll-velocity turbulence
  const tmp = new OGL.Vec3();
  const tmpScaled = new OGL.Vec3();

  let narrow = false;
  const layout = () => {
    blobs.forEach((b) => {
      b.home.set(
        narrow
          ? (b.cfg.fx - 0.45) * viewW * 0.5 // centred cluster on small screens
          : (0.06 + b.cfg.fx * 0.36) * viewW, // right-of-centre on desktop
        b.cfg.fy * viewH * 0.34,
        b.cfg.fz
      );
      if (b.pos.len() * b.pos.len() === 0) b.pos.copy(b.home);
    });
  };

  const api = {
    scene,
    camera,
    state,

    resize(w, h) {
      camera.perspective({ aspect: w / h });
      viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      viewW = viewH * camera.aspect;
      narrow = w < 760;
      layout();
    },

    render(_gsapTime, dt) {
      time += dt;

      // pulsar beat + click shockwave flash
      const phase = (time % PULSE_PERIOD) / PULSE_PERIOD;
      let pulse = Math.exp(-5.2 * phase) + 0.18 * Math.exp(-26 * phase);
      if (burst > 0.001) {
        pulse = Math.min(pulse + burst * 0.85, 1.4);
        burst *= Math.exp(-4.2 * dt);
      }

      if (pointerActive) updatePointerWorld();
      pointerSpeed *= Math.exp(-1.6 * dt); // settle when the cursor rests

      // physics
      const clampedDt = Math.min(dt, 1 / 30);
      blobs.forEach((b) => {
        const driftX = Math.sin(time * 0.21 + b.phase) * 0.24;
        const driftY = Math.cos(time * 0.17 + b.phase * 1.4) * 0.28;

        tmp.set(b.home.x + driftX - b.pos.x, b.home.y + driftY - b.pos.y, b.home.z - b.pos.z);
        b.vel.add(tmpScaled.copy(tmp).multiply(2.3 * clampedDt));

        if (pointerActive) {
          tmp.copy(b.pos).sub(pointerWorld);
          tmp.z = 0;
          const d = tmp.len();
          // fast swipes reach further and push harder — the cluster
          // scatters when you slash through it, barely stirs when you drift
          const boost = 1 + pointerSpeed * 1.1;
          const R = (b.cfg.r + 1.5) * (1 + pointerSpeed * 0.35);
          if (d < R && d > 0.001) {
            tmp.normalize();
            b.vel.add(tmpScaled.copy(tmp).multiply((1 - d / R) * 13 * boost * clampedDt));
          }
        }

        b.vel.multiply(Math.exp(-2.6 * clampedDt));
        b.pos.add(tmpScaled.copy(b.vel).multiply(clampedDt));
      });

      // soft sphere-sphere separation
      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const a = blobs[i];
          const c = blobs[j];
          tmp.copy(a.pos).sub(c.pos);
          const d = tmp.len();
          const minD = (a.cfg.r + c.cfg.r) * 0.92;
          if (d < minD && d > 0.001) {
            tmp.normalize().multiply((minD - d) * 0.5);
            a.pos.add(tmp);
            c.pos.sub(tmp);
          }
        }
      }

      group.position.y = state.y;
      group.scale.set(state.scale, state.scale, state.scale);

      // scroll velocity → surface turbulence (settles when you stop)
      const sv = lenis ? Math.min(Math.abs(lenis.velocity || 0) / 40, 1) : 0;
      turb += (sv - turb) * Math.min(1, dt * 6);
      // fast scroll also pumps the composite RGB-split for a kinetic streak
      glx.pumpAberration(turb * 0.0022);

      // parallax tilt — the whole cluster leans gently toward the cursor
      if (pointerActive) {
        const k = 1 - Math.exp(-3 * dt);
        group.rotation.y += (pointerNdc.x * 0.16 - group.rotation.y) * k;
        group.rotation.x += (-pointerNdc.y * 0.1 - group.rotation.x) * k;
      }

      blobs.forEach((b) => {
        // depth parallax: blobs further back (more negative fz) shift LESS
        // with the pointer than near ones → real 3D separation, not a flat tilt
        const depth = 1 + b.cfg.fz * 0.5; // ~0.6..1.15
        b.mesh.position.set(
          b.pos.x + pointerNdc.x * 0.35 * depth,
          b.pos.y + pointerNdc.y * 0.25 * depth,
          b.pos.z
        );
        b.material.uniforms.uTime.value = time;
        b.material.uniforms.uPulse.value = pulse;
        b.material.uniforms.uOpacity.value = state.opacity;
        b.material.uniforms.uTurb.value = turb;
      });

      glx.renderer.render({ scene, camera, target: glx.sceneTarget, clear: false });
    },

    dispose() {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onDown);
      gl.deleteBuffer(geometry.attributes.position.buffer);
      gl.deleteBuffer(geometry.attributes.normal.buffer);
      gl.deleteBuffer(geometry.attributes.uv.buffer);
      if (geometry.attributes.index) gl.deleteBuffer(geometry.attributes.index.buffer);
      blobs.forEach((b) => gl.deleteProgram(b.material.program));
    },
  };

  return api;
}
