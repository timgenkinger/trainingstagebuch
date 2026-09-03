# Änderungsprotokoll

## 1.10.0 – 2026-09-03
- **Eigene Helfer:in-Bilder** lassen sich in der Uebersicht anlegen, wahlweise gleich als
  wichtig markiert. Sie stehen danach in jeder Sucherfassung zur Auswahl (mit dem Zusatz
  „eigenes“), zaehlen im Fortschritt mit und werden im Team abgeglichen.
- Entfernen ist nur moeglich, solange ein Bild in keiner Suche vorkommt – sonst zeigte ein
  bestehendes Protokoll auf einen Namen, den es nicht mehr gibt. Doppelte Namen werden
  abgewiesen.
- Kontrast im Dunkelmodus korrigiert: Die blauen Marken nutzten eine Farbe, die dort als
  Schriftfarbe aufgehellt ist (2,51:1 mit weisser Schrift). Fuell- und Schriftrolle sind jetzt
  auch beim Blau getrennt (5,2:1).

## 1.9.2 – 2026-09-03
- **Handbuch als PDF** (11 Seiten): Bedienungsanleitung fuer Hundefuehrer:innen und
  Ausbildung, im Hausdesign. Verlinkt in der App unter Einstellungen – Version.
- Erzeugt wird es aus `scripts/handbuch.py` und traegt automatisch die Versionsnummer
  aus `version.json`; nach Aenderungen laesst es sich neu erzeugen.

## 1.9.1 – 2026-09-03
- Die Zuordnung Hundefuehrer:in → Hund erfolgt jetzt ueber ein **Auswahlmenü** statt einer
  Liste aller Namen; angeboten werden nur die noch nicht zugeordneten Personen.
- Die Richtung der Zuordnung ist klar benannt: Ueber jedem Block steht
  „Wer führt <Hundename>?“. Zugeordnete Personen erscheinen als Marken mit eigenem
  Löse-Knopf, jede Aenderung wird im Klartext bestaetigt („Sabine führt jetzt Nala.“).

## 1.9.0 – 2026-09-03
- **Ein neues Gerät ist immer Hundeführer:in ohne Zuordnung.** Die bisherige Rueckfallregel,
  nach der ein nicht zugeordnetes Geraet alles sah, ist entfallen. Stattdessen fuehren
  Uebersicht und Einstellungen deutlich zum ersten Schritt.
- **Hund und Hundeführer:in des Geräts sind in jeder Erfassungsmaske vorausgewählt.**
- **Fremde Hunde kann nur die Ausbildung erfassen**: In der Hundeauswahl stehen einer
  Hundefuehrer:in ausschliesslich die eigenen Hunde. Die Hundefuehrer:in selbst ist fest auf
  das Geraet eingestellt und nur fuer die Ausbildung frei waehlbar.
- Ein bereits eingetragener fremder Hund bleibt in der Auswahl sichtbar, damit das Oeffnen
  eines bestehenden Eintrags ihn nicht stillschweigend umschreibt.

## 1.8.1 – 2026-09-03
- **Der Wechsel in die Ausbilder-Rolle verlangt jetzt ein Passwort.** Der Weg zurueck
  zur Hundefuehrer:in-Rolle bleibt frei.
- Hinterlegt ist nicht das Passwort, sondern nur ein Pruefwert (SHA-256 mit Salt) - dieses
  Repository ist oeffentlich, im Klartext stuende das Passwort damit im Internet.
- Fehler behoben: Die Navigation wurde nicht bei jedem Ansichtswechsel neu bewertet. Aendert
  sich die Rolle oder die Freigabe des Teams im laufenden Betrieb, passen sich die Reiter
  jetzt sofort an, statt erst beim naechsten Neuladen.

## 1.8.0 – 2026-09-03
- **Rollen: Hundeführer:in und Ausbilder:in.** Unter Einstellungen wird festgelegt, wer am
  Geraet arbeitet und in welcher Rolle. Hundefuehrer:innen sehen nur die ihnen zugeordneten
  Hunde und deren Dokumentation; die Zuordnung erfolgt je Hund und erlaubt mehrere Personen
  wie auch mehrere Hunde je Person.
