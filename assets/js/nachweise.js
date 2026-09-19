/**
 * Nachweise: Führerscheinkontrollen der Hundeführer:innen und Impfungen der Hunde.
 *
 * Jede Kontrolle und jede Impfung ist ein eigener Datensatz – nicht ein Feld am
 * Hund oder an der Person. Der Abgleich übernimmt bei Konflikten stets den
 * ganzen neueren Datensatz; trüge eine Hundeführerin eine Impfung am Hund ein,
 * während die Ausbildung ihn gleichzeitig umbenennt, ginge eins von beidem
 * verloren. Als eigene Einträge geht nichts verloren, und der Verlauf bleibt
 * als Nachweis erhalten. "Letzte" und "nächste" werden daraus abgeleitet.
 *
 *   { type: 'fuehrerscheinkontrolle', personId, datum, naechste, vonId, vonName }
 *   { type: 'impfung', hundId, art, datum, naechste,
 *     eingetragenVonId, eingetragenVonName, bestaetigung: {vonId, vonName, am} | null }
 */

import * as store from './store.js';
import * as R from './rollen.js';

/** Abstand der Führerscheinkontrollen. */
export const FUEHRERSCHEIN_MONATE = 6;
/** Ab wann vor dem Termin eingeblendet wird. */
export const VORLAUF_MONATE = 1;

/**
 * Impfarten. Der Vorschlag für die nächste Impfung ist bewusst knapp gewählt:
 * Die tatsächliche Gültigkeit hängt vom Impfstoff ab und steht im Impfpass.
 * Ein zu früher Vorschlag warnt zu früh – ein zu später zu spät.
 */
export const IMPFARTEN = [
  { id: 'spl', label: 'SPL', vorschlagMonate: 12 },
  { id: 'tollwut', label: 'Tollwut', vorschlagMonate: 12 },
];

export function impfart(id) {
  return IMPFARTEN.find((a) => a.id === id) || { id, label: id, vorschlagMonate: 12 };
}

/* ---------------------------------------------------------------- */
/* Datumsrechnung                                                    */
/* ---------------------------------------------------------------- */

