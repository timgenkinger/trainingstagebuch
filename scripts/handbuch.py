#!/usr/bin/env python3
"""
Erzeugt das Benutzerhandbuch als PDF.

Neu erzeugen nach Aenderungen:
    python3 scripts/handbuch.py

Die Versionsnummer wird aus version.json gelesen, das Handbuch traegt also
immer den Stand der Anwendung.
"""

import json
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Frame, KeepTogether, ListFlowable,
                               ListItem, NextPageTemplate, PageBreak, Paragraph,
                               PageTemplate, Spacer, Table, TableStyle)

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIEL = os.path.join(WURZEL, "Handbuch-Trainingstagebuch.pdf")

with open(os.path.join(WURZEL, "version.json"), encoding="utf-8") as f:
    VERSION = json.load(f)

# Hausfarben des Bayerischen Roten Kreuzes. Das Rotkreuz-Emblem selbst ist
# nach den Genfer Abkommen geschuetzt und wird hier bewusst nicht verwendet.
ROT = colors.HexColor("#E30613")
ROT_DUNKEL = colors.HexColor("#B3040F")
ROT_BLASS = colors.HexColor("#FDECEE")
GRAU = colors.HexColor("#5A6069")
GRAU_HELL = colors.HexColor("#E6E8EB")
TEXT = colors.HexColor("#22252A")

SEITE_L, SEITE_R = 22 * mm, 20 * mm
SEITE_O, SEITE_U = 24 * mm, 20 * mm

# --------------------------------------------------------------------------
# Absatzformate
# --------------------------------------------------------------------------
basis = getSampleStyleSheet()

S = {
    "titel": ParagraphStyle("titel", parent=basis["Title"], fontName="Helvetica-Bold",
                            fontSize=30, leading=35, textColor=ROT, alignment=TA_LEFT,
                            spaceAfter=4),
    "untertitel": ParagraphStyle("untertitel", parent=basis["Normal"], fontName="Helvetica",
                                 fontSize=14, leading=19, textColor=GRAU, spaceAfter=18),
    "h1": ParagraphStyle("h1", parent=basis["Heading1"], fontName="Helvetica-Bold",
                         fontSize=17, leading=21, textColor=ROT, spaceBefore=2, spaceAfter=8),
    "h2": ParagraphStyle("h2", parent=basis["Heading2"], fontName="Helvetica-Bold",
                         fontSize=12.5, leading=16, textColor=ROT_DUNKEL,
                         spaceBefore=13, spaceAfter=5),
    "h3": ParagraphStyle("h3", parent=basis["Heading3"], fontName="Helvetica-Bold",
                         fontSize=10.5, leading=14, textColor=TEXT,
                         spaceBefore=9, spaceAfter=3),
    "text": ParagraphStyle("text", parent=basis["Normal"], fontName="Helvetica",
                           fontSize=9.8, leading=14.2, textColor=TEXT, spaceAfter=6),
    "klein": ParagraphStyle("klein", parent=basis["Normal"], fontName="Helvetica",
                            fontSize=8.6, leading=12.4, textColor=GRAU, spaceAfter=5),
    "liste": ParagraphStyle("liste", parent=basis["Normal"], fontName="Helvetica",
                            fontSize=9.8, leading=13.6, textColor=TEXT, spaceAfter=2),
    "kasten": ParagraphStyle("kasten", parent=basis["Normal"], fontName="Helvetica",
                             fontSize=9.4, leading=13.4, textColor=TEXT),
    "tabkopf": ParagraphStyle("tabkopf", parent=basis["Normal"], fontName="Helvetica-Bold",
                              fontSize=9, leading=12, textColor=colors.white),
    "tab": ParagraphStyle("tab", parent=basis["Normal"], fontName="Helvetica",
                          fontSize=9, leading=12.4, textColor=TEXT),
    "inhalt": ParagraphStyle("inhalt", parent=basis["Normal"], fontName="Helvetica",
                             fontSize=10.5, leading=19, textColor=TEXT),
}


def p(text, stil="text"):
    return Paragraph(text, S[stil])


def liste(punkte, stil="liste"):
    return ListFlowable(
        [ListItem(Paragraph(x, S[stil]), leftIndent=14, spaceBefore=2) for x in punkte],
        bulletType="bullet", start="\u2022", bulletColor=ROT,
        bulletFontName="Helvetica-Bold", bulletFontSize=9, bulletOffsetY=-1.2,
        leftIndent=15, spaceAfter=8,
    )


def tabelle(daten, breiten, kopf=True):
    inhalt = []
    for i, zeile in enumerate(daten):
        stil = "tabkopf" if (kopf and i == 0) else "tab"
        inhalt.append([Paragraph(z, S[stil]) for z in zeile])
    t = Table(inhalt, colWidths=breiten, hAlign="LEFT")
    stile = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, GRAU_HELL),
        ("BOX", (0, 0), (-1, -1), 0.5, GRAU_HELL),
    ]
    if kopf:
        stile += [("BACKGROUND", (0, 0), (-1, 0), ROT),
                  ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFB")])]
    else:
        stile += [("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#FAFAFB")])]
    t.setStyle(TableStyle(stile))
    return t