- **Bestaetigung der Einheiten durch die Ausbildung.** Jede abgeschlossene Einheit - Suche,
  Verbellen-Sitzung, freie Dokumentation - wartet auf Bestaetigung. Festgehalten wird, wer
  wann bestaetigt hat, dazu eine freiwillige Bemerkung; Zuruecknahme moeglich. Offene
  Bestaetigungen gesammelt unter Einstellungen und als Filter in der Uebersicht.
- **Auswertungen sind der Ausbildung vorbehalten**: Dashboard, Verbellen-Stand und
  Helfer:in-Bilder sind fuer Hundefuehrer:innen ausgeblendet. Die Ausbildung kann per Schalter
  freigeben, dass sie den Stand ihrer EIGENEN Hunde sehen duerfen.
- Klar benannt, in App und README: Rollen ordnen die Ansicht, sie schuetzen die Daten nicht.
  Alle teilen sich eine Datei und einen Token; eine echte Zugriffssperre braeuchte einen
  Server mit Benutzerkonten.
- Kontrast des neuen Rollen-Abzeichens korrigiert (4,12:1 auf 6,8:1); die helle Auflage auf
  dem roten Grund wich einer dunklen, was auch Statusanzeige und Aktualisieren-Knopf zugute kommt.

## 1.7.3 – 2026-09-03
- **Sechste und entscheidende Ursache der iPhone-Update-Probleme gefunden:** Der
  Service Worker fuellte seinen Cache beim Installieren mit `cache.addAll(...)`.
  Diese Abrufe gehen durch den HTTP-Cache des Browsers - GitHub Pages liefert mit
  `max-age=600`. Ein neuer Worker legte sich damit die ALTEN Dateien in seinen
  neuen Cache: Uebernahme und Neuladen liefen sauber, die App zeigte danach
  trotzdem die alte Fassung. Jetzt wird mit `cache: 'reload'` am HTTP-Cache
  vorbei geladen.
- Faellt eine einzelne Datei aus, bricht die Installation nicht mehr komplett ab -
  sonst bliebe die alte Fassung dauerhaft stehen.
- Die Cache-Suche greift nur noch auf den Cache der laufenden Fassung zu.
  `caches.match` durchsucht alle Caches in Anlegereihenfolge und haette in der
  Uebergangszeit den aelteren Stand bevorzugt.

## 1.7.2 – 2026-09-03
- Nachweis der Update-Übernahme

## 1.7.1 – 2026-09-03
- **Fehler behoben: Die Aktualisierung der zum Home-Bildschirm hinzugefuegten
  iPhone-App funktionierte nicht zuverlaessig.** Fuenf Ursachen:
  1. Bei der Registrierung fehlte `updateViaCache: 'none'`. GitHub Pages liefert
     sw.js mit `max-age=600`, der Browser bediente die Update-Pruefung also aus
     dem HTTP-Cache und bemerkte neue Fassungen gar nicht.
  2. Direkt nach `update()` wurde `registration.waiting` abgefragt - zu frueh,
     der neue Worker ist dann meist noch `installing`. Die Uebernahme wurde
     deshalb uebersprungen und das Neuladen brachte wieder die alte Fassung.
  3. Statt auf den Reglerwechsel zu warten, wurden 350 ms geraten.
  4. Die Pruefung lief per Stundentakt. Eine Standalone-App wird beim Verlassen
     schlafen gelegt, Zeitgeber laufen nicht weiter - gepruefft wird jetzt bei
     jeder Rueckkehr in den Vordergrund.
  5. `location.reload()` konnte das Dokument aus dem Cache holen.
- Sicherheitsnetz: Die ausgelieferte version.json wird ohne Cache abgeglichen.
  Klemmt der Service Worker, meldet die App die neue Fassung trotzdem.
- Seitenaufrufe holt der Service Worker jetzt zuerst aus dem Netz, damit er im
  Klemmfall nicht endlos die alte Seite ausliefert.
