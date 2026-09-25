import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

// Alles im Arbeitsspeicher beziehungsweise in einem Wegwerf-Ordner, mit einem Testpasswort.
process.env.SQLITE_FILE = ':memory:';
process.env.ADMIN_PASSWORD = 'ein-langes-testpasswort';
process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), 'motor-api-'));
delete process.env.DATABASE_URL;
delete process.env.SMTP_URL;

const { runMigrations, query, queryOne } = await import('../src/db.js');
const { erstelleApp } = await import('../src/app.js');
const { seedeInhalte } = await import('../src/seed.js');
const { vergesseVersuche } = await import('../src/auth.js');

await runMigrations();
await seedeInhalte({ force: true });
mock.method(console, 'warn', () => {});
mock.method(console, 'error', () => {});

let server;
let basis;
let cookie = '';
before(async () => { server = erstelleApp().listen(0); basis = `http://127.0.0.1:${server.address().port}`; });
after(() => server.close());

/** Kleiner Client: Cookie und der Pflicht-Header für Änderungen sind eingebaut. */
async function api(methode, pfad, body, { angemeldet = true, headers = {}, roh = false } = {}) {
  const h = { ...headers };
  if (angemeldet && cookie) h.Cookie = cookie;
  if (methode !== 'GET' && !('X-Cockpit' in h)) h['X-Cockpit'] = '1';
  let daten = body;
  if (body !== undefined && !Buffer.isBuffer(body) && typeof body !== 'string') { h['Content-Type'] = 'application/json'; daten = JSON.stringify(body); }
  const r = await fetch(basis + pfad, { method: methode, headers: h, body: daten, redirect: 'manual' });
  const text = await r.text();
  let json = null;
  if (!roh) { try { json = JSON.parse(text); } catch { /* kein JSON */ } }
  return { status: r.status, json, text, headers: r.headers };
}
const seite = async (slug) => (await api('GET', '/api/pages')).json.seiten.find((s) => s.slug === slug);
const oeffentlich = (pfad) => api('GET', pfad, undefined, { angemeldet: false, roh: true });

test('Ohne Anmeldung kommt nichts durch, auch nicht mit falschem Passwort', async () => {
  for (const [m, p] of [['GET', '/api/pages'], ['POST', '/api/pages'], ['PUT', '/api/navigation'], ['GET', '/api/submissions'], ['GET', '/api/facts'], ['DELETE', '/api/pages/x'], ['POST', '/api/media']]) {
    assert.equal((await api(m, p, m === 'GET' ? undefined : {}, { angemeldet: false })).status, 401, `${m} ${p}`);
  }
  assert.equal((await api('POST', '/api/login', { passwort: 'falsch' }, { angemeldet: false })).status, 401);
  assert.equal((await api('POST', '/api/login', {}, { angemeldet: false })).status, 401);
  vergesseVersuche('::ffff:127.0.0.1'); vergesseVersuche('127.0.0.1');
});

test('Anmelden setzt ein Cookie (HttpOnly, SameSite=Strict); Änderungen brauchen zusätzlich den Header', async () => {
  const r = await api('POST', '/api/login', { passwort: 'ein-langes-testpasswort' }, { angemeldet: false });
  assert.equal(r.status, 200);
  const gesetzt = r.headers.get('set-cookie');
  assert.match(gesetzt, /HttpOnly/);
  assert.match(gesetzt, /SameSite=Strict/);
  cookie = gesetzt.split(';')[0];
  assert.equal((await api('GET', '/api/me')).status, 200);
  assert.equal((await api('POST', '/api/pages', { page_type: 'text', title: 'X' }, { headers: { 'X-Cockpit': '' } })).status, 403, 'ohne Header abgelehnt, obwohl das Cookie stimmt');
  assert.equal((await api('POST', '/api/logout')).status, 200);
});

