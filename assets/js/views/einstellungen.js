/** Einstellungen: Abgleich, Stammdaten, Sicherung, Papierkorb, Version. */

import * as store from '../store.js';
import * as sync from '../sync/index.js';
import * as S from '../schema.js';
import { ladeConfig, loescheLokaleConfig, speichereConfig, speichereToken, geraeteName, setzeGeraeteName, STANDARD_CONFIG } from '../config.js';
import { RELEASE_DATE, BUILD, versionString } from '../version.js';
import * as update from '../update.js';
import * as R from '../rollen.js';
import { esc, karte, feld, textInput, toast, frage, passwortFrage, download, relativeZeit, formatDatum, leer } from '../ui.js';

let statusAbmelden = null;
let updateAbmelden = null;

export async function render(wurzel) {
  zeichne(wurzel);
  // Auch die Versionsprüfung läuft asynchron – die Karte zieht nach.
  updateAbmelden?.();
  let letzterStand = null;
  updateAbmelden = update.onUpdate((z) => {
    const kennung = `${z.serverVersion}|${z.updateBereit}|${z.letzteRuefung}`;
    if (kennung === letzterStand) return;
    letzterStand = kennung;
    if (document.getElementById('view')?.contains(wurzel.querySelector('.seite'))) zeichne(wurzel);
  });
  // Der Abgleich meldet seinen Zustand asynchron – die Seite zieht nach.
  statusAbmelden?.();
  let letzter = null;
  statusAbmelden = sync.onStatus((s) => {
    const kennung = `${s.zustand}|${s.offen}|${s.text}`;
    if (kennung === letzter) return;
    letzter = kennung;
    if (document.getElementById('view')?.contains(wurzel.querySelector('.seite'))) zeichne(wurzel);
  });
}

export function verlassen() {
  statusAbmelden?.();
  statusAbmelden = null;
  updateAbmelden?.();
  updateAbmelden = null;
}

