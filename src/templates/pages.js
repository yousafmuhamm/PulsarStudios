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
  } decoding="async" width="1200" height="900">`;

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
    <h2 class="work__title" data-reveal="scatter">Six projects that moved the numbers that matter</h2>
  </header>
  <div class="work__pin" data-work-pin>
    <div class="work__track" data-work-track>
      ${featured
        .map(
          (p, i) => `<a class="work-card" href="/projects/${p.slug}.html" data-cursor="Open">
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
    bio: 'Started Pulsar after six years directing digital work for studios on three continents. Believes a website is the one piece of brand you can actually feel.',
  },
  {
    idx: '002',
    name: 'Amara Diallo',
    role: 'Design Lead',
    bio: 'Typography obsessive. Runs the design side of our integrated process — every layout is tested in code within days, not weeks.',
  },
  {
    idx: '003',
    name: 'Tomas Novak',
    role: 'Technical Director',
    bio: 'Shader whisperer and performance zealot. If it ships below sixty frames a second, it does not ship.',
  },
];

const BRANDS = [
  'Nova Labs', 'Hearthside Coffee', 'Vantage Legal', 'Bloom Health', 'Kepler Finance',
  'Aurora Festival', 'Atlas Outdoor', 'Mira Museum', 'Fable & Co', 'Northwind Air',
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
  <p class="intro__para team__manifesto" data-scrub-words data-skew>A tight team of designers, developers and motion nerds turning ambitious ideas into websites people remember.</p>
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
    <p class="team__process-para" data-reveal="fade">Design and engineering never split at Pulsar. The person drawing the interface sits beside the person building it, from kickoff to launch — so nothing gets lost in translation, and the wild ideas actually survive contact with the browser.</p>
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
<div class="gallery" data-gallery>
  ${projects
    .map(
      (p, i) => `<section class="gslide" data-gslide data-index="${i}"
           style="--slide-accent:${p.palette[0]}; --slide-deep:${p.palette[1]}">
    <div class="gslide__bg"></div>
    <figure class="gslide__media">
      <img src="/assets/img/projects/${p.slug}-hero.jpg" alt="${p.title} — ${p.sector}"
           loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">
    </figure>
    <div class="gslide__info">
      <p class="mono gslide__eyebrow">Project ${String(i + 1).padStart(2, '0')} / 08 · ${p.city}</p>
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

/* -------------------------------------------------------- PROJECT DETAIL */

export function renderProjectDetail(p, projects, i) {
  const next = projects[(i + 1) % projects.length];
  const alt = (v) => `${p.title} — ${p.sector} project by Pulsar Studios (${v})`;
  const main = `
<article class="case" data-case>
  <figure class="case__hero" data-case-hero>
    ${img(p.slug, 'hero', alt('hero'), 'case__hero-img', true)}
  </figure>
  <header class="case__head">
    <h1 class="case__title" data-reveal-load="words">${p.title}</h1>
    <dl class="case__meta mono">
      <div><dt>Sector</dt><dd>${p.sector}</dd></div>
      <div><dt>Year</dt><dd>${p.year}</dd></div>
      <div><dt>Scope</dt><dd>${tags(p)}</dd></div>
      <div><dt>Role</dt><dd>${p.roles?.join('<br>') || ''}</dd></div>
    </dl>
  </header>

  <section class="case__block">
    <p class="mono eyebrow" data-reveal="fade">The brief</p>
    <p class="case__para" data-scrub-words data-skew>${em(p.brief || '')}</p>
  </section>

  <figure class="case__img case__img--left" data-parallax-img>
    ${img(p.slug, 'a', alt('detail 1'), '')}
  </figure>

  <section class="case__block case__block--right">
    <p class="mono eyebrow" data-reveal="fade">What we did</p>
    <p class="case__para" data-scrub-words data-skew>${em(p.approach || '')}</p>
  </section>

  <figure class="case__img case__img--right" data-parallax-img>
    ${img(p.slug, 'b', alt('detail 2'), '')}
  </figure>

  <blockquote class="case__quote">
    <p class="case__quote-text" data-reveal="lines">&ldquo;${p.quote || ''}&rdquo;</p>
    <cite class="mono case__quote-cite" data-reveal="fade">${p.quoteAuthor || ''}</cite>
  </blockquote>

  <section class="case__stats" aria-label="Results">
    ${(p.stats || [])
      .map(
        ([v, label]) => `<div class="case__stat" data-reveal="fade">
      <span class="case__stat-value mono">${v}</span>
      <span class="mono case__stat-label">${label}</span>
    </div>`
      )
      .join('')}
  </section>

  <a class="case__next section--dark" href="/projects/${next.slug}.html" data-next-page="/projects/${next.slug}.html" data-cursor="Open">
    <span class="mono case__next-eyebrow">Next project</span>
    <span class="case__next-title">${next.title}</span>
    <figure class="case__next-media">${img(next.slug, 'thumb', `${next.title} — next project`, 'case__next-img')}</figure>
    <span class="footer__next-bar case__next-bar"><span class="footer__next-fill" data-next-fill></span></span>
  </a>

  <div class="case__foot mono">
    <a href="/projects.html">&larr; All projects</a>
    <span>&copy;2026 PULSAR STUDIOS</span>
    <a href="mailto:hello@pulsarstudios.com">hello@pulsarstudios.com</a>
  </div>
</article>`;

  return shell({
    page: 'project',
    title: `${p.title} — Case study — Pulsar Studios`,
    description: `${p.title} (${p.sector}). ${(p.brief || '').slice(0, 140).replace(/\*/g, '')}…`,
    path: `/projects/${p.slug}.html`,
    main,
    dark: false,
  });
}
