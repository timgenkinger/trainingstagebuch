/** Erfassungsmaske einer einzelnen Suche – bildet Seite 1 und 2 des Hefts ab. */

import * as store from '../store.js';
import { bestaetigungsKarte, bestaetigungKlick } from './bestaetigung.js';
import * as S from '../schema.js';
import * as R from '../rollen.js';
import {
  esc, feld, textInput, textArea, select, karte, chipGruppe, skala, skalaZeile,
  setPath, toast, frage, debounce, formatDatum, formatNote,
} from '../ui.js';
import { skizzeHtml, skizzeAktivieren } from '../skizze.js';
import { kopfKarte, gelaendeKarte, wetterKarte, statusAbzeichen, abschlussKarte as abschlussBaustein } from './bausteine.js';

let suche = null;
let dirty = false;
/** Noch nicht gespeicherte neue Suche. Sie wird erst beim ersten Eintrag
    in die Datenbank geschrieben – so entstehen keine leeren Karteileichen. */
let entwurf = null;

const speichereBald = debounce(async () => {
  if (!suche) return;
  await store.put(suche);
  entwurf = null;
  dirty = false;
  statusSetzen('Gespeichert');
}, 700);

function statusSetzen(text) {
  const el = document.querySelector('[data-speicherstatus]');
  if (el) el.textContent = text;
}

/** Gesamtnote in der Kopfzeile nachziehen, ohne das Formular neu zu bauen. */
function aktualisiereKopf() {
  const el = document.querySelector('[data-gesamtnote]');
  if (!el) return;
  const n = S.gesamtScore(suche);
  el.innerHTML = n == null ? '' : ` \u00b7 Gesamtnote <strong>${formatNote(n)}</strong>`;
}

/**
 * Zieht Abschlussbereich und Statusabzeichen nach.
 * Muss bei JEDER Änderung laufen: sonst zeigt die Karte den Stand vom letzten
 * Neuzeichnen, und die Suche liesse sich erst nach einem Neuladen abschliessen.
 * Der Bereich enthält nur Schaltflächen – ein Ersetzen stört keine Eingabe.
 */
function aktualisiereAbschluss() {
  const bereich = document.querySelector('[data-abschluss]');
  if (bereich && !bereich.contains(document.activeElement)) bereich.innerHTML = abschlussKarte();
  const abz = document.querySelector('[data-status-abz]');
  if (abz) abz.innerHTML = statusAbzeichen(suche);
}

export function flushEditor() {
  if (dirty) speichereBald.sofort();
  entwurf = null; // unberührter Entwurf wird verworfen
}

export async function render(wurzel, params) {
  let rec = params.id ? store.get(params.id) : null;
  if (!rec && params.id && entwurf?.id === params.id) rec = entwurf;

  if (!rec) {
    // Rahmenbedingungen der letzten Suche als Vorlage anbieten.
    const letzte = store.suchen()[0];
    entwurf = {
      ...S.neueSuche({
        // Vorauswahl: Hund und Hundeführer:in dieses Geräts,
        // ersatzweise der zuletzt dokumentierte Stand.
        hundId: R.standardHundId() || letzte?.hundId || R.meineHunde()[0]?.id,
        hfId: R.standardHfId() || letzte?.hfId,
      }),
      id: store.uid(),
    };
    location.replace(`#/suche/${entwurf.id}`);
    return;
  }
  if (rec !== entwurf) entwurf = null;
  suche = JSON.parse(JSON.stringify(rec));
  if (!Array.isArray(suche.helfer) || !suche.helfer.length) suche.helfer = [1, 2, 3, 4].map(S.neueHelferZeile);
  if (!suche.eigeneKriterien) suche.eigeneKriterien = { team: [], hund: [], hf: [] };

  zeichne(wurzel);
}

/** Erzeugt das Formular neu und hängt die Ereignisse an den frisch erzeugten
    Container – so können sich keine Listener aufstauen. */
function zeichne(wurzel) {
  wurzel.innerHTML = html();
  const box = wurzel.querySelector('.editor');
  binde(box);
  skizzeAktivieren(box, suche.skizze, (d) => {
    suche.skizze = d;
    markiere();
  });
}

function markiere() {
  dirty = true;
  statusSetzen('Speichere …');
  aktualisiereAbschluss();
  aktualisiereKopf();
  speichereBald();
}

