/** Einstellungen: Online-Sync, Stammdaten, Sicherung, Papierkorb, Version. */

import * as store from '../store.js';
import * as sync from '../sync.js';
import { ladeConfig, speichereConfig, loescheLokaleConfig, geraeteName, setzeGeraeteName, STANDARD_CONFIG } from '../config.js';
import { RELEASE_DATE, BUILD, versionString } from '../version.js';
import { esc, karte, feld, textInput, toast, frage, download, relativeZeit, formatDatum, leer } from '../ui.js';

export async function render(wurzel) {
  zeichne(wurzel);
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  binde(wurzel.querySelector('.seite'), wurzel);
}

function html() {
  const cfg = ladeConfig();
  const konfiguriert = !!cfg.firebase?.apiKey;
  const s = sync.status;
  const hunde = store.hunde();
  const personen = store.personen();
  const muell = store.papierkorb();

  return `<div class="seite">
    <div class="seite__kopf"><h1>Einstellungen</h1></div>

    ${karte('Online-Abgleich', `
      <div class="sync-box sync-box--${esc(s.zustand)}">
        <span class="punkt"></span>
        <div>
          <strong>${esc(zustandText(s.zustand))}</strong>
          <small>${esc(s.text)}${s.offen ? ` · ${s.offen} Änderung(en) warten` : ''}</small>
          <small>Letzter Empfang: ${esc(relativeZeit(s.letzterAbgleich))}</small>
        </div>
        <button type="button" class="btn btn--mini" data-sync-jetzt>Jetzt abgleichen</button>
      </div>

      <p class="karte__hint">Alle Daten liegen zuerst auf diesem Gerät und werden dann mit der gemeinsamen
        Firestore-Datenbank gemischt. Ein Abgleich überschreibt nie neuere lokale Daten, und ein leerer Server
        löscht nichts – ein App-Update setzt daher niemals Daten zurück.</p>

      ${feld('Firebase-Konfiguration (JSON)',
        `<textarea class="input input--code" rows="9" data-firebase placeholder='{
  "apiKey": "…",
  "authDomain": "projekt.firebaseapp.com",
  "projectId": "projekt",
  "storageBucket": "projekt.appspot.com",
  "messagingSenderId": "…",
  "appId": "…"
}'>${esc(cfg.firebase ? JSON.stringify(cfg.firebase, null, 2) : '')}</textarea>`,
        { hint: 'aus der Firebase-Konsole → Projekteinstellungen → Web-App' })}

      ${feld('Sammlung (Collection)', textInput('__collection', cfg.collection, { placeholder: 'trainingstagebuch' }))}

      <div class="btn-zeile">
        <button type="button" class="btn btn--primaer" data-sync-speichern>Speichern &amp; verbinden</button>
        <button type="button" class="btn btn--still" data-sync-config-kopieren>config.js für das Team kopieren</button>
        ${konfiguriert ? `<button type="button" class="btn btn--gefahr-still" data-sync-trennen>Verbindung entfernen</button>` : ''}
      </div>
      <p class="karte__hint">Damit alle im Team automatisch dieselbe Datenbank nutzen, den kopierten Inhalt in
        <code>assets/js/config.js</code> einsetzen und ins Repository committen. Die Web-Konfiguration ist kein Geheimnis –
        der Schutz kommt aus den Firestore-Regeln (siehe README).</p>
    `)}

    ${karte('Dieses Gerät', feld('Gerätename', textInput('__geraet', geraeteName(), { placeholder: 'z.B. Handy Rainer' }),
      { hint: 'erscheint im Team als "zuletzt geändert von"' }))}

    ${karte('Hunde', `
      <div class="stamm-liste">
        ${hunde.length ? hunde.map((h) => stammZeile(h, 'hund')).join('') : leer('Noch kein Hund angelegt.')}
      </div>
      <div class="btn-zeile">
        <input class="input" placeholder="Name des Hundes" data-neu-hund>
        <button type="button" class="btn btn--primaer" data-add-hund>Hinzufügen</button>
      </div>
    `)}

    ${karte('Hundeführer:innen', `
      <div class="stamm-liste">
        ${personen.length ? personen.map((p) => stammZeile(p, 'person')).join('') : leer('Noch keine Person angelegt.')}
      </div>
      <div class="btn-zeile">
        <input class="input" placeholder="Name" data-neu-person>
        <button type="button" class="btn btn--primaer" data-add-person>Hinzufügen</button>
      </div>
    `)}

    ${karte('Sicherung', `
      <div class="btn-zeile">
        <button type="button" class="btn btn--still" data-export>Alle Daten exportieren (JSON)</button>
        <label class="btn btn--still">Import … <input type="file" accept="application/json,.json" hidden data-import></label>
      </div>
      <p class="karte__hint">Der Import mischt nur: bestehende neuere Datensätze bleiben erhalten.
        Es liegen ${store.rohdaten().length} Datensätze auf diesem Gerät.</p>
    `)}

    ${karte('Papierkorb', muell.length
      ? `<div class="stamm-liste">${muell
          .map(
            (s) => `<div class="stamm">
          <span>${esc(formatDatum(s.datum))} – ${esc(s.ort || 'ohne Ort')}</span>
          <button type="button" class="btn btn--mini" data-restore="${esc(s.id)}">Wiederherstellen</button>
        </div>`
          )
          .join('')}</div>`
      : leer('Papierkorb ist leer.'))}

    ${karte('Version', `
      <div class="version">
        <strong>${esc(versionString())}</strong>
        <span>Release ${esc(formatDatum(RELEASE_DATE))}${BUILD && BUILD !== 'lokal' ? ` · Build ${esc(BUILD)}` : ''}</span>
      </div>
      <div class="btn-zeile">
        <button type="button" class="btn btn--still" data-update-pruefen>Auf Update prüfen</button>
        <a class="btn btn--still" href="CHANGELOG.md" target="_blank" rel="noopener">Änderungsprotokoll</a>
      </div>
      <p class="karte__hint">Ein Update tauscht nur den Programmcode aus. Die Datenbank auf dem Gerät bleibt unberührt.</p>
    `)}

    ${karte('Gefahrenzone', `
      <button type="button" class="btn btn--gefahr" data-reset>Lokale Daten auf diesem Gerät löschen</button>
      <p class="karte__hint">Löscht nur die lokale Kopie. Bei aktivem Online-Abgleich werden die Daten anschließend
        wieder vom Server geladen.</p>
    `, { klasse: 'karte--gefahr' })}
  </div>`;
}

