# Änderungsprotokoll

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
