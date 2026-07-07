/**
 * Shared page chrome — every element outside <main> persists across
 * client-side navigations, so it is rendered identically on every page.
 */

export const em = (s) => s.replace(/\*(.+?)\*/g, '<em>$1</em>');

export const SOCIALS = [
  ['Instagram', 'https://instagram.com/pulsarstudios'],
  ['X', 'https://x.com/pulsarstudios'],
  ['LinkedIn', 'https://linkedin.com/company/pulsarstudios'],
  ['Awwwards', 'https://www.awwwards.com/'],
];

export const NAV = [
  ['Home', '/'],
  ['About', '/about.html'],
  ['Projects', '/projects.html'],
];

const socialLinks = (cls) =>
  SOCIALS.map(
    ([label, href]) =>
      `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label}</a>`
  ).join('');

export function head({ title, description, path }) {
  const url = `https://pulsarstudios.com${path}`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Pulsar Studios">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://pulsarstudios.com/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F2F1EF">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/archivo-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/jetbrainsmono-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<script type="module" src="/src/main.js"></script>`;
}

export function preChrome() {
  return `
<div class="preloader" data-preloader aria-hidden="true">
  <div class="preloader__center">
    <span class="preloader__brand">PULSAR<sup>&reg;</sup></span>
  </div>
  <span class="preloader__count mono" data-preloader-count>000</span>
</div>

<div class="veil" data-veil aria-hidden="true">
  <svg class="veil__svg" viewBox="0 0 100 140" preserveAspectRatio="none" focusable="false">
    <path class="veil__path" data-veil-path d="M 0 140 Q 50 140 100 140 L 100 140 Q 50 140 0 140 Z"></path>
  </svg>
  <span class="veil__brand mono" data-veil-brand>PULSAR&reg;</span>
</div>

<canvas class="gl" data-gl aria-hidden="true"></canvas>

<header class="header" data-header>
  <a class="header__brand" href="/" aria-label="Pulsar Studios — home">PULSAR<sup>&reg;</sup></a>
  <div class="header__right">
    <button class="pill pill--ghost header__talk" type="button" data-contact-open data-magnetic>Let&rsquo;s talk</button>
    <button class="header__menu" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-menu" data-magnetic>
      <span data-menu-label>Menu</span>
    </button>
  </div>
</header>

<nav class="menu" id="site-menu" data-menu aria-hidden="true">
  <div class="menu__inner">
    <ol class="menu__list">
      ${NAV.map(
        ([label, href], i) => `<li class="menu__item">
        <a class="menu__link" href="${href}" data-menu-link>
          <span class="menu__idx mono">0${i + 1}</span>
          <span class="menu__mask"><span class="menu__word">${label}</span></span>
        </a>
      </li>`
      ).join('')}
      <li class="menu__item">
        <button class="menu__link" type="button" data-contact-open data-menu-link>
          <span class="menu__idx mono">04</span>
          <span class="menu__mask"><span class="menu__word">Contact</span></span>
        </button>
      </li>
    </ol>
    <div class="menu__foot" data-menu-foot>
      <div class="menu__foot-col">
        <span class="mono menu__foot-label">New business</span>
        <a href="mailto:hello@pulsarstudios.com">hello@pulsarstudios.com</a>
      </div>
      <div class="menu__foot-col menu__foot-socials">${socialLinks('menu__social')}</div>
      <div class="menu__foot-col">
        <span class="mono menu__foot-label">Signals from the studio, quarterly. No noise.</span>
      </div>
    </div>
  </div>
</nav>

<div class="scrim" data-scrim hidden></div>

<aside class="contact" id="contact-panel" data-contact aria-hidden="true" aria-label="Contact Pulsar Studios">
  <button class="contact__close" type="button" data-contact-close aria-label="Close contact panel">
    <span aria-hidden="true">&times;</span>
  </button>
  <p class="mono contact__eyebrow">New project</p>
  <h2 class="contact__title">Tell us about your project</h2>
  <form class="contact__form" data-contact-form novalidate>
    <label class="field"><span class="mono field__label">Name</span>
      <input class="field__input" type="text" name="name" autocomplete="name" required>
    </label>
    <label class="field"><span class="mono field__label">Email</span>
      <input class="field__input" type="email" name="email" autocomplete="email" required>
    </label>
    <label class="field"><span class="mono field__label">Budget</span>
      <select class="field__input field__select" name="budget">
        <option value="">Select a range</option>
        <option>$10k – $25k</option>
        <option>$25k – $50k</option>
        <option>$50k – $100k</option>
        <option>$100k+</option>
      </select>
    </label>
    <label class="field"><span class="mono field__label">Message</span>
      <textarea class="field__input field__textarea" name="message" rows="4" required></textarea>
    </label>
    <button class="pill pill--solid contact__submit" type="submit" data-magnetic>Send it &rarr;</button>
    <p class="contact__note mono" data-contact-note>Opens your mail app — no data leaves this page.</p>
  </form>
  <div class="contact__foot">
    <a class="contact__mail" href="mailto:hello@pulsarstudios.com">hello@pulsarstudios.com</a>
    <div class="contact__socials">${socialLinks('contact__social')}</div>
  </div>
</aside>

<div class="reel" data-reel aria-hidden="true">
  <button class="reel__close pill pill--ghost" type="button" data-reel-close>Close</button>
  <canvas class="reel__canvas" data-reel-canvas></canvas>
  <p class="reel__caption mono">Pulsar Studios &mdash; Reel 2026 (placeholder render)</p>
</div>`;
}

export function postChrome() {
  return `
<div class="cursor" data-cursor aria-hidden="true">
  <div class="cursor__ring" data-cursor-ring><span class="cursor__label" data-cursor-label></span></div>
  <div class="cursor__dot" data-cursor-dot></div>
</div>`;
}

export function footer({ nextHref, nextLabel }) {
  return `
<footer class="footer section--dark" data-footer>
  <div class="footer__cta">
    <p class="mono footer__eyebrow" data-reveal="fade">Got an idea worth building?</p>
    <button class="footer__line" type="button" data-contact-open data-reveal="words">Let&rsquo;s work</button>
    <button class="footer__line footer__line--fill" type="button" data-contact-open data-cta-fill aria-label="Let's work together — open contact panel">together!</button>
  </div>
  <div class="footer__marquee mono" data-marquee data-marquee-speed="60">
    <span class="footer__marquee-chunk">CONTINUE TO SCROLL &nbsp;&bull;&nbsp; CONTINUE TO SCROLL &nbsp;&bull;&nbsp; CONTINUE TO SCROLL &nbsp;&bull;&nbsp; </span>
  </div>
  <div class="footer__grid">
    <div class="footer__col">
      <span class="mono footer__label">Studio</span>
      <address class="footer__address">Suite 4, 12 Granville St<br>Vancouver, BC</address>
    </div>
    <div class="footer__col">
      <span class="mono footer__label">General enquiries</span>
      <a href="mailto:hello@pulsarstudios.com">hello@pulsarstudios.com</a>
      <span class="mono footer__label footer__label--gap">New business</span>
      <a href="mailto:newbiz@pulsarstudios.com">newbiz@pulsarstudios.com</a>
    </div>
    <div class="footer__col footer__socials">
      <span class="mono footer__label">Elsewhere</span>
      ${socialLinks('footer__social link-draw')}
    </div>
  </div>
  <div class="footer__bottom mono">
    <span>&copy;2026 PULSAR STUDIOS</span>
    <span>Built by Pulsar with &#9889;</span>
  </div>
  ${
    nextHref
      ? `<div class="footer__next" data-next-page="${nextHref}">
    <span class="mono footer__next-hint">Keep scrolling to continue</span>
    <span class="footer__next-label">&rarr; ${nextLabel}</span>
    <span class="footer__next-bar"><span class="footer__next-fill" data-next-fill></span></span>
  </div>`
      : ''
  }
</footer>`;
}

export function shell({ page, title, description, path, main, dark = false }) {
  return `<!doctype html>
<html lang="en">
<head>
${head({ title, description, path })}
</head>
<body data-page="${page}"${dark ? ' data-dark="true"' : ''}>
${preChrome()}
<main data-page="${page}" id="main">
${main}
</main>
${postChrome()}
</body>
</html>`;
}
