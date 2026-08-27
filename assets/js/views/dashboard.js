/** Auswertung aller Suchen – ersetzt die "Übersichtsgraphen vorne im Heft". */

import * as store from '../store.js';
import * as S from '../schema.js';
import { esc, karte, leer, formatNote, formatMinuten, runde, skalaFarbe, formatDatum } from '../ui.js';
import { linienDiagramm, balken, stapel, sparkline } from '../charts.js';

const filter = { hundId: '', zeitraum: 'alle', kriterium: 'gruppen' };

const FARBE = { team: '#3c8a4f', hund: '#1d6fb8', hf: '#c2761b' };
const GRUPPEN_LABEL = { team: 'Team', hund: 'Hund', hf: 'Hundeführer:in' };

export async function render(wurzel) {
  zeichne(wurzel);
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  binde(wurzel.querySelector('.seite'), wurzel);
}

function imZeitraum(s) {
  if (filter.zeitraum === 'alle') return true;
  const tage = Number(filter.zeitraum);
  const grenze = new Date(Date.now() - tage * 86400000).toISOString().slice(0, 10);
  return (s.datum || '') >= grenze;
}

function datensatz() {
  return store
    .suchen()
    .filter((s) => (!filter.hundId || s.hundId === filter.hundId) && imZeitraum(s))
    .sort((a, b) => (a.datum || '').localeCompare(b.datum || ''));
}

function html() {
  const alle = store.suchen();
  if (!alle.length) {
    return `<div class="seite">${leer(
      'Sobald die erste Suche dokumentiert ist, erscheinen hier die Auswertungen.',
      '<a class="btn btn--primaer" href="#/suche/neu">Erste Suche anlegen</a>'
    )}</div>`;
  }

  const daten = datensatz();
  const hunde = store.hunde();

  return `<div class="seite">
    <div class="seite__kopf">
      <h1>Dashboard</h1>
      <a class="btn btn--still" href="#/suche/neu">+ Neue Suche</a>
    </div>

    <div class="filterleiste">
      <select class="input" data-f="hundId">
        <option value="">Alle Hunde</option>
        ${hunde.map((h) => `<option value="${esc(h.id)}"${filter.hundId === h.id ? ' selected' : ''}>${esc(h.name)}</option>`).join('')}
      </select>
      <select class="input" data-f="zeitraum">
        ${[
          ['alle', 'Gesamter Zeitraum'],
          ['30', 'Letzte 30 Tage'],
          ['90', 'Letzte 3 Monate'],
          ['365', 'Letztes Jahr'],
        ]
          .map(([v, l]) => `<option value="${v}"${filter.zeitraum === v ? ' selected' : ''}>${l}</option>`)
          .join('')}
      </select>
    </div>

    ${daten.length ? inhalt(daten) : leer('Für diesen Filter gibt es keine Suchen.')}
  </div>`;
}

function inhalt(daten) {
  return kacheln(daten) + verlauf(daten) + kriterienBloecke(daten) + problemBlock(daten) + rahmenBlock(daten) + bilderBlock(daten) + tabelle(daten);
}

/* -------------------- Kennzahlen -------------------- */

