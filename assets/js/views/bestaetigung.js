/**
 * Bestätigung einer Einheit durch die Ausbildung.
 *
 * Bewusst kein gezeichneter Namenszug: In einer App, in der jede:r die eigene
 * Rolle setzen kann, sähe eine Unterschrift verbindlicher aus, als sie ist.
 * Festgehalten wird, WER WANN bestätigt hat – das ist nachvollziehbar und
 * ehrlich. Zurückziehen bleibt möglich und wird ebenfalls sichtbar.
 */

import * as store from '../store.js';
import * as R from '../rollen.js';
import { esc, karte, textArea, frage, toast, formatDatum } from '../ui.js';

/** Karte für den Editor. Zeigt Hundeführer:innen den Stand, Ausbilder:innen die Handlung. */
export function bestaetigungsKarte(rec) {
  const abgeschlossen = (rec.status ?? 'abgeschlossen') === 'abgeschlossen';
  const b = rec.bestaetigung;

  if (b?.am) {
    return karte('Bestätigt', `
      <p class="abschluss__ok">Bestätigt von <strong>${esc(b.vonName || 'Ausbildung')}</strong>
        am ${esc(formatDatum(String(b.am).slice(0, 10)))}.</p>
      ${b.bemerkung ? `<p class="bestaetigung__bemerkung">„${esc(b.bemerkung)}“</p>` : ''}
      ${R.istAusbilder()
        ? '<button type="button" class="btn btn--gefahr-still" data-best-zurueck>Bestätigung zurückziehen</button>'
        : ''}
    `, { klasse: 'karte--bestaetigt' });
  }

  if (!R.istAusbilder()) {
    return karte('Bestätigung', `
      <p class="karte__hint">${abgeschlossen
        ? 'Diese Einheit wartet auf die Bestätigung durch die Ausbildung.'
        : 'Nach dem Abschließen wartet die Einheit auf die Bestätigung durch die Ausbildung.'}</p>
    `, { klasse: 'karte--wartet' });
  }

  return karte('Bestätigen', `
    ${abgeschlossen
      ? `${textArea('__bestBemerkung', '', { rows: 2, placeholder: 'Bemerkung der Ausbildung (freiwillig)' })}
         <button type="button" class="btn btn--primaer" data-best-setzen>Einheit bestätigen</button>
         <p class="karte__hint">Festgehalten wird, wer wann bestätigt hat.</p>`
      : '<p class="karte__hint">Erst abschließen, dann bestätigen.</p>'}
  `, { klasse: 'karte--bestaetigen' });
}

/** Klickbehandlung; liefert true, wenn etwas geschehen ist. */
export async function bestaetigungKlick(e, rec, nachher) {
  if (e.target.closest('[data-best-setzen]')) {
    const bem = document.querySelector('[data-pfad="__bestBemerkung"]')?.value.trim() || '';
    const person = R.meinePerson();
    rec.bestaetigung = {
      vonId: R.meinePersonId(),
      vonName: person?.name || 'Ausbildung',
      am: new Date().toISOString(),
      bemerkung: bem,
    };
    await store.put(rec);
    toast('Einheit bestätigt.');
    nachher?.();
    return true;
  }

  if (e.target.closest('[data-best-zurueck]')) {
    if (await frage('Bestätigung zurückziehen?', { ok: 'Zurückziehen', gefahr: true })) {
      rec.bestaetigung = null;
      await store.put(rec);
      toast('Bestätigung zurückgezogen.');
      nachher?.();
    }
    return true;
  }
  return false;
}

/** Kleines Abzeichen für Listen. */
export function bestaetigungAbzeichen(rec) {
  if (R.istBestaetigt(rec)) {
    return `<span class="abz abz--bestaetigt" title="${esc(R.bestaetigungText(rec))}">bestätigt</span>`;
  }
  if ((rec.status ?? 'abgeschlossen') === 'abgeschlossen') {
    return '<span class="abz abz--offen-best">wartet auf Bestätigung</span>';
  }
  return '';
}
