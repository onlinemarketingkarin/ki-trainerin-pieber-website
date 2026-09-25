import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage, stempleFakten } from '../src/renderer.js';

const site = { name: 'Karin Pieber', locale: 'de', titleSuffix: ' | Karin Pieber', domain: 'https://example.at' };
const facts = {
  name: 'Mag. Karin Pieber', marke: 'KI Trainerin Pieber', titel: 'T', email: 'a&b@example.at',
  telefon: '+43 1', linkedin: 'https://example.at/in', orte: 'Graz', sprachen: 'Deutsch',
  abgeleitet: { telefon_link: '+431' }, recht: { uid: '' },
};
const seite = (blocks, extra = {}) => ({
  slug: 'start', page_type: 'home', status: 'published', title: 'Titel', description: 'Beschreibung',
  content_json: { blocks }, ...extra,
});
const rendere = (blocks, extra) => renderPage(seite(blocks, extra), { facts, site });

test('Modelltext wird escaped, nichts wird ausgeführt', () => {
  const out = rendere([{ type: 'hero', data: { titel: '<script>alert(1)</script>' } }]);
  assert.ok(!out.includes('<script>alert(1)'));
  assert.ok(out.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('Titel und Beschreibung werden escaped', () => {
  const out = rendere([], { title: '"><script>x</script>', description: '"><script>y</script>' });
  assert.ok(!out.includes('<script>x'));
  assert.ok(!out.includes('<script>y'));
});

test('Titel-Zusatz nur, wenn der Name noch nicht drinsteht', () => {
  assert.ok(rendere([], { title: 'Kontakt' }).includes('<title>Kontakt | Karin Pieber</title>'));
  assert.ok(rendere([], { title: 'Über Karin Pieber' }).includes('<title>Über Karin Pieber</title>'));
});

test('Entwürfe tragen noindex, Veröffentlichtes hat canonical', () => {
  assert.ok(rendere([], { status: 'draft' }).includes('name="robots" content="noindex"'));
  const live = rendere([], { slug: 'kontakt' });
  assert.ok(!live.includes('noindex'));
  assert.ok(live.includes('<link rel="canonical" href="https://example.at/kontakt">'));
});

test('Unbekannter Baustein: laute Warnung, Seite rendert trotzdem', () => {
  const warn = mock.method(console, 'warn', () => {});
  const out = rendere([{ type: 'gibt-es-nicht', data: {} }]);
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /Unbekannter Baustein: gibt-es-nicht/);
  assert.ok(out.startsWith('<!doctype html>'));
  warn.mock.restore();
});

test('Fakten-Tor: Wert wird escaped, fehlender Wert wird sichtbar […]', () => {
  const warn = mock.method(console, 'warn', () => {});
  assert.equal(stempleFakten('{{facts.email}}', facts), 'a&amp;b@example.at');
  assert.equal(stempleFakten('UID {{facts.recht.uid}}', facts), 'UID […]');
  assert.equal(stempleFakten('{{facts.gibt.es.nicht}}', facts), '[…]');
  assert.equal(stempleFakten('{{facts.constructor}}', facts), '[…]');
  warn.mock.restore();
});

test('Fakten in Links: mailto wird aufgelöst, javascript: fliegt raus', () => {
  const ok = rendere([{ type: 'hero', data: { titel: 'x', ctaLabel: 'Mail', ctaHref: 'mailto:{{facts.email}}' } }]);
  assert.ok(ok.includes('href="mailto:a&amp;b@example.at"'));
  const boese = rendere([{ type: 'hero', data: { titel: 'x', ctaLabel: 'Klick', ctaHref: 'javascript:alert(1)' } }]);
  assert.ok(!boese.includes('javascript:'));
});

test('nav und footer rahmen <main> ein', () => {
  const out = rendere([{ type: 'nav', data: {} }, { type: 'hero', data: { titel: 'x' } }, { type: 'footer', data: {} }]);
  const [kopf, main, fuss] = [out.indexOf('<header'), out.indexOf('<main'), out.indexOf('<footer')];
  assert.ok(kopf < main && main < fuss);
  assert.ok(out.indexOf('</main>') < fuss);
});
