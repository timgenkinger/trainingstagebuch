/** Übersicht aller dokumentierten Suchen. */

import * as store from '../store.js';
import * as S from '../schema.js';
import { esc, formatDatum, formatNote, formatMinuten, leer, skalaFarbe } from '../ui.js';
import { skizzeSvg } from '../skizze.js';
import * as R from '../rollen.js';
import { bestaetigungAbzeichen } from './bestaetigung.js';

const filter = { text: '', hundId: '', jahr: '', nurEntwuerfe: false, art: '', nurUnbestaetigt: false };

export async function render(wurzel, params = {}) {
  if (params.nurUnbestaetigt !== undefined) filter.nurUnbestaetigt = !!params.nurUnbestaetigt;
  zeichne(wurzel);
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  // Ereignisse an den frisch erzeugten Container haengen (keine Listener-Stapel).
  binde(wurzel.querySelector('.seite'), wurzel);
}

function gefiltert() {
  const t = filter.text.trim().toLowerCase();
  // Hundeführer:innen sehen ausschließlich ihre eigenen Hunde.
  return R.filtereDokumente(store.dokumente()).filter((s) => {
    if (filter.nurUnbestaetigt && (R.istBestaetigt(s) || (s.status ?? 'abgeschlossen') !== 'abgeschlossen')) return false;
    if (filter.art && s.type !== filter.art) return false;
    if (filter.nurEntwuerfe && S.istAbgeschlossen(s)) return false;
    if (filter.hundId && s.hundId !== filter.hundId) return false;
    if (filter.jahr && !(s.datum || '').startsWith(filter.jahr)) return false;
    if (!t) return true;
    const heu = [s.ort, s.titel, s.trainingsziel, s.notizen, s.text, s.helferNamen, s.selbstreflektion]
      .filter(Boolean).join(' ').toLowerCase();
    return heu.includes(t);
  });
}

function html() {
  const alle = R.filtereDokumente(store.dokumente());
  const liste = gefiltert();
  const hunde = R.meineHunde();
  const jahre = [...new Set(alle.map((s) => (s.datum || '').slice(0, 4)).filter(Boolean))].sort().reverse();
  const entwuerfe = alle.filter((s) => !S.istAbgeschlossen(s)).length;
  const anzahlSuchen = alle.filter((s) => s.type === 'suche').length;
  const anzahlFrei = alle.filter((s) => s.type === 'freidoku').length;
  const anzahlVerbellen = alle.filter((s) => s.type === 'verbellen').length;
  const unbestaetigt = alle.filter((s) => (s.status ?? 'abgeschlossen') === 'abgeschlossen' && !R.istBestaetigt(s)).length;

  if (!alle.length) {
    return `<div class="seite">
      ${leer(
        'Noch nichts dokumentiert. Eine Suche folgt dem Protokoll aus dem Heft, eine freie Dokumentation hat nur Grundwerte, Skizze und Freitext.',
        `<div class="btn-zeile btn-zeile--mitte">
          <a class="btn btn--primaer" href="#/suche/neu">Erste Suche anlegen</a>
          <a class="btn btn--still" href="#/doku/neu">Freie Dokumentation</a>
        </div>`
      )}
    </div>`;
  }

  return `<div class="seite">
    <div class="seite__kopf">
      <h1>Dokumentation <span class="zaehler">${liste.length}/${alle.length}</span></h1>
      <div class="btn-zeile">
        <a class="btn btn--still" href="#/verbellen-sitzung/neu">+ Verbellen</a>
        <a class="btn btn--still" href="#/doku/neu">+ Freie Doku</a>
        <a class="btn btn--primaer" href="#/suche/neu">+ Neue Suche</a>
      </div>
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
      <select class="input" data-f="art">
        <option value="">Alle Arten</option>
        <option value="suche"${filter.art === 'suche' ? ' selected' : ''}>nur Suchen (${anzahlSuchen})</option>
        <option value="freidoku"${filter.art === 'freidoku' ? ' selected' : ''}>nur freie Doku (${anzahlFrei})</option>
        <option value="verbellen"${filter.art === 'verbellen' ? ' selected' : ''}>nur Verbellen (${anzahlVerbellen})</option>
      </select>
      <button type="button" class="chip${filter.nurEntwuerfe ? ' chip--an' : ''}" data-t="nurEntwuerfe">
        nur Entwürfe${entwuerfe ? ` (${entwuerfe})` : ''}
      </button>
      ${R.istAusbilder() ? `<button type="button" class="chip${filter.nurUnbestaetigt ? ' chip--an' : ''}" data-t="nurUnbestaetigt">
        wartet auf Bestätigung${unbestaetigt ? ` (${unbestaetigt})` : ''}
      </button>` : ''}
    </div>

    ${liste.length ? `<div class="such-liste">${liste.map(karteFuer).join('')}</div>` : leer('Kein Eintrag passt zu diesem Filter.')}
  </div>`;
}

