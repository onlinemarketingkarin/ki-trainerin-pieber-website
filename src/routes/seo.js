import { Router } from 'express';
import { query } from '../db.js';
import { loadSite } from '../config.js';
import { escapeHtml } from '../blocks/_util.js';

export const seoRouter = Router();

/** sitemap.xml: nur Veröffentlichtes, nichts mit noindex. Entsteht bei jedem Aufruf neu, braucht also kein Leeren. */
seoRouter.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const site = loadSite();
    const seiten = await query("SELECT slug, updated_at FROM pages WHERE status = 'published' AND noindex = 0 ORDER BY slug");
    const eintraege = seiten.map((s) => `  <url><loc>${escapeHtml(site.domain + (s.slug === 'start' ? '/' : `/${s.slug}`))}</loc><lastmod>${escapeHtml(String(s.updated_at).slice(0, 10))}</lastmod></url>`);
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${eintraege.join('\n')}\n</urlset>\n`);
  } catch (err) { next(err); }
});

seoRouter.get('/robots.txt', (_req, res) => {
  const site = loadSite();
  res.type('text/plain').send(`User-agent: *\nDisallow: /cockpit\nDisallow: /api/\nDisallow: /form/\n\nSitemap: ${site.domain}/sitemap.xml\n`);
});
