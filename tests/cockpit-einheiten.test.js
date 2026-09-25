import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.ADMIN_PASSWORD = 'ein-langes-testpasswort';
process.env.SQLITE_FILE = ':memory:';
delete process.env.DATABASE_URL;

const auth = await import('../src/auth.js');
const { tiefMischen, unterschied, passeAn } = await import('../src/facts.js');
const { bereinigeInhalt } = await import('../src/content.js');
const { normalisierePfad } = await import('../src/redirects.js');
const { slugFehler, slugAus, AKTIONEN } = await import('../src/pages.js');
const { pruefeAnfrage, zuVieleAnfragen } = await import('../src/routes/form.js');
const { baueMail, benachrichtige } = await import('../src/mail.js');

test('Anmeldung: Token stimmt, läuft ab, lässt sich nicht fälschen', () => {
  const jetzt = 1_000_000;
  const token = auth.erstelleToken(jetzt);
  assert.ok(auth.tokenGueltig(token, jetzt + 1000));
  assert.ok(!auth.tokenGueltig(token, jetzt + 13 * 3600 * 1000), 'nach zwölf Stunden ungültig');
  const [bis, sig] = token.split('.');
  assert.ok(!auth.tokenGueltig(`${Number(bis) + 99999999}.${sig}`, jetzt), 'verlängerte Laufzeit fällt auf');
  assert.ok(!auth.tokenGueltig(`${bis}.${sig.slice(0, -2)}xx`, jetzt));
  for (const kaputt of ['', 'abc', '1.2.3', null, undefined, 42]) assert.ok(!auth.tokenGueltig(kaputt, jetzt));
});

test('Anmeldung: Passwortwechsel meldet alte Sitzungen ab, ohne Passwort ist das Cockpit zu', () => {
  const token = auth.erstelleToken();
  assert.ok(auth.passwortStimmt('ein-langes-testpasswort') && !auth.passwortStimmt('falsch') && !auth.passwortStimmt(''));
  process.env.ADMIN_PASSWORD = 'ein-ganz-anderes-passwort';
  assert.ok(!auth.tokenGueltig(token));
  process.env.ADMIN_PASSWORD = 'kurz';
  assert.ok(!auth.anmeldungMoeglich() && !auth.passwortStimmt('kurz'));
  process.env.ADMIN_PASSWORD = '';
  assert.ok(!auth.anmeldungMoeglich());
  process.env.ADMIN_PASSWORD = 'ein-langes-testpasswort';
});

test('Anmeldung: nach acht Fehlversuchen ist Pause, ein Erfolg setzt zurück', () => {
  const ip = '203.0.113.7';
  for (let i = 0; i < 7; i++) auth.merkeFehlversuch(ip, 1000);
  assert.ok(!auth.gesperrt(ip, 2000));
  auth.merkeFehlversuch(ip, 2000);
  assert.ok(auth.gesperrt(ip, 3000));
  assert.ok(!auth.gesperrt(ip, 1000 + 16 * 60 * 1000), 'nach fünfzehn Minuten wieder frei');
  auth.vergesseVersuche(ip);
  assert.ok(!auth.gesperrt(ip, 3000));
});

test('Fakten: tief mischen, Unterschied, Zurechtstutzen auf die Struktur', () => {
  const datei = { a: { x: 'eins', y: 2, z: '' }, b: 'text' };
  assert.deepEqual(tiefMischen(datei, { a: { x: 'neu' } }), { a: { x: 'neu', y: 2, z: '' }, b: 'text' });
  // Die Falle: ein neues Feld in der Datei darf nicht von einem alten Override verschluckt werden
  assert.deepEqual(tiefMischen({ a: { x: 1, neu: 'da' } }, { a: { x: 5 } }), { a: { x: 5, neu: 'da' } });
  assert.deepEqual(unterschied(datei, { a: { x: 'eins', y: 3, z: '' }, b: 'text' }), { a: { y: 3 } });
  assert.deepEqual(unterschied(datei, datei), {});
  const sauber = passeAn(datei, { a: { x: 'ok', y: '7', z: null, boese: 'x' }, b: 5, extra: 1 });
  assert.deepEqual(sauber, { a: { x: 'ok', y: 7, z: '' }, b: '5' });
  assert.equal(passeAn({ n: 5 }, { n: 'abc' }).n, 5, 'Zahl bleibt Zahl, Unsinn fällt auf den Grundwert zurück');
});

