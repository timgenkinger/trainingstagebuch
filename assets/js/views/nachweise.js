/**
 * Nachweise: Führerscheinkontrollen und Impfungen.
 *
 * Hundeführer:innen sehen ihre eigene Kontrolle und ihre eigenen Hunde und
 * dürfen Impfungen eintragen. Bestätigen – Kontrollen wie Impfungen – darf
 * nur die Ausbildung; eine Impfung zählt erst mit ihrer Bestätigung.
 */

import * as store from '../store.js';
import * as R from '../rollen.js';
import * as N from '../nachweise.js';
import { esc, karte, leer, formatDatum, toast, frage, datumsFrage } from '../ui.js';

export async function render(wurzel) {
  zeichne(wurzel);
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  binde(wurzel.querySelector('.seite'), wurzel);
}

/* ---------------------------------------------------------------- */

const LAGE_KLASSE = { offen: 'abz--nicht-erfasst', gueltig: 'abz--gueltig', bald: 'abz--bald', abgelaufen: 'abz--abgelaufen' };

function abzeichen(naechste, abgelaufenWort) {
  const l = N.lage(naechste);
  return `<span class="abz ${LAGE_KLASSE[l]}">${esc(N.lageText(naechste, { abgelaufenWort }))}</span>`;
}

function html() {
  const ausbilder = R.istAusbilder();
  const personen = ausbilder ? store.personen() : [R.meinePerson()].filter(Boolean);
  const hunde = R.meineHunde();
  const offen = ausbilder ? N.offeneImpfungen() : [];

  return `<div class="seite">
    <div class="seite__kopf"><h1>Nachweise</h1></div>

    ${offen.length ? karte('Wartet auf Bestätigung', `
      <p class="karte__hint">Von Hundeführer:innen eingetragen. Eine Impfung zählt erst,
        wenn sie hier bestätigt ist.</p>
      <div class="nachweis-offen">${offen.map((i) => offeneZeile(i, { mitHund: true })).join('')}</div>
    `) : ''}

    ${karte(ausbilder ? 'Führerscheinkontrollen' : 'Führerscheinkontrolle', `
      <p class="karte__hint">Alle ${N.FUEHRERSCHEIN_MONATE} Monate durch die Ausbildung.
        Ab einem Monat vorher erscheint ein Hinweis.</p>
      ${personen.length
        ? `<div class="nachweis-liste">${personen.map(kontrollZeile).join('')}</div>`
        : leer('Noch keine Hundeführer:innen angelegt.')}
    `)}

    ${karte('Impfungen', `
      <p class="karte__hint">${ausbilder
        ? 'Eingetragene Impfungen bestätigst du hier; selbst eingetragene gelten sofort.'
        : 'Du kannst Impfungen selbst eintragen. Sie zählen, sobald die Ausbildung sie bestätigt hat.'}
        Ab einem Monat vor Ablauf erscheint ein Hinweis.</p>
      ${hunde.length
        ? hunde.map(hundBlock).join('')
        : leer(ausbilder ? 'Noch kein Hund angelegt.' : 'Dir ist noch kein Hund zugeordnet.')}
    `)}
  </div>`;
}

function kontrollZeile(p) {
  const ausbilder = R.istAusbilder();
  const st = N.fuehrerscheinStand(p.id);
  return `<div class="nachweis">
    <div class="nachweis__kopf">
      <strong>${esc(p.name)}</strong>
      ${abzeichen(st.naechste, 'überfällig')}
    </div>
    <dl class="nachweis__daten">
      <div>
        <dt>Letzte Kontrolle</dt>
        <dd>${st.letzte
          ? `${esc(formatDatum(st.letzte.datum))} <small>durch ${esc(st.letzte.vonName || 'Ausbildung')}</small>
             ${ausbilder ? `<button type="button" class="btn btn--mini btn--gefahr-still" data-kontrolle-weg="${esc(st.letzte.id)}"
               aria-label="Kontrolle vom ${esc(formatDatum(st.letzte.datum))} entfernen" title="Entfernen">×</button>` : ''}`
          : '<span class="t-leer">noch keine</span>'}</dd>
      </div>
      <div>
        <dt>Nächste Kontrolle</dt>
        <dd>${naechsteFeld(st.letzte, 'kontrolle')}</dd>
      </div>
    </dl>
    ${ausbilder
      ? `<div class="btn-zeile"><button type="button" class="btn btn--primaer" data-kontrolle="${esc(p.id)}">Kontrolle bestätigen</button></div>`
      : '<p class="karte__hint">Die Kontrolle bestätigt die Ausbildung.</p>'}
  </div>`;
}

/** Nächster Termin: für die Ausbildung änderbar, sonst nur zu lesen. */
function naechsteFeld(rec, art) {
  if (!rec) return '<span class="t-leer">—</span>';
  if (!R.istAusbilder()) return esc(formatDatum(rec.naechste));
  return `<input class="input input--schlank input--datum" type="date" value="${esc(rec.naechste || '')}"
    min="${esc(rec.datum)}" data-naechste="${esc(rec.id)}" data-art="${art}"
    aria-label="Nächster Termin">`;
}

