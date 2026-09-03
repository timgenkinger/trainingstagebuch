/**
 * Rollen und Sichtbarkeit.
 *
 * EHRLICHE EINORDNUNG: Das hier ordnet die Ansicht, es schützt die Daten nicht.
 * Alle Geräte teilen sich eine Datei und einen Zugangs-Token; wer den Token hat,
 * kann den gesamten Bestand lesen. Eine echte Zugriffssperre bräuchte einen
 * Server mit Benutzerkonten. Für den Alltag – jeder sieht seine Hunde, der
 * Ausbilder sieht alles – ist die Trennung richtig und ausreichend; als
 * Vertraulichkeitsgrenze taugt sie nicht.
 *
 * Wer dieses Gerät bedient, ist eine Geräte-Einstellung und wird deshalb NICHT
 * synchronisiert. Die Zuordnung Hund -> Hundeführer:in dagegen schon.
 */

import * as store from './store.js';

const LS_PERSON = 'rhd.person';
const LS_ROLLE = 'rhd.rolle';
const EINSTELLUNG_ID = 'einstellung:team';

export const ROLLEN = [
  { id: 'hundefuehrer', label: 'Hundeführer:in', beschreibung: 'Dokumentiert die eigenen Hunde.' },
  { id: 'ausbilder', label: 'Ausbilder:in', beschreibung: 'Sieht alle Hunde, bestätigt Einheiten, nutzt die Auswertungen.' },
];

/* ---------------------------------------------------------------- */
/* Wer bedient dieses Gerät?                                         */
/* ---------------------------------------------------------------- */

export function meineRolle() {
  return localStorage.getItem(LS_ROLLE) || 'hundefuehrer';
}

export function setzeRolle(r) {
  localStorage.setItem(LS_ROLLE, r);
}

export function meinePersonId() {
  return localStorage.getItem(LS_PERSON) || '';
}

export function setzePerson(id) {
  if (id) localStorage.setItem(LS_PERSON, id);
  else localStorage.removeItem(LS_PERSON);
}

export function meinePerson() {
  return store.get(meinePersonId());
}

export function istAusbilder() {
  return meineRolle() === 'ausbilder';
}

/** Solange niemand zugeordnet ist, wird nichts eingeschränkt – sonst steht man vor einer leeren App. */
export function eingerichtet() {
  return !!meinePersonId();
}

/* ---------------------------------------------------------------- */
/* Team-Einstellung (synchronisiert)                                 */
/* ---------------------------------------------------------------- */

export function teamEinstellung() {
  const e = store.get(EINSTELLUNG_ID);
  return {
    // Dürfen Hundeführer:innen den Stand ihrer eigenen Hunde einsehen
    // (Dashboard, Verbellen-Katalog, Helfer:in-Bilder – jeweils nur für ihre Hunde)?
    eigenerStandSichtbar: e?.eigenerStandSichtbar ?? false,
  };
}

export async function setzeTeamEinstellung(werte) {
  const alt = store.get(EINSTELLUNG_ID) || {};
  return store.put({ ...alt, id: EINSTELLUNG_ID, type: 'einstellung', ...werte });
}

/* ---------------------------------------------------------------- */
/* Sichtbarkeit                                                      */
/* ---------------------------------------------------------------- */

/** Hunde, die diesem Gerät zugeordnet sind. Ausbilder:innen sehen alle. */
export function meineHunde() {
  const alle = store.hunde();
  if (istAusbilder() || !eingerichtet()) return alle;
  const ich = meinePersonId();
  return alle.filter((h) => (h.hfIds || []).includes(ich));
}

export function sichtbareHundIds() {
  return new Set(meineHunde().map((h) => h.id));
}

/** Darf dieses Dokument angezeigt werden? */
export function darfSehen(rec) {
  if (istAusbilder() || !eingerichtet()) return true;
  if (!rec) return false;
  const ids = sichtbareHundIds();
  // Ohne zugeordneten Hund gilt: sichtbar für die Person, die ihn angelegt hat.
  if (!rec.hundId) return !rec.hfId || rec.hfId === meinePersonId();
  return ids.has(rec.hundId);
}

export function filtereDokumente(liste) {
  if (istAusbilder() || !eingerichtet()) return liste;
  return liste.filter(darfSehen);
}

/** Auswertungen: Ausbilder:innen immer, Hundeführer:innen nur wenn freigegeben. */
export function darfAuswertungSehen() {
  if (istAusbilder() || !eingerichtet()) return true;
  return teamEinstellung().eigenerStandSichtbar;
}

/* ---------------------------------------------------------------- */
/* Bestätigung durch die Ausbildung                                  */
/* ---------------------------------------------------------------- */

export function istBestaetigt(rec) {
  return !!rec?.bestaetigung?.am;
}

export function bestaetigungText(rec) {
  const b = rec?.bestaetigung;
  if (!b?.am) return null;
  return `${b.vonName || 'Ausbildung'} · ${String(b.am).slice(0, 10)}`;
}

/** Alle abgeschlossenen Dokumente, die noch auf eine Bestätigung warten. */
export function offeneBestaetigungen() {
  return store
    .dokumente()
    .filter((d) => (d.status ?? 'abgeschlossen') === 'abgeschlossen' && !istBestaetigt(d));
}
