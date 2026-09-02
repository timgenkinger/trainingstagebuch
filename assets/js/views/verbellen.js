/**
 * Fortschrittskatalog Verbellen – abgeleitet aus den Sitzungen, daher nur lesend.
 * Eingetragen wird ausschließlich in einer Verbellen-Sitzung.
 */

import * as store from '../store.js';
import * as V from '../verbellen.js';
import { VERBELLEN_PLAN, WEGE } from '../verbellen-plan.js';
import { esc, karte, leer, formatDatum, runde, frage, toast } from '../ui.js';

const zustand = { hundId: '', weg: 'box', nurOffen: false, offeneStufe: null };

export async function render(wurzel) {
  const hunde = store.hunde();
  if (!zustand.hundId && hunde.length) zustand.hundId = hunde[0].id;
  zeichne(wurzel);
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  binde(wurzel.querySelector('.seite'), wurzel);
}

function html() {
  const hunde = store.hunde();
  if (!hunde.length) {
    return `<div class="seite">${leer(
      'Lege zuerst einen Hund an – der Verbellen-Fortschritt wird je Hund geführt.',
      '<a class="btn btn--primaer" href="#/einstellungen">Zu den Einstellungen</a>'
    )}</div>`;
  }

  const hund = store.get(zustand.hundId);
  const kat = V.katalog(zustand.hundId);
  const fort = V.fortschritt(kat.stand, hund);
  const aktuell = V.aktuelleStufe(kat.stand, hund);
  const plan = VERBELLEN_PLAN[zustand.weg];

  return `<div class="seite">
    <div class="seite__kopf">
      <h1>Verbellen</h1>
      <a class="btn btn--primaer" href="#/verbellen-sitzung/neu">+ Sitzung</a>
    </div>
    <p class="seite__intro">Der Fortschritt entsteht aus den abgeschlossenen Sitzungen –
      eingetragen wird dort, hier siehst du den Stand. Jede Unterübung gilt nach
      ${V.NOETIGE_WIEDERHOLUNGEN} gelungenen Wiederholungen als sicher.</p>

    <div class="filterleiste">
      <select class="input" data-f="hundId">
        ${hunde.map((h) => `<option value="${esc(h.id)}"${zustand.hundId === h.id ? ' selected' : ''}>${esc(h.name)}</option>`).join('')}
      </select>
      ${WEGE.map((w) => `<button type="button" class="chip${zustand.weg === w.id ? ' chip--an' : ''}" data-weg="${w.id}">${esc(w.label)}</button>`).join('')}
      <button type="button" class="chip${zustand.nurOffen ? ' chip--an' : ''}" data-t="nurOffen">nur offene</button>
    </div>

    ${karte('Stand', `
      <div class="fortschritt-zeile">
        <span class="fortschritt-balken"><span style="width:${runde(fort.anteil * 100, 1)}%"></span></span>
        <strong>${fort.fertig} von ${fort.gesamt}</strong>
      </div>
      <div class="kacheln kacheln--schlank">
        <div class="kachel"><span class="kachel__label">Box</span>
          <strong class="kachel__wert">${fort.box.fertig}/${fort.box.gesamt}</strong>
          <span class="kachel__sub">${fort.stufenFertig.box} von ${VERBELLEN_PLAN.box.length} Stufen fertig</span></div>
        <div class="kachel"><span class="kachel__label">Mensch</span>
          <strong class="kachel__wert">${fort.mensch.fertig}/${fort.mensch.gesamt}</strong>
          <span class="kachel__sub">${fort.stufenFertig.mensch} von ${VERBELLEN_PLAN.mensch.length} Stufen fertig</span></div>
        <div class="kachel"><span class="kachel__label">Sitzungen</span>
          <strong class="kachel__wert">${kat.sitzungen}</strong>
          <span class="kachel__sub">abgeschlossen</span></div>
      </div>
      ${aktuell
        ? `<p class="karte__hint">Als Nächstes: <strong>${esc(WEGE.find((w) => w.id === aktuell.weg).label)} Stufe ${aktuell.n}</strong>
            – ${esc(aktuell.titel)} (${aktuell.fertig}/${aktuell.gesamt}).</p>`
        : '<p class="gut">Der gesamte Plan ist durchgearbeitet. 👍</p>'}
      <label class="schalter">
        <input type="checkbox" data-box-ueberspringen ${hund?.boxUebersprungen ? 'checked' : ''}>
        <span>Box-Weg für ${esc(hund?.name || 'diesen Hund')} überspringen – Mensch-Stufen sind dann nicht gesperrt</span>
      </label>
    `)}

    <div class="stufen-liste">
      ${plan
        .filter((st) => !zustand.nurOffen || !V.stufeFertig(kat.stand, zustand.weg, st.n))
        .map((st) => stufeHtml(st, kat, hund))
        .join('') || leer('Alle Stufen dieses Weges sind abgeschlossen.')}
    </div>
  </div>`;
}

