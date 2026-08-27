/** Übersicht aller dokumentierten Suchen. */

import * as store from '../store.js';
import * as S from '../schema.js';
import { esc, formatDatum, formatNote, formatMinuten, leer, skalaFarbe } from '../ui.js';
import { skizzeSvg } from '../skizze.js';

const filter = { text: '', hundId: '', jahr: '' };

export async function render(wurzel) {
  zeichne(wurzel);
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  // Ereignisse an den frisch erzeugten Container haengen (keine Listener-Stapel).
  binde(wurzel.querySelector('.seite'), wurzel);
}

function gefiltert() {
  const t = filter.text.trim().toLowerCase();
  return store.suchen().filter((s) => {
    if (filter.hundId && s.hundId !== filter.hundId) return false;
    if (filter.jahr && !(s.datum || '').startsWith(filter.jahr)) return false;
    if (!t) return true;
    const heu = [s.ort, s.trainingsziel, s.notizen, s.helferNamen, s.selbstreflektion].join(' ').toLowerCase();
    return heu.includes(t);
  });
}

function html() {
  const alle = store.suchen();
  const liste = gefiltert();
  const hunde = store.hunde();
  const jahre = [...new Set(alle.map((s) => (s.datum || '').slice(0, 4)).filter(Boolean))].sort().reverse();

  if (!alle.length) {
    return `<div class="seite">
      ${leer(
        'Noch keine Suche dokumentiert. Lege die erste an – die Rahmenbedingungen werden bei der nächsten Suche automatisch als Vorlage angeboten.',
        '<a class="btn btn--primaer" href="#/suche/neu">Erste Suche anlegen</a>'
      )}
    </div>`;
  }

  return `<div class="seite">
    <div class="seite__kopf">
      <h1>Suchen <span class="zaehler">${liste.length}/${alle.length}</span></h1>
      <a class="btn btn--primaer" href="#/suche/neu">+ Neue Suche</a>
    </div>

    <div class="filterleiste">
      <input class="input" type="search" placeholder="Ort, Ziel, Notizen durchsuchen …" data-f="text" value="${esc(filter.text)}">
      <select class="input" data-f="hundId">
        <option value="">Alle Hunde</option>
        ${hunde.map((h) => `<option value="${esc(h.id)}"${filter.hundId === h.id ? ' selected' : ''}>${esc(h.name)}</option>`).join('')}
      </select>
      <select class="input" data-f="jahr">
        <option value="">Alle Jahre</option>
        ${jahre.map((j) => `<option value="${esc(j)}"${filter.jahr === j ? ' selected' : ''}>${esc(j)}</option>`).join('')}
      </select>
    </div>

    ${liste.length ? `<div class="such-liste">${liste.map(karteFuer).join('')}</div>` : leer('Keine Suche passt zu diesem Filter.')}
  </div>`;
}

function karteFuer(s) {
  const hund = store.get(s.hundId);
  const hf = store.get(s.hfId);
  const score = S.gesamtScore(s);
  const funde = (s.helfer || []).filter((h) => h.gefunden === true).length;
  const versteckt = (s.helfer || []).filter((h) => h.gefunden !== null && h.gefunden !== undefined).length;
  const probleme = Object.entries(s.probleme || {}).filter(([, v]) => v).length;

  const gruppen = [
    ['Team', S.mittelwert(S.werteDerGruppe(s, 'team'))],
    ['Hund', S.mittelwert(S.werteDerGruppe(s, 'hund'))],
    ['HF', S.mittelwert(S.werteDerGruppe(s, 'hf'))],
  ];

  return `<a class="such-karte" href="#/suche/${esc(s.id)}">
    <div class="such-karte__haupt">
      <div class="such-karte__zeile1">
        <strong>${esc(formatDatum(s.datum))}</strong>
        <span class="such-karte__ort">${esc(s.ort || 'ohne Ortsangabe')}</span>
        ${score != null ? `<span class="note" style="--n:${skalaFarbe(score)}">${formatNote(score)}</span>` : ''}
      </div>
      <div class="such-karte__zeile2">
        ${hund ? `<span class="tag">🐕 ${esc(hund.name)}</span>` : ''}
        ${hf ? `<span class="tag">👤 ${esc(hf.name)}</span>` : ''}
        ${s.suchzeitMin ? `<span class="tag">⏱ ${esc(formatMinuten(s.suchzeitMin))}</span>` : ''}
        ${versteckt ? `<span class="tag">🎯 ${funde}/${versteckt} gefunden</span>` : ''}
        ${probleme ? `<span class="tag tag--warn">⚠ ${probleme} Problemverhalten</span>` : ''}
      </div>
      <div class="such-karte__noten">
        ${gruppen
          .map(([n, v]) =>
            v == null
              ? ''
              : `<span class="mininote"><i style="background:${skalaFarbe(v)}"></i>${esc(n)} ${formatNote(v)}</span>`
          )
          .join('')}
      </div>
      ${s.trainingsziel ? `<p class="such-karte__ziel">${esc(kuerze(s.trainingsziel, 140))}</p>` : ''}
    </div>
    <div class="such-karte__skizze">${skizzeSvg(s.skizze, 120, 90) || ''}</div>
  </a>`;
}

function kuerze(t, n) {
  return t.length > n ? t.slice(0, n).trimEnd() + ' …' : t;
}

function binde(box, wurzel) {
  if (!box) return;
  box.addEventListener('input', (e) => {
    const el = e.target.closest('[data-f]');
    if (!el) return;
    filter[el.dataset.f] = el.value;
    const istText = el.dataset.f === 'text';
    const pos = istText ? el.selectionStart : null;
    zeichne(wurzel);
    if (istText) {
      const neuEl = wurzel.querySelector('[data-f="text"]');
      neuEl?.focus();
      neuEl?.setSelectionRange(pos, pos);
    }
  });
}
