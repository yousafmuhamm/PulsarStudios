/**
 * Hero scene — Pulsar's signature: a cluster of soft, translucent,
 * fresnel-lit blobs that beat like a pulsar (~every 2.4s), drift,
 * softly collide, and spring away from the cursor.
 *
 * Exposes `state` { y, scale, opacity } so the page module can
 * choreograph the scroll handoff and the philosophy "ghost" pass.
 */
import { glx, THREE } from './renderer.js';
import { blobVertex, blobFragment } from './shaders.js';
import { lowPower, reducedMotion } from '../utils/env.js';

const PULSE_PERIOD = 2.4;

const COL_A = new THREE.Color('#6533FF');
const COL_B = new THREE.Color('#31C6E8');
const COL_EDGE = new THREE.Color('#B8FF2C');

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

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.z = 8;

  const group = new THREE.Group();
  scene.add(group);

  // 72 segments is visually identical after bloom at these sizes and cuts
  // the vertex-noise workload by ~60% vs the original 110
  const segs = lowPower ? 40 : 72;
  const geometry = new THREE.SphereGeometry(1, segs, segs);

  const count = lowPower ? 2 : BLOBS.length;
  const blobs = [];
  let viewW = 10;
  let viewH = 6;

  for (let i = 0; i < count; i++) {
    const cfg = BLOBS[i];
    const material = new THREE.ShaderMaterial({
      vertexShader: blobVertex,
      fragmentShader: blobFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 0 },
        uAmp: { value: 0.16 },
        uSeed: { value: i * 7.31 + 1.7 },
        uColorA: { value: COL_A },
        uColorB: { value: COL_B },
        uColorEdge: { value: COL_EDGE },
        uOpacity: { value: 1 },
        uHueShift: { value: i / count },
      },
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(cfg.r);
    group.add(mesh);
    blobs.push({
      cfg,
      mesh,
      material,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      home: new THREE.Vector3(),
      phase: i * 2.1,
    });
  }

  /* ---------------------------------------------------------- pointer */
  const pointerNdc = new THREE.Vector2(10, 10); // offscreen
  const pointerWorld = new THREE.Vector3(999, 999, 0);
  const rayVec = new THREE.Vector3();
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
      const d = Math.max(tmp.length(), 0.35);
      tmp.normalize().multiplyScalar(Math.min(5.5 / d, 4.5));
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
    rayVec.set(pointerNdc.x, pointerNdc.y, 0.5).unproject(camera).sub(camera.position).normalize();
    const t = -camera.position.z / rayVec.z;
    pointerWorld.copy(camera.position).addScaledVector(rayVec, t);
  };

  /* ------------------------------------------------------------ state */
  const state = { y: 0, scale: 1, opacity: 0 };
  let time = Math.random() * 10;
  const tmp = new THREE.Vector3();

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
      if (b.pos.lengthSq() === 0) b.pos.copy(b.home);
    });
  };

  const api = {
    scene,
    camera,
    state,

    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
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
        b.vel.addScaledVector(tmp, 2.3 * clampedDt);

        if (pointerActive) {
          tmp.copy(b.pos).sub(pointerWorld);
          tmp.z = 0;
          const d = tmp.length();
          // fast swipes reach further and push harder — the cluster
          // scatters when you slash through it, barely stirs when you drift
          const boost = 1 + pointerSpeed * 1.1;
          const R = (b.cfg.r + 1.5) * (1 + pointerSpeed * 0.35);
          if (d < R && d > 0.001) {
            b.vel.addScaledVector(tmp.normalize(), (1 - d / R) * 13 * boost * clampedDt);
          }
        }

        b.vel.multiplyScalar(Math.exp(-2.6 * clampedDt));
        b.pos.addScaledVector(b.vel, clampedDt);
      });

      // soft sphere-sphere separation
      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const a = blobs[i];
          const c = blobs[j];
          tmp.copy(a.pos).sub(c.pos);
          const d = tmp.length();
          const minD = (a.cfg.r + c.cfg.r) * 0.92;
          if (d < minD && d > 0.001) {
            tmp.normalize().multiplyScalar((minD - d) * 0.5);
            a.pos.add(tmp);
            c.pos.sub(tmp);
          }
        }
      }

      group.position.y = state.y;
      group.scale.setScalar(state.scale);

      // parallax tilt — the whole cluster leans gently toward the cursor
      if (pointerActive) {
        const k = 1 - Math.exp(-3 * dt);
        group.rotation.y += (pointerNdc.x * 0.16 - group.rotation.y) * k;
        group.rotation.x += (-pointerNdc.y * 0.1 - group.rotation.x) * k;
      }

      blobs.forEach((b) => {
        b.mesh.position.copy(b.pos);
        b.material.uniforms.uTime.value = time;
        b.material.uniforms.uPulse.value = pulse;
        b.material.uniforms.uOpacity.value = state.opacity;
      });

      glx.renderer.render(scene, camera);
    },

    dispose() {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onDown);
      geometry.dispose();
      blobs.forEach((b) => b.material.dispose());
    },
  };

  return api;
}
