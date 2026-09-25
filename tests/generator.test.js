import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SQLITE_FILE = ':memory:';
delete process.env.DATABASE_URL;
delete process.env.ANTHROPIC_API_KEY;

const { runMigrations } = await import('../src/db.js');
const { seedeInhalte } = await import('../src/seed.js');
const { generiere, baueSystemPrompt, baueBenutzerPrompt } = await import('../src/generator.js');
const { getType } = await import('../src/archetypes.js');
// src/db.js lädt dotenv/config und würde einen echten Schlüssel aus .env sonst wieder einspielen.
delete process.env.ANTHROPIC_API_KEY;

await runMigrations();
await seedeInhalte({});   // damit "eine echte veröffentlichte Seite als Vorbild" für holeBeispiel() etwas findet

const gueltig = { blocks: [
  { type: 'nav', data: {} },
  { type: 'hero', data: { titel: 'Ein neuer Titel', sub: 'Ein Untertitel.' } },
  { type: 'cta', data: { titel: 'Jetzt anfragen', ctaLabel: 'Los', ctaHref: '/kontakt' } },
  { type: 'footer', data: {} },
] };

test('System-Prompt: enthält Schema, Pflichtbausteine, Fakten-Regel und die Stimme', () => {
  const typ = getType('angebot');
  const p = baueSystemPrompt(typ);
  assert.match(p, /AUSSCHLIESSLICH ein JSON-Objekt/);
  assert.match(p, /hero \[Pflicht\]/);
  assert.match(p, /\{\{facts\.<pfad>\}\}/);
  assert.match(p, /\{\{facts\.titel\}\}/);
  assert.match(p, /interesse=<schluessel>/);
  assert.match(p, /coaching, team, bildung, gesundheit, vortrag/);
  assert.match(p, /Sie-Ansprache/);
  assert.match(p, /eintauchen, entdecken, enthüllen, umarmen/);
  assert.ok(!p.includes('kontaktkarte'), 'ein Baustein, der für "angebot" nicht erlaubt ist, steht nicht im Prompt');
});

test('Benutzer-Prompt: enthält die Quelle und, wenn vorhanden, ein Beispiel', () => {
  const ohne = baueBenutzerPrompt({ quelle: 'Stichworte hier', beispiel: null });
  assert.match(ohne, /Stichworte hier/);
  assert.ok(!ohne.includes('Vorbild'));
  const mit = baueBenutzerPrompt({ quelle: 'x', beispiel: { blocks: [] } });
  assert.match(mit, /Vorbild für Stil und Struktur/);
});

test('generiere(): gültige Modell-Antwort wird geparst und gegen den Vertrag geprüft', async () => {
  let empfangen;
  const aufrufen = async ({ system, prompt }) => { empfangen = { system, prompt }; return JSON.stringify(gueltig); };
  const inhalt = await generiere({ typ: 'angebot', quelle: 'Ein Training für Teams, halber Tag.', aufrufen });
  assert.deepEqual(inhalt, gueltig);
  assert.match(empfangen.system, /angebot/);
  assert.match(empfangen.prompt, /Ein Training für Teams/);
});

test('generiere(): Markdown-Zäune und Text drumherum werden gehärtet', async () => {
  const aufrufen = async () => '```json\n' + JSON.stringify(gueltig) + '\n```';
  assert.deepEqual(await generiere({ typ: 'angebot', quelle: 'x', aufrufen }), gueltig);
});

test('generiere(): Inhalt, der den Vertrag verletzt, wird abgelehnt (nicht gespeichert)', async () => {
  const ohnePflicht = { blocks: [{ type: 'nav', data: {} }, { type: 'footer', data: {} }] };   // hero fehlt
  await assert.rejects(
    generiere({ typ: 'angebot', quelle: 'x', aufrufen: async () => JSON.stringify(ohnePflicht) }),
    (err) => { assert.equal(err.status, 422); assert.match(err.details.join(' '), /Pflicht-Baustein fehlt: hero/); return true; });

  const unbekannterBaustein = { blocks: [{ type: 'nav', data: {} }, { type: 'formular', data: {} }, { type: 'footer', data: {} }] };
  await assert.rejects(
    generiere({ typ: 'angebot', quelle: 'x', aufrufen: async () => JSON.stringify(unbekannterBaustein) }),
    (err) => { assert.equal(err.status, 422); return true; });
});

test('generiere(): unlesbares JSON ergibt einen sprechenden Fehler, kein Absturz', async () => {
  await assert.rejects(
    generiere({ typ: 'angebot', quelle: 'x', aufrufen: async () => 'Tut mir leid, das kann ich nicht.' }),
    (err) => { assert.equal(err.status, 502); assert.match(err.message, /ließ sich nicht lesen/); return true; });
});

test('generiere(): ein fehlgeschlagener Modell-Aufruf wird nicht verschluckt', async () => {
  await assert.rejects(
    generiere({ typ: 'angebot', quelle: 'x', aufrufen: async () => { throw new Error('Netzwerk weg'); } }),
    (err) => { assert.equal(err.status, 502); assert.match(err.message, /Netzwerk weg/); return true; });
});

test('generiere(): ohne Quelle oder mit unbekanntem Seitentyp kommt ein klarer Fehler, kein Modell-Aufruf', async () => {
  let aufgerufen = false;
  const aufrufen = async () => { aufgerufen = true; return '{}'; };
  await assert.rejects(generiere({ typ: 'angebot', quelle: '  ', aufrufen }), (err) => err.status === 400);
  await assert.rejects(generiere({ typ: 'gibt-es-nicht', quelle: 'x', aufrufen }), (err) => err.status === 400);
  assert.equal(aufgerufen, false);
});

test('generiere(): ohne ANTHROPIC_API_KEY und ohne eingespeisten Aufruf kommt ein klarer Fehler (kein stiller Absturz)', async () => {
  await assert.rejects(generiere({ typ: 'angebot', quelle: 'x' }), (err) => {
    assert.equal(err.status, 502);
    assert.match(err.message, /ANTHROPIC_API_KEY/);
    return true;
  });
});
