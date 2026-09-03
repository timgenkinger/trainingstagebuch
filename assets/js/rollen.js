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
/* Passwort für den Wechsel in die Ausbilder-Rolle                   */
/* ---------------------------------------------------------------- */

/**
 * Hinterlegt ist NICHT das Passwort, sondern nur ein Pruefwert daraus.
 * Grund: Das Repository ist oeffentlich – im Klartext stuende das Passwort
 * damit im Internet. Aus dem Pruefwert laesst es sich nicht zurueckrechnen.
 *
 * Was das leistet und was nicht: Es verhindert, dass jemand die Rolle mal eben
 * umstellt. Es ist keine Zugriffssperre – die Pruefung laeuft im Browser und
 * liesse sich mit Entwicklerwerkzeugen umgehen (siehe Hinweis oben).
 */
const SALZ = 'rhd-trainingstagebuch-rolle-v1';
const PRUEFWERT_SHA256 = 'c7a90aeaecd216ab7999e8035bc30b99991984ef309bfab11005b95e5d989970';
const PRUEFWERT_EINFACH = 'a0ee82a8';

/** Rueckfallebene, falls crypto.subtle fehlt (unsichere Herkunft, sehr alter Browser). */
function einfacherHash(text) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(text)) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export async function passwortStimmt(eingabe) {
  const roh = `${SALZ}:${(eingabe || '').trim()}`;
  if (globalThis.crypto?.subtle) {
    const puffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(roh));
    const hex = [...new Uint8Array(puffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return hex === PRUEFWERT_SHA256;
  }
  return einfacherHash(roh) === PRUEFWERT_EINFACH;
}

/* ---------------------------------------------------------------- */
/* Wer bedient dieses Gerät?                                         */
/* ---------------------------------------------------------------- */

export function meineRolle() {
  return localStorage.getItem(LS_ROLLE) || 'hundefuehrer';
}

/**
 * Setzt die Rolle. Der Wechsel zur Ausbildung ist passwortpflichtig und geht
 * deshalb ausschliesslich ueber wechsleZuAusbilder().
 */
export function setzeRolle(r) {
  if (r === 'ausbilder') throw new Error('Wechsel zur Ausbildung nur mit Passwort.');
  localStorage.setItem(LS_ROLLE, r);
}

/** @returns {Promise<boolean>} true, wenn das Passwort stimmte und die Rolle nun gilt. */
export async function wechsleZuAusbilder(passwort) {
  if (!(await passwortStimmt(passwort))) return false;
  localStorage.setItem(LS_ROLLE, 'ausbilder');
  return true;
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