test('Der Seitenkatalog kommt aus den Ordnern: Typen, Bausteine samt Schema, Status', async () => {
  const { json } = await api('GET', '/api/meta');
  assert.ok(json.seitentypen.map((t) => t.name).includes('angebot'));
  assert.ok(json.bausteine.hero.schema.titel.type === 'text' && json.bausteine.hero.schema.links.type === 'list');
  assert.ok(json.bausteine.richtext.schema.flaeche.options.includes('mint'));
  assert.equal(json.status.published, 'Veröffentlicht');
});

test('Seite anlegen: Pflichtbausteine, Titel im ersten Baustein, Status Entwurf', async () => {
  const r = await api('POST', '/api/pages', { page_type: 'angebot', title: 'Mein neues Angebot' });
  assert.equal(r.status, 201);
  const s = r.json.seite;
  assert.equal(s.slug, 'mein-neues-angebot');
  assert.equal(s.status, 'draft');
  assert.deepEqual(s.content.blocks.map((b) => b.type), ['nav', 'hero', 'cta', 'footer']);
  assert.equal(s.content.blocks[1].data.titel, 'Mein neues Angebot');
  assert.equal((await api('POST', '/api/pages', { page_type: 'angebot', title: 'Mein neues Angebot' })).status, 409, 'Adresse doppelt');
  assert.equal((await api('POST', '/api/pages', { page_type: 'home', title: 'Zweite Startseite' })).status, 409);
  assert.equal((await api('POST', '/api/pages', { page_type: 'text', title: 'Cockpit' })).status, 400, 'reservierte Adresse');
  assert.equal((await api('POST', '/api/pages', { page_type: 'gibt-es-nicht', title: 'x' })).status, 400);
});

test('Ein Entwurf ist öffentlich nicht zu sehen, auch nicht in der Sitemap', async () => {
  assert.equal((await oeffentlich('/mein-neues-angebot')).status, 404);
  assert.ok(!(await oeffentlich('/sitemap.xml')).text.includes('mein-neues-angebot'));
});

test('Speichern: Inhalt wird gesäubert, Status wird "bearbeitet", der Vertrag gilt', async () => {
  const s = await seite('mein-neues-angebot');
  const voll = (await api('GET', `/api/pages/${s.id}`)).json.seite;
  voll.content.blocks[1].data = { pill: 'Neu', titel: 'Ein <b>starker</b> Titel', sub: 'Text', boese: 'x', ctaLabel: 'Los', ctaHref: '/kontakt' };
  const r = await api('PUT', `/api/pages/${s.id}`, { title: 'Mein Angebot', description: 'Eine Beschreibung für Suchmaschinen.', content: voll.content });
  assert.equal(r.status, 200);
  assert.equal(r.json.seite.status, 'edited');
  assert.ok(!('boese' in r.json.seite.content.blocks[1].data));
  assert.equal(r.json.seite.title, 'Mein Angebot');
  // Der Vertrag: ohne Pflichtbaustein wird nichts gespeichert
  const ohneHero = { blocks: voll.content.blocks.filter((b) => b.type !== 'hero') };
  const abgelehnt = await api('PUT', `/api/pages/${s.id}`, { content: ohneHero });
  assert.equal(abgelehnt.status, 422);
  assert.ok(abgelehnt.json.details.some((d) => d.includes('Pflicht-Baustein fehlt: hero')));
  assert.equal((await api('PUT', `/api/pages/${s.id}`, { content: { blocks: [...voll.content.blocks, { type: 'gibt-es-nicht' }] } })).status, 422);
});

