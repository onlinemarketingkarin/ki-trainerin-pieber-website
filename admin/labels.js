/**
 * Alle Beschriftungen, die das Cockpit zeigt. Oberfläche UND Handbuch lesen sie von hier,
 * damit in der Anleitung immer die echten Knopfnamen stehen.
 */
export const T = {
  titel: 'Cockpit',
  menue: { seiten: 'Seiten', navigation: 'Navigation', medien: 'Medien', anfragen: 'Anfragen', umleitungen: 'Umleitungen', fakten: 'Fakten', handbuch: 'Handbuch' },
  anmelden: 'Anmelden', abmelden: 'Abmelden', passwort: 'Passwort',
  abbrechen: 'Abbrechen', schliessen: 'Schließen', ok: 'OK',
  neueSeite: 'Neue Seite', seiteAnlegen: 'Seite anlegen',
  speichern: 'Speichern',
  freigeben: 'Freigeben', veroeffentlichen: 'Veröffentlichen', zurueckziehen: 'Zurückziehen', archivieren: 'Archivieren', wiederherstellen: 'Wiederherstellen',
  seiteLoeschen: 'Seite löschen', endgueltigLoeschen: 'Endgültig löschen',
  bausteinHinzu: 'Baustein hinzufügen', eintragHinzu: 'Eintrag hinzufügen',
  bildWaehlen: 'Bild wählen', bildEntfernen: 'Bild entfernen', bildHochladen: 'Bild hochladen',
  vorschauAktualisieren: 'Vorschau aktualisieren', vorschauComputer: 'Computer', vorschauTelefon: 'Telefon',
  bearbeiten: 'Bearbeiten', vorschau: 'Vorschau',
  insMenue: 'Ins Menü', linkHinzu: 'Link hinzufügen', menueSpeichern: 'Menü speichern',
  alsGelesen: 'Als gelesen markieren', alsUngelesen: 'Als ungelesen markieren', antworten: 'Antworten', loeschen: 'Löschen',
  umleitungAnlegen: 'Umleitung anlegen',
  faktenSpeichern: 'Fakten speichern', zuruecksetzen: 'Auf Grundwert zurücksetzen',
  hoch: 'Nach oben', runter: 'Nach unten', entfernen: 'Entfernen', untermenue: 'Ins Untermenü', ausUntermenue: 'Aus dem Untermenü',
  notizenLabel: 'Notizen, Stichworte oder Transkript (optional)',
  notizenHinweis: 'Wird das ausgefüllt, füllt die KI daraus die Bausteine. Das Ergebnis landet als „Generiert" — geprüft und freigegeben wird es erst von Ihnen.',
  neuGenerieren: 'Neu generieren', generierenAbschnitt: 'Aus Notizen neu generieren',
};

/** Muss zu src/mail.js INTERESSEN passen. Der Browser kann src/ nicht laden, deshalb steht es hier noch einmal. */
export const INTERESSEN = { coaching: '1:1-Coaching', team: 'Teamtraining', bildung: 'Bildung und Lehre', gesundheit: 'Gesundheitswesen', vortrag: 'Vortrag' };

/** Lesbare Namen für die Fakten. Was hier fehlt, erscheint unter seinem Schlüssel. */
export const FAKTEN = {
  gruppen: {
    '': 'Allgemein', person: 'Person', anschrift: 'Anschrift', zertifikat: 'Zertifikat', beruf: 'Beruf', koerting: 'KI KOERTING INSTITUTE',
    referenzen: 'Referenzen', recht: 'Rechtliches (Impressum)', preise: 'Preise', hosting: 'Hosting (Datenschutz)', kontaktformular: 'Kontaktformular (Datenschutz)',
  },
  felder: {
    name: 'Name mit Titel', marke: 'Markenname', titel: 'Berufsbezeichnung', email: 'E-Mail', telefon: 'Telefon', web: 'Website', linkedin: 'LinkedIn-Adresse', orte: 'Wo', sprachen: 'Sprachen',
    'person.vorname': 'Vorname', 'person.nachname': 'Nachname', 'person.titel_vor': 'Titel vor dem Namen',
    'anschrift.strasse': 'Straße und Hausnummer', 'anschrift.plz': 'Postleitzahl', 'anschrift.ort': 'Ort', 'anschrift.land': 'Land',
    'zertifikat.stelle': 'Ausstellende Stelle', 'zertifikat.gueltig_von': 'Gültig von', 'zertifikat.gueltig_bis': 'Gültig bis',
    'beruf.sozialversicherung_seit': 'In der Sozialversicherung seit (Jahr)', 'beruf.bvaeb_seit': 'BVAEB seit',
    'koerting.rolle': 'Rolle', 'koerting.organisation': 'Organisation (Name, Ort)', 'koerting.programme': 'Programmnamen', 'koerting.seit': 'Tätig seit', 'koerting.kohorten_pro_jahr': 'Kohorten pro Jahr (Zahl)',
    'referenzen.zahnklinik_organisation': 'Zahnklinik: Organisation', 'referenzen.zahnklinik_seit': 'Zahnklinik: Zusammenarbeit seit',
    'referenzen.zahnklinik_trainings_anzahl': 'Zahnklinik: Anzahl Trainings (Zahl)', 'referenzen.zahnklinik_tool_url': 'Zahnklinik: Workshop-Tool (Link)',
    'recht.status': 'Rechtsform (Gewerbe/Kammer)', 'recht.uid': 'UID-Nummer (nur bei Umsatzsteuerpflicht)', 'recht.gegenstand': 'Unternehmensgegenstand',
    'preise.starter': 'Preis 1:1 KI Starter', 'preise.programm': 'Umfang und Preis Kompetenzprogramm',
    'hosting.anbieter': 'Hostinganbieter', 'hosting.standort': 'Serverstandort', 'hosting.speicherdauer': 'Speicherdauer der Zugriffsdaten', 'hosting.rechtsgrundlage': 'Rechtsgrundlage',
    'kontaktformular.dienst': 'Dienst für den Mailversand', 'kontaktformular.speicherdauer': 'Speicherdauer der Anfragen',
  },
  hinweise: {
    'kontaktformular.speicherdauer': 'Solange dieses Feld leer ist, nimmt das Anfrageformular keine Anfragen an. Tragen Sie es erst ein, wenn die Datenschutzerklärung dazu stimmt.',
    'recht.status': 'Beschreibt, warum kein Gewerbeschein und keine Wirtschaftskammer-Pflichtmitgliedschaft im Impressum stehen. Ändert sich das (z. B. Gewerbeschein), diesen Text und den Impressum-Baustein anpassen.',
    'recht.uid': 'Nur ausfüllen, wenn eine UID-Nummer besteht (umsatzsteuerpflichtig). Das Feld wird aktuell im Impressum nicht angezeigt; bei Bedarf eine Zeile im Baustein „Textabschnitt" ergänzen.',
    'beruf.sozialversicherung_seit': 'Daraus wird die Zahl der Jahre gerechnet, nie getippt.',
  },
};