def kasten(titel, text, farbe=ROT, hintergrund=ROT_BLASS):
    """Hervorgehobener Hinweis."""
    innen = [[Paragraph(f'<b>{titel}</b>', S["kasten"])], [Paragraph(text, S["kasten"])]]
    t = Table(innen, colWidths=[165 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), hintergrund),
        ("LINEBEFORE", (0, 0), (0, -1), 3, farbe),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (0, 0), 8),
        ("BOTTOMPADDING", (0, 0), (0, 0), 2),
        ("TOPPADDING", (0, 1), (0, 1), 0),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
    ]))
    return KeepTogether([Spacer(1, 4), t, Spacer(1, 8)])


# --------------------------------------------------------------------------
# Seitengeruest
# --------------------------------------------------------------------------
def pfote(c, x, y, groesse, farbe):
    """Schlichte Pfote als Bildmarke. Kein Rotkreuz-Emblem (geschuetzt)."""
    c.saveState()
    c.setFillColor(farbe)
    e = groesse / 100.0
    for cx, cy, rx, ry in ((-26, 30, 9, 12), (2, 34, 9, 12), (-46, 6, 8, 10.5), (22, 6, 8, 10.5)):
        c.ellipse(x + (cx - rx) * e, y + (cy - ry) * e,
                  x + (cx + rx) * e, y + (cy + ry) * e, stroke=0, fill=1)
    c.ellipse(x - 30 * e, y - 34 * e, x + 26 * e, y + 12 * e, stroke=0, fill=1)
    c.restoreState()


def titelseite(c, doc):
    b, h = A4
    c.saveState()
    c.setFillColor(ROT)
    c.rect(0, h - 92 * mm, b, 92 * mm, stroke=0, fill=1)
    pfote(c, 34 * mm, h - 34 * mm, 26 * mm, colors.white)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(SEITE_L, h - 60 * mm, "BAYERISCHES ROTES KREUZ")
    c.setFont("Helvetica", 10.5)
    c.drawString(SEITE_L, h - 66 * mm, "Rettungshundestaffel")
    # Fusszeile der Titelseite
    c.setFillColor(GRAU)
    c.setFont("Helvetica", 8.5)
    c.drawString(SEITE_L, 15 * mm, "timgenkinger.github.io/trainingstagebuch")
    c.drawRightString(b - SEITE_R, 15 * mm,
                      f"Version {VERSION['version']} · Stand {date.today().strftime('%d.%m.%Y')}")
    c.restoreState()


