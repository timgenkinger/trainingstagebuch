/**
 * Lokal-zuerst ("local first") Datenspeicher.
 *
 * Grundregeln – bewusst so gewählt, damit Speichern/Synchronisieren die
 * Anwendung NIE zurücksetzt:
 *   1. Jede Änderung landet sofort und vollständig in IndexedDB.
 *   2. Der Online-Abgleich MISCHT nur (Feld `updatedAt`, jüngster gewinnt).
 *      Es wird niemals lokal gelöscht, nur weil entfernt etwas fehlt.
 *   3. Löschen erzeugt einen Grabstein (`deleted: true`), damit die Löschung
 *      synchronisierbar ist und kein Datensatz "wiederaufersteht".
 *   4. Ein App-Update tauscht nur den Programmcode aus – die Datenbank bleibt.
 *   5. Freigabe-Schranke: Eine Suche verlässt das Gerät erst, wenn ihr Protokoll
 *      abgeschlossen ist. Entwürfe bleiben lokal – so landen ausschließlich
 *      vollständig ausgeführte Suchen im gemeinsamen Datenbestand.
 */

import { alleRecords, schreibeRecords, metaGet, metaSet, leereAlles } from './idb.js';
import { geraeteName } from './config.js';
import { istAbgeschlossen, istDokument } from './schema.js';

const cache = new Map();
const listeners = new Set();
let pendingIds = new Set();
let bereit = false;

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export async function init() {
  const recs = await alleRecords();
  recs.forEach((r) => cache.set(r.id, r));
  pendingIds = new Set(await metaGet('pending', []));
  bereit = true;
  benachrichtige();
}

export function istBereit() {
  return bereit;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let benachrichtigungGeplant = false;
export function benachrichtige() {
  if (benachrichtigungGeplant) return;
  benachrichtigungGeplant = true;
  queueMicrotask(() => {
    benachrichtigungGeplant = false;
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Store-Listener-Fehler', e);
      }
    });
  });
}

/* ---------------------------------------------------------------- */
/* Lesen                                                             */
/* ---------------------------------------------------------------- */

export function get(id) {
  const r = cache.get(id);
  return r && !r.deleted ? r : null;
}

export function alle(type) {
  const out = [];
  for (const r of cache.values()) {
    if (r.deleted) continue;
    if (type && r.type !== type) continue;
    out.push(r);
  }
  return out;
}

export function suchen() {
  return alle('suche').sort(
    (a, b) => (b.datum || '').localeCompare(a.datum || '') || (b.createdAt || 0) - (a.createdAt || 0)
  );
}

export function freieDokus() {
  return alle('freidoku').sort(
    (a, b) => (b.datum || '').localeCompare(a.datum || '') || (b.createdAt || 0) - (a.createdAt || 0)
  );
}

export function verbellenSitzungen() {
  return alle('verbellen').sort(
    (a, b) => (b.datum || '').localeCompare(a.datum || '') || (b.createdAt || 0) - (a.createdAt || 0)
  );
}

/** Alle drei Dokumentarten gemeinsam, neueste zuerst. */
export function dokumente() {
  return [...alle('suche'), ...alle('freidoku'), ...alle('verbellen')].sort(
    (a, b) => (b.datum || '').localeCompare(a.datum || '') || (b.createdAt || 0) - (a.createdAt || 0)
  );
}

export function hunde() {
  return alle('hund').sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
}

export function personen() {
  return alle('person').sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
}

export function bildFortschritt(hundId) {
  const map = {};
  for (const r of alle('helferbild')) {
    if (hundId && r.hundId !== hundId) continue;
    map[r.bildId] = r;
  }
  return map;
}

export function rohdaten() {
  return [...cache.values()];
}

/* ---------------------------------------------------------------- */
/* Schreiben                                                         */
/* ---------------------------------------------------------------- */

/**
 * Speichert einen Datensatz lokal und merkt ihn für den Upload vor.
 * @param {object} rec  Datensatz (id optional – wird erzeugt)
 */
export async function put(rec) {
  const jetzt = Date.now();
  const bestand = rec.id ? cache.get(rec.id) : null;
  const voll = {
    ...bestand,
    ...rec,
    id: rec.id || uid(),
    createdAt: bestand?.createdAt || rec.createdAt || jetzt,
    updatedAt: jetzt,
    updatedBy: geraeteName(),
    deleted: rec.deleted === true,
  };
  cache.set(voll.id, voll);
  pendingIds.add(voll.id);
  await schreibeRecords([voll]);
  await metaSet('pending', [...pendingIds]);
  benachrichtige();
  return voll;
}

/** Weiches Löschen (Grabstein) – bleibt synchronisierbar. */
export async function entferne(id) {
  const r = cache.get(id);
  if (!r) return;
  return put({ ...r, deleted: true });
}

/** Datensatz wiederherstellen. */
export async function stelleWiederHer(id) {
  const r = cache.get(id);
  if (!r) return;
  return put({ ...r, deleted: false });
}

