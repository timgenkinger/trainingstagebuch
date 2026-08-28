/**
 * Einrichtungs-Assistent für den Online-Abgleich.
 *
 * Statt eines Konfigurationsfeldes führt er Schritt für Schritt und prüft
 * die Angaben gegen den echten Dienst – Fehler werden benannt, nicht nur gemeldet.
 */

import * as sync from '../sync/index.js';
import { ladeConfig, speichereConfig, speichereToken, teamConfig } from '../config.js';
import { esc, karte, feld, textInput, toast, download } from '../ui.js';

let schritt = 1;
let entwurf = null;
let pruefung = null;
let laeuft = false;

export async function render(wurzel) {
  if (!entwurf) {
    const c = ladeConfig();
    entwurf = {
      backend: c.backend === 'aus' ? 'github' : c.backend,
      github: { ...c.github },
      firebase: c.firebase,
      collection: c.collection,
    };
  }
  zeichne(wurzel);
}

function zeichne(wurzel) {
  wurzel.innerHTML = html();
  binde(wurzel.querySelector('.seite'), wurzel);
}

function html() {
  return `<div class="seite">
    <div class="seite__kopf">
      <h1>Online-Abgleich einrichten</h1>
      <a class="btn btn--still" href="#/einstellungen">Abbrechen</a>
    </div>

    <ol class="schritte">
      ${['Verfahren', 'Zugang', 'Prüfen', 'Fertig']
        .map(
          (t, i) => `<li class="${i + 1 === schritt ? 'schritt--an' : i + 1 < schritt ? 'schritt--fertig' : ''}">
            <span>${i + 1}</span>${esc(t)}</li>`
        )
        .join('')}
    </ol>

    ${schritt === 1 ? schrittVerfahren() : ''}
    ${schritt === 2 ? schrittZugang() : ''}
    ${schritt === 3 ? schrittPruefen() : ''}
    ${schritt === 4 ? schrittFertig() : ''}
  </div>`;
}

/* ---------------- 1. Verfahren ---------------- */

function schrittVerfahren() {
  const w = (id, titel, text, vorteile, nachteile) => `
    <button type="button" class="wahl${entwurf.backend === id ? ' wahl--an' : ''}" data-backend="${id}">
      <strong>${esc(titel)}</strong>
      <span>${esc(text)}</span>
      <ul class="wahl__liste">
        ${vorteile.map((v) => `<li class="ja">${esc(v)}</li>`).join('')}
        ${nachteile.map((v) => `<li class="nein">${esc(v)}</li>`).join('')}
      </ul>
    </button>`;

  return karte('Womit soll abgeglichen werden?', `
    <div class="wahlen">
      ${w('github', 'GitHub-Repository', 'Die Daten liegen als Datei in einem Repository.', [
        'Kein zusätzliches Konto nötig',
        'Jede Änderung ist in der Versionsgeschichte nachvollziehbar',
        'Einrichtung in wenigen Minuten',
      ], [
        'Abgleich alle 45 Sekunden statt sofort',
        'Jedes Gerät braucht einen Zugangs-Token',
      ])}
      ${w('firebase', 'Cloud Firestore', 'Echtzeit-Datenbank von Google.', [
        'Änderungen erscheinen sofort auf allen Geräten',
        'Auch für größere Gruppen ausgelegt',
      ], [
        'Google-Konto und Firebase-Projekt erforderlich',
        'Mehr Einrichtungsschritte',
      ])}
    </div>
    <div class="btn-zeile">
      <button type="button" class="btn btn--primaer" data-weiter>Weiter</button>
    </div>
  `);
}

/* ---------------- 2. Zugang ---------------- */

function schrittZugang() {
  if (entwurf.backend === 'firebase') return zugangFirebase();
  return zugangGithub();
}