def inhaltsseite(c, doc):
    b, h = A4
    c.saveState()
    # Kopfbalken
    c.setFillColor(ROT)
    c.rect(0, h - 13 * mm, b, 13 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(SEITE_L, h - 8.6 * mm, "TRAININGSTAGEBUCH – HANDBUCH")
    c.setFont("Helvetica", 8.5)
    c.drawRightString(b - SEITE_R, h - 8.6 * mm, f"Version {VERSION['version']}")
    # Fusszeile
    c.setFillColor(GRAU_HELL)
    c.rect(SEITE_L, 13 * mm, b - SEITE_L - SEITE_R, 0.4, stroke=0, fill=1)
    c.setFillColor(GRAU)
    c.setFont("Helvetica", 8)
    c.drawString(SEITE_L, 9 * mm, "Rettungshund Trainingstagebuch")
    c.drawRightString(b - SEITE_R, 9 * mm, f"Seite {doc.page - 1}")
    c.restoreState()


doc = BaseDocTemplate(
    ZIEL, pagesize=A4,
    leftMargin=SEITE_L, rightMargin=SEITE_R, topMargin=SEITE_O, bottomMargin=SEITE_U,
    title="Rettungshund Trainingstagebuch – Handbuch",
    author="Rettungshundestaffel", subject="Benutzerhandbuch der Web-Anwendung",
)
b, h = A4
doc.addPageTemplates([
    PageTemplate(id="titel",
                 frames=[Frame(SEITE_L, SEITE_U, b - SEITE_L - SEITE_R, h - 100 * mm - SEITE_U, id="t")],
                 onPage=titelseite),
    PageTemplate(id="inhalt",
                 frames=[Frame(SEITE_L, SEITE_U, b - SEITE_L - SEITE_R, h - SEITE_O - SEITE_U + 4 * mm, id="i")],
                 onPage=inhaltsseite),
])

BREITE = b - SEITE_L - SEITE_R

# --------------------------------------------------------------------------
# Inhalt
# --------------------------------------------------------------------------
E = []

# ---- Titelseite -----------------------------------------------------------
E += [
    Spacer(1, 6 * mm),
    p("Rettungshund<br/>Trainingstagebuch", "titel"),
    p("Handbuch für Hundeführer:innen und Ausbildung", "untertitel"),
    p("Diese Anwendung ersetzt das gedruckte Trainingstagebuch der Flächensuche. "
      "Sie läuft im Browser, funktioniert ohne Empfang und hält den Stand der Staffel "
      "auf allen Geräten gleich.", "text"),
    Spacer(1, 8 * mm),
    tabelle([
        ["Womit dokumentiert wird", "Suche, Verbellen, freie Dokumentation"],
        ["Wo die Daten liegen", "auf dem Gerät und in einem privaten Repository"],
        ["Was ohne Empfang geht", "alles – die Übertragung wird nachgeholt"],
        ["Wer was sieht", "Hundeführer:innen ihre Hunde, die Ausbildung alles"],
    ], [58 * mm, BREITE - 58 * mm], kopf=False),
    NextPageTemplate("inhalt"), PageBreak(),
]

# ---- Inhaltsverzeichnis ---------------------------------------------------
E += [p("Inhalt", "h1")]
for nr, titel in [
    ("1", "Was die Anwendung leistet"),
    ("2", "Erste Schritte"),
    ("3", "Rollen: Hundeführer:in und Ausbildung"),
    ("4", "Dokumentieren"),
    ("5", "Abschließen und Bestätigen"),
    ("6", "Auswertungen"),
    ("7", "Online-Abgleich"),
    ("8", "Aktualisieren"),
    ("9", "Was die Anwendung nicht leistet"),
    ("10", "Für die Betreuung der Anwendung"),
]:
    E.append(Paragraph(f'<font color="#E30613"><b>{nr}</b></font>&nbsp;&nbsp;&nbsp;{titel}', S["inhalt"]))
E += [PageBreak()]

# ---- 1 --------------------------------------------------------------------
E += [
    p("1 &nbsp; Was die Anwendung leistet", "h1"),
    p("Das Trainingstagebuch bildet die Vorlagen der Staffel ab und wertet sie aus. "
      "Es gibt drei Arten von Einträgen; jeder Eintrag gehört zu einem Hund und einem Datum.", "text"),

    p("Die drei Dokumentarten", "h2"),
    tabelle([
        ["", "Suche", "Verbellen", "Freie Dokumentation"],
        ["Wofür",
         "Suchprotokoll nach Vorlage des Hefts",
         "Trainingsplan Verbellen",
         "alles andere: Gehorsam, Geräte, Theorie"],
        ["Inhalt",
         "Grundwerte, Skizze, Versteckpersonen, drei Bewertungsblöcke, Konsequenz",
         "Grundwerte, bearbeitete Stufen mit Wiederholungen, Notizen",
         "Grundwerte, Skizze, Freitext"],
        ["Auswertung",
         "Noten und Kennzahlen im Dashboard",
         "Fortschrittskatalog je Hund",
         "keine"],
    ], [22 * mm, (BREITE - 22 * mm) / 3, (BREITE - 22 * mm) / 3, (BREITE - 22 * mm) / 3]),
    Spacer(1, 6),

    p("Allen gemeinsam: die Grundwerte", "h2"),
    p("Jeder Eintrag beginnt mit denselben Angaben. Ganz oben steht die "
      "<b>Wartezeit im Auto bis zur Suche</b> – sie prägt Anspannung und Motivation beim Start "
      "und wird im Dashboard eigens ausgewertet. Danach folgen Datum, Ort, Hund und "
      "Hundeführer:in sowie Gelände und Wetter.", "text"),

    p("Was zusätzlich mitläuft", "h2"),
    liste([
        "<b>Helfer:in-Bilder:</b> Wird bei einer Versteckperson ein Bild gewählt, gilt es ab der "
        "abgeschlossenen Suche als kennengelernt. Die Übersicht zeigt je Hund, welche der 39 Bilder "
        "gelaufen sind und welche noch nie.",
        "<b>Verbellen:</b> Der Fortschritt über 331 Unterübungen entsteht aus den Sitzungen, "
        "nicht aus einer zweiten Liste.",
        "<b>Skizzenfeld:</b> Suchgebiet, Laufwege und Positionen lassen sich mit vier Stiften zeichnen.",
    ]),
    kasten("Ein Grundsatz durch die ganze Anwendung",
           "Eingegeben wird immer in einer Einheit. Alle Übersichten rechnen daraus – es gibt "
           "nirgends zwei Stände, die auseinanderlaufen können. Deshalb muss niemand irgendwo "
           "zusätzlich etwas abhaken."),
    PageBreak(),
]

# ---- 2 --------------------------------------------------------------------
E += [
    p("2 &nbsp; Erste Schritte", "h1"),

    p("2.1 &nbsp; Auf das Handy legen", "h2"),
    p("Die Anwendung wird nicht aus einem App-Store installiert, sondern im Browser geöffnet "
      "und auf den Startbildschirm gelegt. Danach startet sie wie eine gewöhnliche App.", "text"),
    tabelle([
        ["iPhone / iPad",
         "Adresse in <b>Safari</b> öffnen. Teilen-Symbol antippen, dann "
         "<b>Zum Home-Bildschirm</b>. Wichtig: Das funktioniert nur in Safari, nicht in Chrome."],
        ["Android",
         "Adresse in <b>Chrome</b> öffnen. Menü (drei Punkte), dann "
         "<b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b>."],
        ["Rechner",
         "Adresse im Browser öffnen und als Lesezeichen ablegen."],
    ], [30 * mm, BREITE - 30 * mm], kopf=False),
    Spacer(1, 8),

    p("2.2 &nbsp; Wer arbeitet an diesem Gerät?", "h2"),
    p("Ein neues Gerät ist immer <b>Hundeführer:in ohne Zuordnung</b> und zeigt deshalb "
      "zunächst weder Hunde noch Einträge. Der erste Schritt führt in die Einstellungen:", "text"),
    liste([
        "<b>Einstellungen</b> öffnen (letzter Reiter).",
        "Unter <b>Dieses Gerät</b> bei <i>Wer arbeitet an diesem Gerät?</i> den eigenen Namen wählen. "
        "Steht er nicht in der Liste, muss ihn die Ausbildung zuerst anlegen.",
        "Den <b>Gerätenamen</b> vergeben, zum Beispiel „Handy Rainer“. Er erscheint im Team als "
        "„zuletzt geändert von“.",
        "Den <b>Zugangs-Token</b> eintragen, damit der Abgleich läuft (siehe Abschnitt 7).",
    ]),
    p("Anschließend ordnet die Ausbildung dem eigenen Namen die Hunde zu. Erst dann erscheinen "
      "Hunde und Dokumentation.", "text"),

    p("2.3 &nbsp; Der erste Eintrag", "h2"),
    liste([
        "Im Reiter <b>Suchen</b> oben rechts die Art wählen: <b>+ Neue Suche</b>, "
        "<b>+ Verbellen</b> oder <b>+ Freie Doku</b>.",
        "Hund und Hundeführer:in sind bereits vorausgewählt.",
        "Ausfüllen. Gespeichert wird automatisch beim Tippen – es gibt keinen Speichern-Knopf, "
        "den man vergessen könnte.",
        "Unten steht, welche Pflichtangaben noch fehlen. Sind alle da, lässt sich der Eintrag "
        "<b>abschließen</b> und geht damit ins Team.",
    ]),
    PageBreak(),
]

# ---- 3 --------------------------------------------------------------------
E += [
    p("3 &nbsp; Rollen: Hundeführer:in und Ausbildung", "h1"),
    p("Unter <b>Einstellungen – Dieses Gerät</b> steht, wer daran arbeitet und in welcher Rolle. "
      "Beides gilt nur für dieses Gerät und wird nicht mit dem Team abgeglichen.", "text"),
    tabelle([
        ["", "Hundeführer:in", "Ausbilder:in"],
        ["Sichtbare Hunde", "nur die zugeordneten", "alle"],
        ["Dokumentieren", "ja", "ja"],
        ["Fremde Hunde erfassen", "nein", "ja"],
        ["Einheiten bestätigen", "nein", "ja"],
        ["Dashboard, Verbellen-Stand, Helfer:in-Bilder", "nur wenn freigegeben", "ja"],
    ], [62 * mm, (BREITE - 62 * mm) / 2, (BREITE - 62 * mm) / 2]),
    Spacer(1, 8),

    p("3.1 &nbsp; Wechsel in die Ausbilder-Rolle", "h2"),
    p("Der Wechsel verlangt das im Team vereinbarte Passwort. Der Weg zurück in die "
      "Hundeführer:in-Rolle braucht keines. Das Passwort steht bewusst nicht im Programmcode – "
      "hinterlegt ist nur ein Prüfwert, aus dem es sich nicht zurückrechnen lässt.", "text"),

    p("3.2 &nbsp; Hunde zuordnen (Ausbildung)", "h2"),
    p("Unter <b>Einstellungen – Hunde</b> steht bei jedem Hund die Frage "
      "<i>„Wer führt &lt;Hundename&gt;?“</i>. Zugeordnete Personen erscheinen als Marken und lassen "
      "sich einzeln lösen; weitere kommen über das Auswahlmenü dazu.", "text"),
    liste([
        "Ein Hund kann mehreren Personen zugeordnet sein.",
        "Eine Person kann mehrere Hunde führen.",
        "Ein Hund ohne Zuordnung ist nur für die Ausbildung sichtbar.",
    ]),

    p("3.3 &nbsp; Was Hundeführer:innen sehen dürfen", "h2"),
    p("Ab Werk sind Dashboard, Verbellen-Stand und Helfer:in-Bilder der Ausbildung vorbehalten. "
      "Unter <b>Einstellungen – Ausbildung</b> lässt sich freigeben, dass Hundeführer:innen "
      "diese Auswertungen für <b>ihre eigenen</b> Hunde einsehen dürfen. Die Einstellung gilt "
      "für das ganze Team.", "text"),
    PageBreak(),
]

# ---- 4 --------------------------------------------------------------------
E += [
    p("4 &nbsp; Dokumentieren", "h1"),

    p("4.1 &nbsp; Suche", "h2"),
    p("Bildet Seite 1 und 2 des gedruckten Hefts ab.", "text"),
    tabelle([
        ["Abschnitt", "Inhalt"],
        ["Grundwerte", "Wartezeit im Auto, Datum, Ort, Hund, Hundeführer:in, Trainingsziel"],
        ["Geländebeschaffenheit", "offen, dicht, Dornen, hügelig, steil und weitere"],
        ["Temperatur / Wetter", "Temperatur, Wind, Niederschlag, Licht, Windrichtung"],
        ["Suchgebiet", "Abmessungen, Suchzeit, Helfer:innen und das Zeichenfeld"],
        ["Versteckpersonen", "je Person: Helfer:in-Bild, Zeit bis zum Fund, gefunden ja/nein, "
                             "Abstand zur Hundeführer:in. Angezeigt wird durchgängig durch Bellen."],
        ["Team, Hund, Hundeführer:in", "je Kriterium eine Note von 1 bis 5 auf der Punkteskala"],
        ["Problemverhalten", "sechs Merkmale zum Ankreuzen mit Feld für den Kontext"],
        ["Notizen und Konsequenz", "Freitext sowie Beobachten, Bearbeiten, Neues Ziel"],
    ], [42 * mm, BREITE - 42 * mm]),
    Spacer(1, 6),
    p("Über <b>Duplizieren</b> entsteht eine neue Suche, welche die Rahmenbedingungen übernimmt "
      "und die Bewertungen leert – praktisch bei mehreren Suchen am selben Ort.", "klein"),

    p("4.2 &nbsp; Verbellen", "h2"),
    p("Der Trainingsplan umfasst zwei Wege: <b>Box</b> mit 33 Stufen und 148 Unterübungen, "
      "<b>Mensch</b> mit 38 Stufen und 183 Unterübungen. Jede Unterübung gilt nach "
      "<b>drei gelungenen Wiederholungen</b> als sicher.", "text"),
    liste([
        "Über <b>+ Stufe</b> die heute bearbeitete Stufe wählen. Alle Stufen stehen frei zur Wahl; "
        "gesperrte sind nur gekennzeichnet, nicht blockiert.",
        "Je Unterübung eintragen, wie viele der drei Wiederholungen <b>heute</b> gelungen sind. "
        "Was aus früheren Sitzungen schon steht, ist ausgegraut und nicht mehr veränderbar.",
        "<b>Eigene Übungen</b> lassen sich je Stufe frei ergänzen, mit derselben Zählweise.",
        "Mehrere Stufen in einer Sitzung sind möglich.",
    ]),
    p("Der Fortschritt eines Hundes ergibt sich ausschließlich aus den abgeschlossenen Sitzungen. "
      "Unter <b>Verbellen</b> steht der Stand; eingetragen wird dort nichts.", "text"),
    kasten("Box-Weg überspringen",
           "Arbeitet ein Hund ohne Box, lässt sich der Box-Weg unter <b>Verbellen – Stand</b> "
           "für diesen Hund abschalten. Die Mensch-Stufen sind dann von vornherein frei."),

    p("4.3 &nbsp; Freie Dokumentation", "h2"),
    p("Für alles, was kein Suchprotokoll ist: Gehorsam, Geräteübungen, Theorieabende, "
      "Beobachtungen am Rand. Sie enthält die Grundwerte, das Zeichenfeld und ein Freitextfeld. "
      "Pflicht sind Datum, Überschrift, Hund sowie Freitext oder Skizze.", "text"),
    PageBreak(),
]

# ---- 5 --------------------------------------------------------------------
E += [
    p("5 &nbsp; Abschließen und Bestätigen", "h1"),
    p("Jeder Eintrag durchläuft drei Zustände. Sie sind an der Farbmarke oben im Eintrag "
      "und in der Übersicht ablesbar.", "text"),
    tabelle([
        ["Zustand", "Bedeutung", "Wer handelt"],
        ["<b>Entwurf</b>",
         "Wird gerade dokumentiert. Bleibt ausschließlich auf diesem Gerät und wird nie hochgeladen.",
         "Hundeführer:in"],
        ["<b>Abgeschlossen</b>",
         "Vollständig ausgefüllt und freigegeben. Geht ins Team und zählt in allen Auswertungen.",
         "Hundeführer:in"],
        ["<b>Bestätigt</b>",
         "Die Ausbildung hat den Eintrag durchgesehen. Festgehalten wird, wer wann bestätigt hat.",
         "Ausbildung"],
    ], [30 * mm, BREITE - 30 * mm - 30 * mm, 30 * mm]),
    Spacer(1, 8),

    p("5.1 &nbsp; Abschließen", "h2"),
    p("Am Ende jedes Eintrags zeigt ein Balken, wie viele Pflichtangaben vorliegen, und listet "
      "die fehlenden auf. Er läuft bei jeder Eingabe mit. Sind alle da, wird der Knopf "
      "<b>Abschließen und mit dem Team teilen</b> frei.", "text"),
    tabelle([
        ["Suche", "9 Angaben: Datum, Ort, Hund, Hundeführer:in, Suchzeit, mindestens eine "
                  "Versteckperson mit Ergebnis sowie je eine Bewertung bei Team, Hund und Hundeführer:in"],
        ["Verbellen", "4 Angaben: Datum, Hund, mindestens eine bearbeitete Stufe und mindestens "
                      "eine gelungene Wiederholung"],
        ["Freie Doku", "4 Angaben: Datum, Überschrift, Hund sowie Freitext oder Skizze"],
    ], [28 * mm, BREITE - 28 * mm], kopf=False),
    Spacer(1, 8),
    p("Ein abgeschlossener Eintrag lässt sich <b>wieder öffnen</b> und wird dann erneut zum "
      "Entwurf. Der bereits geteilte Stand bleibt beim Team, bis er wieder abgeschlossen wird.", "text"),

    p("5.2 &nbsp; Bestätigen (Ausbildung)", "h2"),
    p("Jede abgeschlossene Einheit wartet auf die Bestätigung. Die Ausbildung findet die offenen "
      "gesammelt unter <b>Einstellungen – Ausbildung</b> oder über den Filter "
      "<i>wartet auf Bestätigung</i> in der Übersicht. Zur Bestätigung gehört eine freiwillige "
      "Bemerkung; zurückziehen ist möglich.", "text"),
    kasten("Warum keine Unterschrift",
           "Festgehalten wird, wer wann bestätigt hat – kein gezeichneter Namenszug. In einer "
           "Anwendung, in der jede:r die eigene Rolle setzen kann, sähe eine Unterschrift "
           "verbindlicher aus, als sie ist. Name und Zeitpunkt sind genauso nachvollziehbar "
           "und behaupten nichts Falsches.", GRAU, colors.HexColor("#F3F4F6")),
    PageBreak(),
]

# ---- 6 --------------------------------------------------------------------
E += [
    p("6 &nbsp; Auswertungen", "h1"),
    p("Alle Auswertungen rechnen ausschließlich mit <b>abgeschlossenen</b> Einträgen. "
      "Entwürfe verfälschen also nichts.", "text"),

    p("6.1 &nbsp; Dashboard", "h2"),
    liste([
        "<b>Kennzahlen:</b> Anzahl Suchen, Ø Gesamtnote, Trefferquote, Ø Zeit bis zum Fund, "
        "Ø Radius bei Fund, gesamte Suchzeit, Suchen mit Fehlanzeige, Ø Wartezeit im Auto.",
        "<b>Leistungsentwicklung:</b> ersetzt die Übersichtsgraphen vorne im Heft. Wahlweise die "
        "drei Bereiche zusammen oder ein einzelnes Kriterium.",
        "<b>Kriterien im Detail:</b> Durchschnitt je Kriterium, <b>schwächstes zuerst</b> – "
        "zeigt sofort, woran zu arbeiten ist.",
        "<b>Problemverhalten:</b> wie oft welches Merkmal auftrat.",
        "<b>Bedingungen:</b> welche Bedingungen trainiert wurden (zeigt Lücken im Plan) und die "
        "Ø Note je Bedingung – einschließlich der Wartezeit im Auto in vier Stufen.",
        "<b>Verbellen und Helfer:in-Bilder</b> je Hund im Überblick.",
    ]),
    p("Filter nach Hund und Zeitraum stehen oben. Ohne Hundefilter erscheint beim Verbellen "
      "eine Zeile je Hund – die ganze Staffel auf einen Blick.", "text"),

    p("6.2 &nbsp; Verbellen-Stand", "h2"),
    p("Gesamtfortschritt, beide Wege getrennt, die Stufe, an der gerade gearbeitet wird, und "
      "je Stufe aufklappbar der Stand jeder Unterübung mit dem Datum, an dem sie sicher wurde. "
      "Filter für einen einzelnen Weg und für offene Stufen.", "text"),

    p("6.3 &nbsp; Helfer:in-Bilder", "h2"),
    p("Alle 39 Bilder der Heftliste je Hund, in vier Stufen: kennengelernt, kurze Anzeige, "
      "längere Anzeige, gemeistert. Die im Heft fett gedruckten sind als <b>wichtig</b> markiert.", "text"),
    liste([
        "Ein Bild gilt automatisch als <b>kennengelernt</b>, sobald es in einer abgeschlossenen "
        "Suche als Versteckperson vorkam. Die Zeile zeigt dann, wie oft, wann zuletzt und wie oft gefunden.",
        "Bilder ohne Einsatz sind als <b>noch nie im Training</b> gekennzeichnet und über einen "
        "eigenen Filter zusammen sichtbar.",
        "Die Stufen 2 bis 4 bleiben eine Einschätzung und werden von Hand gesetzt. Die Dauer der "
        "Anzeige wird nicht protokolliert – die Anwendung erfindet keine Bewertung.",
    ]),
    PageBreak(),
]

# ---- 7 --------------------------------------------------------------------
E += [
    p("7 &nbsp; Online-Abgleich", "h1"),
    p("Alle Geräte gleichen sich über eine gemeinsame Datei in einem <b>privaten</b> "
      "GitHub-Repository ab. Die Adresse der Ablage ist bereits eingebaut – im Team muss nur "
      "noch der persönliche Zugangs-Token eingetragen werden.", "text"),

    p("7.1 &nbsp; Token einrichten (einmal je Gerät)", "h2"),
    liste([
        "Auf github.com anmelden und unter <b>Settings – Developer settings – "
        "Fine-grained tokens</b> einen Token erzeugen.",
        "Unter <i>Repository access</i> ausschließlich das Daten-Repository auswählen.",
        "Unter <i>Repository permissions</i> bei <b>Contents</b> auf <b>Read and write</b> stellen. "
        "Alles andere bleibt auf <i>No access</i>.",
        "Den Token in der Anwendung unter <b>Einstellungen</b> in das rote Feld einfügen und auf "
        "<b>Verbinden</b> tippen.",
    ]),
    p("Alternativ gibt eine Person im Team einen gemeinsamen Token weiter – dann entfällt der "
      "erste Teil. Der Token wird ausschließlich im Browser des jeweiligen Geräts gespeichert "
      "und landet nie in einem Export oder in der Sicherungsdatei.", "text"),

    p("7.2 &nbsp; Wie der Abgleich arbeitet", "h2"),
    liste([
        "Jede Eingabe landet <b>sofort</b> auf dem Gerät. Es gibt keinen Speichern-Knopf.",
        "Der Abgleich <b>mischt</b> nur: Bei jedem Datensatz gewinnt der jüngere Stand. "
        "Ein älterer Serverstand überschreibt nie eine neuere Eingabe.",
        "Ein leerer Server löscht nichts. Ein Verbindungs- oder Konfigurationsfehler kann "
        "also keinen Datenverlust auslösen.",
        "Ohne Netz wird gepuffert und nachgereicht. Der Zähler oben rechts zeigt, wie viele "
        "Änderungen warten.",
        "Speichert jemand zeitgleich, wird der Vorgang mit dem neuen Stand wiederholt. "
        "Fremde Änderungen können nicht überschrieben werden.",
    ]),
    p("Die Anzeige oben rechts: grau <i>Nur lokal</i>, rot <i>Token fehlt</i>, orange "
      "<i>Verbinde</i> oder <i>Offline</i>, grün <i>Synchron</i>. Ein Tippen darauf führt zu "
      "den Einstellungen, wo auch ein Protokoll der letzten Vorgänge steht.", "text"),

    p("7.3 &nbsp; Sicherung", "h2"),
    p("Unter <b>Einstellungen – Sicherung</b> lassen sich alle Daten als JSON-Datei ausgeben und "
      "wieder einlesen. Der Import mischt ebenfalls nur; bestehende neuere Datensätze bleiben "
      "erhalten. Gelöschte Einträge liegen im <b>Papierkorb</b> und lassen sich wiederherstellen.", "text"),
    PageBreak(),

    # ---- 8 ----
    p("8 &nbsp; Aktualisieren", "h1"),
    p("Die Anwendung meldet sich selbst, wenn eine neue Fassung bereitliegt: Oben erscheint ein "
      "Balken <b>Eine neue Version ist verfügbar</b>. Ein Tippen darauf lädt sie.", "text"),
    p("Daneben gibt es oben rechts den <b>Aktualisieren-Knopf</b> (Kreispfeil). Er ist sicherer "
      "als das Neuladen des Browsers: Er schreibt zuerst offene Eingaben fest, prüft dann auf "
      "eine neue Fassung und übernimmt sie gleich mit.", "text"),
    kasten("Ein Update fasst niemals die Daten an",
           "Aktualisiert wird ausschließlich das Programm. Die Datenbank auf dem Gerät bleibt "
           "unberührt – auch bei der auf dem Startbildschirm abgelegten App."),
    p("Die laufende Versionsnummer steht unter dem Namen in der Kopfzeile und ausführlich unter "
      "<b>Einstellungen – Version</b>, zusammen mit dem Änderungsprotokoll.", "text"),
    Spacer(1, 4),

    # ---- 9 ----
    p("9 &nbsp; Was die Anwendung nicht leistet", "h1"),
    p("Damit niemand von falschen Annahmen ausgeht:", "text"),
    kasten("Die Rollen ordnen die Ansicht, sie schützen die Daten nicht",
           "Alle Geräte teilen sich eine Datei und einen Zugangs-Token. Wer den Token hat, kann "
           "technisch den gesamten Bestand lesen – unabhängig von der eingestellten Rolle, die "
           "jede:r am eigenen Gerät ändern kann. Auch das Passwort für die Ausbilder-Rolle wird "
           "im Browser geprüft und ließe sich mit Entwicklerwerkzeugen umgehen.<br/><br/>"
           "Für den Alltag – jede:r sieht die eigenen Hunde, die Ausbildung sieht alles – ist "
           "diese Trennung richtig und ausreichend. Als Vertraulichkeitsgrenze gegenüber den "
           "eigenen Leuten taugt sie nicht. Dafür bräuchte es einen Server mit Benutzerkonten."),
    liste([
        "<b>Die Bestätigung ist keine rechtsverbindliche Unterschrift.</b> Sie hält fest, wer "
        "wann bestätigt hat.",
        "<b>Bewertungen entstehen nicht von selbst.</b> Aus einer Suche folgt, dass ein "
        "Helfer:in-Bild vorkam – nicht, wie gut die Anzeige war.",
        "<b>Keine Ortung, keine Zeitmessung.</b> Zeiten und Abstände werden von Hand eingetragen.",
    ]),
    p("Bitte keine besonders schützenswerten personenbezogenen Daten in die Notizfelder "
      "schreiben. Für ein Trainingstagebuch mit Vornamen ist das unkritisch.", "klein"),
    PageBreak(),

    # ---- 10 ----
    p("10 &nbsp; Für die Betreuung der Anwendung", "h1"),
    p("Dieser Abschnitt richtet sich an die Person, welche die Anwendung technisch betreut.", "text"),

    p("10.1 &nbsp; Aufbau", "h2"),
    p("Eine statische Web-Anwendung ohne Baukette und ohne Fremdbibliotheken: reines "
      "JavaScript in Modulen, ausgeliefert über GitHub Pages. Die Daten liegen lokal in "
      "IndexedDB und werden als eine JSON-Datei in einem privaten Repository abgeglichen.", "text"),
    tabelle([
        ["Programm", "öffentliches Repository, ausgeliefert über GitHub Pages"],
        ["Daten", "privates Repository, eigener Branch, eine JSON-Datei"],
        ["Offline", "Service Worker; die Datenbank wird davon nie berührt"],
    ], [30 * mm, BREITE - 30 * mm], kopf=False),
    Spacer(1, 8),

    p("10.2 &nbsp; Neue Version veröffentlichen", "h2"),
    p("Versionsnummer setzen, dabei entstehen Eintrag im Änderungsprotokoll und neuer "
      "Programm-Cache:", "text"),
    tabelle([
        ["<font face='Courier'>./scripts/release.sh patch -m \"Was sich geändert hat\"</font>"],
        ["<font face='Courier'>git add -A &amp;&amp; git commit -m \"Version x.y.z\" &amp;&amp; git push</font>"],
    ], [BREITE], kopf=False),
    Spacer(1, 6),
    p("<b>patch</b> für Korrekturen, <b>minor</b> für neue Funktionen, <b>major</b> für große "
      "Umbauten. Der Push veröffentlicht automatisch und ergänzt die Buildnummer.", "text"),

    p("10.3 &nbsp; Dieses Handbuch neu erzeugen", "h2"),
    tabelle([["<font face='Courier'>python3 scripts/handbuch.py</font>"]], [BREITE], kopf=False),
    Spacer(1, 6),
    p("Die Versionsnummer wird dabei aus <font face='Courier'>version.json</font> gelesen.", "klein"),

    p("10.4 &nbsp; Wenn etwas klemmt", "h2"),
    tabelle([
        ["Beobachtung", "Ursache und Abhilfe"],
        ["Anzeige bleibt auf <i>Token fehlt</i>",
         "Token nicht eingetragen oder abgelaufen. Unter Einstellungen neu einfügen."],
        ["<i>Zugriff verweigert</i>",
         "Der Token hat kein Schreibrecht. Beim Token <i>Contents: Read and write</i> setzen."],
        ["Neue Fassung erscheint nicht",
         "Aktualisieren-Knopf oben rechts verwenden. Auf dem iPhone die abgelegte App einmal "
         "vollständig schließen."],
        ["Keine Hunde sichtbar",
         "Dem Gerät ist keine Person zugeordnet, oder der Person kein Hund. Beides unter "
         "Einstellungen."],
        ["Eintrag erscheint nicht im Team",
         "Er ist noch Entwurf. Erst das Abschließen lädt ihn hoch."],
    ], [52 * mm, BREITE - 52 * mm]),
    Spacer(1, 10),
    p("Vorlage der Inhalte: <i>Die Rettungshundestunde – Trainingstagebuch</i>, 3. überarbeitete "
      "Auflage, sowie der Trainingsplan Verbellen der Staffel. Diese Anwendung ist eine private "
      "digitale Arbeitshilfe dazu.", "klein"),
    p("Das Rotkreuz-Emblem ist nach den Genfer Abkommen und dem deutschen Rotkreuzgesetz "
      "geschützt. Anwendung und Handbuch verwenden ausschließlich die Hausfarben, nicht das Zeichen.", "klein"),
]

doc.build(E)
print(f"Handbuch erzeugt: {ZIEL}")