function stufeHtml(st, kat, hund) {
  const weg = zustand.weg;
  const f = V.stufeFortschritt(kat.stand, weg, st.n);
  const fertig = f.fertig === f.gesamt && f.gesamt > 0;
  const frei = V.freigeschaltet(kat.stand, weg, st.n, hund);
  const offen = zustand.offeneStufe === `${weg}:${st.n}`;
  const zusatz = kat.zusatz?.[`${weg}:${st.n}`] || {};
  const zusatzListe = Object.entries(zusatz);

  return `<div class="stufe-karte${fertig ? ' stufe-karte--fertig' : ''}${frei ? '' : ' stufe-karte--gesperrt'}">
    <button type="button" class="stufe-karte__kopf" data-stufe="${weg}:${st.n}" aria-expanded="${offen}">
      <span class="stufe-karte__n">${st.n}</span>
      <span class="stufe-karte__text">
        <strong>${esc(st.title)}</strong>
        <small>${f.fertig}/${f.gesamt} Unterübungen${fertig ? ' · abgeschlossen' : ''}${frei ? '' : ' · Voraussetzungen offen'}${zusatzListe.length ? ` · ${zusatzListe.length} eigene` : ''}</small>
      </span>
      <span class="stufe-karte__balken"><span style="width:${f.gesamt ? runde((f.fertig / f.gesamt) * 100, 1) : 0}%"></span></span>
    </button>
    ${offen ? `<div class="stufe-karte__inhalt">
      ${st.items.map((text, i) => {
        const n = kat.stand[`${weg}:${st.n}:${i}`] || 0;
        const am = kat.letzteAm[`${weg}:${st.n}:${i}`];
        return `<div class="uebung${n >= V.NOETIGE_WIEDERHOLUNGEN ? ' uebung--fertig' : ''}">
          <span class="uebung__text">${esc(text)}${am ? `<small>seit ${esc(formatDatum(am))}</small>` : ''}</span>
          <span class="uebung__wdh">${[1, 2, 3].map((k) => `<span class="wdh${k <= n ? ' wdh--frueher' : ''}"></span>`).join('')}</span>
        </div>`;
      }).join('')}
      ${zusatzListe.length ? `<h3 class="unter">Eigene Übungen</h3>${zusatzListe.map(([text, d]) =>
        `<div class="uebung uebung--zusatz${d.anzahl >= V.NOETIGE_WIEDERHOLUNGEN ? ' uebung--fertig' : ''}">
          <span class="uebung__text">${esc(text)}<small>zuletzt ${esc(formatDatum(d.letzteAm))}</small></span>
          <span class="uebung__wdh">${[1, 2, 3].map((k) => `<span class="wdh${k <= d.anzahl ? ' wdh--frueher' : ''}"></span>`).join('')}</span>
        </div>`).join('')}` : ''}
    </div>` : ''}
  </div>`;
}

function binde(box, wurzel) {
  if (!box) return;
  box.addEventListener('change', async (e) => {
    const f = e.target.closest('[data-f]');
    if (f) {
      zustand[f.dataset.f] = f.value;
      zustand.offeneStufe = null;
      zeichne(wurzel);
      return;
    }
    const b = e.target.closest('[data-box-ueberspringen]');
    if (b) {
      const hund = store.get(zustand.hundId);
      if (hund) await store.put({ ...hund, boxUebersprungen: b.checked });
      toast(b.checked ? 'Box-Weg wird übersprungen.' : 'Box-Weg zählt wieder mit.');
      zeichne(wurzel);
    }
  });

  box.addEventListener('click', (e) => {
    const w = e.target.closest('[data-weg]');
    if (w) { zustand.weg = w.dataset.weg; zustand.offeneStufe = null; zeichne(wurzel); return; }
    const t = e.target.closest('[data-t]');
    if (t) { zustand[t.dataset.t] = !zustand[t.dataset.t]; zeichne(wurzel); return; }
    const s = e.target.closest('[data-stufe]');
    if (s) {
      zustand.offeneStufe = zustand.offeneStufe === s.dataset.stufe ? null : s.dataset.stufe;
      zeichne(wurzel);
    }
  });
}
