/**
 * Gemeinsame Bausteine der beiden Dokumentarten (Suche und freie Dokumentation).
 *
 * Die Grundwerte liegen bewusst hier und nicht doppelt in beiden Masken –
 * sonst driften sie mit der Zeit auseinander und die Auswertung stimmt nicht mehr.
 */

import * as store from '../store.js';
import * as S from '../schema.js';
import * as R from '../rollen.js';
import { esc, feld, textInput, textArea, select, karte, chipGruppe, formatDatum } from '../ui.js';

/** Wartezeit im Auto – steht in beiden Masken ganz oben. */
export function wartezeitFeld(rec) {
  return feld(
    'Wartezeit im Auto bis zur Suche (min)',
    textInput('wartezeitAutoMin', rec.wartezeitAutoMin, {
      type: 'number',
      inputmode: 'numeric',
      min: 0,
      step: 5,
      placeholder: 'z.B. 45',
    }),
    { hint: 'prägt Anspannung und Motivation beim Start' }
  );
}

/**
 * Kopfdaten: Wartezeit, Datum, Ort, Hund, Hundeführer:in
 * @param {object} rec
 * @param {{zusatz?: string, titel?: boolean}} opts
 */
export function kopfKarte(rec, opts = {}) {
  // Hundeführer:innen erfassen ausschließlich ihre eigenen Hunde.
  const hunde = R.waehlbareHunde(rec.hundId).map((h) => ({ id: h.id, label: h.name }));
  const personen = store.personen().map((p) => ({ id: p.id, label: p.name }));
  const eigenePerson = store.get(rec.hfId);

  const hundFeld = hunde.length
    ? select('hundId', rec.hundId, hunde)
    : `<span class="hinweis-inline">${R.eingerichtet()
        ? 'Dir ist noch kein Hund zugeordnet – das macht die Ausbildung unter Einstellungen.'
        : 'Dieses Gerät ist noch niemandem zugeordnet – bitte unter <a href="#/einstellungen">Einstellungen</a> auswählen.'}</span>`;

  const hfFeld = R.darfHfWaehlen()
    ? (personen.length
        ? select('hfId', rec.hfId, personen)
        : `<span class="hinweis-inline">Noch keine Person angelegt – unter <a href="#/einstellungen">Einstellungen</a> hinzufügen.</span>`)
    : `<div class="feld-fest">${esc(eigenePerson?.name || 'nicht zugeordnet')}
        <small>fest auf dieses Gerät eingestellt</small></div>`;

  return karte('Grundwerte', `
    ${wartezeitFeld(rec)}
    ${opts.titel
      ? feld('Überschrift', textInput('titel', rec.titel, { placeholder: 'z.B. Gehorsam am Gerät, Theorieabend, Beobachtung' }))
      : ''}
    <div class="raster raster--2">
      ${feld('Datum', textInput('datum', rec.datum, { type: 'date' }))}
      ${feld('Ort', textInput('ort', rec.ort, { placeholder: 'z.B. Waldstück Nordheide' }))}
      ${feld('Hund', hundFeld)}
      ${feld('Hundeführer:in', hfFeld)}
    </div>
    ${opts.zusatz || ''}
  `);
}

export function gelaendeKarte(rec) {
  return karte('Geländebeschaffenheit', `
    ${chipGruppe('gelaende', S.GELAENDE, rec.gelaende)}
    ${feld('Sonstiges', textInput('gelaendeSonstiges', rec.gelaendeSonstiges, { placeholder: 'weitere Merkmale' }))}
  `);
}

export function wetterKarte(rec) {
  return karte('Temperatur / Wetter / Tageszeit', `
    <div class="gruppe"><h3>Temperatur</h3>${chipGruppe('temperatur', S.TEMPERATUR, rec.temperatur)}</div>
    <div class="gruppe"><h3>Wind</h3>${chipGruppe('wind', S.WIND, rec.wind)}</div>
    <div class="gruppe"><h3>Niederschlag</h3>${chipGruppe('niederschlag', S.NIEDERSCHLAG, rec.niederschlag)}</div>
    <div class="gruppe"><h3>Licht</h3>${chipGruppe('licht', S.LICHT, rec.licht)}</div>
    <div class="raster raster--2">
      ${feld('Windrichtung', select('windrichtung', rec.windrichtung, S.HIMMELSRICHTUNGEN.map((r) => ({ id: r, label: r })), '– keine Angabe –'))}
      ${feld('Sonstiges', textInput('wetterSonstiges', rec.wetterSonstiges, { placeholder: 'z.B. Bodennebel' }))}
    </div>
  `);
}

/* ---------------------------------------------------------------- */
/* Status und Abschluss                                              */
/* ---------------------------------------------------------------- */

export function statusAbzeichen(rec) {
  return S.istAbgeschlossen(rec)
    ? '<span class="abz abz--fertig">abgeschlossen</span>'
    : '<span class="abz abz--entwurf">Entwurf – nur auf diesem Gerät</span>';
}

/**
 * Freigabe-Bereich. Ein Dokument geht erst online, wenn es vollständig
 * ausgefüllt und bewusst abgeschlossen wurde.
 * @param {object} rec
 * @param {{wasIstEs: string, geteiltText: string}} texte
 */
export function abschlussKarte(rec, texte) {
  const v = S.vollstaendigkeit(rec);
  const fertig = S.istAbgeschlossen(rec);

  if (fertig) {
    return karte(`${texte.wasIstEs} abgeschlossen`, `
      <p class="abschluss__ok">${esc(texte.geteiltText)}${
        rec.abgeschlossenAm ? ` Abgeschlossen am ${esc(formatDatum(String(rec.abgeschlossenAm).slice(0, 10)))}.` : ''
      }</p>
      <button type="button" class="btn btn--still" data-wieder-oeffnen>Wieder öffnen und bearbeiten</button>
      <p class="karte__hint">Beim Wiederöffnen wird der Eintrag erneut zum Entwurf. Der bereits geteilte Stand
        bleibt beim Team, bis du ihn wieder abschließt.</p>
    `, { klasse: 'karte--fertig' });
  }

  const liste = v.offen.length
    ? `<ul class="offen-punkte">${v.offen.map((o) => `<li>${esc(o.label)}</li>`).join('')}</ul>`
    : '';

  return karte(`${texte.wasIstEs} abschließen`, `
    <div class="fortschritt-zeile">
      <span class="fortschritt-balken"><span style="width:${Math.round((v.erfuellt / v.gesamt) * 100)}%"></span></span>
      <strong>${v.erfuellt} von ${v.gesamt}</strong>
    </div>
    ${v.vollstaendig
      ? `<p class="abschluss__ok">Alle Angaben liegen vor.</p>`
      : `<p class="abschluss__offen">Dafür fehlen noch:</p>${liste}`}
    <button type="button" class="btn btn--primaer" data-abschliessen ${v.vollstaendig ? '' : 'disabled'}>
      Abschließen und mit dem Team teilen
    </button>
    <p class="karte__hint">Solange der Eintrag Entwurf ist, bleibt er ausschließlich auf diesem Gerät.
      Erst mit dem Abschließen wird er hochgeladen.</p>
  `, { klasse: 'karte--abschluss' });
}
