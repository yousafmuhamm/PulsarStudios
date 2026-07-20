// Node-only module (page generation). The dynamic import mirrors the
// cache-bust query set by scripts/pages-plugin.js so dev-server edits to
// chrome.js reach regenerated pages — a static import would pin the first
// version in Node's ESM cache for the life of the process.
const { shell, footer, em } = await import(
  `./chrome.js?t=${globalThis.__pulsarGenT || 0}`
);

const img = (slug, variant, alt, cls = '', eager = false) =>
  `<img class="${cls}" src="/assets/img/projects/${slug}-${variant}.jpg" alt="${alt}" ${
    eager ? 'fetchpriority="high"' : 'loading="lazy"'
  } decoding="async" width="1600" height="900">`;

const tags = (p) => p.tags.join(' &nbsp;&bull;&nbsp; ');

/* ------------------------------------------------------------------ HOME */

export function renderHome(projects) {
  const featured = projects.slice(0, 6);
  const main = `
<section class="hero" data-hero aria-label="Introduction">
  <h1 class="hero__title" data-reveal-load="words">We design and build websites that make brands impossible to ignore</h1>
  <div class="hero__bottom" data-reveal-load="fade">
    <div class="hero__scroll">
      <span class="mono hero__scroll-label">Scroll to explore</span>
      <span class="hero__progress"><span class="hero__progress-fill" data-scroll-progress></span></span>
    </div>
    <button class="pill pill--ghost hero__reel" type="button" data-reel-open data-magnetic data-cursor="Play">Play Reel</button>
  </div>
</section>

<section class="intro" aria-label="What we do">
  <p class="mono eyebrow" data-reveal="fade">Bold ideas, built for the web</p>
  <p class="intro__para" data-scrub-words data-skew>We combine strategy, design, motion and engineering to build websites that feel alive. From startup launches to full brand platforms, we make work that gets attention &mdash; and converts it.</p>
  <p data-reveal="fade"><a class="link-draw intro__cta" href="/about.html">Our approach &rarr;</a></p>
</section>

<section class="work" data-work aria-label="Featured work">
  <header class="work__head">
    <p class="mono eyebrow" data-reveal="fade">Featured Work</p>
    <h2 class="work__title" data-reveal="scatter">Real brands. Real sites. Built to be impossible to ignore.</h2>
  </header>
  <div class="work__pin" data-work-pin>
    <div class="work__track" data-work-track>
      ${featured
        .map(
          (p, i) => `<a class="work-card" href="${p.url}" target="_blank" rel="noopener" data-cursor="Visit site">
        <figure class="work-card__media" data-gl-img data-gl-slug="${p.slug}">
          ${img(p.slug, 'thumb', `${p.title} — ${p.sector} project by Pulsar Studios`, 'work-card__img')}
        </figure>
        <div class="work-card__row">
          <span class="mono work-card__idx">0${i + 1}</span>
          <span class="mono work-card__tags">${tags(p)}</span>
        </div>
        <h3 class="work-card__name">${p.title}</h3>
      </a>`
        )
        .join('')}
      <a class="work-card work-card--all" href="/projects.html">
        <span class="work-card__all-inner">See all<br>projects <span class="work-card__arrow">&rarr;</span></span>
      </a>
    </div>
  </div>
</section>

<section class="philosophy section--dark" data-philosophy aria-label="Philosophy">
  <h2 class="philosophy__title" data-reveal="lines" data-skew>Where good ideas become great websites</h2>
  <div class="philosophy__cols">
    <p data-reveal="fade">Templates are how brands disappear. Every project here starts from a blank canvas and one hard question: what should this feel like, and why should anyone care? Strategy shapes the answer. Craft makes it undeniable.</p>
    <p data-reveal="fade">Designers and engineers share a desk at Pulsar &mdash; motion, code and copy are decided together, never thrown over a wall. What comes out the other side is fast, alive, and impossible to mistake for anyone else&rsquo;s work.</p>
  </div>
  <div class="philosophy__kickers">
    <p class="philosophy__kicker" data-reveal="lines" data-drift-x="9">Step into a new world</p>
    <p class="philosophy__kicker philosophy__kicker--indent" data-reveal="lines" data-drift-x="-7">and let your</p>
    <p class="philosophy__kicker philosophy__kicker--accent" data-reveal="lines" data-drift-x="12">imagination run wild</p>
  </div>
</section>
${footer({ nextHref: '/about.html', nextLabel: 'About Us' })}`;

  return shell({
    page: 'home',
    title: 'Pulsar Studios — Websites that make brands impossible to ignore',
    description:
      'Pulsar Studios — we design and build websites that make brands impossible to ignore.',
    path: '/',
    main,
  });
}

/* ----------------------------------------------------------------- ABOUT */

