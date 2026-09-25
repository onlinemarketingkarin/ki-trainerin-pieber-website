import { h, leere, kopie } from './h.js';
import { T, FAKTEN } from './labels.js';
import { api } from './api.js';
import { melde, fehlerBlock } from './ui.js';

const wertBei = (o, pfad) => pfad.split('.').reduce((x, k) => (x && typeof x === 'object' ? x[k] : undefined), o);
const setzeBei = (o, pfad, wert) => { const t = pfad.split('.'); let x = o; for (let i = 0; i < t.length - 1; i++) x = x[t[i]]; x[t.at(-1)] = wert; };
const istObjekt = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Alle Blattpfade eines Objekts, z. B. { a: { b: 1 } } → ['a.b']. */
function blattPfade(objekt, praefix = '') {
  return Object.entries(objekt).flatMap(([k, v]) => {
    const pfad = praefix ? `${praefix}.${k}` : k;
    return istObjekt(v) ? blattPfade(v, pfad) : [pfad];
  });
}

export async function faktenAnsicht() {
  const stand = await api.get('/facts');
  const arbeitskopie = kopie(stand.aktuell);
  const fehlerbox = h('div', {});

  const gruppen = new Map();
  for (const [k, v] of Object.entries(stand.datei)) {
    const gruppenName = istObjekt(v) ? k : '';
    if (!gruppen.has(gruppenName)) gruppen.set(gruppenName, []);
    gruppen.get(gruppenName).push(...blattPfade(istObjekt(v) ? v : { [k]: v }, gruppenName));
  }

  function faktFeld(pfad) {
    const id = `fakt-${pfad}`;
    const uebersteuert = wertBei(stand.override, pfad) !== undefined;
    const input = h('input', { id, type: 'text' });
    input.value = wertBei(arbeitskopie, pfad) ?? '';
    input.addEventListener('input', (e) => setzeBei(arbeitskopie, pfad, e.target.value));
    const zuruecksetzen = h('button', { type: 'button', class: 'knopf knopf--icon', title: T.zuruecksetzen, hidden: !uebersteuert,
      onclick: () => { const grund = wertBei(stand.datei, pfad); setzeBei(arbeitskopie, pfad, grund); input.value = grund ?? ''; zuruecksetzen.hidden = true; } });
    return h('div', { class: 'feld feld--fakt' },
      h('label', { for: id }, FAKTEN.felder[pfad] || pfad, uebersteuert ? h('span', { class: 'badge badge--edited' }, 'im Cockpit geändert') : null),
      h('div', { class: 'feld__zeile' }, input, zuruecksetzen),
      FAKTEN.hinweise[pfad] ? h('p', { class: 'feld__hinweis' }, FAKTEN.hinweise[pfad]) : null);
  }

  const form = h('form', { class: 'faktenform', onsubmit: (e) => e.preventDefault() });
  for (const [gruppenName, felder] of gruppen) {
    form.append(h('h2', { class: 'faktenform__gruppe' }, FAKTEN.gruppen[gruppenName] || gruppenName || 'Allgemein'), ...felder.map(faktFeld));
  }

  const speichern = h('button', { type: 'button', class: 'knopf knopf--primaer' }, T.faktenSpeichern);
  speichern.addEventListener('click', async () => {
    speichern.disabled = true;
    try { await api.put('/facts', { fakten: arbeitskopie }); leere(fehlerbox); melde('Fakten gespeichert. Die Website übernimmt sie sofort.'); }
    catch (err) { leere(fehlerbox, fehlerBlock(err)); }
    finally { speichern.disabled = false; }
  });

  return h('section', { class: 'ansicht' }, h('h1', {}, T.menue.fakten),
    h('p', { class: 'ansicht__hinweis' }, 'Diese Werte stehen ohne Deploy sofort auf der Website. Was hier leer bleibt, erscheint dort sichtbar als […].'),
    fehlerbox, form, speichern);
}