export function papierkorb() {
  return [...cache.values()]
    .filter((r) => r.deleted && istDokument(r))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/* ---------------------------------------------------------------- */
/* Abgleich mit der Cloud                                            */
/* ---------------------------------------------------------------- */

/**
 * Datensätze, die tatsächlich hochgeladen werden dürfen.
 * Entwürfe einer Suche bleiben zurück, bis sie abgeschlossen sind –
 * sie verbleiben aber vorgemerkt und gehen mit, sobald sie freigegeben werden.
 */
export function offeneUploads() {
  return [...pendingIds]
    .map((id) => cache.get(id))
    .filter((r) => r && (r.deleted || istAbgeschlossen(r)));
}

/** Vorgemerkte Datensätze, die wegen fehlender Freigabe (noch) zurückgehalten werden. */
export function zurueckgehalten() {
  return [...pendingIds]
    .map((id) => cache.get(id))
    .filter((r) => r && !r.deleted && !istAbgeschlossen(r));
}

export function anzahlOffen() {
  return offeneUploads().length;
}

export function anzahlZurueckgehalten() {
  return zurueckgehalten().length;
}

/** Alle Datensätze, die zum gemeinsamen Bestand gehören (für dateibasierten Abgleich). */
export function freigegebeneRecords() {
  return [...cache.values()].filter((r) => r.deleted || istAbgeschlossen(r));
}

export function entwuerfe() {
  return dokumente().filter((r) => !istAbgeschlossen(r));
}

/**
 * Nimmt hochgeladene Datensätze aus der Warteschlange.
 * Wurde ein Datensatz waehrend des Uploads erneut geaendert, bleibt er
 * vorgemerkt – sonst ginge diese Aenderung fuer das Team verloren.
 * @param {Array<{id:string, updatedAt:number}>} eintraege
 */
export async function markiereHochgeladen(eintraege, stand) {
  eintraege.forEach(({ id, updatedAt }) => {
    const aktuell = cache.get(id);
    if (!aktuell || aktuell.updatedAt === updatedAt) pendingIds.delete(id);
  });
  await metaSet('pending', [...pendingIds]);
  if (stand) await metaSet('lastPush', stand);
  benachrichtige();
}

/**
 * Übernimmt entfernte Datensätze. Mischt ausschließlich – es wird nie
 * lokal etwas verworfen, das neuer ist.
 * @returns {number} Anzahl tatsächlich übernommener Datensätze
 */
export async function uebernehmeExtern(records) {
  const neu = [];
  let warteschlangeGeaendert = false;
  for (const r of records) {
    if (!r || !r.id) continue;
    const lokal = cache.get(r.id);
    // Nur uebernehmen, wenn der Fernstand juenger ist. Eine neuere lokale
    // Aenderung (auch eine noch nicht hochgeladene) bleibt damit erhalten.
    if (!lokal || (r.updatedAt || 0) > (lokal.updatedAt || 0)) {
      cache.set(r.id, r);
      neu.push(r);
      // Der lokale Stand ist jetzt ueberholt und muss nicht mehr hoch.
      if (pendingIds.delete(r.id)) warteschlangeGeaendert = true;
    }
  }
  if (neu.length) {
    await schreibeRecords(neu);
    if (warteschlangeGeaendert) await metaSet('pending', [...pendingIds]);
    benachrichtige();
  }
  return neu.length;
}

export async function letzterAbgleich() {
  return metaGet('lastPull', null);
}

export async function setzeLetzterAbgleich(ts) {
  return metaSet('lastPull', ts);
}

/* ---------------------------------------------------------------- */
/* Export / Import / Reset                                           */
/* ---------------------------------------------------------------- */

export function exportJson() {
  return JSON.stringify(
    {
      app: 'rhd-trainingstagebuch',
      exportiertAm: new Date().toISOString(),
      records: [...cache.values()],
    },
    null,
    2
  );
}

/** Import mischt ebenfalls nur – bestehende neuere Daten bleiben erhalten. */
export async function importJson(text) {
  const daten = JSON.parse(text);
  const records = Array.isArray(daten) ? daten : daten.records;
  if (!Array.isArray(records)) throw new Error('Unbekanntes Dateiformat.');
  let uebernommen = 0;
  const zuSchreiben = [];
  for (const r of records) {
    if (!r?.id || !r?.type) continue;
    const lokal = cache.get(r.id);
    if (!lokal || (r.updatedAt || 0) > (lokal.updatedAt || 0)) {
      cache.set(r.id, r);
      zuSchreiben.push(r);
      pendingIds.add(r.id);
      uebernommen++;
    }
  }
  await schreibeRecords(zuSchreiben);
  await metaSet('pending', [...pendingIds]);
  benachrichtige();
  return uebernommen;
}

export async function allesLoeschen() {
  await leereAlles();
  cache.clear();
  pendingIds = new Set();
  benachrichtige();
}
