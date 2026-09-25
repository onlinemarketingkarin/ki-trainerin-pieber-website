import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateContent } from '../src/archetypes.js';
import { renderPage } from '../src/renderer.js';
import { navigationDaten } from '../src/navigation.js';
import { blocks } from '../src/blocks/index.js';
import { ROOT } from '../src/paths.js';

const lies = (pfad) => JSON.parse(readFileSync(join(ROOT, pfad), 'utf8'));
const seiten = readdirSync(join(ROOT, 'content/pages')).filter((f) => f.endsWith('.json')).map((f) => lies(`content/pages/${f}`));
const navigation = lies('content/navigation.json');
const slugs = new Set(seiten.map((s) => s.slug));
const zeilen = navigation.map((n, i) => ({ id: String(i), parent_id: null, sort: i, bereich: 'beide', ...n }));

/** Alle Ziele in einem Inhalt einsammeln (href, ctaHref, links[].href, items[].href). */
function ziele(wert, gefunden = []) {
  if (Array.isArray(wert)) wert.forEach((w) => ziele(w, gefunden));
  else if (wert && typeof wert === 'object') {
    for (const [k, v] of Object.entries(wert)) {
      if ((k === 'href' || k === 'ctaHref') && typeof v === 'string' && v) gefunden.push(v);
      else ziele(v, gefunden);
    }
  }
  return gefunden;
}
const pfadVon = (href) => href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
const bekannt = (href) => {
  if (!href.startsWith('/')) return true;
  const p = pfadVon(href);
  return p === '/' || p === '/Karin-Pieber.vcf' || slugs.has(p.slice(1));
};

test('Jede Seite in content/ erfüllt den Vertrag ihres Seitentyps', () => {
  assert.ok(seiten.length >= 9);
  for (const s of seiten) {
    const r = validateContent(s.page_type, { blocks: s.blocks });
    assert.ok(r.ok, `${s.slug}: ${r.fehler.join(' · ')}`);
    for (const b of s.blocks) assert.ok(blocks[b.type], `${s.slug}: unbekannter Baustein ${b.type}`);
  }
});

test('Kein toter interner Link: Seiten und Navigation zeigen nur auf Vorhandenes', () => {
  for (const s of seiten) for (const h of ziele(s.blocks)) assert.ok(bekannt(h), `${s.slug} → ${h}`);
  for (const n of navigation) assert.ok(bekannt(n.href), `Navigation → ${n.href}`);
});

test('Jede Seite gerendert: genau ein h1, ein main, jedes Bild mit Alt-Text, keine Platzhalter übrig', () => {
  const warn = mock.method(console, 'warn', () => {});
  for (const s of seiten) {
    const out = renderPage({ ...s, status: 'published', content_json: { blocks: s.blocks } }, { dynamicData: navigationDaten(zeilen) });
    assert.equal((out.match(/<h1[\s>]/g) || []).length, 1, `${s.slug}: h1`);
    assert.equal((out.match(/<main[\s>]/g) || []).length, 1, `${s.slug}: main`);
    assert.ok(!out.includes('{{facts'), `${s.slug}: Platzhalter übrig`);
    for (const img of out.match(/<img [^>]*>/g) || []) assert.match(img, /alt="[^"]+"/, `${s.slug}: Bild ohne Alt-Text`);
    // Abnahme: kein sichtbares […] auf öffentlichen Seiten. Impressum und Datenschutz sind bis zur Prüfung ausgenommen.
    if (s.page_type !== 'rechtliches') assert.ok(!out.includes('[…]'), `${s.slug}: […] sichtbar`);
    assert.ok(!/<script>(?![^<]*(classList\.add\("js"\)|querySelector\('\.nav__toggle'\)))/.test(out), `${s.slug}: unerwartetes Skript`);
  }
  warn.mock.restore();
});

test('Genau eine dominante Handlung: alle Knöpfe führen zur Anfrage', () => {
  for (const s of seiten.filter((x) => ['home', 'angebot'].includes(x.page_type))) {
    const knoepfe = s.blocks.flatMap((b) => [b.data?.ctaHref, ...(b.data?.items || []).filter((i) => i.stil === 'knopf').map((i) => i.href)]).filter(Boolean);
    for (const k of knoepfe) {
      const ok = pfadVon(k) === '/kontakt' || ['/ki-trainings-teams', '/ueber-mich'].includes(pfadVon(k));
      assert.ok(ok, `${s.slug}: Knopf → ${k}`);
    }
  }
});
