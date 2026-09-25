import { h, leere } from './h.js';
import { T } from './labels.js';
import { api } from './api.js';
import { melde } from './ui.js';

/** Ein eigener, schlichter Dialog: ein Klick auf ein Bild soll sofort schließen und den Pfad liefern. */
export function waehleBild() {
  return new Promise((aufloesen) => {
    const d = h('dialog', { class: 'dialog dialog--breit', 'aria-labelledby': 'mp-titel' });
    const zu = (wert) => { d.close(); d.remove(); aufloesen(wert ?? null); };

    const raster = h('div', { class: 'medienraster' }, h('p', { class: 'laden' }, 'Wird geladen …'));
    const dateiFeld = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif' });
    const altFeld = h('input', { type: 'text', maxlength: 300, placeholder: 'Ein Satz, der das Bild beschreibt' });
    const hochladenKnopf = h('button', { type: 'button', class: 'knopf knopf--primaer' }, T.bildHochladen);
    hochladenKnopf.addEventListener('click', async () => {
      const datei = dateiFeld.files?.[0];
      if (!datei) return melde('Bitte wählen Sie eine Datei.', 'fehler');
      if (!altFeld.value.trim()) return melde('Bitte beschreiben Sie das Bild in einem Satz.', 'fehler');
      hochladenKnopf.disabled = true;
      try { const { medium } = await api.hochladen(datei, altFeld.value.trim()); zu(medium.file_path); }
      catch (err) { melde(err.message, 'fehler'); hochladenKnopf.disabled = false; }
    });

    d.append(
      h('h2', { id: 'mp-titel' }, T.bildWaehlen),
      h('div', { class: 'dialog__inhalt' },
        raster,
        h('div', { class: 'medienpicker__hochladen' },
          h('h3', {}, T.bildHochladen),
          h('div', { class: 'feld' }, h('label', {}, 'Datei'), dateiFeld),
          h('div', { class: 'feld' }, h('label', {}, 'Bildbeschreibung (Pflicht)'), altFeld),
          hochladenKnopf)),
      h('div', { class: 'dialog__knoepfe' }, h('button', { type: 'button', class: 'knopf knopf--leise', onclick: () => zu(null) }, T.abbrechen)));

    d.addEventListener('cancel', (e) => { e.preventDefault(); zu(null); });
    document.body.append(d);
    d.showModal();

    api.get('/media').then(({ medien }) => leere(raster, medien.length
      ? medien.map((m) => h('button', { type: 'button', class: 'medienraster__bild', title: m.alt, onclick: () => zu(m.file_path) },
          h('img', { src: `${m.file_path}-480.webp`, alt: m.alt }), h('span', {}, m.alt)))
      : h('p', { class: 'leer' }, 'Noch keine Bilder hochgeladen.')))
      .catch((err) => leere(raster, h('p', { class: 'hinweis hinweis--fehler' }, err.message)));
  });
}
