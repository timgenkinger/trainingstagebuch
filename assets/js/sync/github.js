/**
 * Abgleich über ein GitHub-Repository.
 *
 * Verfahren: Alle Datensätze liegen als eine JSON-Datei im Repository.
 * Gelesen wird per Contents-API (mit ETag, damit unveränderte Stände nichts
 * kosten), geschrieben mit dem `sha` des zuletzt gelesenen Standes. Ab 1 MB
 * liefert die Contents-API den Inhalt nicht mehr mit; dann kommt er über die
 * Blob-API, die bis 100 MB reicht (siehe leseBlob()).
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

/**
 * Inhalt einer Datei als Base64 – auch über 1 MB.
 *
 * Bis 1 MB liefert die Contents-API den Inhalt gleich mit. Darüber antwortet sie
 * mit leerem `content` und `"encoding": "none"`; JSON.parse('') scheiterte dann
 * mit "kein gültiges JSON", und der Abgleich stand für alle Geräte still.
 * Die Blob-API reicht bis 100 MB und wird über denselben sha angesprochen –
 * Inhalt und sha passen also garantiert zusammen, auch wenn zwischen beiden
 * Anfragen jemand schreibt.
 */
async function inhaltAlsBase64(cfg, j, schritt) {
  if (j.content) return j.content;
  if (!(j.size > 0) || !j.sha) return '';
  const res = await anfrage(cfg, `/repos/${cfg.owner}/${cfg.repo}/git/blobs/${j.sha}`);
  if (!res.ok) throw new GhFehler(res.status, await fehlerText(res), schritt);
  const blob = await res.json();
  return blob.encoding === 'base64' ? blob.content || '' : nachBase64(blob.content || '');
}

/**
 * Die Datendatei mit einem Datensatz je Zeile.
 *
 * Früher eingerückt (JSON.stringify(…, null, 1)): Die Koordinaten der Skizzen
 * standen dadurch Zahl für Zahl auf eigenen Zeilen, die Datei war mehr als
 * doppelt so groß wie nötig und überschritt im Oktober 2026 die 1-MB-Grenze.
 * So ist sie kompakt, und eine Änderung bleibt im Verlauf des Repositorys
 * trotzdem als eine geänderte Zeile je Datensatz erkennbar.
 */
export function serialisiere(kopf, records) {
  const k = JSON.stringify(kopf).slice(1, -1);
  return `{${k ? k + ',' : ''}"records":[\n${records.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`;
}

