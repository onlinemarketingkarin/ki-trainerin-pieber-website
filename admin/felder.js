import { h, leere } from './h.js';
import { T } from './labels.js';
import { waehleBild } from './medienpicker.js';

/**
 * Ein Formular aus einem Schema erzeugen (siehe Stufe 3.1.3 im Motor-Dokument):
 * ein neues Feld im Schema erscheint dadurch von selbst im Cockpit, nie handgeschrieben.
 */
export function formularAus(schema, daten, { aendere }) {
  const wrap = h('div', { class: 'felder' });
  for (const [name, def] of Object.entries(schema || {})) wrap.append(feld(name, def, daten, aendere));
  return wrap;
}

function setze(daten, name, wert, aendere) { daten[name] = wert; aendere(daten); }

function feld(name, def, daten, aendere) {
  const id = `f-${Math.random().toString(36).slice(2, 8)}-${name}`;
  const label = h('label', { for: id }, def.label || name);

  if (def.type === 'longtext') {
    const input = h('textarea', { id, rows: 6, oninput: (e) => setze(daten, name, e.target.value, aendere) });
    input.value = daten[name] ?? def.default ?? '';
    return h('div', { class: 'feld' }, label, input,
      h('p', { class: 'feld__hinweis' }, 'Leerzeile = neuer Absatz · „- " = Liste · „## " = Zwischenüberschrift'));
  }
  if (def.type === 'select') {
    const optionen = def.options || [];
    const select = h('select', { id, onchange: (e) => setze(daten, name, e.target.value, aendere) },
      optionen.map((o) => h('option', { value: o, selected: (daten[name] ?? def.default) === o }, def.optionLabels?.[o] || o)));
    return h('div', { class: 'feld' }, label, select);
  }
  if (def.type === 'image') {
    return h('div', { class: 'feld' }, label, bildFeld(daten[name] || '', (wert) => setze(daten, name, wert, aendere)));
  }
  if (def.type === 'list') {
    return h('div', { class: 'feld feld--liste' }, label, listenFeld(def.item || {}, daten[name] || [], (wert) => setze(daten, name, wert, aendere)));
  }
  // 'text' und alles Unbekannte: einfaches Textfeld, mehrzeilig wird als kleines Textfeld dargestellt
  const input = h(def.mehrzeilig ? 'textarea' : 'input', {
    id, type: def.mehrzeilig ? undefined : 'text', rows: def.mehrzeilig ? 2 : undefined,
    oninput: (e) => setze(daten, name, e.target.value, aendere),
  });
  input.value = daten[name] ?? def.default ?? '';
  return h('div', { class: 'feld' }, label, input);
}

function bildFeld(pfad, aendere) {
  const box = h('div', { class: 'bildfeld' });
  const zeichne = () => leere(box,
    pfad
      ? h('div', { class: 'bildfeld__vorschau' },
          h('img', { src: `${pfad}-480.webp`, alt: '' }),
          h('button', { type: 'button', class: 'knopf knopf--leise', onclick: () => { pfad = ''; aendere(''); zeichne(); } }, T.bildEntfernen))
      : h('button', { type: 'button', class: 'knopf knopf--leise', onclick: async () => {
          const gewaehlt = await waehleBild();
          if (gewaehlt) { pfad = gewaehlt; aendere(pfad); zeichne(); }
        } }, T.bildWaehlen));
  zeichne();
  return box;
}

function listenFeld(itemSchema, liste, aendere) {
  const box = h('div', { class: 'liste' });
  const leererEintrag = () => Object.fromEntries(Object.entries(itemSchema).map(([k, d]) => [k, d.default ?? (d.type === 'list' ? [] : '')]));
  const zeichne = () => leere(box,
    liste.map((eintrag, i) => h('div', { class: 'liste__eintrag' },
      h('div', { class: 'liste__kopf' },
        h('span', { class: 'liste__nr' }, `#${i + 1}`),
        h('div', { class: 'liste__knoepfe' },
          h('button', { type: 'button', class: 'knopf knopf--icon', disabled: i === 0, title: T.hoch, onclick: () => { [liste[i - 1], liste[i]] = [liste[i], liste[i - 1]]; aendere(liste); zeichne(); } }, '↑'),
          h('button', { type: 'button', class: 'knopf knopf--icon', disabled: i === liste.length - 1, title: T.runter, onclick: () => { [liste[i + 1], liste[i]] = [liste[i], liste[i + 1]]; aendere(liste); zeichne(); } }, '↓'),
          h('button', { type: 'button', class: 'knopf knopf--icon knopf--gefahr', title: T.entfernen, onclick: () => { liste.splice(i, 1); aendere(liste); zeichne(); } }, '✕'))),
      formularAus(itemSchema, eintrag, { aendere: () => aendere(liste) }))),
    h('button', { type: 'button', class: 'knopf knopf--leise', onclick: () => { liste.push(leererEintrag()); aendere(liste); zeichne(); } }, T.eintragHinzu));
  zeichne();
  return box;
}
