# Entscheidungen

Stand: 21.09.2026 · Stufe 0 bestätigt, Stufe 1 und 2 gebaut
Quellen: `WEBSITE-MOTOR.md` (ki-native-website-motor.md), `docs/inhaltskonzept.md` (Word-Konzept vom 21.09.2026), CI-Skill „KI Trainerin Pieber", Visitenkarte, Portrait in `material/`.

**Weiche 1 — was bauen wir:** NEU. Die neue Seite ersetzt ki-trainerin-pieber.org auf derselben Domain. Die alte Seite ist eine einzelne Gamma-Seite (Server: gamma), also kein CMS-Bestand.
**Weiche 2 — worauf läuft es:** Bauen: A (Localhost + SQLite). Betrieb: C, IONOS-VPS mit Coolify. Der Server läuft bereits (bestätigt 21.09.). Datenbank im Betrieb: Postgres über Coolify (`DATABASE_URL`) oder SQLite auf dauerhaftem Volume, Entscheidung in Stufe 5. Domain-DNS: `ki-trainerin-pieber.org` zeigt heute auf Gamma und wird erst beim Livegang umgestellt. Die Subdomains `karin.` (Gamma-Seite hinter dem Karten-QR) und `kontakt.` (dort liegt die alte vCard) bleiben unverändert, bis bewusst entschieden wird.
**Entwicklung lokal:** Port 3100 (Docker belegt 3000). Die SQLite-Datei liegt außerhalb von iCloud Drive (`SQLITE_FILE` in `.env`), weil iCloud Datenbanken mitten im Schreiben synchronisiert. Node 24.

