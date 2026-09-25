import { h, leere, kopie } from './h.js';
import { T } from './labels.js';
import { api } from './api.js';
import { melde, dialog, bestaetige, fehlerBlock, badge } from './ui.js';
import { bausteinEditor } from './bausteine.js';
import { waehleBild } from './medienpicker.js';

let meta = null;
async function ladeMeta() { if (!meta) meta = await api.get('/meta'); return meta; }

export async function seitenAnsicht(navigiere) {
  await ladeMeta();
  const { seiten } = await api.get('/pages');
  return h('section', { class: 'ansicht' },
    h('div', { class: 'ansicht__kopf' }, h('h1', {}, T.menue.seiten),
      h('button', { type: 'button', class: 'knopf knopf--primaer', onclick: () => neueSeiteDialog(navigiere) }, `+ ${T.neueSeite}`)),
    h('table', { class: 'tabelle' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Titel'), h('th', {}, 'Typ'), h('th', {}, 'Status'), h('th', {}, 'Geändert'))),
      h('tbody', {}, seiten.length ? seiten.map((s) => h('tr', {
        class: 'tabelle__zeile', tabindex: 0, onclick: () => navigiere(`seite/${s.id}`),
        onkeydown: (e) => { if (e.key === 'Enter') navigiere(`seite/${s.id}`); },
      },
        h('td', {}, s.title || `/${s.slug}`, s.noindex ? h('span', { class: 'badge badge--noindex' }, 'noindex') : null),
        h('td', {}, meta.seitentypen.find((t) => t.name === s.page_type)?.label || s.page_type),
        h('td', {}, badge(s.status, meta.status)),
        h('td', {}, new Date(s.updated_at).toLocaleDateString('de-AT'))))
        : h('tr', {}, h('td', { colspan: 4, class: 'leer' }, 'Noch keine Seiten.')))));
}

async function neueSeiteDialog(navigiere) {
  const typAuswahl = h('select', {}, meta.seitentypen.filter((t) => t.name !== 'home').map((t) => h('option', { value: t.name }, t.label)));
  const titel = h('input', { type: 'text', maxlength: 200, placeholder: 'Titel der Seite' });
  const notizen = h('textarea', { rows: 5, maxlength: 20000, placeholder: 'z. B. Stichworte aus einem Gespräch, ein Diktat, ein Transkript …' });
  const fehlerbox = h('div', {});
  const seite = await dialog({
    titel: T.neueSeite, breit: true,
    inhalt: h('div', {},
      h('div', { class: 'feld' }, h('label', {}, 'Seitentyp'), typAuswahl),
      h('div', { class: 'feld' }, h('label', {}, 'Titel'), titel),
      h('div', { class: 'feld' }, h('label', {}, T.notizenLabel), notizen, h('p', { class: 'feld__hinweis' }, T.notizenHinweis)),
      fehlerbox),
    knoepfe: [{ text: T.abbrechen, aktion: () => null }, { text: T.seiteAnlegen, art: 'primaer', aktion: async () => {
      if (!titel.value.trim()) { leere(fehlerbox, h('p', { class: 'hinweis hinweis--fehler' }, 'Bitte einen Titel eingeben.')); return false; }
      try { const r = await api.post('/pages', { page_type: typAuswahl.value, title: titel.value.trim(), quelle: notizen.value.trim() }); return r.seite; }
      catch (err) { leere(fehlerbox, fehlerBlock(err)); return false; }
    } }],
  });
  if (seite) navigiere(`seite/${seite.id}`);
}

const AKTIONS_TEXT = { freigeben: T.freigeben, veroeffentlichen: T.veroeffentlichen, zurueckziehen: T.zurueckziehen, archivieren: T.archivieren, wiederherstellen: T.wiederherstellen };

export async function seiteAnsicht(id, navigiere) {
  await ladeMeta();
  const { seite } = await api.get(`/pages/${id}`);
  const arbeitskopie = kopie(seite);
  let geaendert = false;
  const typ = meta.seitentypen.find((t) => t.name === seite.page_type);

  const fehlerbox = h('div', {});
  const zurueck = h('button', { type: 'button', class: 'knopf knopf--leise', onclick: () => navigiere('seiten') }, '‹ Alle Seiten');

  const titelFeld = h('input', { type: 'text', maxlength: 200, oninput: (e) => { arbeitskopie.title = e.target.value; geaendert = true; } });
  titelFeld.value = arbeitskopie.title;
  const beschreibungFeld = h('textarea', { rows: 2, maxlength: 400, oninput: (e) => { arbeitskopie.description = e.target.value; geaendert = true; } });
  beschreibungFeld.value = arbeitskopie.description;
  const slugFeld = h('input', { type: 'text', disabled: arbeitskopie.slug === 'start', oninput: (e) => { arbeitskopie.slug = e.target.value.trim(); geaendert = true; } });
  slugFeld.value = arbeitskopie.slug;
  const noindexFeld = h('input', { type: 'checkbox', checked: arbeitskopie.noindex, onchange: (e) => { arbeitskopie.noindex = e.target.checked; geaendert = true; } });

  const ogBox = h('div', {});
  const zeichneOg = () => leere(ogBox, arbeitskopie.og_image
    ? h('div', { class: 'bildfeld__vorschau' }, h('img', { src: `${arbeitskopie.og_image}-480.webp`, alt: '' }),
        h('button', { type: 'button', class: 'knopf knopf--leise', onclick: () => { arbeitskopie.og_image = ''; geaendert = true; zeichneOg(); } }, T.bildEntfernen))
    : h('button', { type: 'button', class: 'knopf knopf--leise', onclick: async () => {
        const g = await waehleBild(); if (g) { arbeitskopie.og_image = g; geaendert = true; zeichneOg(); }
      } }, T.bildWaehlen));
  zeichneOg();

  const bausteineWrapper = h('div', {});
  function zeichneBausteine() {
    leere(bausteineWrapper, bausteinEditor(arbeitskopie.content, { erlaubt: typ?.erlaubt || [], bausteine: meta.bausteine, aendere: () => { geaendert = true; } }));
  }
  zeichneBausteine();

  const vorschauHinweis = h('div', {});
  const iframe = h('iframe', { class: 'vorschau__rahmen', title: 'Vorschau der Seite' });
  async function aktualisiereVorschau() {
    try {
      const r = await api.post('/preview', { page_type: arbeitskopie.page_type, slug: arbeitskopie.slug, title: arbeitskopie.title, description: arbeitskopie.description, content: arbeitskopie.content });
      iframe.srcdoc = r.html;
      leere(vorschauHinweis, r.fehlend.length ? h('p', { class: 'hinweis hinweis--warnung' }, `Fehlende Fakten in der Vorschau: ${r.fehlend.join(', ')}`) : null);
    } catch (err) { melde(err.message, 'fehler'); }
  }
  const vorschauGeraet = h('div', { class: 'vorschau__geraete' });
  leere(vorschauGeraet,
    (() => { const b = h('button', { type: 'button', class: 'knopf knopf--klein vorschau__geraet--aktiv' }, T.vorschauComputer);
      b.addEventListener('click', () => { vorschauGeraet.querySelectorAll('button').forEach((x) => x.classList.remove('vorschau__geraet--aktiv')); b.classList.add('vorschau__geraet--aktiv'); iframe.classList.remove('vorschau__rahmen--telefon'); }); return b; })(),
    (() => { const b = h('button', { type: 'button', class: 'knopf knopf--klein' }, T.vorschauTelefon);
      b.addEventListener('click', () => { vorschauGeraet.querySelectorAll('button').forEach((x) => x.classList.remove('vorschau__geraet--aktiv')); b.classList.add('vorschau__geraet--aktiv'); iframe.classList.add('vorschau__rahmen--telefon'); }); return b; })());
  const vorschauKnopf = h('button', { type: 'button', class: 'knopf knopf--leise', onclick: aktualisiereVorschau }, T.vorschauAktualisieren);

  function aktionsKnoepfe() {
    const box = h('span', { class: 'seite__aktionen' });
    for (const [name, vonListe] of Object.entries(meta.aktionen)) {
      if (!vonListe.includes(arbeitskopie.status)) continue;
      const knopf = h('button', { type: 'button', class: `knopf knopf--klein${name === 'veroeffentlichen' ? ' knopf--primaer' : ''}` }, AKTIONS_TEXT[name]);
      knopf.addEventListener('click', async () => {
        if (geaendert && !(await bestaetige({ titel: 'Ungespeicherte Änderungen', text: `Zuerst speichern? Ohne Speichern gehen Ihre Änderungen an dieser Aktion vorbei.`, ok: 'Trotzdem fortfahren' }))) return;
        knopf.disabled = true;
        try {
          const r = await api.post(`/pages/${id}/aktion`, { aktion: name });
          Object.assign(arbeitskopie, r.seite);
          leere(statusZeile, badge(arbeitskopie.status, meta.status), aktionsKnoepfe());
          melde(`Status: ${meta.status[arbeitskopie.status]}.`);
          if (r.warnungen?.length) melde(r.warnungen.join(' '), 'warnung');
        } catch (err) { await dialog({ titel: 'Das geht noch nicht', inhalt: fehlerBlock(err), knoepfe: [{ text: T.schliessen }] }); }
        finally { knopf.disabled = false; }
      });
      box.append(knopf);
    }
    return box;
  }
  const statusZeile = h('div', { class: 'seite__status' }, badge(arbeitskopie.status, meta.status), aktionsKnoepfe());

  const speichernKnopf = h('button', { type: 'button', class: 'knopf knopf--primaer' }, T.speichern);
  speichernKnopf.addEventListener('click', async () => {
    speichernKnopf.disabled = true;
    try {
      const r = await api.put(`/pages/${id}`, { title: arbeitskopie.title, description: arbeitskopie.description, slug: arbeitskopie.slug, noindex: arbeitskopie.noindex, og_image: arbeitskopie.og_image, content: arbeitskopie.content });
      Object.assign(arbeitskopie, r.seite);
      geaendert = false;
      leere(fehlerbox);
      leere(statusZeile, badge(arbeitskopie.status, meta.status), aktionsKnoepfe());
      titelUeberschrift.textContent = arbeitskopie.title || `/${arbeitskopie.slug}`;
      melde(r.umbenannt ? `Gespeichert. ${r.alteAdresse} leitet jetzt auf /${arbeitskopie.slug} um.` : 'Gespeichert.');
      await aktualisiereVorschau();
    } catch (err) { leere(fehlerbox, fehlerBlock(err)); }
    finally { speichernKnopf.disabled = false; }
  });

  const loeschenKnopf = h('button', { type: 'button', class: 'knopf knopf--gefahr', onclick: () => seiteLoeschen(id, arbeitskopie, navigiere) }, T.seiteLoeschen);
  const titelUeberschrift = h('h1', {}, arbeitskopie.title || `/${arbeitskopie.slug}`);

  // Aus Notizen neu generieren (Stufe 4). Geschützte Status (edited/approved/published/archived)
  // fragen erst nach, bevor sie überschrieben werden (P5) — der Server prüft dasselbe noch einmal.
  const generierenNotizen = h('textarea', { rows: 4, maxlength: 20000, placeholder: 'z. B. Stichworte, ein Diktat, ein Transkript …' });
  const generierenFehlerbox = h('div', {});
  const generierenKnopf = h('button', { type: 'button', class: 'knopf knopf--leise' }, T.neuGenerieren);
  async function generiereJetzt(force) {
    generierenKnopf.disabled = true;
    try {
      const r = await api.post(`/pages/${id}/generieren`, { quelle: generierenNotizen.value, force });
      Object.assign(arbeitskopie, { content: r.seite.content, status: r.seite.status });
      geaendert = false;
      leere(generierenFehlerbox);
      zeichneBausteine();
      leere(statusZeile, badge(arbeitskopie.status, meta.status), aktionsKnoepfe());
      melde('Neu generiert. Bitte prüfen, bevor Sie freigeben.');
      await aktualisiereVorschau();
    } catch (err) {
      if (err.status === 409) {
        leere(generierenFehlerbox);
        const weiter = await bestaetige({ titel: 'Überschreiben?', gefahr: true, ok: 'Trotzdem generieren',
          text: `${err.message} Die bisherigen Bausteine gehen dabei verloren.` });
        if (weiter) return generiereJetzt(true);
      } else leere(generierenFehlerbox, fehlerBlock(err));
    } finally { generierenKnopf.disabled = false; }
  }
  generierenKnopf.addEventListener('click', () => generiereJetzt(false));
  const generierenBox = h('details', { class: 'baustein' },
    h('summary', {}, h('span', { class: 'baustein__label' }, T.generierenAbschnitt)),
    h('div', { class: 'felder' },
      h('div', { class: 'feld' }, h('label', {}, T.notizenLabel), generierenNotizen, h('p', { class: 'feld__hinweis' }, T.notizenHinweis)),
      generierenFehlerbox, generierenKnopf));

  const el = h('section', { class: 'ansicht ansicht--seite' },
    zurueck,
    h('div', { class: 'ansicht__kopf' }, titelUeberschrift, statusZeile),
    fehlerbox,
    h('div', { class: 'seite__raster' },
      h('div', { class: 'seite__spalte' },
        h('div', { class: 'feld' }, h('label', {}, 'Titel (im Browser-Tab und in Suchergebnissen)'), titelFeld),
        h('div', { class: 'feld' }, h('label', {}, 'Beschreibung (in Suchergebnissen)'), beschreibungFeld),
        h('div', { class: 'feld' }, h('label', {}, 'Adresse'), h('div', { class: 'feld__zeile' }, h('span', { class: 'feld__praefix' }, arbeitskopie.slug === 'start' ? '' : '/'), slugFeld)),
        h('label', { class: 'feld feld--zeile' }, noindexFeld, 'Nicht für Suchmaschinen (noindex)'),
        h('div', { class: 'feld' }, h('label', {}, 'Vorschaubild für soziale Netzwerke (optional)'), ogBox),
        h('h2', { class: 'seite__unterueberschrift' }, 'Inhalt'),
        generierenBox,
        bausteineWrapper,
        h('div', { class: 'seite__leiste' }, speichernKnopf, loeschenKnopf)),
      h('div', { class: 'seite__spalte seite__spalte--vorschau' }, vorschauGeraet, vorschauKnopf, vorschauHinweis, iframe)));

  aktualisiereVorschau();
  return el;
}

async function seiteLoeschen(id, seite, navigiere) {
  const { seiten, menue } = await api.get(`/pages/${id}/verweise`);
  const zielFeld = h('input', { type: 'text', placeholder: '/zieladresse', hidden: seite.status !== 'published' });
  const fehlerbox = h('div', {});
  const verweisListe = [...seiten.map((s) => `Seite „${s.title || s.slug}"`), ...menue.map((m) => `Menüpunkt „${m}"`)];
  const r = await dialog({
    titel: T.seiteLoeschen,
    inhalt: h('div', {},
      h('p', {}, `„${seite.title || seite.slug}" wirklich löschen?`),
      verweisListe.length ? h('div', { class: 'hinweis hinweis--warnung' }, h('p', {}, 'Darauf wird noch verwiesen:'), h('ul', {}, verweisListe.map((t) => h('li', {}, t)))) : null,
      seite.status === 'published' ? h('div', { class: 'feld' }, h('label', {}, 'Wohin soll die Adresse künftig weiterleiten?'), zielFeld) : null,
      fehlerbox),
    knoepfe: [{ text: T.abbrechen, aktion: () => null }, { text: T.endgueltigLoeschen, art: 'gefahr', aktion: async () => {
      try { await api.del(`/pages/${id}`, { redirect_to: zielFeld.value }); return true; }
      catch (err) { leere(fehlerbox, fehlerBlock(err)); return false; }
    } }],
  });
  if (r) { melde('Seite gelöscht.'); navigiere('seiten'); }
}
