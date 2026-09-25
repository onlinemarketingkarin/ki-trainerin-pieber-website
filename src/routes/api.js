import express from 'express';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { query, queryOne } from '../db.js';
import * as auth from '../auth.js';
import { Fehler } from '../fehler.js';
import { listTypes } from '../archetypes.js';
import { blocks } from '../blocks/index.js';
import { ziel } from '../blocks/_util.js';
import { bereinigeInhalt } from '../content.js';
import { STATUS_NAMEN, AKTIONEN, listePages, holePage, erstellePage, speicherePage, fuehreAktionAus, loeschePage, verweiseAuf, pruefeVeroeffentlichung, regenerierePage } from '../pages.js';
import { rendereSeite, seitenStatus, slugVon } from '../site.js';
import { listeMedien, speichereMedium, aendereAlt, loescheMedium, bildVerwendung } from '../medien.js';
import { listeUmleitungen, setzeUmleitung, entferneUmleitung } from '../redirects.js';
import { faktenStand, speichereFakten } from '../facts.js';
import { ROOT } from '../paths.js';

const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

/** Der Baustein-Katalog fürs Cockpit: aus dem Schema entsteht das Formular, nie von Hand. */
const bausteinKatalog = () => Object.fromEntries(Object.values(blocks).map((b) => [b.name, { label: b.label, rahmen: Boolean(b.rahmen), schema: b.schema }]));

const BEREICHE = ['kopf', 'fuss', 'beide'];

/** Menüpunkte aus dem Cockpit prüfen und flach machen. Zwei Ebenen, nie drei. */
function flacheNavigation(baum) {
  if (!Array.isArray(baum)) throw new Fehler(400, 'Die Navigation muss eine Liste sein.');
  if (baum.length > 40) throw new Fehler(400, 'Mehr als 40 Menüpunkte sind zu viele.');
  const zeilen = [];
  let sort = 0;
  const punkt = (e, parentId, ebene) => {
    const label = String(e?.label ?? '').trim().slice(0, 80);
    if (!label) throw new Fehler(400, 'Jeder Menüpunkt braucht eine Beschriftung.');
    const href = String(e?.href ?? '').trim();
    const kinder = Array.isArray(e?.kinder) ? e.kinder : [];
    if (ebene === 2 && kinder.length) throw new Fehler(400, 'Ein Untermenü darf kein weiteres Untermenü haben. Zwei Ebenen reichen.');
    if (href && !ziel(href)) throw new Fehler(400, `„${label}": das Ziel muss mit / oder https:// beginnen (oder mailto:, tel:, #).`);
    if (!href && !kinder.length) throw new Fehler(400, `„${label}" braucht ein Ziel, oder es muss ein Untermenü darunter hängen.`);
    const id = /^[\w-]{8,64}$/.test(String(e?.id ?? '')) ? e.id : randomUUID();
    zeilen.push({ id, parent_id: parentId, label, href, sort: (sort += 10), visible: e?.visible === false ? 0 : 1, bereich: BEREICHE.includes(e?.bereich) ? e.bereich : 'beide' });
    kinder.forEach((k) => punkt(k, id, 2));
  };
  baum.forEach((e) => punkt(e, null, 1));
  return zeilen;
}

async function navigationBaum() {
  const zeilen = await query('SELECT id, parent_id, label, href, sort, visible, bereich FROM navigation ORDER BY sort');
  const stand = await seitenStatus();
  const mitStatus = (z) => {
    const slug = slugVon(z.href);
    const intern = z.href.startsWith('/');
    return {
      id: z.id, label: z.label, href: z.href, visible: Boolean(Number(z.visible)), bereich: z.bereich,
      zielStatus: !intern ? 'extern' : stand.veroeffentlicht.has(slug) ? 'ok' : stand.alle.has(slug) ? 'unveroeffentlicht' : slug === 'karin-pieber.vcf' || /\.[a-z0-9]{2,4}$/i.test(slug) ? 'ok' : 'unbekannt',
    };
  };
  return zeilen.filter((z) => !z.parent_id).map((z) => ({ ...mitStatus(z), kinder: zeilen.filter((k) => k.parent_id === z.id).map(mitStatus) }));
}

