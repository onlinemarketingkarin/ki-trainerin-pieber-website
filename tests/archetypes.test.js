import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, getType } from '../src/archetypes.js';

test('Seitentypen werden aus page-types/ gelesen', () => {
  assert.ok(getType('home'));
  for (const t of ['home', 'angebot', 'ueber-mich', 'kontakt', 'rechtliches']) assert.ok(getType(t), t);
  assert.equal(getType('gibt-es-nicht'), null);
});

test('Der Vertrag: Pflichtbausteine, erlaubte Bausteine, Struktur', () => {
  assert.deepEqual(validateContent('home', { blocks: [{ type: 'nav' }, { type: 'hero' }, { type: 'cta' }, { type: 'footer' }] }), { ok: true, fehler: [] });
  assert.match(validateContent('home', { blocks: [{ type: 'hero' }] }).fehler.join(), /Pflicht-Baustein fehlt: nav/);
  assert.match(validateContent('kontakt', { blocks: [{ type: 'hero' }] }).fehler.join(), /nicht erlaubt für kontakt: hero/);
  assert.equal(validateContent('gibt-es-nicht', { blocks: [] }).ok, false);
  assert.equal(validateContent('home', { blocks: 'kein array' }).ok, false);
  assert.match(validateContent('home', { blocks: [{ data: {} }] }).fehler.join(), /Baustein ohne type/);
});
