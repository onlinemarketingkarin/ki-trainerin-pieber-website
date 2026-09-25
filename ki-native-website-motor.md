# Der Website-Motor

**Bauanleitung für eine KI-native Website — ohne WordPress, ohne Webflow, ohne Page-Builder.**

---

## 0 · Was dieses Dokument ist

Dieses Dokument richtet sich an **Claude Code in einem leeren Projekt**. Wer es liest, baut damit eine vollständige, öffentlich erreichbare Website — Motor, Redaktion und Gestaltung — im Gespräch mit einem Menschen, der kein Entwickler sein muss.

**So wird es benutzt:**

1. Leeres Verzeichnis anlegen, dieses Dokument als `WEBSITE-MOTOR.md` hineinlegen.
2. Claude Code starten und sagen: *„Lies WEBSITE-MOTOR.md und fang bei Stufe 0 an."*
3. Die Fragen aus Stufe 0 beantworten. Danach baut Claude.

**An Claude:** Arbeite die Stufen der Reihe nach ab. Überspringe Stufe 0 nicht — ohne die Antworten baust du ins Blaue. Jede Stufe endet mit etwas, das der Mensch im Browser sehen kann. Zeig es ihm, bevor du weitergehst.

**Zwei Weichen entscheiden alles Weitere.** Stelle beide in Stufe 0, schreib die Antworten in `docs/entscheidungen.md` und beziehe dich in späteren Stufen darauf:

| | Frage | Wege |
|---|---|---|
| **Weiche 1** | Was bauen wir? | **NEU** · **NACHBAU** einer bestehenden Website |
| **Weiche 2** | Worauf läuft es? | **A** Localhost + SQLite · **B** VPS + Postgres · **C** deine vorhandene Infrastruktur |

Schreibe am Ende von Stufe 1 eine `CLAUDE.md` ins Projekt, die auf dieses Dokument **und auf `docs/entscheidungen.md`** verweist. Dann versteht jede spätere Session, warum das System so gebaut ist und wofür.

---

# Teil I — Die Seele

Diesen Teil musst du verstanden haben, bevor du eine Zeile schreibst. Er ist der Grund, warum das Ergebnis trägt, und nicht Zierde.

## Der Unterschied, um den es geht

**KI-first** heißt: du behältst deine Werkbank und stellst die KI davor. Sie schreibt den Text, ein Mensch kopiert ihn ins CMS, zieht Blöcke zurecht, setzt das Bild, drückt auf Veröffentlichen. Die KI ist ein sehr schneller Texter. Der Engpass bleibt die Hand im Editor.

**KI-native** heißt: die Werkbank fällt weg. Es gibt keinen Editor, in den jemand etwas hineinzieht. Die KI liefert das Einzige, was das System frisst — **strukturierte Daten gegen einen Vertrag** — und alles danach passiert deterministisch.

Der Prüfstein ist banal:

> **Nimm die KI weg. Was passiert?**
> KI-first: es wird langsamer.
> KI-native: es steht still.

Und die Gegenprobe:

> **Nimm den Menschen weg. Was passiert?**
> Es läuft weiter — aber niemand entscheidet mehr.
> Genau dafür gibt es die Tore in Stufe 5.

## Die sieben Prinzipien

### P1 · Form im Code, Inhalt aus der KI

Die KI produziert **niemals HTML**. Sie produziert JSON gegen ein Schema:

```json
{ "type": "hero", "data": { "pill": "…", "titel": "…", "sub": "…", "ctaLabel": "…" } }
```

Der Renderer ist eine **reine Funktion**: gleiche Daten, gleiches HTML, immer. Ein Baustein ist eine Datei mit vier Dingen — Schema, Vorgaben, `render()`, CSS.

*Warum das alles trägt:* weil du dem Modell damit nicht vertrauen musst. Es kann keine Farbe falsch wählen, kein Layout zerschießen, keine fremde Schrift einschleppen. Es füllt Felder aus, die vorher jemand definiert hat. Gestaltung ist nicht Verhandlungssache, sie ist Code. **Deshalb darf das Ergebnis ohne Layout-Kontrolle öffentlich werden.**

Wenn du dich je dabei ertappst, die KI HTML schreiben zu lassen: du baust gerade KI-first.

### P2 · Fakten kommen nie aus dem Modell

Preise, Termine, Adressen, Links, Impressum stehen in **einer** Datei: `config/facts.json`. Ein Tor stempelt sie beim Rendern in die Seite. Die KI darf formulieren — sie darf keine Zahl behaupten. Fehlt ein Wert, erscheint sichtbar `[…]` statt einer Erfindung.

*Warum:* halluzinierte Prosa ist peinlich. Ein halluzinierter Preis ist ein Rechtsproblem. Diese eine Regel trennt ein Spielzeug von etwas, das ein Geschäft tragen kann.

### P3 · Eine Quelle, viele Ansichten

Eine Übersichtsseite **speichert keine Liste**. Sie ist eine Abfrage, die bei jedem Aufruf den Bestand liest. Neuer Beitrag → er steht drin, ohne dass jemand die Übersicht anfasst. Zahlen in Texten werden gerechnet, nie getippt: `{n} Beiträge` statt `21 Beiträge`. Eine getippte Zahl ist nächste Woche falsch.

### P4 · Goldreferenz vor Generator

Für jeden neuen Seitentyp gilt diese Reihenfolge:

1. **Eine Seite von Hand perfekt machen** (`golden.html`) — mit echtem Inhalt, nicht mit Lorem Ipsum.
2. Erst dann den Generator bauen.
3. Das Ergebnis des Generators gegen die Goldreferenz abnehmen.

*Warum:* eine KI, die gegen ein unklares Ziel generiert, produziert unendlich viele mittelmäßige Varianten. Eine KI, die ein perfektes Beispiel nachbauen soll, trifft.

### P5 · Die Statuskette ist heilig

```
draft → generated → edited → approved → published → archived
```

Was ein Mensch von Hand geändert hat (`edited`), wird bei einer Neugenerierung **nicht** überschrieben. Regeneration braucht ein ausdrückliches Force. Nichts ist ärgerlicher, als eine mühsam redigierte Seite an einen Modell-Lauf zu verlieren.

### P6 · Nichts blockiert die Veröffentlichung

SEO, Bilder, Social-Vorschauen, Analytics laufen als **austauschbare Schichten** mit. Ist eine davon nicht erreichbar, erscheint die Seite trotzdem. Eine fehlende Kachel hält nichts auf — der Beitrag erscheint eben ohne Bild.

*Warum:* ein KI-natives System, das an einer Nebensache hängenbleibt, ist ein KI-first-System mit besserer PR. Der Mensch würde wieder eingreifen müssen, und genau das wolltest du abschaffen.

### P7 · Sofort öffentlich

Publizierte Seiten liegen unter festen URLs. Kein Build-Schritt, kein Deploy-Ritual zwischen „fertig" und „sichtbar". Was freigegeben ist, ist da.

## Der Zustand lebt an einem Ort, den ein Mensch sehen kann

Wenn du eine Redaktions-Strecke baust (Beiträge, die geprüft, geplant und veröffentlicht werden): mach den Zustand **sichtbar**, nicht zu einem Feld in einer Datenbank.

Ein bewährtes Muster: **der Ordner ist der Zustand.**

```
40_In_Auswahl  →  50_Ausgewaehlt  →  55_Geplant  →  56_Veroeffentlicht
                        ↘ 52_Geparkt      ↘ 60_Ausschuss
```

Ein Mensch sieht im Dateimanager, wo etwas steht, und kann es per Drag-and-drop korrigieren. Keine Workflow-Engine, kein Statusfeld, das nur die Anwendung kennt. Und wenn eine zweite KI-Pipeline zuliefert, ist die Übergabe **eine Datei plus eine Regel**: *ab Stufe 40 fasst der Zulieferer nichts mehr an.*

Diese Grenze ist das Wertvollste am ganzen Aufbau: zwei getrennte Systeme arbeiten zusammen, ohne sich zu kennen.

---

# Teil II — Der Bau

## Stufe 0 · Das Gespräch

**An Claude: stelle diese Fragen, bevor du irgendetwas baust.** Stelle sie in Gruppen, nicht alle auf einmal. Wenn der Mensch bei einer Frage zögert, mach einen Vorschlag und lass ihn widersprechen — ein Vorschlag ist leichter zu beurteilen als eine leere Frage.

### Weiche 1 — neu bauen oder Bestehendes nachbauen?

Stelle diese Frage **zuerst**, sie ändert den ganzen Ablauf:

> *„Gibt es die Website schon — und soll sie nachgebaut werden? Oder entsteht sie neu?"*

**Weg NEU.** Es gibt nichts oder fast nichts. Du gehst durch Gruppe 1 bis 4 und erfindest gemeinsam.

**Weg NACHBAU.** Es gibt eine Website — die eigene, die eines Verbands, eines Mitbewerbers, ein Vorbild. Sie soll KI-nativ neu entstehen: gleiche Substanz, neuer Motor. Das ist der häufigere Fall und der schnellere, weil Struktur, Texte und Gestaltung schon Entscheidungen sind, die jemand getroffen hat.

