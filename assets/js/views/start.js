/**
 * Einrichtungsassistent für neue Geräte.
 *
 * Führt in vier Schritten durch alles, was ein Gerät braucht: Zugangscode,
 * eigener Name, Hund, und – falls der Hund schon weiter ist – der bisherige
 * Verbellen-Stand.
 *
 * Die Reihenfolge ist bewusst so: Erst der Zugangscode, weil danach die
 * bereits angelegten Personen und Hunde des Teams eintreffen. Wer später
 * anfängt, wählt sich dann einfach aus der Liste, statt Namen doppelt anzulegen.
 */

import * as store from '../store.js';
import * as S from '../schema.js';
import * as R from '../rollen.js';
import * as sync from '../sync/index.js';
import * as V from '../verbellen.js';
import { VERBELLEN_PLAN, WEGE } from '../verbellen-plan.js';
import { ladeConfig, speichereToken, geraeteName, setzeGeraeteName } from '../config.js';
import { esc, karte, feld, textInput, select, toast, leer } from '../ui.js';

const z = {
  schritt: 1,
  token: '',
  pruefe: false,
  personId: '',
  neuerName: '',
  hundId: '',
  neuerHund: '',
  boxBis: 0,
  menschBis: 0,
  laeuft: false,
};

export async function render(wurzel) {
  zeichne(wurzel);
}

export function zuruecksetzen() {
  Object.assign(z, { schritt: 1, token: '', personId: '', neuerName: '', hundId: '', neuerHund: '', boxBis: 0, menschBis: 0 });
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  binde(wurzel.querySelector('.seite'), wurzel);
}

/* ---------------------------------------------------------------- */

function html() {
  const cfg = ladeConfig();
  return `<div class="seite seite--start">
    <div class="start-kopf">
      <h1>Willkommen</h1>
      <p>Vier kurze Schritte, dann ist dieses Gerät eingerichtet.</p>
    </div>

    <ol class="schritte">
      ${['Zugang', 'Wer bist du?', 'Dein Hund', 'Verbellen'].map((t, i) => `
        <li class="${i + 1 === z.schritt ? 'schritt--an' : i + 1 < z.schritt ? 'schritt--fertig' : ''}">
          <span>${i + 1}</span>${esc(t)}</li>`).join('')}
    </ol>

    ${z.schritt === 1 ? schrittZugang(cfg) : ''}
    ${z.schritt === 2 ? schrittPerson() : ''}
    ${z.schritt === 3 ? schrittHund() : ''}
    ${z.schritt === 4 ? schrittVerbellen() : ''}
    ${z.schritt === 5 ? schrittFertig() : ''}

    ${z.schritt < 5 ? `<p class="karte__hint start-fuss">
      Alles lässt sich später unter <a href="#/einstellungen">Einstellungen</a> ändern.
      <button type="button" class="btn btn--mini" data-ueberspringen>Assistent überspringen</button>
    </p>` : ''}
  </div>`;
}

/* ---- 1. Zugang ---- */

function schrittZugang(cfg) {
  const verbunden = sync.status.zustand === 'aktiv';
  const hatToken = !!cfg.github.token;

  return karte('Zugangscode eintragen', `
    ${hatToken && verbunden
      ? `<p class="abschluss__ok">Verbunden. Die Daten des Teams sind da:
          ${store.personen().length} Person(en), ${store.hunde().length} Hund(e).</p>`
      : `<p class="text">Den Zugangscode bekommst du von der Ausbildung. Er sorgt dafür, dass du
          dieselben Daten siehst wie alle anderen – und dass deine Einträge ankommen.</p>
        ${feld('Zugangscode', `<input class="input input--code" type="password" data-token
          value="${esc(z.token)}" placeholder="github_pat_…" autocomplete="off">`,
          { hint: 'bleibt nur auf diesem Gerät' })}
        <div class="btn-zeile">
          <button type="button" class="btn btn--primaer" data-verbinden ${z.laeuft ? 'disabled' : ''}>
            ${z.laeuft ? 'Verbinde …' : 'Verbinden'}</button>
          <button type="button" class="btn btn--still" data-ohne-code>Ohne Code fortfahren</button>
        </div>
        <p class="karte__hint">Ohne Code kannst du trotzdem dokumentieren – die Einträge bleiben
          dann aber nur auf diesem Gerät, bis du den Code nachträgst.</p>`}

    ${hatToken || z.schrittFrei ? `<div class="btn-zeile">
      <button type="button" class="btn btn--primaer" data-weiter>Weiter</button>
    </div>` : ''}
  `);
}

