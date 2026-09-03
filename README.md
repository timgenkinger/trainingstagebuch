# Rettungshund Trainingstagebuch

Digitale Fassung des gedruckten Trainingstagebuchs für die Flächensuche.
Jede Suche wird als **eigener, abgeschlossener Datensatz** dokumentiert, alle Werte
laufen in ein **Dashboard** zur Auswertung, und die Daten werden im Team
**online abgeglichen** – ohne dass ein Update oder ein Abgleich jemals Daten zurücksetzt.

Die App ist eine reine statische Web-App: **kein Build, keine Abhängigkeiten, kein Server.**
Sie läuft über GitHub Pages, ist offlinefähig und lässt sich auf dem Handy als App installieren.
Die Gestaltung folgt den Hausfarben des Bayerischen Roten Kreuzes.

> **Zum Emblem:** Das Rotkreuz-Emblem ist nach den Genfer Abkommen und dem deutschen
> Rotkreuzgesetz geschützt. Diese App verwendet ausschließlich die Hausfarben, nicht das Zeichen.

---

## Inhalt

1. [Funktionsumfang](#funktionsumfang)
2. [Schnellstart lokal](#schnellstart-lokal)
3. [Veröffentlichen über GitHub Pages](#veröffentlichen-über-github-pages)
4. [Nur abgeschlossene Suchen gehen online](#nur-abgeschlossene-suchen-gehen-online)
5. [Online-Abgleich einrichten](#online-abgleich-einrichten)
6. [Versionsnummern und Updates](#versionsnummern-und-updates)
7. [Wie die Speicherung funktioniert](#wie-die-speicherung-funktioniert)
8. [Aufbau des Projekts](#aufbau-des-projekts)

---

## Funktionsumfang

### Drei Dokumentarten

| | **Suche** | **Verbellen** | **Freie Dokumentation** |
|---|---|---|---|
| Wofür | Suchprotokoll nach Vorlage des Hefts | Trainingsplan Verbellen | alles andere: Gehorsam, Geräte, Theorie |
| Inhalt | Grundwerte, Skizze, Versteckpersonen, drei Bewertungsblöcke, Konsequenz | Grundwerte, bearbeitete Stufen mit Wiederholungen, Notizen | Grundwerte, Skizze, Freitext |
| Auswertung | 5er-Skalen im Dashboard | Fortschrittskatalog je Hund | keine – nur in der Übersicht |
| Anlegen | „+ Neue Suche" | „+ Verbellen" | „+ Freie Doku" |

Beide teilen sich denselben Block **Grundwerte**, der mit der **Wartezeit im Auto bis zur Suche**
beginnt – sie prägt Anspannung und Motivation beim Start und wird im Dashboard mit ausgewertet.
Danach folgen Datum, Ort, Hund, Hundeführer:in sowie Gelände und Wetter.

**Suche erfassen** (bildet Seite 1 und 2 des Hefts ab)

| Heft | App |
|---|---|
| Datum, Ort, Trainingsziel | Grundwerte, zusätzlich Wartezeit im Auto, Hund und Hundeführer:in |
| Geländebeschaffenheit | Mehrfachauswahl (offen, dicht, Dornen, hügelig, steil …) |
| Temperatur / Wetter / Tageszeit | getrennt nach Temperatur, Wind, Niederschlag, Licht + Windrichtung |
| Skizzenfeld Suchgebiet | Zeichenfeld mit vier Stiften: Gebiet, Laufweg HF, Laufweg Hund, Helfer:in |
| Suchzeit bis / Element Anzeige / Radius zur HF | Zeile je Versteckperson, beliebig viele, mit Helfer:in-Bild und Anzeigeart |
| Team: Verlauf der Suche | 6 Kriterien auf der 5er-Skala, „Ablage vor Suche“ zusätzlich mit ✓/✗ |
| Verhalten Hund + Problemverhalten | 4 Kriterien, Radius weit/mittel/eng, 6 Problemverhalten mit Kontextfeld |
| Verhalten Hundeführer:in | 6 Kriterien, Selbstreflektion und Vorsätze |
| Notizen, Beobachten / Bearbeiten / Neues Ziel | eigene Felder |

Zusätzlich: eigene Kriterien pro Bereich (die leeren Zeilen im Heft), Duplizieren einer Suche
(übernimmt die Rahmenbedingungen, leert die Bewertungen), Drucken und Papierkorb.

**Dashboard** – ersetzt die Übersichtsgraphen vorne im Heft

* Kennzahlen: Anzahl Suchen, Ø Gesamtnote, Trefferquote, Ø Zeit bis Fund, Ø Radius bei Fund,
  gesamte Suchzeit, Suchen mit Fehlanzeige, **Ø Wartezeit im Auto**
* Leistungsentwicklung über die Zeit – für alle drei Bereiche oder ein einzelnes Kriterium
* Durchschnitt je Kriterium, **schwächstes zuerst** (zeigt sofort, woran zu arbeiten ist)
* Häufigkeit der Problemverhalten
* Trainierte Bedingungen (zeigt Lücken im Trainingsplan) und Ø Note **je Bedingung** –
  einschließlich der Wartezeit im Auto in vier Stufen
* Fortschritt bei den Helfer:in-Bildern
* Filter nach Hund und Zeitraum

**Helfer:in-Bilder** – alle 39 Bilder der Heftliste als Fortschrittskatalog je Hund,
vier Stufen (kennengelernt / kurze Anzeige / längere Anzeige / gemeistert). Die im Heft
fett gedruckten Bilder sind als **wichtig** markiert. Bilder, bei denen korrektes Verhalten
*keine* Anzeige ist (Attrappen), haben nur die erste Stufe.

**Die Übersicht speist sich aus den Suchen.** Wird bei einer Versteckperson ein
Helfer:in-Bild gewählt, gilt dieses Bild ab der abgeschlossenen Suche als **kennengelernt** –
niemand muss es zusätzlich abhaken. Jede Zeile zeigt, wie oft das Bild vorkam, wann zuletzt
und wie oft der Hund es gefunden hat; Bilder ohne Einsatz sind als *noch nie im Training*
gekennzeichnet und über einen eigenen Filter zusammen sichtbar.

Bewusst automatisch ist **nur Stufe 1**: Dass ein Bild vorkam, steht im Protokoll. Ob die
Anzeige kurz, länger oder gemeistert war, ist eine Einschätzung und bleibt Handarbeit – die
App erfindet keine Bewertung. Eine Handbewertung hebt die Stufe an; nimmt man sie zurück,
bleibt der Beleg aus der Suche bestehen.

---

## Schnellstart lokal

Die App braucht einen Webserver (ES-Module und Service Worker laufen nicht über `file://`):

```bash
python3 scripts/dev-server.py 8791
```

Danach <http://localhost:8791/> im Browser öffnen.

Erster Schritt in der App: unter **Einstellungen** einen Hund und eine Hundeführer:in anlegen.

---

## Veröffentlichen über GitHub Pages

1. Repository auf GitHub anlegen und den Ordner hochladen:

```bash
git init && git branch -M main && git add -A && git commit -m "Trainingstagebuch v1.0.0"
```

```bash
git remote add origin https://github.com/BENUTZERNAME/trainingstagebuch.git && git push -u origin main
```

2. Auf GitHub unter **Settings → Pages** bei *Source* **GitHub Actions** auswählen.

3. Fertig. Der Workflow `.github/workflows/deploy.yml` veröffentlicht bei jedem Push auf `main`
   automatisch und stempelt dabei die Buildnummer in die Version.

Die Seite liegt danach unter `https://BENUTZERNAME.github.io/trainingstagebuch/`.

> Für kostenlose GitHub-Konten muss das Repository **öffentlich** sein, damit Pages funktioniert.
> Das betrifft nur den Programmcode – die Trainingsdaten liegen niemals im Repository.

Auf dem Handy: Seite öffnen → Teilen → „Zum Home-Bildschirm“. Dann startet sie wie eine App
und funktioniert auch ohne Empfang im Wald.

---

## Rollen: Hundeführer:in und Ausbildung

Unter **Einstellungen → Dieses Gerät** wird festgelegt, wer daran arbeitet und in welcher Rolle.
Beides sind Geräte-Einstellungen und werden nicht mit abgeglichen.

| | **Hundeführer:in** | **Ausbilder:in** |
|---|---|---|
| Sichtbare Hunde | nur die zugeordneten | alle |
| Dokumentieren | ja | ja |
| Einheiten bestätigen | nein | ja |
| Dashboard, Verbellen-Stand, Helfer:in-Bilder | nur wenn freigegeben | ja |

Der Wechsel in die Ausbilder-Rolle ist **passwortpflichtig**. Das Passwort wird im Team
mündlich weitergegeben und steht bewusst *nicht* im Quelltext – hinterlegt ist nur ein
Prüfwert (SHA-256 mit Salt), aus dem es sich nicht zurückrechnen lässt. Das ist nötig, weil
dieses Repository öffentlich ist. Der Weg zurück zur Hundeführer:in-Rolle braucht kein Passwort.

Auch hier gilt die Einordnung von oben: Das Passwort verhindert, dass jemand die Rolle mal eben
umstellt. Es ist keine Zugriffssperre – die Prüfung läuft im Browser und ließe sich mit
Entwicklerwerkzeugen umgehen.

Die Zuordnung Hund → Hundeführer:in erfolgt unter **Einstellungen → Hunde**. Ein Hund kann
mehreren Personen zugeordnet sein, eine Person mehreren Hunden. Ein Hund ohne Zuordnung ist
nur für die Ausbildung sichtbar.

Ob Hundeführer:innen die Auswertungen **ihrer eigenen** Hunde einsehen dürfen, entscheidet die
Ausbildung mit einem Schalter; ab Werk ist das aus.

> ### Wichtig: Rollen ordnen die Ansicht, sie schützen die Daten nicht
>
> Alle Geräte teilen sich eine Datei und einen Zugangs-Token. Wer den Token hat, kann technisch
> den gesamten Bestand lesen – unabhängig von der eingestellten Rolle, die jede:r am eigenen
> Gerät ändern kann. Für den Alltag (jede:r sieht die eigenen Hunde, die Ausbildung sieht alles)
> ist diese Trennung richtig und ausreichend. Als Vertraulichkeitsgrenze gegenüber den eigenen
> Leuten taugt sie nicht. Dafür bräuchte es einen Server mit Benutzerkonten, den eine statische
> Seite auf GitHub Pages nicht bereitstellen kann.

### Bestätigung der Einheiten

Jede abgeschlossene Einheit – Suche, Verbellen-Sitzung oder freie Dokumentation – wartet auf die
Bestätigung durch die Ausbildung. Festgehalten wird, **wer wann** bestätigt hat, dazu eine
freiwillige Bemerkung; zurückziehen ist möglich.

Bewusst kein gezeichneter Namenszug: In einer App, in der jede:r die eigene Rolle setzen kann,
sähe eine Unterschrift verbindlicher aus, als sie ist.

Hundeführer:innen sehen an jeder Einheit deren Stand. Die Ausbildung findet alle offenen
Bestätigungen gesammelt unter **Einstellungen → Ausbildung** oder über den Filter
*wartet auf Bestätigung* in der Übersicht.

---

## Verbellen

Der Trainingsplan stammt aus `Trainingsplan_Verbellen.xlsx` und ist wortgetreu übernommen:
zwei Wege mit zusammen **331 Unterübungen**.

| Weg | Stufen | Unterübungen |
|---|---|---|
| Box – Aufbau an der Box | 33 | 148 |
| Mensch – Übertrag auf die Versteckperson | 38 | 183 |

**Eingegeben wird in Sitzungen, der Fortschritt wird daraus abgeleitet.** Das ist bewusst so:
Gäbe es beides getrennt, könnten Sitzungsprotokoll und Fortschritt auseinanderlaufen. So gibt es
genau eine Wahrheit.

* Eine Unterübung gilt nach **drei gelungenen Wiederholungen** als sicher – wie in der Vorlage.
  Eine Sitzung hält fest, wie viele davon an diesem Tag gelungen sind; der Katalog summiert über
  alle abgeschlossenen Sitzungen. Was in früheren Sitzungen schon stand, wird in der Maske
  ausgegraut angezeigt.
* **Stufen sind frei wählbar.** Der Plan sperrt Mensch-Stufen, solange die zugehörigen
  Box-Stufen offen sind – das ist in der App aber nur ein *Hinweis*, keine Blockade. Wer
  abweichend trainiert, wählt die Stufe trotzdem.
* **Eigene Zusatzübungen** lassen sich je Stufe frei ergänzen, mit derselben Zählweise.
  Sie zählen nicht zum Planumfang von 331, erscheinen aber im Katalog bei ihrer Stufe.
* Der Box-Weg lässt sich je Hund überspringen (Schalter unter *Verbellen → Stand*); dann sind
  die Mensch-Stufen von vornherein frei.

Unter **Verbellen** steht der Stand je Hund: Gesamtfortschritt, beide Wege getrennt, die Stufe,
an der gerade gearbeitet wird, und je Stufe aufklappbar der Stand jeder Unterübung mit dem Datum,
an dem sie sicher wurde. Im **Dashboard** erscheint der Verbellen-Stand aller Hunde zusammen mit
den Suchstatistiken – die vollständige Übersicht auf einer Seite.

---

## Nur abgeschlossene Suchen gehen online

Beide Dokumentarten durchlaufen zwei Zustände:

| Zustand | Bedeutung |
|---|---|
| **Entwurf** | Wird gerade dokumentiert. Bleibt **ausschließlich auf diesem Gerät** und wird nie hochgeladen. |
| **Abgeschlossen** | Vollständig ausgefüllt und bewusst freigegeben. Erst jetzt geht der Eintrag ins Team. |

Damit landet im gemeinsamen Bestand nur, was auch wirklich fertig protokolliert ist –
keine halb ausgefüllten Formulare, die in der Auswertung Unsinn erzeugen.

Abschließen lässt sich ein Eintrag erst, wenn alle Pflichtangaben vorliegen. Die Maske zeigt
unten laufend, was noch fehlt – und aktualisiert das bei jeder Eingabe.

**Suche (9 Angaben):** Datum, Ort, Hund, Hundeführer:in, Suchzeit, mindestens eine
Versteckperson mit Ergebnis (gefunden / nicht gefunden) sowie mindestens je eine Bewertung
bei Team, Hund und Hundeführer:in.

**Freie Dokumentation (4 Angaben):** Datum, Überschrift, Hund sowie Freitext oder Skizze.

**Verbellen-Sitzung (4 Angaben):** Datum, Hund, mindestens eine bearbeitete Stufe und mindestens
eine gelungene Wiederholung. Solange eine Sitzung Entwurf ist, zählt sie auch nicht im
Fortschrittskatalog.

Wer eine abgeschlossene Suche nachträglich korrigieren will, öffnet sie wieder – sie wird dann
erneut zum Entwurf. Der bereits geteilte Stand bleibt beim Team, bis sie wieder abgeschlossen wird.

Im Dashboard werden standardmäßig nur abgeschlossene Suchen ausgewertet; Entwürfe lassen sich
über einen Schalter einbeziehen.

---

## Online-Abgleich einrichten

In der App unter **Einstellungen → Abgleich einrichten** führt ein Assistent durch die Einrichtung
und prüft jeden Schritt gegen den echten Dienst. Zur Wahl stehen zwei Verfahren:

| | GitHub-Repository (Vorgabe) | Cloud Firestore |
|---|---|---|
| Zusätzliches Konto | keines | Google-Konto |
| Aktualisierung | alle 45 Sekunden | sofort |
| Historie | jede Änderung als Commit nachvollziehbar | keine |
| Pro Gerät nötig | ein Zugangs-Token | nichts |

### Variante A – GitHub-Repository (Vorgabe, ohne Google-Konto)

Alle Datensätze liegen als eine JSON-Datei in einem Repository.
**Die Datenablage ist bereits ausgeliefert** – im Team muss nur noch der persönliche
Zugangs-Token eingetragen werden:

| | |
|---|---|
| Repository | `timgenkinger/Trainingstagebuch-Fl-che` (**privat**) |
| Branch | `daten` |
| Datei | `trainingsdaten.json` |

**Für jedes Gerät einmalig:**

1. Einen [Fine-grained Token](https://github.com/settings/personal-access-tokens/new) erzeugen:
   unter *Repository access* nur `Trainingstagebuch-Fl-che` auswählen und bei
   *Repository permissions → **Contents*** auf **Read and write** stellen. Alles andere bleibt
   auf *No access*.
   Alternativ gibt eine Person im Team einen gemeinsamen Token weiter – dann entfällt dieser Schritt.
2. In der App unter **Einstellungen** in das Feld „Nur noch der Zugangs-Token fehlt" einfügen
   und auf **Verbinden** klicken.

Der Token wird ausschließlich im Browser des jeweiligen Geräts gespeichert. Er landet nie im
Repository, nie in einem Export und nie in der Sicherungsdatei.

> Weil das Repository privat ist, kommt ohne gültigen Token niemand an die Trainingsdaten –
> auch nicht über die Adresse, die im Programmcode steht.

**Anderes Repository verwenden?** Unter **Einstellungen → Einrichtung ändern** führt der
Assistent durch alle Angaben und prüft jeden Schritt gegen die echte API. Dabei gilt:
der Datenbranch sollte **nicht** der Hauptbranch eines Repositories sein, das GitHub Pages
ausliefert – sonst löst jedes Speichern einen Deploy aus. Ein noch leeres Repository wird
beim ersten Verbinden automatisch eingerichtet.

**Wie Konflikte behandelt werden:** Vor jedem Schreiben liest die App den aktuellen Stand
frisch ein und mischt ihn mit dem lokalen. Speichert jemand zeitgleich, antwortet GitHub mit
einem Konflikt – dann wiederholt sich der Ablauf mit dem neuen Stand. Dadurch kann keine
fremde Änderung überschrieben werden.

### Variante B – Cloud Firestore (Echtzeit)

1. In der [Firebase-Konsole](https://console.firebase.google.com) ein Projekt anlegen.
2. **Build → Firestore Database** erstellen, Standort `eur3 (europe-west)`, Modus *Produktion*.
3. **Build → Authentication** öffnen und die Anmeldemethode **Anonym** aktivieren.
4. Unter **Regeln** einsetzen:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /trainingstagebuch/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. **Projekteinstellungen → Meine Apps → Web-App** anlegen und die Konfiguration im
   Assistenten einfügen.

Die Firebase-Web-Konfiguration ist kein Passwort, sondern eine Adresse. Der Schutz kommt aus
den Regeln – und die erlauben jedem anonym Angemeldeten Zugriff. Bei einem öffentlichen
Repository die Konfiguration deshalb **nicht** committen, sondern im Team weitergeben.

### Ohne Abgleich

Die App funktioniert vollständig ohne beides – dann liegen die Daten nur auf dem jeweiligen
Gerät. Zum Austausch gibt es unter **Einstellungen → Sicherung** Export und Import als JSON.
Der Import mischt und überschreibt nie neuere Daten.

---

## Versionsnummern und Updates

Jede Veröffentlichung bekommt eine eigene Versionsnummer. Sie steht in der Kopfzeile der App
und unter Einstellungen.

```bash
./scripts/release.sh patch -m "Radius-Auswertung ergänzt"
```

`patch` (1.0.0 → 1.0.1) für Korrekturen, `minor` (→ 1.1.0) für neue Funktionen,
`major` (→ 2.0.0) für große Umbauten; alternativ direkt `./scripts/release.sh 2.3.0`.

Das Skript pflegt in einem Rutsch:

* `version.json` und `assets/js/version.js` (Anzeige in der App)
* den Cache-Namen in `sw.js` – dadurch laden alle Geräte die neue Fassung
* einen neuen Eintrag in `CHANGELOG.md`

Danach committen und pushen:

```bash
git add -A && git commit -m "Version 1.0.1" && git push
```

Der GitHub-Workflow ergänzt beim Veröffentlichen automatisch die Buildnummer,
sodass in der App z.B. `v1.0.1 (Build 14 · a1b2c3d)` steht.

Läuft die App bei jemandem gerade, erscheint oben ein Balken „Neue Version … verfügbar“
mit beiden Versionsnummern. Ein Klick lädt sie neu – **die Daten bleiben dabei unangetastet.**

### Wie die Aktualisierung abläuft

Geprüft wird **bei jeder Rückkehr in den Vordergrund**, nicht nach Uhrzeit. Das ist wichtig für
die zum Home-Bildschirm hinzugefügte iPhone-App: Sie wird beim Verlassen nur schlafen gelegt,
Zeitgeber laufen dort nicht weiter.

Drei Dinge müssen zusammenspielen, und jedes davon war einmal die Ursache eines Fehlers:

* Der Service Worker wird mit `updateViaCache: 'none'` registriert. Sonst holt der Browser
  `sw.js` aus dem HTTP-Cache (GitHub Pages liefert `max-age=600`) und bemerkt neue Fassungen nicht.
* Beim Installieren lädt er seine Dateien mit `cache: 'reload'`. Sonst legt ein neuer Worker
  die *alten* Dateien in seinen *neuen* Cache – die Übernahme sieht dann korrekt aus, die App
  zeigt aber weiter die alte Fassung.
* Unabhängig davon vergleicht die App die ausgelieferte `version.json` mit ihrer eingebauten
  Version. Klemmt der Service Worker, meldet sie die neue Fassung trotzdem.

Unter **Einstellungen → Version** steht der komplette Programmstand: installierte Version,
Stand auf dem Server, Zustand des Offline-Speichers und Zeitpunkt der letzten Prüfung. Ganz
unten lässt sich der Offline-Speicher zurücksetzen, falls doch einmal etwas klemmt – die Daten
liegen in der Datenbank und bleiben davon unberührt.

---

## Wie die Speicherung funktioniert

Das war die zentrale Anforderung: *synchron im Team, aber Speichern darf nie etwas zurücksetzen.*
Deshalb arbeitet die App nach dem Prinzip **local first**:

1. **Jede Eingabe landet sofort in der lokalen Datenbank** (IndexedDB im Browser).
   Das passiert automatisch beim Tippen, es gibt keinen „Speichern“-Knopf, der vergessen werden kann.
2. **Der Abgleich mischt nur.** Jeder Datensatz trägt einen Zeitstempel `updatedAt`;
   übernommen wird immer der jüngere Stand. Ein älterer Serverstand überschreibt nie
   eine neuere lokale Eingabe.
3. **Ein leerer Server löscht nichts.** Fehlt ein Datensatz in der Cloud, bleibt er lokal bestehen.
   Damit kann ein Verbindungs- oder Konfigurationsfehler keinen Datenverlust auslösen.
4. **Löschen erzeugt einen Grabstein** statt eines echten Löschens. Nur so kann sich eine
   Löschung überhaupt im Team ausbreiten – und der Papierkorb erlaubt das Wiederherstellen.
5. **Offline wird gepuffert.** Ohne Netz sammelt die App die Änderungen und schickt sie nach,
   sobald wieder Verbindung besteht. Der Zähler oben rechts zeigt, wie viele noch warten.
6. **Ein Update tauscht nur den Programmcode aus.** Der Service Worker verwaltet ausschließlich
   den Cache der Programmdateien und fasst die Datenbank nie an.
7. **Freigabe-Schranke.** Eine Suche verlässt das Gerät erst, wenn ihr Protokoll abgeschlossen
   ist. Entwürfe bleiben vorgemerkt und gehen automatisch mit, sobald sie freigegeben werden.

Der Status oben rechts: grau *Nur lokal*, orange *Verbinde/Offline*, grün *Synchron*, rot *Fehler*
(Titel antippen zeigt den Grund).

Direkt daneben sitzt der **Aktualisieren-Knopf**. Er lädt die Seite neu und ist dabei sicherer
als der Neu-laden-Knopf des Browsers: Er schreibt zuerst offene Eingaben fest, prüft dann, ob
eine neue Programmfassung bereitliegt, und übernimmt sie gleich mit. Ungespeicherte Tipparbeit
geht dabei nicht verloren.

---

## Aufbau des Projekts

```
index.html                 App-Gerüst, Kopfzeile, Navigation
sw.js                      Service Worker (Offline-Cache des Programmcodes)
manifest.webmanifest       Installation als App
version.json               aktuelle Version (vom Release-Skript gepflegt)
CHANGELOG.md               Änderungsprotokoll

assets/css/styles.css      gesamtes Design, hell und dunkel, Druckansicht
assets/js/
  app.js                   Router, Statusanzeige, Update-Hinweis
  schema.js                fachliches Modell: alle Kriterien und Helfer:in-Bilder aus dem Heft
  store.js                 lokal-zuerst-Speicher, Misch- und Löschregeln
  idb.js                   IndexedDB-Zugriff
  sync/index.js            Steuerung des Abgleichs, Freigabe-Schranke, Protokoll
  sync/github.js           Abgleich über ein GitHub-Repository
  sync/firestore.js        Abgleich über Cloud Firestore
  config.js                Adresse des Datenspeichers (ohne Token)
  charts.js                Diagramme (selbst gezeichnetes SVG)
  verbellen-plan.js        Trainingsplan Verbellen (wortgetreu aus der Vorlage)
  verbellen.js             Ableitung des Fortschritts aus den Sitzungen
  rollen.js                Rollen, Sichtbarkeit, Bestätigungen
  update.js                Programm-Aktualisierung
  helferbilder.js          Ableitung der Helfer:in-Bilder aus den Suchen
  skizze.js                Zeichenfeld für das Suchgebiet
  ui.js                    Bausteine: Skala, Chips, Karten, Meldungen
  views/
    suchen.js              Übersicht beider Dokumentarten
    bausteine.js           gemeinsame Bausteine der Dokumentarten (Grundwerte, Abschluss)
    bestaetigung.js        Bestätigung einer Einheit durch die Ausbildung
    editor.js              Erfassungsmaske einer Suche
    freidoku.js            Erfassungsmaske der freien Dokumentation
    verbellen-editor.js    Erfassungsmaske einer Verbellen-Sitzung
    verbellen.js           Fortschrittskatalog Verbellen
    dashboard.js           Auswertung
    bilder.js              Helfer:in-Bilder
    einrichtung.js         Assistent für den Online-Abgleich
    einstellungen.js       Sync, Stammdaten, Sicherung, Version

scripts/release.sh         vergibt eine neue Versionsnummer
scripts/dev-server.py      lokaler Testserver
.github/workflows/deploy.yml   Veröffentlichung auf GitHub Pages
```

Vorlage der Inhalte: *Die Rettungshundestunde – Trainingstagebuch*, 3. überarbeitete Auflage
(Paula Drope / Kathrin Schwenke). Diese App ist eine private digitale Arbeitshilfe dazu.
