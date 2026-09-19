#!/usr/bin/env bash
#
# Sicherung der gesamten Lösung.
#
#   projekt.tar.gz        der ganze Projektordner samt Git-Verlauf – Programm,
#                         Handbuch, Skripte, auch noch nicht übertragene Änderungen
#   daten.bundle          das private Daten-Repository als vollständiger Git-Spiegel,
#                         mit jedem Abgleich als eigenem Stand
#   trainingsdaten.json   der aktuelle Datenstand als einfache Datei
#   bilder/               die Fotos als einfache Dateien
#   MANIFEST.txt          Prüfsummen, Zählungen und die Anleitung zur Wiederherstellung
#
# Das Skript schreibt ausschließlich ins Sicherungsziel. Es ändert nichts am
# Projekt, nichts auf GitHub und löscht keine älteren Sicherungen. Erst wenn alles
# geprüft ist, wird die Sicherung an ihren Platz verschoben – ein Abbruch
# hinterlässt also keine halbe Sicherung.
#
# Verwendung:
#   scripts/backup.sh
#   BACKUP_ZIEL="/Volumes/Stick/Backups" scripts/backup.sh
#
set -euo pipefail

# Geplante Läufe starten nicht zwingend mit der PATH-Umgebung der Anmeldeshell.
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

cd "$(dirname "$0")/.."
PROJEKT="$(pwd)"
ZIEL_BASIS="${BACKUP_ZIEL:-$HOME/Backups/Trainingstagebuch}"
# Adresse des Datenspeichers wie in assets/js/config.js
DATEN_REPO="${DATEN_REPO:-timgenkinger/Trainingstagebuch-Fl-che}"
DATEN_BRANCH="${DATEN_BRANCH:-daten}"
DATEN_DATEI="${DATEN_DATEI:-trainingsdaten.json}"

STEMPEL="$(date +%Y-%m-%d_%H%M)"
ZIEL="$ZIEL_BASIS/$STEMPEL"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
S="$TMP/$STEMPEL"
mkdir -p "$S"

fehler() {
  echo "SICHERUNG FEHLGESCHLAGEN: $*" >&2
  exit 1
}

for werkzeug in git gh python3 tar shasum; do
  command -v "$werkzeug" >/dev/null || fehler "Werkzeug fehlt: $werkzeug"
done
[ -e "$ZIEL" ] && fehler "Ziel existiert bereits: $ZIEL"

# --- 1) Programm ------------------------------------------------------------
tar -czf "$S/projekt.tar.gz" --exclude='.DS_Store' \
  -C "$(dirname "$PROJEKT")" "$(basename "$PROJEKT")" \
  || fehler "Projektordner ließ sich nicht packen"
APP_VERSION="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['version'])" "$PROJEKT/version.json")"
APP_COMMIT="$(git -C "$PROJEKT" rev-parse --short HEAD)"
APP_OFFEN="$(git -C "$PROJEKT" status --porcelain | wc -l | tr -d ' ')"
APP_NICHT_UEBERTRAGEN="$(git -C "$PROJEKT" rev-list --count '@{u}..HEAD' 2>/dev/null || echo '?')"

# --- 2) Daten ---------------------------------------------------------------
gh repo clone "$DATEN_REPO" "$TMP/daten.git" -- --mirror --quiet 2>"$TMP/klon.log" \
  || { cat "$TMP/klon.log" >&2; fehler "Daten-Repository nicht erreichbar ($DATEN_REPO) – ist gh angemeldet?"; }
git -C "$TMP/daten.git" bundle create "$S/daten.bundle" --all 2>"$TMP/bundle.log" \
  || { cat "$TMP/bundle.log" >&2; fehler "Git-Spiegel der Daten ließ sich nicht schreiben"; }
git -C "$TMP/daten.git" bundle verify "$S/daten.bundle" >/dev/null 2>&1 \
  || fehler "Git-Spiegel der Daten ist nicht lesbar"
DATEN_COMMIT="$(git -C "$TMP/daten.git" rev-parse --short "$DATEN_BRANCH")"
DATEN_STAENDE="$(git -C "$TMP/daten.git" rev-list --count "$DATEN_BRANCH")"

git -C "$TMP/daten.git" show "$DATEN_BRANCH:$DATEN_DATEI" > "$S/trainingsdaten.json" \
  || fehler "$DATEN_DATEI fehlt im Branch $DATEN_BRANCH"
if git -C "$TMP/daten.git" cat-file -e "$DATEN_BRANCH:bilder" 2>/dev/null; then
  git -C "$TMP/daten.git" archive "$DATEN_BRANCH" bilder | tar -x -C "$S" \
    || fehler "Fotos ließen sich nicht entpacken"
else
  mkdir -p "$S/bilder"
fi
FOTOS="$(find "$S/bilder" -type f | wc -l | tr -d ' ')"

