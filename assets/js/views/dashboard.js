/** Auswertung aller Suchen – ersetzt die "Übersichtsgraphen vorne im Heft". */

import * as store from '../store.js';
import * as R from '../rollen.js';
import * as S from '../schema.js';
import { esc, karte, leer, formatNote, formatMinuten, runde, skalaFarbe, formatDatum } from '../ui.js';
import { linienDiagramm, balken, stapel, sparkline } from '../charts.js';
import * as V from '../verbellen.js';
import * as HB from '../helferbilder.js';
import { VERBELLEN_PLAN, WEGE } from '../verbellen-plan.js';

const filter = { hundId: '', zeitraum: 'alle', kriterium: 'gruppen', mitEntwuerfen: false, sparte: '' };

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
  const sichtbar = R.sichtbareHundIds();
  return R.filtereDokumente(store.suchen())
    .filter((s) => (filter.mitEntwuerfen || S.istAbgeschlossen(s))
      && (!filter.hundId || s.hundId === filter.hundId)
      && (!filter.sparte || S.sparteVon(s) === filter.sparte)
      && imZeitraum(s))
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
  const hunde = R.meineHunde();
  const entwuerfe = alle.filter((s) => !S.istAbgeschlossen(s)).length;
  const freie = store.freieDokus().filter((d) => S.istAbgeschlossen(d)).length;

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
      <select class="input" data-f="sparte">
        <option value="">Beide Sparten</option>
        ${S.SPARTEN.map((x) => `<option value="${x.id}"${filter.sparte === x.id ? ' selected' : ''}>nur ${esc(x.label)}</option>`).join('')}
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
      ${entwuerfe ? `<button type="button" class="chip${filter.mitEntwuerfen ? ' chip--an' : ''}" data-t="mitEntwuerfen">
        ${entwuerfe} Entwurf/Entwürfe einbeziehen</button>` : ''}
    </div>

    ${freie ? `<p class="karte__hint">${freie} freie Dokumentation(en) sind hier nicht enthalten –
      sie tragen keine Bewertungen. <a href="#/suchen">In der Übersicht ansehen →</a></p>` : ''}
    ${daten.length ? inhalt(daten) : leer('Für diesen Filter gibt es keine abgeschlossenen Suchen.')}
  </div>`;
}

function inhalt(daten) {
  return verbellenBlock() + versteckBlock(daten) + kacheln(daten) + verlauf(daten) + kriterienBloecke(daten) + problemBlock(daten) + rahmenBlock(daten) + bilderBlock(daten) + tabelle(daten);
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
  const warten = daten.map((s) => Number(s.wartezeitAutoMin)).filter((v) => v > 0);

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
    ${k('Ø Wartezeit im Auto', warten.length ? formatMinuten(S.mittelwert(warten)) : '—',
        warten.length ? `längste ${formatMinuten(Math.max(...warten))}` : 'nicht erfasst')}
  </div>`;
}

function zeitraumText(daten) {
  if (!daten.length) return '';
  return `${formatDatum(daten[0].datum)} – ${formatDatum(daten[daten.length - 1].datum)}`;
}

/* -------------------- Verbellen -------------------- */

/**
 * Verbellen-Stand im Dashboard. Ohne Hundefilter erscheint eine Zeile je Hund,
 * damit die Übersicht über die ganze Staffel auf einen Blick da ist.
 */