function zugangGithub() {
  const g = entwurf.github;
  return karte('Zugang zu GitHub', `
    <ol class="anleitung">
      <li><strong>Repository wählen.</strong> Am besten ein <em>eigenes, privates</em> Repository nur für die Daten –
        dann sind die Trainingsdaten nicht öffentlich. Ein leeres Repository genügt;
        <a href="https://github.com/new" target="_blank" rel="noopener">hier anlegen</a>.</li>
      <li><strong>Token erzeugen.</strong> Unter
        <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Fine-grained tokens</a>:
        nur dieses Repository auswählen und unter <em>Repository permissions</em> bei <strong>Contents</strong>
        auf <strong>Read and write</strong> stellen.</li>
      <li><strong>Token hier einsetzen.</strong> Er wird ausschließlich in diesem Browser gespeichert –
        nie exportiert und nie ins Repository geschrieben.</li>
    </ol>

    <div class="raster raster--2">
      ${feld('Kontoname (owner)', textInput('github.owner', g.owner, { placeholder: 'z.B. timgenkinger' }))}
      ${feld('Repository', textInput('github.repo', g.repo, { placeholder: 'z.B. trainingsdaten' }))}
      ${feld('Branch', textInput('github.branch', g.branch, { placeholder: 'daten' }),
        { hint: 'eigener Branch – nicht der Hauptbranch' })}
      ${feld('Dateiname', textInput('github.pfad', g.pfad, { placeholder: 'trainingsdaten.json' }))}
    </div>
    ${feld('Zugangs-Token', `<input class="input input--code" type="password" data-pfad="github.token"
      value="${esc(g.token || '')}" placeholder="github_pat_… oder ghp_…" autocomplete="off">`,
      { hint: 'bleibt lokal auf diesem Gerät' })}

    <div class="btn-zeile">
      <button type="button" class="btn btn--still" data-zurueck>Zurück</button>
      <button type="button" class="btn btn--primaer" data-weiter>Verbindung prüfen</button>
    </div>
  `);
}

function zugangFirebase() {
  return karte('Zugang zu Firebase', `
    <ol class="anleitung">
      <li>In der <a href="https://console.firebase.google.com" target="_blank" rel="noopener">Firebase-Konsole</a>
        ein Projekt anlegen.</li>
      <li><strong>Build → Firestore Database</strong> erstellen (Standort <code>eur3</code>).</li>
      <li><strong>Build → Authentication</strong> öffnen und die Anmeldemethode <strong>Anonym</strong> aktivieren.</li>
      <li>Unter <strong>Projekteinstellungen → Meine Apps</strong> eine Web-App anlegen und die Konfiguration
        hier einfügen.</li>
    </ol>
    ${feld('Firebase-Konfiguration (JSON)',
      `<textarea class="input input--code" rows="9" data-firebase placeholder='{ "apiKey": "…", "projectId": "…" }'>${
        esc(entwurf.firebase ? JSON.stringify(entwurf.firebase, null, 2) : '')
      }</textarea>`)}
    ${feld('Sammlung', textInput('collection', entwurf.collection, { placeholder: 'trainingstagebuch' }))}
    <div class="btn-zeile">
      <button type="button" class="btn btn--still" data-zurueck>Zurück</button>
      <button type="button" class="btn btn--primaer" data-weiter>Verbindung prüfen</button>
    </div>
  `);
}

/* ---------------- 3. Prüfen ---------------- */

function schrittPruefen() {
  if (laeuft) {
    return karte('Verbindung wird geprüft', `<div class="pruef-laden"><span class="spinner"></span> Frage GitHub ab …</div>`);
  }
  if (!pruefung) return karte('Prüfung', `<p>Keine Prüfung ausgeführt.</p>`);

  const fehler = pruefung.filter((p) => p.zustand === 'fehler').length;
  const warnungen = pruefung.filter((p) => p.zustand === 'warnung').length;

  return karte(fehler ? 'Es gibt noch ein Problem' : 'Verbindung steht', `
    <ul class="pruefliste">
      ${pruefung
        .map(
          (p) => `<li class="pruef pruef--${p.zustand}">
            <span class="pruef__zeichen"></span>
            <span class="pruef__text"><strong>${esc(p.name)}</strong> ${esc(p.text)}
              ${p.tipp ? `<em>${esc(p.tipp)}</em>` : ''}</span>
          </li>`
        )
        .join('')}
    </ul>
    ${warnungen && !fehler ? '<p class="karte__hint">Warnungen verhindern den Abgleich nicht – lies sie aber bitte.</p>' : ''}
    <div class="btn-zeile">
      <button type="button" class="btn btn--still" data-zurueck>Zurück</button>
      <button type="button" class="btn btn--still" data-nochmal>Erneut prüfen</button>
      ${fehler ? '' : '<button type="button" class="btn btn--primaer" data-uebernehmen>Abgleich aktivieren</button>'}
    </div>
  `);
}

/* ---------------- 4. Fertig ---------------- */

