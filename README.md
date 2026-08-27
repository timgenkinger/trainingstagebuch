# Rettungshund Trainingstagebuch

Digitale Fassung des gedruckten Trainingstagebuchs für die Flächensuche.
Jede Suche wird als **eigener, abgeschlossener Datensatz** dokumentiert, alle Werte
laufen in ein **Dashboard** zur Auswertung, und die Daten werden im Team
**online abgeglichen** – ohne dass ein Update oder ein Abgleich jemals Daten zurücksetzt.

Die App ist eine reine statische Web-App: **kein Build, keine Abhängigkeiten, kein Server.**
Sie läuft über GitHub Pages, ist offlinefähig und lässt sich auf dem Handy als App installieren.

---

## Inhalt

1. [Funktionsumfang](#funktionsumfang)
2. [Schnellstart lokal](#schnellstart-lokal)
3. [Veröffentlichen über GitHub Pages](#veröffentlichen-über-github-pages)
4. [Online-Abgleich einrichten (Firebase)](#online-abgleich-einrichten-firebase)
5. [Versionsnummern und Updates](#versionsnummern-und-updates)
6. [Wie die Speicherung funktioniert](#wie-die-speicherung-funktioniert)
7. [Aufbau des Projekts](#aufbau-des-projekts)

---

## Funktionsumfang

**Suche erfassen** (bildet Seite 1 und 2 des Hefts ab)

| Heft | App |
|---|---|
| Datum, Ort, Trainingsziel | Kopfdaten, zusätzlich Hund und Hundeführer:in |
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
  gesamte Suchzeit, Suchen mit Fehlanzeige
* Leistungsentwicklung über die Zeit – für alle drei Bereiche oder ein einzelnes Kriterium
* Durchschnitt je Kriterium, **schwächstes zuerst** (zeigt sofort, woran zu arbeiten ist)
* Häufigkeit der Problemverhalten
* Trainierte Bedingungen (zeigt Lücken im Trainingsplan) und Ø Note **je Bedingung**
* Fortschritt bei den Helfer:in-Bildern
* Filter nach Hund und Zeitraum

**Helfer:in-Bilder** – alle 39 Bilder der Heftliste als Fortschrittskatalog je Hund,
vier Stufen (kennengelernt / kurze Anzeige / längere Anzeige / gemeistert). Die im Heft
fett gedruckten Bilder sind als **wichtig** markiert. Bilder, bei denen korrektes Verhalten
*keine* Anzeige ist (Attrappen), haben nur die erste Stufe.

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

## Online-Abgleich einrichten (Firebase)

Damit alle im Team dieselben Daten sehen, braucht es eine gemeinsame Datenbank.
Die App nutzt **Cloud Firestore**; der kostenlose Tarif reicht für diesen Zweck bei Weitem.

### 1. Projekt anlegen

1. <https://console.firebase.google.com> → **Projekt hinzufügen** (Google Analytics kann aus bleiben).
2. Links **Build → Firestore Database → Datenbank erstellen**.
   Standort: `eur3 (europe-west)`. Modus: *Produktion*.
3. Links **Build → Authentication → Erste Schritte** → Anmeldemethode **Anonym** aktivieren.

### 2. Sicherheitsregeln setzen

Firestore Database → Reiter **Regeln** → einfügen und veröffentlichen:

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

### 3. Web-App registrieren und Konfiguration eintragen

1. Projektübersicht → Zahnrad → **Projekteinstellungen** → Abschnitt *Meine Apps* → **Web-App** (`</>`) hinzufügen.
2. Den angezeigten `firebaseConfig`-Block kopieren.
3. In der App unter **Einstellungen → Online-Abgleich** in das Feld einfügen und auf
   **Speichern & verbinden** klicken. Der Punkt oben rechts wird grün.

### 4. Das Team anschließen – zwei Wege

| Weg | Vorgehen | Wann sinnvoll |
|---|---|---|
| **A – jede:r trägt die Konfiguration einmal selbst ein** | Konfiguration im Team weitergeben (z.B. per Messenger), jede:r fügt sie einmal unter Einstellungen ein | **Empfohlen bei öffentlichem Repository.** Nur wer die Konfiguration bekommen hat, kann mitschreiben |
| **B – Konfiguration ins Repository** | In der App auf **„config.js für das Team kopieren“** klicken und den Text in `assets/js/config.js` einsetzen, committen und pushen | Bequem – aber jede:r, der die Seite findet, kann mitschreiben. Nur bei privatem Repository verwenden |

Der Grund: Die Firebase-Web-Konfiguration ist kein Passwort, sondern nur eine Adresse.
Der Schutz kommt aus den Regeln oben – und die erlauben jedem angemeldeten (auch anonymen)
Zugriff. Wer die Konfiguration nicht hat, kommt nicht an die Daten.

> Aus demselben Grund: keine besonders schützenswerten personenbezogenen Daten in die
> Notizfelder schreiben. Für ein Trainingstagebuch mit Vornamen ist das unkritisch.

### Ohne Online-Abgleich

Die App funktioniert vollständig ohne Firebase – dann liegen die Daten nur auf dem jeweiligen
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

Läuft die App bei jemandem gerade, erscheint oben ein Balken **„Eine neue Version ist
verfügbar“**. Ein Klick lädt sie neu – **die Daten bleiben dabei unangetastet.**

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

Der Status oben rechts: grau *Nur lokal*, orange *Verbinde/Offline*, grün *Synchron*, rot *Fehler*
(Titel antippen zeigt den Grund).

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
  sync.js                  Abgleich mit Firestore
  config.js                Firebase-Konfiguration fürs Team
  charts.js                Diagramme (selbst gezeichnetes SVG)
  skizze.js                Zeichenfeld für das Suchgebiet
  ui.js                    Bausteine: Skala, Chips, Karten, Meldungen
  views/
    suchen.js              Übersicht aller Suchen
    editor.js              Erfassungsmaske einer Suche
    dashboard.js           Auswertung
    bilder.js              Helfer:in-Bilder
    einstellungen.js       Sync, Stammdaten, Sicherung, Version

scripts/release.sh         vergibt eine neue Versionsnummer
scripts/dev-server.py      lokaler Testserver
.github/workflows/deploy.yml   Veröffentlichung auf GitHub Pages
```

Vorlage der Inhalte: *Die Rettungshundestunde – Trainingstagebuch*, 3. überarbeitete Auflage
(Paula Drope / Kathrin Schwenke). Diese App ist eine private digitale Arbeitshilfe dazu.
