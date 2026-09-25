import { h, leere } from './h.js';
import { T } from './labels.js';

/** Kurze Meldung unten rechts. */
export function melde(text, art = 'ok') {
  let box = document.getElementById('meldungen');
  if (!box) { box = h('div', { id: 'meldungen', 'aria-live': 'polite' }); document.body.append(box); }
  const m = h('div', { class: `meldung meldung--${art}`, role: art === 'fehler' ? 'alert' : 'status' }, text);
  box.append(m);
  setTimeout(() => m.remove(), art === 'fehler' ? 9000 : 3500);
}

/** Fehler des Servers samt Einzelheiten als lesbarer Block. */
export function fehlerBlock(err) {
  const details = (err.details || []).filter(Boolean);
  return h('div', { class: 'hinweis hinweis--fehler', role: 'alert' },
    h('strong', {}, err.message || 'Das hat nicht geklappt.'),
    details.length ? h('ul', {}, details.map((d) => h('li', {}, d))) : null);
}

/**
 * Ein Dialog. `inhalt` ist ein Knoten, `knoepfe` eine Liste { text, art, aktion }.
 * Liefert ein Promise, das mit dem Wert der gewählten Aktion aufgelöst wird (null beim Abbrechen).
 */
export function dialog({ titel, inhalt, knoepfe, breit = false }) {
  return new Promise((aufloesen) => {
    const d = h('dialog', { class: `dialog${breit ? ' dialog--breit' : ''}`, 'aria-labelledby': 'dialog-titel' });
    const zu = (wert) => { d.close(); d.remove(); aufloesen(wert); };
    const leiste = h('div', { class: 'dialog__knoepfe' }, (knoepfe || []).map((k) => h('button', {
      type: 'button', class: `knopf${k.art ? ` knopf--${k.art}` : ''}`,
      // false = Dialog bleibt offen (z. B. Validierungsfehler). Alles andere schließt den Dialog mit genau
      // diesem Wert — auch null, das ist "Abbrechen" (siehe Dokumentation oben). Nie null zu true aufwerten!
      onclick: async () => { const wert = k.aktion ? await k.aktion() : true; if (wert !== false) zu(wert); },
    }, k.text)));
    d.append(h('h2', { id: 'dialog-titel' }, titel), h('div', { class: 'dialog__inhalt' }, inhalt), leiste);
    d.addEventListener('cancel', (e) => { e.preventDefault(); zu(null); });
    document.body.append(d);
    d.showModal();
    d.querySelector('input, select, textarea, button')?.focus();
  });
}

/** Ja oder Nein. Mit `gefahr` ist der Knopf rot. */
export async function bestaetige({ titel, text, ok = T.ok, gefahr = false }) {
  const r = await dialog({
    titel, inhalt: typeof text === 'string' ? h('p', {}, text) : text,
    knoepfe: [{ text: T.abbrechen, art: 'leise', aktion: () => null }, { text: ok, art: gefahr ? 'gefahr' : 'primaer' }],
  });
  return r === true;
}

export const badge = (status, namen) => h('span', { class: `badge badge--${status}` }, namen?.[status] || status);
export { leere };
