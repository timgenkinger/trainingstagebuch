/** Minimaler IndexedDB-Wrapper – ohne Abhängigkeiten. */

const DB_NAME = 'rhd-trainingstagebuch';
const DB_VERSION = 1;
export const STORE = 'records';
export const META = 'meta';

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

/** Nur für "Alle lokalen Daten löschen" in den Einstellungen. */
export async function leereAlles() {
  const db = await openDb();
  return new Promise((res, rej) => {
    const t = db.transaction([STORE, META], 'readwrite');
    t.objectStore(STORE).clear();
    t.objectStore(META).clear();
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}