function zeichne(wurzel) {
  const fokus = document.activeElement?.dataset?.token !== undefined;
  const wert = fokus ? document.activeElement.value : null;
  wurzel.innerHTML = html();
  binde(wurzel.querySelector('.seite'), wurzel);
  if (fokus) {
    const neu = wurzel.querySelector('[data-token]');
    if (neu) { neu.value = wert; neu.focus(); }
  }
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

    ${!R.eingerichtet() ? `<div class="hinweis-kasten">
      <strong>Erster Schritt: Wer arbeitet an diesem Gerät?</strong>
      <p>Solange niemand zugeordnet ist, zeigt die App keine Hunde und keine Dokumentation.
        Die Auswahl steht weiter unten unter „Dieses Gerät“. Neue Geräte starten immer als
        Hundeführer:in; die Ausbilder-Rolle ist passwortgeschützt.</p>
    </div>` : ''}

    ${karte('Online-Abgleich', `
      <div class="sync-box sync-box--${esc(s.zustand)}">
        <span class="punkt"></span>
        <div>
          <strong>${esc(zustandText(s.zustand))}${cfg.backend !== 'aus' ? ` · ${esc(verfahrenText(cfg.backend))}` : ''}</strong>
          <small>${esc(s.text)}</small>
          <small>Letzter Abgleich: ${esc(relativeZeit(s.letzterAbgleich))}</small>
        </div>
        ${cfg.backend !== 'aus' && s.zustand !== 'kein-token'
          ? '<button type="button" class="btn btn--mini" data-sync-jetzt>Jetzt abgleichen</button>'
          : ''}
      </div>

      ${tokenKasten(cfg)}
      ${ziel(cfg)}

      <div class="freigabe-info">
        <strong>${entwuerfe.length}</strong> Entwurf/Entwürfe bleiben auf diesem Gerät,
        <strong>${store.dokumente().length - entwuerfe.length}</strong> abgeschlossene Einträge werden geteilt.
        <small>Ein Eintrag wird erst hochgeladen, wenn er vollständig ausgefüllt und abgeschlossen ist –
        das gilt für Suchen wie für freie Dokumentationen.</small>
      </div>

      <div class="btn-zeile">
        <a class="btn ${cfg.github.token || cfg.backend !== 'github' ? 'btn--still' : 'btn--still'}" href="#/einrichtung">${
        cfg.backend === 'aus' ? 'Abgleich einrichten' : 'Einrichtung ändern'
      }</a>
        ${cfg.github.token || cfg.backend === 'firebase'
          ? '<button type="button" class="btn btn--gefahr-still" data-sync-trennen>Zugang von diesem Gerät entfernen</button>'
          : ''}
      </div>

      ${s.protokoll.length ? `
        <h3 class="unter">Abgleich-Protokoll</h3>
        <ul class="protokoll">
          ${s.protokoll.slice(0, 12).map((p) => `<li class="prot prot--${esc(p.art)}">
            <span class="prot__zeit">${esc(uhrzeit(p.zeit))}</span>
            <span>${esc(p.text)}</span></li>`).join('')}
        </ul>` : ''}
    `)}

    ${karte('Dieses Gerät', `
      ${feld('Wer arbeitet an diesem Gerät?',
        `<select class="input" data-person>
          <option value="">– niemand zugeordnet –</option>
          ${personen.map((p) => `<option value="${esc(p.id)}"${R.meinePersonId() === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}
        </select>`,
        { hint: 'steuert, welche Hunde angezeigt werden' })}
      ${feld('Rolle',
        `<select class="input" data-rolle>
          ${R.ROLLEN.map((r) => `<option value="${esc(r.id)}"${R.meineRolle() === r.id ? ' selected' : ''}>${esc(r.label)} – ${esc(r.beschreibung)}</option>`).join('')}
        </select>`,
        { hint: 'der Wechsel zur Ausbildung verlangt das vereinbarte Passwort' })}
      ${feld('Gerätename', textInput('__geraet', geraeteName(), { placeholder: 'z.B. Handy Rainer' }),
        { hint: 'erscheint im Team als "zuletzt geändert von"' })}
      <p class="karte__hint"><strong>Wichtig:</strong> Die Rolle ordnet die Ansicht, sie schützt die Daten nicht.
        Alle Geräte teilen sich eine Datei und einen Zugangs-Token – wer den Token hat, kann technisch
        den ganzen Bestand lesen. Für eine echte Zugriffssperre bräuchte es einen Server mit Benutzerkonten.</p>
      ${R.eingerichtet() && !R.istAusbilder()
        ? `<p class="karte__hint">Sichtbar sind aktuell: ${R.meineHunde().map((h) => esc(h.name)).join(', ') || '<em>keine Hunde zugeordnet – bitte bei der Ausbildung melden</em>'}.</p>`
        : ''}
    `)}

    ${R.istAusbilder() ? karte('Ausbildung', `
      ${(() => {
        const offen = R.offeneBestaetigungen();
        return offen.length
          ? `<p class="abschluss__offen">${offen.length} abgeschlossene Einheit(en) warten auf Bestätigung.</p>
             <a class="btn btn--primaer" href="#/bestaetigungen">Offene Bestätigungen ansehen</a>`
          : '<p class="gut">Alle abgeschlossenen Einheiten sind bestätigt. 👍</p>';
      })()}
      <h3 class="unter">Was Hundeführer:innen sehen</h3>
      <label class="schalter">
        <input type="checkbox" data-eigener-stand ${R.teamEinstellung().eigenerStandSichtbar ? 'checked' : ''}>
        <span>Hundeführer:innen dürfen Dashboard, Verbellen-Stand und Helfer:in-Bilder
          <strong>ihrer eigenen Hunde</strong> einsehen</span>
      </label>
      <p class="karte__hint">Ist der Schalter aus, sind diese Auswertungen ausschließlich für
        Ausbilder:innen sichtbar. Dokumentieren können Hundeführer:innen in jedem Fall.
        Diese Einstellung gilt für das ganze Team und wird mit abgeglichen.</p>
    `) : ''}

    ${karte('Hunde', `
      <div class="stamm-liste">
        ${hunde.length ? hunde.map((h) => hundZeile(h, personen)).join('') : leer('Noch kein Hund angelegt.')}
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
      <dl class="programmstand">
        <dt>Installiert</dt><dd>${esc(update.zustand.laufendeVersion)}</dd>
        <dt>Auf dem Server</dt><dd>${esc(update.zustand.serverVersion || 'noch nicht geprüft')}</dd>
        <dt>Offline-Speicher</dt><dd data-sw-status>wird geprüft …</dd>
        <dt>Zuletzt geprüft</dt><dd>${esc(update.zustand.letzteRuefung ? relativeZeit(update.zustand.letzteRuefung) : 'noch nie')}</dd>
      </dl>
      ${update.zustand.updateBereit
        ? `<p class="abschluss__offen">Eine neue Fassung steht bereit.</p>
           <button type="button" class="btn btn--primaer" data-update-uebernehmen>Jetzt aktualisieren</button>`
        : ''}
      <div class="btn-zeile">
        <button type="button" class="btn btn--still" data-update-pruefen>Auf Update prüfen</button>
        <a class="btn btn--still" href="Handbuch-Trainingstagebuch.pdf" target="_blank" rel="noopener">Handbuch (PDF)</a>
        <a class="btn btn--still" href="CHANGELOG.md" target="_blank" rel="noopener">Änderungsprotokoll</a>
      </div>
      <p class="karte__hint">Ein Update tauscht nur den Programmcode aus. Die Datenbank auf dem Gerät bleibt unberührt.</p>
      <details class="notfall">
        <summary>Aktualisierung klemmt trotzdem?</summary>
        <p class="karte__hint">Setzt den Offline-Speicher zurück und lädt die App frisch vom Server.
          Deine Daten bleiben unberührt – sie liegen in der Datenbank, nicht im Offline-Speicher.</p>
        <button type="button" class="btn btn--gefahr-still" data-update-notfall>Offline-Speicher zurücksetzen</button>
      </details>
    `)}

    ${karte('Gefahrenzone', `
      <button type="button" class="btn btn--gefahr" data-reset>Lokale Daten auf diesem Gerät löschen</button>
      <p class="karte__hint">Löscht nur die lokale Kopie. Bei aktivem Abgleich werden abgeschlossene Suchen
        anschließend wieder geladen – <strong>lokale Entwürfe sind dann endgültig weg.</strong></p>
    `, { klasse: 'karte--gefahr' })}
  </div>`;
}

/**
 * Schnelleingabe: Adresse der Datenablage steht bereits in der Auslieferung,
 * es fehlt nur noch der persönliche Zugangs-Token.
 */
function tokenKasten(cfg) {
  if (cfg.backend !== 'github' || cfg.github.token) return '';
  return `<div class="token-kasten">
    <h3>Nur noch der Zugangs-Token fehlt</h3>
    <p>Die gemeinsame Datenablage <code>${esc(cfg.github.owner)}/${esc(cfg.github.repo)}</code> ist bereits hinterlegt.
      Trage einmalig deinen persönlichen Token ein – er bleibt ausschließlich auf diesem Gerät.</p>
    <div class="btn-zeile">
      <input class="input input--code" type="password" data-token placeholder="github_pat_…" autocomplete="off">
      <button type="button" class="btn btn--primaer" data-token-speichern>Verbinden</button>
    </div>
    <p class="karte__hint">Token erzeugen unter
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Fine-grained tokens</a>:
      nur das Repository <code>${esc(cfg.github.repo)}</code> auswählen und bei
      <em>Repository permissions → Contents</em> auf <strong>Read and write</strong> stellen.
      Wenn ihr im Team einen gemeinsamen Token nutzt, frag danach – dann entfällt dieser Schritt.</p>
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
  return {
    aus: 'Kein Abgleich',
    'kein-token': 'Zugang fehlt',
    verbinde: 'Verbinde …',
    aktiv: 'Verbunden',
    offline: 'Offline',
    fehler: 'Fehler',
  }[z] || z;
}

function verfahrenText(b) {
  return { github: 'GitHub-Repository', firebase: 'Cloud Firestore' }[b] || b;
}

function uhrzeit(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Hund mit Zuordnung. Die Richtung muss unmissverständlich sein: Zugeordnet
 * wird eine Hundeführer:in ZU DIESEM HUND – deshalb steht der Hundename in der
 * Beschriftung und nicht nur ein allgemeines "Zuordnung".
 */
function hundZeile(h, personen) {
  const zugeordnet = (h.hfIds || []).map((id) => store.get(id)).filter(Boolean);
  const offen = personen.filter((p) => !(h.hfIds || []).includes(p.id));
  const name = h.name?.trim() || 'diesem Hund';

  return `<div class="stamm stamm--hund">
    <div class="stamm__zeile">
      <input class="input input--schlank" value="${esc(h.name || '')}" data-rename="${esc(h.id)}"
        aria-label="Name des Hundes">
      <button type="button" class="btn btn--mini btn--gefahr-still" data-del="${esc(h.id)}"
        aria-label="Hund entfernen">×</button>
    </div>

    <div class="zuordnung">
      <span class="zuordnung__label">Wer führt <strong>${esc(name)}</strong>?</span>

      ${zugeordnet.length
        ? `<div class="zuordnung__liste">
            ${zugeordnet.map((p) => `<span class="zuordnung__tag">${esc(p.name)}
              <button type="button" data-zuordnung-weg="${esc(h.id)}:${esc(p.id)}"
                aria-label="${esc(p.name)} von ${esc(name)} lösen" title="Zuordnung lösen">×</button>
            </span>`).join('')}
          </div>`
        : `<small class="stamm__warnung">Niemandem zugeordnet – nur die Ausbildung sieht ${esc(name)}.</small>`}

      ${personen.length
        ? (offen.length
            ? `<select class="input input--schlank zuordnung__auswahl" data-zuordnung-add="${esc(h.id)}"
                aria-label="Hundeführer:in zu ${esc(name)} zuordnen">
                <option value="">+ Hundeführer:in zuordnen …</option>
                ${offen.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}
              </select>`
            : '<small class="zuordnung__fertig">Alle Hundeführer:innen sind zugeordnet.</small>')
        : '<small class="stamm__warnung">Erst Hundeführer:innen anlegen, dann zuordnen.</small>'}
    </div>
  </div>`;
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

    const zweg = t.closest('[data-zuordnung-weg]');
    if (zweg) {
      const [hundId, personId] = zweg.dataset.zuordnungWeg.split(':');
      const h = store.get(hundId);
      if (h) {
        await store.put({ ...h, hfIds: (h.hfIds || []).filter((x) => x !== personId) });
        toast(`${store.get(personId)?.name || 'Person'} führt ${h.name} nicht mehr.`);
        zeichne(wurzel);
      }
      return;
    }

    if (t.closest('[data-token-speichern]')) {
      const feldEl = box.querySelector('[data-token]');
      const wert = feldEl.value.trim();
      if (!wert) {
        toast('Bitte den Token einfügen.', 'fehler');
        return;
      }
      speichereToken(wert);
      toast('Token gespeichert – verbinde …');
      const ok = await sync.neustart();
      if (!ok) toast('Verbindung fehlgeschlagen – Einzelheiten im Assistenten unter "Einrichtung ändern".', 'fehler');
      zeichne(wurzel);
      return;
    }

    if (t.closest('[data-sync-jetzt]')) {
      sync.jetztAbgleichen();
      toast('Abgleich angestoßen.');
      return;
    }

    if (t.closest('[data-sync-trennen]')) {
      if (await frage('Zugang von diesem Gerät entfernen? Der Token wird gelöscht, deine lokalen Daten und die Daten im Team bleiben unberührt.', { ok: 'Entfernen', gefahr: true })) {
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
      toast('Prüfe …');
      const z = await update.pruefe({ erzwingen: true });
      zeichne(wurzel);
      toast(
        z.updateBereit
          ? `Neue Fassung ${z.serverVersion || ''} steht bereit.`
          : `Aktuell – installiert ist ${z.laufendeVersion}.`
      );
      return;
    }

    if (t.closest('[data-update-uebernehmen]')) {
      await update.uebernehmenUndNeuLaden();
      return;
    }

    if (t.closest('[data-update-notfall]')) {
      if (await frage('Offline-Speicher zurücksetzen und App neu laden? Deine Daten bleiben erhalten.', { ok: 'Zurücksetzen' })) {
        await update.notfallZuruecksetzen();
      }
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
    const zadd = e.target.closest('[data-zuordnung-add]');
    if (zadd) {
      const personId = zadd.value;
      if (!personId) return;
      const h = store.get(zadd.dataset.zuordnungAdd);
      if (h) {
        const ids = new Set(h.hfIds || []);
        ids.add(personId);
        await store.put({ ...h, hfIds: [...ids] });
        toast(`${store.get(personId)?.name || 'Person'} führt jetzt ${h.name}.`);
        zeichne(wurzel);
      }
      return;
    }
    const pers = e.target.closest('[data-person]');
    if (pers) {
      R.setzePerson(pers.value);
      toast(pers.value ? 'Gerät zugeordnet.' : 'Zuordnung entfernt.');
      zeichne(wurzel);
      return;
    }
    const rol = e.target.closest('[data-rolle]');
    if (rol) {
      if (rol.value === 'ausbilder') {
        // Wechsel in die Ausbildung ist passwortpflichtig.
        const eingabe = await passwortFrage(
          'Wechsel zur Ausbildung',
          'Diese Rolle ist der Ausbildung vorbehalten. Bitte das vereinbarte Passwort eingeben.',
          { ok: 'Rolle wechseln' }
        );
        if (eingabe === null) {
          rol.value = R.meineRolle();
          return;
        }
        if (!(await R.wechsleZuAusbilder(eingabe))) {
          rol.value = R.meineRolle();
          toast('Passwort stimmt nicht – Rolle unverändert.', 'fehler');
          return;
        }
        toast('Rolle gesetzt: Ausbilder:in');
        location.reload();
        return;
      }
      R.setzeRolle(rol.value);
      toast('Rolle gesetzt: ' + (R.ROLLEN.find((x) => x.id === rol.value)?.label || rol.value));
      location.reload();
      return;
    }
    const es = e.target.closest('[data-eigener-stand]');
    if (es) {
      await R.setzeTeamEinstellung({ eigenerStandSichtbar: es.checked });
      toast(es.checked ? 'Eigener Stand freigegeben.' : 'Auswertungen nur für Ausbilder:innen.');
      zeichne(wurzel);
      return;
    }
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

  // Zustand des Offline-Speichers nachtragen – rein informativ, hilft bei der Ferndiagnose.
  (async () => {
    const el = box.querySelector('[data-sw-status]');
    if (!el) return;
    if (!('serviceWorker' in navigator)) { el.textContent = 'vom Browser nicht unterstützt'; return; }
    const reg = await navigator.serviceWorker.getRegistration();
    const caches_ = await caches.keys().catch(() => []);
    const eigen = caches_.filter((c) => c.startsWith('rhd-app-'));
    if (!reg) { el.textContent = 'nicht aktiv' + (location.protocol === 'http:' ? ' (nur über https)' : ''); return; }
    el.textContent = `${reg.active ? 'aktiv' : 'inaktiv'}${reg.waiting ? ' · Update wartet' : ''}` +
      (eigen.length ? ` · ${eigen.join(', ')}` : '');
  })();

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
