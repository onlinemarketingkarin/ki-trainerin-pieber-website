import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baueVcard, VCARD_PFAD } from '../src/vcard.js';
import { qrSvg } from '../src/qr.js';
import { loadFacts } from '../src/config.js';

test('vCard: Pflichtfelder, CRLF, eigene Marke statt BVAEB', () => {
  const v = baueVcard(loadFacts());
  assert.ok(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n') && v.endsWith('END:VCARD\r\n'));
  assert.ok(v.includes('N:Pieber;Karin;;Mag.;'));
  assert.ok(v.includes('FN:Mag. Karin Pieber'));
  assert.ok(v.includes('ORG:KI Trainerin Pieber'));
  assert.ok(v.includes('TEL;TYPE=CELL:+436643116754'));
  assert.ok(v.includes('EMAIL;TYPE=INTERNET:karin@ki-trainerin-pieber.org'));
  assert.ok(!/BVAEB|Koerting/i.test(baueVcard(loadFacts(), { voll: true })));
});

test('vCard: Sonderzeichen werden maskiert, die volle Fassung hat mehr Felder', () => {
  const f = { ...loadFacts(), name: 'A;B,C\nD' };
  assert.ok(baueVcard(f).includes(String.raw`FN:A\;B\,C\nD`));
  assert.ok(baueVcard(loadFacts(), { voll: true }).includes('linkedin.com/in/karin-pieber'));
  assert.ok(!baueVcard(loadFacts()).includes('linkedin'));
  assert.equal(VCARD_PFAD, '/Karin-Pieber.vcf');
});

test('QR-Code: deterministisch, mit Ruhezone, aus der Kurz-vCard erzeugbar', () => {
  const kurz = baueVcard(loadFacts());
  assert.ok(Buffer.byteLength(kurz) < 300, 'Kurz-vCard muss klein bleiben, sonst wird der QR zu dicht');
  const a = qrSvg(kurz, { beschreibung: 'QR' });
  assert.equal(a, qrSvg(kurz, { beschreibung: 'QR' }));
  const seite = Number(a.match(/viewBox="0 0 (\d+) /)[1]);
  assert.ok(seite >= 8 + 21 && seite <= 8 + 65, `Seitenlänge ${seite}`);
  assert.ok(a.includes('<path d="M'));
  assert.ok(a.includes('aria-label="QR"'));
});
