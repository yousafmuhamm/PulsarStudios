/**
 * pulsar-pages — generates every HTML page of the site at dev/build time
 * from template functions in src/templates/ and data in src/data/projects.js.
 *
 * Generated artifacts (gitignored):
 *   index.html, about.html, projects.html, projects/<slug>.html
 *   public/assets/img/projects/<slug>-{hero,a,b,thumb}.svg
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadFresh(rel) {
  // cache-bust dynamic import so the dev watcher picks up edits
  const url = `${path.join(root, rel)}?t=${Date.now()}`;
  return import(/* @vite-ignore */ `file://${url}`);
}

export async function generateAll() {
  // templates read this to cache-bust their own nested imports (chrome.js)
  globalThis.__pulsarGenT = Date.now();
  const { projects } = await loadFresh('src/data/projects.js');
  const { renderHome, renderAbout, renderProjectsList, renderProjectDetail } =
    await loadFresh('src/templates/pages.js');
  const { projectArt } = await loadFresh('src/templates/placeholder.js');

  const write = (rel, content) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
    return abs;
  };

  const inputs = {
    index: write('index.html', renderHome(projects)),
    about: write('about.html', renderAbout(projects)),
    projects: write('projects.html', renderProjectsList(projects)),
  };

  projects.forEach((p, i) => {
    inputs[`project-${p.slug}`] = write(
      `projects/${p.slug}.html`,
      renderProjectDetail(p, projects, i)
    );
    write(`public/assets/img/projects/${p.slug}-thumb.svg`, projectArt(p, 'thumb', 1200, 900));
    write(`public/assets/img/projects/${p.slug}-hero.svg`, projectArt(p, 'hero', 2000, 1250));
    write(`public/assets/img/projects/${p.slug}-a.svg`, projectArt(p, 'a', 1400, 1050));
    write(`public/assets/img/projects/${p.slug}-b.svg`, projectArt(p, 'b', 1400, 1050));
  });

  const origin = 'https://pulsarstudios.com';
  const urls = ['/', '/about.html', '/projects.html', ...projects.map((p) => `/projects/${p.slug}.html`)];
  write(
    'public/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${origin}${u}</loc></url>`)
      .join('\n')}\n</urlset>\n`
  );
  write('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);

  return inputs;
}

export function pulsarPages() {
  return {
    name: 'pulsar-pages',
    async config() {
      const input = await generateAll();
      return { build: { rollupOptions: { input } } };
    },
    configureServer(server) {
      const watched = [
        path.join(root, 'src/templates'),
        path.join(root, 'src/data'),
      ];
      watched.forEach((dir) => server.watcher.add(dir));
      server.watcher.on('change', async (file) => {
        if (watched.some((dir) => file.startsWith(dir))) {
          await generateAll();
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}