function verbellenBlock() {
  const hunde = filter.hundId ? [store.get(filter.hundId)].filter(Boolean) : R.meineHunde();
  if (!hunde.length) return '';

  const zeilen = hunde.map((h) => {
    const kat = V.katalog(h.id);
    const f = V.fortschritt(kat.stand, h);
    const aktuell = V.aktuelleStufe(kat.stand, h);
    const letzte = store.verbellenSitzungen().find((s) => s.hundId === h.id && S.istAbgeschlossen(s));
    return { hund: h, f, aktuell, kat, letzte };
  });

  const etwasVorhanden = zeilen.some((z) => z.kat.sitzungen > 0);

  return karte(
    'Verbellen',
    etwasVorhanden
      ? `<div class="verbellen-uebersicht">
          ${zeilen.map((z) => `<div class="vb-zeile">
            <div class="vb-zeile__kopf">
              <strong>${esc(z.hund.name)}</strong>
              <span class="vb-zeile__wert">${z.f.fertig} / ${z.f.gesamt}
                <small>${Math.round(z.f.anteil * 100)} %</small></span>
            </div>
            <span class="fortschritt-balken"><span style="width:${runde(z.f.anteil * 100, 1)}%"></span></span>
            <div class="vb-zeile__zeile2">
              <span class="tag">Box ${z.f.stufenFertig.box}/${VERBELLEN_PLAN.box.length} Stufen</span>
              <span class="tag">Mensch ${z.f.stufenFertig.mensch}/${VERBELLEN_PLAN.mensch.length} Stufen</span>
              <span class="tag">${z.kat.sitzungen} Sitzung(en)</span>
              ${z.letzte ? `<span class="tag">zuletzt ${esc(formatDatum(z.letzte.datum))}</span>` : ''}
              ${z.hund.boxUebersprungen ? '<span class="tag">Box übersprungen</span>' : ''}
            </div>
            ${z.aktuell
              ? `<p class="vb-zeile__naechste">Als Nächstes: <strong>${esc(WEGE.find((w) => w.id === z.aktuell.weg).label)} ${z.aktuell.n}</strong>
                 – ${esc(z.aktuell.titel)} (${z.aktuell.fertig}/${z.aktuell.gesamt})</p>`
              : '<p class="vb-zeile__naechste gut">Plan vollständig durchgearbeitet 👍</p>'}
          </div>`).join('')}
        </div>
        <p class="karte__hint"><a href="#/verbellen">Zum vollständigen Fortschritt →</a></p>`
      : `<p class="karte__hint">Noch keine abgeschlossene Verbellen-Sitzung.
         <a href="#/verbellen-sitzung/neu">Erste Sitzung anlegen →</a></p>`,
    { hint: `Abgeleitet aus den Sitzungen · ${V.NOETIGE_WIEDERHOLUNGEN} gelungene Wiederholungen je Unterübung` }
  );
}

/* -------------------- Schwierigkeit der Verstecke -------------------- */

/** Farben ohne Wertung: zunehmende Schwere, kein Ampelschema. */
const VERSTECK_FARBEN = { leicht: '#c3cad3', mittel: '#8b95a2', schwer: '#4b5560' };

/**
 * Zählt die Verstecke einer Sammlung von Suchen je Schwierigkeit.
 * @returns {Object} id -> { anzahl, letzteAm }
 */
function versteckZaehlung(suchen, hundId) {
  const z = {};
  S.VERSTECK_SCHWIERIGKEIT.forEach((k) => (z[k.id] = { anzahl: 0, letzteAm: null }));
  suchen
    .filter((s) => !hundId || s.hundId === hundId)
    .forEach((s) => {
      (s.helfer || []).forEach((h) => {
        if (!h.versteck || !z[h.versteck]) return;
        z[h.versteck].anzahl++;
        if (!z[h.versteck].letzteAm || (s.datum || '') > z[h.versteck].letzteAm) {
          z[h.versteck].letzteAm = s.datum;
        }
      });
    });
  return z;
}

/**
 * Verteilung der Versteckschwierigkeit je Hund.
 * Die Anzahl bezieht sich auf den gewählten Zeitraum, das Datum dagegen auf
 * alle abgeschlossenen Suchen – "wann zuletzt" wäre sonst vom Filter abhängig
 * und beantwortete die eigentliche Frage nicht.
 */