function kacheln(daten) {
  const scores = daten.map(S.gesamtScore).filter((v) => v != null);
  const zeiten = daten.map((s) => Number(s.suchzeitMin)).filter((v) => v > 0);

  const helfer = daten.flatMap((s) => s.helfer || []);
  const bewertet = helfer.filter((h) => h.gefunden === true || h.gefunden === false);
  const funde = helfer.filter((h) => h.gefunden === true);
  const radien = funde.map((h) => Number(h.radiusM)).filter((v) => v > 0);
  const zeitBis = funde.map((h) => Number(h.zeitBisMin)).filter((v) => v > 0);
  const fehlanzeigen = daten.filter((s) => s.probleme?.fehlanzeige).length;

  const k = (label, wert, sub, spark) => `<div class="kachel">
    <span class="kachel__label">${esc(label)}</span>
    <strong class="kachel__wert">${wert}</strong>
    ${sub ? `<span class="kachel__sub">${esc(sub)}</span>` : ''}
    ${spark || ''}
  </div>`;

  return `<div class="kacheln">
    ${k('Suchen', daten.length, zeitraumText(daten))}
    ${k('Ø Gesamtnote', formatNote(S.mittelwert(scores)), scores.length ? `aus ${scores.length} bewerteten Suchen` : 'noch nicht bewertet', sparkline(scores.slice(-14), 'var(--gruen)'))}
    ${k('Trefferquote', bewertet.length ? `${Math.round((funde.length / bewertet.length) * 100)} %` : '—', `${funde.length} von ${bewertet.length} Versteckpersonen`)}
    ${k('Ø Zeit bis Fund', zeitBis.length ? formatMinuten(S.mittelwert(zeitBis)) : '—', zeitBis.length ? `${zeitBis.length} Funde mit Zeitangabe` : '')}
    ${k('Ø Radius bei Fund', radien.length ? `${runde(S.mittelwert(radien), 0)} m` : '—', 'Abstand Hund ↔ Hundeführer:in')}
    ${k('Gesamte Suchzeit', zeiten.length ? formatMinuten(zeiten.reduce((a, b) => a + b, 0)) : '—', zeiten.length ? `Ø ${formatMinuten(S.mittelwert(zeiten))} pro Suche` : '')}
    ${k('Suchen mit Fehlanzeige', fehlanzeigen, daten.length ? `${Math.round((fehlanzeigen / daten.length) * 100)} % der Suchen` : '')}
  </div>`;
}

function zeitraumText(daten) {
  if (!daten.length) return '';
  return `${formatDatum(daten[0].datum)} – ${formatDatum(daten[daten.length - 1].datum)}`;
}

/* -------------------- Leistungsverlauf -------------------- */

function verlauf(daten) {
  const serien = ['team', 'hund', 'hf'].map((g) => ({
    name: GRUPPEN_LABEL[g],
    farbe: FARBE[g],
    punkte: daten
      .map((s) => {
        const v = S.mittelwert(S.werteDerGruppe(s, g));
        return v == null ? null : { x: s.datum, y: v };
      })
      .filter(Boolean),
  }));

  const alleKriterien = [
    ...S.TEAM_KRITERIEN.map((k) => ({ ...k, gruppe: 'team' })),
    ...S.HUND_KRITERIEN.map((k) => ({ ...k, gruppe: 'hund' })),
    ...S.HF_KRITERIEN.map((k) => ({ ...k, gruppe: 'hf' })),
  ];

  let diagramm;
  if (filter.kriterium === 'gruppen') {
    diagramm = linienDiagramm(serien);
  } else {
    const [gruppe, id] = filter.kriterium.split(':');
    const k = alleKriterien.find((x) => x.gruppe === gruppe && x.id === id);
    diagramm = linienDiagramm([
      {
        name: k ? k.label : id,
        farbe: FARBE[gruppe],
        punkte: daten.map((s) => ({ x: s.datum, y: s[gruppe]?.[id] })).filter((p) => typeof p.y === 'number'),
      },
    ]);
  }

  const auswahl = `<select class="input input--schlank" data-f="kriterium">
    <option value="gruppen"${filter.kriterium === 'gruppen' ? ' selected' : ''}>Alle drei Bereiche</option>
    ${['team', 'hund', 'hf']
      .map(
        (g) => `<optgroup label="${esc(GRUPPEN_LABEL[g])}">${alleKriterien
          .filter((k) => k.gruppe === g)
          .map(
            (k) => `<option value="${g}:${k.id}"${filter.kriterium === `${g}:${k.id}` ? ' selected' : ''}>${esc(k.label)}</option>`
          )
          .join('')}</optgroup>`
      )
      .join('')}
  </select>`;

  return karte('Leistungsentwicklung', diagramm, {
    aktion: `<span class="karte__werkzeug">${auswahl}</span>`,
    hint: 'Ersetzt die Übersichtsgraphen vorne im Heft – jede Suche ist ein Datenpunkt.',
  });
}

