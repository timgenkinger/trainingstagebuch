/** Anwendungsgerüst: Router, Kopfzeile, Sync-Anzeige, Update-Hinweis. */

import * as store from './store.js';
import * as sync from './sync/index.js';
import { versionString, APP_NAME } from './version.js';
import { esc } from './ui.js';
import * as update from './update.js';
import * as R from './rollen.js';

import * as vSuchen from './views/suchen.js';
import * as vEditor from './views/editor.js';
import * as vFreidoku from './views/freidoku.js';
import * as vVerbellen from './views/verbellen.js';
import * as vVerbellenEditor from './views/verbellen-editor.js';
import * as vDashboard from './views/dashboard.js';
import * as vBilder from './views/bilder.js';
import * as vEinstellungen from './views/einstellungen.js';
import * as vEinrichtung from './views/einrichtung.js';

const ROUTEN = [
  { muster: /^#\/suchen$/, view: vSuchen, tab: 'suchen', params: () => ({ nurUnbestaetigt: false }) },
  { muster: /^#\/bestaetigungen$/, view: vSuchen, tab: 'suchen', params: () => ({ nurUnbestaetigt: true }) },
  { muster: /^#\/suche\/neu$/, view: vEditor, tab: 'suchen', params: () => ({}) },
  { muster: /^#\/suche\/(.+)$/, view: vEditor, tab: 'suchen', params: (m) => ({ id: m[1] }) },
  { muster: /^#\/doku\/neu$/, view: vFreidoku, tab: 'suchen', params: () => ({}) },
  { muster: /^#\/doku\/(.+)$/, view: vFreidoku, tab: 'suchen', params: (m) => ({ id: m[1] }) },
  { muster: /^#\/verbellen-sitzung\/neu$/, view: vVerbellenEditor, tab: 'verbellen', params: () => ({}) },
  { muster: /^#\/verbellen-sitzung\/(.+)$/, view: vVerbellenEditor, tab: 'verbellen', params: (m) => ({ id: m[1] }) },
  { muster: /^#\/verbellen$/, view: vVerbellen, tab: 'verbellen' },
  { muster: /^#\/dashboard$/, view: vDashboard, tab: 'dashboard' },
  { muster: /^#\/bilder$/, view: vBilder, tab: 'bilder' },
  { muster: /^#\/einstellungen$/, view: vEinstellungen, tab: 'mehr' },
  { muster: /^#\/einrichtung$/, view: vEinrichtung, tab: 'mehr' },
];

let aktuelleView = null;

/**
 * @param {boolean} navigiert  true = echter Seitenwechsel (dann nach oben scrollen),
 *                             false = stille Auffrischung, z.B. weil neue Daten eintrafen.
 */
/** Ansichten, die nur mit Auswertungsrecht offenstehen. */
const NUR_AUSWERTUNG = new Set(['dashboard', 'verbellen', 'bilder']);

async function route(navigiert = true) {
  const hash = location.hash || '#/suchen';
  const treffer = ROUTEN.map((r) => ({ r, m: hash.match(r.muster) })).find((x) => x.m);

  if (!treffer) {
    location.replace('#/suchen');
    return;
  }

  // Ungespeicherte Editor-Eingaben festschreiben, bevor die Ansicht wechselt.
  if (aktuelleView === vEditor && treffer.r.view !== vEditor) vEditor.flushEditor();
  if (aktuelleView === vFreidoku && treffer.r.view !== vFreidoku) vFreidoku.flushEditor();
  if (aktuelleView === vVerbellenEditor && treffer.r.view !== vVerbellenEditor) vVerbellenEditor.flushEditor();
  // Laufende Abonnements der verlassenen Ansicht beenden.
  if (aktuelleView && aktuelleView !== treffer.r.view) aktuelleView.verlassen?.();

  // Zugriff auf die Auswertungen prüfen, bevor die Ansicht gebaut wird.
  if (NUR_AUSWERTUNG.has(treffer.r.tab) && !R.darfAuswertungSehen()) {
    aktuelleView = null;
    markiereTab('');
    document.getElementById('view').innerHTML = `<div class="seite"><div class="leer">
      <p>Diese Auswertung ist der Ausbildung vorbehalten.</p>
      <p class="karte__hint">Wenn du sie für deine eigenen Hunde brauchst, kann die Ausbildung
        das unter Einstellungen freigeben.</p>
      <a class="btn btn--primaer" href="#/suchen">Zur Dokumentation</a>
    </div></div>`;
    aktualisiereNavigation();
    return;
  }

  aktuelleView = treffer.r.view;
  // Bei jedem Wechsel neu bewerten: Rolle und Freigabe koennen sich
  // zwischendurch geaendert haben (eigene Umstellung oder Abgleich vom Team).
  aktualisiereNavigation();
  const view = document.getElementById('view');
  const y = window.scrollY;
  markiereTab(treffer.r.tab);
  await treffer.r.view.render(view, treffer.r.params ? treffer.r.params(treffer.m) : {});
  // Beim Seitenwechsel nach oben, beim stillen Auffrischen die Position halten.
  const istEditor = [vEditor, vFreidoku, vVerbellenEditor].includes(treffer.r.view);
  if (navigiert && !istEditor) window.scrollTo(0, 0);
  else if (!navigiert) window.scrollTo(0, y);
}

/** Schreibt ungespeicherte Eingaben der aktuellen Maske fest. */
function sichern() {
  if (aktuelleView === vEditor) vEditor.flushEditor();
  if (aktuelleView === vFreidoku) vFreidoku.flushEditor();
  if (aktuelleView === vVerbellenEditor) vVerbellenEditor.flushEditor();
}

/**
 * Manuelles Neuladen. Vorher werden Eingaben festgeschrieben, damit die
 * letzten Sekunden Tipparbeit nicht verloren gehen; anschließend wird
 * geprüft, ob eine neue Fassung bereitliegt, und diese gleich übernommen.
 */
async function neuLaden(btn) {
  if (btn.dataset.laeuft) return;
  btn.dataset.laeuft = '1';
  btn.classList.add('kopf-knopf--dreht');
  sichern();
  await new Promise((r) => setTimeout(r, 250)); // Schreibvorgang abwarten
  await update.pruefe({ erzwingen: true });
  await update.uebernehmenUndNeuLaden();
}

/** Nicht zugängliche Reiter ausblenden statt ins Leere zeigen zu lassen. */
function aktualisiereNavigation() {
  const erlaubt = R.darfAuswertungSehen();
  document.querySelectorAll('[data-tab]').forEach((a) => {
    if (NUR_AUSWERTUNG.has(a.dataset.tab)) a.hidden = !erlaubt;
  });
  const rolle = document.getElementById('rollen-abzeichen');
  if (rolle) {
    const p = R.meinePerson();
    rolle.hidden = !R.eingerichtet();
    rolle.textContent = R.istAusbilder() ? 'Ausbildung' : (p?.name || '');
    rolle.className = 'rollen-abz' + (R.istAusbilder() ? ' rollen-abz--ausbilder' : '');
  }
}

function markiereTab(tab) {
  document.querySelectorAll('[data-tab]').forEach((a) => {
    a.classList.toggle('tab--an', a.dataset.tab === tab);
    a.setAttribute('aria-current', a.dataset.tab === tab ? 'page' : 'false');
  });
}

/* ---------------- Sync-Anzeige ---------------- */

function syncAnzeige() {
  const chip = document.getElementById('sync-chip');
  sync.onStatus((s) => {
    if (!chip) return;
    chip.className = `sync-chip sync-chip--${s.zustand}`;
    const text =
      {
        aus: 'Nur lokal',
        'kein-token': 'Token fehlt',
        verbinde: 'Verbinde',
        aktiv: s.offen ? `${s.offen} offen` : 'Synchron',
        offline: 'Offline',
        fehler: 'Sync-Fehler',
      }[s.zustand] || s.zustand;
    chip.innerHTML = `<span class="punkt"></span><span>${esc(text)}</span>`;
    chip.title = s.text;
  });
}

/* ---------------- Programm-Aktualisierung ---------------- */

function updateAnzeige() {
  const bar = document.getElementById('update-bar');
  update.onUpdate((z) => {
    if (!bar) return;
    bar.hidden = !z.updateBereit;
    const text = bar.querySelector('span');
    if (text) {
      text.textContent = z.serverVersion && z.serverVersion !== z.laufendeVersion
        ? `Neue Version ${z.serverVersion} verfügbar (installiert: ${z.laufendeVersion}).`
        : 'Eine neue Version ist verfügbar.';
    }
  });
  bar?.querySelector('button')?.addEventListener('click', () => {
    sichern();
    update.uebernehmenUndNeuLaden();
  });
}

/* ---------------- Start ---------------- *//* ---------------- Start ---------------- */

async function start() {
  document.getElementById('version-badge').textContent = versionString();
  document.title = APP_NAME;

  await store.init();
  syncAnzeige();
  document.getElementById('neu-laden')?.addEventListener('click', (e) => neuLaden(e.currentTarget));
  window.addEventListener('hashchange', () => route(true));
  aktualisiereNavigation();
  await route();

  // Listenansichten aktualisieren, wenn extern Daten eintreffen.
  let timer;
  store.subscribe(() => {
    // Masken mit Eingaben niemals unter den Fingern neu zeichnen
    if ([vEditor, vFreidoku, vVerbellenEditor].includes(aktuelleView)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      aktualisiereNavigation();
      route(false);
    }, 200);
  });

  sync.starte();
  updateAnzeige();
  update.starte();

  // Editor-Eingaben auch beim Schließen des Tabs sichern.
  window.addEventListener('pagehide', sichern);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sichern();
  });

  document.body.classList.remove('laedt');
}

start().catch((e) => {
  console.error(e);
  document.getElementById('view').innerHTML =
    `<div class="leer"><p>Die Anwendung konnte nicht starten.</p><pre>${esc(e.message)}</pre></div>`;
  document.body.classList.remove('laedt');
});
