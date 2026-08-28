/**
 * Abgleich über ein GitHub-Repository.
 *
 * Verfahren: Alle Datensätze liegen als eine JSON-Datei im Repository.
 * Gelesen wird per Contents-API (mit ETag, damit unveränderte Stände nichts
 * kosten), geschrieben mit dem `sha` des zuletzt gelesenen Standes.
 *
 * Der entscheidende Punkt ist die Behandlung gleichzeitiger Änderungen:
 * Vor JEDEM Schreiben wird der Fernstand frisch gelesen und mit dem lokalen
 * gemischt. Schreibt jemand dazwischen, antwortet GitHub mit 409 – dann
 * wiederholt sich der Ablauf. Dadurch kann keine fremde Änderung verloren
 * gehen, auch wenn zwei Geräte gleichzeitig speichern.
 *
 * Der Token wird nur mitgeschickt, nie protokolliert und nie exportiert.
 */

import { geraeteName } from '../config.js';

const API = 'https://api.github.com';

export class GhFehler extends Error {
  constructor(status, text, schritt) {
    super(text);
    this.status = status;
    this.schritt = schritt;
  }
}

async function anfrage(cfg, pfad, opts = {}) {
  const kopf = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(opts.headers || {}),
  };
  if (cfg.token) kopf.Authorization = `Bearer ${cfg.token}`;
  return fetch(API + pfad, { ...opts, headers: kopf });
}

async function fehlerText(res) {
  try {
    const j = await res.json();
    return j.message || res.statusText;
  } catch {
    return res.statusText;
  }
}

/* ---------------------------------------------------------------- */
/* Kodierung                                                         */
/* ---------------------------------------------------------------- */

function nachBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let s = '';
  // In Blöcken, damit auch große Datenbestände nicht den Aufrufstapel sprengen.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function ausBase64(b64) {
  const roh = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(roh, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/* ---------------------------------------------------------------- */
/* Lesen und Schreiben                                               */
/* ---------------------------------------------------------------- */

const etags = new Map();

function dateiPfad(cfg) {
  return `/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(cfg.pfad).replace(/%2F/g, '/')}`;
}

/**
 * Liest den Fernstand.
 * @returns {{records: Array, sha: string|null, unveraendert: boolean}}
 */
export async function lese(cfg, mitEtag = true) {
  const schluessel = `${cfg.owner}/${cfg.repo}/${cfg.branch}/${cfg.pfad}`;
  const kopf = {};
  const bekannt = etags.get(schluessel);
  if (mitEtag && bekannt?.etag) kopf['If-None-Match'] = bekannt.etag;

  const res = await anfrage(cfg, `${dateiPfad(cfg)}?ref=${encodeURIComponent(cfg.branch)}`, { headers: kopf });

  if (res.status === 304) return { records: bekannt.records, sha: bekannt.sha, unveraendert: true };
  if (res.status === 404) return { records: [], sha: null, unveraendert: false };
  if (!res.ok) throw new GhFehler(res.status, await fehlerText(res), 'lesen');

  const j = await res.json();
  let daten = { records: [] };
  try {
    daten = JSON.parse(ausBase64(j.content || ''));
  } catch (e) {
    throw new GhFehler(0, 'Die Datei im Repository ist kein gültiges JSON.', 'lesen');
  }
  const records = Array.isArray(daten) ? daten : daten.records || [];
  etags.set(schluessel, { etag: res.headers.get('ETag'), sha: j.sha, records });
  return { records, sha: j.sha, unveraendert: false };
}

/** Mischt zwei Datensatzlisten – der jüngere Stand je Datensatz gewinnt. */
export function mischen(a, b) {
  const map = new Map();
  for (const r of a) if (r?.id) map.set(r.id, r);
  for (const r of b) {
    if (!r?.id) continue;
    const vorhanden = map.get(r.id);
    if (!vorhanden || (r.updatedAt || 0) > (vorhanden.updatedAt || 0)) map.set(r.id, r);
  }
  return [...map.values()].sort((x, y) => (x.id < y.id ? -1 : 1));
}

/**
 * Schreibt den lokalen Bestand, nachdem er mit dem Fernstand gemischt wurde.
 * @returns {{records: Array, fernNeu: Array}} fernNeu = was von fern dazukam
 */
export async function schreibe(cfg, lokal, versuch = 0) {
  const { records: fern, sha } = await lese(cfg, false);
  const gemischt = mischen(fern, lokal);

  // Nichts zu tun, wenn der Fernstand bereits alles enthält.
  if (sha && gleich(fern, gemischt)) return { records: gemischt, fern, geschrieben: false };

  const inhalt = JSON.stringify(
    {
      app: 'rhd-trainingstagebuch',
      aktualisiert: new Date().toISOString(),
      geraet: geraeteName(),
      records: gemischt,
    },
    null,
    1
  );

  const res = await anfrage(cfg, dateiPfad(cfg), {
    method: 'PUT',
    body: JSON.stringify({
      message: `Trainingsdaten aktualisiert (${geraeteName()}, ${gemischt.length} Datensätze)`,
      content: nachBase64(inhalt),
      branch: cfg.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if ((res.status === 409 || res.status === 422) && versuch < 4) {
    // Jemand anderes war schneller – frisch lesen, neu mischen, erneut versuchen.
    etags.delete(`${cfg.owner}/${cfg.repo}/${cfg.branch}/${cfg.pfad}`);
    await new Promise((r) => setTimeout(r, 400 * (versuch + 1)));
    return schreibe(cfg, lokal, versuch + 1);
  }
  if (!res.ok) throw new GhFehler(res.status, await fehlerText(res), 'schreiben');

  const j = await res.json();
  etags.set(`${cfg.owner}/${cfg.repo}/${cfg.branch}/${cfg.pfad}`, {
    etag: null,
    sha: j.content?.sha,
    records: gemischt,
  });
  return { records: gemischt, fern, geschrieben: true };
}

function gleich(a, b) {
  if (a.length !== b.length) return false;
  const m = new Map(a.map((r) => [r.id, r.updatedAt || 0]));
  return b.every((r) => m.get(r.id) === (r.updatedAt || 0));
}

/* ---------------------------------------------------------------- */
/* Branch anlegen                                                    */
/* ---------------------------------------------------------------- */

/**
 * Stellt sicher, dass der Datenbranch existiert. Er wird als eigenständiger
 * Branch ohne Vorgeschichte angelegt, damit dort ausschließlich die Daten
 * liegen – getrennt vom Programmcode auf `main`.
 */
export async function stelleBranchSicher(cfg) {
  const vorhanden = await anfrage(cfg, `/repos/${cfg.owner}/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`);
  if (vorhanden.ok) return { angelegt: false };
  if (vorhanden.status !== 404) throw new GhFehler(vorhanden.status, await fehlerText(vorhanden), 'branch');

  const basis = `/repos/${cfg.owner}/${cfg.repo}/git`;
  const leer = JSON.stringify({ app: 'rhd-trainingstagebuch', records: [] }, null, 1);

  const blob = await anfrage(cfg, `${basis}/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content: nachBase64(leer), encoding: 'base64' }),
  });
  if (!blob.ok) throw new GhFehler(blob.status, await fehlerText(blob), 'branch');
  const blobSha = (await blob.json()).sha;

  const tree = await anfrage(cfg, `${basis}/trees`, {
    method: 'POST',
    body: JSON.stringify({ tree: [{ path: cfg.pfad, mode: '100644', type: 'blob', sha: blobSha }] }),
  });
  if (!tree.ok) throw new GhFehler(tree.status, await fehlerText(tree), 'branch');
  const treeSha = (await tree.json()).sha;

  const commit = await anfrage(cfg, `${basis}/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: 'Datenbranch für das Trainingstagebuch angelegt',
      tree: treeSha,
      parents: [],
    }),
  });
  if (!commit.ok) throw new GhFehler(commit.status, await fehlerText(commit), 'branch');
  const commitSha = (await commit.json()).sha;

  const ref = await anfrage(cfg, `${basis}/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${cfg.branch}`, sha: commitSha }),
  });
  if (!ref.ok) throw new GhFehler(ref.status, await fehlerText(ref), 'branch');
  return { angelegt: true };
}

/* ---------------------------------------------------------------- */
/* Diagnose für den Einrichtungs-Assistenten                         */
/* ---------------------------------------------------------------- */

/**
 * Prüft die Konfiguration Schritt für Schritt und benennt Fehler konkret.
 * @returns {Promise<Array<{name, zustand:'ok'|'warnung'|'fehler', text, tipp?}>>}
 */
