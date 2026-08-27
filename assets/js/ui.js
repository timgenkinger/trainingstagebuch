/** Kleine UI-Bausteine ohne Framework. */

import { SCALE_MAX, SCALE_COLORS, SCALE_LABELS } from './schema.js';

export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function $(sel, root = document) {
  return root.querySelector(sel);
}
export function $$(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

/* ---------------------------------------------------------------- */
/* Pfad-Zugriff für Formularbindung                                  */
/* ---------------------------------------------------------------- */

export function getPath(obj, pfad) {
  return pfad.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, pfad, wert) {
  const teile = pfad.split('.');
  const letzt = teile.pop();
  let ziel = obj;
  for (const t of teile) {
    if (ziel[t] == null || typeof ziel[t] !== 'object') ziel[t] = /^\d+$/.test(t) ? [] : {};
    ziel = ziel[t];
  }
  ziel[letzt] = wert;
  return obj;
}

/* ---------------------------------------------------------------- */
/* Formatierung                                                      */
/* ---------------------------------------------------------------- */

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function formatDatum(iso, lang = false) {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  const t = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return lang ? `${WOCHENTAGE[d.getDay()]}, ${t}.${m}.${d.getFullYear()}` : `${t}.${m}.${d.getFullYear()}`;
}

export function formatMinuten(min) {
  if (min == null || min === '' || Number.isNaN(Number(min))) return '—';
  const n = Number(min);
  if (n < 60) return `${runde(n, 1)} min`;
  const h = Math.floor(n / 60);
  const r = Math.round(n % 60);
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function runde(n, stellen = 1) {
  if (n == null || Number.isNaN(n)) return '—';
  const f = 10 ** stellen;
  return Math.round(n * f) / f;
}

export function formatNote(n) {
  return n == null ? '—' : runde(n, 1).toLocaleString('de-DE', { minimumFractionDigits: 1 });
}

export function relativeZeit(ts) {
  if (!ts) return 'noch nie';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'gerade eben';
  if (s < 3600) return `vor ${Math.round(s / 60)} min`;
  if (s < 86400) return `vor ${Math.round(s / 3600)} h`;
  return `vor ${Math.round(s / 86400)} Tagen`;
}

export function skalaFarbe(wert) {
  return SCALE_COLORS[Math.min(SCALE_MAX, Math.max(1, Math.round(wert))) - 1];
}

/* ---------------------------------------------------------------- */
/* Bausteine (liefern HTML-Strings)                                  */
/* ---------------------------------------------------------------- */

/** 5er-Punkteskala wie im Heft (rot -> grün). */
export function skala(pfad, wert, opts = {}) {
  const punkte = Array.from({ length: SCALE_MAX }, (_, i) => {
    const v = i + 1;
    const aktiv = Number(wert) === v;
    return `<button type="button" class="dot${aktiv ? ' dot--aktiv' : ''}" data-skala="${esc(pfad)}" data-wert="${v}"
      style="--dot:${SCALE_COLORS[i]}" aria-label="${esc(SCALE_LABELS[i])}" aria-pressed="${aktiv}"></button>`;
  }).join('');
  return `<div class="skala${opts.klein ? ' skala--klein' : ''}" role="group">${punkte}</div>`;
}

/** Zeile: Label links, Skala rechts. */
export function skalaZeile(label, pfad, wert, opts = {}) {
  return `<div class="krit">
    <div class="krit__label">
      <span>${esc(label)}</span>
      ${opts.hint ? `<small>${esc(opts.hint)}</small>` : ''}
      ${opts.extra || ''}
    </div>
    ${skala(pfad, wert, opts)}
  </div>`;
}

/** Mehrfachauswahl als Chips (Array-Feld). */
export function chipGruppe(pfad, optionen, ausgewaehlt = []) {
  const set = new Set(ausgewaehlt || []);
  return `<div class="chips">${optionen
    .map(
      (o) =>
        `<button type="button" class="chip${set.has(o.id) ? ' chip--an' : ''}"
        data-chip="${esc(pfad)}" data-id="${esc(o.id)}" aria-pressed="${set.has(o.id)}">${esc(o.label)}</button>`
    )
    .join('')}</div>`;
}

export function feld(label, inner, opts = {}) {
  return `<label class="feld${opts.klasse ? ' ' + opts.klasse : ''}">
    <span class="feld__label">${esc(label)}${opts.hint ? ` <small>${esc(opts.hint)}</small>` : ''}</span>
    ${inner}
  </label>`;
}

export function textInput(pfad, wert, opts = {}) {
  return `<input class="input" type="${opts.type || 'text'}" data-pfad="${esc(pfad)}"
    value="${esc(wert ?? '')}" ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''}
    ${opts.min != null ? `min="${opts.min}"` : ''} ${opts.max != null ? `max="${opts.max}"` : ''}
    ${opts.step != null ? `step="${opts.step}"` : ''} ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''}>`;
}

export function textArea(pfad, wert, opts = {}) {
  return `<textarea class="input input--area" data-pfad="${esc(pfad)}" rows="${opts.rows || 4}"
    ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''}>${esc(wert ?? '')}</textarea>`;
}

export function select(pfad, wert, optionen, platzhalter = '– bitte wählen –') {
  return `<select class="input" data-pfad="${esc(pfad)}">
    <option value="">${esc(platzhalter)}</option>
    ${optionen
      .map((o) => `<option value="${esc(o.id)}"${String(wert) === String(o.id) ? ' selected' : ''}>${esc(o.label)}</option>`)
      .join('')}
  </select>`;
}

export function karte(titel, inhalt, opts = {}) {
  return `<section class="karte${opts.klasse ? ' ' + opts.klasse : ''}">
    ${titel ? `<h2 class="karte__titel">${esc(titel)}${opts.aktion || ''}</h2>` : ''}
    ${opts.hint ? `<p class="karte__hint">${esc(opts.hint)}</p>` : ''}
    <div class="karte__inhalt">${inhalt}</div>
  </section>`;
}

export function leer(text, aktion = '') {
  return `<div class="leer"><p>${esc(text)}</p>${aktion}</div>`;
}

/* ---------------------------------------------------------------- */
/* Toast & Dialog                                                    */
/* ---------------------------------------------------------------- */

export function toast(text, art = 'info') {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast toast--${art}`;
  el.textContent = text;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--an'));
  setTimeout(() => {
    el.classList.remove('toast--an');
    setTimeout(() => el.remove(), 300);
  }, art === 'fehler' ? 6000 : 3000);
}

export function frage(text, { ok = 'Ja', abbruch = 'Abbrechen', gefahr = false } = {}) {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <p class="modal__text">${esc(text)}</p>
      <div class="modal__aktionen">
        <button type="button" class="btn btn--still" data-nein>${esc(abbruch)}</button>
        <button type="button" class="btn ${gefahr ? 'btn--gefahr' : 'btn--primaer'}" data-ja>${esc(ok)}</button>
      </div>
    </div>`;
    document.body.appendChild(back);
    const schliesse = (v) => {
      back.remove();
      resolve(v);
    };
    back.querySelector('[data-ja]').onclick = () => schliesse(true);
    back.querySelector('[data-nein]').onclick = () => schliesse(false);
    back.onclick = (e) => {
      if (e.target === back) schliesse(false);
    };
  });
}

export function debounce(fn, ms = 500) {
  let t;
  const f = (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
  f.sofort = (...a) => {
    clearTimeout(t);
    fn(...a);
  };
  return f;
}

export function download(dateiname, inhalt, typ = 'application/json') {
  const blob = new Blob([inhalt], { type: typ });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