function versteckBlock(daten) {
  const hunde = filter.hundId ? [store.get(filter.hundId)].filter(Boolean) : R.meineHunde();
  if (!hunde.length) return '';

  const alleAbgeschlossenen = R.filtereDokumente(store.suchen()).filter((x) => S.istAbgeschlossen(x));

  const zeilen = hunde.map((h) => ({
    hund: h,
    imZeitraum: versteckZaehlung(daten, h.id),
    gesamt: versteckZaehlung(alleAbgeschlossenen, h.id),
  }));

  const etwasDa = zeilen.some((z) => Object.values(z.gesamt).some((x) => x.anzahl > 0));
  if (!etwasDa) {
    return karte('Schwierigkeit der Verstecke',
      `<p class="karte__hint">Noch keine Versteckschwierigkeit erfasst. Sie wird je Versteckperson
        in der Trümmersuche eingetragen (leicht, mittel, schwer).</p>`);
  }

  return karte('Schwierigkeit der Verstecke', `
    <div class="verstecke">
      ${zeilen.map((z) => {
        const summe = Object.values(z.imZeitraum).reduce((n, x) => n + x.anzahl, 0);
        return `<div class="vs-zeile">
          <div class="vs-zeile__kopf">
            <strong>${esc(z.hund.name)}</strong>
            <span class="vs-zeile__summe">${summe} Versteck(e) im Zeitraum</span>
          </div>
          ${summe
            ? stapel(S.VERSTECK_SCHWIERIGKEIT.map((k) => ({
                label: k.label, wert: z.imZeitraum[k.id].anzahl, farbe: VERSTECK_FARBEN[k.id],
              })), summe)
            : '<p class="karte__hint">im gewählten Zeitraum keine</p>'}
          <table class="vs-tabelle">
            <thead><tr><th>Schwierigkeit</th><th>Anzahl</th><th>zuletzt</th></tr></thead>
            <tbody>
              ${S.VERSTECK_SCHWIERIGKEIT.map((k) => `<tr>
                <td><span class="vs-punkt" style="background:${VERSTECK_FARBEN[k.id]}"></span>${esc(k.label)}</td>
                <td class="vs-zahl">${z.imZeitraum[k.id].anzahl}</td>
                <td>${z.gesamt[k.id].letzteAm
                  ? esc(formatDatum(z.gesamt[k.id].letzteAm))
                  : '<span class="vs-nie">noch nie</span>'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      }).join('')}
    </div>
  `, { hint: 'Anzahl im gewählten Zeitraum, Datum über alle abgeschlossenen Suchen.' });
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
    ...vereinigt(S.TEAM_KRITERIEN, S.TEAM_KRITERIEN_TRUEMMER).map((k) => ({ ...k, gruppe: 'team' })),
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

/** Kriterien beider Sparten ohne Doppelte – die Auswertung soll keines übersehen. */
function vereinigt(a, b) {
  const gesehen = new Set();
  return [...a, ...b].filter((k) => (gesehen.has(k.id) ? false : gesehen.add(k.id)));
}

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
    ${block('team', vereinigt(S.TEAM_KRITERIEN, S.TEAM_KRITERIEN_TRUEMMER), 'Suchteam')}
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
  const rTyp = S.RADIUS_TYPEN.filter((r) => zaehler[r.id]).map((r) => ({ label: r.label, wert: zaehler[r.id] }));

  // Verteilung der Fundabstände – aussagekräftiger als die Anzeigeart,
  // weil ausschließlich durch Bellen angezeigt wird.
  const radien = daten.flatMap((s) => s.helfer || [])
    .filter((h) => h.gefunden === true && Number(h.radiusM) > 0)
    .map((h) => Number(h.radiusM));
  const klassen = [
    { label: 'bis 10 m', pruef: (m) => m <= 10 },
    { label: '11 – 25 m', pruef: (m) => m > 10 && m <= 25 },
    { label: '26 – 50 m', pruef: (m) => m > 25 && m <= 50 },
    { label: 'über 50 m', pruef: (m) => m > 50 },
  ].map((k) => ({ label: k.label, wert: radien.filter(k.pruef).length })).filter((k) => k.wert > 0);

  return karte(
    'Radius bei Fund',
    `${rTyp.length ? `<h3 class="unter">Radius (Einschätzung)</h3>${balken(rTyp)}` : ''}
     ${klassen.length ? `<h3 class="unter">Abstand zur Hundeführer:in beim Fund</h3>${balken(klassen, { farbe: 'var(--blau)' })}` : ''}
     ${!rTyp.length && !klassen.length ? leer('Noch keine Angaben.') : ''}`,
    { hint: 'Angezeigt wird durchgängig durch Bellen – ausgewertet wird deshalb der Abstand.' }
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

  const gelaende = zaehle('gelaende', S.GELAENDE_ALLE());
  const wetter = [...zaehle('temperatur', S.TEMPERATUR), ...zaehle('wind', S.WIND), ...zaehle('niederschlag', S.NIEDERSCHLAG), ...zaehle('licht', S.LICHT)];

  // Wie gut läuft es unter welchen Bedingungen?
  const nachBedingung = [];
  [...S.GELAENDE_ALLE(), ...S.TEMPERATUR, ...S.WIND, ...S.NIEDERSCHLAG, ...S.LICHT].forEach((k) => {
    const treffer = daten.filter((s) =>
      ['gelaende', 'temperatur', 'wind', 'niederschlag', 'licht'].some((f) => (s[f] || []).includes(k.id))
    );
    const scores = treffer.map(S.gesamtScore).filter((v) => v != null);
    if (scores.length >= 2) nachBedingung.push({ label: `${k.label} (${scores.length})`, wert: S.mittelwert(scores) });
  });
  // Wartezeit im Auto als eigene Bedingung – oft der unterschätzte Faktor.
  const warteklassen = [
    { label: 'Wartezeit bis 30 min', pruef: (m) => m > 0 && m <= 30 },
    { label: 'Wartezeit 31 – 60 min', pruef: (m) => m > 30 && m <= 60 },
    { label: 'Wartezeit 61 – 120 min', pruef: (m) => m > 60 && m <= 120 },
    { label: 'Wartezeit über 120 min', pruef: (m) => m > 120 },
  ];
  warteklassen.forEach((k) => {
    const treffer = daten.filter((s) => k.pruef(Number(s.wartezeitAutoMin)));
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
  const b = HB.bilanz(hundId);

  const segmente = [
    { label: 'gemeistert', wert: b.stufen[4], farbe: '#3c8a4f' },
    { label: 'längere Anzeige', wert: b.stufen[3], farbe: '#7fb37f' },
    { label: 'kurze Anzeige', wert: b.stufen[2], farbe: '#c7d9a8' },
    { label: 'kennengelernt', wert: b.stufen[1], farbe: '#efc766' },
    { label: 'nie im Training', wert: b.stufen[0], farbe: 'var(--rand)' },
  ];

  // Häufigkeit aus den Suchen des gewählten Zeitraums
  const imZeitraum = {};
  daten.flatMap((s) => s.helfer || []).forEach((h) => {
    if (h.bildId) imZeitraum[h.bildId] = (imZeitraum[h.bildId] || 0) + 1;
  });
  const top = Object.entries(imZeitraum)
    .sort((a, c) => c[1] - a[1])
    .slice(0, 8)
    .map(([id, n]) => ({ label: HB.bilderById()[id]?.label || id, wert: n }));

  return karte(
    'Helfer:in-Bilder',
    `<div class="bilder-uebersicht">
      ${stapel(segmente, b.gesamt)}
      <div class="ch-legende">${segmente.map((x) => `<span><i style="background:${x.farbe}"></i>${esc(x.label)} ${x.wert}</span>`).join('')}</div>
    </div>
    <p class="karte__hint"><strong>${b.ausSuchen}</strong> von ${b.gesamt} Bildern sind durch Suchen belegt,
      <strong>${b.nieEingesetzt.length}</strong> waren noch nie im Training.</p>
    ${top.length ? `<h3 class="unter">Am häufigsten im gewählten Zeitraum</h3>${balken(top, { farbe: 'var(--marke)' })}` : ''}
    ${b.wichtigOffen.length
      ? `<h3 class="unter">Wichtige Bilder noch nie geübt (${b.wichtigOffen.length})</h3>
         <div class="offen-liste">${b.wichtigOffen.map((x) => `<span class="tag tag--warn">${esc(x.label)}</span>`).join('')}</div>`
      : `<p class="gut">Alle als wichtig markierten Bilder waren schon im Training. 👍</p>`}
    <p class="karte__hint"><a href="#/bilder">Zur vollständigen Übersicht →</a></p>`,
    {
      hint: hundId
        ? `Für ${store.get(hundId)?.name || ''} – abgeleitet aus den abgeschlossenen Suchen`
        : 'Über alle Hunde – für einzelne Hunde oben filtern',
    }
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
  box.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]');
    if (!t) return;
    filter[t.dataset.t] = !filter[t.dataset.t];
    zeichne(wurzel);
  });
}
