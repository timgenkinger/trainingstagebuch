/**
 * Verbellen-Sitzung erfassen.
 *
 * Eingegeben wird hier – der Fortschrittskatalog leitet sich daraus ab.
 * Je Unterübung wird festgehalten, wie viele der drei nötigen Wiederholungen
 * an diesem Tag gelungen sind. Bereits erreichte Wiederholungen aus früheren
 * Sitzungen werden zur Orientierung eingeblendet.
 */

import * as store from '../store.js';
import * as S from '../schema.js';
import * as V from '../verbellen.js';
import { VERBELLEN_PLAN, WEGE } from '../verbellen-plan.js';
import { esc, feld, textArea, textInput, select, karte, toast, frage, debounce, formatDatum, setPath } from '../ui.js';
import { kopfKarte, statusAbzeichen, abschlussKarte } from './bausteine.js';

let sitzung = null;
let dirty = false;
let entwurf = null;
let katalogVorher = { stand: {}, letzteAm: {} };

const speichereBald = debounce(async () => {
  if (!sitzung) return;
  await store.put(sitzung);
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
    const letzte = store.verbellenSitzungen()[0] || store.suchen()[0];
    entwurf = {
      ...S.neueVerbellenSitzung({
        hundId: letzte?.hundId || store.hunde()[0]?.id,
        hfId: letzte?.hfId || store.personen()[0]?.id,
      }),
      id: store.uid(),
    };
    location.replace(`#/verbellen-sitzung/${entwurf.id}`);
    return;
  }
  if (rec !== entwurf) entwurf = null;
  sitzung = JSON.parse(JSON.stringify(rec));
  ladeKatalogOhneDieseSitzung();
  zeichne(wurzel);
}

/** Stand aus allen anderen Sitzungen – zeigt, was vor dieser Sitzung schon stand. */
function ladeKatalogOhneDieseSitzung() {
  katalogVorher = V.katalog(sitzung.hundId, { ohneId: sitzung.id });
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  binde(wurzel.querySelector('.editor'));
}

function markiere({ neuZeichnen = false } = {}) {
  dirty = true;
  statusSetzen('Speichere …');
  if (neuZeichnen) {
    const y = window.scrollY;
    zeichne(document.getElementById('view'));
    window.scrollTo(0, y);
  } else {
    aktualisiereAbschluss();
  }
  speichereBald();
}

function aktualisiereAbschluss() {
  const bereich = document.querySelector('[data-abschluss]');
  if (bereich && !bereich.contains(document.activeElement)) bereich.innerHTML = karteFuerAbschluss();
  const abz = document.querySelector('[data-status-abz]');
  if (abz) abz.innerHTML = statusAbzeichen(sitzung);
}

function karteFuerAbschluss() {
  return abschlussKarte(sitzung, {
    wasIstEs: 'Sitzung',
    geteiltText: 'Diese Verbellen-Sitzung ist abgeschlossen und zählt im Fortschrittskatalog.',
  });
}

/* ---------------------------------------------------------------- */

function html() {
  const hund = store.get(sitzung.hundId);
  return `
  <div class="editor">
    <div class="editor__kopf">
      <div>
        <h1>Verbellen <span data-status-abz>${statusAbzeichen(sitzung)}</span></h1>
        <p class="editor__meta">
          <span data-speicherstatus>Gespeichert</span> · ${esc(formatDatum(sitzung.datum, true))}
          ${hund ? ` · ${esc(hund.name)}` : ''}
        </p>
      </div>
      <div class="editor__aktionen">
        <a class="btn btn--still" href="#/verbellen">Fortschritt</a>
        <button type="button" class="btn btn--still" data-drucken>Drucken</button>
        <button type="button" class="btn btn--gefahr-still" data-loeschen>Löschen</button>
      </div>
    </div>

    ${kopfKarte(sitzung)}

    ${karte('Bearbeitete Stufen', einheitenHtml(), {
      hint: 'Pro Unterübung eintragen, wie viele der drei nötigen Wiederholungen heute gelungen sind. Der Fortschritt wird daraus fortgeschrieben.',
      aktion: `<button type="button" class="btn btn--mini" data-stufe-hinzu>+ Stufe</button>`,
    })}

    ${karte('Notizen zur Sitzung', textArea('notizen', sitzung.notizen, {
      rows: 5, placeholder: 'Was lief gut, wo hakt es, was nimmst du dir vor?',
    }))}

    <div data-abschluss>${karteFuerAbschluss()}</div>

    <div class="editor__fuss">
      <a class="btn btn--still" href="#/suchen">Zur Übersicht</a>
    </div>
  </div>`;
}

