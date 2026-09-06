/**
 * Fotos zu einer Einheit.
 *
 * WARUM EIGENE DATEIEN: Der Abgleich schreibt alle Datensätze als EINE
 * JSON-Datei. Ein eingebettetes Foto wiegt darin rund 290 kB – schon drei
 * würden die Datei über die 1-MB-Grenze der GitHub-Contents-API heben und
 * damit unlesbar machen; außerdem überträgt jedes Speichern den gesamten
 * Bestand erneut. Fotos liegen deshalb als einzelne Dateien im Daten-
 * Repository, und der Datensatz merkt sich nur die Verweise.
 *
 * Auf dem Gerät liegen sie in einem eigenen IndexedDB-Speicher. Geladen wird
 * ein fremdes Foto erst, wenn es angezeigt werden soll.
 */

import { fotoLesen, fotoSchreiben, fotoLoeschen, fotoKoepfe, fotoIds, metaGet, metaSet } from './idb.js';
import { uid } from './store.js';
import { geraeteName } from './config.js';

/** Längste Kante nach dem Verkleinern. Reicht für Belege, bleibt handlich. */
export const MAX_KANTE = 1600;
export const QUALITAET = 0.72;
export const MAX_BYTES = 4 * 1024 * 1024;

let holer = null;
/** Der Abgleich meldet hier, wie fehlende Fotos nachgeladen werden. */
export function setzeHoler(fn) {
  holer = fn;
}

/* ---------------------------------------------------------------- */
/* Verkleinern                                                       */
/* ---------------------------------------------------------------- */

function ladeBild(datei) {
  return new Promise((auf, ab) => {
    const url = URL.createObjectURL(datei);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      auf(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      ab(new Error('Bild konnte nicht gelesen werden.'));
    };
    img.src = url;
  });
}

/**
 * Verkleinert auf MAX_KANTE und wandelt in JPEG.
 * Aufnahmen vom Handy sind sonst mehrere Megabyte gross.
 */
export async function verkleinern(datei) {
  const img = await ladeBild(datei);
  const faktor = Math.min(1, MAX_KANTE / Math.max(img.width, img.height));
  const b = Math.round(img.width * faktor);
  const h = Math.round(img.height * faktor);
  const c = document.createElement('canvas');
  c.width = b;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, b, h);
  ctx.drawImage(img, 0, 0, b, h);
  return { daten: c.toDataURL('image/jpeg', QUALITAET), breite: b, hoehe: h };
}

/* ---------------------------------------------------------------- */
/* Ablage                                                            */
/* ---------------------------------------------------------------- */

export async function hinzufuegen(dokumentId, datei) {
  if (!datei.type.startsWith('image/')) throw new Error('Das ist kein Bild.');
  if (datei.size > MAX_BYTES) throw new Error('Das Bild ist zu groß (über 4 MB).');
  const { daten, breite, hoehe } = await verkleinern(datei);
  const foto = {
    id: uid(),
    dokumentId,
    daten,
    breite,
    hoehe,
    bytes: Math.round((daten.length - daten.indexOf(',') - 1) * 0.75),
    name: datei.name || 'Foto',
    erstelltAm: new Date().toISOString(),
    von: geraeteName(),
  };
  await fotoSchreiben(foto);
  await merkeOffen(foto.id);
  return { id: foto.id, name: foto.name, bytes: foto.bytes };
}

export async function lade(id) {
  const f = await fotoLesen(id);
  if (f?.daten) return f.daten;
  // Nicht auf diesem Gerät – beim Abgleich nachfragen.
  if (!holer) return null;
  try {
    const daten = await holer(id);
    if (!daten) return null;
    await fotoSchreiben({ id, daten, geholtAm: new Date().toISOString() });
    return daten;
  } catch (e) {
    console.warn('Foto nicht abrufbar', id, e);
    return null;
  }
}

export async function entferne(id) {
  await fotoLoeschen(id);
  const offen = new Set(await metaGet('fotosOffen', []));
  offen.delete(id);
  await metaSet('fotosOffen', [...offen]);
}

export async function koepfe() {
  return fotoKoepfe();
}

export async function vorhandeneIds() {
  return new Set(await fotoIds());
}

/* ---------------------------------------------------------------- */
/* Warteschlange zum Hochladen                                       */
/* ---------------------------------------------------------------- */

async function merkeOffen(id) {
  const offen = new Set(await metaGet('fotosOffen', []));
  offen.add(id);
  await metaSet('fotosOffen', [...offen]);
}

export async function offeneUploads() {
  const ids = await metaGet('fotosOffen', []);
  const out = [];
  for (const id of ids) {
    const f = await fotoLesen(id);
    if (f?.daten) out.push(f);
  }
  return out;
}

export async function anzahlOffen() {
  return (await metaGet('fotosOffen', [])).length;
}

export async function markiereHochgeladen(ids) {
  const offen = new Set(await metaGet('fotosOffen', []));
  ids.forEach((id) => offen.delete(id));
  await metaSet('fotosOffen', [...offen]);
}

/** Speicherbedarf auf diesem Gerät – für die Einstellungen. */
export async function belegung() {
  const alle = await fotoKoepfe();
  return { anzahl: alle.length, bytes: alle.reduce((n, f) => n + (f.bytes || 0), 0) };
}