/* ---------------------------------------------------------------- */

function html() {
  const hunde = store.hunde().map((h) => ({ id: h.id, label: h.name }));
  const personen = store.personen().map((p) => ({ id: p.id, label: p.name }));
  const score = S.gesamtScore(suche);

  return `
  <div class="editor">
    <div class="editor__kopf">
      <div>
        <h1>Suche vom ${esc(formatDatum(suche.datum, true))} <span data-status-abz>${statusAbzeichen(suche)}</span></h1>
        <p class="editor__meta">
          <span data-speicherstatus>Gespeichert</span><span data-gesamtnote>${
            score != null ? ` · Gesamtnote <strong>${formatNote(score)}</strong>` : ''
          }</span>
        </p>
      </div>
      <div class="editor__aktionen">
        <button type="button" class="btn btn--still" data-duplizieren>Duplizieren</button>
        <button type="button" class="btn btn--still" data-drucken>Drucken</button>
        <button type="button" class="btn btn--gefahr-still" data-loeschen>Löschen</button>
      </div>
    </div>

    ${kopfKarte(suche, {
      zusatz: feld('Trainingsziel', textArea('trainingsziel', suche.trainingsziel, {
        rows: 2, placeholder: 'Was soll in dieser Suche erreicht werden?' })),
    })}

    ${gelaendeKarte(suche)}

    ${wetterKarte(suche)}

    ${karte('Suchgebiet', `
      <div class="raster raster--3">
        ${feld('Abmessungen', textInput('gebietGroesse', suche.gebietGroesse, { placeholder: 'z.B. 150 × 200 m' }))}
        ${feld('Suchzeit gesamt (min)', textInput('suchzeitMin', suche.suchzeitMin, { type: 'number', inputmode: 'decimal', min: 0, step: 1 }))}
        ${feld('Helfer:innen (Namen)', textInput('helferNamen', suche.helferNamen, { placeholder: 'wer war versteckt?' }))}
      </div>
      ${skizzeHtml(suche.skizze)}
    `)}

    ${karte('Versteckpersonen & Funde', helferTabelle(), {
      hint: `Pro Versteckperson: Zeit bis zum Fund, gewähltes Helfer:in-Bild und Abstand zur Hundeführer:in beim Fund. Angezeigt wird durchgängig durch ${S.ANZEIGE_ART}.`,
      aktion: `<button type="button" class="btn btn--mini" data-helfer-plus>+ Person</button>`,
    })}

    ${karte('Team: Verlauf der Suche', `
      ${S.TEAM_KRITERIEN.map((k) =>
        skalaZeile(k.label, `team.${k.id}`, suche.team?.[k.id], {
          hint: k.hint,
          extra: k.hasCheck ? ampel('teamAblageOk', suche.teamAblageOk) : '',
        })
      ).join('')}
      ${eigeneKriterien('team')}
    `)}

    ${karte('Verhalten Hund', `
      <h3 class="unter">Leistung</h3>
      ${S.HUND_KRITERIEN.map((k) =>
        skalaZeile(k.label, `hund.${k.id}`, suche.hund?.[k.id], {
          hint: k.hint,
          extra: k.hasRadiusTyp ? radiusTyp() : '',
        })
      ).join('')}
      ${eigeneKriterien('hund')}

      <h3 class="unter">Problemverhalten</h3>
      <p class="karte__hint">Wann tritt das auf? (Zeitpunkt/Kontext)</p>
      <div class="checkliste">
        ${S.PROBLEMVERHALTEN.map(
          (p) => `<button type="button" class="check${suche.probleme?.[p.id] ? ' check--an' : ''}"
            data-check="probleme.${p.id}" aria-pressed="${!!suche.probleme?.[p.id]}">
            <i></i><span>${esc(p.label)}</span></button>`
        ).join('')}
      </div>
      ${textArea('problemeKontext', suche.problemeKontext, { rows: 3, placeholder: 'Zeitpunkt / Kontext der Problemverhalten …' })}
    `)}

    ${karte('Verhalten Hundeführer:in', `
      <h3 class="unter">Leistung</h3>
      ${S.HF_KRITERIEN.map((k) => skalaZeile(k.label, `hf.${k.id}`, suche.hf?.[k.id])).join('')}
      ${eigeneKriterien('hf')}
      <h3 class="unter">Selbstreflektion und Vorsätze</h3>
      ${textArea('selbstreflektion', suche.selbstreflektion, { rows: 5 })}
    `)}

    ${karte('Notizen zur Suche', textArea('notizen', suche.notizen, { rows: 6, placeholder: 'Besonderheiten der Übung oder ein Aspekt, den du detaillierter beschreiben willst.' }))}

    ${karte('Konsequenz', `
      <div class="raster raster--3">
        ${feld('Beobachten', textArea('beobachten', suche.beobachten, { rows: 3 }))}
        ${feld('Bearbeiten', textArea('bearbeiten', suche.bearbeiten, { rows: 3 }))}
        ${feld('Neues Ziel', textArea('neuesZiel', suche.neuesZiel, { rows: 3 }))}
      </div>
    `)}

    <div data-bestaetigung>${bestaetigungsKarte(suche)}</div>

    <div data-abschluss>${abschlussKarte()}</div>

    <div class="editor__fuss">
      <a class="btn btn--still" href="#/suchen">Zur Übersicht</a>
    </div>
  </div>`;
}