const TEAM = [
  {
    idx: '001',
    name: 'Muhammad Yousaf',
    role: 'Founder & Creative Director',
    bio: 'Designs and builds every Pulsar site end to end — strategy, design, motion and code. Believes a website is the one piece of a brand you can actually feel.',
  },
];

const BRANDS = [
  'Dr Shiny', 'Xandrea Harshey', 'Chick N Fish', 'Demarks360',
  'Trail Construction', 'West Pine Strategies', 'Yeong Won', 'BW Plumbing',
];

const STATS = [
  ['48', '', 'websites shipped'],
  ['12', '', 'industry awards'],
  ['6', '', 'years running'],
  ['97', '%', 'clients returning'],
];

const EXPERTISE = [
  {
    glyph: '&#10035;', title: 'Strategy',
    blurb: 'The thinking that decides what the website is for — before a pixel moves.',
    items: ['Brand & digital strategy', 'Positioning & messaging', 'Content strategy', 'Information architecture', 'Analytics & research'],
  },
  {
    glyph: '&#9680;', title: 'Design',
    blurb: 'Interfaces with a point of view, engineered to be built exactly as drawn.',
    items: ['Art direction', 'UI & UX design', 'Design systems', 'Brand identity', 'Rapid prototyping'],
  },
  {
    glyph: '&lt;/&gt;', title: 'Development',
    blurb: 'Hand-built front-ends that stay fast no matter how much motion we throw at them.',
    items: ['Front-end engineering', 'WebGL & shaders', 'CMS builds', 'E-commerce', 'Performance optimisation'],
  },
  {
    glyph: '&#10022;', title: 'Motion & 3D',
    blurb: 'The layer that makes people feel something — and remember you for it.',
    items: ['Motion identity', 'WebGL experiences', '3D art direction', 'Micro-interactions', 'Video & reels'],
  },
];

export function renderAbout() {
  const marqueeRow = (names, dir, speed) =>
    `<div class="brands__row mono" data-marquee data-marquee-dir="${dir}" data-marquee-speed="${speed}" data-marquee-hover>
      <span class="brands__chunk">${names.map((n) => `<span class="brands__logo">${n}</span>`).join('')}</span>
    </div>`;

  const main = `
<section class="ahero" aria-label="We are a web agency">
  <div class="ahero__lines">
    <h1 class="ahero__sr-title">We are a web agency crafting bold digital experiences</h1>
    <p class="ahero__line" aria-hidden="true" data-reveal-load="lines" data-parallax="-8">WE ARE</p>
    <p class="ahero__line" aria-hidden="true" data-reveal-load="lines" data-parallax="6">A WEB AGENCY</p>
    <p class="ahero__line" aria-hidden="true" data-reveal-load="lines" data-parallax="-12">CRAFTING BOLD</p>
    <p class="ahero__line ahero__line--accent" aria-hidden="true" data-reveal-load="lines" data-parallax="10">DIGITAL EXPERIENCES</p>
  </div>
  <span class="mono ahero__scroll" data-reveal-load="fade">Scroll to explore</span>
</section>

<section class="team" aria-label="The team">
  <h2 class="sr-only">The team</h2>
  <p class="intro__para team__manifesto" data-scrub-words data-skew>One designer-developer turning ambitious ideas into websites people remember &mdash; strategy, design, motion and code, all under one roof.</p>
  <div class="team__carousel" data-team-carousel data-cursor="Drag" tabindex="0" role="group" aria-label="Team members — drag or scroll horizontally">
    ${TEAM.map(
      (t) => `<article class="team-card">
      <span class="mono team-card__idx">[[ ${t.idx} ]]</span>
      <h3 class="team-card__name">${t.name}</h3>
      <p class="mono team-card__role">${t.role}</p>
      <p class="team-card__bio">${t.bio}</p>
    </article>`
    ).join('')}
    <article class="team-card team-card--ghost">
      <span class="mono team-card__idx">[[ 00N ]]</span>
      <h3 class="team-card__name">You?</h3>
      <p class="mono team-card__role">We hire slowly &amp; deliberately</p>
      <p class="team-card__bio">Unreasonably good at design or code? <a class="link-draw" href="mailto:hello@pulsarstudios.com">Say hello.</a></p>
    </article>
  </div>
  <div class="team__process">
    <p class="mono eyebrow" data-reveal="fade">How we work</p>
    <p class="team__process-para" data-reveal="fade">Design and engineering never split at Pulsar &mdash; because they are the same person. The one drawing the interface is the one building it, from kickoff to launch, so nothing gets lost in translation and the wild ideas actually survive contact with the browser.</p>
  </div>
</section>

<section class="brands" aria-label="Brands we work with">
  <p class="mono eyebrow brands__eyebrow" data-reveal="fade">Brands we work with</p>
  ${marqueeRow(BRANDS.slice(0, 5).concat(BRANDS.slice(5)), 1, 40)}
  ${marqueeRow(BRANDS.slice(3).concat(BRANDS.slice(0, 3)), -1, 32)}
  ${marqueeRow(BRANDS.slice(7).concat(BRANDS.slice(0, 7)), 1, 48)}
</section>

<section class="numbers section--dark" aria-label="Studio in numbers">
  <p class="mono eyebrow" data-reveal="fade">The scoreboard</p>
  <dl class="numbers__grid">
    ${STATS.map(
      ([n, suffix, label]) => `<div class="numbers__cell" data-reveal="fade">
      <dt class="mono numbers__label">${label}</dt>
      <dd class="numbers__value mono"><span data-counter="${n}">0</span>${suffix}</dd>
    </div>`
    ).join('')}
  </dl>
</section>

<section class="expertise" aria-label="Area of expertise">
  <p class="mono eyebrow" data-reveal="fade">Area of expertise</p>
  <h2 class="expertise__title" data-reveal="lines">Four disciplines, one integrated team</h2>
  <ul class="expertise__list">
    ${EXPERTISE.map(
      (x, i) => `<li class="xrow" data-xrow data-reveal="fade">
      <button class="xrow__head" type="button" aria-expanded="false" aria-controls="xrow-panel-${i}" id="xrow-btn-${i}">
        <span class="mono xrow__glyph" aria-hidden="true">${x.glyph}</span>
        <span class="xrow__name">${x.title}</span>
        <span class="mono xrow__count">5 services</span>
        <span class="xrow__plus" aria-hidden="true"></span>
      </button>
      <div class="xrow__panel" id="xrow-panel-${i}" role="region" aria-labelledby="xrow-btn-${i}" hidden>
        <p class="xrow__blurb">${x.blurb}</p>
        <ul class="xrow__items mono">${x.items.map((s) => `<li>${s}</li>`).join('')}</ul>
      </div>
    </li>`
    ).join('')}
  </ul>
</section>
${footer({ nextHref: '/projects.html', nextLabel: 'Projects' })}`;

  return shell({
    page: 'about',
    title: 'About — Pulsar Studios',
    description:
      'A tight team of designers, developers and motion nerds turning ambitious ideas into websites people remember.',
    path: '/about.html',
    main,
  });
}

