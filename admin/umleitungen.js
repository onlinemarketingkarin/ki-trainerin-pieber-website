import { h, leere } from './h.js';
import { T } from './labels.js';
import { api } from './api.js';
import { melde, fehlerBlock, bestaetige } from './ui.js';

export async function umleitungenAnsicht() {
  const box = h('div', {});
  const fehlerbox = h('div', {});
  const von = h('input', { type: 'text', placeholder: '/alte-adresse' });
  const nach = h('input', { type: 'text', placeholder: '/neue-adresse oder https://…' });

  async function laden() {
    const { umleitungen } = await api.get('/redirects');
    leere(box, umleitungen.length ? h('table', { class: 'tabelle' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Von'), h('th', {}, 'Nach'), h('th', {}, 'Code'), h('th', {}))),
      h('tbody', {}, umleitungen.map((u) => h('tr', {},
        h('td', {}, u.from_path), h('td', {}, u.to_path), h('td', {}, String(u.code)),
        h('td', {}, (() => {
          const b = h('button', { type: 'button', class: 'knopf knopf--klein knopf--gefahr' }, T.loeschen);
          b.addEventListener('click', async () => {
            if (!(await bestaetige({ titel: 'Umleitung löschen', text: `${u.from_path} nicht mehr umleiten?`, gefahr: true }))) return;
            await api.del('/redirects', { von: u.from_path }); await laden();
          });
          return b;
        })())))))
      : h('p', { class: 'leer' }, 'Noch keine Umleitungen.'));
  }

  const anlegen = h('button', { type: 'button', class: 'knopf knopf--primaer' }, T.umleitungAnlegen);
  anlegen.addEventListener('click', async () => {
    try { await api.post('/redirects', { von: von.value, nach: nach.value }); von.value = ''; nach.value = ''; leere(fehlerbox); await laden(); melde('Umleitung angelegt.'); }
    catch (err) { leere(fehlerbox, fehlerBlock(err)); }
  });

  await laden();
  return h('section', { class: 'ansicht' }, h('h1', {}, T.menue.umleitungen),
    h('p', { class: 'ansicht__hinweis' }, 'Beim Umbenennen oder Löschen einer veröffentlichten Seite legt der Motor die Umleitung von allein an. Hier nur für Adressen, die eine ältere Website schon verwendet hat.'),
    h('div', { class: 'umleitungen__form' }, von, nach, anlegen), fehlerbox, box);
}
