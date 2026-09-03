/**
 * Freie Dokumentation: Grundwerte, Zeichenfeld und Freitext.
 *
 * Für alles, was kein Suchprotokoll ist – Gehorsam, Geräteübungen, Theorie,
 * Beobachtungen. Dieselbe Freigabe-Schranke wie bei einer Suche: erst
 * abschließen, dann geht der Eintrag ins Team.
 */

import * as store from '../store.js';
import { bestaetigungsKarte, bestaetigungKlick } from './bestaetigung.js';
import * as S from '../schema.js';
import * as R from '../rollen.js';
import { esc, feld, textArea, karte, toast, frage, debounce, formatDatum } from '../ui.js';
import { skizzeHtml, skizzeAktivieren } from '../skizze.js';
import { kopfKarte, gelaendeKarte, wetterKarte, statusAbzeichen, abschlussKarte } from './bausteine.js';
import { setPath } from '../ui.js';

let doku = null;
let dirty = false;
let entwurf = null;

const speichereBald = debounce(async () => {
  if (!doku) return;
  await store.put(doku);
  entwurf = null;
  dirty = false;
  statusSetzen('Gespeichert');
}, 700);

function statusSetzen(text) {
  const el = document.querySelector('[data-speicherstatus]');
  if (el) el.textContent = text;
}

export function flushEditor() {
  if (dirty) speichereBald.sofort();
  entwurf = null;
}
export const verlassen = flushEditor;

export async function render(wurzel, params) {
  let rec = params.id ? store.get(params.id) : null;
  if (!rec && params.id && entwurf?.id === params.id) rec = entwurf;

  if (!rec) {
    const letzte = store.freieDokus()[0] || store.suchen()[0];
    entwurf = {
      ...S.neueFreieDoku({
        // Vorauswahl: Hund und Hundeführer:in dieses Geräts,
        // ersatzweise der zuletzt dokumentierte Stand.
        hundId: R.standardHundId() || letzte?.hundId || R.meineHunde()[0]?.id,
        hfId: R.standardHfId() || letzte?.hfId,
      }),
      id: store.uid(),
    };
    location.replace(`#/doku/${entwurf.id}`);
    return;
  }
  if (rec !== entwurf) entwurf = null;
  doku = JSON.parse(JSON.stringify(rec));
  zeichne(wurzel);
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  const box = wurzel.querySelector('.editor');
  binde(box);
  skizzeAktivieren(box, doku.skizze, (d) => {
    doku.skizze = d;
    markiere();
  });
}

function markiere() {
  dirty = true;
  statusSetzen('Speichere …');
  aktualisiereAbschluss();
  speichereBald();
}

/** Abschlussbereich und Abzeichen bei jeder Eingabe nachziehen. */
function aktualisiereAbschluss() {
  const bereich = document.querySelector('[data-abschluss]');
  if (bereich && !bereich.contains(document.activeElement)) bereich.innerHTML = karteFuerAbschluss();
  const abz = document.querySelector('[data-status-abz]');
  if (abz) abz.innerHTML = statusAbzeichen(doku);
}

function karteFuerAbschluss() {
  return abschlussKarte(doku, {
    wasIstEs: 'Dokumentation',
    geteiltText: 'Diese Dokumentation ist abgeschlossen und wird mit dem Team geteilt.',
  });
}

/* ---------------------------------------------------------------- */

