/**
 * Cards scene — project images become GL planes with a hover shader:
 * RGB-shift + wave distortion driven by cursor velocity, lerping to rest.
 * Plane positions are synced to their DOM rects every frame (only while
 * on screen, gated by an IntersectionObserver), which stays correct
 * through Lenis scroll, pins and the horizontal work section.
 */
import { glx, THREE } from './renderer.js';
import { cardVertex, cardFragment } from './shaders.js';
import { gsap } from '../core.js';
import { isTouch, reducedMotion } from '../utils/env.js';

export function createCardsScene(els) {
  if (!glx.ok || !els.length || reducedMotion) return null;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const geometry = new THREE.PlaneGeometry(1, 1);
  let vw = window.innerWidth;
  let vh = window.innerHeight;

  // shared cursor velocity → uv-space rgb shift
  const vel = { x: 0, y: 0 };
  const shift = { x: 0, y: 0 };
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  const onPointer = (e) => {
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

    const material = new THREE.ShaderMaterial({
      vertexShader: cardVertex,
      fragmentShader: cardFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uMap: { value: null },
        uHover: { value: 0 },
        uTime: { value: Math.random() * 20 },
        uShift: { value: new THREE.Vector2() },
        uSize: { value: new THREE.Vector2(1, 1) },
        uRadius: { value: 6 },
        uParallax: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);

    const plane = { el, img, mesh, material, ready: false, hover: 0 };

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
      const tex = new THREE.CanvasTexture(cnv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
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
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
    },

    render(_t, dt) {
      // velocity decays to rest; shift eases toward velocity
      vel.x *= Math.exp(-6 * dt);
      vel.y *= Math.exp(-6 * dt);
      shift.x += (vel.x - shift.x) * Math.min(1, dt * 10);
      shift.y += (vel.y - shift.y) * Math.min(1, dt * 10);

      let any = false;
      active.forEach((p) => {
        if (!p.ready) return;
        any = true;
        const r = p.el.getBoundingClientRect();
        p.mesh.scale.set(r.width, r.height, 1);
        p.mesh.position.set(r.left + r.width / 2 - vw / 2, -(r.top + r.height / 2) + vh / 2, 0);
        p.material.uniforms.uTime.value += dt;
        p.material.uniforms.uSize.value.set(r.width, r.height);
        p.material.uniforms.uShift.value.set(shift.x * 0.045, shift.y * 0.03);
        // inner-image parallax: the photo pans as its card travels across
        // the viewport (horizontal work section + vertical scroll alike)
        p.material.uniforms.uParallax.value = gsap.utils.clamp(
          -1,
          1,
          (r.left + r.width / 2 - vw / 2) / (vw * 0.5)
        );
      });
      if (any) glx.renderer.render(scene, camera);
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
        p.tex?.dispose();
        p.material.dispose();
      });
      geometry.dispose();
    },
  };
}
