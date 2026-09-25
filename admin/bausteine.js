import { h, leere } from './h.js';
import { T } from './labels.js';
import { formularAus } from './felder.js';

/**
 * Die Bausteine einer Seite: hinzufügen, entfernen, verschieben, je Baustein ein Formular
 * aus seinem Schema (siehe Stufe 3.1.3). nav und footer bilden den Rahmen: sie lassen sich
 * nicht verschieben und nicht verdoppeln.
 */
export function bausteinEditor(content, { erlaubt, bausteine, aendere }) {
  const box = h('div', { class: 'bausteine' });

  function karte(eintrag, i) {
    const def = bausteine[eintrag.type];
    const rahmen = Boolean(def?.rahmen);
    const el = h('details', { class: `baustein${rahmen ? ' baustein--rahmen' : ''}`, open: !rahmen });
    const knoepfe = rahmen ? null : h('div', { class: 'baustein__knoepfe' },
      h('button', { type: 'button', class: 'knopf knopf--icon', disabled: i === 0 || bausteine[content.blocks[i - 1]?.type]?.rahmen, title: T.hoch,
        onclick: (e) => { e.preventDefault(); e.stopPropagation(); verschiebe(i, -1); } }, '↑'),
      h('button', { type: 'button', class: 'knopf knopf--icon', disabled: i === content.blocks.length - 1 || bausteine[content.blocks[i + 1]?.type]?.rahmen, title: T.runter,
        onclick: (e) => { e.preventDefault(); e.stopPropagation(); verschiebe(i, 1); } }, '↓'),
      h('button', { type: 'button', class: 'knopf knopf--icon knopf--gefahr', title: T.entfernen,
        onclick: (e) => { e.preventDefault(); e.stopPropagation(); entferne(i); } }, '✕'));
    el.append(
      h('summary', {}, h('span', { class: 'baustein__label' }, def?.label || eintrag.type), knoepfe),
      def ? formularAus(def.schema, eintrag.data, { aendere: () => aendere(content) })
        : h('p', { class: 'hinweis hinweis--fehler' }, `Unbekannter Baustein: ${eintrag.type}`));
    return el;
  }

  function verschiebe(i, richtung) {
    const j = i + richtung;
    [content.blocks[i], content.blocks[j]] = [content.blocks[j], content.blocks[i]];
    aendere(content); zeichne();
  }
  function entferne(i) { content.blocks.splice(i, 1); aendere(content); zeichne(); }

  function hinzuZeile() {
    const waehlbar = erlaubt.filter((name) => bausteine[name] && !(bausteine[name].rahmen && content.blocks.some((b) => b.type === name)));
    if (!waehlbar.length) return null;
    const auswahl = h('select', {}, waehlbar.map((name) => h('option', { value: name }, bausteine[name].label)));
    return h('div', { class: 'bausteine__hinzu' }, auswahl,
      h('button', { type: 'button', class: 'knopf knopf--leise', onclick: () => {
        const def = bausteine[auswahl.value];
        const daten = Object.fromEntries(Object.entries(def.schema).map(([k, d]) => [k, d.default ?? (d.type === 'list' ? [] : '')]));
        const eintrag = { type: auswahl.value, data: daten };
        if (def.rahmen && auswahl.value === 'footer') content.blocks.push(eintrag);
        else if (def.rahmen) content.blocks.unshift(eintrag);
        else {
          const fussIndex = content.blocks.findIndex((b) => bausteine[b.type]?.rahmen && b.type === 'footer');
          if (fussIndex >= 0) content.blocks.splice(fussIndex, 0, eintrag); else content.blocks.push(eintrag);
        }
        aendere(content); zeichne();
      } }, T.bausteinHinzu));
  }

  function zeichne() { leere(box, content.blocks.map(karte), hinzuZeile()); }
  zeichne();
  return box;
}
