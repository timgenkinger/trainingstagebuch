#!/usr/bin/env bash
#
# Vergibt eine neue Versionsnummer und schreibt sie an alle relevanten Stellen.
# Benötigt nur bash + sed (kein Node, kein npm).
#
# Verwendung:
#   scripts/release.sh patch  -m "Radius-Auswertung ergaenzt"
#   scripts/release.sh minor  -m "Dashboard-Filter"
#   scripts/release.sh major
#   scripts/release.sh 2.3.0  -m "Grosses Update"
#
set -euo pipefail
cd "$(dirname "$0")/.."

ART="${1:-patch}"
shift || true
NACHRICHT=""
while [ $# -gt 0 ]; do
  case "$1" in
    -m|--message) NACHRICHT="${2:-}"; shift 2 ;;
    *) shift ;;
  esac
done

ALT=$(sed -n 's/.*"version": *"\([0-9.]*\)".*/\1/p' version.json | head -1)
if [ -z "$ALT" ]; then echo "Konnte aktuelle Version nicht lesen." >&2; exit 1; fi
IFS='.' read -r MA MI PA <<< "$ALT"

case "$ART" in
  patch) NEU="$MA.$MI.$((PA+1))" ;;
  minor) NEU="$MA.$((MI+1)).0" ;;
  major) NEU="$((MA+1)).0.0" ;;
  [0-9]*.[0-9]*.[0-9]*) NEU="$ART" ;;
  *) echo "Unbekannte Angabe: $ART (erlaubt: patch | minor | major | x.y.z)" >&2; exit 1 ;;
esac

HEUTE=$(date +%Y-%m-%d)

# 1) version.json
cat > version.json <<JSON
{
  "version": "$NEU",
  "releaseDate": "$HEUTE",
  "build": "lokal"
}
JSON

# 2) assets/js/version.js
sed -i.bak -E "s/^export const APP_VERSION = '.*';/export const APP_VERSION = '$NEU';/" assets/js/version.js
sed -i.bak -E "s/^export const RELEASE_DATE = '.*';/export const RELEASE_DATE = '$HEUTE';/" assets/js/version.js
rm -f assets/js/version.js.bak

# 3) Service-Worker-Cache (erzwingt das Nachladen des Programmcodes)
sed -i.bak -E "s|^const VERSION = .*|const VERSION = '$NEU'; // wird von scripts/release.sh gepflegt|" sw.js
rm -f sw.js.bak

# 4) Änderungsprotokoll
TMP=$(mktemp)
{
  echo "# Änderungsprotokoll"
  echo
  echo "## $NEU – $HEUTE"
  if [ -n "$NACHRICHT" ]; then echo "- $NACHRICHT"; else echo "- (keine Beschreibung angegeben)"; fi
  echo
  tail -n +2 CHANGELOG.md 2>/dev/null | sed '1{/^$/d;}'
} > "$TMP"
mv "$TMP" CHANGELOG.md

echo "Version $ALT -> $NEU gesetzt (Datum $HEUTE)."
echo
echo "Nächste Schritte:"
echo "  git add -A && git commit -m \"Version $NEU${NACHRICHT:+: $NACHRICHT}\" && git push"
