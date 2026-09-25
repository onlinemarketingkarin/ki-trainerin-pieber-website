import { randomUUID } from 'node:crypto';
import { query, queryOne } from './db.js';
import { getType, validateContent } from './archetypes.js';
import { bereinigeInhalt, sammleWerte } from './content.js';
import { setzeUmleitung, entferneUmleitung, normalisierePfad } from './redirects.js';
import { rendereSeite, seitenStatus, slugVon } from './site.js';
import { generiere } from './generator.js';
import { Fehler } from './fehler.js';

export const STATUS = ['draft', 'generated', 'edited', 'approved', 'published', 'archived'];
export const STATUS_NAMEN = {
  draft: 'Entwurf', generated: 'Generiert', edited: 'Bearbeitet', approved: 'Freigegeben', published: 'Veröffentlicht', archived: 'Archiviert',
};

/** Die Statuskette (P5) als Aktionen. Von wo aus darf welche Aktion, und wohin führt sie? */
export const AKTIONEN = {
  freigeben:        { von: ['draft', 'generated', 'edited'], nach: 'approved' },
  veroeffentlichen: { von: ['draft', 'generated', 'edited', 'approved'], nach: 'published' },
  zurueckziehen:    { von: ['published'], nach: 'approved' },
  archivieren:      { von: ['draft', 'generated', 'edited', 'approved'], nach: 'archived' },
  wiederherstellen: { von: ['archived'], nach: 'draft' },
};

const RESERVIERT = new Set(['cockpit', 'api', 'uploads', 'fonts', 'logo', 'form', 'health', 'favicon', 'apple-touch-icon', 'sitemap', 'robots']);

export function slugFehler(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) return 'Nur Kleinbuchstaben, Ziffern und einzelne Bindestriche (zum Beispiel mein-angebot).';
  if (slug.length > 80) return 'Höchstens 80 Zeichen.';
  if (RESERVIERT.has(slug)) return `„${slug}" ist für das System reserviert.`;
  if (slug === 'start') return '„start" ist die Startseite.';
  return null;
}

export const slugAus = (text) => String(text ?? '').toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const alsSeite = (z) => z && ({
  id: z.id, slug: z.slug, page_type: z.page_type, status: z.status, title: z.title || '', description: z.description || '',
  og_image: z.og_image || '', noindex: Boolean(Number(z.noindex)), content: JSON.parse(z.content_json),
  created_at: z.created_at, updated_at: z.updated_at,
});

export async function listePages() {
  return (await query('SELECT id, slug, page_type, status, title, noindex, updated_at FROM pages ORDER BY slug'))
    .map((z) => ({ ...z, noindex: Boolean(Number(z.noindex)) }));
}

export async function holePage(id) {
  return alsSeite(await queryOne('SELECT * FROM pages WHERE id = $1', [id]));
}

/** Aus den Pflichtbausteinen des Typs eine leere Seite bauen. Der erste Baustein mit Überschrift bekommt den Titel. */
function startBloecke(typ, title, bloecke) {
  let titelVergeben = false;
  return (typ.schema.requiredBlocks || []).map((name) => {
    const data = {};
    if (!titelVergeben && bloecke[name]?.schema.titel && !bloecke[name].rahmen) { data.titel = title; titelVergeben = true; }
    return { type: name, data };
  });
}

/**
 * Neue Seite anlegen. Ohne `quelle`: leer mit den Pflichtbausteinen, Status 'draft'.
 * Mit `quelle` (Notizen/Stichworte/Transkript): der Generator füllt die Bausteine,
 * Status 'generated' — nie 'published', das entscheidet ein Mensch (P5, Stufe 4).
 * `generatorAufrufen` ist nur für Tests gedacht (ersetzt den echten Modell-Aufruf).
 */
