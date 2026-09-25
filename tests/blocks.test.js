import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/renderer.js';

const site = { name: 'Karin Pieber', locale: 'de', titleSuffix: ' | Karin Pieber', domain: 'https://example.at' };
const facts = {
  name: 'Mag. Karin Pieber', person: { vorname: 'Karin', nachname: 'Pieber', titel_vor: 'Mag.' }, marke: 'KI Trainerin Pieber',
  titel: 'TÜV-zertifizierte KI-Trainerin', email: 'a@example.at', telefon: '+43 1', web: 'https://example.at',
  linkedin: 'https://example.at/in', orte: 'Graz', sprachen: 'Deutsch', abgeleitet: { telefon_link: '+431' },
};
const rendere = (bloecke, dynamicData = {}) => renderPage(
  { slug: 'x', status: 'published', title: 'T', content_json: { blocks: bloecke } }, { facts, site, dynamicData });

test('Bild im Hero: srcset, Alt-Text, kein fremdes Bild', () => {
  const ok = rendere([{ type: 'hero', data: { titel: 'x', bild: '/uploads/ab12cd34-portrait', bildAlt: 'Porträt' } }]);
  assert.ok(ok.includes('class="hero hero--bild"') && ok.includes('alt="Porträt"') && ok.includes('-1200.webp 1200w'));
  const fremd = rendere([{ type: 'hero', data: { titel: 'x', bild: 'https://evil.com/a.png', bildAlt: 'x' } }]);
  assert.ok(!fremd.includes('evil.com') && !fremd.includes('class="hero hero--bild"'));
});

test('Auswahlfelder: unbekannte Werte fallen auf die Vorgabe zurück', () => {
  const out = rendere([{ type: 'richtext', data: { titel: 'T', text: 'x', flaeche: 'url(javascript:1)', layout: '"><b>', ebene: '9' } }]);
  assert.ok(out.includes('rt--geteilt band-grund'));
  assert.ok(!out.includes('javascript:1') && !out.includes('<b>'));
  assert.ok(out.includes('<h2>T</h2>'));
});

test('Navigation: Menü aus den Daten, Knopf oben und im Menü, ohne ctaLabel kein Knopf', () => {
  const baum = [{ label: 'Coaching', href: '/coaching' }, { label: 'Kaputt', href: 'javascript:alert(1)' }];
  const mit = rendere([{ type: 'nav', data: {} }], { nav: { baum } });
  assert.ok(mit.includes('href="/coaching">Coaching') && mit.includes('aria-controls="nav-menue"'));
  assert.equal((mit.match(/Erstgespräch anfragen/g) || []).length, 2);
  assert.ok(!mit.includes('javascript:'));
  assert.ok(mit.includes('classList.add("js")'));
  const ohne = rendere([{ type: 'nav', data: { ctaLabel: '' } }], { nav: { baum: [] } });
  assert.ok(!ohne.includes('Erstgespräch') && !ohne.includes('class="nav__toggle"'));
});

test('Karten: Knopf oder Link, nur mit gültigem Ziel', () => {
  const out = rendere([{ type: 'cards', data: { items: [
    { titel: 'A', text: 'x', linkLabel: 'Los', href: '/kontakt', stil: 'knopf' },
    { titel: 'B', text: 'x', linkLabel: 'Mehr', href: '/mehr' },
    { titel: 'C', text: 'x', linkLabel: 'Böse', href: 'javascript:alert(1)' },
  ] } }]);
  assert.ok(out.includes('class="btn btn--zweit" href="/kontakt"'));
  assert.ok(out.includes('class="link" href="/mehr"'));
  assert.ok(!out.includes('javascript:') && !out.includes('>Böse<'));
});

test('FAQ: aufklappbar ohne JavaScript', () => {
  const out = rendere([{ type: 'faq', data: { items: [{ frage: 'Wie?', antwort: 'So.\n\nUnd so.' }] } }]);
  assert.ok(out.includes('<details class="faq__punkt"><summary>Wie?</summary>'));
  assert.ok(out.includes('<p>So.</p><p>Und so.</p>'));
});

test('Kontaktkarte: QR-Code aus den Fakten, Kontakt-speichern-Link, Kontaktdaten', () => {
  const out = rendere([{ type: 'kontaktkarte', data: {} }]);
  assert.ok(out.includes('class="kk__qrcode"') && out.includes('<path d="M'));
  assert.ok(out.includes('href="/Karin-Pieber.vcf"'));
  assert.ok(out.includes('href="mailto:a@example.at"') && out.includes('href="tel:+431"'));
  assert.ok(out.includes('<h2>Mag. Karin Pieber</h2>'));
});

test('Schritte: nummerierte Liste', () => {
  const out = rendere([{ type: 'schritte', data: { titel: 'Ablauf', items: [{ titel: 'Eins', text: 'a' }, { titel: 'Zwei' }] } }]);
  assert.ok(out.includes('<ol class="schritte__liste">') && (out.match(/class="schritt"/g) || []).length === 2);
});
