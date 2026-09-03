/** Helfer:in-Bilder – Fortschrittskatalog je Hund (4 Stufen wie im Heft). */

import * as store from '../store.js';
import * as R from '../rollen.js';
import * as S from '../schema.js';
import { esc, karte, leer, formatDatum } from '../ui.js';
import { stapel } from '../charts.js';
import * as HB from '../helferbilder.js';

const zustand = { hundId: '', nurOffen: false, nurWichtig: false, nurUngeuebt: false };

export async function render(wurzel) {
  const hunde = R.meineHunde();
  if (!zustand.hundId && hunde.length) zustand.hundId = hunde[0].id;
  zeichne(wurzel);
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  binde(wurzel.querySelector('.seite'), wurzel);
}

function html() {
  const hunde = R.meineHunde();
  if (!hunde.length) {
    return `<div class="seite">${leer(
      'Lege zuerst einen Hund an – der Fortschritt bei den Helfer:in-Bildern wird je Hund geführt.',
      '<a class="btn btn--primaer" href="#/einstellungen">Zu den Einstellungen</a>'
    )}</div>`;
  }

  const bil = HB.bilanz(zustand.hundId);

  const segmente = [
    { label: 'gemeistert', wert: bil.stufen[4], farbe: '#3c8a4f' },
    { label: 'längere Anzeige', wert: bil.stufen[3], farbe: '#7fb37f' },
    { label: 'kurze Anzeige', wert: bil.stufen[2], farbe: '#c7d9a8' },
    { label: 'kennengelernt', wert: bil.stufen[1], farbe: '#efc766' },
    { label: 'offen', wert: bil.stufen[0], farbe: 'var(--rand)' },
  ];

  let liste = S.HELFER_BILDER;
  if (zustand.nurWichtig) liste = liste.filter((x) => x.key);
  if (zustand.nurUngeuebt) liste = liste.filter((x) => !bil.stand[x.id].einsatz);
  if (zustand.nurOffen) liste = liste.filter((x) => bil.stand[x.id].stufe < (x.keineAnzeige ? 1 : 4));

  return `<div class="seite">
    <div class="seite__kopf">
      <h1>Helfer:in-Bilder</h1>
    </div>
    <p class="seite__intro">Dein Hund sollte im Laufe der Ausbildung möglichst viele und verschiedene
      Helfer:in-Bilder kennenlernen. Die als <strong>wichtig</strong> markierten Bilder gelten als besonders relevant.<br>
      <small>Stufen: ${S.BILD_STUFEN.map((s) => `<b>${s.level}</b> ${esc(s.label)}`).join(' · ')}</small></p>

    <div class="filterleiste">
      <select class="input" data-f="hundId">
        ${R.meineHunde().map((h) => `<option value="${esc(h.id)}"${zustand.hundId === h.id ? ' selected' : ''}>${esc(h.name)}</option>`).join('')}
      </select>
      <button type="button" class="chip${zustand.nurWichtig ? ' chip--an' : ''}" data-t="nurWichtig">nur wichtige</button>
      <button type="button" class="chip${zustand.nurOffen ? ' chip--an' : ''}" data-t="nurOffen">nur offene</button>
      <button type="button" class="chip${zustand.nurUngeuebt ? ' chip--an' : ''}" data-t="nurUngeuebt">
        nie im Training${bil.nieEingesetzt.length ? ` (${bil.nieEingesetzt.length})` : ''}
      </button>
    </div>

    ${karte(
      'Fortschritt',
      `${stapel(segmente, bil.gesamt)}
       <div class="ch-legende">${segmente.map((x) => `<span><i style="background:${x.farbe}"></i>${esc(x.label)} ${x.wert}</span>`).join('')}</div>
       <div class="kacheln kacheln--schlank">
         <div class="kachel"><span class="kachel__label">Aus Suchen belegt</span>
           <strong class="kachel__wert">${bil.ausSuchen}</strong>
           <span class="kachel__sub">von ${bil.gesamt} Bildern</span></div>
         <div class="kachel"><span class="kachel__label">Nie im Training</span>
           <strong class="kachel__wert">${bil.nieEingesetzt.length}</strong>
           <span class="kachel__sub">${bil.wichtigOffen.length} davon wichtig</span></div>
         <div class="kachel"><span class="kachel__label">Gemeistert</span>
           <strong class="kachel__wert">${bil.gemeistert}</strong>
           <span class="kachel__sub">von Hand bewertet</span></div>
       </div>
       ${bil.wichtigOffen.length
         ? `<p class="karte__hint">Wichtige Bilder ohne Einsatz: ${bil.wichtigOffen.map((x) => esc(x.label)).join(', ')}.</p>`
         : '<p class="gut">Alle als wichtig markierten Bilder waren schon im Training. 👍</p>'}`,
      { hint: 'Ein Bild gilt als kennengelernt, sobald es in einer abgeschlossenen Suche als Versteckperson vorkam. Die Stufen 2 bis 4 bleiben deine Einschätzung.' }
    )}

    <div class="bilder-liste">
      <div class="bilder-kopf">
        <span>Helfer:in-Bild</span>
        <span class="bild-zeile__stufen">
          ${S.BILD_STUFEN.map((s) => `<b title="${esc(s.label)}">${s.level}</b>`).join('')}
        </span>
      </div>
      ${liste.map((x) => zeile(x, bil.stand[x.id])).join('')}
      ${!liste.length ? leer('Keine Bilder passen zum Filter.') : ''}
    </div>
  </div>`;
}

