/**
 * All project content lives here.
 * Used at build time (page generation) and at runtime (GL textures, next-project logic).
 * These are real client sites. Hero and thumbnail images are in
 * public/assets/img/projects/ using the naming scheme
 * (<slug>-thumb, <slug>-hero).
 */
export const projects = [
  {
    slug: "dr-shiny", title: "Dr Shiny", sector: "Mobile Car Wash", city: "Calgary", year: "2025",
    url: "https://www.drshinycarwash.com",
    tagline: "Premium mobile car wash & detailing, booked in under a minute.",
    tags: ["web", "design", "booking ux"], palette: ["#31c6e8", "#0d1b2a"],
  },
  {
    slug: "xandrea-harshey", title: "Xandrea Harshey", sector: "Enterprise Group", city: "Calgary", year: "2025",
    url: "https://www.xandreaharshey.com",
    tagline: "A multi-company enterprise brand built to signal scale and trust.",
    tags: ["web", "design", "brand"], palette: ["#c9a24b", "#15171c"],
  },
  {
    slug: "chick-n-fish", title: "Chick N Fish", sector: "Restaurant", city: "Calgary", year: "2025",
    url: "https://chicknfish.ca",
    tagline: "A halal fish & chips shop with appetite-first online ordering.",
    tags: ["web", "design", "ordering"], palette: ["#c0603a", "#1c2b22"],
  },
  {
    slug: "demarks360", title: "Demarks360", sector: "Events", city: "Calgary", year: "2025",
    url: "https://demarks360.ca",
    tagline: "A cinematic 360 degree slow-motion video booth, booked around dates.",
    tags: ["web", "design", "motion"], palette: ["#e0b25a", "#141008"],
  },
  {
    slug: "trail-construction", title: "Trail Construction", sector: "Construction", city: "Alberta", year: "2025",
    url: "https://trail-construction-ltd.vercel.app",
    tagline: "Structural carpentry and beam installs, building since 1988.",
    tags: ["web", "design", "lead-gen"], palette: ["#4a9d5b", "#14170f"],
  },
  {
    slug: "west-pine", title: "West Pine Strategies", sector: "Property Management", city: "Calgary", year: "2025",
    url: "https://west-pine-strategies.vercel.app",
    tagline: "Luxury furnished rentals and hands-on property management.",
    tags: ["web", "design", "brand"], palette: ["#c9a24b", "#14161b"],
  },
  {
    slug: "yeong-won", title: "Yeong Won", sector: "Skincare Brand", city: "—", year: "2025",
    url: "https://soap-phi.vercel.app",
    tagline: "A luxury stem-cell renewal soap, presented like a treatment.",
    tags: ["web", "design", "brand"], palette: ["#b79a7d", "#17130f"],
  },
  {
    slug: "bw-plumbing", title: "BW Plumbing", sector: "Plumbing", city: "Calgary", year: "2025",
    url: "https://have-not-decided-yet.vercel.app",
    tagline: "Trusted Calgary plumbing and Poly-B replacement, done right.",
    tags: ["web", "design", "lead-gen"], palette: ["#3b7dd8", "#0e1524"],
  },
];

export const getProject = (slug) => projects.find((p) => p.slug === slug);

export const nextProject = (slug) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};
