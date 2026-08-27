/**
 * Skizzenfeld für das Suchgebiet (Seite 1 im Heft).
 * Striche werden als Vektorpunkte in 0..1-Koordinaten gespeichert – dadurch
 * winzig im Speicher, skalierbar und synchronisierbar.
 */

const FARBEN = [
  { id: 'gebiet', label: 'Gebiet', farbe: '#3c6e3c' },
  { id: 'hf', label: 'Laufweg HF', farbe: '#1d6fb8' },
  { id: 'hund', label: 'Laufweg Hund', farbe: '#c2761b' },
  { id: 'helfer', label: 'Helfer:in', farbe: '#c0392b' },
];

export function skizzeHtml(daten) {
  const striche = daten?.striche?.length || 0;
  return `<div class="skizze" data-skizze>
    <div class="skizze__werkzeuge">
      ${FARBEN.map(
        (f, i) =>
          `<button type="button" class="stift${i === 0 ? ' stift--an' : ''}" data-stift="${f.id}"
            style="--stift:${f.farbe}"><i></i>${f.label}</button>`
      ).join('')}
      <span class="skizze__spacer"></span>
      <button type="button" class="btn btn--mini" data-skizze-undo>Rückgängig</button>
      <button type="button" class="btn btn--mini" data-skizze-clear>Leeren</button>
    </div>
    <canvas class="skizze__canvas" data-skizze-canvas width="1200" height="900"
      aria-label="Skizze des Suchgebiets"></canvas>
    <p class="skizze__hint">Suchgebiet mit Abmessungen, Position der Helfer:innen, Laufweg HF (ggf. Hund) und Windrichtung eintragen.
      <span data-skizze-info>${striche ? striche + ' Striche' : 'leer'}</span></p>
  </div>`;
}

/**
 * Aktiviert das Skizzenfeld.
 * @param {HTMLElement} wurzel  Container, der skizzeHtml enthält
 * @param {object|null} daten   { striche: [{ f:'gebiet', p:[[x,y],...] }] }
 * @param {(d:object)=>void} onChange
 */
export function skizzeAktivieren(wurzel, daten, onChange) {
  const box = wurzel.querySelector('[data-skizze]');
  if (!box) return;
  const canvas = box.querySelector('[data-skizze-canvas]');
  const info = box.querySelector('[data-skizze-info]');
  const ctx = canvas.getContext('2d');
  let modell = { striche: [...(daten?.striche || [])] };
  let stift = 'gebiet';
  let aktiv = null;

  function farbeVon(id) {
    return (FARBEN.find((f) => f.id === id) || FARBEN[0]).farbe;
  }

  function zeichne() {
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);

    // Punktraster wie im Heft
    ctx.fillStyle = 'rgba(120,140,120,0.35)';
    for (let x = 20; x < w; x += 24) {
      for (let y = 20; y < h; y += 24) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    const alle = aktiv ? [...modell.striche, aktiv] : modell.striche;
    for (const s of alle) {
      if (!s.p?.length) continue;
      ctx.strokeStyle = farbeVon(s.f);
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      s.p.forEach(([x, y], i) => {
        const px = x * w;
        const py = y * h;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      if (s.p.length === 1) {
        ctx.arc(s.p[0][0] * w, s.p[0][1] * h, 2, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
    if (info) info.textContent = modell.striche.length ? `${modell.striche.length} Striche` : 'leer';
  }

  function position(ev) {
    const r = canvas.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)),
      Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)),
    ];
  }

  canvas.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    canvas.setPointerCapture(ev.pointerId);
    aktiv = { f: stift, p: [position(ev)] };
    zeichne();
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!aktiv) return;
    const p = position(ev);
    const letzt = aktiv.p[aktiv.p.length - 1];
    // Punkte ausdünnen: nur bei spürbarer Bewegung speichern
    if (Math.abs(p[0] - letzt[0]) + Math.abs(p[1] - letzt[1]) < 0.004) return;
    aktiv.p.push([Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000]);
    zeichne();
  });
  const beenden = () => {
    if (!aktiv) return;
    modell.striche.push(aktiv);
    aktiv = null;
    zeichne();
    onChange({ striche: modell.striche });
  };
  canvas.addEventListener('pointerup', beenden);
  canvas.addEventListener('pointercancel', beenden);
  canvas.addEventListener('pointerleave', beenden);

  box.querySelectorAll('[data-stift]').forEach((b) => {
    b.addEventListener('click', () => {
      stift = b.dataset.stift;
      box.querySelectorAll('[data-stift]').forEach((x) => x.classList.toggle('stift--an', x === b));
    });
  });
  box.querySelector('[data-skizze-undo]').addEventListener('click', () => {
    modell.striche.pop();
    zeichne();
    onChange({ striche: modell.striche });
  });
  box.querySelector('[data-skizze-clear]').addEventListener('click', () => {
    modell.striche = [];
    zeichne();
    onChange({ striche: modell.striche });
  });

  zeichne();
}

/** Nur-Lese-Vorschau (Liste/Druck). */
export function skizzeSvg(daten, breite = 240, hoehe = 180) {
  const striche = daten?.striche || [];
  if (!striche.length) return '';
  const pfade = striche
    .map((s) => {
      const d = s.p.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * breite).toFixed(1)},${(y * hoehe).toFixed(1)}`).join(' ');
      const f = (FARBEN.find((x) => x.id === s.f) || FARBEN[0]).farbe;
      return `<path d="${d}" fill="none" stroke="${f}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('');
  return `<svg class="skizze-vorschau" viewBox="0 0 ${breite} ${hoehe}" aria-label="Skizze">${pfade}</svg>`;
}
