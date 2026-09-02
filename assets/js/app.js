/** Anwendungsgerüst: Router, Kopfzeile, Sync-Anzeige, Update-Hinweis. */

import * as store from './store.js';
import * as sync from './sync/index.js';
import { versionString, APP_NAME } from './version.js';
import { esc } from './ui.js';

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
  { muster: /^#\/suchen$/, view: vSuchen, tab: 'suchen' },
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

  aktuelleView = treffer.r.view;
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
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ typ: 'UEBERNEHMEN' });
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  } catch (e) {
    console.warn('Update-Prüfung übersprungen:', e);
  }
  location.reload();
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

/* ---------------- Service Worker ---------------- */

async function serviceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  try {
    const reg = await navigator.serviceWorker.register('sw.js', { scope: './' });
    reg.addEventListener('updatefound', () => {
      const neu = reg.installing;
      neu?.addEventListener('statechange', () => {
        if (neu.state === 'installed' && navigator.serviceWorker.controller) zeigeUpdate(reg);
      });
    });
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  } catch (e) {
    console.warn('Service Worker nicht registriert:', e);
  }
}

function zeigeUpdate(reg) {
  const bar = document.getElementById('update-bar');
  if (!bar) return;
  bar.hidden = false;
  bar.querySelector('button').onclick = () => {
    reg.waiting?.postMessage({ typ: 'UEBERNEHMEN' });
    setTimeout(() => location.reload(), 300);
  };
}

/* ---------------- Start ---------------- */

async function start() {
  document.getElementById('version-badge').textContent = versionString();
  document.title = APP_NAME;

  await store.init();
  syncAnzeige();
  document.getElementById('neu-laden')?.addEventListener('click', (e) => neuLaden(e.currentTarget));
  window.addEventListener('hashchange', () => route(true));
  await route();

  // Listenansichten aktualisieren, wenn extern Daten eintreffen.
  let timer;
  store.subscribe(() => {
    // Masken mit Eingaben niemals unter den Fingern neu zeichnen
    if ([vEditor, vFreidoku, vVerbellenEditor].includes(aktuelleView)) return;
    clearTimeout(timer);
    timer = setTimeout(() => route(false), 200);
  });

  sync.starte();
  serviceWorker();

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
