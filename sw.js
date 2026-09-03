/**
 * Service Worker – macht die App offline nutzbar (Training findet im Wald statt).
 *
 * WICHTIG: Hier wird ausschließlich der PROGRAMMCODE zwischengespeichert.
 * Die Nutzdaten liegen in IndexedDB und werden hier niemals angefasst –
 * ein Update tauscht nur den Cache aus, nicht die Datenbank.
 */

const VERSION = '1.9.0'; // wird von scripts/release.sh gepflegt
const CACHE = `rhd-app-${VERSION}`;

const DATEIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './version.json',
  './assets/css/styles.css',
  './assets/icons/icon.svg',
  './assets/js/app.js',
  './assets/js/charts.js',
  './assets/js/config.js',
  './assets/js/helferbilder.js',
  './assets/js/idb.js',
  './assets/js/update.js',
  './assets/js/rollen.js',
  './assets/js/schema.js',
  './assets/js/skizze.js',
  './assets/js/store.js',
  './assets/js/verbellen.js',
  './assets/js/verbellen-plan.js',
  './assets/js/ui.js',
  './assets/js/version.js',
  './assets/js/sync/index.js',
  './assets/js/sync/github.js',
  './assets/js/sync/firestore.js',
  './assets/js/views/bausteine.js',
  './assets/js/views/bestaetigung.js',
  './assets/js/views/bilder.js',
  './assets/js/views/dashboard.js',
  './assets/js/views/editor.js',
  './assets/js/views/einrichtung.js',
  './assets/js/views/einstellungen.js',
  './assets/js/views/freidoku.js',
  './assets/js/views/suchen.js',
  './assets/js/views/verbellen.js',
  './assets/js/views/verbellen-editor.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      // ENTSCHEIDEND: `cache: 'reload'` umgeht den HTTP-Cache des Browsers.
      // Ohne das legt ein neuer Service Worker die ALTEN Dateien in seinen
      // neuen Cache - GitHub Pages liefert mit max-age=600 -, und die App
      // zeigt nach dem Update weiterhin die alte Fassung.
      await Promise.all(
        DATEIEN.map(async (pfad) => {
          try {
            const res = await fetch(new Request(pfad, { cache: 'reload' }));
            if (res.ok) await c.put(pfad, res);
          } catch (err) {
            // Einzelne Ausfälle dürfen die Installation nicht verhindern,
            // sonst bleibt die alte Fassung für immer stehen.
            console.warn('nicht zwischengespeichert:', pfad, err);
          }
        })
      );
    })()
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const namen = await caches.keys();
      // Nur alte APP-Caches entfernen. IndexedDB bleibt unberührt.
      await Promise.all(namen.filter((n) => n.startsWith('rhd-app-') && n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (e) => {
  if (e.data?.typ === 'UEBERNEHMEN') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Lebende Daten niemals aus dem Cache bedienen.
  if (url.hostname === 'api.github.com') return;

  // Die Versionsdatei ist das Sicherheitsnetz der App-Aktualisierung und darf
  // deshalb niemals aus dem Cache kommen.
  if (url.origin === location.origin && url.pathname.endsWith('/version.json')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request)));
    return;
  }

  // Seitenaufrufe zuerst aus dem Netz. Klemmt der Service Worker einmal,
  // liefert er dadurch nicht endlos die alte Seite aus.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const kopie = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', kopie));
          return res;
        })
        .catch(() => caches.match('./index.html').then((t) => t || caches.match('./')))
    );
    return;
  }
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('firebaseio.com')) return;

  // Firebase-SDK: erst Netz, dann Cache (damit es offline weiterhin lädt).
  if (url.hostname === 'www.gstatic.com') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const kopie = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, kopie));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Eigene Dateien: Cache zuerst, im Hintergrund auffrischen.
  // Bewusst nur im Cache DIESER Fassung suchen: `caches.match` durchsucht alle
  // Caches in Anlegereihenfolge und würde sonst den älteren Stand bevorzugen.
  e.respondWith(
    caches.open(CACHE).then((c) => c.match(e.request)).then((treffer) => {
      const netz = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const kopie = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, kopie));
          }
          return res;
        })
        .catch(() => treffer || caches.match('./index.html'));
      return treffer || netz;
    })
  );
});
