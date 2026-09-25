import { h, leere, datum } from './h.js';
import { T, INTERESSEN } from './labels.js';
import { api } from './api.js';
import { bestaetige } from './ui.js';

export async function anfragenAnsicht() {
  const box = h('div', { class: 'anfragenliste' });

  function karte(a) {
    const gelesenKnopf = h('button', { type: 'button', class: 'knopf knopf--klein' }, a.gelesen ? T.alsUngelesen : T.alsGelesen);
    gelesenKnopf.addEventListener('click', async () => { await api.put(`/submissions/${a.id}`, { gelesen: !a.gelesen }); await laden(); });
    const loeschenKnopf = h('button', { type: 'button', class: 'knopf knopf--klein knopf--gefahr' }, T.loeschen);
    loeschenKnopf.addEventListener('click', async () => {
      if (!(await bestaetige({ titel: 'Anfrage löschen', text: 'Diese Anfrage endgültig löschen?', gefahr: true }))) return;
      await api.del(`/submissions/${a.id}`); await laden();
    });
    return h('article', { class: `anfrage${a.gelesen ? '' : ' anfrage--ungelesen'}` },
      h('header', { class: 'anfrage__kopf' },
        h('strong', {}, a.daten.name), h('span', {}, a.daten.email),
        a.daten.interesse ? h('span', { class: 'badge' }, INTERESSEN[a.daten.interesse] || a.daten.interesse) : null,
        h('time', {}, datum(a.eingang))),
      a.daten.organisation ? h('p', { class: 'anfrage__org' }, a.daten.organisation) : null,
      h('p', { class: 'anfrage__text' }, a.daten.nachricht),
      a.seite ? h('p', { class: 'anfrage__seite' }, `Von Seite: /${a.seite}`) : null,
      h('div', { class: 'anfrage__knoepfe' }, h('a', { class: 'knopf knopf--klein', href: `mailto:${a.daten.email}` }, T.antworten), gelesenKnopf, loeschenKnopf));
  }

  async function laden() {
    const { anfragen } = await api.get('/submissions');
    leere(box, anfragen.length ? anfragen.map(karte) : h('p', { class: 'leer' }, 'Noch keine Anfragen.'));
  }
  await laden();
  return h('section', { class: 'ansicht' }, h('h1', {}, T.menue.anfragen), box);
}
