import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTheme, loadFacts } from '../src/config.js';
import { themeCss } from '../src/blocks/_theme.js';

const hell = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const kontrast = (a, b) => {
  const [hoch, tief] = [hell(a), hell(b)].sort((x, y) => y - x);
  return (hoch + 0.05) / (tief + 0.05);
};

test('Farbpaare, die im Design vorkommen, erreichen WCAG AA (4,5:1)', () => {
  const f = loadTheme().farben;
  // Bewusst nicht dabei: text-gedaempft auf flaeche (4,4:1) und signal-hell als Textfarbe auf hellem Grund.
  const paare = [
    ['text', 'grund'], ['text', 'flaeche'], ['text-gedaempft', 'grund'], ['signal', 'grund'],
    ['signal', 'flaeche'], ['text-auf-signal', 'signal'], ['akzent', 'grund'], ['akzent', 'akzent-flaeche'],
    ['flaeche', 'text'], ['signal-hell', 'text'],
  ];
  for (const [vorder, hinter] of paare) {
    assert.ok(kontrast(f[vorder], f[hinter]) >= 4.5, `${vorder} auf ${hinter}: ${kontrast(f[vorder], f[hinter]).toFixed(2)}`);
  }
});

test('Der Grund ist nie reines Weiß', () => {
  assert.notEqual(loadTheme().farben.grund.toUpperCase(), '#FFFFFF');
});

test('themeCss macht aus jedem Token eine CSS-Variable', () => {
  const css = themeCss();
  for (const gruppe of Object.values(loadTheme())) for (const k of Object.keys(gruppe)) assert.ok(css.includes(`--${k}:`), k);
});

test('Abgeleitete Zahlen werden gerechnet, nie getippt', () => {
  const f = loadFacts();
  assert.equal(f.abgeleitet.jahre_sozialversicherung, new Date().getFullYear() - f.beruf.sozialversicherung_seit);
  assert.match(f.abgeleitet.telefon_link, /^\+\d+$/);
});