function schrittFertig() {
  const t = teamConfig();
  const schnipsel = `export const STANDARD_CONFIG = ${JSON.stringify(
    { backend: t.backend, github: t.github, firebase: t.firebase || null, collection: t.collection || 'trainingstagebuch', intervall: 45 },
    null,
    2
  )};`;

  return karte('Abgleich ist aktiv', `
    <p class="abschluss__ok">Dieses Gerät gleicht ab sofort mit dem Team ab.</p>
    <h3 class="unter">So schließt sich das Team an</h3>
    <ol class="anleitung">
      <li>Die Adresse des Datenspeichers darf ins Repository – sie ist kein Geheimnis.
        Kopiere den Block unten nach <code>assets/js/config.js</code> und pushe ihn.</li>
      <li>Der <strong>Token</strong> gehört <em>nicht</em> dorthin. Gib ihn im Team direkt weiter,
        oder jede:r erzeugt sich einen eigenen. Eingetragen wird er einmal in diesem Assistenten.</li>
    </ol>
    <textarea class="input input--code" rows="10" readonly data-schnipsel>${esc(schnipsel)}</textarea>
    <div class="btn-zeile">
      <button type="button" class="btn btn--still" data-kopieren>In die Zwischenablage</button>
      <a class="btn btn--primaer" href="#/einstellungen">Fertig</a>
    </div>
  `);
}

/* ---------------- Bindung ---------------- */

function binde(box, wurzel) {
  if (!box) return;

  box.addEventListener('input', (e) => {
    const el = e.target.closest('[data-pfad]');
    if (el) {
      const [a, b] = el.dataset.pfad.split('.');
      if (b) entwurf[a][b] = el.value.trim();
      else entwurf[a] = el.value.trim();
    }
  });

  box.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-backend]');
    if (b) {
      entwurf.backend = b.dataset.backend;
      zeichne(wurzel);
      return;
    }

    if (e.target.closest('[data-zurueck]')) {
      schritt = Math.max(1, schritt - 1);
      zeichne(wurzel);
      return;
    }

    if (e.target.closest('[data-weiter]') || e.target.closest('[data-nochmal]')) {
      if (schritt === 1) {
        schritt = 2;
        zeichne(wurzel);
        return;
      }
      if (entwurf.backend === 'firebase') {
        const roh = box.querySelector('[data-firebase]')?.value.trim();
        if (roh) {
          try {
            entwurf.firebase = JSON.parse(normalisiere(roh));
          } catch {
            toast('Die Firebase-Konfiguration ist kein gültiges JSON.', 'fehler');
            return;
          }
        }
        if (!entwurf.firebase?.apiKey || !entwurf.firebase?.projectId) {
          toast('apiKey und projectId fehlen.', 'fehler');
          return;
        }
        // Firestore prüft sich erst beim Verbinden – direkt übernehmen.
        pruefung = [{ name: 'Konfiguration', zustand: 'ok', text: 'Vollständig. Die Verbindung wird beim Aktivieren aufgebaut.' }];
        schritt = 3;
        zeichne(wurzel);
        return;
      }

      schritt = 3;
      laeuft = true;
      zeichne(wurzel);
      try {
        pruefung = await sync.pruefeGithub(entwurf.github);
      } catch (err) {
        pruefung = [{ name: 'Prüfung', zustand: 'fehler', text: err.message }];
      }
      laeuft = false;
      zeichne(wurzel);
      return;
    }

    if (e.target.closest('[data-uebernehmen]')) {
      speichereConfig({
        backend: entwurf.backend,
        github: { owner: entwurf.github.owner, repo: entwurf.github.repo, branch: entwurf.github.branch, pfad: entwurf.github.pfad },
        firebase: entwurf.firebase,
        collection: entwurf.collection,
      });
      speichereToken(entwurf.github.token);
      toast('Verbinde …');
      const ok = await sync.neustart();
      if (!ok) toast('Der Abgleich konnte nicht starten – siehe Statusanzeige.', 'fehler');
      schritt = 4;
      zeichne(wurzel);
      return;
    }

    if (e.target.closest('[data-kopieren]')) {
      const text = box.querySelector('[data-schnipsel]').value;
      try {
        await navigator.clipboard.writeText(text);
        toast('In die Zwischenablage kopiert.');
      } catch {
        download('config-schnipsel.txt', text, 'text/plain');
        toast('Zwischenablage nicht verfügbar – als Datei geladen.');
      }
    }
  });
}

/** Erlaubt auch das Einfügen des JS-Objekts aus der Firebase-Konsole. */
function normalisiere(text) {
  let t = text.trim();
  const start = t.indexOf('{');
  const ende = t.lastIndexOf('}');
  if (start >= 0 && ende > start) t = t.slice(start, ende + 1);
  return t.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":').replace(/'/g, '"').replace(/,(\s*[}\]])/g, '$1');
}

export function zuruecksetzen() {
  schritt = 1;
  entwurf = null;
  pruefung = null;
}
