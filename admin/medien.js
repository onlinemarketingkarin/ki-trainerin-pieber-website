import { h, leere } from './h.js';
import { T } from './labels.js';
import { api, ApiFehler } from './api.js';
import { melde, bestaetige, fehlerBlock } from './ui.js';

export async function medienAnsicht() {
  const raster = h('div', { class: 'medienraster medienraster--verwaltung' }, h('p', { class: 'laden' }, 'Wird geladen …'));
  const dateiFeld = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif' });
  const altFeld = h('input', { type: 'text', maxlength: 300, placeholder: 'Ein Satz, der das Bild beschreibt' });
  const hochladenKnopf = h('button', { type: 'button', class: 'knopf knopf--primaer' }, T.bildHochladen);
  const fehlerbox = h('div', {});

  async function laden() {
    const { medien } = await api.get('/media');
    leere(raster, medien.length ? medien.map(karte) : h('p', { class: 'leer' }, 'Noch keine Bilder hochgeladen.'));
  }

  function karte(m) {
    const alt = h('input', { type: 'text', maxlength: 300 });
    alt.value = m.alt;
    const speichern = h('button', { type: 'button', class: 'knopf knopf--klein' }, T.speichern);
    speichern.addEventListener('click', async () => {
      try { await api.put(`/media/${m.id}`, { alt: alt.value }); melde('Beschreibung gespeichert.'); }
      catch (err) { melde(err.message, 'fehler'); }
    });
    const loeschen = h('button', { type: 'button', class: 'knopf knopf--klein knopf--gefahr' }, T.loeschen);
    loeschen.addEventListener('click', async () => {
      if (!(await bestaetige({ titel: 'Bild löschen', text: 'Dieses Bild endgültig löschen?', gefahr: true }))) return;
      try { await api.del(`/media/${m.id}`); melde('Bild gelöscht.'); await laden(); }
      catch (err) {
        if (err instanceof ApiFehler && err.status === 409) {
          await bestaetige({ titel: 'Bild wird verwendet', ok: T.schliessen,
            text: h('div', {}, h('p', {}, err.message), h('ul', {}, (err.details || []).map((d) => h('li', {}, d)))) });
        } else melde(err.message, 'fehler');
      }
    });
    return h('div', { class: 'medienkarte' },
      h('img', { src: `${m.file_path}-480.webp`, alt: m.alt }),
      h('p', { class: 'medienkarte__bytes' }, `${Math.round(m.bytes / 1024)} KB`),
      h('div', { class: 'feld' }, h('label', {}, 'Alt-Text'), alt),
      h('div', { class: 'medienkarte__knoepfe' }, speichern, loeschen));
  }

  hochladenKnopf.addEventListener('click', async () => {
    const datei = dateiFeld.files?.[0];
    if (!datei) return melde('Bitte wählen Sie eine Datei.', 'fehler');
    if (!altFeld.value.trim()) return melde('Bitte beschreiben Sie das Bild in einem Satz.', 'fehler');
    hochladenKnopf.disabled = true;
    try { await api.hochladen(datei, altFeld.value.trim()); melde('Bild hochgeladen.'); dateiFeld.value = ''; altFeld.value = ''; leere(fehlerbox); await laden(); }
    catch (err) { leere(fehlerbox, fehlerBlock(err)); }
    finally { hochladenKnopf.disabled = false; }
  });

  laden();
  return h('section', { class: 'ansicht' }, h('h1', {}, T.menue.medien),
    h('div', { class: 'medien__hochladen' },
      h('div', { class: 'feld' }, h('label', {}, 'Datei'), dateiFeld),
      h('div', { class: 'feld' }, h('label', {}, 'Bildbeschreibung (Pflicht)'), altFeld),
      hochladenKnopf, fehlerbox),
    raster);
}