- Einstellungen zeigen den Programmstand (installiert, auf dem Server, Zustand
  des Offline-Speichers, letzte Pruefung) und bieten als letzte Moeglichkeit ein
  Zuruecksetzen des Offline-Speichers - ohne die Daten anzutasten.

## 1.7.0 – 2026-09-02
- **Helfer:in-Bilder speisen sich jetzt aus den Suchen.** Ein bei einer Versteckperson
  gewaehltes Bild gilt ab der abgeschlossenen Suche als kennengelernt - kein zusaetzliches
  Abhaken mehr. Je Zeile: wie oft eingesetzt, wann zuletzt und wie oft gefunden.
- Bilder ohne Einsatz sind als "noch nie im Training" gekennzeichnet und ueber einen
  eigenen Filter zusammen sichtbar; Kennzahlen dazu in Uebersicht und Dashboard.
- Bewusst automatisch ist nur Stufe 1. Die Stufen 2 bis 4 bleiben Einschaetzung des
  Hundefuehrers, weil die Dauer der Anzeige nicht protokolliert wird. Eine Handbewertung
  hebt die Stufe an; ihre Ruecknahme laesst den Beleg aus der Suche bestehen.
- Entwuerfe zaehlen nicht mit - wie bei Verbellen zaehlt nur, was abgeschlossen ist.

## 1.6.0 – 2026-09-02
- **Dritte Dokumentart: Verbellen.** Der Trainingsplan aus "Verbell App 2.0" ist wortgetreu
  uebernommen (Box 33 Stufen/148 Unteruebungen, Mensch 38/183, Sperrlogik inklusive).
- Eingegeben wird in **Sitzungen**, der Fortschrittskatalog wird daraus abgeleitet - eine
  Wahrheit statt zweier Staende, die auseinanderlaufen koennen. Drei gelungene
  Wiederholungen je Unteruebung wie in der Vorlage, ueber Sitzungen hinweg summiert.
- **Stufen sind frei waehlbar**; die Sperre aus dem Plan ist nur ein Hinweis. **Eigene
  Zusatzuebungen** lassen sich je Stufe frei ergaenzen. Der Box-Weg ist je Hund
  ueberspringbar.
- Neue Ansicht **Verbellen** mit dem Stand je Hund und aufklappbaren Stufen; im
  **Dashboard** steht der Verbellen-Stand aller Hunde ueber den Suchstatistiken.

## 1.5.0 – 2026-09-02
- **Aktualisieren-Knopf** in der Kopfzeile neben der Statusanzeige. Er ist sicherer als
  das Neuladen des Browsers: Zuerst werden offene Eingaben festgeschrieben, dann wird
  geprueft, ob eine neue Programmfassung bereitliegt, und diese gleich uebernommen.
  Nachgewiesen: Text, der 80 ms vor dem Klick getippt wurde - also weit vor der
  Speicherverzoegerung von 700 ms -, ueberlebt den Reload.

## 1.4.0 – 2026-09-02
- **Zweite Dokumentart: freie Dokumentation.** Grundwerte, Zeichenfeld und Freitext –
  fuer alles, was kein Suchprotokoll ist (Gehorsam, Geraete, Theorie, Beobachtungen).
  Sie unterliegt derselben Freigabe-Schranke, mit vier statt neun Pflichtangaben.
- **Wartezeit im Auto bis zur Suche** steht in beiden Dokumentarten ganz oben in den
  Grundwerten. Im Dashboard als eigene Kennzahl und als Bedingung in vier Stufen,
  sodass sichtbar wird, ob lange Wartezeiten die Leistung druecken.
- Die Grundwerte liegen jetzt in einem gemeinsamen Baustein statt doppelt in beiden
  Masken – sonst waeren sie mit der Zeit auseinandergelaufen.
- Uebersicht fuehrt beide Arten mit Filter; die Auswertung bleibt den Suchen vorbehalten.

