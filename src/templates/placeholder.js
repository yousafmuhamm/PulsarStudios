/**
 * Deterministic SVG placeholder art for project imagery.
 * Pure string functions — used at build time to write files into
 * public/assets/img/projects/. Swap for real photography by replacing
 * the generated files with .jpg/.webp of the same names (and updating
 * the extensions in src/templates/pages.js + src/data/projects.js consumers).
 */

// tiny deterministic PRNG from a string seed
function rng(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13; h ^= h >>> 7;
    h += h << 3;  h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

export function projectArt(project, variant, w, h) {
  const r = rng(project.slug + variant);
  const [c1, c2] = project.palette;
  const ink = '#0D0D0F';
  const paper = '#F2F1EF';
  const dark = r() > 0.55;
  const bg = dark ? ink : paper;

  // drifting soft blobs
  let blobs = '';
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const cx = (0.1 + r() * 0.8) * w;
    const cy = (0.1 + r() * 0.8) * h;
    const rad = (0.18 + r() * 0.3) * Math.min(w, h);
    const col = [c1, c2, c1][Math.floor(r() * 3)];
    const op = 0.5 + r() * 0.45;
    blobs += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="${col}" opacity="${op.toFixed(2)}" filter="url(#blur)"/>`;
  }

  // one crisp geometric accent — a ring or an arc
  const gx = (0.25 + r() * 0.5) * w;
  const gy = (0.25 + r() * 0.5) * h;
  const gr = (0.12 + r() * 0.22) * Math.min(w, h);
  const ringCol = dark ? paper : ink;
  const geo =
    r() > 0.5
      ? `<circle cx="${gx.toFixed(0)}" cy="${gy.toFixed(0)}" r="${gr.toFixed(0)}" fill="none" stroke="${ringCol}" stroke-width="${Math.max(2, w * 0.0015).toFixed(1)}" opacity="0.85"/>`
      : `<path d="M ${(gx - gr).toFixed(0)} ${gy.toFixed(0)} A ${gr.toFixed(0)} ${gr.toFixed(0)} 0 0 1 ${(gx + gr).toFixed(0)} ${gy.toFixed(0)}" fill="none" stroke="${ringCol}" stroke-width="${Math.max(2, w * 0.0015).toFixed(1)}" opacity="0.85"/>`;

  const label = project.title.toUpperCase();
  const idx = String(project.year);
  const fs = Math.round(w * 0.018);
  const textCol = dark ? paper : ink;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<filter id="blur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${Math.round(Math.min(w, h) * 0.09)}"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.07"/></feComponentTransfer><feComposite operator="over" in2="SourceGraphic"/></filter>
<linearGradient id="wash" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}" stop-opacity="0.14"/><stop offset="1" stop-color="${c2}" stop-opacity="0.10"/></linearGradient>
</defs>
<rect width="${w}" height="${h}" fill="${bg}"/>
<rect width="${w}" height="${h}" fill="url(#wash)"/>
${blobs}
${geo}
<g font-family="ui-monospace, 'JetBrains Mono', monospace" font-size="${fs}" letter-spacing="${(fs * 0.12).toFixed(1)}" fill="${textCol}" opacity="0.9">
<text x="${Math.round(w * 0.045)}" y="${Math.round(h * 0.08)}">${label}</text>
<text x="${Math.round(w * 0.955)}" y="${Math.round(h * 0.08)}" text-anchor="end">${idx}</text>
</g>
<rect width="${w}" height="${h}" fill="${bg}" opacity="0" filter="url(#grain)"/>
</svg>`;
}
