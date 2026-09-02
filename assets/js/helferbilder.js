/**
 * Helfer:in-Bilder: Ableitung aus den dokumentierten Suchen.
 *
 * Wird bei einer Versteckperson ein Helfer:in-Bild gewaehlt, ist dieses Bild
 * damit belegt trainiert. Die Uebersicht rechnet das je Hund zusammen, statt
 * dass es jemand zusaetzlich von Hand abhaken muss.
 *
 * Bewusst nur Stufe 1 automatisch: Dass ein Bild vorkam, steht im Protokoll –
 * ob die Anzeige kurz, laenger oder gemeistert war, ist eine Einschaetzung und
 * bleibt Handarbeit. Die App erfindet keine Bewertung.
 */

import * as store from './store.js';
import { HELFER_BILDER, istAbgeschlossen } from './schema.js';

/** Stufe, die sich allein aus dem Einsatz in einer Suche ergibt. */
export const STUFE_AUS_SUCHE = 1;

/**
 * @returns {Object} bildId -> { anzahl, gefunden, nichtGefunden, ersteAm, letzteAm, orte:Set }
 */
export function einsaetze(hundId) {
  const map = {};
  const suchen = store
    .suchen()
    .filter((s) => istAbgeschlossen(s) && (!hundId || s.hundId === hundId))
    .sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));

  for (const s of suchen) {
    for (const h of s.helfer || []) {
      if (!h.bildId) continue;
      const e = (map[h.bildId] = map[h.bildId] || {
        anzahl: 0, gefunden: 0, nichtGefunden: 0, ersteAm: null, letzteAm: null, orte: new Set(),
      });
      e.anzahl++;
      if (h.gefunden === true) e.gefunden++;
      else if (h.gefunden === false) e.nichtGefunden++;
      e.ersteAm = e.ersteAm || s.datum;
      e.letzteAm = s.datum;
      if (s.ort) e.orte.add(s.ort);
    }
  }
  return map;
}

/**
 * Zusammenfuehrung von Hand gesetzter Stufe und dem, was aus den Suchen folgt.
 * @returns {Object} bildId -> { stufe, ausSuche, vonHand, einsatz }
 */
export function stand(hundId) {
  const eins = einsaetze(hundId);
  const handisch = store.bildFortschritt(hundId);
  const out = {};
  for (const b of HELFER_BILDER) {
    const vonHand = handisch[b.id]?.level || 0;
    const ausSuche = eins[b.id] ? STUFE_AUS_SUCHE : 0;
    out[b.id] = {
      stufe: Math.max(vonHand, ausSuche),
      vonHand,
      ausSuche,
      einsatz: eins[b.id] || null,
    };
  }
  return out;
}

/** Kennzahlen fuer Uebersicht und Dashboard. */
export function bilanz(hundId) {
  const s = stand(hundId);
  const stufen = [0, 0, 0, 0, 0];
  let ausSuchen = 0;
  let nieEingesetzt = [];
  let wichtigOffen = [];

  for (const b of HELFER_BILDER) {
    const e = s[b.id];
    stufen[e.stufe]++;
    if (e.einsatz) ausSuchen++;
    else {
      nieEingesetzt.push(b);
      if (b.key) wichtigOffen.push(b);
    }
  }
  return {
    stand: s,
    stufen,
    gesamt: HELFER_BILDER.length,
    ausSuchen,
    nieEingesetzt,
    wichtigOffen,
    gemeistert: stufen[4],
    begonnen: HELFER_BILDER.length - stufen[0],
  };
}