export function apiRouter({ verlangeLogin = auth.verlangeLogin, generatorAufrufen } = {}) {
  const r = express.Router();
  const route = (fn) => async (req, res) => {
    try { await fn(req, res); } catch (err) {
      if (err instanceof Fehler) return res.status(err.status).json({ fehler: err.message, details: err.details });
      console.error('[Motor] [ERROR]', err);
      res.status(500).json({ fehler: 'Unerwarteter Fehler. Einzelheiten stehen im Server-Protokoll.' });
    }
  };
  r.use(express.json({ limit: '2mb' }));

  // ---- Anmeldung (die einzigen Routen ohne Login) ----
  r.get('/status', (_req, res) => res.json({ eingerichtet: auth.anmeldungMoeglich(), version: VERSION }));
  r.post('/login', route(async (req, res) => {
    if (!auth.anmeldungMoeglich()) throw new Fehler(503, 'Das Cockpit ist noch nicht eingerichtet: ADMIN_PASSWORD fehlt oder ist kürzer als 8 Zeichen.');
    if (auth.gesperrt(req.ip)) throw new Fehler(429, 'Zu viele Versuche. Bitte warten Sie einige Minuten.');
    if (!auth.passwortStimmt(req.body?.passwort)) { auth.merkeFehlversuch(req.ip); throw new Fehler(401, 'Das Passwort stimmt nicht.'); }
    auth.vergesseVersuche(req.ip);
    auth.setzeCookie(req, res, auth.erstelleToken());
    res.json({ ok: true });
  }));
  r.post('/logout', (req, res) => { auth.loescheCookie(req, res); res.json({ ok: true }); });

  // ---- Ab hier verlangt alles die Anmeldung ----
  r.use(verlangeLogin);

  r.get('/me', (_req, res) => res.json({ ok: true, version: VERSION }));

  r.get('/meta', (_req, res) => res.json({
    seitentypen: listTypes().map((t) => ({ name: t.name, label: t.label, beschreibung: t.beschreibung, erlaubt: t.schema.allowedBlocks || [], pflicht: t.schema.requiredBlocks || [] })),
    bausteine: bausteinKatalog(),
    status: STATUS_NAMEN,
    aktionen: Object.fromEntries(Object.entries(AKTIONEN).map(([k, v]) => [k, v.von])),
  }));

  r.get('/stats', route(async (_req, res) => {
    const anfragen = await queryOne('SELECT COUNT(*) AS n FROM submissions WHERE gelesen = 0');
    res.json({ ungelesen: Number(anfragen.n) });
  }));

  // ---- Seiten ----
  r.get('/pages', route(async (_req, res) => res.json({ seiten: await listePages() })));
  // Nur diese Felder aus dem Request übernehmen: generatorAufrufen kommt ausschließlich aus der
  // Server-Konfiguration (Tests), nie vom Client.
  r.post('/pages', route(async (req, res) => {
    const b = req.body || {};
    res.status(201).json({ seite: await erstellePage({ page_type: b.page_type, title: b.title, slug: b.slug, quelle: b.quelle, generatorAufrufen }) });
  }));
  r.post('/pages/:id/generieren', route(async (req, res) => {
    const b = req.body || {};
    res.json({ seite: await regenerierePage(req.params.id, { quelle: b.quelle, force: Boolean(b.force), generatorAufrufen }) });
  }));
  r.get('/pages/:id', route(async (req, res) => {
    const seite = await holePage(req.params.id);
    if (!seite) throw new Fehler(404, 'Seite nicht gefunden.');
    res.json({ seite });
  }));
  r.put('/pages/:id', route(async (req, res) => res.json(await speicherePage(req.params.id, req.body || {}))));
  r.post('/pages/:id/aktion', route(async (req, res) => res.json(await fuehreAktionAus(req.params.id, req.body?.aktion))));
  r.get('/pages/:id/pruefung', route(async (req, res) => {
    const seite = await holePage(req.params.id);
    if (!seite) throw new Fehler(404, 'Seite nicht gefunden.');
    res.json(await pruefeVeroeffentlichung(seite));
  }));
  r.get('/pages/:id/verweise', route(async (req, res) => {
    const seite = await holePage(req.params.id);
    if (!seite) throw new Fehler(404, 'Seite nicht gefunden.');
    res.json(await verweiseAuf(seite.slug, seite.id));
  }));
  r.delete('/pages/:id', route(async (req, res) => res.json(await loeschePage(req.params.id, req.body || {}))));

  // Vorschau des ungespeicherten Stands: gleiches Rendern wie öffentlich, aber immer noindex.
  r.post('/preview', route(async (req, res) => {
    const b = req.body || {};
    const { inhalt } = bereinigeInhalt(b.content);
    res.json(await rendereSeite({
      slug: String(b.slug || 'vorschau'), page_type: b.page_type, title: String(b.title || ''), description: String(b.description || ''),
      og_image: '', noindex: 1, status: 'draft', content_json: inhalt,
    }, { vorschau: true }));
  }));

  // ---- Navigation ----
  r.get('/navigation', route(async (_req, res) => {
    const seiten = (await query("SELECT slug, title FROM pages WHERE status = 'published' ORDER BY slug")).map((s) => ({ slug: s.slug, title: s.title }));
    res.json({ baum: await navigationBaum(), seiten });
  }));
  r.put('/navigation', route(async (req, res) => {
    const zeilen = flacheNavigation(req.body?.baum);
    await query('DELETE FROM navigation');
    for (const z of zeilen) {
      await query('INSERT INTO navigation (id, parent_id, label, href, sort, visible, bereich) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [z.id, z.parent_id, z.label, z.href, z.sort, z.visible, z.bereich]);
    }
    res.json({ baum: await navigationBaum() });
  }));

  // ---- Medien ----
  r.get('/media', route(async (_req, res) => res.json({ medien: await listeMedien() })));
  r.post('/media', express.raw({ type: 'image/*', limit: '12mb' }), route(async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) throw new Fehler(400, 'Es wurde kein Bild übertragen.');
    const name = decodeURIComponent(req.get('X-Dateiname') || 'bild');
    const alt = decodeURIComponent(req.get('X-Alt') || '');
    res.status(201).json({ medium: await speichereMedium(req.body, name, alt) });
  }));
  r.put('/media/:id', route(async (req, res) => res.json({ medium: await aendereAlt(req.params.id, req.body?.alt) })));
  r.get('/media/:id/verwendung', route(async (req, res) => {
    const m = await queryOne('SELECT file_path FROM media WHERE id = $1', [req.params.id]);
    if (!m) throw new Fehler(404, 'Bild nicht gefunden.');
    res.json({ seiten: await bildVerwendung(m.file_path) });
  }));
  r.delete('/media/:id', route(async (req, res) => { await loescheMedium(req.params.id); res.json({ ok: true }); }));

  // ---- Umleitungen ----
  r.get('/redirects', route(async (_req, res) => res.json({ umleitungen: await listeUmleitungen() })));
  r.post('/redirects', route(async (req, res) => res.status(201).json({ umleitung: await setzeUmleitung(req.body?.von, req.body?.nach, req.body?.code || 301) })));
  r.delete('/redirects', route(async (req, res) => { await entferneUmleitung(req.body?.von); res.json({ ok: true }); }));

  // ---- Anfragen ----
  r.get('/submissions', route(async (_req, res) => {
    const zeilen = await query('SELECT id, form, page_slug, daten, gelesen, created_at FROM submissions ORDER BY created_at DESC LIMIT 500');
    res.json({ anfragen: zeilen.map((z) => ({ id: z.id, form: z.form, seite: z.page_slug, gelesen: Boolean(Number(z.gelesen)), eingang: z.created_at, daten: JSON.parse(z.daten) })) });
  }));
  r.put('/submissions/:id', route(async (req, res) => {
    await query('UPDATE submissions SET gelesen = $1 WHERE id = $2', [req.body?.gelesen ? 1 : 0, req.params.id]);
    res.json({ ok: true });
  }));
  r.delete('/submissions/:id', route(async (req, res) => { await query('DELETE FROM submissions WHERE id = $1', [req.params.id]); res.json({ ok: true }); }));

  // ---- Fakten ohne Deploy ----
  r.get('/facts', route(async (_req, res) => res.json(await faktenStand())));
  r.put('/facts', route(async (req, res) => {
    if (!req.body || typeof req.body.fakten !== 'object') throw new Fehler(400, 'Es fehlen die Fakten.');
    res.json(await speichereFakten(req.body.fakten));
  }));

  r.use((_req, res) => res.status(404).json({ fehler: 'Diesen Endpunkt gibt es nicht.' }));
  return r;
}