function hundBlock(h) {
  const fuehrer = (h.hfIds || []).map((id) => store.get(id)?.name).filter(Boolean);
  return `<div class="nachweis-hund">
    <h3 class="unter">${esc(h.name)}${fuehrer.length ? ` <small>· ${esc(fuehrer.join(', '))}</small>` : ''}</h3>
    <div class="nachweis-liste">${N.IMPFARTEN.map((a) => impfZeile(h, a)).join('')}</div>
  </div>`;
}

function impfZeile(h, a) {
  const st = N.impfStand(h.id, a.id);
  return `<div class="nachweis">
    <div class="nachweis__kopf">
      <strong>${esc(a.label)}</strong>
      ${abzeichen(st.naechste, 'abgelaufen')}
    </div>
    <dl class="nachweis__daten">
      <div>
        <dt>Letzte Impfung</dt>
        <dd>${st.letzte
          ? `${esc(formatDatum(st.letzte.datum))} <small>bestätigt von ${esc(st.letzte.bestaetigung?.vonName || 'Ausbildung')}</small>
             ${R.istAusbilder() ? `<button type="button" class="btn btn--mini btn--gefahr-still" data-impfung-weg="${esc(st.letzte.id)}"
               aria-label="Impfung vom ${esc(formatDatum(st.letzte.datum))} entfernen" title="Entfernen">×</button>` : ''}`
          : '<span class="t-leer">noch keine bestätigte</span>'}</dd>
      </div>
      <div>
        <dt>Nächste Impfung</dt>
        <dd>${naechsteFeld(st.letzte, 'impfung')}</dd>
      </div>
    </dl>
    ${st.offen.length ? `<div class="nachweis-offen">${st.offen.map((i) => offeneZeile(i)).join('')}</div>` : ''}
    <div class="btn-zeile">
      <button type="button" class="btn btn--still" data-impfung-neu="${esc(h.id)}" data-art="${esc(a.id)}">+ Impfung eintragen</button>
    </div>
  </div>`;
}

/** Eine eingetragene, noch nicht bestätigte Impfung. */
function offeneZeile(i, { mitHund = false } = {}) {
  const hund = mitHund ? store.get(i.hundId) : null;
  return `<div class="nachweis-offen__zeile">
    <span class="abz abz--offen-best">wartet auf Bestätigung</span>
    <span class="nachweis-offen__text">
      ${hund ? `<strong>${esc(hund.name)}</strong> · ` : ''}${esc(N.impfart(i.art).label)}
      vom ${esc(formatDatum(i.datum))}, nächste ${esc(formatDatum(i.naechste))}
      <small>eingetragen von ${esc(i.eingetragenVonName || 'unbekannt')}</small>
    </span>
    <span class="nachweis-offen__knoepfe">
      ${R.istAusbilder() ? `<button type="button" class="btn btn--mini btn--primaer" data-impfung-ok="${esc(i.id)}">Bestätigen</button>` : ''}
      ${N.darfImpfungEntfernen(i) ? `<button type="button" class="btn btn--mini btn--gefahr-still" data-impfung-weg="${esc(i.id)}"
        aria-label="Eintragung entfernen" title="Entfernen">×</button>` : ''}
    </span>
  </div>`;
}

/* ---------------------------------------------------------------- */