/* -------------------------------------------------------------- PROJECTS */

export function renderProjectsList(projects) {
  const main = `
<h1 class="sr-only">Selected work — real client sites by Pulsar Studios</h1>
<div class="gallery" data-gallery>
  ${projects
    .map(
      (p, i) => `<section class="gslide" data-gslide data-index="${i}"
           style="--slide-accent:${p.palette[0]}; --slide-deep:${p.palette[1]}">
    <div class="gslide__bg"></div>
    <div class="gslide__marquee" aria-hidden="true">
      <div class="gslide__marquee-track" data-gslide-marquee>${
        // giant kinetic name — outline + solid alternating, repeated for a seamless loop
        Array.from({ length: 6 }, (_, k) =>
          `<span class="gslide__marquee-word${k % 2 ? ' is-solid' : ''}">${p.title}</span>`
        ).join('')
      }</div>
    </div>
    <figure class="gslide__media">
      <img src="/assets/img/projects/${p.slug}-hero.jpg" alt="${p.title} — ${p.sector}"
           loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">
    </figure>
    <div class="gslide__info">
      <p class="mono gslide__eyebrow">Project ${String(i + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')} · ${p.city}</p>
      <h2 class="gslide__name" data-reveal="scatter">${p.title}</h2>
      <p class="mono gslide__meta">${p.sector} · ${p.tags.join(' · ')} · ${p.year}</p>
      <p class="gslide__tagline">${p.tagline}</p>
      <a class="gslide__visit pill pill--ghost" href="${p.url}" target="_blank" rel="noopener" data-magnetic data-cursor="Visit site">Visit live site &#8599;</a>
    </div>
  </section>`
    )
    .join('')}
  <nav class="gindex" data-gindex aria-label="Project index">
    ${projects
      .map(
        (p, i) => `<button class="gindex__item" type="button" data-gindex-to="${i}"><span class="gindex__bar"></span>${p.title}<span class="mono gindex__n">${String(i + 1).padStart(2, '0')}</span></button>`
      )
      .join('')}
  </nav>
  <div class="gindex__progress-track" aria-hidden="true"><span class="gindex__progress" data-gallery-progress></span></div>
</div>
${footer({ nextHref: '/', nextLabel: 'Home' })}`;

  return shell({
    page: 'projects',
    title: 'Work — Pulsar Studios',
    description:
      'Real client sites by Pulsar Studios — mobile car wash, restaurant, construction, property management and more, each launched and live.',
    path: '/projects.html',
    main,
  });
}

