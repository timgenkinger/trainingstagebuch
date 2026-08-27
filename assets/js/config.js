/**
 * Zentrale Konfiguration.
 *
 * Damit ALLE im Team automatisch dieselben Daten sehen, gehört die
 * Firebase-Konfiguration hier ins Repository (die Web-Config ist kein Geheimnis –
 * der Schutz kommt aus den Firestore-Regeln, siehe README.md).
 *
 * Alternativ kann jede:r die Konfiguration lokal unter "Einstellungen"
 * eintragen; die lokale Eingabe hat Vorrang vor diesem Standard.
 */
export const STANDARD_CONFIG = {
  firebase: null, // <- hier die Firebase-Web-Config einsetzen, siehe README.md
  collection: 'trainingstagebuch',
};

const LS_KEY = 'rhd.config';

export function ladeConfig() {
  let lokal = null;
  try {
    lokal = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  } catch {
    lokal = null;
  }
  const cfg = { ...STANDARD_CONFIG, ...(lokal || {}) };
  if (!cfg.collection) cfg.collection = STANDARD_CONFIG.collection;
  return cfg;
}

export function speichereConfig(cfg) {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
}

export function loescheLokaleConfig() {
  localStorage.removeItem(LS_KEY);
}

export function syncAktiv() {
  const c = ladeConfig();
  return !!(c.firebase && c.firebase.projectId && c.firebase.apiKey);
}

/** Geräte-Kennung, damit im Team sichtbar ist, wer zuletzt gespeichert hat. */
export function geraeteName() {
  let n = localStorage.getItem('rhd.geraet');
  if (!n) {
    n = 'Gerät-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    localStorage.setItem('rhd.geraet', n);
  }
  return n;
}

export function setzeGeraeteName(n) {
  localStorage.setItem('rhd.geraet', n.trim() || 'Unbenannt');
}
