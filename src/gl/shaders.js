/**
 * GLSL for the hero orb cluster and the card hover-distortion planes.
 * Simplex noise: Ashima Arts / Ian McEwan (MIT / public domain).
 */

export const simplex3 = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

export const blobVertex = /* glsl */ `
uniform float uTime;
uniform float uPulse;
uniform float uAmp;
uniform float uSeed;
uniform float uTurb;   // scroll-velocity turbulence, 0..1
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorldNormal;
varying float vNoise;
${simplex3}
void main() {
  // second, faster noise octave gains amplitude with scroll turbulence, so
  // the surface roils when you fling the page and settles when you rest
  float n = snoise(normal * 1.35 + vec3(uSeed) + uTime * 0.22);
  float n2 = snoise(normal * 3.4 - vec3(uSeed * 0.7) + uTime * (0.14 + uTurb * 0.6));
  float amp = uAmp * (1.0 + uTurb * 1.4);
  float disp = (n * 0.75 + n2 * 0.25) * amp * (0.55 + 0.45 * uPulse) + uPulse * 0.05;
  vec3 pos = position + normal * disp;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vNoise = n;
  gl_Position = projectionMatrix * mv;
}`;

export const blobFragment = /* glsl */ `
precision highp float;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorEdge;
uniform float uOpacity;
uniform float uTime;
uniform float uHueShift;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorldNormal;
varying float vNoise;

// cheap procedural "studio" environment: two soft key lights + gradient sky,
// sampled by the reflection vector — gives the blob a wet, glossy 3D read
// without an actual cubemap texture (zero bandwidth, one function).
vec3 envSample(vec3 dir) {
  vec3 sky = mix(vec3(0.04, 0.05, 0.09), vec3(0.55, 0.60, 0.78), dir.y * 0.5 + 0.5);
  float key = pow(max(dot(dir, normalize(vec3(0.5, 0.8, 0.35))), 0.0), 24.0);
  float rim = pow(max(dot(dir, normalize(vec3(-0.6, 0.3, -0.5))), 0.0), 8.0);
  return sky + key * vec3(1.4, 1.3, 1.1) + rim * vec3(0.4, 0.9, 0.3);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);

  // iridescent base
  float sweep = smoothstep(-0.7, 0.8, vNoise + sin(uTime * 0.3 + uHueShift * 6.283) * 0.35 + N.y * 0.4);
  vec3 col = mix(uColorA, uColorB, sweep);
  col = mix(col, uColorEdge, fres * 0.9);

  // environment reflection — strongest at grazing angles, like real gloss
  vec3 refl = reflect(-V, N);
  vec3 env = envSample(normalize(vWorldNormal + refl * 0.6));
  col += env * (0.10 + fres * 0.35);

  col += fres * 0.12;
  float alpha = uOpacity * (0.30 + fres * 0.62);
  gl_FragColor = vec4(col, alpha);
}`;

export const cardVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const cardFragment = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uHover;
uniform float uTime;
uniform vec2 uShift;    // rgb-shift vector (uv space), driven by cursor velocity
uniform vec2 uSize;     // plane size in px
uniform float uRadius;  // corner radius in px
uniform float uParallax; // -1..1, card centre relative to viewport centre
varying vec2 vUv;

float roundedMask(vec2 uv, vec2 size, float r) {
  vec2 p = (uv - 0.5) * size;
  vec2 b = size * 0.5 - vec2(r);
  vec2 d = abs(p) - b;
  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
  return 1.0 - smoothstep(-1.0, 1.0, dist);
}

void main() {
  vec2 uv = vUv;
  // base zoom leaves sampling margin for the parallax pan + hover zoom-in
  float zoom = 1.12 + 0.07 * uHover;
  uv = (uv - 0.5) / zoom + 0.5;
  uv.x += uParallax * 0.05;
  float w1 = sin(uv.y * 6.283 + uTime * 2.1);
  float w2 = sin(uv.y * 14.0 - uTime * 3.3 + uv.x * 4.0);
  uv.x += (w1 * 0.6 + w2 * 0.4) * 0.035 * uHover;
  uv.y += cos(uv.x * 9.0 + uTime * 1.8) * 0.018 * uHover;

  vec2 shift = uShift * (0.35 + 0.65 * uHover);
  float r = texture2D(uMap, uv + shift).r;
  float g = texture2D(uMap, uv).g;
  float b = texture2D(uMap, uv - shift).b;

  float a = roundedMask(vUv, uSize, uRadius);
  gl_FragColor = vec4(r, g, b, a);
}`;
