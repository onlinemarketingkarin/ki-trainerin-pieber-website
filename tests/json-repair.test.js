import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseModellJson } from '../src/json-repair.js';

test('sauberes JSON', () => {
  assert.deepEqual(parseModellJson('{"blocks":[]}'), { blocks: [] });
});

test('Markdown-Codeblock-Zäune werden entfernt', () => {
  assert.deepEqual(parseModellJson('```json\n{"blocks":[]}\n```'), { blocks: [] });
  assert.deepEqual(parseModellJson('```\n{"blocks":[]}\n```'), { blocks: [] });
});

test('Text um das JSON herum wird herausgeschnitten', () => {
  assert.deepEqual(parseModellJson('Hier ist der Inhalt:\n{"blocks":[]}\nIch hoffe das passt!'), { blocks: [] });
});

test('fehlendes Komma wird repariert', () => {
  assert.deepEqual(parseModellJson('{"blocks":[{"type":"hero" "data":{}}]}'), { blocks: [{ type: 'hero', data: {} }] });
});

test('abgeschnittene Antwort wird geheilt (jsonrepair schließt Anführungszeichen und Klammern)', () => {
  const r = parseModellJson('{"blocks":[{"type":"hero", "data":{"titel":"Ha');
  assert.deepEqual(r, { blocks: [{ type: 'hero', data: { titel: 'Ha' } }] });
});

test('reine Prosa wird NICHT als String-JSON akzeptiert (wir erwarten ein Objekt, keinen Text)', () => {
  assert.throws(() => parseModellJson('Das kann ich leider nicht.'), /JSON-Objekt/);
  assert.throws(() => parseModellJson('null'), /JSON-Objekt/);
  assert.throws(() => parseModellJson('[1,2,3]'), /JSON-Objekt/);
});

test('leer wirft', () => {
  assert.throws(() => parseModellJson(''));
  assert.throws(() => parseModellJson('   '));
});