function html() {
  return `
  <div class="editor">
    <div class="editor__kopf">
      <div>
        <h1>${esc(doku.titel || 'Freie Dokumentation')} <span data-status-abz>${statusAbzeichen(doku)}</span></h1>
        <p class="editor__meta">
          <span data-speicherstatus>Gespeichert</span> · ${esc(formatDatum(doku.datum, true))}
        </p>
      </div>
      <div class="editor__aktionen">
        <button type="button" class="btn btn--still" data-drucken>Drucken</button>
        <button type="button" class="btn btn--gefahr-still" data-loeschen>Löschen</button>
      </div>
    </div>

    ${kopfKarte(doku, { titel: true })}
    ${gelaendeKarte(doku)}
    ${wetterKarte(doku)}

    ${karte('Skizze', skizzeHtml(doku.skizze), {
      hint: 'Aufbau, Laufwege, Positionen – frei nutzbar, nicht nur für Suchgebiete.',
    })}

    ${karte('Dokumentation', feld('Freitext', textArea('text', doku.text, {
      rows: 14,
      placeholder: 'Was wurde geübt, was ist aufgefallen, was nimmst du mit?',
    })))}

    <div data-bestaetigung>${bestaetigungsKarte(doku)}</div>

    <div data-abschluss>${karteFuerAbschluss()}</div>

    <div class="editor__fuss">
      <a class="btn btn--still" href="#/suchen">Zur Übersicht</a>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- */

const ZAHLFELDER = new Set(['wartezeitAutoMin']);

function binde(wurzel) {
  const wert = (el) => {
    const letzt = el.dataset.pfad.split('.').pop();
    if (ZAHLFELDER.has(letzt)) return el.value === '' ? null : Number(el.value);
    return el.value;
  };

  wurzel.addEventListener('input', (e) => {
    const el = e.target.closest('[data-pfad]');
    if (!el) return;
    setPath(doku, el.dataset.pfad, wert(el));
    if (el.dataset.pfad === 'titel') {
      const h1 = wurzel.querySelector('h1');
      if (h1) h1.firstChild.nodeValue = (doku.titel || 'Freie Dokumentation') + ' ';
    }
    markiere();
  });

  wurzel.addEventListener('change', (e) => {
    const el = e.target.closest('select[data-pfad]');
    if (!el) return;
    setPath(doku, el.dataset.pfad, el.value);
    markiere();
  });

  wurzel.addEventListener('click', async (e) => {
    if (await bestaetigungKlick(e, doku, () => neuZeichnenBestaetigung())) return;

    const chip = e.target.closest('[data-chip]');
    if (chip) {
      const arr = new Set(doku[chip.dataset.chip] || []);
      const an = !arr.has(chip.dataset.id);
      an ? arr.add(chip.dataset.id) : arr.delete(chip.dataset.id);
      doku[chip.dataset.chip] = [...arr];
      chip.classList.toggle('chip--an', an);
      chip.setAttribute('aria-pressed', String(an));
      markiere();
      return;
    }

    if (e.target.closest('[data-abschliessen]')) {
      if (!S.vollstaendigkeit(doku).vollstaendig) {
        toast('Es fehlen noch Angaben – siehe Liste.', 'fehler');
        return;
      }
      doku.status = 'abgeschlossen';
      doku.abgeschlossenAm = new Date().toISOString();
      dirty = true;
      speichereBald.sofort();
      aktualisiereAbschluss();
      toast('Dokumentation abgeschlossen – wird mit dem Team geteilt.');
      return;
    }

    if (e.target.closest('[data-wieder-oeffnen]')) {
      if (await frage('Wieder als Entwurf öffnen? Der Eintrag wird dann erst nach erneutem Abschließen aktualisiert.', { ok: 'Wieder öffnen' })) {
        doku.status = 'entwurf';
        dirty = true;
        speichereBald.sofort();
        aktualisiereAbschluss();
      }
      return;
    }

    if (e.target.closest('[data-drucken]')) {
      window.print();
      return;
    }

    if (e.target.closest('[data-loeschen]')) {
      if (await frage('Diese Dokumentation in den Papierkorb verschieben?', { ok: 'Löschen', gefahr: true })) {
        await store.entferne(doku.id);
        toast('Dokumentation gelöscht – Wiederherstellen unter Einstellungen.');
        location.hash = '#/suchen';
      }
    }
  });
}

/** Nur den Bestätigungsbereich neu zeichnen. */
function neuZeichnenBestaetigung() {
  const b = document.querySelector('[data-bestaetigung]');
  if (b) b.innerHTML = bestaetigungsKarte(doku);
}
