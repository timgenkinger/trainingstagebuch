/**
 * Online-Abgleich über Cloud Firestore.
 *
 * Bewusste Eigenschaften:
 *  - Das Firebase-SDK wird erst geladen, wenn eine Konfiguration vorliegt.
 *    Ohne Konfiguration läuft die App vollständig offline weiter.
 *  - Es wird nur GEMISCHT (siehe store.js). Ein leerer Server löscht nichts.
 *  - Änderungen werden lokal gepuffert und nachgereicht, sobald wieder
 *    Verbindung besteht.
 */

import { ladeConfig } from './config.js';
import * as store from './store.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.5';

export const status = {
  zustand: 'aus', // aus | verbinde | aktiv | offline | fehler
  text: 'Kein Online-Sync konfiguriert',
  offen: 0,
  letzterAbgleich: null,
};

const listeners = new Set();
export function onStatus(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}
function setze(zustand, text) {
  status.zustand = zustand;
  if (text !== undefined) status.text = text;
  status.offen = store.anzahlOffen();
  listeners.forEach((fn) => fn(status));
}

let fb = null; // { db, col, mod }
let pushTimer = null;
let unsubscribeSnapshot = null;

export async function starte() {
  const cfg = ladeConfig();
  if (!cfg.firebase?.apiKey || !cfg.firebase?.projectId) {
    setze('aus', 'Kein Online-Sync konfiguriert');
    return false;
  }
  setze('verbinde', 'Verbinde …');
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);

    const app = appMod.getApps?.().length ? appMod.getApp() : appMod.initializeApp(cfg.firebase);

    // Anonyme Anmeldung: erlaubt geschützte Firestore-Regeln ohne Passwortpflege.
    const auth = authMod.getAuth(app);
    try {
      if (!auth.currentUser) await authMod.signInAnonymously(auth);
    } catch (e) {
      // Wenn anonyme Anmeldung nicht aktiviert ist, kann es trotzdem mit
      // offenen Regeln funktionieren – deshalb nur protokollieren.
      console.warn('Anonyme Anmeldung nicht möglich:', e?.code || e);
    }

    const db = fsMod.getFirestore(app);
    const col = fsMod.collection(db, cfg.collection);
    fb = { db, col, mod: fsMod };

    unsubscribeSnapshot?.();
    unsubscribeSnapshot = fsMod.onSnapshot(
      col,
      async (snap) => {
        const extern = snap.docs.map((d) => d.data()).filter(Boolean);
        const n = await store.uebernehmeExtern(extern);
        status.letzterAbgleich = Date.now();
        await store.setzeLetzterAbgleich(status.letzterAbgleich);
        setze('aktiv', n ? `${n} Änderung(en) empfangen` : 'Aktuell');
        planePush();
      },
      (err) => {
        console.error('Firestore-Abgleich fehlgeschlagen', err);
        setze('fehler', fehlerText(err));
      }
    );

    store.subscribe(planePush);
    window.addEventListener('online', () => planePush(0));
    window.addEventListener('offline', () => setze('offline', 'Offline – Änderungen werden gepuffert'));
    planePush(0);
    return true;
  } catch (e) {
    console.error('Sync-Start fehlgeschlagen', e);
    setze('fehler', fehlerText(e));
    return false;
  }
}

function fehlerText(e) {
  const c = e?.code || '';
  if (c.includes('permission-denied')) return 'Zugriff verweigert – Firestore-Regeln prüfen';
  if (c.includes('unavailable')) return 'Server nicht erreichbar';
  if (c.includes('failed-precondition')) return 'Firestore-Datenbank fehlt oder ist gesperrt';
  if (c.includes('invalid-api-key') || c.includes('api-key')) return 'API-Key ungültig';
  return e?.message ? String(e.message).slice(0, 90) : 'Unbekannter Fehler';
}

function planePush(verzoegerung = 900) {
  clearTimeout(pushTimer);
  status.offen = store.anzahlOffen();
  listeners.forEach((fn) => fn(status));
  pushTimer = setTimeout(push, verzoegerung);
}

let laeuft = false;
async function push() {
  if (!fb || laeuft) return;
  const offen = store.offeneUploads();
  if (!offen.length) {
    if (status.zustand === 'aktiv') setze('aktiv', 'Aktuell');
    return;
  }
  if (!navigator.onLine) {
    setze('offline', `Offline – ${offen.length} Änderung(en) gepuffert`);
    return;
  }
  laeuft = true;
  setze(status.zustand === 'fehler' ? 'verbinde' : 'aktiv', `Sende ${offen.length} Änderung(en) …`);
  const { doc, writeBatch } = fb.mod;
  try {
    // In Blöcken zu 400 schreiben (Firestore-Limit: 500 Operationen pro Batch).
    for (let i = 0; i < offen.length; i += 400) {
      const teil = offen.slice(i, i + 400);
      const stand = teil.map((r) => ({ id: r.id, updatedAt: r.updatedAt }));
      const batch = writeBatch(fb.db);
      teil.forEach((r) => batch.set(doc(fb.col, r.id), bereinige(r)));
      await batch.commit();
      await store.markiereHochgeladen(stand, Date.now());
    }
    setze('aktiv', 'Aktuell');
  } catch (e) {
    console.error('Hochladen fehlgeschlagen', e);
    setze('fehler', fehlerText(e));
  } finally {
    laeuft = false;
  }
}

/** Firestore verträgt kein `undefined`; außerdem halten wir die Daten flach-serialisierbar. */
function bereinige(rec) {
  return JSON.parse(JSON.stringify(rec, (k, v) => (v === undefined ? null : v)));
}

export async function neustart() {
  unsubscribeSnapshot?.();
  unsubscribeSnapshot = null;
  fb = null;
  return starte();
}

export function jetztAbgleichen() {
  planePush(0);
}
