# Änderungsprotokoll

## 1.18.1 – 2026-09-10
- **Verbellen liess sich als Hundeführer:in gar nicht erfassen.** Die Erfassungsmaske hing an
  derselben Sperre wie der Fortschrittskatalog, weil beide denselben Reiter tragen – der Eintrag
  „Verbellen“ im Plusmenü endete deshalb bei „Diese Auswertung ist der Ausbildung vorbehalten“.
  Die Sperre hängt jetzt an der einzelnen Ansicht statt am Reiter: Dokumentieren geht in beiden
  Rollen, vorbehalten bleiben nur Dashboard, Fortschrittskatalog und Helfer:in-Bilder.
- Im leeren Zustand der Übersicht fehlte das Verbellen unter den Möglichkeiten. Wer bei der
  Einrichtung keinen Verbellen-Stand angab, hatte gar keinen Datensatz – und damit nirgends einen
  Weg zur ersten Sitzung.
- **Hunde anderer Hundeführer:innen liessen sich übernehmen.** Unter *Einstellungen → Hunde* sah
  jede:r alle Hunde samt Zuordnungs-Menü und konnte sich einem fremden Hund zuordnen; danach stand
  er in der Erfassung zur Auswahl. Hundeführer:innen sehen dort jetzt nur ihre eigenen Hunde, ohne
  Zuordnen, Lösen und Entfernen – doppelt abgesichert, sodass auch eine veraltete Ansicht nichts
  bewirkt. Der Einrichtungsassistent bietet nur noch Hunde an, die niemandem zugeordnet sind, und
  ein selbst angelegter Hund gehört der anlegenden Person.

## 1.18.0 – 2026-09-10
Aus dem ersten Nutzerfeedback nach dem Livegang.

- **Durchgang des Tages in allen vier Formularen.** Neben der Wartezeit im Auto steht jetzt, der
  wievielte Einsatz das an diesem Tag war (1, 2, 3 …). Ein dritter Durchgang steht unter anderen
  Voraussetzungen als der erste – ohne diese Angabe liessen sich die Bewertungen nicht sauber
  einordnen. Das Feld ist freiwillig und erscheint als Marke in der Übersicht.
- **Der rechte Rand der Kopfzeile läuft nicht mehr über.** Bei langen Namen schoben Namensschild,
  Abgleich-Status und Neu-laden die Kopfzeile über den roten Grund hinaus und die ganze Seite
  liess sich seitlich schieben. Ursache: Flex-Kinder schrumpfen von Haus aus nicht unter ihre
  Inhaltsbreite. Jetzt gibt zuerst der Schriftzug nach, das Namensschild kürzt mit „…“, und unter
  400 px zeigt der Abgleich nur noch seinen farbigen Punkt – die Lage steht weiterhin in der
  Beschriftung und beim Antippen.
- **Fortschrittsbalken werden wieder angezeigt.** Der Balken ist ein `<span>` und war deshalb
  inline – Höhe und Breite blieben wirkungslos, sobald er nicht in einer Flex-Zeile stand. Im
  Dashboard war der Verbellen-Balken dadurch unsichtbar, obwohl Daten vorhanden waren. Zusätzlich
  bleibt ein angefangener Plan jetzt sichtbar: 3 von 331 Unterübungen ergaben 2,8 px und damit
  nichts Erkennbares. Genau 0 bleibt weiterhin leer.
- **Das Verbellen erscheint im Dashboard immer.** Bisher hing der gesamte Dashboard-Inhalt an den
  Suchen – wer nur Verbellen-Sitzungen dokumentiert hatte, sah davon nichts, obwohl das Verbellen
  gar nicht aus Suchen abgeleitet wird. Ohne zugeordneten Hund steht dort jetzt der Grund.
- **Tippfehler im Verbellen-Plan:** 156 Unterübungen sagten „Besättigung“ statt „Bestätigung“. Der
  Fortschritt bleibt unberührt, da der Katalog über die Position zählt und nicht über den Text.

## 1.17.0 – 2026-09-09
- **Anzahl der Beller je Versteckperson.** Neben der Note für die Anzeige lässt sich nun
  eintragen, wie oft der Hund am Versteck angeschlagen hat – in beiden Sparten, direkt neben
  Suchzeit und Radius. Das Feld ist freiwillig und wird für den Abschluss einer Suche nicht
  verlangt; bereits dokumentierte Suchen bleiben unverändert und zeigen es leer.