/* -------------------- Kriterien im Detail -------------------- */

function kriterienBloecke(daten) {
  const block = (gruppe, kriterien, titel) => {
    const items = kriterien
      .map((k) => {
        const werte = daten.map((s) => s[gruppe]?.[k.id]).filter((v) => typeof v === 'number' && v > 0);
        return { label: k.label, wert: S.mittelwert(werte) || 0, anzahl: werte.length };
      })
      .filter((i) => i.anzahl > 0)
      .sort((a, b) => a.wert - b.wert);

    // Zusätzlich eigene Kriterien mitzählen
    const eigen = {};
    daten.forEach((s) =>
      (s.eigeneKriterien?.[gruppe] || []).forEach((k) => {
        if (!k.label || typeof k.wert !== 'number') return;
        (eigen[k.label] ||= []).push(k.wert);
      })
    );
    Object.entries(eigen).forEach(([label, werte]) =>
      items.push({ label: label + ' *', wert: S.mittelwert(werte), anzahl: werte.length })
    );
    items.sort((a, b) => a.wert - b.wert);

    if (!items.length) return karte(titel, leer('Noch keine Bewertungen erfasst.'));
    return karte(
      titel,
      balken(
        items.map((i) => ({ label: i.label, wert: i.wert, anzeige: `${formatNote(i.wert)}  (${i.anzahl})` })),
        { max: 5, skalaFarben: true }
      ),
      { hint: 'Durchschnitt je Kriterium, schwächstes zuerst. In Klammern: Anzahl Bewertungen.' }
    );
  };

  return `<div class="raster raster--2 raster--karten">
    ${block('team', S.TEAM_KRITERIEN, 'Team: Verlauf der Suche')}
    ${block('hund', S.HUND_KRITERIEN, 'Verhalten Hund')}
    ${block('hf', S.HF_KRITERIEN, 'Verhalten Hundeführer:in')}
    ${radiusBlock(daten)}
  </div>`;
}

function radiusBlock(daten) {
  const zaehler = {};
  daten.forEach((s) => {
    if (s.radiusTyp) zaehler[s.radiusTyp] = (zaehler[s.radiusTyp] || 0) + 1;
  });
  const anzeigen = {};
  daten.flatMap((s) => s.helfer || []).forEach((h) => {
    if (h.anzeige) anzeigen[h.anzeige] = (anzeigen[h.anzeige] || 0) + 1;
  });

  const rTyp = S.RADIUS_TYPEN.filter((r) => zaehler[r.id]).map((r) => ({ label: r.label, wert: zaehler[r.id] }));
  const aArt = S.ANZEIGE_ARTEN.filter((a) => anzeigen[a.id]).map((a) => ({ label: a.label, wert: anzeigen[a.id] }));

  return karte(
    'Radius & Anzeigeverhalten',
    `${rTyp.length ? `<h3 class="unter">Radius (Einschätzung)</h3>${balken(rTyp)}` : ''}
     ${aArt.length ? `<h3 class="unter">Art der Anzeige</h3>${balken(aArt, { farbe: 'var(--blau)' })}` : ''}
     ${!rTyp.length && !aArt.length ? leer('Noch keine Angaben.') : ''}`
  );
}

/* -------------------- Problemverhalten -------------------- */

function problemBlock(daten) {
  const items = S.PROBLEMVERHALTEN.map((p) => ({
    label: p.label,
    wert: daten.filter((s) => s.probleme?.[p.id]).length,
  }))
    .filter((i) => i.wert > 0)
    .sort((a, b) => b.wert - a.wert);

  const inhalt = items.length
    ? balken(
        items.map((i) => ({ ...i, farbe: '#d2694f', anzeige: `${i.wert}× (${Math.round((i.wert / daten.length) * 100)} %)` })),
        { max: daten.length }
      )
    : `<p class="gut">Kein Problemverhalten dokumentiert. 👍</p>`;

  return karte('Problemverhalten – Häufigkeit', inhalt, {
    hint: `Bezogen auf ${daten.length} Suchen im gewählten Zeitraum.`,
  });
}