Beim Nachbau schiebt sich **Stufe 0b** dazwischen (siehe unten). Gruppe 1 bis 4 füllst du danach trotzdem aus — aber mit Antworten, die du aus der Vorlage *abgeleitet und bestätigt* hast, statt sie zu erfragen.

> **Sag dem Menschen einen Satz zum Urheberrecht, bevor du anfängst.** Struktur, Seitenaufteilung und Funktionsweise darf man sich abschauen. **Texte, Fotos und Logo einer fremden Website darf man nicht übernehmen.** Bei der eigenen alten Website ist alles erlaubt. Bei einer fremden gilt: Aufbau als Vorbild, Inhalte neu. Frag ausdrücklich, welcher Fall vorliegt, und halte dich daran — auch wenn der Mensch es lockerer sieht.

### Gruppe 1 — Was ist das für eine Website?

Die wichtigste Frage, und die am häufigsten übersprungene. Der Typ bestimmt alles Weitere: die Seitenarten, die Bausteine, die eine Handlung.

Biete Beispiele an, damit der Mensch sich verorten kann:

| Typ | Die eine Handlung | Typische Unterseiten |
|---|---|---|
| **Selbstständiger / Berater** | Termin buchen | Über mich, Angebot, Referenzen, Kontakt |
| **Redner / Speaker** | Anfragen | Themen/Vorträge, Über mich, Referenzen, Medien, Kontakt |
| **Verband / Verein** | Mitglied werden | Über uns, Mitgliedschaft, Termine, Vorstand, Presse |
| **Unternehmen (B2B)** | Gespräch vereinbaren | Leistungen, Branchen, Fallstudien, Team, Karriere |
| **Shop / Produkte** | Kaufen | Sortiment, Produktseiten, Versand, Über uns |
| **Publikation / Blog** | Abonnieren | Beiträge, Archiv, Über, Newsletter |

Frage danach nach:

- **Wer soll die Seite lesen?** Eine Person, keine Zielgruppe. „Die Personalleiterin eines Mittelständlers mit 200 Leuten" ist brauchbar, „Entscheider" nicht.
- **Was soll diese Person tun?** Genau **eine** Handlung. Nicht drei. Alles andere ist nachrangig und bekommt nie einen auffälligen Knopf.
- **Was gibt es schon?** Eine alte Website, Texte, Logo, Bilder, ein Buch, ein Podcast? Alles, was existiert, spart eine Erfindung.
- **Wie viele Seiten zum Start?** Halte es klein. **Fünf Seiten, die stehen, schlagen zwanzig halbe.** Erweitert wird später und ist billig.

### Gruppe 2 — Wie soll es aussehen?

**Diese Gruppe verzweigt nach Weiche 1. Frag nicht dasselbe in beiden Fällen.**

#### Bei NEU — das ist die Gruppe, in der du dir Zeit nimmst

Gibt es ein Corporate Design, frag danach und **nimm es genau**: Farben als Hex-Werte, Schriftdateien, Logo als SVG, ein Handbuch falls vorhanden. Dann bist du hier fertig.

Gibt es keines — der häufigere Fall —, dann **frag nicht nach Farben.** Die meisten Menschen können nicht sagen, welches Blau sie wollen, aber jeder kann sagen, was falsch wäre. Stell drei Fragen, die keine Gestaltungskenntnis verlangen:

1. **„Wenn jemand deine Seite zehn Sekunden ansieht und wieder weggeht — welches Wort soll ihm im Kopf bleiben?"** (*solide · schnell · teuer · nah · unkompliziert · ernsthaft*)
2. **„Nenn mir zwei Websites, die dir gefallen, und eine, die dich abstößt."** URLs. Aus der abstoßenden lernst du mehr als aus den beiden anderen.
3. **„Hell oder dunkel?"** Die einzige Farbfrage, die jeder beantworten kann. Dunkel wirkt technisch und teuer, hell wirkt offen und zugänglich. Es gibt kein Richtig.

**Dann schlägst du vor, statt weiter zu fragen.** Zwei bis drei benannte Richtungen mit echten Werten, keine Beschreibungen:

```
A · "Werkstatt"    Grund #111111 · Signal #C8FF00 · Schrift eng, Kanten hart
                   wirkt: technisch, wach, jung

B · "Kontor"       Grund #FAF8F4 · Signal #1A3A5C · Schrift Serif, viel Luft
                   wirkt: solide, gewachsen, verbindlich

C · "Studio"       Grund #FFFFFF · Signal #E8503A · Schrift groß, wenig Farbe
                   wirkt: klar, offen, gegenwärtig
```

**Und dann zeigst du es, statt es zu beschreiben.** Bevor irgendeine echte Seite entsteht, baust du eine einzige Probeseite unter `/probe/`: Überschrift, Fließtext, ein Knopf, eine Karte, eine Liste — einmal je Richtung. Das kostet zwanzig Minuten und erspart die Runde, in der nach drei fertigen Seiten jemand sagt, so habe er sich das nicht vorgestellt.

**Erst wenn er auf eine Richtung zeigt, fängt Stufe 1 an.**

#### Bei NACHBAU — die Vorlage hat schon entschieden

Die Werte liest du in Stufe 0b aus dem echten CSS, nicht aus dem Gedächtnis. Hier stellst du genau **eine** Frage, und sie ist die wichtigere:

> *„Was an der Gestaltung der Vorlage soll anders werden?"*

„Genau wie das Vorbild" ist fast nie die ehrliche Antwort. Meistens gibt es etwas, das nie gefiel und das man nie geändert hat, weil es zu aufwendig war — zu enge Zeilen, zu viele Farben, ein Logo, das niemand mehr mag, Schriften, die auf dem Telefon nicht lesbar sind. **Der Nachbau ist die Gelegenheit, genau das loszuwerden**, und zwar ohne Aufpreis, weil die Gestaltung ohnehin neu entsteht.

Notiere die Antwort in `docs/entscheidungen.md` als *Abweichung von der Vorlage*. Ohne diese Zeile baut jemand in vier Wochen versehentlich den alten Zustand nach.

#### Was in beiden Fällen gilt

- **Anmutung in drei Wörtern** festhalten („ruhig, technisch, teuer" — „warm, handgemacht, nah"). Das steuert Abstände, Rundungen und Bildsprache mehr als jede Farbe.
- **Zwei Schriften reichen**, eine für Überschriften, eine für Fließtext. Liegen Hausschriften als Datei vor, binde sie lokal ein statt über einen fremden Dienst.
- **Eine Signalfarbe, höchstens eine zweite.** Drei Akzentfarben sind keine Gestaltung, sondern eine Unentschiedenheit.

Und drei Regeln, egal welche Farben herauskommen:

1. **Die Signalfarbe ist Signal, nie Fläche.** Sie markiert, sie füllt nicht. Eine große Fläche in der Signalfarbe nimmt ihr genau die Eigenschaft, für die sie da ist.
2. **Eine dominante Handlung je Bildschirm.** Wenn alles wichtig aussieht, ist nichts wichtig.
3. **Der Grund ist ruhig.** Eine Treppe aus vier bis fünf Abstufungen, streng neutral. Kein Verlauf ohne Grund.

**Alles kommt als Token nach `config/theme.json`. Nie eine Farbe direkt in einen Baustein schreiben** — sonst ist ein Redesign später eine Suchen-und-Ersetzen-Orgie statt einer Datei. Das ist dieselbe Trennung wie bei den Inhalten: Gestaltung ist Konfiguration, Aussehen ist Code.

### Weiche 2 — worauf läuft es?

Frag so, dass auch jemand antworten kann, der die Begriffe nicht kennt:

> *„Wo soll das laufen? Drei Möglichkeiten: **A** erst mal nur auf deinem Rechner. **B** auf einem kleinen Server mit eigener Domain. Oder **C** — du beschreibst mir einfach, was du schon hast, und ich sage dir, ob es geht."*

**Weg A — Localhost + SQLite.** Läuft auf dem eigenen Rechner, keine Kosten, keine Zugangsdaten, in fünf Minuten startklar. Zum Lernen, Bauen und Zeigen. Öffentlich geht sie damit nicht.

> **Windows und Mac gleichermaßen.** `node:sqlite` ist in Node eingebaut, es wird nichts kompiliert und nichts installiert — auf beiden Systemen identisch. Die Datenbank ist eine Datei, die du kopieren, sichern und mitnehmen kannst. Drei Unterschiede musst du als Claude kennen, sie stehen unten bei „Zwei Systeme, ein Projekt".

**Weg B — VPS + Postgres.** Eine kleine Maschine bei einem Hoster, eine verwaltete Postgres-Datenbank, eine Domain. Öffentlich erreichbar, mehrere Menschen können arbeiten. Für die Vektorsuche später: `pgvector` ist die kürzeste Strecke, weil sie in derselben Datenbank liegt — aber jede andere tut es auch, siehe unten.

**Weg C — was schon da ist.** Der häufigste Fall bei Menschen, die nicht bei null anfangen. Lass ihn beschreiben, was er hat, und **beurteile es selbst**, statt ihn auf A oder B zu drängen.

> **Empfehlung, wenn er unsicher ist: fang mit A an, auch wenn B oder C das Ziel ist.** Der Code ist identisch; nur eine Datei kennt den Unterschied. Wer zuerst Infrastruktur aufsetzt, verbringt den Abend mit Zugangsdaten statt mit seiner Website. Der Umzug später ist ein Eintrag in der Umgebung.