## 1.16.1 – 2026-09-06
- **Als Versteckperson stehen jetzt auch die Hundeführer:innen zur Auswahl.** Die Liste ist in
  zwei Gruppen geteilt – das Team und „Gäste und weitere“ –, sodass niemand doppelt gepflegt
  werden muss. „+ neu“ bleibt für alle, die in keiner der beiden stehen, etwa Gäste im Training;
  gleich geschriebene Namen werden gegen beide Gruppen geprüft, damit ein Teammitglied nicht
  zusätzlich als Gast entsteht.
- Zeigt eine Zeile auf eine inzwischen entfernte Person, steht dort „entfernte Person“ statt
  einer leeren Auswahl – so verliert das Protokoll die Zuordnung nicht stillschweigend.
- Die Einstellungskarte heißt jetzt **Gäste als Versteckpersonen** und sagt dazu, dass das Team
  ohnehin schon in der Auswahl steht.
- Kontrast: „Jetzt aktualisieren“ stand im dunklen Modus bei 2,7:1 – die Schriftfarbe folgte
  einer Variablen, die dort ins Helle kippt, während der Knopfgrund fest weiß bleibt. Neu ist
  dafür `--auf-weiss`, das in beiden Modi dunkel bleibt (7,1:1); die drei anderen Stellen mit
  fest weißem Grund nutzen es mit.

## 1.16.0 – 2026-09-06
- **Einrichtungsassistent für neue Geräte.** Wer noch keiner Person zugeordnet ist, landet beim
  Öffnen von allein darin: Zugangscode, eigener Name, eigener Hund – in vier Schritten und ohne
  Umweg über die Einstellungen. Der Hund wird dabei sofort zugeordnet, es braucht dafür niemanden
  aus der Ausbildung. Angelegt wird erst beim Abschließen, ein Abbruch hinterlässt also nichts.
- **Vorhandenen Verbellen-Stand übernehmen.** Im Assistenten lässt sich angeben, bis zu welcher
  Stufe der Plan bereits sitzt – getrennt für Box und Versteckperson. Weil der Fortschritt immer
  aus den Sitzungen abgeleitet wird, entsteht daraus eine eigens gekennzeichnete
  Übernahme-Sitzung. So bleibt erkennbar, was wirklich trainiert und was beim Start eingetragen
  wurde.
- **Der rote Plus-Knopf öffnet jetzt ein Menü** mit allen vier Möglichkeiten: Flächensuche,
  Trümmersuche, Verbellen und freie Dokumentation. Vorher führte er stillschweigend nur in die
  Flächensuche und versteckte damit die übrigen Dokumentarten.
- **Versteckpersonen werden je Person erfasst**, nicht mehr als Namensliste oben im Suchgebiet.
  Der Name steht nun in derselben Zeile wie das Ergebnis; neue Namen legt „+ neu“ direkt dort an,
  gleich geschriebene werden zusammengeführt. Daraus entsteht die Dashboard-Karte
  **Versteckpersonen** mit Trefferquote und Ø Anzeige je Person, schwächste zuerst – damit
  auffällt, bei wem ein Hund regelmäßig danebenliegt.
- Kontraste nachgezogen: der Platzhalterstrich „—“ in Tabellen (1,7:1) und die Ziffern der noch
  offenen Schritte im Assistenten (4,0:1) erfüllen jetzt WCAG AA. Die Einträge des Plusmenüs
  haben ein 44 px hohes Antippfeld.

## 1.15.2 – 2026-09-06
- **Auch der Import ist jetzt der Ausbildung vorbehalten.** Er schreibt in den gemeinsamen
  Bestand und wirkt damit auf das ganze Team.
- Die Sicherungskarte zeigt Hundefuehrer:innen den Grund statt zweier fehlender Knoepfe,
  samt Hinweis, dass Abgeschlossenes ohnehin im gemeinsamen Datenspeicher liegt.
- Zwei Sperren wie beim Export: Die Knoepfe erscheinen nicht, und die Behandlung weist einen
  Aufruf ueber eine veraltete Oberflaeche zusaetzlich ab.

## 1.15.1 – 2026-09-06
- **Der Datenexport ist jetzt der Ausbildung vorbehalten.** Grund: Er umfasst den gesamten
  Bestand auf dem Geraet – auch Hunde, die der bedienenden Person nicht zugeordnet sind,
  weil der Abgleich alle Daten lokal ablegt. Ohne die Einschraenkung liesse sich die
  Rollentrennung damit umgehen.
- Der Import bleibt fuer alle offen; er mischt nur und ueberschreibt nichts Neueres.
- Hundefuehrer:innen sehen an der Stelle den Grund statt eines fehlenden Knopfes.