function zeile(bild, e) {
  const level = e.stufe;
  const stufen = bild.keineAnzeige ? [S.BILD_STUFEN[0]] : S.BILD_STUFEN;
  const ein = e.einsatz;

  return `<div class="bild-zeile${bild.key ? ' bild-zeile--key' : ''}${ein ? '' : ' bild-zeile--ungeuebt'}">
    <div class="bild-zeile__label">
      <span>${esc(bild.label)}</span>
      <small>
        ${bild.key ? '<em class="merkmal">wichtig</em>' : ''}
        ${bild.keineAnzeige ? '<em class="merkmal merkmal--grau">korrekt = keine Anzeige</em>' : ''}
        ${ein
          ? `<em class="merkmal merkmal--suche">${ein.anzahl}× in Suchen</em>
             <em class="merkmal merkmal--grau">zuletzt ${esc(formatDatum(ein.letzteAm))}</em>
             ${ein.gefunden + ein.nichtGefunden
               ? `<em class="merkmal merkmal--grau">${ein.gefunden}/${ein.gefunden + ein.nichtGefunden} gefunden</em>`
               : ''}`
          : '<em class="merkmal merkmal--offen">noch nie im Training</em>'}
      </small>
    </div>
    <div class="bild-zeile__stufen">
      ${stufen
        .map((st) => {
          const an = level >= st.level;
          const nurAusSuche = st.level === 1 && e.ausSuche && !e.vonHand;
          return `<button type="button" class="stufe${an ? ' stufe--an' : ''}${nurAusSuche ? ' stufe--auto' : ''}"
            data-bild="${esc(bild.id)}" data-level="${st.level}"
            title="${esc(st.label)}${nurAusSuche ? ' – aus einer Suche übernommen' : ''}"
            aria-label="${esc(bild.label)} – ${esc(st.label)}" aria-pressed="${an}"></button>`;
        })
        .join('')}
    </div>
  </div>`;
}

function binde(box, wurzel) {
  if (!box) return;
  box.addEventListener('change', (e) => {
    const el = e.target.closest('[data-f]');
    if (!el) return;
    zustand[el.dataset.f] = el.value;
    zeichne(wurzel);
  });

  box.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-t]');
    if (t) {
      zustand[t.dataset.t] = !zustand[t.dataset.t];
      zeichne(wurzel);
      return;
    }
    const b = e.target.closest('[data-bild]');
    if (!b) return;
    const bildId = b.dataset.bild;
    const level = Number(b.dataset.level);
    const id = `bild:${zustand.hundId}:${bildId}`;
    const alt = store.get(id)?.level || 0;
    await store.put({
      id,
      type: 'helferbild',
      hundId: zustand.hundId,
      bildId,
      // Nochmal auf dieselbe Stufe tippen nimmt die Bewertung zurueck.
      // Stufe 1 aus einer Suche bleibt davon unberuehrt – sie ist belegt.
      level: alt === level ? level - 1 : level,
    });
    zeichne(wurzel);
  });
}
