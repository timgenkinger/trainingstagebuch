/** Helfer:in-Bilder – Fortschrittskatalog je Hund (4 Stufen wie im Heft). */

import * as store from '../store.js';
import * as S from '../schema.js';
import { esc, karte, leer } from '../ui.js';
import { stapel } from '../charts.js';

const zustand = { hundId: '', nurOffen: false, nurWichtig: false };

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
      'Lege zuerst einen Hund an – der Fortschritt bei den Helfer:in-Bildern wird je Hund geführt.',
      '<a class="btn btn--primaer" href="#/einstellungen">Zu den Einstellungen</a>'
    )}</div>`;
  }

  const fortschritt = store.bildFortschritt(zustand.hundId);
  const stufenZaehler = [0, 0, 0, 0, 0];
  S.HELFER_BILDER.forEach((b) => stufenZaehler[fortschritt[b.id]?.level || 0]++);

  const segmente = [
    { label: 'gemeistert', wert: stufenZaehler[4], farbe: '#3c8a4f' },
    { label: 'längere Anzeige', wert: stufenZaehler[3], farbe: '#7fb37f' },
    { label: 'kurze Anzeige', wert: stufenZaehler[2], farbe: '#c7d9a8' },
    { label: 'kennengelernt', wert: stufenZaehler[1], farbe: '#efc766' },
    { label: 'offen', wert: stufenZaehler[0], farbe: 'var(--rand)' },
  ];

  // Wie oft wurde ein Bild bereits in einer Suche eingesetzt?
  const einsaetze = {};
  store.suchen().forEach((s) => {
    if (zustand.hundId && s.hundId !== zustand.hundId) return;
    (s.helfer || []).forEach((h) => {
      if (h.bildId) einsaetze[h.bildId] = (einsaetze[h.bildId] || 0) + 1;
    });
  });

  let liste = S.HELFER_BILDER;
  if (zustand.nurWichtig) liste = liste.filter((b) => b.key);
  if (zustand.nurOffen) liste = liste.filter((b) => !(fortschritt[b.id]?.level >= (b.keineAnzeige ? 1 : 4)));

  return `<div class="seite">
    <div class="seite__kopf">
      <h1>Helfer:in-Bilder</h1>
    </div>
    <p class="seite__intro">Dein Hund sollte im Laufe der Ausbildung möglichst viele und verschiedene
      Helfer:in-Bilder kennenlernen. Die als <strong>wichtig</strong> markierten Bilder gelten als besonders relevant.<br>
      <small>Stufen: ${S.BILD_STUFEN.map((s) => `<b>${s.level}</b> ${esc(s.label)}`).join(' · ')}</small></p>

    <div class="filterleiste">
      <select class="input" data-f="hundId">
        ${store.hunde().map((h) => `<option value="${esc(h.id)}"${zustand.hundId === h.id ? ' selected' : ''}>${esc(h.name)}</option>`).join('')}
      </select>
      <button type="button" class="chip${zustand.nurWichtig ? ' chip--an' : ''}" data-t="nurWichtig">nur wichtige</button>
      <button type="button" class="chip${zustand.nurOffen ? ' chip--an' : ''}" data-t="nurOffen">nur offene</button>
    </div>

    ${karte(
      'Fortschritt',
      `${stapel(segmente, S.HELFER_BILDER.length)}
       <div class="ch-legende">${segmente.map((s) => `<span><i style="background:${s.farbe}"></i>${esc(s.label)} ${s.wert}</span>`).join('')}</div>
       <p class="karte__hint">${stufenZaehler[4]} von ${S.HELFER_BILDER.length} Bildern gemeistert.</p>`
    )}

    <div class="bilder-liste">
      <div class="bilder-kopf">
        <span>Helfer:in-Bild</span>
        <span class="bild-zeile__stufen">
          ${S.BILD_STUFEN.map((s) => `<b title="${esc(s.label)}">${s.level}</b>`).join('')}
        </span>
      </div>
      ${liste.map((b) => zeile(b, fortschritt[b.id], einsaetze[b.id] || 0)).join('')}
      ${!liste.length ? leer('Keine Bilder passen zum Filter.') : ''}
    </div>
  </div>`;
}

function zeile(bild, eintrag, einsaetze) {
  const level = eintrag?.level || 0;
  const stufen = bild.keineAnzeige ? [S.BILD_STUFEN[0]] : S.BILD_STUFEN;
  return `<div class="bild-zeile${bild.key ? ' bild-zeile--key' : ''}">
    <div class="bild-zeile__label">
      <span>${esc(bild.label)}</span>
      <small>
        ${bild.key ? '<em class="merkmal">wichtig</em>' : ''}
        ${bild.keineAnzeige ? '<em class="merkmal merkmal--grau">korrekt = keine Anzeige</em>' : ''}
        ${einsaetze ? `<em class="merkmal merkmal--grau">${einsaetze}× im Training</em>` : ''}
      </small>
    </div>
    <div class="bild-zeile__stufen">
      ${stufen
        .map(
          (s) => `<button type="button" class="stufe${level >= s.level ? ' stufe--an' : ''}"
            data-bild="${esc(bild.id)}" data-level="${s.level}" title="${esc(s.label)}"
            aria-label="${esc(bild.label)} – ${esc(s.label)}" aria-pressed="${level >= s.level}"></button>`
        )
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
      level: alt === level ? level - 1 : level,
    });
    zeichne(wurzel);
  });
}