function karteFuer(s) {
  if (s.type === 'freidoku') return karteFreidoku(s);
  if (s.type === 'verbellen') return karteVerbellen(s);
  return karteSuche(s);
}

function karteVerbellen(s) {
  const einheiten = s.einheiten || [];
  const wdh = einheiten.reduce(
    (n, e) => n + Object.values(e.haken || {}).reduce((a, b) => a + Number(b || 0), 0)
      + (e.zusatz || []).reduce((a, z) => a + Number(z.haken || 0), 0), 0
  );
  return `<a class="such-karte such-karte--verbellen" href="#/verbellen-sitzung/${esc(s.id)}">
    <div class="such-karte__haupt">
      <div class="such-karte__zeile1">
        <strong>${esc(formatDatum(s.datum))}</strong>
        <span class="such-karte__ort">${esc(s.ort || 'ohne Ortsangabe')}</span>
        <span class="abz abz--art">Verbellen</span>
        ${S.istAbgeschlossen(s) ? '' : '<span class="abz abz--entwurf abz--klein">Entwurf</span>'}
        ${bestaetigungAbzeichen(s)}
      </div>
      <div class="such-karte__zeile2">
        ${zeile2(s)}
        <span class="tag">📚 ${einheiten.length} Stufe(n)</span>
        <span class="tag">✓ ${wdh} Wiederholung(en)</span>
      </div>
      ${einheiten.length ? `<p class="such-karte__ziel">${esc(einheiten
        .map((e) => `${e.weg === 'box' ? 'Box' : 'Mensch'} ${e.stufeN}`).join(', '))}</p>` : ''}
    </div>
  </a>`;
}

function zeile2(s) {
  const hund = store.get(s.hundId);
  const hf = store.get(s.hfId);
  return `
    ${hund ? `<span class="tag">🐕 ${esc(hund.name)}</span>` : ''}
    ${hf ? `<span class="tag">👤 ${esc(hf.name)}</span>` : ''}
    ${s.wartezeitAutoMin ? `<span class="tag">🚗 ${esc(formatMinuten(s.wartezeitAutoMin))} Wartezeit</span>` : ''}`;
}

function karteFreidoku(s) {
  return `<a class="such-karte such-karte--frei" href="#/doku/${esc(s.id)}">
    <div class="such-karte__haupt">
      <div class="such-karte__zeile1">
        <strong>${esc(formatDatum(s.datum))}</strong>
        <span class="such-karte__ort">${esc(s.titel || 'ohne Überschrift')}</span>
        <span class="abz abz--art">Freie Doku</span>
        ${S.istAbgeschlossen(s) ? '' : '<span class="abz abz--entwurf abz--klein">Entwurf</span>'}
        ${bestaetigungAbzeichen(s)}
      </div>
      <div class="such-karte__zeile2">
        ${zeile2(s)}
        ${s.ort ? `<span class="tag">📍 ${esc(s.ort)}</span>` : ''}
      </div>
      ${s.text ? `<p class="such-karte__ziel">${esc(kuerze(s.text, 160))}</p>` : ''}
    </div>
    <div class="such-karte__skizze">${skizzeSvg(s.skizze, 120, 90) || ''}</div>
  </a>`;
}

function karteSuche(s) {
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
        ${S.istAbgeschlossen(s) ? '' : '<span class="abz abz--entwurf abz--klein">Entwurf</span>'}
        ${bestaetigungAbzeichen(s)}
        ${score != null ? `<span class="note" style="--n:${skalaFarbe(score)}">${formatNote(score)}</span>` : ''}
      </div>
      <div class="such-karte__zeile2">
        ${zeile2(s)}
        ${s.suchzeitMin ? `<span class="tag">⏱ ${esc(formatMinuten(s.suchzeitMin))} Suche</span>` : ''}
        ${versteckt ? `<span class="tag">🎯 ${funde}/${versteckt} gefunden</span>` : ''}
        ${probleme ? `<span class="tag tag--warn">⚠ ${probleme} Problemverhalten</span>` : ''}
      </div>
      <div class="such-karte__noten">
        ${gruppen
          .map(([n, v]) =>
            v == null ? '' : `<span class="mininote"><i style="background:${skalaFarbe(v)}"></i>${esc(n)} ${formatNote(v)}</span>`
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
  box.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]');
    if (!t) return;
    filter[t.dataset.t] = !filter[t.dataset.t];
    zeichne(wurzel);
  });
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
