/**
 * Zentrale Konfiguration.
 *
 * Zwei Abgleich-Verfahren stehen zur Wahl:
 *   'github'   – Datei in einem GitHub-Repository (kein Google-Konto nötig)
 *   'firebase' – Cloud Firestore (Echtzeit, für größere Gruppen)
 *
 * Was hier im Repository stehen darf, und was nicht:
 *   ERLAUBT  : Adresse des Datenspeichers (owner/repo/branch/pfad, Firebase-Web-Config)
 *   VERBOTEN : der GitHub-Token. Der ist ein Zugangsschlüssel und liegt
 *              ausschließlich lokal im Browser jedes Geräts.
 */
export const STANDARD_CONFIG = {
  backend: 'aus', // 'aus' | 'github' | 'firebase'

  github: {
    owner: '',
    repo: '',
    branch: 'daten',
    pfad: 'trainingsdaten.json',
    // token: NIEMALS hier eintragen – wird pro Gerät unter Einstellungen gesetzt
  },

  firebase: null,
  collection: 'trainingstagebuch',

  /** Abstand der Abfragen beim GitHub-Abgleich in Sekunden. */
  intervall: 45,
};

const LS_KEY = 'rhd.config';
const LS_TOKEN = 'rhd.token';

export function ladeConfig() {
  let lokal = null;
  try {
    lokal = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  } catch {
    lokal = null;
  }
  const cfg = {
    ...STANDARD_CONFIG,
    ...(lokal || {}),
    github: { ...STANDARD_CONFIG.github, ...(lokal?.github || {}) },
  };
  if (!cfg.collection) cfg.collection = STANDARD_CONFIG.collection;
  if (!cfg.intervall) cfg.intervall = STANDARD_CONFIG.intervall;
  // Der Token wird getrennt gehalten, damit er nie in einen Export gerät.
  cfg.github.token = ladeToken();
  return cfg;
}

/** Speichert die Konfiguration – ohne Token. */
export function speichereConfig(cfg) {
  const ohneToken = {
    ...cfg,
    github: { ...cfg.github },
  };
  delete ohneToken.github.token;
  localStorage.setItem(LS_KEY, JSON.stringify(ohneToken));
}

export function ladeToken() {
  return localStorage.getItem(LS_TOKEN) || '';
}

export function speichereToken(t) {
  if (t) localStorage.setItem(LS_TOKEN, t.trim());
  else localStorage.removeItem(LS_TOKEN);
}

export function loescheLokaleConfig() {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_TOKEN);
}

export function syncAktiv() {
  const c = ladeConfig();
  if (c.backend === 'github') return !!(c.github.owner && c.github.repo && c.github.token);
  if (c.backend === 'firebase') return !!(c.firebase?.apiKey && c.firebase?.projectId);
  return false;
}

/** Der Teil der Konfiguration, den das Team gemeinsam nutzen kann (ohne Geheimnis). */
export function teamConfig() {
  const c = ladeConfig();
  const t = { backend: c.backend, intervall: c.intervall };
  if (c.backend === 'github') {
    t.github = { owner: c.github.owner, repo: c.github.repo, branch: c.github.branch, pfad: c.github.pfad };
  } else if (c.backend === 'firebase') {
    t.firebase = c.firebase;
    t.collection = c.collection;
  }
  return t;
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
