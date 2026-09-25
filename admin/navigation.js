import { h, leere } from './h.js';
import { T } from './labels.js';
import { api } from './api.js';
import { melde, fehlerBlock } from './ui.js';

const STATUS_TEXT = { unveroeffentlicht: 'Ziel ist nicht veröffentlicht', unbekannt: 'Diese Seite gibt es nicht' };
const BEREICH_TEXT = { beide: 'Kopf und Fuß', kopf: 'Nur Kopf', fuss: 'Nur Fuß' };

const zumEintrag = (z) => ({ id: z.id, label: z.label, href: z.href, visible: z.visible, bereich: z.bereich, zielStatus: z.zielStatus, kinder: (z.kinder || []).map(zumEintrag) });
const neuerPunkt = () => ({ label: '', href: '', visible: true, bereich: 'beide', kinder: [] });
const bereinige = (liste) => liste.map((e) => ({ label: e.label, href: e.href, visible: e.visible, bereich: e.bereich, kinder: bereinige(e.kinder || []) }));

export async function navigationAnsicht() {
  const { baum, seiten } = await api.get('/navigation');
  const daten = baum.map(zumEintrag);
  const listeId = 'nav-seiten';
  const datalist = h('datalist', { id: listeId }, seiten.map((s) => h('option', { value: `/${s.slug}` }, s.title)));

  const box = h('div', { class: 'liste liste--nav' });
  const fehlerbox = h('div', {});

  function punktZeile(e, i, liste, ebene) {
    const zeile = h('div', { class: `navpunkt navpunkt--ebene${ebene}` });
    const warnungText = STATUS_TEXT[e.zielStatus] || '';
    const warnungSpan = h('p', { class: 'navpunkt__warnung', hidden: !warnungText }, warnungText);
    const labelInput = h('input', { type: 'text', placeholder: 'Beschriftung', maxlength: 80 });
    labelInput.value = e.label;
    labelInput.addEventListener('input', (ev) => { e.label = ev.target.value; });
    const hrefInput = h('input', { type: 'text', placeholder: '/adresse, https://…, mailto:… (leer = nur Überschrift)', list: listeId });
    hrefInput.value = e.href;
    hrefInput.addEventListener('input', (ev) => { e.href = ev.target.value; e.zielStatus = null; warnungSpan.hidden = true; warnungSpan.textContent = ''; });

    zeile.append(h('div', { class: 'navpunkt__reihe' },
      labelInput, hrefInput,
      ebene === 1 ? h('select', { class: 'navpunkt__auswahl', onchange: (ev) => { e.bereich = ev.target.value; } },
        Object.entries(BEREICH_TEXT).map(([v, t]) => h('option', { value: v, selected: e.bereich === v }, t))) : null,
      h('label', { class: 'navpunkt__sichtbar' }, h('input', { type: 'checkbox', checked: e.visible, onchange: (ev) => { e.visible = ev.target.checked; } }), 'sichtbar'),
      h('div', { class: 'navpunkt__knoepfe' },
        h('button', { type: 'button', class: 'knopf knopf--icon', disabled: i === 0, title: T.hoch, onclick: () => { [liste[i - 1], liste[i]] = [liste[i], liste[i - 1]]; zeichne(); } }, '↑'),
        h('button', { type: 'button', class: 'knopf knopf--icon', disabled: i === liste.length - 1, title: T.runter, onclick: () => { [liste[i + 1], liste[i]] = [liste[i], liste[i + 1]]; zeichne(); } }, '↓'),
        ebene === 1 && !e.kinder.length ? h('button', { type: 'button', class: 'knopf knopf--icon', title: 'Untermenüpunkt hinzufügen', onclick: () => { e.kinder.push(neuerPunkt()); zeichne(); } }, '⤵') : null,
        h('button', { type: 'button', class: 'knopf knopf--icon knopf--gefahr', title: T.entfernen, onclick: () => { liste.splice(i, 1); zeichne(); } }, '✕'))),
      warnungSpan);
    if (ebene === 1 && e.kinder.length) zeile.append(h('div', { class: 'navpunkt__kinder' }, e.kinder.map((k, j) => punktZeile(k, j, e.kinder, 2))));
    return zeile;
  }

  function zeichne() {
    leere(box, daten.map((e, i) => punktZeile(e, i, daten, 1)),
      h('button', { type: 'button', class: 'knopf knopf--leise', onclick: () => { daten.push(neuerPunkt()); zeichne(); } }, T.linkHinzu));
  }

  const speichern = h('button', { type: 'button', class: 'knopf knopf--primaer' }, T.menueSpeichern);
  speichern.addEventListener('click', async () => {
    speichern.disabled = true;
    try {
      const r = await api.put('/navigation', { baum: bereinige(daten) });
      daten.length = 0; daten.push(...r.baum.map(zumEintrag));
      leere(fehlerbox); zeichne(); melde('Navigation gespeichert.');
    } catch (err) { leere(fehlerbox, fehlerBlock(err)); }
    finally { speichern.disabled = false; }
  });

  zeichne();
  return h('section', { class: 'ansicht' }, h('h1', {}, T.menue.navigation),
    h('p', { class: 'ansicht__hinweis' }, 'Der Knopf „Erstgespräch anfragen" in der Kopfzeile gehört zum Baustein „Kopfzeile" der jeweiligen Seite und steht nicht hier.'),
    datalist, fehlerbox, box, speichern);
}