test('Veröffentlichen prüft: ohne Beschreibung, mit leerer Überschrift oder fehlenden Fakten geht es nicht', async () => {
  const s = await seite('mein-neues-angebot');
  const aktuell = (await api('GET', `/api/pages/${s.id}`)).json.seite;

  await api('PUT', `/api/pages/${s.id}`, { description: '' });
  let r = await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'veroeffentlichen' });
  assert.equal(r.status, 422);
  assert.ok(r.json.details.some((d) => d.includes('Beschreibung')));

  const leer = structuredClone(aktuell.content);
  leer.blocks[1].data.titel = '';
  await api('PUT', `/api/pages/${s.id}`, { description: 'Beschreibung', content: leer });
  r = await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'veroeffentlichen' });
  assert.ok(r.json.details.some((d) => d.includes('Hauptüberschrift ist leer')));

  const mitFakt = structuredClone(aktuell.content);
  mitFakt.blocks[1].data.sub = 'Preis: {{facts.preise.gibts_nicht}}';
  await api('PUT', `/api/pages/${s.id}`, { content: mitFakt });
  r = await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'veroeffentlichen' });
  assert.ok(r.json.details.some((d) => d.includes('preise.gibts_nicht')), 'fehlender Fakt wird benannt');

  await api('PUT', `/api/pages/${s.id}`, { content: aktuell.content });
  r = await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'veroeffentlichen' });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.seite.status, 'published');
});

test('Veröffentlicht: sofort unter der festen URL, in der Sitemap, mit Meta-Angaben; Modelltext ist escaped', async () => {
  const p = await oeffentlich('/mein-neues-angebot');
  assert.equal(p.status, 200);
  assert.ok(p.text.includes('Ein &lt;b&gt;starker&lt;/b&gt; Titel'));
  assert.ok(p.text.includes('<link rel="canonical" href="https://ki-trainerin-pieber.org/mein-neues-angebot">'));
  assert.ok(p.text.includes('property="og:title"'));
  assert.ok(!p.text.includes('noindex'));
  assert.equal((await oeffentlich('/mein-neues-angebot/')).status, 200);
  const sitemap = (await oeffentlich('/sitemap.xml')).text;
  assert.ok(sitemap.includes('<loc>https://ki-trainerin-pieber.org/mein-neues-angebot</loc>'));
  assert.ok(sitemap.includes('<loc>https://ki-trainerin-pieber.org/</loc>'));
  assert.ok(!sitemap.includes('/danke') && !sitemap.includes('/impressum'), 'noindex und Entwürfe stehen nicht drin');
  const robots = (await oeffentlich('/robots.txt')).text;
  assert.ok(robots.includes('Disallow: /cockpit') && robots.includes('Sitemap: https://ki-trainerin-pieber.org/sitemap.xml'));
});

test('Impressum ist mit den Neue-Selbständige-Fakten sofort veröffentlichbar, Datenschutz erst mit Hosting-Angaben', async () => {
  const imp = await seite('impressum');
  const rImp = await api('POST', `/api/pages/${imp.id}/aktion`, { aktion: 'veroeffentlichen' });
  assert.equal(rImp.status, 200, JSON.stringify(rImp.json));
  const impSeite = await oeffentlich('/impressum');
  assert.equal(impSeite.status, 200);
  assert.ok(impSeite.text.includes('Neue Selbständige'));
  assert.ok(!impSeite.text.includes('[…]'));

  // Die echten Hosting-Fakten sind inzwischen eingetragen (config/facts.json) — die "noch nicht
  // ausgefüllt"-Situation wird hier bewusst per Override nachgestellt, um das Fakten-Tor zu prüfen.
  const f = (await api('GET', '/api/facts')).json;
  const leer = structuredClone(f.aktuell);
  Object.assign(leer.hosting, { speicherdauer: '' });
  await api('PUT', '/api/facts', { fakten: leer });

  const ds = await seite('datenschutz');
  const rDs = await api('POST', `/api/pages/${ds.id}/aktion`, { aktion: 'veroeffentlichen' });
  assert.equal(rDs.status, 422);
  assert.ok(rDs.json.details.join(' ').includes('hosting.speicherdauer'));
  assert.equal((await oeffentlich('/datenschutz')).status, 404);

  await api('PUT', '/api/facts', { fakten: f.datei });   // Override wieder entfernen, echte Datei gilt
});