export async function erstellePage({ page_type, title, slug, quelle, generatorAufrufen }) {
  const typ = getType(page_type);
  if (!typ) throw new Fehler(400, 'Unbekannter Seitentyp.');
  if (page_type === 'home') throw new Fehler(409, 'Es gibt schon eine Startseite.');
  const titel = String(title ?? '').trim();
  if (!titel) throw new Fehler(400, 'Bitte geben Sie einen Titel an.');
  const adresse = String(slug ?? '').trim() || slugAus(titel);
  const problem = slugFehler(adresse);
  if (problem) throw new Fehler(400, problem);
  if (await queryOne('SELECT id FROM pages WHERE slug = $1', [adresse])) throw new Fehler(409, `Die Adresse /${adresse} ist schon vergeben.`);

  let inhalt;
  let status = 'draft';
  if (String(quelle ?? '').trim()) {
    inhalt = await generiere({ typ: page_type, quelle, ...(generatorAufrufen ? { aufrufen: generatorAufrufen } : {}) });
    status = 'generated';
  } else {
    const { blocks } = await import('./blocks/index.js');
    inhalt = { blocks: startBloecke(typ, titel, blocks) };
  }

  const id = randomUUID();
  const jetzt = new Date().toISOString();
  await query(
    `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, '', $6, $7, $7)`,
    [id, adresse, page_type, status, titel, JSON.stringify(inhalt), jetzt]);
  await entferneUmleitung(`/${adresse}`);   // eine alte Umleitung von hier würde die neue Seite verdecken
  return holePage(id);
}

/**
 * Bestehende Seite neu generieren. P5: was ein Mensch bearbeitet, freigegeben, veröffentlicht
 * oder archiviert hat, wird nicht stillschweigend überschrieben — das braucht `force: true`.
 * Ein 'draft' oder bereits 'generated' darf ohne Force neu generiert werden.
 */
export async function regenerierePage(id, { quelle, force = false, generatorAufrufen } = {}) {
  const alt = await holePage(id);
  if (!alt) throw new Fehler(404, 'Seite nicht gefunden.');
  const GESCHUETZT = new Set(['edited', 'approved', 'published', 'archived']);
  if (GESCHUETZT.has(alt.status) && !force) {
    throw new Fehler(409, `Diese Seite ist „${STATUS_NAMEN[alt.status]}". Eine Neugenerierung würde das überschreiben — nur mit ausdrücklichem Force.`);
  }
  const inhalt = await generiere({ typ: alt.page_type, quelle, ...(generatorAufrufen ? { aufrufen: generatorAufrufen } : {}) });
  await query('UPDATE pages SET content_json = $1, status = $2, updated_at = $3 WHERE id = $4',
    [JSON.stringify(inhalt), 'generated', new Date().toISOString(), id]);
  return holePage(id);
}