#### Weg C — so beurteilst du eine fremde Infrastruktur

Frag diese fünf Dinge, in dieser Reihenfolge. Die zweite entscheidet fast immer:

1. **Wo läuft es?** Eigener Rechner · Webhosting-Paket · VPS oder Root-Server · Cloud-Plattform · NAS im Haus.
2. **Darf dort ein Programm dauerhaft laufen?** Nicht „gibt es PHP", sondern: kann ein eigener Prozess dauerhaft auf einem Port horchen? **Das ist die Frage, an der die meisten klassischen Webhosting-Pakete scheitern**, und sie scheitern still — man merkt es erst nach zwei Stunden.
3. **Welche Datenbank ist da?** PostgreSQL · MySQL/MariaDB · SQLite · gar keine.
4. **Node-Version?** `node -v`. Gebraucht wird 22 oder neuer.
5. **Domain und Zertifikat?** Vorhanden, oder soll es erst mal ohne gehen?

Und dann sagst du ehrlich, was dabei herauskommt:

| Was er hat | Urteil |
|---|---|
| VPS oder Root-Server mit Docker | **Geht.** Das ist Weg B, nur mit anderem Hoster. |
| Cloud-Plattform mit dauerhaftem Prozess (Fly, Railway, Render, Coolify, Dokku) | **Geht.** Verhält sich wie Weg B. |
| NAS oder Mini-Rechner im Haus | **Geht** für innen. Öffentlich braucht es einen Tunnel oder eine feste Adresse. |
| PostgreSQL schon vorhanden | **Ideal.** `DATABASE_URL` setzen, fertig. |
| MySQL/MariaDB schon vorhanden | **Geht mit einem Adapter.** `src/db.js` bekommt einen dritten Zweig (`mysql2`), das SQL bleibt gleich. Rechne eine halbe Stunde. |
| Klassisches Webhosting, nur PHP und FTP | **Geht nicht.** Der Motor ist ein laufendes Programm, kein Stapel Dateien. Sag das früh und schlag A für heute und B für später vor. |
| Serverless / Edge-Funktionen | **Geht mit Abstrichen.** Der Render-Cache im Speicher verliert seinen Sinn, weil jede Anfrage in einem neuen Prozess landet. Möglich, aber nicht der Weg für heute Abend. |
| Node älter als 22 | **Erst aktualisieren.** Ohne `node:sqlite` fällt Weg A weg. |
| Er weiß es nicht | Lass ihn `node -v`, `psql --version` und `docker --version` ausführen und urteile danach. |

**Zur Vektorsuche, falls er danach fragt:** sie ist die *letzte* Stufe, nicht die erste, und sie darf die Wahl der Infrastruktur nicht bestimmen. Wenn sie kommt, gibt es drei Wege: `pgvector` in der vorhandenen Postgres (kürzeste Strecke), `sqlite-vec` als Erweiterung für Weg A, oder ein eigener Dienst wie Qdrant, Chroma oder Weaviate, wenn die Datenmenge es rechtfertigt. **Bei einer Website mit ein paar hundert Seiten reicht in aller Regel die Volltextsuche der Datenbank** — schlag das ehrlich vor, bevor jemand einen Vektordienst betreibt, den er nicht braucht.

**Was du am Ende festhältst:** eine Zeile in `docs/entscheidungen.md`, etwa *„Weg C: Hetzner-VPS mit Docker und vorhandener MariaDB — db.js bekommt einen mysql2-Zweig, Vektorsuche vorerst nicht."*

### Gruppe 4 — Die Fakten

Sammle jetzt, was die KI später niemals erfinden darf. Schreibe es direkt in `config/facts.json`:

Firmenname und Rechtsform · Anschrift · E-Mail · Telefon · Steuer-/USt-Nummer · Geschäftsführung · Preise · Links zu Buchung, Shop, Social · Öffnungs- oder Sprechzeiten

**Was hier fehlt, erscheint später sichtbar als `[…]` auf der Seite.** Das ist Absicht: eine Lücke, die auffällt, ist besser als eine erfundene Zahl, die niemand bemerkt.

### Abschluss von Stufe 0 — schreib die Entscheidungen auf

Bevor du eine Zeile Code schreibst, leg `docs/entscheidungen.md` an. Sie ist kurz und beantwortet genau das, worauf sich alles Weitere beruft:

```markdown
# Entscheidungen

**Weiche 1 — was bauen wir:** NEU | NACHBAU von <URL>
**Weiche 2 — worauf läuft es:** A Localhost | B VPS | C <was genau>

**Art der Website:** <Selbstständiger | Redner | Verband | Unternehmen | Shop | Publikation>
**Leser:** <eine Person, konkret>
**Die eine Handlung:** <ein Verb>
**Seiten zum Start:** <fünf Stück>
**Designrichtung:** <Name der gewählten Probe, oder: übernommen von der Vorlage>
**Abweichung von der Vorlage:** <nur bei NACHBAU — was anders wird>
**Farben:** Grund <#…> · Signal <#…> · Akzent <#…>
**Schriften:** <Überschrift> / <Fließtext>
**Anmutung:** <drei Wörter>
**Offene Fakten:** <was noch fehlt>
```

**Zeig sie dem Menschen und lass ihn korrigieren.** Danach ist sie die Bezugsgröße: wenn in Stufe 2 eine Frage aufkommt, steht die Antwort hier — und wenn nicht, ist das der Moment, sie zu stellen, statt zu raten.

---

## Stufe 0b · Die Vorlage lesen *(nur bei NACHBAU)*

Ziel: eine schriftliche Bestandsaufnahme, aus der du Gruppe 1 bis 4 beantworten kannst — und eine Liste dessen, was du **weglässt**.

**1 · Seiten zählen.** Hol dir die Sitemap (`/sitemap.xml`) oder klick das Menü durch. Schreib jede Seite mit URL und Zweck in eine Tabelle. Danach die wichtigste Frage:

> *„Welche fünf dieser Seiten braucht es wirklich zum Start?"*

Fast jede gewachsene Website trägt doppelte Seiten, tote Aktionen und Unterseiten, die seit Jahren niemand öffnet. **Der Nachbau ist die Gelegenheit, das loszuwerden.** Wer eins zu eins kopiert, kopiert auch den Ballast.

**2 · Die eine Handlung suchen.** Schau dir an, was die Vorlage *will*: welcher Knopf ist auffällig, was steht oben rechts, worauf laufen die Texte hinaus. Oft findest du drei konkurrierende Handlungen — dann ist das der erste echte Gewinn deines Nachbaus: **entscheide dich für eine.**

**3 · Die Gestaltung auslesen, nicht schätzen.** Die echten Werte stehen im ausgelieferten CSS:

```bash
node -e "
fetch('https://vorlage.example/').then(r=>r.text()).then(h=>{
  const z=(m)=>[...h.matchAll(m)].map(x=>x[0]);
  const f={}; for(const c of z(/#[0-9a-fA-F]{6}/g)) f[c]=(f[c]||0)+1;
  console.log('Farben:', Object.entries(f).sort((a,b)=>b[1]-a[1]).slice(0,12));
  console.log('Schriften:', [...new Set(z(/font-family:[^;\"}]+/g))].slice(0,8));
});"
```

*(Node statt `curl` und `grep` — das läuft auf Windows und Mac gleich.)*

Die häufigste Farbe ist fast immer der Grundton, die seltenste mit hoher Sättigung das Signal. Trag beides in `config/theme.json` ein und **zeig dem Menschen die Palette**, bevor du baust — oft will er genau hier abweichen.