/* ---- 2. Person ---- */

function schrittPerson() {
  const personen = store.personen();
  return karte('Wer arbeitet an diesem Gerät?', `
    <p class="text">Damit weiß die App, welche Hunde sie dir zeigt und wer als Hundeführer:in
      in deinen Einträgen steht.</p>

    ${personen.length ? `
      ${feld('Aus der Liste wählen', select('personId', z.personId,
        personen.map((p) => ({ id: p.id, label: p.name })), '– bitte wählen –'))}
      <p class="karte__hint">Steht dein Name nicht dabei? Dann hier neu anlegen:</p>
    ` : '<p class="karte__hint">Noch keine Personen vorhanden – lege dich als erste Person an:</p>'}

    ${feld('Neuer Name', textInput('neuerName', z.neuerName, { placeholder: 'Vor- und Nachname' }))}

    ${feld('Name dieses Geräts', textInput('__geraet', geraeteName(), { placeholder: 'z.B. Handy Rainer' }),
      { hint: 'erscheint im Team als „zuletzt geändert von“' })}

    <div class="btn-zeile">
      <button type="button" class="btn btn--still" data-zurueck>Zurück</button>
      <button type="button" class="btn btn--primaer" data-weiter>Weiter</button>
    </div>
  `);
}

/* ---- 3. Hund ---- */

function schrittHund() {
  const alle = store.hunde();
  const meine = R.meineHunde();
  return karte('Dein Hund', `
    <p class="text">Du kannst später weitere Hunde ergänzen. Ein Hund kann auch mehreren
      Personen zugeordnet sein.</p>

    ${meine.length ? `<p class="abschluss__ok">Dir zugeordnet: ${meine.map((h) => esc(h.name)).join(', ')}.</p>` : ''}

    ${alle.length ? `
      ${feld('Vorhandenen Hund zuordnen', select('hundId', z.hundId,
        alle.filter((h) => !meine.some((m) => m.id === h.id)).map((h) => ({ id: h.id, label: h.name })),
        '– keinen –'))}
    ` : ''}

    ${feld('Neuen Hund anlegen', textInput('neuerHund', z.neuerHund, { placeholder: 'Name des Hundes' }))}

    <div class="btn-zeile">
      <button type="button" class="btn btn--still" data-zurueck>Zurück</button>
      <button type="button" class="btn btn--primaer" data-weiter>Weiter</button>
    </div>
  `);
}

/* ---- 4. Verbellen-Startstand ---- */

function schrittVerbellen() {
  const hund = R.meineHunde()[0];
  if (!hund) {
    return karte('Verbellen', `
      ${leer('Ohne zugeordneten Hund lässt sich hier nichts eintragen.')}
      <div class="btn-zeile">
        <button type="button" class="btn btn--still" data-zurueck>Zurück</button>
        <button type="button" class="btn btn--primaer" data-fertig>Fertig</button>
      </div>`);
  }

  const auswahl = (weg, wert) => `<select class="input" data-stand="${weg}">
    <option value="0"${wert === 0 ? ' selected' : ''}>noch nicht begonnen</option>
    ${VERBELLEN_PLAN[weg].map((st) => `<option value="${st.n}"${wert === st.n ? ' selected' : ''}>
      bis Stufe ${st.n}: ${esc(st.title.slice(0, 60))}</option>`).join('')}
  </select>`;

  const uebungen = anzahlUebungen();

  return karte('Stand beim Verbellen', `
    <p class="text">Ist <strong>${esc(hund.name)}</strong> im Verbellen schon weiter? Dann trage hier ein,
      bis zu welcher Stufe der Plan bereits sitzt. Alles davor gilt damit als erledigt.</p>

    ${feld(WEGE[0].lang, auswahl('box', z.boxBis))}
    ${feld(WEGE[1].lang, auswahl('mensch', z.menschBis))}

    ${uebungen
      ? `<p class="abschluss__ok">${uebungen} Unterübungen werden als erledigt übernommen.</p>`
      : '<p class="karte__hint">Nichts ausgewählt – der Plan startet bei null. Das lässt sich jederzeit nachholen.</p>'}

    <p class="karte__hint">Übernommen wird das als eine Sitzung mit dem heutigen Datum, gekennzeichnet
      als Übernahme. So bleibt nachvollziehbar, was aus dem Training stammt und was übernommen wurde.</p>

    <div class="btn-zeile">
      <button type="button" class="btn btn--still" data-zurueck>Zurück</button>
      <button type="button" class="btn btn--primaer" data-fertig ${z.laeuft ? 'disabled' : ''}>
        ${z.laeuft ? 'Übernehme …' : 'Einrichtung abschließen'}</button>
    </div>
  `);
}