export async function speicherePage(id, felder) {
  const alt = await holePage(id);
  if (!alt) throw new Fehler(404, 'Seite nicht gefunden.');

  const titel = felder.title !== undefined ? String(felder.title).trim().slice(0, 200) : alt.title;
  const beschreibung = felder.description !== undefined ? String(felder.description).trim().slice(0, 400) : alt.description;
  const noindex = felder.noindex !== undefined ? Boolean(felder.noindex) : alt.noindex;
  let ogBild = alt.og_image;
  if (felder.og_image !== undefined) {
    ogBild = String(felder.og_image).trim();
    if (ogBild && !/^\/uploads\/[\w-]+$/.test(ogBild)) throw new Fehler(400, 'Ungültiges Vorschaubild.');
  }

  let inhalt = alt.content;
  if (felder.content !== undefined) {
    const { inhalt: sauber, fehler: unbekannt } = bereinigeInhalt(felder.content);
    if (unbekannt.length) throw new Fehler(422, 'Der Inhalt enthält Unbekanntes.', unbekannt);
    inhalt = sauber;
  }
  const vertrag = validateContent(alt.page_type, inhalt);
  if (!vertrag.ok) throw new Fehler(422, 'Der Inhalt passt nicht zum Seitentyp.', vertrag.fehler);

  let slug = alt.slug;
  if (felder.slug !== undefined && felder.slug !== alt.slug) {
    if (alt.slug === 'start') throw new Fehler(409, 'Die Adresse der Startseite lässt sich nicht ändern.');
    const problem = slugFehler(String(felder.slug));
    if (problem) throw new Fehler(400, problem);
    if (await queryOne('SELECT id FROM pages WHERE slug = $1', [felder.slug])) throw new Fehler(409, `Die Adresse /${felder.slug} ist schon vergeben.`);
    slug = felder.slug;
  }

  const geaendert = JSON.stringify(inhalt) !== JSON.stringify(alt.content) || titel !== alt.title || beschreibung !== alt.description
    || ogBild !== alt.og_image || noindex !== alt.noindex || slug !== alt.slug;
  // Was ein Mensch anfasst, wird "bearbeitet" (P5). Veröffentlichtes und Archiviertes behält seinen Status.
  const status = geaendert && ['draft', 'generated', 'approved'].includes(alt.status) ? 'edited' : alt.status;

  await query(
    `UPDATE pages SET slug = $1, title = $2, description = $3, content_json = $4, status = $5, og_image = $6, noindex = $7, updated_at = $8
     WHERE id = $9`,
    [slug, titel, beschreibung, JSON.stringify(inhalt), status, ogBild || null, noindex ? 1 : 0, new Date().toISOString(), id]);

  const umbenannt = slug !== alt.slug;
  if (umbenannt) {
    await query('UPDATE navigation SET href = $1 WHERE href = $2', [`/${slug}`, `/${alt.slug}`]);
    // Eine ältere Umleitung von der neuen Adresse würde die Seite verdecken (und bei "zurück zum alten Namen" eine Schleife bilden).
    await entferneUmleitung(`/${slug}`);
    if (alt.status === 'published') await setzeUmleitung(`/${alt.slug}`, `/${slug}`);   // ungefragt, nicht als Angebot
  }
  return { seite: await holePage(id), umbenannt, alteAdresse: umbenannt ? `/${alt.slug}` : null };
}

/** Wer verweist auf diese Seite? Andere Seiten, Menüpunkte, Umleitungen. */
export async function verweiseAuf(slug, ohneId = null) {
  const ziel = slug === 'start' ? '/' : `/${slug}`;
  const trifft = (s) => normalisierePfad(s) === ziel;
  const seiten = (await query('SELECT id, slug, title, content_json FROM pages'))
    .filter((s) => s.id !== ohneId && sammleWerte(JSON.parse(s.content_json), trifft).length)
    .map((s) => ({ id: s.id, slug: s.slug, title: s.title }));
  const menue = (await query('SELECT id, label FROM navigation WHERE href = $1', [ziel])).map((n) => n.label);
  return { seiten, menue };
}

