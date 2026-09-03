/**
 * Programm-Aktualisierung.
 *
 * Auf dem iPhone ist die zum Home-Bildschirm hinzugefügte App der schwierige
 * Fall: Sie wird beim Verlassen nur schlafen gelegt, nicht beendet. Zeitgeber
 * laufen dann nicht weiter, und das Dokument kommt beim Zurückkehren aus dem
 * Cache. Deshalb hier bewusst mehrere unabhängige Wege:
 *
 *  1. `updateViaCache: 'none'` – ohne das holt der Browser sw.js aus dem
 *     HTTP-Cache (GitHub Pages liefert max-age=600) und bemerkt die neue
 *     Fassung schlicht nicht.
 *  2. Prüfung bei jeder Rückkehr in den Vordergrund statt per Intervall.
 *  3. Sicherheitsnetz: Vergleich der ausgelieferten version.json mit der
 *     eingebauten Version. Das greift auch, wenn der Service Worker klemmt.
 *  4. Übernahme wartet auf die tatsächlichen Zustandswechsel, statt zu raten.
 */

import { APP_VERSION, BUILD } from './version.js';

const PRUEF_ABSTAND = 60 * 1000; // nicht öfter als einmal pro Minute prüfen

let registrierung = null;
let letzteRuefung = 0;
let neueVersionGemeldet = null;
const zuhoerer = new Set();

export const zustand = {
  laufendeVersion: `${APP_VERSION}${BUILD && BUILD !== 'lokal' ? ` (${BUILD})` : ''}`,
  serverVersion: null,
  updateBereit: false,
  wartend: false,
  letzteRuefung: null,
  fehler: null,
};

export function onUpdate(fn) {
  zuhoerer.add(fn);
  fn(zustand);
  return () => zuhoerer.delete(fn);
}
function melde() {
  zuhoerer.forEach((fn) => fn(zustand));
}

/* ---------------------------------------------------------------- */

export async function starte() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') {
    // Ohne Service Worker bleibt das Sicherheitsnetz über version.json.
    pruefe();
    beobachteVordergrund();
    return;
  }
  try {
    // updateViaCache:'none' ist hier der entscheidende Schalter.
    registrierung = await navigator.serviceWorker.register('sw.js', {
      scope: './',
      updateViaCache: 'none',
    });

    registrierung.addEventListener('updatefound', () => {
      const neu = registrierung.installing;
      neu?.addEventListener('statechange', () => {
        if (neu.state === 'installed' && navigator.serviceWorker.controller) {
          zustand.updateBereit = true;
          zustand.wartend = true;
          melde();
        }
      });
    });

    if (registrierung.waiting && navigator.serviceWorker.controller) {
      zustand.updateBereit = true;
      zustand.wartend = true;
      melde();
    }
  } catch (e) {
    zustand.fehler = e?.message || String(e);
    console.warn('Service Worker nicht registriert:', e);
    melde();
  }

  beobachteVordergrund();
  pruefe();
}

/**
 * iOS-Standalone kehrt aus dem Schlaf zurück, ohne dass Zeitgeber gelaufen sind.
 * `pageshow` feuert dabei zusätzlich zum Sichtbarkeitswechsel.
 */
function beobachteVordergrund() {
  const wieder = () => {
    if (document.visibilityState === 'visible') pruefe();
  };
  document.addEventListener('visibilitychange', wieder);
  window.addEventListener('pageshow', wieder);
  window.addEventListener('focus', wieder);
  window.addEventListener('online', wieder);
}

/** Prüft auf eine neue Fassung – über den Service Worker und über version.json. */
export async function pruefe({ erzwingen = false } = {}) {
  const jetzt = Date.now();
  if (!erzwingen && jetzt - letzteRuefung < PRUEF_ABSTAND) return zustand;
  letzteRuefung = jetzt;

  try {
    await registrierung?.update();
    if (registrierung?.waiting && navigator.serviceWorker.controller) {
      zustand.updateBereit = true;
      zustand.wartend = true;
    }
  } catch (e) {
    // Offline ist kein Fehler, den man melden müsste.
    if (navigator.onLine) console.warn('Update-Prüfung fehlgeschlagen:', e);
  }

  // Sicherheitsnetz: Was liegt tatsächlich auf dem Server?
  try {
    const res = await fetch(`version.json?t=${jetzt}`, { cache: 'no-store' });
    if (res.ok) {
      const v = await res.json();
      const server = `${v.version}${v.build && v.build !== 'lokal' ? ` (${v.build})` : ''}`;
      zustand.serverVersion = server;
      if (server !== zustand.laufendeVersion) {
        zustand.updateBereit = true;
        if (neueVersionGemeldet !== server) neueVersionGemeldet = server;
      }
    }
  } catch (e) {
    if (navigator.onLine) console.warn('Versionsabgleich fehlgeschlagen:', e);
  }

  zustand.letzteRuefung = jetzt;
  melde();
  return zustand;
}

function warteAufZustand(worker, ziel, ms = 8000) {
  if (!worker || worker.state === ziel) return Promise.resolve();
  return new Promise((res) => {
    const t = setTimeout(res, ms);
    worker.addEventListener('statechange', function ab() {
      if (worker.state === ziel || worker.state === 'redundant') {
        clearTimeout(t);
        worker.removeEventListener('statechange', ab);
        res();
      }
    });
  });
}

/**
 * Übernimmt eine bereitstehende Fassung und lädt neu.
 *
 * Wichtig: Nach `update()` ist der neue Worker meist noch `installing` –
 * ein sofortiger Blick auf `waiting` geht ins Leere. Deshalb wird auf den
 * Zustandswechsel gewartet und danach auf den Reglerwechsel, statt eine
 * Wartezeit zu raten.
 */
export async function uebernehmenUndNeuLaden() {
  try {
    const reg = registrierung || (await navigator.serviceWorker?.getRegistration());
    if (reg) {
      await reg.update().catch(() => {});
      const neu = reg.installing || reg.waiting;
      if (neu) await warteAufZustand(neu, 'installed');

      if (reg.waiting) {
        const gewechselt = new Promise((res) => {
          navigator.serviceWorker.addEventListener('controllerchange', res, { once: true });
          setTimeout(res, 4000);
        });
        reg.waiting.postMessage({ typ: 'UEBERNEHMEN' });
        await gewechselt;
      }
    }
  } catch (e) {
    console.warn('Übernahme fehlgeschlagen, lade trotzdem neu:', e);
  }
  neuLadenHart();
}

/**
 * Neu laden und dabei den Dokument-Cache umgehen. In der Standalone-App
 * genügt `location.reload()` nicht immer – ein wechselnder Parameter
 * erzwingt einen frischen Abruf, der Hash (die Ansicht) bleibt erhalten.
 */
function neuLadenHart() {
  const u = new URL(location.href);
  u.searchParams.set('akt', Date.now().toString(36));
  location.replace(u.toString());
}

/** Letzte Möglichkeit: Caches verwerfen, Worker abmelden, frisch laden. */
export async function notfallZuruecksetzen() {
  try {
    const namen = await caches.keys();
    await Promise.all(namen.filter((n) => n.startsWith('rhd-app-')).map((n) => caches.delete(n)));
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((regs || []).map((r) => r.unregister()));
  } catch (e) {
    console.warn('Zurücksetzen unvollständig:', e);
  }
  neuLadenHart();
}