function anzahlUebungen() {
  let n = 0;
  for (const [weg, bis] of [['box', z.boxBis], ['mensch', z.menschBis]]) {
    VERBELLEN_PLAN[weg].filter((st) => st.n <= bis).forEach((st) => (n += st.items.length));
  }
  return n;
}

/* ---- 5. Fertig ---- */

function schrittFertig() {
  const hunde = R.meineHunde();
  return karte('Fertig', `
    <p class="abschluss__ok">Dieses Gerät ist eingerichtet.</p>
    <ul class="offen-punkte">
      <li>Person: <strong>${esc(R.meinePerson()?.name || '—')}</strong></li>
      <li>Hund(e): <strong>${hunde.map((h) => esc(h.name)).join(', ') || '—'}</strong></li>
      <li>Abgleich: <strong>${sync.status.zustand === 'aktiv' ? 'verbunden' : 'noch nicht verbunden'}</strong></li>
    </ul>
    <div class="btn-zeile">
      <a class="btn btn--primaer" href="#/suchen">Los geht's</a>
      <a class="btn btn--still" href="#/einstellungen">Einstellungen ansehen</a>
    </div>
  `);
}

/* ---------------------------------------------------------------- */

function binde(box, wurzel) {
  if (!box) return;

  box.addEventListener('input', (e) => {
    const el = e.target.closest('[data-pfad], [data-token]');
    if (!el) return;
    if (el.dataset.token !== undefined) z.token = el.value;
    else if (el.dataset.pfad === 'neuerName') z.neuerName = el.value;
    else if (el.dataset.pfad === 'neuerHund') z.neuerHund = el.value;
  });

  box.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.pfad === 'personId') z.personId = el.value;
    if (el.dataset.pfad === 'hundId') z.hundId = el.value;
    if (el.dataset.pfad === '__geraet') setzeGeraeteName(el.value);
    if (el.dataset.stand) {
      z[el.dataset.stand === 'box' ? 'boxBis' : 'menschBis'] = Number(el.value);
      zeichne(wurzel);
    }
  });

  box.addEventListener('click', async (e) => {
    if (e.target.closest('[data-ueberspringen]')) {
      location.hash = '#/einstellungen';
      return;
    }

    if (e.target.closest('[data-verbinden]')) {
      if (!z.token.trim()) {
        toast('Bitte den Zugangscode einfügen.', 'fehler');
        return;
      }
      z.laeuft = true;
      zeichne(wurzel);
      speichereToken(z.token.trim());
      const ok = await sync.neustart();
      z.laeuft = false;
      if (!ok) {
        speichereToken('');
        toast('Der Code wird nicht angenommen. Bitte bei der Ausbildung nachfragen.', 'fehler');
      } else {
        toast('Verbunden. Daten des Teams werden geladen …');
        await new Promise((r) => setTimeout(r, 1800));
      }
      zeichne(wurzel);
      return;
    }

    if (e.target.closest('[data-ohne-code]')) {
      z.schrittFrei = true;
      z.schritt = 2;
      zeichne(wurzel);
      return;
    }

    if (e.target.closest('[data-zurueck]')) {
      z.schritt = Math.max(1, z.schritt - 1);
      zeichne(wurzel);
      return;
    }

    if (e.target.closest('[data-weiter]')) {
      await weiter(wurzel);
      return;
    }

    if (e.target.closest('[data-fertig]')) {
      z.laeuft = true;
      zeichne(wurzel);
      await uebernehmeVerbellen();
      // Die Ersteinrichtung endet immer als Hundefuehrer:in. Eine bereits
      // gesetzte Rolle bleibt, damit Ausbilder:innen nicht herausfliegen,
      // wenn sie den Assistenten aus den Einstellungen erneut oeffnen.
      if (!localStorage.getItem('rhd.rolle')) localStorage.setItem('rhd.rolle', 'hundefuehrer');
      z.laeuft = false;
      z.schritt = 5;
      zeichne(wurzel);
    }
  });
}