# Die Datendatei muss sich lesen lassen und darf nicht leer sein – eine Sicherung
# von kaputten Daten fiele sonst erst auf, wenn man sie braucht.
ZAEHLUNG="$(python3 - "$S/trainingsdaten.json" "$S/stand.json" <<'PY'
import json, sys, collections
d = json.load(open(sys.argv[1], encoding='utf-8'))
recs = d.get('records') if isinstance(d, dict) else d
if isinstance(recs, dict):
    recs = list(recs.values())
if not isinstance(recs, list) or not recs:
    sys.exit('keine Datensaetze gefunden')
aktiv = [r for r in recs if not r.get('deleted')]
arten = collections.Counter(r.get('type') for r in aktiv)
json.dump({'aktiv': len(aktiv), 'grabsteine': len(recs) - len(aktiv), 'arten': arten},
          open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"{len(aktiv)} Datensätze ({len(recs) - len(aktiv)} gelöschte als Grabstein)")
for art, n in sorted(arten.items(), key=lambda x: -x[1]):
    print(f"  {art:24} {n}")
PY
)" || fehler "Datendatei ist nicht lesbar"

# --- 3) Manifest --------------------------------------------------------------
{
  echo "Sicherung Rettungshund Trainingstagebuch"
  echo "Erstellt:  $(date '+%d.%m.%Y %H:%M')"
  echo
  echo "PROGRAMM"
  echo "  Version:             $APP_VERSION (Commit $APP_COMMIT)"
  echo "  Offene Änderungen:   $APP_OFFEN Datei(en) – im Archiv enthalten"
  echo "  Nicht übertragen:    $APP_NICHT_UEBERTRAGEN Commit(s)"
  echo
  echo "DATEN ($DATEN_REPO, Branch $DATEN_BRANCH)"
  echo "  Stand:               Commit $DATEN_COMMIT, $DATEN_STAENDE Abgleich-Stände im Verlauf"
  echo "  Fotos:               $FOTOS"
  echo "$ZAEHLUNG" | sed 's/^/  /'
  echo
  echo "PRÜFSUMMEN (SHA-256)"
  (cd "$S" && find . -type f ! -name MANIFEST.txt | sort | xargs shasum -a 256 | sed 's/^/  /')
  echo
  echo "WIEDERHERSTELLEN"
  echo "  Programm:  tar -xzf projekt.tar.gz"
  echo "  Daten:     git clone daten.bundle Trainingstagebuch-Daten"
  echo "             (enthält jeden Abgleich; ältere Stände: git log $DATEN_BRANCH)"
  echo "  Nur lesen: trainingsdaten.json lässt sich unter Einstellungen → Sicherung"
  echo "             einspielen (Ausbilder-Rolle)."
} > "$S/MANIFEST.txt"

# --- 4) Vergleich mit der letzten Sicherung ----------------------------------
# Ein Abgleichfehler, der Datensaetze verschluckt, faellt sonst erst auf, wenn
# man die Sicherung braucht. Geloeschte Eintraege bleiben als Grabstein erhalten
# und zaehlen hier nicht – ein deutlicher Rueckgang der aktiven ist daher auffaellig.
WARNUNG=""
VORHER="$(ls -d "$ZIEL_BASIS"/20*/ 2>/dev/null | sort | tail -1 || true)"
if [ -n "$VORHER" ] && [ -f "$VORHER/stand.json" ]; then
  WARNUNG="$(python3 - "$VORHER/stand.json" "$S/stand.json" "$(basename "$VORHER")" <<'PY'
import json, sys
alt, neu = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
a, n = alt['aktiv'], neu['aktiv']
if a and n < a * 0.9:
    print(f"WARNUNG: aktive Datensätze von {a} auf {n} gesunken (Sicherung {sys.argv[3]}) – bitte prüfen.")
PY
)"
fi

# --- 5) An den Platz verschieben ---------------------------------------------------
mkdir -p "$ZIEL_BASIS"
mv "$S" "$ZIEL"
GROESSE="$(du -sh "$ZIEL" | cut -f1)"
echo "$STEMPEL  $GROESSE  Programm $APP_VERSION ($APP_COMMIT)  Daten $DATEN_COMMIT  $FOTOS Foto(s)" >> "$ZIEL_BASIS/protokoll.txt"

echo "SICHERUNG ERFOLGREICH"
echo "  Ziel:    $ZIEL ($GROESSE)"
echo "  Programm $APP_VERSION, Commit $APP_COMMIT"
echo "  Daten    Commit $DATEN_COMMIT – $(echo "$ZAEHLUNG" | head -1), $FOTOS Foto(s)"
[ -n "$WARNUNG" ] && echo "  $WARNUNG"
[ "$APP_OFFEN" != "0" ] && echo "  Hinweis: $APP_OFFEN nicht committete Datei(en) im Projekt – im Archiv enthalten."
[ "$APP_NICHT_UEBERTRAGEN" != "0" ] && [ "$APP_NICHT_UEBERTRAGEN" != "?" ] && echo "  Hinweis: $APP_NICHT_UEBERTRAGEN Commit(s) noch nicht auf GitHub."
exit 0