/* -------------------- Rahmenbedingungen -------------------- */

function rahmenBlock(daten) {
  const zaehle = (feld, katalog) => {
    const z = {};
    daten.forEach((s) => (s[feld] || []).forEach((id) => (z[id] = (z[id] || 0) + 1)));
    return katalog.filter((k) => z[k.id]).map((k) => ({ label: k.label, wert: z[k.id] })).sort((a, b) => b.wert - a.wert);
  };

  const gelaende = zaehle('gelaende', S.GELAENDE);
  const wetter = [...zaehle('temperatur', S.TEMPERATUR), ...zaehle('wind', S.WIND), ...zaehle('niederschlag', S.NIEDERSCHLAG), ...zaehle('licht', S.LICHT)];

  // Wie gut läuft es unter welchen Bedingungen?
  const nachBedingung = [];
  [...S.GELAENDE, ...S.TEMPERATUR, ...S.WIND, ...S.NIEDERSCHLAG, ...S.LICHT].forEach((k) => {
    const treffer = daten.filter((s) =>
      ['gelaende', 'temperatur', 'wind', 'niederschlag', 'licht'].some((f) => (s[f] || []).includes(k.id))
    );
    const scores = treffer.map(S.gesamtScore).filter((v) => v != null);
    if (scores.length >= 2) nachBedingung.push({ label: `${k.label} (${scores.length})`, wert: S.mittelwert(scores) });
  });
  nachBedingung.sort((a, b) => a.wert - b.wert);

  return `<div class="raster raster--2 raster--karten">
    ${karte('Trainierte Bedingungen', `
      ${gelaende.length ? `<h3 class="unter">Gelände</h3>${balken(gelaende, { max: daten.length })}` : ''}
      ${wetter.length ? `<h3 class="unter">Wetter / Licht</h3>${balken(wetter, { max: daten.length, farbe: 'var(--blau)' })}` : ''}
      ${!gelaende.length && !wetter.length ? leer('Noch keine Bedingungen erfasst.') : ''}
    `, { hint: 'Zeigt Lücken im Trainingsplan – welche Bedingungen fehlen noch?' })}
    ${karte('Leistung nach Bedingung', nachBedingung.length
      ? balken(nachBedingung.map((i) => ({ ...i, anzeige: formatNote(i.wert) })), { max: 5, skalaFarben: true })
      : leer('Ab zwei Suchen je Bedingung erscheint hier der Vergleich.'),
      { hint: 'Ø Gesamtnote je Bedingung, schwächste zuerst. In Klammern: Anzahl Suchen.' })}
  </div>`;
}

/* -------------------- Helfer:in-Bilder -------------------- */