function isoAus(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${t}`;
}

/**
 * Heutiges Datum in Ortszeit. toISOString() rechnet in UTC und läge in
 * Deutschland zwischen Mitternacht und 1 bzw. 2 Uhr einen Tag zurück.
 */
export function heute() {
  return isoAus(new Date());
}

/**
 * Addiert Kalendermonate und bleibt dabei im Zielmonat:
 * 31.08. + 6 Monate ergibt den 28./29.02., nicht den 03.03.
 */
export function plusMonate(iso, n) {
  const [j, m, t] = String(iso).split('-').map(Number);
  const ziel = new Date(j, m - 1 + n, 1);
  const letzterTag = new Date(ziel.getFullYear(), ziel.getMonth() + 1, 0).getDate();
  ziel.setDate(Math.min(t, letzterTag));
  return isoAus(ziel);
}

/** Tage von `bezug` bis `iso` – negativ, wenn der Termin vorbei ist. */
export function tageBis(iso, bezug = heute()) {
  const utc = (s) => {
    const [j, m, t] = s.split('-').map(Number);
    return Date.UTC(j, m - 1, t);
  };
  return Math.round((utc(iso) - utc(bezug)) / 86400000);
}

/**
 * Lage eines Termins.
 *   'offen'      noch nie erfasst
 *   'gueltig'    mehr als einen Monat hin
 *   'bald'       ab einem Monat vorher bis einschließlich zum Termin
 *   'abgelaufen' Termin überschritten
 */
export function lage(naechste, bezug = heute()) {
  if (!naechste) return 'offen';
  if (bezug > naechste) return 'abgelaufen';
  if (bezug >= plusMonate(naechste, -VORLAUF_MONATE)) return 'bald';
  return 'gueltig';
}

/** Kurzer Text zur Lage, z.B. für Abzeichen. */
export function lageText(naechste, { abgelaufenWort = 'abgelaufen' } = {}, bezug = heute()) {
  const l = lage(naechste, bezug);
  if (l === 'offen') return 'noch nicht erfasst';
  const tage = tageBis(naechste, bezug);
  if (l === 'abgelaufen') return `${abgelaufenWort} seit ${-tage} ${-tage === 1 ? 'Tag' : 'Tagen'}`;
  if (l === 'bald') return tage === 0 ? 'heute fällig' : `fällig in ${tage} ${tage === 1 ? 'Tag' : 'Tagen'}`;
  return 'gültig';
}

/* ---------------------------------------------------------------- */
/* Führerscheinkontrolle                                             */
/* ---------------------------------------------------------------- */

const neuesteZuerst = (a, b) =>
  (b.datum || '').localeCompare(a.datum || '') || (b.createdAt || 0) - (a.createdAt || 0);

export function kontrollen(personId) {
  return store.alle('fuehrerscheinkontrolle').filter((k) => k.personId === personId).sort(neuesteZuerst);
}

export function fuehrerscheinStand(personId) {
  const letzte = kontrollen(personId)[0] || null;
  const naechste = letzte?.naechste || null;
  return { letzte, naechste, lage: lage(naechste) };
}

/* ---------------------------------------------------------------- */
/* Impfungen                                                         */
/* ---------------------------------------------------------------- */

export function impfungen(hundId, art) {
  return store
    .alle('impfung')
    .filter((i) => i.hundId === hundId && (!art || i.art === art))
    .sort(neuesteZuerst);
}

export function istBestaetigt(impfung) {
  return !!impfung?.bestaetigung;
}

/**
 * Stand einer Impfart. Maßgeblich ist nur, was die Ausbildung bestätigt hat –
 * eine selbst eingetragene Impfung ändert die Lage erst nach der Bestätigung.
 */
export function impfStand(hundId, art) {
  const alle = impfungen(hundId, art);
  const letzte = alle.find(istBestaetigt) || null;
  const offen = alle.filter((i) => !istBestaetigt(i));
  const naechste = letzte?.naechste || null;
  // Eine offene Eintragung, die neuer ist als die letzte bestätigte, ersetzt
  // in der Einblendung die Warnung: Die Hundeführerin hat gehandelt.
  const neuerOffen = offen.find((i) => !letzte || (i.datum || '') > (letzte.datum || '')) || null;
  return { letzte, offen, naechste, lage: lage(naechste), neuerOffen };
}

/** Alle noch nicht bestätigten Impfungen – Arbeitsliste der Ausbildung. */
export function offeneImpfungen() {
  const sichtbar = new Set(R.meineHunde().map((h) => h.id));
  return store.alle('impfung').filter((i) => !istBestaetigt(i) && sichtbar.has(i.hundId)).sort(neuesteZuerst);
}

/** Darf die aktuelle Person diese Impfung entfernen? */
export function darfImpfungEntfernen(impfung) {
  if (R.istAusbilder()) return true;
  return !istBestaetigt(impfung) && impfung.eingetragenVonId === R.meinePersonId();
}

/* ---------------------------------------------------------------- */
/* Einblendungen                                                     */
/* ---------------------------------------------------------------- */

/**
 * Hinweise für die Person an diesem Gerät: eigene Führerscheinkontrolle und
 * die Impfungen der Hunde, die sie tatsächlich führt. Bewusst nicht über
 * R.meineHunde() – für die Ausbildung wären das alle Hunde der Staffel.
 *
 * "Noch nicht erfasst" blendet nichts ein: Das ist weder "bald" noch
 * "abgelaufen", und direkt nach der Einführung stünde es sonst überall.
 *
 * @returns {{art:'bald'|'abgelaufen'|'wartet'|'ausbildung', text:string}[]}
 */
export function hinweise(bezug = heute()) {
  const ich = R.meinePersonId();
  const out = [];
  if (!ich) return out;

  const fs = fuehrerscheinStand(ich);
  const fsLage = lage(fs.naechste, bezug);
  if (fsLage === 'bald') {
    const t = tageBis(fs.naechste, bezug);
    out.push({ art: 'bald', text: `Führerscheinkontrolle fällig am ${deDatum(fs.naechste)}`
      + (t === 0 ? ' – heute.' : ` – in ${t} ${t === 1 ? 'Tag' : 'Tagen'}.`) });
  } else if (fsLage === 'abgelaufen') {
    out.push({ art: 'abgelaufen', text: `Führerscheinkontrolle überfällig seit ${deDatum(fs.naechste)}.` });
  }

  const meine = store.hunde().filter((h) => (h.hfIds || []).includes(ich));
  for (const h of meine) {
    for (const a of IMPFARTEN) {
      const st = impfStand(h.id, a.id);
      const l = lage(st.naechste, bezug);
      if (l !== 'bald' && l !== 'abgelaufen') continue;
      if (st.neuerOffen) {
        out.push({ art: 'wartet', text: `${h.name}: ${a.label}-Impfung vom ${deDatum(st.neuerOffen.datum)} eingetragen – wartet auf Bestätigung durch die Ausbildung.` });
      } else if (l === 'bald') {
        const t = tageBis(st.naechste, bezug);
        out.push({ art: 'bald', text: `${h.name}: ${a.label}-Impfung fällig am ${deDatum(st.naechste)}`
          + (t === 0 ? ' – heute.' : ` – in ${t} ${t === 1 ? 'Tag' : 'Tagen'}.`) });
      } else {
        out.push({ art: 'abgelaufen', text: `${h.name}: ${a.label}-Impfung abgelaufen seit ${deDatum(st.naechste)}.` });
      }
    }
  }

  // Die Bestätigung ist Teil des Ablaufs: Ohne Hinweis blieben Eintragungen
  // liegen, weil es für Impfungen keine Liste gibt, an der man vorbeikommt.
  if (R.istAusbilder()) {
    const n = offeneImpfungen().length;
    if (n) out.push({ art: 'ausbildung', text: `${n} eingetragene ${n === 1 ? 'Impfung wartet' : 'Impfungen warten'} auf deine Bestätigung.` });
  }
  return out;
}

function deDatum(iso) {
  const [j, m, t] = String(iso).split('-');
  return `${t}.${m}.${j}`;
}