function binde(box, wurzel) {
  const ich = () => ({ id: R.meinePersonId(), name: R.meinePerson()?.name || 'Ausbildung' });
  const reihenfolge = (w) => (w.naechste <= w.datum ? 'Der nächste Termin muss nach diesem Datum liegen.' : null);

  box.addEventListener('click', async (e) => {
    const t = e.target;

    // --- Führerscheinkontrolle bestätigen (nur Ausbildung) ---
    const kon = t.closest('[data-kontrolle]');
    if (kon) {
      if (!R.istAusbilder()) return verweigert(wurzel, 'Kontrollen bestätigt die Ausbildung.');
      const person = store.get(kon.dataset.kontrolle);
      const heute = N.heute();
      const w = await datumsFrage(`Führerscheinkontrolle ${person?.name || ''}`.trim(),
        'Mit dem Bestätigen wird die Kontrolle mit deinem Namen festgehalten.', [
          { id: 'datum', label: 'Kontrolliert am', wert: heute },
          { id: 'naechste', label: 'Nächste Kontrolle', wert: N.plusMonate(heute, N.FUEHRERSCHEIN_MONATE),
            hint: `Vorschlag: in ${N.FUEHRERSCHEIN_MONATE} Monaten` },
        ], { ok: 'Kontrolle bestätigen', pruefe: (x) => reihenfolge(x) || (x.datum > heute ? 'Das Datum der Kontrolle liegt in der Zukunft.' : null) });
      if (!w) return;
      await store.put({ type: 'fuehrerscheinkontrolle', personId: person.id, datum: w.datum,
        naechste: w.naechste, vonId: ich().id, vonName: ich().name });
      toast(`Führerscheinkontrolle für ${person.name} bestätigt.`);
      return zeichne(wurzel);
    }

    const konWeg = t.closest('[data-kontrolle-weg]');
    if (konWeg) {
      if (!R.istAusbilder()) return verweigert(wurzel, 'Kontrollen entfernt nur die Ausbildung.');
      if (!(await frage('Diese Kontrolle entfernen? Die vorherige gilt dann wieder.', { ok: 'Entfernen', gefahr: true }))) return;
      await store.entferne(konWeg.dataset.kontrolleWeg);
      return zeichne(wurzel);
    }

    // --- Impfung eintragen (beide Rollen) ---
    const neu = t.closest('[data-impfung-neu]');
    if (neu) {
      const hund = store.get(neu.dataset.impfungNeu);
      // Nur für Hunde, die man sieht – sonst liesse sich per veralteter
      // Ansicht einem fremden Hund eine Impfung unterschieben.
      if (!hund || !R.meineHunde().some((h) => h.id === hund.id)) return verweigert(wurzel, 'Dieser Hund ist dir nicht zugeordnet.');
      const art = N.impfart(neu.dataset.art);
      const heute = N.heute();
      const w = await datumsFrage(`${art.label}-Impfung · ${hund.name}`,
        R.istAusbilder()
          ? 'Von der Ausbildung eingetragen, gilt die Impfung sofort als bestätigt.'
          : 'Die Impfung zählt, sobald die Ausbildung sie bestätigt hat. Die Daten stehen im Impfpass.', [
          { id: 'datum', label: 'Geimpft am', wert: heute },
          { id: 'naechste', label: 'Nächste Impfung fällig', wert: N.plusMonate(heute, art.vorschlagMonate),
            hint: 'laut Impfpass – bitte prüfen' },
        ], { ok: 'Impfung eintragen', pruefe: (x) => reihenfolge(x) || (x.datum > heute ? 'Das Impfdatum liegt in der Zukunft.' : null) });
      if (!w) return;
      const von = ich();
      await store.put({
        type: 'impfung', hundId: hund.id, art: art.id, datum: w.datum, naechste: w.naechste,
        eingetragenVonId: von.id, eingetragenVonName: von.name,
        bestaetigung: R.istAusbilder() ? { vonId: von.id, vonName: von.name, am: new Date().toISOString() } : null,
      });
      toast(R.istAusbilder() ? `${art.label}-Impfung eingetragen.` : `${art.label}-Impfung eingetragen – wartet auf Bestätigung.`);
      return zeichne(wurzel);
    }

    // --- Impfung bestätigen (nur Ausbildung) ---
    const ok = t.closest('[data-impfung-ok]');
    if (ok) {
      if (!R.istAusbilder()) return verweigert(wurzel, 'Impfungen bestätigt die Ausbildung.');
      const rec = store.get(ok.dataset.impfungOk);
      if (!rec) return;
      const von = ich();
      await store.put({ ...rec, bestaetigung: { vonId: von.id, vonName: von.name, am: new Date().toISOString() } });
      toast(`${N.impfart(rec.art).label}-Impfung bestätigt.`);
      return zeichne(wurzel);
    }

    const weg = t.closest('[data-impfung-weg]');
    if (weg) {
      const rec = store.get(weg.dataset.impfungWeg);
      if (!rec) return;
      if (!N.darfImpfungEntfernen(rec)) return verweigert(wurzel, 'Bestätigte Impfungen entfernt nur die Ausbildung.');
      if (!(await frage('Diese Impfung entfernen?', { ok: 'Entfernen', gefahr: true }))) return;
      await store.entferne(rec.id);
      return zeichne(wurzel);
    }
  });

  // Nächsten Termin anpassen (nur Ausbildung)
  box.addEventListener('change', async (e) => {
    const inp = e.target.closest('[data-naechste]');
    if (!inp) return;
    if (!R.istAusbilder()) return verweigert(wurzel, 'Termine ändert die Ausbildung.');
    const rec = store.get(inp.dataset.naechste);
    if (!rec || !inp.value) return zeichne(wurzel);
    if (inp.value <= rec.datum) {
      toast('Der nächste Termin muss nach dem letzten liegen.', 'fehler');
      return zeichne(wurzel);
    }
    await store.put({ ...rec, naechste: inp.value });
    toast('Nächster Termin geändert.');
    zeichne(wurzel);
  });
}

/** Zweite Sperre: Eine veraltete Ansicht darf nichts bewirken. */
function verweigert(wurzel, text) {
  toast(text, 'fehler');
  zeichne(wurzel);
}