function einheitenHtml() {
  if (!sitzung.einheiten.length) {
    return `<p class="leer leer--schlank">Noch keine Stufe gewählt. Mit „+ Stufe" die heute bearbeitete Stufe hinzufügen.</p>`;
  }
  const hund = store.get(sitzung.hundId);
  return sitzung.einheiten.map((e, i) => einheitHtml(e, i, hund)).join('');
}

function einheitHtml(e, i, hund) {
  const st = V.stufe(e.weg, e.stufeN);
  if (!st) return '';
  const wegLabel = WEGE.find((w) => w.id === e.weg)?.label || e.weg;
  const frei = V.freigeschaltet(katalogVorher.stand, e.weg, e.stufeN, hund);
  const fort = V.stufeFortschritt(katalogVorher.stand, e.weg, e.stufeN);

  return `<div class="einheit">
    <div class="einheit__kopf">
      <div>
        <span class="abz abz--art">${esc(wegLabel)} · Stufe ${st.n}</span>
        <strong>${esc(st.title)}</strong>
        <small>${fort.fertig} von ${fort.gesamt} Unterübungen stehen bereits${frei ? '' : ' · <em class="gesperrt">Voraussetzungen aus dem Box-Weg fehlen noch</em>'}</small>
      </div>
      <button type="button" class="btn btn--mini btn--gefahr-still" data-einheit-weg="${i}">×</button>
    </div>

    <div class="uebungen">
      ${st.items.map((text, idx) => uebungHtml(e, i, idx, text)).join('')}
      ${(e.zusatz || []).map((z, zi) => zusatzHtml(i, zi, z)).join('')}
    </div>
    <button type="button" class="btn btn--mini" data-zusatz-plus="${i}">+ eigene Übung</button>

    ${feld('Bemerkung zur Stufe', textInput(`einheiten.${i}.bemerkung`, e.bemerkung, {
      placeholder: 'z.B. Ablenkung war zu hoch, nächstes Mal näher',
    }))}
  </div>`;
}

function uebungHtml(e, i, idx, text) {
  const heute = Number(e.haken?.[idx] || 0);
  const vorher = katalogVorher.stand[`${e.weg}:${e.stufeN}:${idx}`] || 0;
  const gesamt = Math.min(V.NOETIGE_WIEDERHOLUNGEN, vorher + heute);
  const fertig = gesamt >= V.NOETIGE_WIEDERHOLUNGEN;

  const punkte = [1, 2, 3]
    .map((n) => {
      const ausVorher = n <= vorher;
      const ausHeute = !ausVorher && n <= vorher + heute;
      return `<button type="button"
        class="wdh${ausVorher ? ' wdh--frueher' : ''}${ausHeute ? ' wdh--heute' : ''}"
        data-wdh="${i}.${idx}" data-n="${n - vorher}"
        ${ausVorher ? 'disabled title="in einer früheren Sitzung erreicht"' : `title="${n - vorher} heute gelungen"`}
        aria-label="Wiederholung ${n}"></button>`;
    })
    .join('');

  return `<div class="uebung${fertig ? ' uebung--fertig' : ''}">
    <span class="uebung__text">${esc(text)}</span>
    <span class="uebung__wdh">${punkte}</span>
  </div>`;
}