test('Fakten ohne Deploy: Override gewinnt, Grundwert bleibt sichtbar, Zurücksetzen entfernt ihn', async () => {
  let f = (await api('GET', '/api/facts')).json;
  assert.equal(f.datei.preise.starter, 'auf Anfrage');
  const neu = structuredClone(f.aktuell);
  neu.preise.starter = '190 Euro';
  neu.unbekanntes = 'wird ignoriert';
  f = (await api('PUT', '/api/facts', { fakten: neu })).json;
  assert.deepEqual(f.override, { preise: { starter: '190 Euro' } });
  const coaching = await oeffentlich('/1-1-ki-coaching');
  assert.ok(coaching.text.includes('190 Euro') && !coaching.text.includes('auf Anfrage'), 'der Preis ist ohne Deploy geändert');
  f = (await api('PUT', '/api/facts', { fakten: f.datei })).json;
  assert.deepEqual(f.override, {});
  assert.ok((await oeffentlich('/1-1-ki-coaching')).text.includes('auf Anfrage'));
  assert.equal((await api('PUT', '/api/facts', {})).status, 400);
});

test('Datenschutz: mit Hosting- und Formular-Fakten geht das Veröffentlichen', async () => {
  const f = (await api('GET', '/api/facts')).json.aktuell;
  Object.assign(f.hosting, { standort: 'Deutschland', speicherdauer: '7 Tage', rechtsgrundlage: 'berechtigtes Interesse' });
  Object.assign(f.kontaktformular, { dienst: 'Eigener Mailserver', speicherdauer: '12 Monate' });
  await api('PUT', '/api/facts', { fakten: f });
  const ds = await seite('datenschutz');
  const r = await api('POST', `/api/pages/${ds.id}/aktion`, { aktion: 'veroeffentlichen' });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal((await oeffentlich('/datenschutz')).status, 200);
});

test('Umbenennen einer veröffentlichten Seite: 301 von allein, Menü und Verweise bleiben heil', async () => {
  const s = await seite('mein-neues-angebot');
  await api('PUT', '/api/navigation', { baum: [{ label: 'Neu', href: '/mein-neues-angebot' }, { label: 'Kontakt', href: '/kontakt' }] });
  const r = await api('PUT', `/api/pages/${s.id}`, { slug: 'anders-genannt' });
  assert.equal(r.status, 200);
  assert.equal(r.json.umbenannt, true);
  assert.equal(r.json.alteAdresse, '/mein-neues-angebot');
  const alt = await oeffentlich('/mein-neues-angebot');
  assert.equal(alt.status, 301);
  assert.equal(alt.headers.get('location'), '/anders-genannt');
  assert.equal((await oeffentlich('/anders-genannt')).status, 200);
  assert.equal((await oeffentlich('/mein-neues-angebot?interesse=team')).headers.get('location'), '/anders-genannt?interesse=team', 'die Abfrage bleibt erhalten');
  const nav = (await api('GET', '/api/navigation')).json.baum;
  assert.equal(nav[0].href, '/anders-genannt', 'der Menüpunkt zieht mit');
  assert.ok((await oeffentlich('/sitemap.xml')).text.includes('/anders-genannt'));
  // Zurück zum alten Namen: die Umleitung von dort verschwindet, sonst wäre die Seite nicht erreichbar
  const zurueck = await api('PUT', `/api/pages/${s.id}`, { slug: 'mein-neues-angebot' });
  assert.equal(zurueck.status, 200, JSON.stringify(zurueck.json));
  assert.equal((await oeffentlich('/mein-neues-angebot')).status, 200);
  assert.equal((await oeffentlich('/anders-genannt')).status, 301, 'jetzt leitet der Zwischenname um');
});

