import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, ziel, inlineMd, markdownBloecke, bildSet } from '../src/blocks/_util.js';

test('html escaped Eingesetztes, raw() bleibt', () => {
  assert.equal(html`<p>${'<b>x</b>'}</p>`.value, '<p>&lt;b&gt;x&lt;/b&gt;</p>');
  assert.equal(html`<p>${raw('<b>x</b>')}</p>`.value, '<p><b>x</b></p>');
});

test('ziel() lässt nur sichere Ziele durch', () => {
  for (const ok of ['/kontakt', 'https://a.at', '#anker', 'mailto:a@b.at', 'tel:+43664', '{{facts.linkedin}}']) {
    assert.equal(ziel(ok), ok);
  }
  for (const schlecht of ['javascript:alert(1)', ' JavaScript:1', 'data:text/html,x', '//evil.com', '/\\evil.com', 'http://a.at', '', null]) {
    assert.equal(ziel(schlecht), '');
  }
});

test('inlineMd: fett, kursiv, Link; unsichere Links werden zu Text', () => {
  assert.equal(inlineMd('**a** und *b*'), '<strong>a</strong> und <em>b</em>');
  assert.equal(inlineMd('[x](https://a.at)'), '<a href="https://a.at">x</a>');
  // Runde Klammern in der URL werden nicht unterstützt. Wichtig ist: es entsteht kein Link.
  const boese = inlineMd('[x](javascript:alert(1))');
  assert.ok(!boese.includes('href') && !boese.includes('javascript'));
  assert.equal(inlineMd('[x](javascript:void)'), 'x');
  assert.equal(inlineMd('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('markdownBloecke: Absätze und Listen', () => {
  assert.equal(markdownBloecke('Eins\n\nZwei').value, '<p>Eins</p><p>Zwei</p>');
  assert.equal(markdownBloecke('- a\n- b').value, '<ul><li>a</li><li>b</li></ul>');
  assert.equal(markdownBloecke('1. a\n2. b').value, '<ol><li>a</li><li>b</li></ol>');
});

test('markdownBloecke: Zwischenüberschriften und Zeilenumbruch', () => {
  assert.equal(markdownBloecke('## Titel\n\nA\nB').value, '<h3>Titel</h3><p>A<br>B</p>');
  assert.equal(markdownBloecke('### Klein').value, '<h4>Klein</h4>');
});

test('bildSet: nur Pfade unter /uploads, escaped, mit srcset', () => {
  const ok = bildSet('/uploads/ab12cd34-portrait', { alt: 'Sie "lächelt"' }).value;
  assert.ok(ok.includes('srcset="/uploads/ab12cd34-portrait-480.webp 480w'));
  assert.ok(ok.includes('alt="Sie &quot;lächelt&quot;"'));
  for (const schlecht of ['https://evil.com/x', '/uploads/../geheim', 'javascript:alert(1)', '', null, '/uploads/a b']) {
    assert.equal(bildSet(schlecht).value, '', String(schlecht));
  }
});
