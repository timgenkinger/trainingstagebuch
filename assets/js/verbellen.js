/**
 * Verbellen: Ableitung des Fortschrittskatalogs aus den Sitzungsprotokollen.
 *
 * Eingegeben wird ausschliesslich in Sitzungen (type 'verbellen'). Der
 * Fortschritt eines Hundes ist daraus abgeleitet – es gibt also nur eine
 * Wahrheit, und zwei Staende koennen nicht auseinanderlaufen.
 *
 * Zaehlweise wie in der Vorlage: Jede Unteruebung braucht drei erfolgreiche
 * Wiederholungen. Eine Sitzung haelt fest, wie viele davon an diesem Tag
 * gelungen sind (0–3); der Katalog summiert ueber alle abgeschlossenen
 * Sitzungen und deckelt bei drei.
 */

import { VERBELLEN_PLAN, planUmfang } from './verbellen-plan.js';
import * as store from './store.js';
import { istAbgeschlossen } from './schema.js';

export const NOETIGE_WIEDERHOLUNGEN = 3;

export function stufe(weg, n) {
  return VERBELLEN_PLAN[weg]?.find((st) => st.n === Number(n)) || null;
}

/**
 * Summiert die Haken aller abgeschlossenen Sitzungen eines Hundes.
 * @param {string} hundId
 * @param {{ohneId?: string}} opts  ohneId blendet eine Sitzung aus – so sieht
 *        die gerade bearbeitete Sitzung den Stand *vor* ihren eigenen Eintragungen.
 * @returns {{stand: Object, letzteAm: Object, zusatz: Object, sitzungen: number}}
 *   stand['box:3:0'] = Anzahl gelungener Wiederholungen (0..3)
 *   letzteAm[...]    = Datum, an dem die dritte Wiederholung gelang
 */
export function katalog(hundId, opts = {}) {
  const stand = {};
  const letzteAm = {};
  const sitzungen = store
    .alle('verbellen')
    .filter((s) => s.hundId === hundId && istAbgeschlossen(s) && s.id !== opts.ohneId)
    .sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));

  const zusatz = {}; // 'weg:stufe' -> { text -> {anzahl, letzteAm} }

  for (const s of sitzungen) {
    for (const e of s.einheiten || []) {
      // Selbst ergaenzte Uebungen zaehlen nicht zum Planumfang, werden aber
      // je Stufe gesammelt, damit die geleistete Arbeit sichtbar bleibt.
      for (const z of e.zusatz || []) {
        const t = (z.text || '').trim();
        if (!t || !(z.haken > 0)) continue;
        const k = `${e.weg}:${e.stufeN}`;
        zusatz[k] = zusatz[k] || {};
        const bisher = zusatz[k][t] || { anzahl: 0, letzteAm: null };
        bisher.anzahl = Math.min(NOETIGE_WIEDERHOLUNGEN, bisher.anzahl + Number(z.haken));
        bisher.letzteAm = s.datum;
        zusatz[k][t] = bisher;
      }
      for (const [idx, anzahl] of Object.entries(e.haken || {})) {
        if (!(anzahl > 0)) continue;
        const key = `${e.weg}:${e.stufeN}:${idx}`;
        const vorher = stand[key] || 0;
        stand[key] = Math.min(NOETIGE_WIEDERHOLUNGEN, vorher + Number(anzahl));
        if (vorher < NOETIGE_WIEDERHOLUNGEN && stand[key] >= NOETIGE_WIEDERHOLUNGEN) {
          letzteAm[key] = s.datum;
        }
      }
    }
  }
  return { stand, letzteAm, zusatz, sitzungen: sitzungen.length };
}

export function uebungFertig(stand, weg, n, idx) {
  return (stand[`${weg}:${n}:${idx}`] || 0) >= NOETIGE_WIEDERHOLUNGEN;
}

export function stufeFertig(stand, weg, n) {
  const st = stufe(weg, n);
  if (!st || !st.items.length) return false;
  return st.items.every((_, i) => uebungFertig(stand, weg, n, i));
}

export function stufeFortschritt(stand, weg, n) {
  const st = stufe(weg, n);
  if (!st) return { fertig: 0, gesamt: 0, wiederholungen: 0, moeglich: 0 };
  let fertig = 0;
  let wiederholungen = 0;
  st.items.forEach((_, i) => {
    const w = stand[`${weg}:${n}:${i}`] || 0;
    wiederholungen += w;
    if (w >= NOETIGE_WIEDERHOLUNGEN) fertig++;
  });
  return {
    fertig,
    gesamt: st.items.length,
    wiederholungen,
    moeglich: st.items.length * NOETIGE_WIEDERHOLUNGEN,
  };
}

/**
 * Ist eine Mensch-Stufe freigeschaltet? Wie in der Vorlage: Die im Plan
 * hinterlegten Box-Stufen muessen abgeschlossen sein – ausser der Box-Weg
 * wurde fuer diesen Hund bewusst uebersprungen.
 */
export function freigeschaltet(stand, weg, n, hund) {
  if (weg !== 'mensch') return true;
  if (hund?.boxUebersprungen) return true;
  const st = stufe('mensch', n);
  if (!st?.req) return true;
  if (st.req === 'all') return VERBELLEN_PLAN.box.every((b) => stufeFertig(stand, 'box', b.n));
  const [von, bis] = st.req;
  for (let i = von; i <= bis; i++) if (!stufeFertig(stand, 'box', i)) return false;
  return true;
}

/** Erste noch nicht abgeschlossene, freigeschaltete Stufe – "woran gerade gearbeitet wird". */
export function aktuelleStufe(stand, hund) {
  for (const weg of hund?.boxUebersprungen ? ['mensch'] : ['box', 'mensch']) {
    for (const st of VERBELLEN_PLAN[weg]) {
      if (!stufeFertig(stand, weg, st.n) && freigeschaltet(stand, weg, st.n, hund)) {
        return { weg, n: st.n, titel: st.title, ...stufeFortschritt(stand, weg, st.n) };
      }
    }
  }
  return null;
}

/** Gesamtfortschritt eines Hundes. */
export function fortschritt(stand, hund) {
  const umfang = planUmfang();
  const zaehle = (weg) => {
    let fertig = 0;
    VERBELLEN_PLAN[weg].forEach((st) => st.items.forEach((_, i) => {
      if (uebungFertig(stand, weg, st.n, i)) fertig++;
    }));
    return fertig;
  };
  const box = { fertig: zaehle('box'), gesamt: umfang.box };
  const mensch = { fertig: zaehle('mensch'), gesamt: umfang.mensch };
  const relevant = hund?.boxUebersprungen ? mensch.gesamt : umfang.gesamt;
  const fertigGesamt = hund?.boxUebersprungen ? mensch.fertig : box.fertig + mensch.fertig;
  return {
    box,
    mensch,
    fertig: fertigGesamt,
    gesamt: relevant,
    anteil: relevant ? fertigGesamt / relevant : 0,
    stufenFertig: {
      box: VERBELLEN_PLAN.box.filter((st) => stufeFertig(stand, 'box', st.n)).length,
      mensch: VERBELLEN_PLAN.mensch.filter((st) => stufeFertig(stand, 'mensch', st.n)).length,
    },
  };
}