test('Umbenennen: ungültig, vergeben, Startseite', async () => {
  const s = await seite('mein-neues-angebot');
  assert.equal((await api('PUT', `/api/pages/${s.id}`, { slug: 'Ungültig!' })).status, 400);
  assert.equal((await api('PUT', `/api/pages/${s.id}`, { slug: 'kontakt' })).status, 409);
  const start = await seite('start');
  assert.equal((await api('PUT', `/api/pages/${start.id}`, { slug: 'neu' })).status, 409);
  assert.equal((await api('DELETE', `/api/pages/${start.id}`, { redirect_to: '/kontakt' })).status, 409);
});

test('Zurückziehen: die Seite verschwindet, Menüpunkt und Fußzeilen-Link darauf ebenfalls', async () => {
  const s = await seite('mein-neues-angebot');
  assert.ok((await oeffentlich('/')).text.includes('href="/mein-neues-angebot"'), 'Ausgangslage: im Menü');
  const r = await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'zurueckziehen' });
  assert.equal(r.json.seite.status, 'approved');
  assert.equal((await oeffentlich('/mein-neues-angebot')).status, 404);
  assert.ok(!(await oeffentlich('/')).text.includes('/mein-neues-angebot'), 'kein Link ins Leere');
  const nav = (await api('GET', '/api/navigation')).json.baum;
  assert.equal(nav.find((n) => n.href === '/mein-neues-angebot').zielStatus, 'unveroeffentlicht', 'das Cockpit warnt');
  assert.equal((await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'zurueckziehen' })).status, 409, 'zweimal geht nicht');
  assert.equal((await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'veroeffentlichen' })).status, 200);
});

test('Löschen: Veröffentlichtes braucht ein Umleitungsziel, danach leitet die Adresse um', async () => {
  const s = await seite('mein-neues-angebot');
  const verweise = (await api('GET', `/api/pages/${s.id}/verweise`)).json;
  assert.equal(verweise.menue.length, 1, 'der Menüpunkt wird vorher genannt');
  assert.equal((await api('DELETE', `/api/pages/${s.id}`, {})).status, 400);
  assert.equal((await api('DELETE', `/api/pages/${s.id}`, { redirect_to: '/mein-neues-angebot' })).status, 400, 'nicht auf sich selbst');
  assert.equal((await api('DELETE', `/api/pages/${s.id}`, { redirect_to: '/gibt-es-nicht' })).status, 400);
  const r = await api('DELETE', `/api/pages/${s.id}`, { redirect_to: '/kontakt' });
  assert.equal(r.status, 200);
  assert.equal(r.json.menuepunkteEntfernt, 1);
  const weg = await oeffentlich('/mein-neues-angebot');
  assert.equal(weg.status, 301);
  assert.equal(weg.headers.get('location'), '/kontakt');
  assert.equal(await seite('mein-neues-angebot'), undefined);
  const nav = (await api('GET', '/api/navigation')).json.baum;
  assert.ok(!nav.some((n) => n.href.includes('mein-neues-angebot')));
});

test('Entwürfe lassen sich ohne Umleitung löschen', async () => {
  const s = (await api('POST', '/api/pages', { page_type: 'text', title: 'Wegwerfseite' })).json.seite;
  const r = await api('DELETE', `/api/pages/${s.id}`, {});
  assert.equal(r.status, 200);
  assert.equal((await oeffentlich('/wegwerfseite')).status, 404);
});

test('Archivieren und Wiederherstellen', async () => {
  const s = (await api('POST', '/api/pages', { page_type: 'text', title: 'Archivtest' })).json.seite;
  assert.equal((await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'archivieren' })).json.seite.status, 'archived');
  assert.equal((await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'veroeffentlichen' })).status, 409);
  assert.equal((await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'wiederherstellen' })).json.seite.status, 'draft');
  assert.equal((await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'gibt-es-nicht' })).status, 400);
  await api('DELETE', `/api/pages/${s.id}`, {});
});