export async function pruefe(cfg) {
  const schritte = [];
  const add = (name, zustand, text, tipp) => schritte.push({ name, zustand, text, tipp });

  if (!cfg.token) {
    add('Token', 'fehler', 'Kein Token eingetragen.', 'Unter github.com/settings/tokens einen Token erzeugen.');
    return schritte;
  }

  // 1. Token gültig?
  let benutzer = null;
  try {
    const res = await anfrage(cfg, '/user');
    if (res.status === 401) {
      add('Token', 'fehler', 'Der Token wird von GitHub abgelehnt.', 'Abgelaufen oder falsch kopiert? Neu erzeugen.');
      return schritte;
    }
    if (!res.ok) {
      add('Token', 'fehler', `GitHub antwortet mit ${res.status}: ${await fehlerText(res)}`);
      return schritte;
    }
    benutzer = await res.json();
    const rest = res.headers.get('X-RateLimit-Remaining');
    add('Token', 'ok', `Gültig – angemeldet als ${benutzer.login}${rest ? ` (${rest} Abfragen frei)` : ''}.`);
  } catch (e) {
    add('Token', 'fehler', 'Keine Verbindung zu GitHub.', 'Internetverbindung prüfen.');
    return schritte;
  }

  if (!cfg.owner || !cfg.repo) {
    add('Repository', 'fehler', 'Kontoname oder Repository fehlt.');
    return schritte;
  }

  // 2. Repository erreichbar und beschreibbar?
  let repo = null;
  try {
    const res = await anfrage(cfg, `/repos/${cfg.owner}/${cfg.repo}`);
    if (res.status === 404) {
      add(
        'Repository',
        'fehler',
        `${cfg.owner}/${cfg.repo} nicht gefunden.`,
        'Schreibweise prüfen. Bei einem privaten Repository muss der Token Zugriff darauf haben.'
      );
      return schritte;
    }
    if (!res.ok) {
      add('Repository', 'fehler', `GitHub antwortet mit ${res.status}: ${await fehlerText(res)}`);
      return schritte;
    }
    repo = await res.json();
    add('Repository', 'ok', `${repo.full_name} gefunden.`);

    if (repo.permissions?.push) {
      add('Schreibrecht', 'ok', 'Der Token darf in dieses Repository schreiben.');
    } else {
      add(
        'Schreibrecht',
        'fehler',
        'Der Token darf nur lesen.',
        'Beim Token die Berechtigung "Contents: Read and write" für dieses Repository setzen.'
      );
      return schritte;
    }

    if (repo.private) {
      add('Sichtbarkeit', 'ok', 'Repository ist privat – die Trainingsdaten sind nicht öffentlich.');
    } else {
      add(
        'Sichtbarkeit',
        'warnung',
        'Repository ist ÖFFENTLICH – alle Trainingsdaten wären für jeden im Internet lesbar.',
        'Für die Daten besser ein separates privates Repository verwenden.'
      );
    }
  } catch (e) {
    add('Repository', 'fehler', 'Abfrage fehlgeschlagen: ' + e.message);
    return schritte;
  }

  // 3. Branch vorhanden?
  try {
    const res = await anfrage(cfg, `/repos/${cfg.owner}/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`);
    if (res.ok) {
      add('Branch', 'ok', `Branch "${cfg.branch}" vorhanden.`);
    } else if (res.status === 404) {
      add('Branch', 'warnung', `Branch "${cfg.branch}" fehlt noch – wird beim Verbinden angelegt.`);
    } else {
      add('Branch', 'fehler', `GitHub antwortet mit ${res.status}: ${await fehlerText(res)}`);
    }
  } catch (e) {
    add('Branch', 'fehler', 'Abfrage fehlgeschlagen: ' + e.message);
  }

  // 4. Datei lesbar?
  try {
    const { records, sha } = await lese(cfg, false);
    if (sha) add('Datei', 'ok', `${cfg.pfad} gefunden – ${records.length} Datensätze im Team.`);
    else add('Datei', 'warnung', `${cfg.pfad} existiert noch nicht – wird beim ersten Abgleich angelegt.`);
  } catch (e) {
    add('Datei', 'fehler', e.message);
  }

  // 5. Hinweis, wenn Daten auf dem Branch des Programmcodes liegen sollen
  if (repo && cfg.branch === repo.default_branch) {
    add(
      'Branch-Wahl',
      'warnung',
      `"${cfg.branch}" ist der Hauptbranch. Jedes Speichern löst dort einen Pages-Deploy aus.`,
      'Besser einen eigenen Branch wie "daten" verwenden.'
    );
  }

  return schritte;
}
