import { query } from './db.js';
import { renderPage } from './renderer.js';
import { ladeFakten } from './facts.js';
import { navigationDaten } from './navigation.js';
import { blocks } from './blocks/index.js';
import { normalisierePfad } from './redirects.js';

/** Welche Seiten gibt es, und welche davon sind öffentlich? */
export async function seitenStatus() {
  const zeilen = await query('SELECT slug, status FROM pages');
  return {
    alle: new Set(zeilen.map((z) => z.slug)),
    veroeffentlicht: new Set(zeilen.filter((z) => z.status === 'published').map((z) => z.slug)),
  };
}

export const slugVon = (href) => {
  const p = normalisierePfad(href);
  return !p ? null : p === '/' ? 'start' : p.slice(1);
};

/** Ein Link auf eine Seite, die es gibt, die aber nicht veröffentlicht ist, verschwindet statt ins Leere zu führen. */
const istVersteckt = (href, stand) => {
  const slug = slugVon(href);
  return Boolean(slug) && stand.alle.has(slug) && !stand.veroeffentlicht.has(slug);
};

function filtereBaum(baum, stand) {
  return baum
    .map((p) => ({ ...p, kinder: (p.kinder || []).filter((k) => !istVersteckt(k.href, stand)) }))
    .filter((p) => !istVersteckt(p.href, stand) && (p.href || p.kinder.length));
}

/**
 * Was ein Baustein nicht selbst weiß, weil es aus der Datenbank kommt (P3):
 * die Navigation für Kopf und Fuß, gefiltert auf veröffentlichte Seiten.
 */
export async function dynamischeDaten(bloeckeListe, stand) {
  const typen = new Set(bloeckeListe.map((b) => b.type));
  if (!typen.has('nav') && !typen.has('footer')) return {};
  const zeilen = await query(
    'SELECT id, parent_id, label, href, sort, bereich FROM navigation WHERE visible = 1 ORDER BY sort');
  const daten = navigationDaten(zeilen);
  daten.nav.baum = filtereBaum(daten.nav.baum, stand);
  daten.footer.baum = filtereBaum(daten.footer.baum, stand);
  const eigene = bloeckeListe.find((b) => b.type === 'footer')?.data?.rechtsLinks;
  const rechts = Array.isArray(eigene) ? eigene : blocks.footer.schema.rechtsLinks.default;
  daten.footer.rechtsLinks = rechts.filter((l) => !istVersteckt(l.href, stand));
  return daten;
}

export async function medienAlt() {
  const zeilen = await query('SELECT file_path, alt FROM media');
  return Object.fromEntries(zeilen.map((z) => [z.file_path, z.alt || '']));
}

/**
 * Eine Seite so rendern, wie die Besucher sie sehen würden. `vorschau` setzt noindex.
 * `fehlend` sind die Fakten, die im Text vorkommen, aber (noch) keinen Wert haben.
 */
export async function rendereSeite(page, { vorschau = false } = {}) {
  const inhalt = typeof page.content_json === 'string' ? JSON.parse(page.content_json) : page.content_json;
  const fehlend = [];
  const html = renderPage(vorschau ? { ...page, status: 'draft' } : page, {
    dynamicData: await dynamischeDaten(inhalt.blocks || [], await seitenStatus()),
    facts: await ladeFakten(),
    medienAlt: await medienAlt(),
    fehlend,
  });
  return { html, fehlend };
}