function abschlussKarte() {
  return abschlussBaustein(suche, {
    wasIstEs: 'Suche',
    geteiltText: 'Diese Suche ist vollständig ausgeführt und wird mit dem Team geteilt.',
  });
}

function ampel(pfad, wert) {
  return `<span class="ampel">
    <button type="button" class="ampel__b${wert === true ? ' ampel__b--ja' : ''}" data-tri="${pfad}" data-wert="true" title="erfolgt">✓</button>
    <button type="button" class="ampel__b${wert === false ? ' ampel__b--nein' : ''}" data-tri="${pfad}" data-wert="false" title="nicht erfolgt">✗</button>
  </span>`;
}

function radiusTyp() {
  return `<span class="radiustyp">${S.RADIUS_TYPEN.map(
    (r) => `<button type="button" class="mini-chip${suche.radiusTyp === r.id ? ' mini-chip--an' : ''}"
      data-radius="${r.id}" aria-pressed="${suche.radiusTyp === r.id}">${esc(r.label)}</button>`
  ).join('')}</span>`;
}

function eigeneKriterien(gruppe) {
  const liste = suche.eigeneKriterien?.[gruppe] || [];
  return `${liste
    .map(
      (k, i) => `<div class="krit krit--eigen">
      <div class="krit__label">
        <input class="input input--schlank" data-eigen-label="${gruppe}.${i}" value="${esc(k.label || '')}" placeholder="eigenes Kriterium">
        <button type="button" class="btn btn--mini btn--gefahr-still" data-eigen-weg="${gruppe}.${i}">×</button>
      </div>
      ${skala(`eigen.${gruppe}.${i}`, k.wert)}
    </div>`
    )
    .join('')}
  <button type="button" class="btn btn--mini" data-eigen-plus="${gruppe}">+ eigenes Kriterium</button>`;
}

function helferTabelle() {
  return `<div class="helfer-liste">${suche.helfer
    .map(
      (h, i) => `<div class="helfer">
      <div class="helfer__kopf">
        <strong>Helfer:in ${i + 1}</strong>
        <span class="helfer__gefunden">
          <button type="button" class="mini-chip${h.gefunden === true ? ' mini-chip--an' : ''}" data-tri="helfer.${i}.gefunden" data-wert="true">gefunden</button>
          <button type="button" class="mini-chip${h.gefunden === false ? ' mini-chip--an mini-chip--rot' : ''}" data-tri="helfer.${i}.gefunden" data-wert="false">nicht gefunden</button>
        </span>
        ${suche.helfer.length > 1 ? `<button type="button" class="btn btn--mini btn--gefahr-still" data-helfer-weg="${i}">×</button>` : ''}
      </div>
      <div class="raster raster--3">
        ${feld('Helfer:in-Bild', select(`helfer.${i}.bildId`, h.bildId, S.HELFER_BILDER.map((b) => ({ id: b.id, label: b.label })), '– frei –'))}
        ${feld('Suchzeit bis (min)', textInput(`helfer.${i}.zeitBisMin`, h.zeitBisMin, { type: 'number', inputmode: 'decimal', min: 0, step: 0.5 }))}
        ${feld('Radius zur HF (m)', textInput(`helfer.${i}.radiusM`, h.radiusM, { type: 'number', inputmode: 'numeric', min: 0, step: 1 }))}
      </div>
      ${feld('Element / Bemerkung', textInput(`helfer.${i}.beschreibung`, h.beschreibung, { placeholder: 'z.B. Versteck unter Wurzelteller, Wind seitlich' }))}
    </div>`
    )
    .join('')}</div>`;
}

