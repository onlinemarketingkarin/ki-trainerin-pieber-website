import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.SQLITE_FILE = ':memory:';
process.env.ADMIN_PASSWORD = 'ein-langes-testpasswort';
delete process.env.DATABASE_URL;
delete process.env.ANTHROPIC_API_KEY;

const { runMigrations } = await import('../src/db.js');
const { erstelleApp } = await import('../src/app.js');
const { seedeInhalte } = await import('../src/seed.js');

await runMigrations();
await seedeInhalte({ force: true });
mock.method(console, 'warn', () => {});
mock.method(console, 'error', () => {});

const gueltig = { blocks: [
  { type: 'nav', data: {} },
  { type: 'hero', data: { titel: 'Aus Notizen entstanden', sub: 'Ein Untertitel.' } },
  { type: 'cta', data: { titel: 'Anfragen', ctaLabel: 'Los', ctaHref: '/kontakt' } },
  { type: 'footer', data: {} },
] };

let server;
let basis;
let cookie = '';
let letzterAufruf = null;
const generatorAufrufen = async ({ system, prompt }) => { letzterAufruf = { system, prompt }; return JSON.stringify(gueltig); };

before(async () => {
  server = erstelleApp({ generatorAufrufen }).listen(0);
  basis = `http://127.0.0.1:${server.address().port}`;
  const r = await fetch(`${basis}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passwort: 'ein-langes-testpasswort' }) });
  cookie = r.headers.get('set-cookie').split(';')[0];
});
after(() => server.close());

async function api(methode, pfad, body) {
  const h = { Cookie: cookie };
  if (methode !== 'GET') h['X-Cockpit'] = '1';
  let daten = body;
  if (body !== undefined) { h['Content-Type'] = 'application/json'; daten = JSON.stringify(body); }
  const r = await fetch(basis + pfad, { method: methode, headers: h, body: daten });
  return { status: r.status, json: await r.json().catch(() => null) };
}

test('Seite ohne Notizen: leer wie bisher, Status Entwurf, kein Modell-Aufruf', async () => {
  letzterAufruf = null;
  const r = await api('POST', '/api/pages', { page_type: 'angebot', title: 'Leere Seite' });
  assert.equal(r.status, 201);
  assert.equal(r.json.seite.status, 'draft');
  assert.equal(letzterAufruf, null);
});

test('Seite mit Notizen: der Generator läuft, Status "generated", Inhalt kommt vom Modell', async () => {
  const r = await api('POST', '/api/pages', { page_type: 'angebot', title: 'Generierte Seite', quelle: 'Ein Halbtags-Workshop für Teams, praxisnah.' });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  assert.equal(r.json.seite.status, 'generated');
  assert.deepEqual(r.json.seite.content, gueltig);
  assert.match(letzterAufruf.prompt, /Halbtags-Workshop/);
});

test('Seite mit Notizen: ein Modellfehler verhindert das Anlegen (keine kaputte Seite in der Datenbank)', async () => {
  const kaputtAufrufen = async () => 'Das kann ich nicht.';
  const app2 = (await import('../src/app.js')).erstelleApp({ generatorAufrufen: kaputtAufrufen });
  const s2 = app2.listen(0);
  try {
    const basis2 = `http://127.0.0.1:${s2.address().port}`;
    const login = await fetch(`${basis2}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passwort: 'ein-langes-testpasswort' }) });
    const c2 = login.headers.get('set-cookie').split(';')[0];
    const r = await fetch(`${basis2}/api/pages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Cockpit': '1', Cookie: c2 }, body: JSON.stringify({ page_type: 'angebot', title: 'Scheitert', quelle: 'x' }) });
    assert.equal(r.status, 502);
    const liste = await (await fetch(`${basis2}/api/pages`, { headers: { Cookie: c2 } })).json();
    assert.ok(!liste.seiten.some((p) => p.title === 'Scheitert'));
  } finally { s2.close(); }
});

test('Neu generieren: ein Entwurf lässt sich ohne Force neu generieren', async () => {
  const neu = await api('POST', '/api/pages', { page_type: 'angebot', title: 'Zum Neugenerieren' });
  const r = await api('POST', `/api/pages/${neu.json.seite.id}/generieren`, { quelle: 'Andere Notizen jetzt.' });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.seite.status, 'generated');
  assert.deepEqual(r.json.seite.content, gueltig);
});

test('Neu generieren: eine bearbeitete Seite wird ohne Force nicht überschrieben (P5)', async () => {
  const neu = await api('POST', '/api/pages', { page_type: 'angebot', title: 'Bearbeitet dann generieren' });
  const id = neu.json.seite.id;
  await api('PUT', `/api/pages/${id}`, { description: 'Von Hand ergänzt.' });   // macht die Seite "bearbeitet"
  const bearbeitet = await api('GET', `/api/pages/${id}`);
  assert.equal(bearbeitet.json.seite.status, 'edited');

  const ohneForce = await api('POST', `/api/pages/${id}/generieren`, { quelle: 'x' });
  assert.equal(ohneForce.status, 409);
  const nochImmer = await api('GET', `/api/pages/${id}`);
  assert.equal(nochImmer.json.seite.description, 'Von Hand ergänzt.', 'die Handarbeit ist noch da');

  const mitForce = await api('POST', `/api/pages/${id}/generieren`, { quelle: 'x', force: true });
  assert.equal(mitForce.status, 200);
  assert.equal(mitForce.json.seite.status, 'generated');
});

test('Neu generieren: eine veröffentlichte Seite ebenso geschützt, mit Force geht es trotzdem', async () => {
  const s = await api('GET', '/api/pages');
  const start = s.json.seiten.find((p) => p.slug === 'start');
  const ohneForce = await api('POST', `/api/pages/${start.id}/generieren`, { quelle: 'x' });
  assert.equal(ohneForce.status, 409);
  assert.match(ohneForce.json.fehler, /Veröffentlicht/);
  const nochImmer = await api('GET', `/api/pages/${start.id}`);
  assert.equal(nochImmer.json.seite.status, 'published', 'die Startseite ist unverändert veröffentlicht geblieben');
});

test('Generieren einer unbekannten Seite: 404', async () => {
  const r = await api('POST', '/api/pages/gibt-es-nicht/generieren', { quelle: 'x' });
  assert.equal(r.status, 404);
});