## 1.3.0 – 2026-08-28
- **Fehler behoben:** Eine Suche liess sich erst nach einem Neuladen des Browsers
  abschliessen und damit uebermitteln. Ursache war die Optimierung aus 1.1.0, die
  das Formular bei Klicks nicht mehr neu zeichnet – dabei blieb auch die
  Abschluss-Karte auf dem Stand des letzten Zeichnens stehen. Sie laeuft jetzt bei
  jeder Eingabe mit, ohne den Rest des Formulars anzufassen.
- Die Auswahl der Anzeigeart entfaellt: Es wird durchgaengig durch Bellen angezeigt.
  Im Dashboard steht an ihrer Stelle jetzt die Verteilung der Fundabstaende.
- **Kontraste nach WCAG AA geprueft und korrigiert.** Behoben: dunkelrote Schrift auf
  rotem Grund bei den Hauptknoepfen (1,5:1 – eine Regression aus der Farbumstellung),
  weisse Noten auf hellen Skalenfarben (1,6:1), zu blasse Reiter in der Kopfzeile
  (3,4:1) sowie im Dunkelmodus weisse Schrift auf aufgehelltem Rot (3,4:1) und
  zu dunkle Warnhinweise (2,7:1). Beide Modi bestehen jetzt in allen Ansichten.

## 1.2.0 – 2026-08-28
- Gemeinsame Datenablage ist ab Werk hinterlegt (privates Repository
  `timgenkinger/Trainingstagebuch-Fl-che`, Branch `daten`). Im Team muss nur noch
  der persönliche Zugangs-Token eingetragen werden – dafür gibt es in den
  Einstellungen ein eigenes Eingabefeld statt des Assistenten.
- Fehler behoben: In einem **komplett leeren** Repository verweigert die Git-Data-API
  die Arbeit ("Git Repository is empty"). Der Datenbranch wird dort jetzt zuerst über
  die Contents-API angelegt und anschließend abgezweigt.
- Eigener Zustand "Zugang fehlt" statt der irreführenden Meldung "Kein Abgleich";
  die Einstellungen ziehen Statusänderungen des Abgleichs jetzt nach.

## 1.1.0 – 2026-08-28
- **Online-Abgleich über ein GitHub-Repository** als zweites Verfahren neben Firestore –
  ohne zusätzliches Konto. Konflikte werden durch Lesen-Mischen-Wiederholen aufgelöst,
  die Daten liegen auf einem eigenen Branch und lösen keinen Pages-Deploy aus.
- **Freigabe-Schranke:** Eine Suche geht erst online, wenn ihr Protokoll vollständig
  ausgeführt und abgeschlossen ist. Entwürfe bleiben auf dem Gerät. Der Editor zeigt
  laufend, welche Pflichtangaben noch fehlen.
- **Einrichtungs-Assistent** für den Abgleich, der jeden Schritt gegen den echten Dienst
  prüft und Fehler konkret benennt (Token abgelehnt, kein Schreibrecht, Repository öffentlich …).
- Abgleich-Protokoll in den Einstellungen; Entwurf-Kennzeichnung in Liste und Dashboard.
- Gestaltung auf die Hausfarben des Bayerischen Roten Kreuzes umgestellt
  (ohne das geschützte Rotkreuz-Emblem).

## 1.0.0 – 2026-08-27
- Erste Fassung: Suchen nach Vorlage des gedruckten Trainingstagebuchs erfassen
  (Seite 1 Rahmenbedingungen + Verlauf, Seite 2 Verhalten Hund/Hundeführer:in).
- Skizzenfeld für das Suchgebiet, Versteckpersonen mit Fundzeit, Anzeigeart und Radius.
- Dashboard mit Leistungsentwicklung, Kriterienvergleich, Problemverhalten und Bedingungen.
- Helfer:in-Bilder als Fortschrittskatalog je Hund (4 Stufen).
- Lokal-zuerst-Speicherung in IndexedDB mit mischendem Online-Abgleich über Firestore.
- Offlinefähig (Service Worker), installierbar als App, Versionsanzeige und Update-Hinweis.
