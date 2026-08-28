/**
 * Steuerung des Online-Abgleichs.
 *
 * Wählt anhand der Konfiguration das Verfahren:
 *   'github'   – JSON-Datei in einem GitHub-Repository (Abfrage im Intervall)
 *   'firebase' – Cloud Firestore (Echtzeit)
 *
 * Unabhängig vom Verfahren gilt: Hochgeladen wird nur, was freigegeben ist.
 * Entwürfe einer Suche bleiben auf dem Gerät (siehe store.js).
 */

import { ladeConfig } from '../config.js';
import * as store from '../store.js';

export const status = {
  zustand: 'aus', // aus | kein-token | verbinde | aktiv | offline | fehler
  text: 'Kein Online-Abgleich eingerichtet',
  verfahren: 'aus',
  offen: 0,
  zurueckgehalten: 0,
  letzterAbgleich: null,
  protokoll: [],
};

const listeners = new Set();
export function onStatus(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

export function setzeStatus(zustand, text) {
  status.zustand = zustand;
  if (text !== undefined) status.text = text;
  status.offen = store.anzahlOffen();
  status.zurueckgehalten = store.anzahlZurueckgehalten();
  listeners.forEach((fn) => fn(status));
}

/** Kurzes Protokoll der letzten Vorgänge – hilft bei der Fehlersuche im Gelände. */
export function notiere(art, text) {
  status.protokoll.unshift({ zeit: Date.now(), art, text });
  status.protokoll = status.protokoll.slice(0, 30);
}

let adapter = null;
let abmelden = null;
let pushTimer = null;
let pollTimer = null;
let laeuft = false;

export async function starte() {
  await stoppe();
  const cfg = ladeConfig();
  status.verfahren = cfg.backend;

  if (cfg.backend === 'github') {
    if (!cfg.github.owner || !cfg.github.repo) {
      setzeStatus('aus', 'Kein Datenspeicher hinterlegt');
      return false;
    }
    if (!cfg.github.token) {
      // Adresse steht, nur der persönliche Zugang fehlt noch.
      setzeStatus('kein-token', 'Zugangs-Token fehlt – unter Einstellungen eintragen');
      return false;
    }
    adapter = await import('./github.js');
    return starteGithub(cfg);
  }

  if (cfg.backend === 'firebase') {
    if (!cfg.firebase?.apiKey || !cfg.firebase?.projectId) {
      setzeStatus('aus', 'Firebase-Abgleich unvollständig eingerichtet');
      return false;
    }
    const fs = await import('./firestore.js');
    adapter = fs;
    return fs.starte(cfg, { setzeStatus, notiere });
  }

  setzeStatus('aus', 'Kein Online-Abgleich eingerichtet');
  return false;
}

/* ---------------------------------------------------------------- */
/* GitHub-Verfahren                                                  */
/* ---------------------------------------------------------------- */

async function starteGithub(cfg) {
  setzeStatus('verbinde', 'Verbinde mit GitHub …');
  try {
    const { angelegt } = await adapter.stelleBranchSicher(cfg.github);
    if (angelegt) notiere('info', `Datenbranch "${cfg.github.branch}" angelegt`);

    await hole(cfg, true);
    abmelden = store.subscribe(() => planePush(cfg));
    window.addEventListener('online', () => planePush(cfg, 0));
    window.addEventListener('offline', () => setzeStatus('offline', 'Offline – Änderungen werden gepuffert'));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') hole(cfg).catch(() => {});
    });

    clearInterval(pollTimer);
    pollTimer = setInterval(() => hole(cfg).catch(() => {}), Math.max(15, cfg.intervall) * 1000);
    planePush(cfg, 500);
    return true;
  } catch (e) {
    melde(e);
    return false;
  }
}