/** Liegt die Datei noch im alten, eingerückten Format vor? Dann beginnt sie mit "{" allein auf der ersten Zeile. */
function istAltesFormat(text) {
  return /^\{\r?\n/.test(text);
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
 * @returns {{records: Array, sha: string|null, unveraendert: boolean, formatAlt: boolean}}
 *          formatAlt: Die Datei ist noch eingerückt und sollte kompakt neu geschrieben werden.
 */
export async function lese(cfg, mitEtag = true) {
  const schluessel = `${cfg.owner}/${cfg.repo}/${cfg.branch}/${cfg.pfad}`;
  const kopf = {};
  const bekannt = etags.get(schluessel);
  if (mitEtag && bekannt?.etag) kopf['If-None-Match'] = bekannt.etag;

  const res = await anfrage(cfg, `${dateiPfad(cfg)}?ref=${encodeURIComponent(cfg.branch)}`, { headers: kopf });

  if (res.status === 304) {
    return { records: bekannt.records, sha: bekannt.sha, unveraendert: true, formatAlt: !!bekannt.formatAlt };
  }
  if (res.status === 404) return { records: [], sha: null, unveraendert: false, formatAlt: false };
  if (!res.ok) throw new GhFehler(res.status, await fehlerText(res), 'lesen');

  const j = await res.json();
  const b64 = await inhaltAlsBase64(cfg, j, 'lesen');
  let text = '';
  let daten = { records: [] };
  try {
    text = ausBase64(b64);
    daten = JSON.parse(text);
  } catch (e) {
    throw new GhFehler(0, 'Die Datei im Repository ist kein gültiges JSON.', 'lesen');
  }
  const records = Array.isArray(daten) ? daten : daten.records || [];
  const formatAlt = istAltesFormat(text);
  etags.set(schluessel, { etag: res.headers.get('ETag'), sha: j.sha, records, formatAlt });
  return { records, sha: j.sha, unveraendert: false, formatAlt };
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
  const { records: fern, sha, formatAlt } = await lese(cfg, false);
  const gemischt = mischen(fern, lokal);
  const nurVerdichten = !!sha && gleich(fern, gemischt);

  // Nichts zu tun, wenn der Fernstand bereits alles enthält – es sei denn, die
  // Datei ist noch eingerückt. Dann wird sie auch ohne Änderung kompakt neu
  // geschrieben: Geräte ohne das Update lesen nur bis 1 MB.
  if (nurVerdichten && !formatAlt) return { records: gemischt, fern, geschrieben: false, verdichtet: false };

  const inhalt = serialisiere(
    { app: 'rhd-trainingstagebuch', aktualisiert: new Date().toISOString(), geraet: geraeteName() },
    gemischt
  );

  const res = await anfrage(cfg, dateiPfad(cfg), {
    method: 'PUT',
    body: JSON.stringify({
      message: nurVerdichten
        ? `Trainingsdaten kompakt neu geschrieben (${geraeteName()}, ${gemischt.length} Datensätze)`
        : `Trainingsdaten aktualisiert (${geraeteName()}, ${gemischt.length} Datensätze)`,
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
    formatAlt: false,
  });
  return { records: gemischt, fern, geschrieben: !nurVerdichten, verdichtet: formatAlt };
}

function gleich(a, b) {
  if (a.length !== b.length) return false;
  const m = new Map(a.map((r) => [r.id, r.updatedAt || 0]));
  return b.every((r) => m.get(r.id) === (r.updatedAt || 0));
}

/* ---------------------------------------------------------------- */
/* Fotos                                                             */
/* ---------------------------------------------------------------- */

/** Fotos liegen als einzelne Dateien neben der Datendatei, nicht darin. */
function fotoPfad(cfg, id) {
  const ordner = (cfg.pfad.includes('/') ? cfg.pfad.replace(/\/[^/]*$/, '/') : '') + 'bilder';
  return `/repos/${cfg.owner}/${cfg.repo}/contents/${ordner}/${id}.jpg`;
}

export async function ladeFoto(cfg, id) {
  const res = await anfrage(cfg, `${fotoPfad(cfg, id)}?ref=${encodeURIComponent(cfg.branch)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new GhFehler(res.status, await fehlerText(res), 'foto-lesen');
  const j = await res.json();
  // Fotos bleiben dank Verkleinerung meist weit unter 1 MB – aber nicht garantiert.
  const b64 = await inhaltAlsBase64(cfg, j, 'foto-lesen');
  return 'data:image/jpeg;base64,' + b64.replace(/\s/g, '');
}

export async function schreibeFoto(cfg, id, dataUrl) {
  const nurDaten = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const res = await anfrage(cfg, fotoPfad(cfg, id), {
    method: 'PUT',
    body: JSON.stringify({
      message: `Foto ${id} (${geraeteName()})`,
      content: nurDaten,
      branch: cfg.branch,
    }),
  });
  // 422 heisst hier in aller Regel: liegt schon vor. Fotos werden nie geaendert.
  if (res.ok || res.status === 422) return true;
  throw new GhFehler(res.status, await fehlerText(res), 'foto-schreiben');
}

/* ---------------------------------------------------------------- */
/* Branch anlegen                                                    */
/* ---------------------------------------------------------------- */

/**
 * Stellt sicher, dass der Datenbranch existiert.
 *
 * Zwei Fälle sind zu unterscheiden:
 *  a) Das Repository hat bereits Commits – dann wird ein eigenständiger Branch
 *     ohne Vorgeschichte angelegt, damit dort ausschließlich die Daten liegen.
 *  b) Das Repository ist noch vollständig leer – dann verweigert die Git-Data-API
 *     die Arbeit ("Git Repository is empty", HTTP 409). In diesem Fall wird zuerst
 *     über die Contents-API der Standardbranch mit der Datei angelegt und der
 *     Datenbranch anschließend davon abgezweigt.
 */
export async function stelleBranchSicher(cfg) {
  const vorhanden = await anfrage(cfg, `/repos/${cfg.owner}/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`);
  if (vorhanden.ok) return { angelegt: false };
  if (vorhanden.status !== 404) throw new GhFehler(vorhanden.status, await fehlerText(vorhanden), 'branch');

  const repoRes = await anfrage(cfg, `/repos/${cfg.owner}/${cfg.repo}`);
  if (!repoRes.ok) throw new GhFehler(repoRes.status, await fehlerText(repoRes), 'branch');
  const repo = await repoRes.json();

  const basis = `/repos/${cfg.owner}/${cfg.repo}/git`;
  const leer = serialisiere({ app: 'rhd-trainingstagebuch' }, []);

  // Hat das Repository überhaupt schon einen Commit?
  const kopf = await anfrage(cfg, `${basis}/ref/heads/${encodeURIComponent(repo.default_branch)}`);
  if (!kopf.ok) {
    // Fall b) – leeres Repository über die Contents-API in Gang bringen.
    const erst = await anfrage(cfg, dateiPfad(cfg), {
      method: 'PUT',
      body: JSON.stringify({ message: 'Datenablage für das Trainingstagebuch angelegt', content: nachBase64(leer) }),
    });
    if (!erst.ok) throw new GhFehler(erst.status, await fehlerText(erst), 'branch');
    if (cfg.branch === repo.default_branch) return { angelegt: true };

    const neuerKopf = await anfrage(cfg, `${basis}/ref/heads/${encodeURIComponent(repo.default_branch)}`);
    if (!neuerKopf.ok) throw new GhFehler(neuerKopf.status, await fehlerText(neuerKopf), 'branch');
    const sha = (await neuerKopf.json()).object.sha;
    const ref0 = await anfrage(cfg, `${basis}/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${cfg.branch}`, sha }),
    });
    if (!ref0.ok) throw new GhFehler(ref0.status, await fehlerText(ref0), 'branch');
    return { angelegt: true };
  }

  // Fall a) – eigenständiger Branch ohne Vorgeschichte.
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
    body: JSON.stringify({ message: 'Datenbranch für das Trainingstagebuch angelegt', tree: treeSha, parents: [] }),
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
      if (repo && repo.size === 0) {
        add('Repository-Inhalt', 'warnung', 'Das Repository ist noch leer – die Datenablage wird beim Verbinden eingerichtet.');
      }
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