## 1.15.0 – 2026-09-06
- **Neue Dashboard-Statistik: Schwierigkeit der Verstecke je Hund.** Wie viele leichte,
  mittlere und schwere Verstecke im gewaehlten Zeitraum, als Balken und als Tabelle,
  dazu das Datum, an dem die Kategorie zuletzt vorkam.
- Das Datum bezieht sich bewusst auf alle abgeschlossenen Suchen, nicht auf den
  Zeitraumfilter – sonst haenge die Antwort auf „wann zuletzt“ am Filter und
  beantwortete die eigentliche Frage nicht. Der Kartenhinweis sagt das.
- Ohne Hundefilter erscheint eine Zeile je Hund.

## 1.14.0 – 2026-09-06
- **Vier neue Problemverhalten:** Restgeruch, Anzeige Kleidungsstücke, Anzeige Futter,
  Unsicherheit Gelände. Damit zehn statt sechs, in beiden Sparten.
- „Rauslaufen für Wind“ heisst jetzt **„Hund versucht selbständig Geruch zu finden“**.
  Nur die Beschriftung wurde geaendert, die Kennung bleibt – bereits erfasste Bewertungen
  behalten ihren Bezug.
- **„Schwierigkeit der Verstecke“ im Suchteam der Trümmersuche entfernt.** Die Schwierigkeit
  steht ohnehin je Versteckperson (leicht/mittel/schwer).
- Dabei behoben: Werte entfernter Kriterien lagen weiter im Datensatz und flossen
  unsichtbar in den Durchschnitt ein. Gezählt wird jetzt ausschliesslich, was im aktuellen
  Katalog steht.

## 1.13.0 – 2026-09-06
- **„Kann den Hund lesen“ gilt jetzt in beiden Sparten.** Das Kriterium kam mit der
  Trümmersuche und steht nun auch in der Flächensuche zur Verfügung – damit hat
  „Verhalten Hundeführer:in“ überall sieben Kriterien.
- Die getrennte Trümmer-Kriterienliste ist damit entfallen; beide Sparten greifen auf
  dieselbe Liste zu. Das Dashboard wertet sie ohne Sonderfall aus.

## 1.12.0 – 2026-09-06
- **Fotos in allen vier Erfassungsformularen.** Auf dem Handy oeffnet sich Kamera oder
  Galerie. Bilder werden auf 1600 Pixel verkleinert (aus 4 MB werden meist 150–250 kB),
  als Vorschau angezeigt, antippbar in voller Groesse, einzeln entfernbar.
- Fotos liegen NICHT im Datensatz, sondern als einzelne Dateien unter `bilder/` im
  Daten-Repository; der Datensatz haelt nur die Verweise. Anders ginge es nicht: Der
  Abgleich schreibt alle Datensaetze als eine JSON-Datei, und schon drei eingebettete
  Fotos wuerden sie ueber die 1-MB-Grenze der Contents-API heben.
- Fremde Fotos werden erst geladen, wenn sie angezeigt werden sollen – niemand laedt den
  ganzen Bildbestand der Staffel auf sein Handy.
- **Bewertung der Anzeige (Skala 0–5) jetzt auch in der Flaechensuche** je Versteckperson,
  nicht nur in der Truemmersuche.

## 1.11.0 – 2026-09-06
- **Trümmersuche als zweite Sparte der Suche.** Der Knopf „+ Neue Suche“ heisst jetzt
  „+ Flächensuche“, daneben steht „+ Trümmersuche“. Beide nutzen dasselbe Protokoll.
- Abweichungen der Trümmersuche: eigenes Geländeverzeichnis (8 Merkmale), keine
  Windrichtung, Suchteam ohne Grundlinie/Strukturen/Ecken dafür mit Beweglichkeit und
  Schwierigkeit der Verstecke plus Freitextfeld „Hilfen“, bei der Versteckperson
  zusätzlich „Hund kommt hin“, Verdeckung, Schwierigkeit des Verstecks und die Anzeige
  auf einer Skala 0–5, bei der Hundeführer:in zusätzlich „Kann den Hund lesen“.
- Übersicht und Dashboard kennzeichnen und filtern nach Sparte; die Auswertung
  berücksichtigt die Kriterien beider Sparten.
- **Vier neue Helfer:in-Bilder:** Hochopfer, Tiefopfer, Verdeckt mit Sicht zum Helfer,
  Verdeckt ohne Sicht zum Helfer (jetzt 43 statt 39).
- Fehler behoben: Eine Ausbilder:in ohne zugeordnete Person sah gar nichts, obwohl sie
  alles sehen darf. Die Sperre gilt jetzt nur noch für Hundeführer:innen; die Ausbildung
  bekommt stattdessen einen Hinweis, weil ihr Name in den Bestätigungen steht.

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