test('Inhalt säubern: nur bekannte Bausteine und Felder, Typen erzwungen', () => {
  const { inhalt, fehler } = bereinigeInhalt({ blocks: [
    { type: 'hero', data: { titel: 42, sub: 'x'.repeat(30000), boese: '<script>', bild: 'https://evil.com/x.png', links: [{ label: 'A', href: '/a', extra: 1 }, 'kein Objekt'] } },
    { type: 'richtext', data: { flaeche: 'url(javascript:1)', ebene: '2' } },
    { type: 'gibt-es-nicht', data: {} },
  ] });
  assert.equal(fehler.length, 1);
  const [hero, rt] = inhalt.blocks;
  assert.equal(hero.data.titel, '42');
  assert.equal(hero.data.sub.length, 20000);
  assert.ok(!('boese' in hero.data));
  assert.equal(hero.data.bild, '', 'nur /uploads/… ist als Bild erlaubt');
  assert.deepEqual(hero.data.links[0], { label: 'A', href: '/a' });
  assert.equal(rt.data.flaeche, 'grund');
  assert.equal(inhalt.blocks.length, 2);
});

test('Umleitungen: Pfade werden vereinheitlicht', () => {
  assert.equal(normalisierePfad('/Alt/'), '/Alt');
  assert.equal(normalisierePfad('/alt?x=1#y'), '/alt');
  assert.equal(normalisierePfad('//a//b/'), '/a/b');
  assert.equal(normalisierePfad('/'), '/');
  assert.equal(normalisierePfad('https://x.at'), '');
  assert.equal(normalisierePfad(''), '');
});

test('Adressen und Statuskette', () => {
  assert.equal(slugFehler('mein-angebot'), null);
  for (const schlecht of ['', 'Gross', 'mit leerzeichen', '-vorne', 'hinten-', 'doppel--strich', 'cockpit', 'api', 'start', 'a'.repeat(81), 'ä']) assert.ok(slugFehler(schlecht), schlecht);
  assert.equal(slugAus('Größe & Übung: Neu!'), 'groesse-uebung-neu');
  assert.deepEqual(AKTIONEN.veroeffentlichen.von.includes('published'), false);
  assert.deepEqual(AKTIONEN.zurueckziehen.von, ['published']);
  assert.ok(AKTIONEN.archivieren.von.every((s) => s !== 'published'), 'Veröffentlichtes wird erst zurückgezogen, dann archiviert');
});

test('Anfrage prüfen: nur bekannte Felder, Pflichtfelder, Länge', () => {
  const ok = pruefeAnfrage({ name: 'Anna Beispiel', email: 'a@b.at', nachricht: 'Hallo, ich hätte Interesse.', interesse: 'team', extra: 'x', seite: 'kontakt' });
  assert.deepEqual(ok.fehler, []);
  assert.ok(!('extra' in ok.daten));
  assert.equal(ok.daten.interesse, 'team');
  assert.equal(pruefeAnfrage({ name: 'A', email: 'kaputt', nachricht: 'x' }).fehler.length, 3);
  assert.equal(pruefeAnfrage({ name: 'Anna', email: 'a@b.at', nachricht: 'Hallo du', interesse: 'unbekannt' }).daten.interesse, '');
  assert.equal(pruefeAnfrage({ name: 'Anna', email: 'a@b.at', nachricht: 'y'.repeat(9000) }).daten.nachricht.length, 4000);
  assert.equal(pruefeAnfrage({ name: 'Anna', email: 'a@b.at', nachricht: 'Hallo du' }, 'http://localhost:3100/kontakt?x=1').daten.seite, 'kontakt');
});

test('Anfrage: fünf pro Stunde und Adresse', () => {
  const ip = '198.51.100.9';
  for (let i = 0; i < 5; i++) assert.ok(!zuVieleAnfragen(ip, 1000 + i));
  assert.ok(zuVieleAnfragen(ip, 2000));
  assert.ok(!zuVieleAnfragen(ip, 1000 + 61 * 60 * 1000));
});

test('Mail: Inhalt stimmt, ohne SMTP kommt ein Fehler, mit Transport wird gesendet', async () => {
  const facts = { email: 'karin@example.at' };
  const daten = { name: 'Anna', email: 'anna@example.at', organisation: '', interesse: 'coaching', nachricht: 'Hallo', seite: 'kontakt' };
  const mail = baueMail(daten, facts, {});
  assert.equal(mail.to, 'karin@example.at');
  assert.equal(mail.replyTo, 'anna@example.at');
  assert.equal(mail.subject, 'Neue Anfrage: 1:1-Coaching');
  assert.ok(mail.text.includes('Hallo') && mail.text.includes('Organisation: -'));
  await assert.rejects(benachrichtige(daten, facts, { env: {} }), /SMTP_URL/);
  const gesendet = [];
  await benachrichtige(daten, facts, { transport: { sendMail: async (m) => gesendet.push(m) } });
  assert.equal(gesendet.length, 1);
  await assert.rejects(benachrichtige(daten, facts, { transport: { sendMail: async () => { throw new Error('Server weg'); } } }), /Server weg/);
});
