/** Minimaler IndexedDB-Wrapper – ohne Abhängigkeiten. */

const DB_NAME = 'rhd-trainingstagebuch';
const DB_VERSION = 2;
export const STORE = 'records';
export const META = 'meta';
/**
 * Fotos liegen in einem eigenen Speicher und NICHT bei den Datensaetzen.
 * Grund: Der Abgleich schreibt alle Datensaetze als eine JSON-Datei; schon
 * wenige eingebettete Fotos wuerden sie ueber die 1-MB-Grenze der GitHub-
 * Contents-API heben und bei jedem Speichern komplett neu uebertragen.
 */
export const FOTOS = 'fotos';

let dbP = null;

export function openDb() {
  if (dbP) return dbP;
  dbP = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'id' });
        s.createIndex('type', 'type', { unique: false });
        s.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
      if (!db.objectStoreNames.contains(FOTOS)) {
        const f = db.createObjectStore(FOTOS, { keyPath: 'id' });
        f.createIndex('dokumentId', 'dokumentId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbP;
}

function tx(db, store, mode) {
  return db.transaction(store, mode).objectStore(store);
}

function wrap(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function alleRecords() {
  const db = await openDb();
  return wrap(tx(db, STORE, 'readonly').getAll());
}

export async function schreibeRecords(records) {
  if (!records.length) return;
  const db = await openDb();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, 'readwrite');
    const s = t.objectStore(STORE);
    records.forEach((r) => s.put(r));
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}

export async function metaGet(key, fallback = null) {
  const db = await openDb();
  const v = await wrap(tx(db, META, 'readonly').get(key));
  return v === undefined ? fallback : v;
}

export async function metaSet(key, value) {
  const db = await openDb();
  return wrap(tx(db, META, 'readwrite').put(value, key));
}

/* ---------------------------------------------------------------- */
/* Fotos                                                             */
/* ---------------------------------------------------------------- */

export async function fotoLesen(id) {
  const db = await openDb();
  return wrap(tx(db, FOTOS, 'readonly').get(id));
}

export async function fotoSchreiben(foto) {
  const db = await openDb();
  return wrap(tx(db, FOTOS, 'readwrite').put(foto));
}

export async function fotoLoeschen(id) {
  const db = await openDb();
  return wrap(tx(db, FOTOS, 'readwrite').delete(id));
}

/** Alle Fotos ohne Bilddaten – für Übersicht und Warteschlange. */
export async function fotoKoepfe() {
  const db = await openDb();
  const alle = await wrap(tx(db, FOTOS, 'readonly').getAll());
  return alle.map(({ daten, ...rest }) => ({ ...rest, vorhanden: !!daten }));
}

export async function fotoIds() {
  const db = await openDb();
  return wrap(tx(db, FOTOS, 'readonly').getAllKeys());
}

/** Nur für "Alle lokalen Daten löschen" in den Einstellungen. */
export async function leereAlles() {
  const db = await openDb();
  return new Promise((res, rej) => {
    const t = db.transaction([STORE, META, FOTOS], 'readwrite');
    t.objectStore(STORE).clear();
    t.objectStore(META).clear();
    t.objectStore(FOTOS).clear();
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}
