/**
 * Abgleich über Cloud Firestore (Echtzeit).
 *
 * Wird vom Orchestrator (index.js) angesteuert und hält sich an dieselbe
 * Freigabe-Schranke: hochgeladen wird nur, was store.offeneUploads() liefert –
 * Entwürfe bleiben auf dem Gerät.
 */

import * as store from '../store.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.5';

let fb = null;
let unsubscribe = null;
let abmelden = null;
let pushTimer = null;
let laeuft = false;
let melder = null;

export async function starte(cfg, { setzeStatus, notiere }) {
  melder = { setzeStatus, notiere };
  setzeStatus('verbinde', 'Verbinde mit Firestore …');
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);

    const app = appMod.getApps?.().length ? appMod.getApp() : appMod.initializeApp(cfg.firebase);

    const auth = authMod.getAuth(app);
    try {
      if (!auth.currentUser) await authMod.signInAnonymously(auth);
    } catch (e) {
      console.warn('Anonyme Anmeldung nicht möglich:', e?.code || e);
    }

    const db = fsMod.getFirestore(app);
    const col = fsMod.collection(db, cfg.collection);
    fb = { db, col, mod: fsMod };

    unsubscribe?.();
    unsubscribe = fsMod.onSnapshot(
      col,
      async (snap) => {
        const extern = snap.docs.map((d) => d.data()).filter(Boolean);
        const n = await store.uebernehmeExtern(extern);
        if (n) notiere('empfangen', `${n} Änderung(en) empfangen`);
        await store.setzeLetzterAbgleich(Date.now());
        ruhe();
        planePush();
      },
      (err) => melde(err)
    );

    abmelden = store.subscribe(planePush);
    window.addEventListener('online', () => planePush(0));
    window.addEventListener('offline', () => setzeStatus('offline', 'Offline – Änderungen werden gepuffert'));
    planePush(0);
    return true;
  } catch (e) {
    melde(e);
    return false;
  }
}

function ruhe() {
  const z = store.anzahlZurueckgehalten();
  melder?.setzeStatus('aktiv', z ? `Aktuell – ${z} Entwurf/Entwürfe bleiben lokal` : 'Aktuell');
}

function melde(e) {
  console.error('Firestore-Abgleich', e);
  const c = e?.code || '';
  let t = e?.message ? String(e.message).slice(0, 100) : 'Unbekannter Fehler';
  if (c.includes('permission-denied')) t = 'Zugriff verweigert – Firestore-Regeln prüfen';
  else if (c.includes('unavailable')) t = 'Server nicht erreichbar';
  else if (c.includes('failed-precondition')) t = 'Firestore-Datenbank fehlt oder ist gesperrt';
  else if (c.includes('api-key')) t = 'API-Key ungültig';
  melder?.notiere('fehler', t);
  melder?.setzeStatus('fehler', t);
}

function planePush(verzoegerung = 900) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, verzoegerung);
}

async function push() {
  if (!fb || laeuft) return;
  const offen = store.offeneUploads();
  if (!offen.length) return ruhe();
  if (!navigator.onLine) return melder?.setzeStatus('offline', `Offline – ${offen.length} Änderung(en) gepuffert`);

  laeuft = true;
  melder?.setzeStatus('aktiv', `Sende ${offen.length} Änderung(en) …`);
  const { doc, writeBatch } = fb.mod;
  try {
    for (let i = 0; i < offen.length; i += 400) {
      const teil = offen.slice(i, i + 400);
      const stand = teil.map((r) => ({ id: r.id, updatedAt: r.updatedAt }));
      const batch = writeBatch(fb.db);
      teil.forEach((r) => batch.set(doc(fb.col, r.id), bereinige(r)));
      await batch.commit();
      await store.markiereHochgeladen(stand, Date.now());
    }
    melder?.notiere('gesendet', `${offen.length} Änderung(en) gesendet`);
    ruhe();
  } catch (e) {
    melde(e);
  } finally {
    laeuft = false;
  }
}

/** Firestore verträgt kein `undefined`. */
function bereinige(rec) {
  return JSON.parse(JSON.stringify(rec, (k, v) => (v === undefined ? null : v)));
}

export function stoppe() {
  clearTimeout(pushTimer);
  unsubscribe?.();
  unsubscribe = null;
  abmelden?.();
  abmelden = null;
  fb = null;
}

export function jetztAbgleichen() {
  planePush(0);
}