test('Navigation: zwei Ebenen, nie drei; Ziele werden geprüft; Bereich Kopf und Fuß', async () => {
  const gut = { baum: [
    { label: 'Angebote', href: '', kinder: [{ label: 'Coaching', href: '/1-1-ki-coaching' }, { label: 'Teams', href: '/ki-trainings-teams' }] },
    { label: 'Nur Fuß', href: '/kontakt', bereich: 'fuss' },
    { label: 'Extern', href: 'https://example.org', visible: false },
  ] };
  const r = await api('PUT', '/api/navigation', gut);
  assert.equal(r.status, 200);
  assert.equal(r.json.baum[0].kinder.length, 2);
  assert.equal(r.json.baum[2].zielStatus, 'extern');
  assert.equal((await api('PUT', '/api/navigation', { baum: [{ label: 'A', href: '/a', kinder: [{ label: 'B', href: '/b', kinder: [{ label: 'C', href: '/c' }] }] }] })).status, 400);
  assert.equal((await api('PUT', '/api/navigation', { baum: [{ label: 'X', href: 'javascript:alert(1)' }] })).status, 400);
  assert.equal((await api('PUT', '/api/navigation', { baum: [{ label: '', href: '/x' }] })).status, 400);
  assert.equal((await api('PUT', '/api/navigation', { baum: [{ label: 'Leer', href: '' }] })).status, 400, 'ohne Ziel und ohne Untermenü sinnlos');
  const start = (await oeffentlich('/')).text;
  assert.ok(start.includes('class="nav__gruppentitel"') && start.includes('class="nav__unter"'), 'Untermenü im Kopf');
  const kopf = start.slice(start.indexOf('<header'), start.indexOf('</header>'));
  assert.ok(!kopf.includes('href="/kontakt">Nur Fuß'), 'Fuß-Punkte stehen nicht im Kopf');
  assert.ok(start.slice(start.indexOf('<footer')).includes('>Nur Fuß<'));
  assert.ok(!start.includes('Extern'), 'unsichtbare Punkte fehlen');
  await seedeInhalte({ force: true });   // Ausgangsmenü wiederherstellen
});

test('Umleitungen: anlegen, Ketten werden zusammengezogen, Schleifen und Verdecken abgelehnt', async () => {
  assert.equal((await api('POST', '/api/redirects', { von: '/alt-a', nach: '/alt-b' })).status, 201);
  assert.equal((await api('POST', '/api/redirects', { von: '/alt-b', nach: '/kontakt' })).status, 201);
  const liste = (await api('GET', '/api/redirects')).json.umleitungen;
  assert.equal(liste.find((u) => u.from_path === '/alt-a').to_path, '/kontakt', 'alt-a zeigt direkt auf kontakt, keine Kette');
  assert.equal((await oeffentlich('/alt-a')).headers.get('location'), '/kontakt');
  assert.equal((await api('POST', '/api/redirects', { von: '/kontakt', nach: '/alt-a' })).status, 409, 'unter /kontakt liegt eine Seite');
  assert.equal((await api('POST', '/api/redirects', { von: '/x', nach: '/x' })).status, 400);
  assert.equal((await api('POST', '/api/redirects', { von: '/x', nach: 'javascript:1' })).status, 400);
  assert.equal((await api('POST', '/api/redirects', { von: '/cockpit', nach: '/kontakt' })).status, 400);
  assert.equal((await api('POST', '/api/redirects', { von: '/', nach: '/kontakt' })).status, 400);
  assert.equal((await api('POST', '/api/redirects', { von: '/alt-c', nach: 'https://example.org/neu' })).status, 201);
  assert.equal((await oeffentlich('/alt-c')).headers.get('location'), 'https://example.org/neu');
  await api('DELETE', '/api/redirects', { von: '/alt-a' });
  assert.equal((await oeffentlich('/alt-a')).status, 404);
});