async function weiter(wurzel) {
  if (z.schritt === 1) {
    z.schritt = 2;
    zeichne(wurzel);
    return;
  }

  if (z.schritt === 2) {
    let personId = z.personId;
    const name = z.neuerName.trim();
    if (name) {
      const schon = store.personen().find((p) => p.name.toLowerCase() === name.toLowerCase());
      personId = (schon || (await store.put({ type: 'person', name }))).id;
    }
    if (!personId) {
      toast('Bitte einen Namen wählen oder anlegen.', 'fehler');
      return;
    }
    R.setzePerson(personId);
    z.personId = personId;
    z.neuerName = '';
    z.schritt = 3;
    zeichne(wurzel);
    return;
  }

  if (z.schritt === 3) {
    const name = z.neuerHund.trim();
    if (name) {
      const schon = store.hunde().find((h) => h.name.toLowerCase() === name.toLowerCase());
      const hund = schon || (await store.put({ type: 'hund', name, hfIds: [] }));
      await ordneZu(hund.id);
    }
    if (z.hundId) await ordneZu(z.hundId);
    if (!R.meineHunde().length) {
      toast('Bitte einen Hund anlegen oder zuordnen.', 'fehler');
      return;
    }
    z.neuerHund = '';
    z.hundId = '';
    z.schritt = 4;
    zeichne(wurzel);
  }
}

async function ordneZu(hundId) {
  const h = store.get(hundId);
  if (!h) return;
  const ids = new Set(h.hfIds || []);
  ids.add(R.meinePersonId());
  await store.put({ ...h, hfIds: [...ids] });
}

/**
 * Übernimmt den bisherigen Stand als EINE Sitzung. Bewusst kein Sonderweg:
 * Der Fortschritt bleibt damit ausschließlich aus Sitzungen abgeleitet, und in
 * der Liste ist erkennbar, was übernommen und was trainiert wurde.
 */
async function uebernehmeVerbellen() {
  const hund = R.meineHunde()[0];
  if (!hund || (!z.boxBis && !z.menschBis)) return;

  const einheiten = [];
  for (const [weg, bis] of [['box', z.boxBis], ['mensch', z.menschBis]]) {
    VERBELLEN_PLAN[weg]
      .filter((st) => st.n <= bis)
      .forEach((st) => {
        const haken = {};
        st.items.forEach((_, i) => (haken[i] = V.NOETIGE_WIEDERHOLUNGEN));
        einheiten.push({ weg, stufeN: st.n, haken, zusatz: [], bemerkung: '' });
      });
  }

  const sitzung = S.neueVerbellenSitzung({ hundId: hund.id, hfId: R.meinePersonId() });
  Object.assign(sitzung, {
    einheiten,
    uebernahme: true,
    status: 'abgeschlossen',
    abgeschlossenAm: new Date().toISOString(),
    ort: 'Übernahme bei der Einrichtung',
    notizen: 'Bei der Ersteinrichtung übernommener Stand – nicht in dieser Sitzung trainiert.',
  });
  await store.put(sitzung);
  toast(`${anzahlUebungen()} Unterübungen übernommen.`);
}