function zustandText(z) {
  return (
    { aus: 'Kein Online-Sync', verbinde: 'Verbinde …', aktiv: 'Verbunden', offline: 'Offline', fehler: 'Fehler' }[z] ||
    z
  );
}

function stammZeile(r, typ) {
  return `<div class="stamm">
    <input class="input input--schlank" value="${esc(r.name || '')}" data-rename="${esc(r.id)}">
    <button type="button" class="btn btn--mini btn--gefahr-still" data-del="${esc(r.id)}" data-typ="${typ}">×</button>
  </div>`;
}

function binde(box, wurzel) {
  if (!box) return;

  box.addEventListener('click', async (e) => {
    const t = e.target;

    if (t.closest('[data-sync-jetzt]')) {
      sync.jetztAbgleichen();
      toast('Abgleich angestoßen.');
      return;
    }

    if (t.closest('[data-sync-speichern]')) {
      const roh = box.querySelector('[data-firebase]').value.trim();
      const collection = box.querySelector('[data-pfad="__collection"]').value.trim() || STANDARD_CONFIG.collection;
      let firebase = null;
      if (roh) {
        try {
          firebase = JSON.parse(normalisiere(roh));
        } catch (err) {
          toast('Die Firebase-Konfiguration ist kein gültiges JSON.', 'fehler');
          return;
        }
        if (!firebase.apiKey || !firebase.projectId) {
          toast('apiKey und projectId fehlen in der Konfiguration.', 'fehler');
          return;
        }
      }
      speichereConfig({ firebase, collection });
      toast('Gespeichert – verbinde …');
      await sync.neustart();
      zeichne(wurzel);
      return;
    }

    if (t.closest('[data-sync-config-kopieren]')) {
      const cfg = ladeConfig();
      const text = `export const STANDARD_CONFIG = ${JSON.stringify(
        { firebase: cfg.firebase, collection: cfg.collection },
        null,
        2
      )};`;
      try {
        await navigator.clipboard.writeText(text);
        toast('In die Zwischenablage kopiert.');
      } catch {
        download('config-schnipsel.txt', text, 'text/plain');
        toast('Zwischenablage nicht verfügbar – als Datei geladen.');
      }
      return;
    }

    if (t.closest('[data-sync-trennen]')) {
      if (await frage('Online-Abgleich auf diesem Gerät entfernen? Die lokalen Daten bleiben erhalten.', { ok: 'Entfernen', gefahr: true })) {
        loescheLokaleConfig();
        speichereConfig({ firebase: null, collection: STANDARD_CONFIG.collection });
        toast('Verbindung entfernt. Seite neu laden, um die Verbindung vollständig zu trennen.');
        zeichne(wurzel);
      }
      return;
    }

    if (t.closest('[data-add-hund]')) {
      const el = box.querySelector('[data-neu-hund]');
      if (!el.value.trim()) return;
      await store.put({ type: 'hund', name: el.value.trim() });
      zeichne(wurzel);
      return;
    }

    if (t.closest('[data-add-person]')) {
      const el = box.querySelector('[data-neu-person]');
      if (!el.value.trim()) return;
      await store.put({ type: 'person', name: el.value.trim() });
      zeichne(wurzel);
      return;
    }

    const del = t.closest('[data-del]');
    if (del) {
      if (await frage('Eintrag entfernen? Bereits dokumentierte Suchen bleiben erhalten.', { ok: 'Entfernen', gefahr: true })) {
        await store.entferne(del.dataset.del);
        zeichne(wurzel);
      }
      return;
    }

    const rest = t.closest('[data-restore]');
    if (rest) {
      await store.stelleWiederHer(rest.dataset.restore);
      toast('Suche wiederhergestellt.');
      zeichne(wurzel);
      return;
    }

    if (t.closest('[data-export]')) {
      download(`trainingstagebuch-${new Date().toISOString().slice(0, 10)}.json`, store.exportJson());
      return;
    }

    if (t.closest('[data-update-pruefen]')) {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (!reg) {
        toast('Kein Offline-Speicher aktiv (läuft die App über http://?).');
        return;
      }
      await reg.update();
      toast('Update-Prüfung läuft. Bei neuer Version erscheint ein Hinweis.');
      return;
    }

    if (t.closest('[data-reset]')) {
      if (
        await frage('Wirklich alle lokalen Daten dieses Geräts löschen? Ohne Online-Abgleich sind sie danach weg.', {
          ok: 'Endgültig löschen',
          gefahr: true,
        })
      ) {
        await store.allesLoeschen();
        toast('Lokale Daten gelöscht.');
        location.hash = '#/suchen';
      }
    }
  });

  box.addEventListener('change', async (e) => {
    const ren = e.target.closest('[data-rename]');
    if (ren) {
      const r = store.get(ren.dataset.rename);
      if (r) await store.put({ ...r, name: ren.value.trim() });
      return;
    }
    const g = e.target.closest('[data-pfad="__geraet"]');
    if (g) {
      setzeGeraeteName(g.value);
      toast('Gerätename gespeichert.');
    }
  });

  const datei = box.querySelector('[data-import]');
  datei?.addEventListener('change', async () => {
    const f = datei.files?.[0];
    if (!f) return;
    try {
      const n = await store.importJson(await f.text());
      toast(`${n} Datensätze importiert.`);
      sync.jetztAbgleichen();
      zeichne(wurzel);
    } catch (err) {
      toast('Import fehlgeschlagen: ' + err.message, 'fehler');
    }
  });
}

/** Erlaubt auch das Einfügen des JS-Objekts aus der Firebase-Konsole. */
function normalisiere(text) {
  let t = text.trim();
  const start = t.indexOf('{');
  const ende = t.lastIndexOf('}');
  if (start >= 0 && ende > start) t = t.slice(start, ende + 1);
  t = t.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":').replace(/'/g, '"').replace(/,(\s*[}\]])/g, '$1');
  return t;
}
