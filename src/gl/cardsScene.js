/**
 * Cards scene — project images become GL planes with a hover shader:
 * RGB-shift + wave distortion + a real 3D tilt toward the cursor.
 *
 * Smoothness (the Lusion scroll-sync lesson): a fixed canvas reading each
 * card's getBoundingClientRect() mid-tick catches positions the compositor
 * has already moved, so planes drift and snap during scroll. Fixes here:
 *   1. batch ALL rect reads at the top of the tick (one layout flush, not N
 *      interleaved read/writes that thrash layout)
 *   2. lerp each plane toward its measured slot so any single-frame desync
 *      resolves as smooth motion instead of a visible jump
 * Perspective camera (not ortho) so the tilt reads as genuine 3D depth.
 *
 * OGL port (Task D): class-for-class swap from Three.js. See heroScene.js
 * (Task C) for the scene-target contract and premultiplied-blend fix this
 * mirrors.
 */
import { glx, OGL } from './oglRenderer.js';
import { cardVertex, cardFragment } from './shaders.js';
import { gsap } from '../core.js';
import { isTouch, reducedMotion } from '../utils/env.js';

export function createCardsScene(els) {
  if (!glx.ok || !els.length || reducedMotion) return null;

  const gl = glx.renderer.gl;

  const scene = new OGL.Transform();
  let vw = window.innerWidth;
  let vh = window.innerHeight;

  // perspective camera positioned so 1px == 1 world unit at z=0 (screen plane),
  // which lets tilted planes catch real foreshortening
  const camDist = 1000;
  const fov = 2 * Math.atan(vh / 2 / camDist) * (180 / Math.PI);
  const camera = new OGL.Camera(gl, { fov, aspect: vw / vh, near: 10, far: 4000 });
  camera.position.z = camDist;
  const geometry = new OGL.Plane(gl, { width: 1, height: 1 });

  // shared cursor position (px) + velocity → uv-space rgb shift + tilt anchor
  const vel = { x: 0, y: 0 };
  const shift = { x: 0, y: 0 };
  const ptr = { x: -9999, y: -9999 };
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  const onPointer = (e) => {
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    const now = performance.now();
    const dt = Math.max(now - lastT, 8) / 1000;
    vel.x = gsap.utils.clamp(-1.6, 1.6, ((e.clientX - lastX) / dt) * 0.0004);
    vel.y = gsap.utils.clamp(-1.6, 1.6, ((e.clientY - lastY) / dt) * 0.0004);
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  const planes = [];
  const active = new Set();
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        const p = planes.find((pl) => pl.el === entry.target);
        if (!p) return;
        if (entry.isIntersecting) active.add(p);
        else active.delete(p);
        p.mesh.visible = entry.isIntersecting;
      }),
    { rootMargin: '80px' }
  );

  els.forEach((el) => {
    const img = el.querySelector('img');
    if (!img) return;

    const material = new OGL.Program(gl, {
      vertex: cardVertex,
      fragment: cardFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uMap: { value: null },
        uHover: { value: 0 },
        uTime: { value: Math.random() * 20 },
        uShift: { value: new OGL.Vec2() },
        uSize: { value: new OGL.Vec2(1, 1) },
        uRadius: { value: 6 },
        uParallax: { value: 0 },
      },
    });
    // Separate-alpha premultiplied blend so sceneRT accumulates content the
    // way oglPost's composite expects (see heroScene.js's identical fix —
    // Task C finding). cardFragment outputs straight (non-premultiplied)
    // color with a rounded-rect mask alpha; without this override OGL's
    // default transparent blend func (chosen from the renderer's
    // premultipliedAlpha:true flag) reads the sceneRT wrong and cards wash
    // out / lose the mask edge.
    material.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const mesh = new OGL.Mesh(gl, { geometry, program: material });
    mesh.visible = false;
    mesh.setParent(scene);

    const plane = {
      el,
      img,
      mesh,
      material,
      ready: false,
      hover: 0,
      // lerped display position/size + tilt state
      px: 0,
      py: 0,
      pw: 0,
      ph: 0,
      init: false,
      tiltX: 0,
      tiltY: 0,
      pop: 0,
    };

    // rasterise the (same-origin SVG) image into a texture
    const src = img.currentSrc || img.src;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const cnv = document.createElement('canvas');
      cnv.width = 1024;
      cnv.height = 768;
      const c2d = cnv.getContext('2d');
      c2d.drawImage(image, 0, 0, cnv.width, cnv.height);
      const tex = new OGL.Texture(gl, {
        image: cnv,
        generateMipmaps: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
      });
      material.uniforms.uMap.value = tex;
      plane.tex = tex;
      plane.ready = true;
      img.style.opacity = '0'; // GL takes over; DOM img keeps layout + a11y
    };
    image.src = src;

    if (!isTouch) {
      plane.onEnter = () =>
        gsap.to(material.uniforms.uHover, { value: 1, duration: 0.55, ease: 'power2.out', overwrite: 'auto' });
      plane.onLeave = () =>
        gsap.to(material.uniforms.uHover, { value: 0, duration: 0.8, ease: 'power3.out', overwrite: 'auto' });
      el.addEventListener('mouseenter', plane.onEnter);
      el.addEventListener('mouseleave', plane.onLeave);
    }

    io.observe(el);
    planes.push(plane);
  });

  return {
    scene,
    camera,

    resize(w, h) {
      vw = w;
      vh = h;
      camera.fov = 2 * Math.atan(vh / 2 / camDist) * (180 / Math.PI);
      camera.perspective({ fov: camera.fov, aspect: w / h });
    },

    render(_t, dt) {
      // velocity decays to rest; shift eases toward velocity
      vel.x *= Math.exp(-6 * dt);
      vel.y *= Math.exp(-6 * dt);
      shift.x += (vel.x - shift.x) * Math.min(1, dt * 10);
      shift.y += (vel.y - shift.y) * Math.min(1, dt * 10);

      // ---- PASS 1: batch every rect read (single layout flush, no thrash) ----
      const live = [];
      active.forEach((p) => {
        if (!p.ready) return;
        const r = p.el.getBoundingClientRect();
        p.tx = r.left + r.width / 2 - vw / 2;
        p.ty = -(r.top + r.height / 2) + vh / 2;
        p.tw = r.width;
        p.th = r.height;
        live.push(p);
      });
      if (!live.length) return;

      // ---- PASS 2: lerp toward measured slots + 3D tilt, then all writes ----
      const posK = Math.min(1, dt * 22); // fast enough to feel locked, soft enough to hide desync
      const tiltK = Math.min(1, dt * 9);
      live.forEach((p) => {
        if (!p.init) {
          p.px = p.tx;
          p.py = p.ty;
          p.pw = p.tw;
          p.ph = p.th;
          p.init = true;
        }
        p.px += (p.tx - p.px) * posK;
        p.py += (p.ty - p.py) * posK;
        p.pw += (p.tw - p.pw) * posK;
        p.ph += (p.th - p.ph) * posK;

        // 3D tilt: how far is the cursor across THIS card, -1..1 each axis
        const cx = p.tx; // card centre in screen space (y-up)
        const cy = p.ty;
        const mx = ptr.x - vw / 2;
        const my = -(ptr.y - vh / 2);
        const within =
          p.hover > 0.01 &&
          Math.abs(mx - cx) < p.tw * 0.75 &&
          Math.abs(my - cy) < p.th * 0.75;
        const nx = within ? gsap.utils.clamp(-1, 1, (mx - cx) / (p.tw / 2)) : 0;
        const ny = within ? gsap.utils.clamp(-1, 1, (my - cy) / (p.th / 2)) : 0;
        // tilt AWAY on the far edge, toward on the near edge → pop-out feel
        const targetTiltX = -ny * 0.18; // rotate about X from vertical cursor pos
        const targetTiltY = nx * 0.18; // rotate about Y from horizontal cursor pos
        p.tiltX += (targetTiltX - p.tiltX) * tiltK;
        p.tiltY += (targetTiltY - p.tiltY) * tiltK;
        p.pop += ((within ? 60 : 0) - p.pop) * tiltK; // lift toward camera on hover

        p.mesh.position.set(p.px, p.py, p.pop);
        p.mesh.scale.set(p.pw, p.ph, 1);
        p.mesh.rotation.set(p.tiltX, p.tiltY, 0);
        p.material.uniforms.uTime.value += dt;
        p.material.uniforms.uSize.value.set(p.pw, p.ph);
        p.material.uniforms.uShift.value.set(shift.x * 0.045, shift.y * 0.03);
        p.material.uniforms.uParallax.value = gsap.utils.clamp(-1, 1, p.px / (vw * 0.5));
      });
      glx.renderer.render({ scene, camera, target: glx.sceneTarget, clear: false });
    },

    dispose() {
      window.removeEventListener('pointermove', onPointer);
      io.disconnect();
      planes.forEach((p) => {
        if (p.onEnter) {
          p.el.removeEventListener('mouseenter', p.onEnter);
          p.el.removeEventListener('mouseleave', p.onLeave);
        }
        p.img.style.opacity = '';
        if (p.tex) gl.deleteTexture(p.tex.texture);
        gl.deleteProgram(p.material.program);
      });
      gl.deleteBuffer(geometry.attributes.position.buffer);
      gl.deleteBuffer(geometry.attributes.uv.buffer);
      gl.deleteBuffer(geometry.attributes.normal.buffer);
      if (geometry.attributes.index) gl.deleteBuffer(geometry.attributes.index.buffer);
    },
  };
}
