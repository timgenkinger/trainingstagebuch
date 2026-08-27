/** Selbstgebaute SVG-Diagramme – responsiv über viewBox, keine Bibliotheken. */

import { esc, runde, skalaFarbe } from './ui.js';

/* Das Zeichenfeld richtet sich nach der Bildschirmbreite: auf dem Handy
   hochformatiger, damit die Kurve trotz schmaler Spalte ablesbar bleibt.
   Dadurch bleibt die Skalierung gleichmaessig (keine verzerrten Punkte). */
function masse() {
  const schmal = (window.innerWidth || 1024) < 640;
  return schmal ? { W: 380, H: 260, marken: 4 } : { W: 1000, H: 300, marken: 7 };
}

function achsenGitter(x0, y0, x1, y1, min, max, schritte = 4) {
  let out = '';
  for (let i = 0; i <= schritte; i++) {
    const t = i / schritte;
    const y = y1 - t * (y1 - y0);
    const wert = min + t * (max - min);
    out += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="ch-grid"/>
      <text x="${x0 - 8}" y="${y + 4}" class="ch-tick" text-anchor="end">${runde(wert, 1)}</text>`;
  }
  return out;
}

/**
 * Linien-/Punktdiagramm über die Zeit.
 * @param {Array<{name:string, farbe:string, punkte:Array<{x:string,y:number}>}>} serien
 */
export function linienDiagramm(serien, opts = {}) {
  const alle = serien.flatMap((s) => s.punkte);
  if (!alle.length) return `<p class="ch-leer">Noch keine Daten für diesen Zeitraum.</p>`;

  const { W, H, marken } = masse();
  const min = opts.min ?? 1;
  const max = opts.max ?? 5;
  const x0 = 40;
  const x1 = W - 12;
  const y0 = 16;
  const y1 = H - 34;

  const labels = [...new Set(alle.map((p) => p.x))].sort();
  const xPos = (x) => {
    const i = labels.indexOf(x);
    return labels.length === 1 ? (x0 + x1) / 2 : x0 + (i / (labels.length - 1)) * (x1 - x0);
  };
  const yPos = (y) => y1 - ((y - min) / (max - min)) * (y1 - y0);

  let out = `<svg viewBox="0 0 ${W} ${H}" class="ch" preserveAspectRatio="xMidYMid meet" role="img">`;
  out += achsenGitter(x0, y0, x1, y1, min, max, max - min);

  // X-Beschriftung: höchstens 6 Marken
  const schritt = Math.max(1, Math.ceil(labels.length / marken));
  labels.forEach((l, i) => {
    if (i % schritt && i !== labels.length - 1) return;
    const d = l.slice(8, 10) + '.' + l.slice(5, 7) + '.';
    out += `<text x="${xPos(l)}" y="${y1 + 20}" class="ch-tick" text-anchor="middle">${d}</text>`;
  });

  serien.forEach((s) => {
    const pkt = [...s.punkte].sort((a, b) => a.x.localeCompare(b.x));
    if (!pkt.length) return;
    const d = pkt.map((p, i) => `${i ? 'L' : 'M'}${runde(xPos(p.x), 2)},${runde(yPos(p.y), 2)}`).join(' ');
    out += `<path d="${d}" fill="none" stroke="${s.farbe}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    pkt.forEach((p) => {
      out += `<circle cx="${runde(xPos(p.x), 2)}" cy="${runde(yPos(p.y), 2)}" r="4" fill="${s.farbe}" stroke="var(--flaeche)" stroke-width="1.5"><title>${esc(
        s.name
      )} · ${p.x} · ${runde(p.y, 2)}</title></circle>`;
    });
  });
  out += '</svg>';

  const legende = `<div class="ch-legende">${serien
    .map((s) => `<span><i style="background:${s.farbe}"></i>${esc(s.name)}</span>`)
    .join('')}</div>`;
  return legende + out;
}

/** Waagerechtes Balkendiagramm. */
export function balken(items, opts = {}) {
  if (!items.length) return `<p class="ch-leer">Keine Daten.</p>`;
  const max = opts.max ?? Math.max(...items.map((i) => i.wert), 1);
  return `<div class="bars">${items
    .map((i) => {
      const p = max ? (i.wert / max) * 100 : 0;
      const farbe = i.farbe || (opts.skalaFarben ? skalaFarbe(i.wert) : opts.farbe || 'var(--gruen)');
      return `<div class="bar">
        <span class="bar__label" title="${esc(i.label)}">${esc(i.label)}</span>
        <span class="bar__track"><span class="bar__fill" style="width:${runde(p, 1)}%;background:${farbe}"></span></span>
        <span class="bar__wert">${esc(i.anzeige ?? runde(i.wert, 1))}</span>
      </div>`;
    })
    .join('')}</div>`;
}

/** Gestapelter Fortschrittsbalken (Helfer:in-Bilder). */
export function stapel(segmente, gesamt) {
  const s = segmente
    .filter((x) => x.wert > 0)
    .map(
      (x) =>
        `<span class="stapel__teil" style="width:${runde((x.wert / Math.max(gesamt, 1)) * 100, 2)}%;background:${x.farbe}"
        title="${esc(x.label)}: ${x.wert}"></span>`
    )
    .join('');
  return `<div class="stapel">${s}</div>`;
}

/** Kompakter Verlaufsstreifen (Sparkline) für Kacheln. */
export function sparkline(werte, farbe = 'var(--gruen)') {
  if (werte.length < 2) return '';
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const spanne = max - min || 1;
  const d = werte
    .map((v, i) => `${i ? 'L' : 'M'}${(i / (werte.length - 1)) * 100},${28 - ((v - min) / spanne) * 24}`)
    .join(' ');
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${farbe}" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>`;
}
