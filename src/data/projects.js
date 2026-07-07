/**
 * All project content lives here.
 * Used at build time (page generation) and at runtime (GL textures, next-project logic).
 * To swap in real work: edit these entries and drop real images into
 * public/assets/img/projects/ using the same naming scheme
 * (<slug>-thumb, <slug>-hero, <slug>-a, <slug>-b).
 */
export const projects = [
  {
    slug: 'nova-labs',
    title: 'Nova Labs',
    sector: 'Deep Tech',
    year: '2026',
    tags: ['web', 'design', 'development', '3d'],
    roles: ['Art direction', 'Design system', 'WebGL development', 'CMS build'],
    palette: ['#6533FF', '#00D4FF'],
    brief:
      'Nova Labs turns university research into venture-ready companies, but their site read like a grant application. They needed a platform that could explain photonic computing to an investor in ninety seconds — and make the science feel as radical as it is.',
    approach:
      'We rebuilt the story around one interactive artefact: a real-time WebGL visualisation of light moving through a photonic chip, annotated in plain language as you scroll. Around it, a modular case-study system their team edits themselves, typeset like a research journal that went to art school.',
    quote:
      'Investors stopped asking us what we do. Now they ask how fast we can take their money.',
    quoteAuthor: 'Elena Voss — Chief Commercial Officer, Nova Labs',
    stats: [
      ['+212%', 'qualified investor enquiries in 90 days'],
      ['1.1s', 'largest contentful paint on 4G'],
      ['3×', 'time on site vs. previous platform'],
    ],
  },
  {
    slug: 'hearthside-coffee',
    title: 'Hearthside Coffee',
    sector: 'E-commerce',
    year: '2025',
    tags: ['e-commerce', 'design', 'development'],
    roles: ['Brand refresh', 'UX & UI design', 'Headless storefront', 'Performance'],
    palette: ['#FF6B35', '#6533FF'],
    brief:
      'A beloved Vancouver roaster with a cult farmers-market following and a webshop that converted like a fax machine. Hearthside asked us to bottle the feeling of their roastery — warm, obsessive, a little nerdy — into a store that could carry a national subscription business.',
    approach:
      'We designed a storefront that treats every coffee like a vinyl release: origin stories, roast curves plotted as living charts, and tasting notes you can actually feel through colour and type. Underneath, a headless build with instant page loads and a subscription flow cut from nine steps to three.',
    quote:
      'Our subscriber count did in one quarter what we projected for the whole year.',
    quoteAuthor: 'Maya Okafor — Founder, Hearthside Coffee',
    stats: [
      ['+164%', 'subscription conversions'],
      ['-58%', 'checkout abandonment'],
      ['38k', 'monthly sessions, up from 9k'],
    ],
  },
  {
    slug: 'vantage-legal',
    title: 'Vantage Legal',
    sector: 'Professional Services',
    year: '2025',
    tags: ['web', 'design', 'strategy'],
    roles: ['Positioning', 'Content strategy', 'Design & build', 'Accessibility'],
    palette: ['#0D4FFF', '#B8FF2C'],
    brief:
      'A boutique litigation firm competing against towers full of grey suits and greyer websites. Vantage wanted to look like what they are: the firm you call when the stakes are uncomfortable and the clock is running.',
    approach:
      'We stripped legal-website convention to the studs. One typeface, two colours, case results stated like scoreboard numbers, and language a human being would actually say out loud. Every partner page reads like a dossier, not a LinkedIn profile — and the whole thing is WCAG AA end to end.',
    quote:
      'Opposing counsel told us the site was intimidating. We consider that a feature.',
    quoteAuthor: 'Daniel Reyes — Managing Partner, Vantage Legal',
    stats: [
      ['+89%', 'qualified case enquiries'],
      ['100', 'Lighthouse accessibility score'],
      ['4 min', 'average time on partner pages'],
    ],
  },
  {
    slug: 'bloom-health',
    title: 'Bloom Health',
    sector: 'Health Tech',
    year: '2026',
    tags: ['product', 'design', 'development', 'motion'],
    roles: ['Product design', 'Design system', 'Marketing site', 'Motion identity'],
    palette: ['#FF4FA3', '#6533FF'],
    brief:
      'Bloom is a mental-health platform for people who find wellness apps exhausting. Their ask: a marketing site and product surface that feels like a deep breath, not a dashboard — calm without being beige, warm without being saccharine.',
    approach:
      'We built a motion identity around slow, tidal rhythms — every transition on the site breathes at roughly the pace of a resting heartbeat. The design system runs on a single expressive serif moment per screen, and onboarding copy was rewritten with their clinical team line by line.',
    quote:
      'People screenshot our onboarding and post it. Onboarding. I still can’t quite believe that.',
    quoteAuthor: 'Dr. Sarah Lindqvist — CEO, Bloom Health',
    stats: [
      ['+47%', 'onboarding completion'],
      ['-31%', 'day-one churn'],
      ['92', 'NPS from beta cohort'],
    ],
  },
  {
    slug: 'kepler-finance',
    title: 'Kepler Finance',
    sector: 'Fintech',
    year: '2024',
    tags: ['web', 'development', 'data-viz'],
    roles: ['UX architecture', 'Data visualisation', 'Front-end build', 'Design tokens'],
    palette: ['#B8FF2C', '#0D0D0F'],
    brief:
      'Kepler sells institutional-grade market analytics to funds that make decisions in seconds. Their old site buried a genuinely superior product under stock photos of handshakes. They asked for a platform that proves the product before anyone books a demo.',
    approach:
      'We put the product on the homepage — literally. A live, anonymised data feed renders through Kepler’s own charting engine right in the hero, updating as you watch. The rest of the site is engineered like their terminal: dense, fast, monospaced where it counts, with zero decorative filler.',
    quote:
      'The site closes the first meeting for us. By the time they call, they’ve already seen it work.',
    quoteAuthor: 'James Whitfield — Head of Growth, Kepler Finance',
    stats: [
      ['+3.1×', 'demo bookings per month'],
      ['41%', 'of demos now inbound'],
      ['0.9s', 'time to interactive'],
    ],
  },
  {
    slug: 'aurora-festival',
    title: 'Aurora Festival',
    sector: 'Culture & Events',
    year: '2025',
    tags: ['web', 'design', 'motion', '3d'],
    roles: ['Creative direction', 'WebGL experience', 'Ticketing UX', 'Live schedule build'],
    palette: ['#00E5A0', '#6533FF'],
    brief:
      'A three-night electronic music festival under the northern lights in Yukon territory. Aurora needed a site that could sell out 8,000 tickets to people who would never see a poster — the website *was* the poster.',
    approach:
      'We built a generative WebGL aurora that reacts to the lineup: each artist has a spectral signature, and browsing the program literally changes the sky. Ticketing was rebuilt as a single continuous flow that survived the on-sale spike without a queue page.',
    quote:
      'Sold out in 31 hours. The site trended before the lineup did.',
    quoteAuthor: 'Noor Haddad — Festival Director, Aurora',
    stats: [
      ['31h', 'to sell out — 8,000 tickets'],
      ['214k', 'unique visitors on launch week'],
      ['0', 'minutes of downtime during on-sale'],
    ],
  },
  {
    slug: 'atlas-outdoor',
    title: 'Atlas Outdoor',
    sector: 'Consumer Goods',
    year: '2024',
    tags: ['e-commerce', 'design', 'development'],
    roles: ['E-commerce strategy', 'Design & build', '3D product viewer', 'CRO programme'],
    palette: ['#FF8A00', '#0D4FFF'],
    brief:
      'Atlas makes expedition-grade packs guaranteed for life, sold almost entirely through specialty retailers. Going direct-to-consumer meant their site had to do what a good shop assistant does: let you turn the thing over in your hands.',
    approach:
      'Every hero product got a photogrammetry-scanned 3D model you can spin, open, and inspect down to the stitching — no app, no plugin, sixty frames a second on a mid-range phone. We paired it with field-repair guides and a trade-in programme that turned the lifetime guarantee into the brand story.',
    quote:
      'Returns dropped the month the 3D viewer shipped. People finally know exactly what they’re buying.',
    quoteAuthor: 'Greta Lindholm — VP Digital, Atlas Outdoor',
    stats: [
      ['+126%', 'direct-to-consumer revenue'],
      ['-34%', 'product returns'],
      ['60fps', '3D viewer on mid-range mobile'],
    ],
  },
  {
    slug: 'mira-museum',
    title: 'Mira Museum',
    sector: 'Arts & Culture',
    year: '2026',
    tags: ['web', 'design', 'development', 'accessibility'],
    roles: ['Digital strategy', 'Design & build', 'Collection interface', 'Multilingual CMS'],
    palette: ['#6533FF', '#FF4FA3'],
    brief:
      'A new contemporary art museum with a collection of 12,000 works and a mandate to reach people who have never set foot in a gallery. The site had to be an exhibition in its own right — in four languages, accessible to everyone.',
    approach:
      'We designed the collection browser as a drifting, zoomable field of works rather than a paginated grid — closer to wandering a gallery than searching a database. Curators write exhibition “routes” through it in the CMS. Every interaction has a keyboard path and every work a rich description, in all four languages.',
    quote:
      'Visitors tell us they found us through the website the way you find a museum in a strange city: by getting happily lost.',
    quoteAuthor: 'Isabelle Marchand — Director, Mira Museum',
    stats: [
      ['680k', 'collection views in six months'],
      ['4', 'languages, fully mirrored'],
      ['2', 'international digital design awards'],
    ],
  },
];

export const getProject = (slug) => projects.find((p) => p.slug === slug);

export const nextProject = (slug) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};