/** Selbst ergänzte Übung – zählt nicht zum Planumfang, wird aber mitgeführt. */
function zusatzHtml(i, zi, z) {
  const heute = Number(z.haken || 0);
  const punkte = [1, 2, 3]
    .map(
      (n) => `<button type="button" class="wdh${n <= heute ? ' wdh--heute' : ''}"
        data-zusatz-wdh="${i}.${zi}" data-n="${n}" aria-label="Wiederholung ${n}"></button>`
    )
    .join('');
  return `<div class="uebung uebung--zusatz${heute >= 3 ? ' uebung--fertig' : ''}">
    <span class="uebung__text">
      <input class="input input--schlank" data-zusatz-text="${i}.${zi}" value="${esc(z.text || '')}"
        placeholder="eigene Übung beschreiben">
    </span>
    <span class="uebung__wdh">${punkte}
      <button type="button" class="btn btn--mini btn--gefahr-still" data-zusatz-weg="${i}.${zi}">×</button>
    </span>
  </div>`;
}

/* ---------------------------------------------------------------- */

const ZAHLFELDER = new Set(['wartezeitAutoMin']);

function binde(wurzel) {
  wurzel.addEventListener('input', (e) => {
    const zt = e.target.closest('[data-zusatz-text]');
    if (zt) {
      const [i, zi] = zt.dataset.zusatzText.split('.').map(Number);
      sitzung.einheiten[i].zusatz[zi].text = zt.value;
      markiere();
      return;
    }
    const el = e.target.closest('[data-pfad]');
    if (!el) return;
    const letzt = el.dataset.pfad.split('.').pop();
    setPath(sitzung, el.dataset.pfad, ZAHLFELDER.has(letzt) ? (el.value === '' ? null : Number(el.value)) : el.value);
    markiere();
  });

  wurzel.addEventListener('change', (e) => {
    const el = e.target.closest('select[data-pfad]');
    if (!el) return;
    setPath(sitzung, el.dataset.pfad, el.value);
    // Beim Hundewechsel ändert sich der bisherige Stand komplett.
    if (el.dataset.pfad === 'hundId') {
      ladeKatalogOhneDieseSitzung();
      markiere({ neuZeichnen: true });
    } else {
      markiere();
    }
  });

  wurzel.addEventListener('click', async (e) => {
    const chip = e.target.closest('[data-chip]');
    if (chip) {
      const arr = new Set(sitzung[chip.dataset.chip] || []);
      const an = !arr.has(chip.dataset.id);
      an ? arr.add(chip.dataset.id) : arr.delete(chip.dataset.id);
      sitzung[chip.dataset.chip] = [...arr];
      chip.classList.toggle('chip--an', an);
      markiere();
      return;
    }

    const zplus = e.target.closest('[data-zusatz-plus]');
    if (zplus) {
      const e0 = sitzung.einheiten[Number(zplus.dataset.zusatzPlus)];
      e0.zusatz = e0.zusatz || [];
      e0.zusatz.push({ id: store.uid(), text: '', haken: 0 });
      markiere({ neuZeichnen: true });
      return;
    }

    const zwdh = e.target.closest('[data-zusatz-wdh]');
    if (zwdh) {
      const [i, zi] = zwdh.dataset.zusatzWdh.split('.').map(Number);
      const z = sitzung.einheiten[i].zusatz[zi];
      const n = Number(zwdh.dataset.n);
      z.haken = Number(z.haken || 0) === n ? n - 1 : n;
      markiere({ neuZeichnen: true });
      return;
    }

    const zweg = e.target.closest('[data-zusatz-weg]');
    if (zweg) {
      const [i, zi] = zweg.dataset.zusatzWeg.split('.').map(Number);
      sitzung.einheiten[i].zusatz.splice(zi, 1);
      markiere({ neuZeichnen: true });
      return;
    }

    const wdh = e.target.closest('[data-wdh]');
    if (wdh) {
      const [i, idx] = wdh.dataset.wdh.split('.').map(Number);
      const n = Number(wdh.dataset.n);
      const e0 = sitzung.einheiten[i];
      e0.haken = e0.haken || {};
      // Nochmal auf denselben Punkt tippen nimmt ihn zurück.
      e0.haken[idx] = Number(e0.haken[idx] || 0) === n ? n - 1 : n;
      if (!e0.haken[idx]) delete e0.haken[idx];
      markiere({ neuZeichnen: true });
      return;
    }

    if (e.target.closest('[data-stufe-hinzu]')) {
      await stufeWaehlen();
      return;
    }

    const weg = e.target.closest('[data-einheit-weg]');
    if (weg) {
      sitzung.einheiten.splice(Number(weg.dataset.einheitWeg), 1);
      markiere({ neuZeichnen: true });
      return;
    }

    if (e.target.closest('[data-abschliessen]')) {
      if (!S.vollstaendigkeit(sitzung).vollstaendig) {
        toast('Es fehlen noch Angaben – siehe Liste.', 'fehler');
        return;
      }
      sitzung.status = 'abgeschlossen';
      sitzung.abgeschlossenAm = new Date().toISOString();
      dirty = true;
      speichereBald.sofort();
      aktualisiereAbschluss();
      toast('Sitzung abgeschlossen – der Fortschritt ist fortgeschrieben.');
      return;
    }

    if (e.target.closest('[data-wieder-oeffnen]')) {
      if (await frage('Wieder als Entwurf öffnen? Die Sitzung zählt dann vorübergehend nicht im Fortschritt.', { ok: 'Wieder öffnen' })) {
        sitzung.status = 'entwurf';
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
      if (await frage('Diese Sitzung in den Papierkorb verschieben? Der Fortschritt wird entsprechend zurückgerechnet.', { ok: 'Löschen', gefahr: true })) {
        await store.entferne(sitzung.id);
        toast('Sitzung gelöscht.');
        location.hash = '#/suchen';
      }
    }
  });
}

/** Auswahldialog für die heute bearbeitete Stufe. */
function stufeWaehlen() {
  const hund = store.get(sitzung.hundId);
  const stand = katalogVorher.stand;
  const schonDrin = new Set(sitzung.einheiten.map((e) => `${e.weg}:${e.stufeN}`));
  const aktuell = V.aktuelleStufe(stand, hund);

  const optionen = WEGE.map((w) => {
    const zeilen = VERBELLEN_PLAN[w.id]
      .filter((st) => !schonDrin.has(`${w.id}:${st.n}`))
      .map((st) => {
        const f = V.stufeFortschritt(stand, w.id, st.n);
        const frei = V.freigeschaltet(stand, w.id, st.n, hund);
        const fertig = f.fertig === f.gesamt;
        const empfohlen = aktuell && aktuell.weg === w.id && aktuell.n === st.n;
        return `<button type="button" class="stufenwahl${empfohlen ? ' stufenwahl--empfohlen' : ''}${fertig ? ' stufenwahl--fertig' : ''}"
          data-waehle="${w.id}:${st.n}">
          <span class="stufenwahl__n">${st.n}</span>
          <span class="stufenwahl__text">${esc(st.title)}
            <small>${f.fertig}/${f.gesamt} steht${fertig ? ' · abgeschlossen' : ''}${frei ? '' : ' · noch gesperrt'}${empfohlen ? ' · hier geht es weiter' : ''}</small>
          </span>
        </button>`;
      })
      .join('');
    return `<div class="stufenwahl__gruppe"><h3>${esc(w.lang)}</h3>${zeilen || '<p class="karte__hint">Alle Stufen sind bereits in dieser Sitzung.</p>'}</div>`;
  }).join('');

  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal modal--gross" role="dialog" aria-modal="true">
      <h2 class="karte__titel">Welche Stufe wurde bearbeitet?</h2>
      <p class="karte__hint">Jede Stufe ist frei wählbar. Gesperrte Stufen sind nur als Hinweis
        gekennzeichnet – wenn ihr abweichend trainiert, wähle sie einfach.</p>
      <div class="stufenwahl__liste">${optionen}</div>
      <div class="modal__aktionen"><button type="button" class="btn btn--still" data-nein>Abbrechen</button></div>
    </div>`;
    document.body.appendChild(back);
    const zu = () => { back.remove(); resolve(); };
    back.querySelector('[data-nein]').onclick = zu;
    back.onclick = (ev) => { if (ev.target === back) zu(); };
    back.querySelectorAll('[data-waehle]').forEach((b) => {
      b.onclick = () => {
        const [w, n] = b.dataset.waehle.split(':');
        sitzung.einheiten.push({ weg: w, stufeN: Number(n), haken: {}, bemerkung: '' });
        zu();
        markiere({ neuZeichnen: true });
      };
    });
  });
}
