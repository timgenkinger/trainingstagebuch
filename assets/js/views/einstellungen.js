/** Einstellungen: Abgleich, Stammdaten, Sicherung, Papierkorb, Version. */

import * as store from '../store.js';
import * as sync from '../sync/index.js';
import * as S from '../schema.js';
import { ladeConfig, loescheLokaleConfig, speichereConfig, geraeteName, setzeGeraeteName, STANDARD_CONFIG } from '../config.js';
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
  const s = sync.status;
  const hunde = store.hunde();
  const personen = store.personen();
  const muell = store.papierkorb();
  const entwuerfe = store.entwuerfe();

  return `<div class="seite">
    <div class="seite__kopf"><h1>Einstellungen</h1></div>

    ${karte('Online-Abgleich', `
      <div class="sync-box sync-box--${esc(s.zustand)}">
        <span class="punkt"></span>
        <div>
          <strong>${esc(zustandText(s.zustand))}${cfg.backend !== 'aus' ? ` · ${esc(verfahrenText(cfg.backend))}` : ''}</strong>
          <small>${esc(s.text)}</small>
          <small>Letzter Abgleich: ${esc(relativeZeit(s.letzterAbgleich))}</small>
        </div>
        ${cfg.backend !== 'aus' ? '<button type="button" class="btn btn--mini" data-sync-jetzt>Jetzt abgleichen</button>' : ''}
      </div>

      ${ziel(cfg)}

      <div class="freigabe-info">
        <strong>${entwuerfe.length}</strong> Entwurf/Entwürfe bleiben auf diesem Gerät,
        <strong>${store.suchen().length - entwuerfe.length}</strong> abgeschlossene Suchen werden geteilt.
        <small>Eine Suche wird erst hochgeladen, wenn ihr Protokoll vollständig ausgeführt und abgeschlossen ist.</small>
      </div>

      <div class="btn-zeile">
        <a class="btn btn--primaer" href="#/einrichtung">${cfg.backend === 'aus' ? 'Abgleich einrichten' : 'Einrichtung ändern'}</a>
        ${cfg.backend !== 'aus' ? '<button type="button" class="btn btn--gefahr-still" data-sync-trennen>Verbindung entfernen</button>' : ''}
      </div>

      ${s.protokoll.length ? `
        <h3 class="unter">Abgleich-Protokoll</h3>
        <ul class="protokoll">
          ${s.protokoll.slice(0, 12).map((p) => `<li class="prot prot--${esc(p.art)}">
            <span class="prot__zeit">${esc(uhrzeit(p.zeit))}</span>
            <span>${esc(p.text)}</span></li>`).join('')}
        </ul>` : ''}
    `)}

    ${karte('Dieses Gerät', feld('Gerätename', textInput('__geraet', geraeteName(), { placeholder: 'z.B. Handy Rainer' }),
      { hint: 'erscheint im Team als "zuletzt geändert von"' }))}

    ${karte('Hunde', `
      <div class="stamm-liste">
        ${hunde.length ? hunde.map((h) => stammZeile(h)).join('') : leer('Noch kein Hund angelegt.')}
      </div>
      <div class="btn-zeile">
        <input class="input" placeholder="Name des Hundes" data-neu-hund>
        <button type="button" class="btn btn--primaer" data-add-hund>Hinzufügen</button>
      </div>
    `)}

    ${karte('Hundeführer:innen', `
      <div class="stamm-liste">
        ${personen.length ? personen.map((p) => stammZeile(p)).join('') : leer('Noch keine Person angelegt.')}
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
        Es liegen ${store.rohdaten().length} Datensätze auf diesem Gerät. Der Zugangs-Token wird nie mit exportiert.</p>
    `)}

    ${karte('Papierkorb', muell.length
      ? `<div class="stamm-liste">${muell.map((x) => `<div class="stamm">
          <span>${esc(formatDatum(x.datum))} – ${esc(x.ort || 'ohne Ort')}</span>
          <button type="button" class="btn btn--mini" data-restore="${esc(x.id)}">Wiederherstellen</button>
        </div>`).join('')}</div>`
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
      <p class="karte__hint">Löscht nur die lokale Kopie. Bei aktivem Abgleich werden abgeschlossene Suchen
        anschließend wieder geladen – <strong>lokale Entwürfe sind dann endgültig weg.</strong></p>
    `, { klasse: 'karte--gefahr' })}
  </div>`;
}

function ziel(cfg) {
  if (cfg.backend === 'github') {
    const g = cfg.github;
    return `<p class="karte__hint">Datenspeicher: <code>${esc(g.owner)}/${esc(g.repo)}</code>,
      Branch <code>${esc(g.branch)}</code>, Datei <code>${esc(g.pfad)}</code>.
      Token ${g.token ? 'auf diesem Gerät hinterlegt' : '<strong>fehlt</strong>'}.</p>`;
  }
  if (cfg.backend === 'firebase') {
    return `<p class="karte__hint">Datenspeicher: Firestore-Projekt <code>${esc(cfg.firebase?.projectId || '?')}</code>,
      Sammlung <code>${esc(cfg.collection)}</code>.</p>`;
  }
  return `<p class="karte__hint">Ohne Abgleich bleiben alle Daten nur auf diesem Gerät.</p>`;
}

function zustandText(z) {
  return { aus: 'Kein Abgleich', verbinde: 'Verbinde …', aktiv: 'Verbunden', offline: 'Offline', fehler: 'Fehler' }[z] || z;
}

function verfahrenText(b) {
  return { github: 'GitHub-Repository', firebase: 'Cloud Firestore' }[b] || b;
}

function uhrzeit(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function stammZeile(r) {
  return `<div class="stamm">
    <input class="input input--schlank" value="${esc(r.name || '')}" data-rename="${esc(r.id)}">
    <button type="button" class="btn btn--mini btn--gefahr-still" data-del="${esc(r.id)}">×</button>
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

    if (t.closest('[data-sync-trennen]')) {
      if (await frage('Abgleich auf diesem Gerät entfernen? Die lokalen Daten und der Token bleiben bzw. werden gelöscht, die Daten im Team bleiben unberührt.', { ok: 'Entfernen', gefahr: true })) {
        await sync.stoppe();
        loescheLokaleConfig();
        speichereConfig({ ...STANDARD_CONFIG });
        sync.setzeStatus('aus', 'Kein Online-Abgleich eingerichtet');
        toast('Verbindung entfernt.');
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
      const n = store.entwuerfe().length;
      if (await frage(
        `Wirklich alle lokalen Daten dieses Geräts löschen?${n ? ` ${n} Entwurf/Entwürfe sind noch nicht geteilt und wären endgültig verloren.` : ''}`,
        { ok: 'Endgültig löschen', gefahr: true }
      )) {
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