/** Fernstand abholen und einmischen. */
async function hole(cfg, ersteAbfrage = false) {
  if (!navigator.onLine) {
    setzeStatus('offline', 'Offline – Änderungen werden gepuffert');
    return;
  }
  try {
    const { records, unveraendert } = await adapter.lese(cfg.github);
    if (!unveraendert) {
      const n = await store.uebernehmeExtern(records);
      if (n) notiere('empfangen', `${n} Änderung(en) empfangen`);
    }
    status.letzterAbgleich = Date.now();
    await store.setzeLetzterAbgleich(status.letzterAbgleich);
    if (ersteAbfrage) notiere('info', `Verbunden mit ${cfg.github.owner}/${cfg.github.repo}`);
    zeigeRuhe();
  } catch (e) {
    melde(e);
  }
}

function planePush(cfg, verzoegerung = 2500) {
  clearTimeout(pushTimer);
  status.offen = store.anzahlOffen();
  status.zurueckgehalten = store.anzahlZurueckgehalten();
  listeners.forEach((fn) => fn(status));
  pushTimer = setTimeout(() => push(cfg), verzoegerung);
}

async function push(cfg) {
  if (!adapter || laeuft) return;
  const offen = store.offeneUploads();
  if (!offen.length) return zeigeRuhe();
  if (!navigator.onLine) return setzeStatus('offline', `Offline – ${offen.length} Änderung(en) gepuffert`);

  laeuft = true;
  setzeStatus('aktiv', `Sende ${offen.length} Änderung(en) …`);
  try {
    const stand = offen.map((r) => ({ id: r.id, updatedAt: r.updatedAt }));
    const { fern, geschrieben } = await adapter.schreibe(cfg.github, store.freigegebeneRecords());
    // Was der Fernstand Neues hatte, kommt gleich mit in die lokale Ablage.
    await store.uebernehmeExtern(fern);
    await store.markiereHochgeladen(stand, Date.now());
    status.letzterAbgleich = Date.now();
    if (geschrieben) notiere('gesendet', `${offen.length} Änderung(en) gesendet`);
    zeigeRuhe();
  } catch (e) {
    melde(e);
  } finally {
    laeuft = false;
  }
}

function zeigeRuhe() {
  const z = store.anzahlZurueckgehalten();
  setzeStatus('aktiv', z ? `Aktuell – ${z} Entwurf/Entwürfe bleiben lokal` : 'Aktuell');
}

function melde(e) {
  const t = fehlerText(e);
  notiere('fehler', t);
  setzeStatus('fehler', t);
  console.error('Abgleich fehlgeschlagen', e);
}

function fehlerText(e) {
  if (e?.status === 401) return 'Token abgelehnt – unter Einstellungen erneuern';
  if (e?.status === 403) return 'Zugriff verweigert – Token braucht Schreibrecht';
  if (e?.status === 404) return 'Repository oder Branch nicht gefunden';
  if (e?.status === 409) return 'Gleichzeitige Änderung – nächster Versuch läuft';
  if (e?.status === 422) return 'GitHub lehnt den Schreibvorgang ab';
  if (e?.code?.includes?.('permission-denied')) return 'Zugriff verweigert – Firestore-Regeln prüfen';
  if (e?.message?.includes('Failed to fetch')) return 'Keine Verbindung';
  return e?.message ? String(e.message).slice(0, 100) : 'Unbekannter Fehler';
}

/* ---------------------------------------------------------------- */

export async function stoppe() {
  clearTimeout(pushTimer);
  clearInterval(pollTimer);
  abmelden?.();
  abmelden = null;
  adapter?.stoppe?.();
  adapter = null;
}

export async function neustart() {
  return starte();
}

export function jetztAbgleichen() {
  const cfg = ladeConfig();
  if (cfg.backend === 'github' && adapter) {
    hole(cfg).then(() => planePush(cfg, 0));
  } else if (cfg.backend === 'firebase' && adapter) {
    adapter.jetztAbgleichen?.();
  }
}

/** Für den Einrichtungs-Assistenten. */
export async function pruefeGithub(githubCfg) {
  const gh = await import('./github.js');
  return gh.pruefe(githubCfg);
}