**4 · Texte ernten.** Bei der **eigenen** Vorlage: Fließtext je Seite sichern, er ist dein Ausgangsmaterial für Stufe 4. Bei einer **fremden** Vorlage: nur Struktur und Tonfall notieren („kurze Sätze, siezt, viele Zahlen"), keine Sätze übernehmen.

**5 · Fakten trennen.** Beim Durchgehen fällt dir auf, was Fakt ist — Adressen, Preise, Termine, Beitragshöhen, Vorstandsnamen. Alles davon gehört in `config/facts.json` (P2), nicht in einen Seitentext.

**6 · Die Umleitungsliste.** Wenn die neue Website die alte **ersetzt** und die Domain behält, darf keine alte URL ins Leere laufen. Leg von Anfang an eine Tabelle `alt → neu` an und baue sie in Stufe 5 als 301 ein. Das ist der Punkt, an dem Neubauten Sichtbarkeit verlieren, und er wird fast immer vergessen.

**Das Ergebnis von Stufe 0b ist ein kurzes Dokument** (`docs/vorlage.md`) mit: Seitenliste mit Streich-Vorschlag · die eine Handlung · Farben und Schriften · Tonfall · Faktenliste · Umleitungstabelle.

**Zeig es dem Menschen und lass ihn streichen.** Erst danach Stufe 1.

---

## Stufe 1 · Der Motor

Ziel dieser Stufe: `npm start`, Browser auf `http://localhost:3000`, eine gerenderte Seite.

### Der Dateibaum

```
server.js                 Einstieg: Migrationen → Middleware → Routen
config/
  site.json               Domain, Sprache, Titel-Zusatz
  facts.json              Fakten-SSOT (P2)
  theme.json              Design-Tokens (Farben, Schriften, Abstände)
migrations/
  001_pages.sql           idempotent, lexikalisch sortiert
  002_struktur.sql        navigation · media · redirects (Stufe 3)
src/
  db.js                   EINE Datei, die den Weg A/B kapselt
  config.js               Lader für site/facts/theme
  renderer.js             renderPage(seite) → HTML (reine Funktion)
  archetypes.js           Seitentypen + validateContent()
  blocks/
    index.js              Registry
    _util.js              html``, escape, markdown-inline
    _theme.js             Tokens → CSS-Variablen
    nav.js  hero.js  richtext.js  cta.js  footer.js
  routes/
    public.js             öffentliche Seiten
    api.js                Admin-API
page-types/
  <typ>/
    type.json             Metadaten
    schema.json           allowedBlocks / requiredBlocks
    golden.html           die Goldreferenz (P4)
    prompt.md             Anweisung für den Generator
admin/                    Cockpit (Vanilla JS, kein Framework)
  index.html  app.js      Seiten · Navigation · Medien · Umleitungen
  handbook.js             die manuellen Ablaeufe, im Cockpit lesbar
tests/                    node --test
```

### Die Abhängigkeiten — halte sie klein

```bash
npm init -y && npm pkg set type=module
npm i express dotenv
# Weg B und die meisten C-Fälle:
npm i pg
# Weg C mit MySQL/MariaDB stattdessen:
# npm i mysql2
# Generator (später):
npm i @anthropic-ai/sdk
```

**Kein React, kein Tailwind, kein Build-Schritt fürs Frontend.** Das ist kein Sparprogramm, sondern Voraussetzung: ein Stack, den ein Modell vollständig im Kopf hat, kann ein Modell bauen. Sobald drei Framework-Schichten übereinanderliegen, arbeitet die KI gegen Abstraktionen statt gegen die Sache — und du bist zurück beim Chassis.

### `src/db.js` — die eine Datei, die beide Wege kennt

Der Rest des Codes darf **nie** wissen, welcher Weg läuft.

```js
/**
 * Datenzugriff. Weg A: SQLite (Datei). Weg B und die meisten C-Fälle:
 * Postgres (DATABASE_URL). Alles darüber kennt nur query/queryOne — deshalb
 * ist der Umzug ein Umgebungs-Eintrag und keine Migration des Codes.
 *
 * Bringt Weg C eine andere Datenbank mit (MySQL/MariaDB), kommt hier ein
 * dritter Zweig dazu. Er muss genau zwei Dinge können: query und exec.
 * Nichts darüber darf merken, welcher Zweig läuft.
 *
 * node:sqlite ist ab Node 22 dabei (dort mit --experimental-sqlite),
 * ab Node 24 ohne Flag.
 */
const POSTGRES = Boolean(process.env.DATABASE_URL);
let impl;

if (POSTGRES) {
  const pg = (await import('pg')).default;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  impl = {
    query: async (sql, params = []) => (await pool.query(sql, params)).rows,
    exec: async (sql) => { await pool.query(sql); },
  };
} else {
  const { DatabaseSync } = await import('node:sqlite');
  const { mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  const datei = process.env.SQLITE_FILE || 'data/site.db';
  // SQLite legt fehlende Ordner NICHT an — ohne diese Zeile scheitert der
  // allererste Start mit ERR_SQLITE_ERROR, und zwar auf jeder Plattform.
  mkdirSync(dirname(datei), { recursive: true });
  const db = new DatabaseSync(datei);
  db.exec('PRAGMA journal_mode = WAL');
  // $1, $2 … → ?, damit dasselbe SQL auf beiden Wegen läuft
  const um = (sql) => sql.replace(/\$(\d+)/g, '?');
  impl = {
    query: async (sql, params = []) => {
      const s = db.prepare(um(sql));
      return /^\s*(select|with|pragma)/i.test(sql) ? s.all(...params) : (s.run(...params), []);
    },
    exec: async (sql) => db.exec(sql),
  };
}

export const query = impl.query;
export const queryOne = async (sql, params) => (await impl.query(sql, params))[0] || null;

/** Migrationen: idempotent, lexikalisch, mit Tracking. */
export async function runMigrations() {
  const { readdirSync, readFileSync } = await import('node:fs');
  await impl.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
  const erledigt = new Set((await impl.query('SELECT name FROM schema_migrations')).map((r) => r.name));
  for (const datei of readdirSync('migrations').filter((f) => f.endsWith('.sql')).sort()) {
    if (erledigt.has(datei)) continue;
    await impl.exec(readFileSync(`migrations/${datei}`, 'utf8'));
    await impl.query('INSERT INTO schema_migrations (name) VALUES ($1)', [datei]);
    console.log(`[Motor] Migration: ${datei}`);
  }
}
```

**Für Weg B mit Vektorsuche** kommt später `CREATE EXTENSION IF NOT EXISTS vector;` und eine Spalte `embedding vector(1536)` dazu. Baue das **nicht** in Stufe 1 ein — es ist die letzte Stufe, nicht die erste.

### Zwei Systeme, ein Projekt

Der Motor läuft auf Windows und macOS gleich. Was sich unterscheidet, ist die **Kommandozeile** — und genau dort verlieren Menschen die erste halbe Stunde.

| | macOS / Linux | Windows |
|---|---|---|
| Node prüfen | `node -v` | `node -v` |
| Starten | `npm start` | `npm start` |
| Seite prüfen | `curl -s -o /dev/null -w "%{http_code}" …` | **`curl` ist in der alten PowerShell etwas anderes** |
| Nichts-Ausgabe | `/dev/null` | `NUL` |
| Temporär | `/tmp/…` | `%TEMP%\…` |
| `sqlite-vec` (später) | `.dylib` / `.so` | `.dll` |

**Nimm für Prüfungen keine Shell-Befehle, sondern Node — das läuft überall gleich:**

```bash
node -e "fetch('http://localhost:3000/impressum/').then(r=>console.log(r.status))"
```

Vier Regeln, damit das Projekt auf beiden Systemen läuft:

- **Pfade im Code immer mit Schrägstrich** (`data/site.db`). Node übersetzt das unter Windows von allein. Nie Backslashes hartkodieren.
- **Ordner vor dem Benutzen anlegen** (`mkdirSync(..., { recursive: true })`) — siehe `db.js`. SQLite legt sie nicht an.
- **Keine Shell-Skripte** in `package.json`, die es nur auf einem System gibt. Alles, was gebraucht wird, ist ein Node-Skript.
- **Zeilenenden:** eine `.gitattributes` mit `* text=auto eol=lf` erspart die Runde, in der jede Datei als geändert gilt, weil zwei Menschen auf verschiedenen Systemen arbeiten.

**Für die Vektorsuche später** gilt dasselbe: `node:sqlite` bringt FTS5 auf beiden Systemen mit, und Kosinus in JavaScript ist ohnehin plattformunabhängig. Erst wenn du wirklich `sqlite-vec` brauchst, wird es systemabhängig — dann lädst du unter Windows eine `.dll` statt einer `.dylib`. **Das ist genau der Grund, es so lange wie möglich nicht zu tun.**

### `migrations/001_pages.sql`

Schreibe SQL, das auf beiden Wegen läuft: `TEXT` statt `VARCHAR`, kein `SERIAL`, Zeitstempel als Text.

```sql
CREATE TABLE IF NOT EXISTS pages (
  id           TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  page_type    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',
  title        TEXT,
  description  TEXT,
  content_json TEXT NOT NULL DEFAULT '{"blocks":[]}',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS pages_status ON pages (status);
```

### `src/blocks/_util.js` — die Sicherheitsschicht

Alles, was ein Baustein ausgibt, läuft hier durch. Das ist die Stelle, an der du verhinderst, dass ein Modell-Text zu einem Sicherheitsloch wird.

```js
export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export const escapeAttr = escapeHtml;

/** Markiert Zeichenketten, die schon sicher sind. */
export const raw = (v) => ({ __raw: true, value: v ?? '' });

/** html`…` escaped alles Eingesetzte, außer es ist raw(). */
export function html(teile, ...werte) {
  let out = '';
  teile.forEach((t, i) => {
    out += t;
    const v = werte[i];
    if (v == null) return;
    out += v && typeof v === 'object' && v.__raw ? v.value : escapeHtml(v);
  });
  return raw(out);
}

/** Ziele: nur site-relativ oder https. Nie javascript: oder data:. */
export const ziel = (href) => (/^(\/(?!\/)|https:\/\/|#)/.test(String(href || '').trim()) ? String(href).trim() : '');
```

### Ein Baustein — das Muster für alle 
 
```js
// src/blocks/hero.js
import { html, raw, escapeAttr, ziel } from './_util.js';

export default {
  name: 'hero',
  label: 'Aufmacher',
  schema: {
    pill:     { type: 'text',     default: '',  label: 'Kleine Zeile darüber' },
    titel:    { type: 'text',     default: '',  label: 'Überschrift' },
    sub:      { type: 'longtext', default: '',  label: 'Untertitel' },
    ctaLabel: { type: 'text',     default: '',  label: 'Knopf-Beschriftung' },
    ctaHref:  { type: 'text',     default: '',  label: 'Knopf-Ziel' },
  },
  css: `
    .hero { padding: 120px 0 72px; }
    .hero__pill { font-family: var(--font-mono); font-size: 12px;
      letter-spacing: .12em; text-transform: uppercase; color: var(--signal); }
    .hero__titel { font-size: clamp(32px, 5vw, 60px); font-weight: 800;
      line-height: 1.08; margin: 12px 0 16px; max-width: 16ch; }
    .hero__sub { font-size: 18px; line-height: 1.6; color: var(--text-muted);
      max-width: 60ch; }
    .hero__cta { display: inline-block; margin-top: 28px; padding: 14px 26px;
      border-radius: 999px; background: var(--handlung); color: #fff;
      font-weight: 700; text-decoration: none; }
  `,
  render(data) {
    return html`
      <section class="section hero"><div class="container">
        ${data.pill ? html`<p class="hero__pill">${data.pill}</p>` : ''}
        <h1 class="hero__titel">${data.titel}</h1>
        ${data.sub ? html`<p class="hero__sub">${data.sub}</p>` : ''}
        ${data.ctaLabel && ziel(data.ctaHref)
          ? html`<a class="hero__cta" href="${raw(escapeAttr(ziel(data.ctaHref)))}">${data.ctaLabel}</a>`
          : ''}
      </div></section>`;
  },
};
```

**Fünf bis sieben Bausteine reichen für den Start:** `nav`, `hero`, `richtext`, `cards`, `cta`, `footer`. Mehr baust du, wenn eine konkrete Seite sie braucht — nie auf Vorrat.

### `src/renderer.js` — die reine Funktion

```js
import { blocks } from './blocks/index.js';
import { themeCss } from './blocks/_theme.js';
import { loadSite, loadFacts } from './config.js';

/** Fakten einstempeln: {{facts.email}} → Wert, fehlend → sichtbares […] */
function faktenTor(text) {
  const facts = loadFacts();
  return String(text).replace(/\{\{facts\.([\w.]+)\}\}/g, (_, pfad) => {
    const wert = pfad.split('.').reduce((o, k) => (o ?? {})[k], facts);
    if (wert == null || wert === '') {
      console.warn(`[Motor] [WARN] Fakt fehlt: ${pfad}`);
      return '[…]';
    }
    return String(wert);
  });
}

export function renderPage(page, { dynamicData = {} } = {}) {
  const site = loadSite();
  const inhalt = typeof page.content_json === 'string'
    ? JSON.parse(page.content_json) : page.content_json;
  const liste = inhalt.blocks || [];

  const benutzt = [...new Set(liste.map((b) => b.type))];
  const css = benutzt.map((t) => blocks[t]?.css || '').join('\n');

  const koerper = liste.map((eintrag) => {
    const block = blocks[eintrag.type];
    if (!block) {
      // Laut sein: ein unbekannter Baustein verschwindet sonst stumm und
      // die Seite bleibt 200, aber leer. Das ist die fieseste Fehlerart.
      console.warn(`[Motor] [WARN] Unbekannter Baustein: ${eintrag.type}`);
      return '';
    }
    const vorgaben = Object.fromEntries(
      Object.entries(block.schema).map(([k, v]) => [k, v.default]));
    const daten = { ...vorgaben, ...eintrag.data, ...(dynamicData[eintrag.type] || {}) };
    const out = block.render(daten);
    return out?.__raw ? out.value : String(out);
  }).join('\n');

  return faktenTor(`<!doctype html>
<html lang="${site.locale || 'de'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title || site.name}${site.titleSuffix || ''}</title>
<meta name="description" content="${page.description || ''}">
${page.status === 'published' ? '' : '<meta name="robots" content="noindex">'}
<style>${themeCss()}${css}</style>
</head>
<body>${koerper}</body>
</html>`);
}
```

### `src/archetypes.js` — der Vertrag

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const typen = Object.fromEntries(
  readdirSync('page-types', { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => [d.name, {
      name: d.name,
      ...JSON.parse(readFileSync(`page-types/${d.name}/type.json`, 'utf8')),
      schema: existsSync(`page-types/${d.name}/schema.json`)
        ? JSON.parse(readFileSync(`page-types/${d.name}/schema.json`, 'utf8')) : {},
    }]));

export const getType = (name) => typen[name] || null;

/** Der Vertrag. Hier scheitert ein Modell-Ergebnis, nicht auf der Seite. */
export function validateContent(typName, inhalt) {
  const fehler = [];
  const typ = getType(typName);
  if (!typ) return { ok: false, fehler: [`Unbekannter Seitentyp: ${typName}`] };
  if (!Array.isArray(inhalt?.blocks)) return { ok: false, fehler: ['blocks muss ein Array sein'] };

  const erlaubt = new Set(typ.schema.allowedBlocks || []);
  const vorhanden = new Set(inhalt.blocks.map((b) => b?.type).filter(Boolean));
  if (erlaubt.size) {
    for (const b of inhalt.blocks) {
      if (!b?.type) fehler.push('Baustein ohne type');
      else if (!erlaubt.has(b.type)) fehler.push(`Baustein nicht erlaubt für ${typName}: ${b.type}`);
    }
  }
  for (const pflicht of typ.schema.requiredBlocks || []) {
    if (!vorhanden.has(pflicht)) fehler.push(`Pflicht-Baustein fehlt: ${pflicht}`);
  }
  return { ok: fehler.length === 0, fehler };
}
```

### `server.js`

```js
import 'dotenv/config';
import express from 'express';
import { runMigrations, queryOne } from './src/db.js';
import { renderPage } from './src/renderer.js';

await runMigrations();
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static('data/uploads', { maxAge: '7d' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get(/^\/(.*)$/, async (req, res, next) => {
  try {
    const slug = (req.params[0] || 'start').replace(/\/+$/, '') || 'start';
    const page = await queryOne(
      "SELECT * FROM pages WHERE slug = $1 AND status = 'published'", [slug]);
    if (!page) return next();
    res.type('html').send(renderPage(page));
  } catch (err) { next(err); }
});

app.use((_req, res) => res.status(404).type('html').send('<h1>Nicht gefunden</h1>'));

app.listen(process.env.PORT || 3000,
  () => console.log(`[Motor] läuft auf http://localhost:${process.env.PORT || 3000}`));
```

> **Abnahme Stufe 1:** `npm start`, eine Testzeile in `pages`, Seite im Browser sichtbar. **Zeig sie dem Menschen.**

---

## Stufe 2 · Die erste Seite — Goldreferenz zuerst

Jetzt **nicht** den Generator bauen. Erst eine Seite von Hand perfekt machen (P4).

1. Nimm die Startseite und den Inhalt aus Stufe 0 (beim Nachbau: aus `docs/vorlage.md`).
2. Schreibe das `content_json` **selbst**, mit den echten Texten des Menschen — keine Platzhalter.
3. Verfeinere die Bausteine, bis die Seite wirklich gut ist. Hier wird die gewählte Richtung aus Gruppe 2 zur fertigen Gestaltung — nicht im Generator.
4. Speichere das Ergebnis als `page-types/home/golden.html`.

**Zeig sie dem Menschen und lass ihn widersprechen.** Was hier nicht sitzt, wird später hundertfach falsch reproduziert.

Danach die restlichen Startseiten des gewählten Typs anlegen — schlank. Fünf, die stehen.

> **Abnahme Stufe 2:** alle Startseiten erreichbar, auf dem Telefon geprüft, kein waagerechtes Scrollen, Fakten stimmen.

---

## Stufe 3 · Das Cockpit — der Unterbau

**Das ist die Stufe, die über Erfolg entscheidet.** Renderer und Bausteine sind an einem Abend gebaut. Was eine Website *pflegbar* macht, entsteht hier — und wer sie überspringt, hat am Ende ein hübsches Frontend mit ein bisschen Datenbank dahinter, das nur er selbst bedienen kann.

Der Prüfstein für diese Stufe:

> **Kann ein Mensch ohne Entwickler eine Seite anlegen, sie ins Menü hängen, ein Bild einsetzen, sie veröffentlichen, später umbenennen und wieder löschen — eine Anfrage darüber empfangen und einen Preis ändern, ohne dass etwas kaputtgeht?**

Wenn eine dieser neun Sachen fehlt, ist der Unterbau nicht fertig. Vanilla JS, eine `index.html`, eine `app.js`, kein Framework.

### 3.1 · Seiten verwalten

```sql
-- migrations/002_struktur.sql
CREATE TABLE IF NOT EXISTS navigation (
  id        TEXT PRIMARY KEY,
  parent_id TEXT,
  label     TEXT NOT NULL,
  href      TEXT NOT NULL,
  sort      INTEGER NOT NULL DEFAULT 0,
  visible   INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS media (
  id         TEXT PRIMARY KEY,
  file_path  TEXT NOT NULL,
  alt        TEXT,
  bytes      INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS redirects (
  from_path  TEXT PRIMARY KEY,
  to_path    TEXT NOT NULL,
  code       INTEGER NOT NULL DEFAULT 301,
  created_at TEXT NOT NULL
);
-- Hier landet die EINE Handlung aus Stufe 0 (siehe 3.7)
CREATE TABLE IF NOT EXISTS submissions (
  id         TEXT PRIMARY KEY,
  form       TEXT NOT NULL,
  page_slug  TEXT,
  daten      TEXT NOT NULL,
  gelesen    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
-- Fakten, die ohne Deploy aenderbar sein muessen (siehe 3.8)
CREATE TABLE IF NOT EXISTS config_overrides (
  schluessel TEXT PRIMARY KEY,
  wert       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Das Cockpit braucht für Seiten fünf Dinge, nicht eines:

1. **Liste** aller Seiten mit Status, Typ und Slug.
2. **Anlegen:** Seitentyp wählen → der Motor legt eine Seite mit den Pflichtbausteinen des Typs an, Status `draft`.
3. **Bearbeiten:** je Baustein ein Formular, **automatisch aus dem `schema` erzeugt** — nie handgeschrieben. Ein neues Feld im Schema erscheint dadurch von selbst im Cockpit. Dazu: Bausteine hinzufügen, entfernen, verschieben.
4. **Umbenennen:** ändert sich der Slug einer *veröffentlichten* Seite, **schreibt der Motor ungefragt eine 301** von alt nach neu. Nicht als Angebot, nicht als Häkchen — automatisch. Sonst bricht irgendwann jemand einen Link und merkt es in sechs Monaten.
5. **Löschen:** nur mit Rückfrage, und bei veröffentlichten Seiten mit der Pflichtangabe, wohin umgeleitet wird.

```js
// Beim Speichern: Slug-Wechsel einer öffentlichen Seite hinterlässt eine Spur.
if (alt.status === 'published' && neu.slug !== alt.slug) {
  await query(
    `INSERT INTO redirects (from_path, to_path, code, created_at)
     VALUES ($1, $2, 301, $3)`,
    [`/${alt.slug}/`, `/${neu.slug}/`, new Date().toISOString()]
  );
}
```

### 3.2 · Die Navigation ist Daten, kein Code

**Das ist die Stelle, an der die meisten Eigenbauten scheitern.** Wer das Menü in den `nav`-Baustein schreibt, hat eine Website, deren Struktur nur ein Entwickler ändern kann — und damit KI-first mit Extraschritten.

Die Baumstruktur gehört in die Datenbank, und der `nav`-Baustein liest sie:

```js
// src/routes/public.js — dieselbe Mechanik wie jede andere Liste (P3)
if (types.has('nav') || types.has('footer')) {
  const zeilen = await query(
    'SELECT id, parent_id, label, href, sort FROM navigation WHERE visible = 1 ORDER BY sort'
  );
  const baum = zeilen.filter((z) => !z.parent_id)
    .map((z) => ({ ...z, kinder: zeilen.filter((k) => k.parent_id === z.id) }));
  dynamicData.nav = { baum };
  dynamicData.footer = { baum };
}
```

Im Cockpit ist das ein eigener Punkt **„Navigation"**: alle veröffentlichten Seiten links, der Menübaum rechts, per Ziehen hinein und in der Reihenfolge verschieben. Zwei Ebenen reichen für fast jede Website — baue keine dritte, bevor jemand sie wirklich braucht.

Drei Regeln, die dir später Ärger ersparen:

- **Ein Menüpunkt kann auf eine Seite zeigen, muss aber nicht.** Externe Ziele und Ankerlinks gehören auch hinein.
- **Zeigt ein Menüpunkt auf eine Seite, die gelöscht oder unveröffentlicht wird, warnt das Cockpit** — und versteckt ihn, statt ins Leere zu verlinken.
- **Die Reihenfolge ist Redaktion, keine Technik.** Nie alphabetisch sortieren, nie nach Anlagedatum.

### 3.3 · Medien

Bilder brauchen genauso einen Ort wie Texte, sonst landen sie als fremde URLs in den Seiten und verschwinden, wenn jemand aufräumt.

- **Hochladen** über das Cockpit, gespeichert auf der Platte (Weg A) oder auf einem dauerhaften Volume (Weg B/C) — **niemals ins Repository.**
- **Dateiname mit Inhalts-Hash** (`kachel-a3f9c1.webp`). Wer unter demselben Namen überschreibt, kämpft danach gegen den Browser-Cache.
- **Alt-Text ist ein Pflichtfeld**, kein Zusatz. Ein Bild ohne Alt-Text ist für einen Vorleser nicht vorhanden.
- **Ein Auswahlfenster** für jedes Feld vom Typ `image`, damit niemand Pfade tippt.
- **WebP statt PNG**, außer bei Transparenz. Bei flächigen Bildern spart das rund vier Fünftel.

> **Falle, die jede Zwei-Server-Aufstellung trifft:** Liegt das Bild auf dem Rechner, auf dem es erzeugt wurde, aber nicht auf dem, der die Seite ausliefert, zeigt die Seite auf eine Datei, die es dort nicht gibt. Uploads gehören auf ein gemeinsames Volume, und der Weg dorthin führt immer über die Anwendung, nie über einen fremden Rechner.

### 3.4 · Umleitungen

Eine Tabelle und eine Middleware, weiter nichts — aber ohne sie verliert jeder Umbau Sichtbarkeit:

```js
// Vor allen Seitenrouten, nach den statischen Dateien.
app.use(async (req, res, next) => {
  const ziel = await queryOne(
    'SELECT to_path, code FROM redirects WHERE from_path = $1',
    [req.path.endsWith('/') ? req.path : `${req.path}/`]
  );
  if (!ziel) return next();
  res.redirect(ziel.code || 301, ziel.to_path);
});
```

Im Cockpit als schlichte Liste mit Anlegen und Löschen. Die Einträge aus 3.1 landen automatisch hier.

### 3.5 · Was beim Veröffentlichen mitläuft

Kein eigener Knopf, sondern Teil des Publizierens — und nach P6 darf nichts davon eine Veröffentlichung aufhalten:

- `sitemap.xml` aus allen veröffentlichten Seiten, Entwürfe und interne Pfade ausgenommen
- `robots.txt`
- `<title>` und `<meta name="description">` je Seite, im Cockpit pflegbar
- Ein Vorschaubild fürs Teilen (`og:image`) je Seite
- **Render-Cache der geänderten Seite leeren** — und wenn Übersichtsseiten auf sie zeigen, deren auch

### 3.6 · Das Handbuch schreibt sich mit

**Der Teil, den fast jeder weglässt und der nach drei Monaten am meisten fehlt.**

Jeder Ablauf, den ein Mensch von Hand macht — Seite anlegen, Bild tauschen, Menü umsortieren, veröffentlichen — bekommt einen Eintrag in einer Datei wie `admin/handbook.js`, die im Cockpit lesbar ist. Je Ablauf: wann man ihn braucht, welche Schritte in welcher Reihenfolge, was die App von allein macht, und die Fallstricke.

Zwei Regeln, ohne die es sofort verrottet:

- **Ändert ein Commit einen Knopf, wird das Handbuch im selben Commit mitgezogen.** Eine Anleitung mit falschen Knopfnamen zerstört das Vertrauen in alle anderen Einträge.
- **Die Fallstricke kommen aus echten Vorfällen, nicht aus Vermutungen.** Jedes Mal, wenn etwas schiefgeht, entsteht dort eine Zeile.

Das klingt nach Bürokratie und ist das Gegenteil: **es ist der Grund, warum eine zweite Person die Website bedienen kann, ohne dich zu fragen.**

### 3.7 · Formulare — die eine Handlung muss irgendwo landen

**Das ist die Stelle, an der sich Stufe 0 auszahlt oder verpufft.** Du hast dort nach *der einen Handlung* gefragt — Termin vereinbaren, anfragen, Mitglied werden, kaufen. Gibt es dafür keinen Ort, endet die ganze Kette in einem Knopf, der nirgendwohin führt.

Ein `form`-Baustein mit Feldern aus dem Schema, ein Endpunkt, eine Tabelle. Vier Dinge entscheiden, ob es im Betrieb trägt:

```js
app.post('/api/form/:name', async (req, res) => {
  const { website, ...daten } = req.body || {};       // 1. Honigtopf
  if (website) return res.json({ ok: true });          //    Bots fuellen ihn aus

  // 2. ZUERST speichern, DANN benachrichtigen. Nie umgekehrt.
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO submissions (id, form, page_slug, daten, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, req.params.name, daten._seite || null, JSON.stringify(daten), new Date().toISOString()]
  );

  // 3. Die Mail darf scheitern, ohne die Anfrage zu verlieren.
  try { await benachrichtige(daten); }
  catch (err) { console.error(`[Motor] [ERROR] Mail zu ${id}: ${err.message}`); }

  res.json({ ok: true });
});
```

1. **Ein Honigtopf-Feld**, per CSS versteckt. Bots füllen es aus, Menschen nicht. Kostet nichts und hält das meiste ab.
2. **Zuerst speichern, dann benachrichtigen.** Wer erst die Mail schickt und dann speichert, verliert Anfragen, sobald der Versand klemmt — und merkt es nie, weil der Absender ja ein „Danke" gesehen hat.
3. **Eine scheiternde Mail scheitert leise** (P6). Die Anfrage liegt in der Tabelle, jemand sieht sie im Cockpit.
4. **Im Cockpit eine Liste** mit gelesen/ungelesen und einem Zähler in der Navigation. Eine Anfrage, die niemand sieht, ist so gut wie keine.

> **Datenschutz, nicht optional:** ein Hinweis mit Link zur Datenschutzerklärung am Formular, keine Daten an Dritte ohne Einwilligung, und **nie mehr Felder als nötig**. Jedes Feld, das du nicht erhebst, musst du nicht schützen.

### 3.8 · Fakten ohne Deploy ändern

P2 sagt: Fakten stehen in `config/facts.json`. Das stimmt — hat aber einen Haken, der dem Prüfstein dieser Stufe widerspricht: **eine Datei im Repository kann ein Mensch ohne Entwickler nicht ändern.** Ändert sich ein Preis, bräuchte es einen Deploy.

Deshalb zwei Ebenen, und das Tor liest beide:

```js
/** Datei = Grundstock, Datenbank = das, was jemand im Cockpit geaendert hat. */
export async function ladeFakten() {
  const datei = JSON.parse(readFileSync('config/facts.json', 'utf8'));
  const zeilen = await query("SELECT wert FROM config_overrides WHERE schluessel = 'facts'");
  return zeilen.length ? { ...datei, ...JSON.parse(zeilen[0].wert) } : datei;
}
```

Im Cockpit ein Punkt **„Fakten"** mit einem Formular je Wert. Dasselbe gilt für `theme.json`, wenn Farben ohne Deploy änderbar sein sollen.

> **Falle, teuer gelernt:** Sobald der Override existiert, **gewinnt er**. Wer danach ein neues Feld nur in die Datei schreibt, wundert sich, warum es live nicht erscheint — der Override hat es überschattet. Neue Felder gehören in **beide** Ebenen, oder das Cockpit muss sie beim Speichern durchreichen.

### Und die Absicherung

Passwort-Login mit Cookie, **keine Zugangsdaten im Code**, nur in der Umgebung. Alles unter `/api/` verlangt die Anmeldung, die öffentlichen Routen kennen sie nicht und schreiben nichts.

> **Falle:** Wird das Cockpit als statische Datei ausgeliefert, cacht der Browser sie — und der Mensch sieht nach deinem nächsten Bau die alte Oberfläche, während die Versionsnummer schon die neue zeigt. Stemple die Version an jeden Skript-Verweis (`app.js?v=0.4.2`) und liefere das HTML mit `no-store` aus.

> **Abnahme Stufe 3:** Lass den Menschen selbst — ohne deine Hilfe — eine Seite anlegen, ins Menü hängen, ein Bild einsetzen, veröffentlichen, umbenennen und löschen. **Schau dabei zu und greif nicht ein.** Wo er stockt, fehlt etwas: entweder im Cockpit oder im Handbuch.

---

## Stufe 4 · Die KI als Motor

Erst jetzt. Der Generator bekommt:

- den **Inhalt** (Notizen, Transkript, Diktat, Stichworte),
- das **Schema** der erlaubten Bausteine,
- die **Goldreferenz** als Beispiel,
- die **Stimme** (`knowledge/voice.md`: wie klingt dieser Mensch? Duzen oder siezen? Welche Wörter nie?).

Und er liefert **ausschließlich JSON**. Drei Regeln, die du hart durchsetzt:

```js
const inhalt = await generiere({ quelle, typ });
const pruefung = validateContent(typ, inhalt);
if (!pruefung.ok) throw new Error(pruefung.fehler.join(' · '));   // 1. Vertrag
// 2. Fakten: der Prompt verbietet Zahlen. Das Tor im Renderer fängt den Rest.
// 3. Status: 'generated' — nicht 'published'. Ein Mensch entscheidet.
```

**Der JSON-Parser muss gehärtet sein.** Modelle liefern gelegentlich Text um das JSON herum, abgeschnittene Antworten oder ein fehlendes Komma. Baue eine Kette: säubern → `JSON.parse` → aus dem Text herausschneiden → reparieren (`jsonrepair`). Ein Generator, der an einem Komma scheitert, wird nicht benutzt.

---

## Stufe 5 · Öffentlich

**Weg A:** Du bist fertig — die Seite läuft lokal. Zum Zeigen reicht ein Tunnel (`cloudflared tunnel --url http://localhost:3000`).

**Weg C:** Nimm die Schritte von B, die auf seine Umgebung zutreffen, und lass den Rest weg. Läuft dort schon etwas anderes, prüfe zuerst den Port und den Reverse-Proxy — das ist die häufigste Kollision.

**Weg B:**

1. Kleiner VPS, Docker, ein Reverse-Proxy mit automatischem Zertifikat (Caddy oder Coolify).
2. Verwaltetes Postgres, `DATABASE_URL` setzen → `src/db.js` schaltet von allein um.
3. Domain auf die Maschine zeigen.
4. **Echte Werte nur in der Oberfläche des Hosters.** Nie ins Repository, nie in einen Chat.
5. Auto-Deploy beim Push auf `main`.

Dann die Schichten, die nichts blockieren dürfen (P6): `sitemap.xml`, `robots.txt`, Open-Graph-Bilder, ein datensparsames Analytics.

---

## Stufe 6 · Erweitern

Jetzt ist Erweitern billig. Ein neuer Seitentyp ist: ein Ordner unter `page-types/`, eine `schema.json`, eine Goldreferenz, fertig.

**Übersichtsseiten** (Beiträge, Referenzen, Termine) baust du nach P3: die Seite speichert keine Liste, sie liest den Bestand bei jedem Aufruf.

**Suche und Assistent** kommen zuletzt — siehe Stufe 7. Baue sie nicht vorher, und lass die Wahl der Datenbank nicht davon bestimmen.

---

## Stufe 7 · Der Assistent

Ein Chat, der **nur über die eigenen Inhalte** spricht. Das ist die Stufe, in der sich auszahlt, dass die Seiten strukturiert in einer Datenbank liegen statt als HTML.

### Du brauchst keine Vektordatenbank

Nachgemessen mit `node:sqlite` (SQLite 3.53.4, Node 25), Embeddings mit 1536 Dimensionen als BLOB, Kosinus-Ähnlichkeit in reinem JavaScript:

| Absätze im Bestand | Suchzeit | Datenbank |
|---|---|---|
| 100 | 1,1 ms | 0,6 MB |
| 500 | 1,3 ms | 3,1 MB |
| 2.000 | 7,7 ms | 12,3 MB |
| 10.000 | 24,4 ms | 61,4 MB |

**Der Embedding-Aufruf für die Frage dauert 100 bis 300 Millisekunden.** Die Suche dauert eine. Ein Vektorindex beschleunigt also genau den Teil, der nicht der Engpass ist.

Eine Website mit fünfzig Seiten hat vielleicht 400 Absätze. **Nimm die einfachste Sache, die funktioniert:** Embedding als BLOB in einer normalen Spalte, alle laden, durchrechnen, sortieren. Kein Dienst, kein Index, keine Erweiterung.

Wann das kippt: jenseits von etwa 50.000 Absätzen, oder wenn viele Menschen gleichzeitig schreiben — SQLite sperrt beim Schreiben die ganze Datei. Dann ist Postgres mit `pgvector` dran. **Das ist ein Umzug, kein Umbau**, weil `src/db.js` die einzige Datei bleibt, die den Unterschied kennt.

`sqlite-vec` gibt es als Erweiterung, und `node:sqlite` kann sie laden (`new DatabaseSync(datei, { allowExtension: true })`). Brauchen wirst du sie erst bei den Zehntausenden.

### Die Tabellen

```sql
-- migrations/003_chat.sql
CREATE TABLE IF NOT EXISTS chunks (
  id         TEXT PRIMARY KEY,
  page_slug  TEXT NOT NULL,
  ueberschrift TEXT,
  text       TEXT NOT NULL,
  embedding  BLOB,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chunks_page ON chunks (page_slug);
-- Volltext daneben: die beiden finden Unterschiedliches (siehe unten)
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  text, ueberschrift, content='chunks', content_rowid='rowid'
);
```

### Zerlegen: aus Blöcken werden Absätze

Der Vorteil gegenüber einem HTML-Scraper: **du kennst die Struktur schon.** Jeder Baustein weiß, was er ist.

```js
/** Eine Seite in suchbare Stücke zerlegen. Läuft beim Veröffentlichen. */
export function zerlege(page) {
  const inhalt = typeof page.content_json === 'string'
    ? JSON.parse(page.content_json) : page.content_json;
  const stuecke = [];
  for (const block of inhalt.blocks || []) {
    // nav und footer stehen auf jeder Seite — sie wuerden jede Suche fluten
    if (['nav', 'footer'].includes(block.type)) continue;
    const text = Object.values(block.data || {})
      .filter((v) => typeof v === 'string' && v.length > 40)
      .join('\n\n');
    if (text) stuecke.push({ ueberschrift: block.data?.titel || '', text });
  }
  return stuecke.map((s, i) => ({ ...s, id: `${page.slug}#${i}`, page_slug: page.slug }));
}
```

**Drei Regeln, die den Unterschied machen:**

- Ein Stück trägt immer **seinen Slug** mit, sonst kann die Antwort nicht auf die Quelle zeigen.
- Beim erneuten Veröffentlichen werden die alten Stücke einer Seite **gelöscht, bevor** die neuen kommen — sonst antwortet der Chat noch monatelang aus einer Fassung, die niemand mehr sieht.
- **Nicht jede Seite gehört in den Index.** Impressum, Datenschutz, Danke-Seiten und interne Vorräume verwässern jede Antwort. Gib `pages` eine Spalte `chat_excluded` und einen Schalter im Cockpit — Vorgabe: alles drin, der Mensch nimmt heraus.

### Suchen: beides zusammen ist besser als eines

```js
const kosinus = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

export async function finde(frage, n = 6) {
  const [f] = await embed([frage]);            // Float32Array, normiert

  // 1. Bedeutung: alles laden, durchrechnen. Bei Website-Groesse Millisekunden.
  const zeilen = await query('SELECT id, page_slug, ueberschrift, text, embedding FROM chunks');
  const nachSinn = zeilen
    .map((z) => ({ ...z, score: kosinus(new Float32Array(z.embedding.buffer, z.embedding.byteOffset, f.length), f) }))
    .sort((a, b) => b.score - a.score).slice(0, n);

  // 2. Wortlaut: Produktnamen, Zahlen und Eigennamen findet FTS5 besser als
  //    jedes Embedding — ein Modell verwechselt aehnlich klingende Namen.
  const nachWort = await query(
    `SELECT c.id, c.page_slug, c.ueberschrift, c.text FROM chunks_fts f
       JOIN chunks c ON c.rowid = f.rowid
      WHERE chunks_fts MATCH $1 ORDER BY rank LIMIT $2`,
    [frage.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim(), n]
  ).catch(() => []);

  // Zusammenführen, Doppelte raus.
  const gesehen = new Set();
  return [...nachSinn, ...nachWort].filter((z) => !gesehen.has(z.id) && gesehen.add(z.id)).slice(0, n);
}
```

### Antworten: dieselbe Strenge wie bei den Fakten

Der Chat ist die Stelle, an der ein Modell am leichtesten etwas erfindet — und die, an der es am meisten schadet, weil die Antwort aussieht, als käme sie vom Haus.

```
Du beantwortest Fragen AUSSCHLIESSLICH aus den folgenden Auszügen.

- Steht die Antwort nicht drin, sage das und nenne den nächstbesten Weg.
- Nenne nie einen Preis, einen Termin oder eine Zahl, die nicht wörtlich
  in einem Auszug steht.
- Verweise am Ende auf die Seite, aus der du zitierst.

AUSZÜGE:
{{stuecke}}
```

**Das ist P2 mit anderen Mitteln:** die Fakten kommen aus dem Bestand, nicht aus dem Modell. Zeig die Quellen unter der Antwort — das ist keine Zierde, sondern die Art, wie ein Leser eine Erfindung erkennen kann.

### Der Ablauf im Ganzen

1. Beim Veröffentlichen: alte Stücke der Seite löschen, neu zerlegen, Embeddings holen, schreiben.
2. Frage kommt → Embedding der Frage → Suche → sechs Stücke.
3. Stücke plus Frage ans Modell, Antwort als Stream, Quellen darunter.
4. **Schlägt irgendetwas davon fehl, erscheint eine ehrliche Fehlermeldung — die Website bleibt vollständig bedienbar** (P6). Ein Chat, der eine Seite lahmlegt, ist schlimmer als kein Chat.

> **Abnahme Stufe 7:** Stell drei Fragen, deren Antwort auf der Website steht, und **eine, deren Antwort nicht dort steht.** Die vierte ist die wichtige: sagt der Chat „weiß ich nicht" — oder erfindet er etwas?

---

# Teil III — Wo es weh tut

Das Frontend ist das Einfache. Diese fünf Fehler kosten am meisten Zeit, und keiner davon kracht laut.

### 1 · Stilles Scheitern

Ein umbenannter oder fehlender Baustein wird vom Renderer übersprungen. Die Seite antwortet mit 200 und ist leer. **Logge jeden unbekannten Baustein laut** (siehe `renderer.js`) und prüfe nach jeder Umbenennung die echte URL, nicht den Code.

### 2 · Zustand, den zwei Instanzen nicht teilen

Sobald zwei Prozesse dieselbe Datenbank benutzen (Staging und Produktion, oder zwei Container), hat jeder seinen eigenen Zwischenspeicher. Löschst du ihn beim Veröffentlichen, trifft das nur den Prozess, der den Klick bearbeitet hat. Der andere zeigt minutenlang die alte Seite.

*Regel:* Seiten, die **fremde** Seiten auflisten, bekommen eine kurze Frist (60 Sekunden). Eigene Seiten dürfen länger liegen — sie ändern sich nur, wenn jemand sie bearbeitet.

### 3 · Reihenfolge bei nebenläufiger Arbeit

Ein Hintergrund-Job merkt sich beim Start seinen Pfad. Verschiebt ein anderer Vorgang die Daten, während der Job läuft, schreibt er sein Ergebnis an einen Ort, den es nicht mehr gibt — und viele Speicher legen den Ort hilfsbereit neu an. So entstehen Geister-Ordner.

*Regel:* Schritte, die denselben Gegenstand anfassen, laufen **in einem Vorgang und in fester Reihenfolge**, nie als zwei Aufrufe aus der Oberfläche. Und vor dem Schreiben prüfen, ob das Ziel noch da ist.

### 4 · Regeln auf einer falschen Zählung

Wenn du eine Regel über Inhalte baust („überspringe den ersten Satz, wenn er ein Zeitstempel ist"), **zähl vorher am echten Bestand aus**, wie oft der Fall eintritt — und schau dir die Ausnahmen einzeln an. Eine plausible Annahme, die auf 30 % der Fälle nicht zutrifft, beschädigt 30 % des Bestandes, und niemand merkt es.

### 5 · Nicht nachsehen

Der teuerste Fehler. Code, der aussieht, als funktioniere er, ist kein Beweis. Nach jedem Bau:

```bash
node -e "fetch('https://…/deine-seite/').then(r=>console.log(r.status))"
```

**Prüfe am laufenden System, nicht am Quelltext**, den du gerade geschrieben hast.

---

## Abnahme

Die Website ist fertig, wenn alles davon stimmt:

- [ ] Jede Seite antwortet mit 200, auch mit und ohne Schrägstrich am Ende
- [ ] Auf dem Telefon lesbar, kein waagerechtes Scrollen
- [ ] Kein `[…]` auf einer öffentlichen Seite (alle Fakten gepflegt)
- [ ] Impressum und Datenschutz vorhanden und verlinkt
- [ ] Entwürfe tragen `noindex`, `sitemap.xml` führt nur Veröffentlichtes
- [ ] Ein Mensch kann ohne Entwicklerhilfe eine Seite **anlegen, ins Menü hängen, bebildern, veröffentlichen, umbenennen und löschen**
- [ ] Die Navigation steht in der Datenbank, nicht im `nav`-Baustein
- [ ] Ein Slug-Wechsel einer öffentlichen Seite erzeugt die 301 von allein
- [ ] Bilder liegen an einem dauerhaften Ort, nicht im Repository, und tragen Alt-Text
- [ ] Das Handbuch beschreibt jeden manuellen Ablauf mit den echten Knopfnamen
- [ ] **Mit Assistent:** auf eine Frage, deren Antwort nirgends steht, sagt er „weiß ich nicht"
- [ ] Die eine Handlung aus Stufe 0 ist auf jeder Seite erreichbar — und nur sie ist auffällig
- [ ] Sie **landet auch irgendwo**: eine abgeschickte Anfrage steht im Cockpit, auch wenn der Mailversand klemmt
- [ ] Ein Preis lässt sich ohne Deploy ändern
- [ ] `node --test tests/*.test.js` läuft grün, ohne Datenbank und ohne Schlüssel
- [ ] Das Projekt startet auf einem frisch geklonten Stand mit `npm i && npm start` — ohne dass jemand von Hand einen Ordner anlegt
- [ ] Ein neuer Seitentyp kostet einen Ordner, keine Änderung am Motor
- [ ] `docs/entscheidungen.md` beschreibt noch, was tatsächlich gebaut wurde
- [ ] **Beim Nachbau:** jede alte URL leitet per 301 auf ihr neues Ziel, keine führt ins Leere

---

## Der ehrliche Schlusssatz

Der Motor ist an einem Abend gebaut. Was Zeit kostet, sind **Stufe 0, Stufe 2 und Stufe 3**.

**Stufe 0 und 2** sind die alte Wahrheit, nur schneller: zu wissen, für wen die Seite ist und was sie erreichen soll — und eine einzige Seite so gut zu machen, dass es sich lohnt, sie hundertmal zu reproduzieren. Wer sie überspringt, bekommt sehr schnell sehr viele mittelmäßige Seiten.

**Stufe 3 ist die, die über morgen entscheidet.** Renderer und Bausteine sind das Angenehme; der Unterbau — Seiten anlegen, Menü pflegen, Bilder verwalten, Umleitungen, das mitgeschriebene Handbuch — ist die Arbeit, die niemand sieht und ohne die nach drei Monaten wieder nur einer die Website bedienen kann. Dann hast du kein KI-natives System gebaut, sondern ein hübsches Frontend mit einer Datenbank dahinter.

Der Unterschied zwischen beidem ist nicht die Technik. Es ist die Frage, ob jemand anderes als du damit arbeiten kann.
