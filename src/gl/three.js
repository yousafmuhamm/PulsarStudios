// Named re-exports of only the Three.js classes this project uses, so
// Rollup can tree-shake the rest of the library out of the bundle.
export {
  WebGLRenderer, WebGLRenderTarget, Scene, Camera, PerspectiveCamera,
  Group, Mesh, ShaderMaterial, BufferGeometry, BufferAttribute,
  PlaneGeometry, SphereGeometry, Color, Vector2, Vector3, CanvasTexture,
  HalfFloatType, LinearFilter, ClampToEdgeWrapping, NoBlending, SRGBColorSpace,
} from 'three';