/** Alles, was gegen ein Veröffentlichen spricht (Fehler), und was man wissen sollte (Warnungen). */
export async function pruefeVeroeffentlichung(page) {
  const fehler = [];
  const warnungen = [];
  const vertrag = validateContent(page.page_type, page.content);
  if (!vertrag.ok) fehler.push(...vertrag.fehler);
  if (!page.title) fehler.push('Der Titel fehlt (er erscheint im Browser-Tab und in Suchergebnissen).');
  if (!page.description) fehler.push('Die Beschreibung fehlt (sie erscheint in Suchergebnissen).');

  const { html, fehlend } = await rendereSeite({ ...page, status: 'published', content_json: page.content });
  const h1 = html.match(/<h1[\s>][\s\S]*?<\/h1>/g) || [];
  if (h1.length !== 1) fehler.push(`Die Seite braucht genau eine Hauptüberschrift, sie hat ${h1.length}.`);
  else if (!h1[0].replace(/<[^>]+>/g, '').trim()) fehler.push('Die Hauptüberschrift ist leer.');
  for (const img of html.match(/<img [^>]*>/g) || []) {
    if (!/alt="[^"]+"/.test(img)) fehler.push('Ein Bild hat keine Bildbeschreibung (Alt-Text).');
  }
  if (fehlend.length) fehler.push(`Diese Fakten haben noch keinen Wert: ${fehlend.join(', ')}. Bitte unter „Fakten" ergänzen.`);

  const stand = await seitenStatus();
  const eigene = new Set([...stand.veroeffentlicht, page.slug]);
  const links = sammleWerte(page.content, (s) => s.startsWith('/') && !s.startsWith('/uploads') && !s.startsWith('//'));
  for (const link of new Set(links)) {
    const slug = slugVon(link);
    if (!slug || slug === 'karin-pieber.vcf' || /\.[a-z0-9]{2,4}$/i.test(slug)) continue;
    if (!stand.alle.has(slug) && slug !== page.slug) warnungen.push(`Ein Link führt auf ${normalisierePfad(link)}, diese Seite gibt es nicht.`);
    else if (!eigene.has(slug)) warnungen.push(`Ein Link führt auf ${normalisierePfad(link)}, diese Seite ist nicht veröffentlicht.`);
  }
  return { fehler: [...new Set(fehler)], warnungen: [...new Set(warnungen)] };
}

export async function fuehreAktionAus(id, aktion) {
  const def = AKTIONEN[aktion];
  if (!def) throw new Fehler(400, 'Unbekannte Aktion.');
  const page = await holePage(id);
  if (!page) throw new Fehler(404, 'Seite nicht gefunden.');
  if (!def.von.includes(page.status)) throw new Fehler(409, `Aus dem Status „${STATUS_NAMEN[page.status]}" ist das nicht möglich.`);
  let warnungen = [];
  if (aktion === 'veroeffentlichen') {
    const p = await pruefeVeroeffentlichung(page);
    if (p.fehler.length) throw new Fehler(422, 'Diese Seite kann noch nicht veröffentlicht werden.', p.fehler);
    warnungen = p.warnungen;
  }
  await query('UPDATE pages SET status = $1, updated_at = $2 WHERE id = $3', [def.nach, new Date().toISOString(), id]);
  if (aktion === 'veroeffentlichen') await entferneUmleitung(`/${page.slug}`);
  return { seite: await holePage(id), warnungen };
}

export async function loeschePage(id, { redirect_to } = {}) {
  const page = await holePage(id);
  if (!page) throw new Fehler(404, 'Seite nicht gefunden.');
  if (page.slug === 'start') throw new Fehler(409, 'Die Startseite kann nicht gelöscht werden.');

  let ziel = '';
  if (page.status === 'published') {
    ziel = normalisierePfad(redirect_to);
    if (!ziel) throw new Fehler(400, 'Diese Seite ist veröffentlicht. Bitte geben Sie an, wohin ihre Adresse künftig umleiten soll.');
    const slug = slugVon(ziel);
    const stand = await seitenStatus();
    if (slug === page.slug || !stand.veroeffentlicht.has(slug)) throw new Fehler(400, 'Das Ziel der Umleitung muss eine andere, veröffentlichte Seite sein.');
  }
  const verweise = await verweiseAuf(page.slug, id);

  const menueZeilen = await query('SELECT id FROM navigation WHERE href = $1', [`/${page.slug}`]);
  for (const z of menueZeilen) {
    await query('UPDATE navigation SET parent_id = NULL WHERE parent_id = $1', [z.id]);
    await query('DELETE FROM navigation WHERE id = $1', [z.id]);
  }
  await query('DELETE FROM pages WHERE id = $1', [id]);
  if (ziel) await setzeUmleitung(`/${page.slug}`, ziel);
  else await query('DELETE FROM redirects WHERE to_path = $1', [`/${page.slug}`]);
  return { menuepunkteEntfernt: menueZeilen.length, verweise };
}
