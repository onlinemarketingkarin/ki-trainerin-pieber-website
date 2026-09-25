import { h } from './h.js';
import { T } from './labels.js';

/**
 * Jeder Ablauf, den ein Mensch von Hand macht, mit den echten Knopfnamen aus labels.js.
 * Ändert ein Commit einen Knopf, wird dieser Text im selben Commit mitgezogen (Stufe 3.6).
 */
const eintraege = [
  {
    titel: 'Eine neue Seite anlegen',
    wann: 'Ein neues Angebot, eine neue Unterseite.',
    schritte: [
      `„${T.menue.seiten}" öffnen, dann „+ ${T.neueSeite}".`,
      'Seitentyp und Titel wählen. Die Adresse wird aus dem Titel vorgeschlagen.',
      `„${T.seiteAnlegen}" klicken. Die Seite entsteht als Entwurf mit den Pflichtbausteinen des Typs.`,
      `Inhalte in den Bausteinen ausfüllen, mit „${T.vorschauAktualisieren}" prüfen, dann „${T.speichern}".`,
    ],
    tut: ['Der Motor legt die Pflichtbausteine des Seitentyps von allein an.', 'Solange die Seite ein Entwurf ist, sieht sie niemand außer Ihnen.'],
    fallstricke: [`Eine Seite wird erst mit „${T.veroeffentlichen}" öffentlich sichtbar, auch wenn sie schon vollständig aussieht.`],
  },
  {
    titel: 'Eine Seite ins Menü hängen',
    wann: 'Eine neue oder bestehende Seite soll über die Navigation erreichbar sein.',
    schritte: [
      `„${T.menue.navigation}" öffnen.`,
      `„${T.linkHinzu}" klicken, Beschriftung eintragen, im Feld „Ziel" die Adresse eingeben (ein Vorschlag erscheint beim Tippen).`,
      'Kopf, Fuß oder beides wählen.',
      `„${T.menueSpeichern}" klicken.`,
    ],
    tut: ['Zeigt ein Menüpunkt auf eine Seite, die nicht veröffentlicht ist, erscheint eine Warnung direkt darunter.'],
    fallstricke: ['Ein Untermenüpunkt kann selbst kein weiteres Untermenü haben. Zwei Ebenen reichen.'],
  },
  {
    titel: 'Ein Bild einsetzen',
    wann: 'Ein Bausteinfeld vom Typ Bild (zum Beispiel im Aufmacher einer Seite).',
    schritte: [
      `Im Bausteinfeld „${T.bildWaehlen}" klicken.`,
      `Ein vorhandenes Bild anklicken, oder unter „${T.bildHochladen}" eine neue Datei mit Bildbeschreibung hochladen.`,
      'Die Beschreibung ist Pflicht: sie wird vorgelesen, wenn jemand die Seite nicht sehen kann.',
    ],
    tut: ['Der Motor erzeugt automatisch drei Bildgrößen als WebP.', 'Wird dieselbe Datei erneut hochgeladen, entsteht kein zweites Bild.'],
    fallstricke: ['Ein Bild, das noch irgendwo eingesetzt ist, lässt sich nicht löschen. Zuerst dort ein anderes Bild wählen.'],
  },
  {
    titel: 'Eine Seite veröffentlichen',
    wann: 'Ein Entwurf ist fertig.',
    schritte: [`Seite öffnen, „${T.veroeffentlichen}" klicken.`],
    tut: ['Der Motor prüft: Titel, Beschreibung, genau eine Hauptüberschrift, Alt-Text bei allen Bildern, alle verwendeten Fakten vorhanden. Fehlt etwas, erscheint eine genaue Liste, und es wird nichts veröffentlicht.'],
    fallstricke: [`„${T.zurueckziehen}" macht eine veröffentlichte Seite wieder unsichtbar, ohne sie zu löschen.`],
  },
  {
    titel: 'Eine Seite umbenennen',
    wann: 'Die Adresse (der Slug) soll sich ändern.',
    schritte: ['Seite öffnen, im Feld „Adresse" den neuen Wert eintragen, speichern.'],
    tut: ['War die Seite veröffentlicht, legt der Motor ungefragt eine Weiterleitung (301) von der alten auf die neue Adresse an. Menüpunkte, die auf die Seite zeigten, ziehen automatisch mit.'],
    fallstricke: ['Die Adresse der Startseite lässt sich nicht ändern.'],
  },
  {
    titel: 'Eine Seite löschen',
    wann: 'Eine Seite wird endgültig nicht mehr gebraucht.',
    schritte: [`Seite öffnen, „${T.seiteLoeschen}" klicken.`, 'War die Seite veröffentlicht, nach der Zieladresse fragen, wohin die alte Adresse künftig weiterleiten soll.'],
    tut: ['Vor dem Löschen zeigt das Cockpit, welche Menüpunkte und Seiten auf diese Seite verweisen.'],
    fallstricke: ['Ohne Zieladresse lässt sich eine veröffentlichte Seite nicht löschen, sonst würde ein alter Link ins Leere laufen.'],
  },
  {
    titel: 'Eine Anfrage empfangen und beantworten',
    wann: 'Jemand hat das Kontaktformular abgeschickt.',
    schritte: [`„${T.menue.anfragen}" öffnen. Ungelesene Anfragen sind hervorgehoben.`, `„${T.antworten}" öffnet eine E-Mail an die Absenderin oder den Absender.`],
    tut: ['Die Anfrage steht hier auch dann, wenn der Mailversand nicht eingerichtet ist oder gerade klemmt.'],
    fallstricke: ['Solange unter „Fakten" das Feld „Speicherdauer der Anfragen" leer ist, nimmt das Formular gar keine Anfragen an. Die Website zeigt dann stattdessen die E-Mail-Adresse direkt an.'],
  },
  {
    titel: 'Einen Preis ändern',
    wann: 'Ein Preis oder ein anderer Fakt soll sich ändern, ohne dass jemand Code anfasst.',
    schritte: [`„${T.menue.fakten}" öffnen, Wert ändern, „${T.faktenSpeichern}".`],
    tut: ['Die Änderung steht sofort auf der Website, ganz ohne Deploy.'],
    fallstricke: ['Die Datei bleibt der Grundstock. Das Cockpit überschreibt nur, was Sie dort ändern — ein neues Feld, das nur die Datei kennt, erscheint trotzdem.'],
  },
];

export function handbuchAnsicht() {
  return h('section', { class: 'ansicht ansicht--handbuch' }, h('h1', {}, T.menue.handbuch),
    h('p', { class: 'ansicht__hinweis' }, 'Jeder Ablauf, den Sie von Hand machen — mit den echten Knopfnamen.'),
    eintraege.map((e) => h('details', { class: 'handbuch__eintrag' },
      h('summary', {}, e.titel),
      h('p', { class: 'handbuch__wann' }, h('strong', {}, 'Wann: '), e.wann),
      h('ol', {}, e.schritte.map((s) => h('li', {}, s))),
      e.tut?.length ? h('div', { class: 'handbuch__tut' }, h('strong', {}, 'Das macht die App von allein:'), h('ul', {}, e.tut.map((t) => h('li', {}, t)))) : null,
      e.fallstricke?.length ? h('div', { class: 'handbuch__fallstrick' }, h('strong', {}, 'Fallstricke:'), h('ul', {}, e.fallstricke.map((f) => h('li', {}, f)))) : null)));
}