**Art der Website:** Selbstständige (Beraterin/Trainerin) mit Vortrags- und Workshopanteil
**Leser:** Eine Bereichsleiterin, Anfang 50, in Klinik, Behörde oder Bildungseinrichtung. Sie soll KI ins Team bringen und fürchtet Datenschutz- und Fachfehler.
**Die eine Handlung:** Erstgespräch anfragen (Kontaktformular, `/kontakt`). Alle Knöpfe der Seite führen dorthin, mit vorgewähltem Interesse. Nur ihre Beschriftung wechselt je Seite. Coaching und Trainings sind Navigation, kein zweiter auffälliger Knopf.
**Seiten zum Start:** Start · 1:1-KI-Coaching · Teamtrainings · Bildung und Lehre · Gesundheitswesen · Über mich · Kontakt, dazu Impressum und Datenschutz als Pflicht. Alle Texte liegen vor. Es sind nur fünf Seitentypen: Start, Angebot, Über mich, Kontakt, Rechtliches.
**URLs:** `/`, `/1-1-ki-coaching`, `/ki-trainings-teams`, `/ki-bildung-lehre`, `/ki-gesundheitswesen`, `/ueber-mich`, `/kontakt`, `/impressum`, `/datenschutz`
**Positionierung:** TÜV-zertifizierte KI-Trainerin für Menschen mit Verantwortung. Gesundheitswesen ist eine Unterseite, keine Begrenzung der Marke.
**Ansprache:** Sie, keine Emojis, kein Technikjargon, keine Zuverlässigkeitsversprechen für KI. Vermeiden: eintauchen, entdecken, enthüllen, umarmen. Die Textregeln kommen in `knowledge/voice.md`.
**Designrichtung:** CI „KI Trainerin Pieber" (warm, hell)
**Abweichung von der Vorlage:** entfällt (NEU). Abweichung vom Inhaltskonzept: Der Hauptknopf der Startseite heißt „Erstgespräch anfragen", nicht „1:1-KI-Coaching kennenlernen".
**Farben:** Grund `#FDFAF7` (Warm White) · Signal `#B5451B` (Terra) · Akzent `#2A5C4E` (Salbei, für Gesundheit und Kontaktkarte) · Fläche `#FAEADA` (Creme) · Text `#1C1511` · Gedämpft `#7A6B5A`. Nie reines Weiß als Grund. Alles als Token in `config/theme.json`.
**Schriften:** Cormorant Garamond (Überschriften) / DM Sans (Fließtext), lokal eingebunden, keine externen Dienste
**Anmutung:** warm, klar, verlässlich
**Logo:** Es gibt keine Logo-Datei, deshalb wurde eines gezeichnet: Sprechblase mit drei Punkten (die Punkte sind Löcher, funktioniert auf jedem Hintergrund) plus Wortmarke „KI Trainerin Pieber" in Cormorant Garamond 600, als Kurven gesetzt. Dateien in `public/logo/` (hell, hell mit Zusatzzeile, dunkel, Icon), Favicon und Apple-Touch-Icon in `public/`. Auf der Website liegt die Wortmarke als echter Text im Kopf, damit die Schrift greift. Jederzeit ersetzbar. Zusatzzeile: „TÜV-zertifizierte KI-Trainerin" (nicht mehr „Medizin & KI"). Kein BVAEB-Logo, keine Partnerlogos ohne Freigabe.
**Bild:** Portrait in `material/portrait-karin-pieber.webp` (Original), aufbereitet mit `npm run bild` zu WebP in 480, 800 und 1200 px unter `data/uploads/` (nicht im Repository, im Betrieb auf dem Volume). Gezeigt in einem Bogen mit Creme-Versatz. Der Fotohintergrund ist reines Weiß und bleibt es (Token `foto-grund`); ein Multiply-Trick gegen den warmen Seitengrund wurde verworfen, weil er im Test nicht zuverlässig zeichnete. Alt-Text Pflicht.
**QR-Code / „Kontakt speichern":** Wunsch: Der Scan speichert die Kontaktdaten direkt auf dem Smartphone. Auf `/kontakt` sitzt eine Kontaktkarte mit einem QR-Code, der die vCard selbst enthält (kein Umweg über eine Seite), und daneben ein Knopf „Kontakt speichern" (`.vcf`-Download) für den Telefon-Fall. Beides entsteht beim Rendern aus `config/facts.json` (P2), ist also immer aktuell. Umgesetzt und geprüft: der QR-Code auf `/kontakt` wurde mit dem System-Scanner gelesen und liefert exakt die Kurz-vCard inklusive „TÜV" (UTF-8, 57 × 57 Module). Die neue vCard nennt als Organisation die eigene Marke, nicht BVAEB/Koerting (die alte vCard tat das). Kein Foto in der vCard.
**Karten-QR (gedruckt):** Er verweist auf `https://karin.ki-trainerin-pieber.org` (Gamma-Seite „Kontakt & Links" mit Link zur alten vCard). Er funktioniert weiter, solange diese Subdomain bleibt. Bei einem Neudruck der Karte kann der neue vCard-QR aus `material/` genommen werden. Original: `material/qr-visitenkarte.svg`.

**Fakten (bereits vorhanden, gehören nach `config/facts.json`):** Mag. Karin Pieber · Haignitzhofweg 1, 8043 Graz · karin@ki-trainerin-pieber.org · +43 664 3116754 · linkedin.com/in/karin-pieber · TÜV Rheinland AI-Trainerin, gültig Februar 2025 bis Februar 2028 (Zertifikats-ID nicht öffentlich) · BVAEB seit März 2012 · in der österreichischen Sozialversicherung seit 1993, bestätigt am 21.09. („Seit 1993", fester Fakt statt einer Zahl; Content-Management, SEO, Gesundheitsprojekte) · Unternehmensgegenstand laut Impressumsentwurf. Steuernummer wird nicht veröffentlicht.
**Rechtsform (geklärt am 25.09.):** Neue Selbständige gemäß § 2 Abs. 1 Z 4 GSVG, nebenberuflich zur unselbständigen Tätigkeit (bestätigt durch Einkommensteuererklärung E1a-K/Kleinbetriebe für 2025). Damit entfallen im Impressum die Punkte Wirtschaftskammer/Fachgruppe und Gewerbebehörde — sie gelten nur bei Gewerbeschein. `config/facts.json:recht` trägt jetzt `status` (dieser Satz) statt `gewerbe`/`wko_fachgruppe`/`gewerbebehoerde`. **Nicht umsatzsteuerpflichtig** (Kleinunternehmerregelung, bestätigt am 25.09.) → keine UID, `recht.uid` bleibt bewusst leer, im Impressum steht dazu keine Zeile. **Nicht im Firmenbuch eingetragen** (bestätigt am 25.09.) → auch dazu keine Zeile, wie bei „sofern vorhanden"-Angaben nach § 5 ECG korrekt. Das Impressum ist damit inhaltlich vollständig und zeigt kein `[…]` (geprüft).
**Steuernummer (682786660):** bewusst **nicht** in `config/facts.json` oder sonst im Repository gespeichert und nicht im Impressum veröffentlicht — nur die UID-Nummer gehört dort hin (§5 ECG), die Steuernummer ist eine reine Finanzamt-Angabe ohne Offenlegungspflicht. Karin bewahrt sie selbst auf.
**Offene Fakten:** Hosting-Angaben für den Datenschutz (Serverstandort, Speicherdauer, Rechtsgrundlage bei IONOS) · Dienst und Speicherdauer fürs Kontaktformular · Preise (Vorgabe: „auf Anfrage") · aktuelle Rollenbezeichnung beim KI KOERTING INSTITUTE · Referenzen und Kundenstimmen (nur mit Freigabe) · Analytics (Vorgabe: keines) · rechtliche Prüfung von Impressum und Datenschutz vor dem Livegang

**Rechtliches:** Impressum und Datenschutz sind Arbeitsentwürfe. Sie werden rechtlich geprüft und mit den echten Hosting-Angaben ergänzt, bevor sie live gehen. Kein `[…]` auf einer öffentlichen Seite. Das Kontaktformular geht erst mit fertiger Datenschutzerklärung live.
**Umleitungen:** Die alte Seite ist eine Ein-Seiten-Gamma-Seite und ist nur in LinkedIn verlinkt. Gibt es dort eine Unterseite (z. B. für Ärzt:innen), kommt sie als 301 in die Tabelle, sonst entfällt die Liste.

## Umsetzung Stufe 2 (21.09.2026)

**Navigation (Daten, nicht Code):** Tabelle `navigation`, geladen aus `content/navigation.json`. Kopf: 1:1-KI-Coaching · Teamtrainings · Bildung und Lehre · Gesundheitswesen · Über mich, dazu der eine Knopf „Erstgespräch anfragen". Fuß zusätzlich: Start und Kontakt. Ab 1140 px steht das Menü in einer Zeile, darunter als Menü-Knopf. Zweite Ebene: Stufe 3.
**Knopfbeschriftungen:** Nur „Erstgespräch anfragen" ist der dominante Knopf. Auf den Angebotsseiten wechselt die Beschriftung mit dem Zusammenhang („Coaching anfragen", „Workshop anfragen" …), alle führen auf `/kontakt` und geben das Interesse mit (`?interesse=coaching|team|bildung|gesundheit`). Das Formular liest das in Stufe 3.
**Textänderungen gegenüber dem Konzept:** Erfahrung „Seit 1993" statt „über 20 Jahre". Auf „Über mich" steht der Satz „Meine Coachings und Trainings sind ein eigenständiges Angebot und kein Angebot der BVAEB." Er wurde ergänzt, um die Trennung klar zu machen. Bitte bestätigen oder streichen.
**Bausteine:** nav, hero (mit Portrait), richtext (Flächen: grund, creme, mint), cards, schritte, faq, person, kontaktkarte, cta, footer. Ein neuer Seitentyp ist ein Ordner unter `page-types/`.
**Goldreferenz:** `page-types/home/golden.html` und `golden.json` (`npm run golden`).
**Noch nicht drin, bewusst:** Kontaktformular, Cockpit, Medien-Upload, Sitemap/robots, Open-Graph-Bilder, strukturierte Daten (Stufe 3 und 5). Das Impressum und die Datenschutzerklärung zeigen bis dahin sichtbar `[…]` für offene Angaben.

## Umsetzung Stufe 3 (24.09.2026) — das Cockpit

**Prüfstein bestanden:** Anlegen, ins Menü hängen, Bild einsetzen, veröffentlichen, umbenennen, löschen, Anfrage empfangen, Preis ändern — alles unter `/cockpit`, ohne Entwickler. Manuell im Browser durchgespielt: Login, Seite bearbeiten mit Live-Vorschau, Umleitung anlegen → sofort live geprüft (301 auf `/kontakt`) → über die Oberfläche wieder gelöscht → geprüft, dass sie weg ist.

**Login:** Passwort aus `ADMIN_PASSWORD` (Umgebung, nie Code). Signiertes Cookie (HttpOnly, SameSite=Strict), 12 Stunden gültig, Geheimnis aus dem Passwort abgeleitet — ein Passwortwechsel meldet alte Sitzungen automatisch ab. Acht Fehlversuche je Adresse sperren für 15 Minuten. Jede schreibende Anfrage verlangt zusätzlich den Header `X-Cockpit: 1`, den eine fremde Seite nicht setzen kann — zweite Hürde neben SameSite.

**Seiten:** `src/pages.js` kapselt die Statuskette (P5) als benannte Aktionen (freigeben, veröffentlichen, zurückziehen, archivieren, wiederherstellen) mit festen Von-Zuständen. Veröffentlichen prüft serverseitig: Titel, Beschreibung, genau eine `<h1>`, Alt-Text auf jedem Bild, alle im Text verwendeten Fakten vorhanden (sonst genaue Fehlerliste, nichts wird veröffentlicht). Umbenennen einer veröffentlichten Seite legt ungefragt eine 301 an und zieht Menüpunkte automatisch mit (`src/pages.js:speicherePage`). Löschen einer veröffentlichten Seite verlangt ein Umleitungsziel und zeigt vorher, welche Seiten und Menüpunkte noch verweisen (`verweiseAuf`).

**Formulare aus dem Schema:** `admin/felder.js` liest `block.schema` (dieselbe Quelle wie der Renderer) und baut das Formular automatisch, inklusive verschachtelter Listen (Karten, Schritte, FAQ). Ein neues Feld in einem Baustein braucht keine Cockpit-Änderung.

**Inhalt wird serverseitig gesäubert**, nicht nur im Browser: `src/content.js:bereinigeInhalt` erlaubt nur bekannte Bausteine und nur Felder aus deren Schema, erzwingt die Typen (`text`/`longtext`/`select`/`image`/`list`), Bildfelder nur als `/uploads/…`. Das gilt für Speichern und für die Vorschau gleichermaßen.

**Navigation:** zwei Ebenen (dritte wird serverseitig abgelehnt), je Zeile „Kopf“/„Fuß“/„beide“. Zeigt ein Punkt auf eine nicht veröffentlichte oder unbekannte Seite, warnt das Cockpit direkt in der Zeile, die Seite selbst verbirgt den Link automatisch (`src/site.js:filtereBaum`).

**Medien:** Alt-Text ist Pflicht (< 3 Zeichen wird abgelehnt), SVG ist bewusst nicht erlaubt (kann Skript enthalten), gleicher Bildinhalt ergibt dieselbe Datei (Hash im Namen), ein noch verwendetes Bild lässt sich nicht löschen (`bildVerwendung` listet die Fundstellen).

**Formular (`/form/anfrage`):** Honigtopf-Feld, fünf Anfragen pro Stunde und Adresse, erst Speichern dann Mail (Mail optional über `SMTP_URL`, scheitert sie, bleibt die Anfrage erhalten und wird laut protokolliert). Ohne `facts.kontaktformular.speicherdauer` nimmt das Formular gar nichts an — die Kontaktseite zeigt dann direkt die E-Mail-Adresse. Läuft ohne JavaScript (POST + 303 auf `/danke`) und mit (fetch, Erfolgsmeldung ohne Neuladen).

**Fakten ohne Deploy:** `src/facts.js` mischt Datei und Datenbank-Override tief (`tiefMischen`) statt flach zu überschreiben — genau die Falle aus Stufe 3.8 der Anleitung ist damit ausgeschlossen: ein neues Feld nur in der Datei erscheint trotzdem. Im Cockpit zeigt ein Feld sichtbar „im Cockpit geändert“, ein Klick setzt es auf den Dateiwert zurück.

**SEO/P6:** `sitemap.xml` und `robots.txt` entstehen bei jedem Aufruf aus der Datenbank (keine Datei, kein Leeren nötig), listen nur Veröffentlichtes ohne `noindex`. Open-Graph-Bild optional je Seite. Nichts davon blockiert eine Veröffentlichung.

**Cockpit-Oberfläche:** Vanilla JS ohne Build-Schritt (`admin/`), eigenes CSS mit denselben CI-Werten wie die Website (kein gemeinsamer Import, siehe Kommentar in `cockpit.css` — bei einer Farbänderung beide Orte prüfen). `/cockpit` liefert nie gecachtes HTML, Skript- und Stilverweise tragen eine Version aus dem Änderungsdatum der Dateien.

**Getestet:** 72 automatisierte Tests (`node --test`), davon 33 neu für Stufe 3 (Login, Rate-Limit, Statuskette, Umbenennen/Löschen mit Umleitung, Navigation, Medien, Formular, Fakten-Mischung, Cockpit-Auslieferung). Zusätzlich im Browser durchgeklickt (siehe oben).

## Betrieb: Bestandsaufnahme des IONOS-VPS (25.09.2026)

**Auf der Domain `ki-trainerin-pieber.org` läuft bereits eine andere Website** — ein eigenständiges Projekt, das Karin mit einer anderen KI gebaut hat (Astro, statischer Build, eigenes Design, kein Cockpit, keine Datenbank). Sie ist **nicht** Teil dieses Projekts und wird von diesem Motor nicht angerührt.

**Der IONOS-VPS trägt beides:** IP `31.70.108.17`, Rechenzentrum Deutschland/Berlin (Whois: `de-ber-rs-ionos-cloud-txl`). Coolify läuft dort bereits und ist erreichbar (`http://31.70.108.17:8000`, bestätigt über den `coolify_session`-Cookie) — die Infrastruktur für Weg C ist also vorhanden, ohne dass etwas neu aufgesetzt werden muss. Mail läuft ebenfalls über IONOS (MX `mx00/mx01.ionos.de`, SPF `_spf-eu.ionos.com`) — die Mailbox `karin@ki-trainerin-pieber.org` kann später direkt per SMTP fürs Kontaktformular genutzt werden.

**Reihenfolge, von Karin bestätigt (25.09.):** Erst Stufe 4 fertig bauen, danach erst live gehen. Bis dahin bleibt die Astro-Seite unverändert die aktive Website unter der Hauptdomain.

**Plan für den Livegang (Stufe 5), damit die bestehende Astro-Seite als Sicherheitsnetz erhalten bleibt:**
1. Unseren Motor zuerst unter einer Subdomain deployen (z. B. `neu.` oder `vorschau.ki-trainerin-pieber.org`), die Astro-Seite bleibt auf der Hauptdomain unangetastet.
2. Erst wenn Karin zufrieden ist: die Astro-Seite auf eine eigene Adresse umziehen (z. B. `archiv.ki-trainerin-pieber.org`) statt sie zu löschen — sie bleibt dort unverändert erreichbar, ein echtes Fallback, kein bloßes Datei-Backup.
3. Danach die Hauptdomain auf unseren Motor umstellen.
4. Zusätzlich vor der Umstellung: ein IONOS-Snapshot des gesamten Servers (IONOS-Cloud-Panel → Server → Snapshots) als unabhängiger Rückspul-Punkt.
5. Quellcode der Astro-Seite liegt zusätzlich auf GitHub (bestätigt 25.09.) — das Sicherheitsnetz ist damit doppelt: laufende Kopie auf `archiv.…` plus Quellcode unabhängig vom Server.

**Datenschutz-Fakten, damit geklärt:** `hosting.standort` = „Deutschland (Berlin)", `hosting.anbieter` = „IONOS" (schon gesetzt), `kontaktformular.dienst` = „IONOS-Mailbox (karin@ki-trainerin-pieber.org) per SMTP". Speicherdauer der Zugriffs-Logs ist keine Fakten-Recherche, sondern eine Entscheidung — Vorschlag weiterhin 7 Tage, noch nicht von Karin bestätigt.