function bilderBlock(daten) {
  const hundId = filter.hundId;
  const fortschritt = store.bildFortschritt(hundId);
  const stufen = [0, 0, 0, 0, 0];
  S.HELFER_BILDER.forEach((b) => {
    const lvl = fortschritt[b.id]?.level || 0;
    stufen[lvl] = (stufen[lvl] || 0) + 1;
  });

  const trainiert = {};
  daten.flatMap((s) => s.helfer || []).forEach((h) => {
    if (h.bildId) trainiert[h.bildId] = (trainiert[h.bildId] || 0) + 1;
  });

  const nieTrainiert = S.HELFER_BILDER.filter((b) => !trainiert[b.id] && !(fortschritt[b.id]?.level > 0));
  const wichtigeOffen = nieTrainiert.filter((b) => b.key);

  const segmente = [
    { label: 'gemeistert', wert: stufen[4], farbe: '#3c8a4f' },
    { label: 'längere Anzeige', wert: stufen[3], farbe: '#7fb37f' },
    { label: 'kurze Anzeige', wert: stufen[2], farbe: '#c7d9a8' },
    { label: 'kennengelernt', wert: stufen[1], farbe: '#efc766' },
    { label: 'offen', wert: stufen[0], farbe: 'var(--rand)' },
  ];

  const top = Object.entries(trainiert)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, n]) => ({ label: S.BILDER_BY_ID[id]?.label || id, wert: n }));

  return karte(
    'Helfer:in-Bilder',
    `<div class="bilder-uebersicht">
      ${stapel(segmente, S.HELFER_BILDER.length)}
      <div class="ch-legende">${segmente.map((s) => `<span><i style="background:${s.farbe}"></i>${esc(s.label)} ${s.wert}</span>`).join('')}</div>
    </div>
    ${top.length ? `<h3 class="unter">Am häufigsten trainiert</h3>${balken(top, { farbe: 'var(--gruen)' })}` : ''}
    ${wichtigeOffen.length
      ? `<h3 class="unter">Wichtige Bilder noch offen (${wichtigeOffen.length})</h3>
         <div class="offen-liste">${wichtigeOffen.map((b) => `<span class="tag tag--warn">${esc(b.label)}</span>`).join('')}</div>`
      : `<p class="gut">Alle als besonders relevant markierten Bilder wurden begonnen. 👍</p>`}
    <p class="karte__hint">Insgesamt noch nicht begonnen: ${nieTrainiert.length} von ${S.HELFER_BILDER.length}.
      <a href="#/bilder">Zur Checkliste →</a></p>`,
    { hint: hundId ? `Fortschritt für ${store.get(hundId)?.name || ''}` : 'Fortschritt über alle Hunde – für einzelne Hunde oben filtern.' }
  );
}

/* -------------------- Tabelle -------------------- */

function tabelle(daten) {
  const zeilen = [...daten].reverse().slice(0, 25);
  return karte(
    'Einzelne Suchen',
    `<div class="tabelle-scroll"><table class="tabelle">
      <thead><tr>
        <th>Datum</th><th>Ort</th><th>Hund</th><th>Zeit</th><th>Funde</th>
        <th>Team</th><th>Hund</th><th>HF</th><th>Gesamt</th>
      </tr></thead>
      <tbody>${zeilen
        .map((s) => {
          const g = S.gesamtScore(s);
          const funde = (s.helfer || []).filter((h) => h.gefunden === true).length;
          const gesamt = (s.helfer || []).filter((h) => h.gefunden != null).length;
          const zelle = (v) => (v == null ? '<td class="t-leer">—</td>' : `<td><span class="note note--klein" style="--n:${skalaFarbe(v)}">${formatNote(v)}</span></td>`);
          return `<tr onclick="location.hash='#/suche/${esc(s.id)}'">
            <td>${esc(formatDatum(s.datum))}</td>
            <td>${esc(s.ort || '—')}</td>
            <td>${esc(store.get(s.hundId)?.name || '—')}</td>
            <td>${esc(s.suchzeitMin ? formatMinuten(s.suchzeitMin) : '—')}</td>
            <td>${gesamt ? `${funde}/${gesamt}` : '—'}</td>
            ${zelle(S.mittelwert(S.werteDerGruppe(s, 'team')))}
            ${zelle(S.mittelwert(S.werteDerGruppe(s, 'hund')))}
            ${zelle(S.mittelwert(S.werteDerGruppe(s, 'hf')))}
            ${zelle(g)}
          </tr>`;
        })
        .join('')}</tbody>
    </table></div>`,
    { hint: daten.length > 25 ? `Neueste 25 von ${daten.length} Suchen.` : '' }
  );
}

function binde(box, wurzel) {
  if (!box) return;
  box.addEventListener('change', (e) => {
    const el = e.target.closest('[data-f]');
    if (!el) return;
    filter[el.dataset.f] = el.value;
    zeichne(wurzel);
  });
}