test('Formular: ohne Datenschutzangaben nimmt es nichts an, mit ihnen speichert es zuerst', async () => {
  const anfrage = { name: 'Anna Beispiel', email: 'anna@example.at', nachricht: 'Ich hätte gern ein Coaching.', interesse: 'coaching' };
  const post = (body, kopf = {}) => api('POST', '/form/anfrage', body, { angemeldet: false, headers: { Accept: 'application/json', ...kopf } });

  let f = (await api('GET', '/api/facts')).json;
  const zu = structuredClone(f.aktuell); zu.kontaktformular.speicherdauer = '';
  await api('PUT', '/api/facts', { fakten: zu });
  assert.equal((await post(anfrage)).status, 503);
  assert.ok((await oeffentlich('/kontakt')).text.includes('Das Anfrageformular ist gerade nicht verfügbar'), 'die Seite zeigt dann den direkten Weg');
  assert.equal((await api('GET', '/api/submissions')).json.anfragen.length, 0);

  await api('PUT', '/api/facts', { fakten: f.aktuell });   // Speicherdauer wieder gesetzt
  assert.ok((await oeffentlich('/kontakt')).text.includes('class="formular__form"'));

  assert.equal((await post({ ...anfrage, website: 'http://spam.example' })).status, 200);
  assert.equal((await api('GET', '/api/submissions')).json.anfragen.length, 0, 'Honigtopf: Bot bekommt "ok", gespeichert wird nichts');

  assert.equal((await post({ name: 'A', email: 'kaputt', nachricht: '' })).status, 400);

  const ok = await post(anfrage, { Referer: `${basis}/kontakt` });
  assert.equal(ok.status, 200, ok.text);
  const liste = (await api('GET', '/api/submissions')).json.anfragen;
  assert.equal(liste.length, 1, 'gespeichert, obwohl kein Mailversand eingerichtet ist (die Mail darf scheitern)');
  assert.equal(liste[0].daten.name, 'Anna Beispiel');
  assert.equal(liste[0].seite, 'kontakt');
  assert.equal(liste[0].gelesen, false);
  assert.equal((await api('GET', '/api/stats')).json.ungelesen, 1);

  await api('PUT', `/api/submissions/${liste[0].id}`, { gelesen: true });
  assert.equal((await api('GET', '/api/stats')).json.ungelesen, 0);

  // Ohne JavaScript: normales Formular, Antwort ist eine Weiterleitung auf die Danke-Seite
  const html = await api('POST', '/form/anfrage', 'name=Bernd+Beispiel&email=bernd%40example.at&nachricht=Hallo+zusammen', { angemeldet: false, headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' } });
  assert.equal(html.status, 303);
  assert.equal(html.headers.get('location'), '/danke');
  assert.equal((await oeffentlich('/danke')).status, 200);
  assert.ok((await oeffentlich('/danke')).text.includes('noindex'));

  await api('DELETE', `/api/submissions/${liste[0].id}`);
  assert.equal((await queryOne('SELECT COUNT(*) AS n FROM submissions WHERE id = $1', [liste[0].id])).n, 0);
});

test('Medien: Alt-Text ist Pflicht, nur echte Bilder, Duplikate, Verwendung schützt vor dem Löschen', async () => {
  const png = await sharp({ create: { width: 900, height: 600, channels: 3, background: '#B5451B' } }).png().toBuffer();
  const kopf = (alt) => ({ 'Content-Type': 'image/png', 'X-Dateiname': encodeURIComponent('Rotes Bild.png'), 'X-Alt': encodeURIComponent(alt) });

  assert.equal((await api('POST', '/api/media', png, { headers: kopf('') })).status, 400, 'ohne Alt-Text');
  assert.equal((await api('POST', '/api/media', Buffer.from('kein bild'), { headers: kopf('Etwas Beschreibung') })).status, 400);
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert.equal((await api('POST', '/api/media', svg, { headers: { ...kopf('Eine Grafik'), 'Content-Type': 'image/svg+xml' } })).status, 400, 'SVG kann Skript enthalten');

  const r = await api('POST', '/api/media', png, { headers: kopf('Ein rotes Rechteck') });
  assert.equal(r.status, 201);
  const m = r.json.medium;
  assert.match(m.file_path, /^\/uploads\/[0-9a-f]{8}-rotes-bild$/);
  for (const w of [480, 800, 1200]) assert.equal((await oeffentlich(`${m.file_path}-${w}.webp`)).status, 200);

  const nochmal = await api('POST', '/api/media', png, { headers: kopf('Ein rotes Rechteck, neu beschrieben') });
  assert.equal(nochmal.json.medium.id, m.id, 'gleicher Inhalt, gleiches Bild');
  assert.equal((await api('GET', '/api/media')).json.medien.filter((x) => x.file_path === m.file_path).length, 1);
  assert.equal((await api('PUT', `/api/media/${m.id}`, { alt: 'x' })).status, 400);

  // Einsetzen: Bausteinfeld und Vorschaubild
  const s = (await api('POST', '/api/pages', { page_type: 'angebot', title: 'Bildtest' })).json.seite;
  const inhalt = structuredClone(s.content);
  inhalt.blocks[1].data.bild = m.file_path;
  await api('PUT', `/api/pages/${s.id}`, { content: inhalt, og_image: m.file_path, description: 'Beschreibung' });
  assert.equal((await api('DELETE', `/api/media/${m.id}`)).status, 409, 'wird benutzt');
  assert.equal((await api('GET', `/api/media/${m.id}/verwendung`)).json.seiten[0].slug, 'bildtest');
  // Alt-Text aus der Medienverwaltung erscheint, wenn der Baustein keinen eigenen hat
  await api('PUT', `/api/pages/${s.id}`, { title: 'Bildtest' });
  const vorschau = (await api('POST', '/api/preview', { page_type: 'angebot', title: 'Bildtest', content: inhalt })).json.html;
  assert.ok(vorschau.includes('alt="Ein rotes Rechteck, neu beschrieben"'));
  await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'veroeffentlichen' });
  const live = (await oeffentlich('/bildtest')).text;
  assert.ok(live.includes(`property="og:image" content="https://ki-trainerin-pieber.org${m.file_path}-1200.webp"`));
  assert.ok(live.includes('summary_large_image'));

  await api('POST', `/api/pages/${s.id}/aktion`, { aktion: 'zurueckziehen' });
  await api('DELETE', `/api/pages/${s.id}`, {});
  assert.equal((await api('DELETE', `/api/media/${m.id}`)).status, 200);
  assert.equal((await oeffentlich(`${m.file_path}-800.webp`)).status, 404, 'die Dateien sind weg');
});

