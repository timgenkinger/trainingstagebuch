/** Anwendungsgerüst: Router, Kopfzeile, Sync-Anzeige, Update-Hinweis. */

import * as store from './store.js';
import * as sync from './sync.js';
import { versionString, APP_NAME } from './version.js';
import { esc } from './ui.js';

import * as vSuchen from './views/suchen.js';
import * as vEditor from './views/editor.js';
import * as vDashboard from './views/dashboard.js';
import * as vBilder from './views/bilder.js';
import * as vEinstellungen from './views/einstellungen.js';

const ROUTEN = [
  { muster: /^#\/suchen$/, view: vSuchen, tab: 'suchen' },
  { muster: /^#\/suche\/neu$/, view: vEditor, tab: 'suchen', params: () => ({}) },
  { muster: /^#\/suche\/(.+)$/, view: vEditor, tab: 'suchen', params: (m) => ({ id: m[1] }) },
  { muster: /^#\/dashboard$/, view: vDashboard, tab: 'dashboard' },
  { muster: /^#\/bilder$/, view: vBilder, tab: 'bilder' },
  { muster: /^#\/einstellungen$/, view: vEinstellungen, tab: 'mehr' },
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

  aktuelleView = treffer.r.view;
  const view = document.getElementById('view');
  const y = window.scrollY;
  markiereTab(treffer.r.tab);
  await treffer.r.view.render(view, treffer.r.params ? treffer.r.params(treffer.m) : {});
  // Beim Seitenwechsel nach oben, beim stillen Auffrischen die Position halten.
  if (navigiert && treffer.r.view !== vEditor) window.scrollTo(0, 0);
  else if (!navigiert) window.scrollTo(0, y);
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
      { aus: 'Nur lokal', verbinde: 'Verbinde', aktiv: s.offen ? `${s.offen} offen` : 'Synchron', offline: 'Offline', fehler: 'Sync-Fehler' }[
        s.zustand
      ] || s.zustand;
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
  window.addEventListener('hashchange', () => route(true));
  await route();

  // Listenansichten aktualisieren, wenn extern Daten eintreffen.
  let timer;
  store.subscribe(() => {
    if (aktuelleView === vEditor) return; // Editor niemals unter den Fingern neu zeichnen
    clearTimeout(timer);
    timer = setTimeout(() => route(false), 200);
  });

  sync.starte();
  serviceWorker();

  // Editor-Eingaben auch beim Schließen des Tabs sichern.
  window.addEventListener('pagehide', () => {
    if (aktuelleView === vEditor) vEditor.flushEditor();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && aktuelleView === vEditor) vEditor.flushEditor();
  });

  document.body.classList.remove('laedt');
}

start().catch((e) => {
  console.error(e);
  document.getElementById('view').innerHTML =
    `<div class="leer"><p>Die Anwendung konnte nicht starten.</p><pre>${esc(e.message)}</pre></div>`;
  document.body.classList.remove('laedt');
});