/* ---------------------------------------------------------------- */

const ZAHLFELDER = new Set(['suchzeitMin', 'zeitBisMin', 'radiusM', 'wartezeitAutoMin']);

function binde(wurzel) {
  const feldWert = (el) => {
    const pfad = el.dataset.pfad;
    const letzterTeil = pfad.split('.').pop();
    if (ZAHLFELDER.has(letzterTeil)) {
      return el.value === '' ? null : Number(el.value);
    }
    return el.value;
  };

  wurzel.addEventListener('input', (e) => {
    const el = e.target.closest('[data-pfad]');
    if (el) {
      setPath(suche, el.dataset.pfad, feldWert(el));
      markiere();
      return;
    }
    const eig = e.target.closest('[data-eigen-label]');
    if (eig) {
      const [gruppe, i] = eig.dataset.eigenLabel.split('.');
      suche.eigeneKriterien[gruppe][Number(i)].label = eig.value;
      markiere();
    }
  });

  wurzel.addEventListener('change', (e) => {
    const el = e.target.closest('select[data-pfad]');
    if (el) {
      setPath(suche, el.dataset.pfad, el.value);
      markiere();
    }
  });

  wurzel.addEventListener('click', async (e) => {
    if (await bestaetigungKlick(e, suche, () => neuZeichnenBestaetigung())) return;

    const t = e.target;

    // Umschalter aktualisieren nur ihre eigene Schaltergruppe – das lange
    // Formular wird dabei nicht neu aufgebaut (kein Fokus-/Scrollverlust).
    const dot = t.closest('[data-skala]');
    if (dot) {
      const pfad = dot.dataset.skala;
      const wert = Number(dot.dataset.wert);
      let neuerWert;
      if (pfad.startsWith('eigen.')) {
        const [, gruppe, i] = pfad.split('.');
        const k = suche.eigeneKriterien[gruppe][Number(i)];
        neuerWert = k.wert === wert ? null : wert;
        k.wert = neuerWert;
      } else {
        neuerWert = getWert(pfad) === wert ? null : wert;
        setPath(suche, pfad, neuerWert);
      }
      dot.parentElement.querySelectorAll('[data-skala]').forEach((b) => {
        const an = Number(b.dataset.wert) === neuerWert;
        b.classList.toggle('dot--aktiv', an);
        b.setAttribute('aria-pressed', String(an));
      });
      markiere();
      aktualisiereKopf();
      return;
    }

    const chip = t.closest('[data-chip]');
    if (chip) {
      const arr = new Set(getWert(chip.dataset.chip) || []);
      const an = !arr.has(chip.dataset.id);
      an ? arr.add(chip.dataset.id) : arr.delete(chip.dataset.id);
      setPath(suche, chip.dataset.chip, [...arr]);
      chip.classList.toggle('chip--an', an);
      chip.setAttribute('aria-pressed', String(an));
      markiere();
      return;
    }

    const check = t.closest('[data-check]');
    if (check) {
      const an = !getWert(check.dataset.check);
      setPath(suche, check.dataset.check, an);
      check.classList.toggle('check--an', an);
      check.setAttribute('aria-pressed', String(an));
      markiere();
      return;
    }

    const tri = t.closest('[data-tri]');
    if (tri) {
      const pfad = tri.dataset.tri;
      const wert = tri.dataset.wert === 'true';
      const neuerWert = getWert(pfad) === wert ? null : wert;
      setPath(suche, pfad, neuerWert);
      wurzel.querySelectorAll(`[data-tri="${CSS.escape(pfad)}"]`).forEach((b) => {
        const ja = b.dataset.wert === 'true';
        const an = neuerWert === ja;
        if (b.classList.contains('ampel__b')) {
          b.classList.toggle('ampel__b--ja', an && ja);
          b.classList.toggle('ampel__b--nein', an && !ja);
        } else {
          b.classList.toggle('mini-chip--an', an);
          b.classList.toggle('mini-chip--rot', an && !ja);
        }
      });
      markiere();
      return;
    }

    const rad = t.closest('[data-radius]');
    if (rad) {
      suche.radiusTyp = suche.radiusTyp === rad.dataset.radius ? '' : rad.dataset.radius;
      wurzel.querySelectorAll('[data-radius]').forEach((b) => {
        const an = b.dataset.radius === suche.radiusTyp;
        b.classList.toggle('mini-chip--an', an);
        b.setAttribute('aria-pressed', String(an));
      });
      markiere();
      return;
    }

    const plus = t.closest('[data-eigen-plus]');
    if (plus) {
      suche.eigeneKriterien[plus.dataset.eigenPlus].push({ label: '', wert: null });
      neuZeichnen();
      return;
    }

    const weg = t.closest('[data-eigen-weg]');
    if (weg) {
      const [gruppe, i] = weg.dataset.eigenWeg.split('.');
      suche.eigeneKriterien[gruppe].splice(Number(i), 1);
      neuZeichnen();
      return;
    }

    if (t.closest('[data-helfer-plus]')) {
      suche.helfer.push(S.neueHelferZeile(suche.helfer.length + 1));
      neuZeichnen();
      return;
    }

    const hweg = t.closest('[data-helfer-weg]');
    if (hweg) {
      suche.helfer.splice(Number(hweg.dataset.helferWeg), 1);
      neuZeichnen();
      return;
    }

    if (t.closest('[data-abschliessen]')) {
      const v = S.vollstaendigkeit(suche);
      if (!v.vollstaendig) {
        toast('Es fehlen noch Angaben – siehe Liste.', 'fehler');
        return;
      }
      suche.status = 'abgeschlossen';
      suche.abgeschlossenAm = new Date().toISOString();
      dirty = true;
      speichereBald.sofort();
      aktualisiereAbschluss();
      toast('Suche abgeschlossen – wird mit dem Team geteilt.');
      return;
    }

    if (t.closest('[data-wieder-oeffnen]')) {
      if (await frage('Suche wieder als Entwurf öffnen? Sie wird dann erst nach erneutem Abschließen aktualisiert.', { ok: 'Wieder öffnen' })) {
        suche.status = 'entwurf';
        dirty = true;
        speichereBald.sofort();
        aktualisiereAbschluss();
      }
      return;
    }

    if (t.closest('[data-drucken]')) {
      window.print();
      return;
    }

    if (t.closest('[data-duplizieren]')) {
      speichereBald.sofort();
      const kopie = JSON.parse(JSON.stringify(suche));
      delete kopie.id;
      delete kopie.createdAt;
      kopie.datum = new Date().toISOString().slice(0, 10);
      kopie.status = 'entwurf';
      kopie.abgeschlossenAm = null;
      kopie.team = {};
      kopie.hund = {};
      kopie.hf = {};
      kopie.probleme = {};
      kopie.notizen = '';
      kopie.selbstreflektion = '';
      kopie.helfer = kopie.helfer.map((h, i) => ({ ...S.neueHelferZeile(i + 1), bildId: h.bildId }));
      const neu = await store.put(kopie);
      toast('Als neue Suche kopiert (Rahmenbedingungen übernommen).');
      location.hash = `#/suche/${neu.id}`;
      return;
    }

    if (t.closest('[data-loeschen]')) {
      if (await frage('Diese Suche in den Papierkorb verschieben?', { ok: 'Löschen', gefahr: true })) {
        await store.entferne(suche.id);
        toast('Suche gelöscht – Wiederherstellen unter Einstellungen.');
        location.hash = '#/suchen';
      }
    }
  });
}

function getWert(pfad) {
  return pfad.split('.').reduce((o, k) => (o == null ? undefined : o[k]), suche);
}

/** Neuzeichnen bei Strukturänderungen; Formularfelder behalten ihren Wert im Modell. */
function neuZeichnen() {
  markiere();
  const y = window.scrollY;
  zeichne(document.getElementById('view'));
  window.scrollTo(0, y);
  statusSetzen('Speichere \u2026');
}

/** Nur den Bestätigungsbereich neu zeichnen. */
function neuZeichnenBestaetigung() {
  const b = document.querySelector('[data-bestaetigung]');
  if (b) b.innerHTML = bestaetigungsKarte(suche);
}