test('Vorschau: rendert den ungespeicherten Stand, immer noindex, nennt fehlende Fakten', async () => {
  const s = await seite('start');
  const voll = (await api('GET', `/api/pages/${s.id}`)).json.seite;
  voll.content.blocks[1].data.titel = 'Neuer Titel nur in der Vorschau {{facts.gibts.nicht}}';
  const r = await api('POST', '/api/preview', { page_type: 'home', title: 'Start', description: 'x', content: voll.content });
  assert.equal(r.status, 200);
  assert.ok(r.json.html.includes('Neuer Titel nur in der Vorschau […]'));
  assert.ok(r.json.html.includes('noindex'));
  assert.deepEqual(r.json.fehlend, ['gibts.nicht']);
  assert.ok(!(await oeffentlich('/')).text.includes('Neuer Titel nur'), 'öffentlich unverändert');
});

test('Das Cockpit: HTML nie gecacht, Dateien mit Version, Sitemap und robots schließen es aus', async () => {
  const r = await api('GET', '/cockpit', undefined, { angemeldet: false, roh: true });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('cache-control'), /no-store/);
  assert.match(r.headers.get('x-robots-tag'), /noindex/);
  assert.match(r.text, /app\.js\?v=\d+\.\d+\.\d+\.[a-z0-9]+/, 'Skript trägt die Version');
  assert.ok(!r.text.includes('__VERSION__'));
});
