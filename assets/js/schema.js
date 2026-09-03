/**
 * Fachliches Datenmodell – abgeleitet aus dem gedruckten Trainingstagebuch
 * ("Die Rettungshundestunde", 3. überarbeitete Auflage).
 *
 * Jede Suche ist ein in sich abgeschlossener Datensatz (Seite 1 + Seite 2 des Hefts).
 * Die Helfer:in-Bilder sind ein eigener, hundbezogener Fortschrittskatalog.
 */

export const SCALE_MAX = 5;

/** Farben der 5er-Skala – entsprechen den Punktreihen im Heft (rot -> grün). */
export const SCALE_COLORS = ['#e0685c', '#ef9070', '#efc766', '#a9ce8b', '#5c9a5c'];
export const SCALE_LABELS = [
  '1 – deutlicher Trainingsbedarf',
  '2 – ausbaufähig',
  '3 – solide',
  '4 – gut',
  '5 – sehr gut',
];

/* ------------------------------------------------------------------ */
/* Seite 1 – Rahmenbedingungen                                         */
/* ------------------------------------------------------------------ */

export const GELAENDE = [
  { id: 'offen', label: 'offen' },
  { id: 'freie_lichte_stellen', label: 'freie/lichte Stellen' },
  { id: 'freier_boden', label: 'freier Boden' },
  { id: 'dicht', label: 'dicht' },
  { id: 'viel_gebuesch', label: 'viel Gebüsch' },
  { id: 'dornen', label: 'Dornen' },
  { id: 'flach', label: 'flach' },
  { id: 'huegelig', label: 'hügelig' },
  { id: 'steil', label: 'steil' },
];

export const TEMPERATUR = [
  { id: 'warm', label: 'warm' },
  { id: 'moderat', label: 'moderat' },
  { id: 'kuehl', label: 'kühl' },
  { id: 'kalt', label: '(sehr) kalt' },
];

export const WIND = [
  { id: 'leichter_wind', label: 'leichter Wind' },
  { id: 'boeig', label: 'böig' },
  { id: 'starker_wind', label: 'starker Wind' },
  { id: 'wechselhaft', label: 'wechselhaft' },
];

export const NIEDERSCHLAG = [
  { id: 'nieselregen', label: 'Nieselregen' },
  { id: 'starker_regen', label: 'starker Regen' },
];

export const LICHT = [
  { id: 'hell', label: 'hell' },
  { id: 'dunkel', label: 'dunkel' },
];

export const HIMMELSRICHTUNGEN = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];

/**
 * Die Staffel arbeitet ausschließlich mit Bellanzeige. Es gibt deshalb keine
 * Auswahl im Formular; ob angezeigt wurde, steckt im Feld `gefunden`.
 */
export const ANZEIGE_ART = 'Bellen';

/* ------------------------------------------------------------------ */
/* Seite 1 – Team: Verlauf der Suche                                   */
/* ------------------------------------------------------------------ */

export const TEAM_KRITERIEN = [
  { id: 'ablage_vor_suche', label: 'Ablage vor Suche', hasCheck: true },
  { id: 'fokussiert_vor_start', label: 'fokussiert vor Start' },
  { id: 'motivierter_start', label: 'motivierter Start' },
  { id: 'grundlinie', label: 'Grundlinie' },
  {
    id: 'strukturen_bearbeitet',
    label: 'Strukturen im Gebiet ordentlich bearbeitet',
    hint: 'dichtes Buschwerk, Zäune, Mauern, Gebäudeteile, Kuhlen, Hügel',
  },
  { id: 'ecken_grenzen_laufwege', label: 'Ecken/Grenzen/Laufwege ordentlich' },
];

/* ------------------------------------------------------------------ */
/* Seite 2 – Verhalten Hund                                            */
/* ------------------------------------------------------------------ */

export const HUND_KRITERIEN = [
  { id: 'lenkbarkeit', label: 'Lenkbarkeit' },
  { id: 'rauslaufen_wind', label: 'Rauslaufen für Wind' },
  {
    id: 'strukturen_erkennen',
    label: 'Strukturen selbst erkennen und abdecken',
    hint: 'dichtes Buschwerk, Zäune, Mauern, Gebäudeteile, Kuhlen, Hügel',
  },
  { id: 'radius', label: 'Radius', hasRadiusTyp: true },
];

export const RADIUS_TYPEN = [
  { id: 'weit', label: 'weit' },
  { id: 'mittel', label: 'mittel' },
  { id: 'eng', label: 'eng' },
];

export const PROBLEMVERHALTEN = [
  { id: 'markieren_gerueche', label: 'Markieren / Ablenkung durch Gerüche' },
  { id: 'wildspuren', label: 'Interesse an Wildspuren' },
  { id: 'faehrten_statt_wind', label: 'Fährten statt hohen Wind nutzen' },
  { id: 'zeigt_nicht_an', label: 'Zeigt nicht an / Verlassen' },
  { id: 'fehlanzeige', label: 'Fehlanzeige' },
  { id: 'bedraengen', label: 'Bedrängen' },
];

/* ------------------------------------------------------------------ */
/* Seite 2 – Verhalten Hundeführer:in                                  */
/* ------------------------------------------------------------------ */

export const HF_KRITERIEN = [
  { id: 'orientierung', label: 'Orientierung' },
  { id: 'taktik', label: 'Taktik wählen / einhalten' },
  { id: 'hund_einschaetzen', label: 'Hund einschätzen' },
  { id: 'ansprache_timing', label: 'Ansprache / Timing mit Hund' },
  { id: 'zusammenarbeit', label: 'Zusammenarbeit' },
  { id: 'konzentration', label: 'Konzentration / Ernsthaftigkeit' },
];

/* ------------------------------------------------------------------ */
/* Helfer:in-Bilder                                                    */
/* ------------------------------------------------------------------ */

/** Stufen 1..4 laut Heft. 0 = noch nicht begonnen. */
export const BILD_STUFEN = [
  { level: 1, label: 'kennengelernt', kurz: 'kennengel.' },
  { level: 2, label: 'kurze Anzeige', kurz: 'kurz' },
  { level: 3, label: 'längere Anzeige', kurz: 'länger' },
  { level: 4, label: 'gemeistert', kurz: 'gemeistert' },
];

/**
 * key   = im Heft fett gedruckt ("besonders relevant")
 * keineAnzeige = korrektes Verhalten ist KEINE Anzeige -> nur Stufe "kennengelernt"
 */
export const HELFER_BILDER = [
  { id: 'sitzend', label: 'sitzend', key: true },
  { id: 'sitzend_gesicht_verdeckt', label: 'sitzend (Gesicht verdeckt)' },
  { id: 'liegend', label: 'liegend (+ mit verdecktem Gesicht)' },
  { id: 'stehend', label: 'stehend' },
  { id: 'kinder', label: 'Kinder' },
  { id: 'alte_menschen', label: 'Alte Menschen' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'koerperform_unkenntlich', label: 'Körperform unkenntlich (z.B. Hut, Mantel)', key: true },
  { id: 'tarnanzug', label: 'Tarnanzug' },
  { id: 'plane_halb_offen', label: 'Plane halb offen', key: true },
  { id: 'plane_verdeckt', label: 'Plane verdeckt', key: true },
  { id: 'schlafsack', label: 'Schlafsack', key: true },
  { id: 'hochopfer_offen', label: 'Hochopfer offen (z.B. auf Baum)', key: true },
  { id: 'hochopfer_verdeckt', label: 'Hochopfer verdeckt' },
  { id: 'gymnastik', label: 'Gymnastik' },
  { id: 'sprechend_leise', label: 'sprechend leise' },
  { id: 'sprechend_laut', label: 'sprechend laut' },
  { id: 'abwehrend_aengstlich', label: 'Abwehrend/ängstlich' },
  { id: 'schimpfen', label: 'schimpfen "Aus!" "Nein!"' },
  { id: 'geruch_alkohol', label: 'Gerüche: Alkohol' },
  { id: 'geruch_blut', label: 'Gerüche: Blut' },
  { id: 'geruch_urin_kot', label: 'Gerüche: Urin/Kot' },
  { id: 'attrappe_geruchsarm', label: 'Attrappe geruchsarm', keineAnzeige: true },
  { id: 'attrappe_geruchsreich', label: 'Attrappe geruchsreich', keineAnzeige: true },
  { id: 'spielzeug_sichtbar', label: 'Spielzeug sichtbar und in Reichweite', key: true },
  { id: 'helm', label: 'Helm', key: true },
  { id: 'langsam_kriechend', label: 'langsam kriechend', key: true },
  { id: 'verdeckt_von_natur', label: 'verdeckt von Natur', key: true },
  { id: 'regenschirm_offen', label: 'Regenschirm offen' },
  { id: 'regenschirm_aufspannen', label: 'Regenschirm aufspannen' },
  { id: 'zwei_personen_gemeinsam', label: '2 Personen gemeinsam' },
  { id: 'zwei_personen_abstand', label: '2 Personen, 10 Meter Abstand' },
  { id: 'zwei_personen_streitend', label: '2 Personen streitend' },
  { id: 'rollstuhl_rollator', label: 'Rollstuhl, Rollator, Gehstock' },
  { id: 'essbares_sichtbar', label: 'Essbares sichtbar und in Reichweite', key: true },
  { id: 'graben_offen', label: 'Graben am Weg offen' },
  { id: 'graben_verdeckt', label: 'Graben am Weg verdeckt (Natur)', key: true },
  { id: 'kleidung_reflektoren', label: 'Kleidung: Reflektoren', key: true },
  { id: 'wandernde_vp', label: 'wandernde VP (verschiedene Punkte im Gebiet)' },
];

export const BILDER_BY_ID = Object.fromEntries(HELFER_BILDER.map((b) => [b.id, b]));

/* ------------------------------------------------------------------ */
/* Leere Datensätze                                                    */
/* ------------------------------------------------------------------ */

export function neueHelferZeile(nr) {
  return {
    nr,
    bildId: '',
    beschreibung: '',
    zeitBisMin: null,
    gefunden: null,
    radiusM: null,
  };
}

export function neueSuche(defaults = {}) {
  const heute = new Date().toISOString().slice(0, 10);
  return {
    type: 'suche',
    // Solange eine Suche 'entwurf' ist, bleibt sie auf diesem Gerät.
    // Erst mit 'abgeschlossen' wird sie für das Team hochgeladen.
    status: 'entwurf',
    abgeschlossenAm: null,
    /** Bestätigung durch die Ausbildung: {vonId, vonName, am, bemerkung} */
    bestaetigung: null,
    datum: heute,
    // Wartezeit im Auto vor dem Einsatz – beeinflusst Anspannung und Motivation
    // des Hundes und gehört deshalb an den Anfang der Grundwerte.
    wartezeitAutoMin: null,
    ort: '',
    hundId: defaults.hundId || '',
    hfId: defaults.hfId || '',
    trainingsziel: '',

    gelaende: [],
    gelaendeSonstiges: '',
    temperatur: [],
    wind: [],
    niederschlag: [],
    licht: [],
    wetterSonstiges: '',
    windrichtung: '',

    gebietGroesse: '',
    suchzeitMin: null,
    helferNamen: '',
    skizze: null,

    helfer: [1, 2, 3, 4].map(neueHelferZeile),

    team: {},
    teamAblageOk: null,
    hund: {},
    radiusTyp: '',
    hf: {},

    probleme: {},
    problemeKontext: '',

    selbstreflektion: '',
    notizen: '',
    beobachten: '',
    bearbeiten: '',
    neuesZiel: '',

    eigeneKriterien: { team: [], hund: [], hf: [] },
  };
}

/**
 * Freie Dokumentation: dieselben Grundwerte wie bei einer Suche, dazu
 * Zeichenfeld und Freitext. Für alles, was kein Suchprotokoll ist –
 * Gehorsam, Geräteübungen, Theorie, Beobachtungen am Rand.
 */
export function neueFreieDoku(defaults = {}) {
  const heute = new Date().toISOString().slice(0, 10);
  return {
    type: 'freidoku',
    status: 'entwurf',
    abgeschlossenAm: null,
    /** Bestätigung durch die Ausbildung: {vonId, vonName, am, bemerkung} */
    bestaetigung: null,
    datum: heute,
    wartezeitAutoMin: null,
    titel: '',
    ort: '',
    hundId: defaults.hundId || '',
    hfId: defaults.hfId || '',

    gelaende: [],
    gelaendeSonstiges: '',
    temperatur: [],
    wind: [],
    niederschlag: [],
    licht: [],
    wetterSonstiges: '',
    windrichtung: '',

    skizze: null,
    text: '',
  };
}

/**
 * Verbellen-Sitzung: Grundwerte plus die an diesem Tag bearbeiteten Stufen.
 * Der Fortschrittskatalog wird daraus abgeleitet (siehe verbellen.js) –
 * es gibt also nur eine Wahrheit.
 */
export function neueVerbellenSitzung(defaults = {}) {
  const heute = new Date().toISOString().slice(0, 10);
  return {
    type: 'verbellen',
    status: 'entwurf',
    abgeschlossenAm: null,
    /** Bestätigung durch die Ausbildung: {vonId, vonName, am, bemerkung} */
    bestaetigung: null,
    datum: heute,
    wartezeitAutoMin: null,
    ort: '',
    hundId: defaults.hundId || '',
    hfId: defaults.hfId || '',

    gelaende: [],
    gelaendeSonstiges: '',
    temperatur: [],
    wind: [],
    niederschlag: [],
    licht: [],
    wetterSonstiges: '',
    windrichtung: '',

    /** [{ weg, stufeN, haken:{ '<index>': 0..3 }, zusatz:[{id,text,haken}], bemerkung:'' }] */
    einheiten: [],
    notizen: '',
  };
}

/** Alle Bewertungen einer Gruppe als Zahlen-Array (nur gesetzte Werte). */
export function werteDerGruppe(suche, gruppe) {
  const werte = Object.values(suche?.[gruppe] || {}).filter((v) => typeof v === 'number' && v > 0);
  const eigene = (suche?.eigeneKriterien?.[gruppe] || [])
    .map((k) => k.wert)
    .filter((v) => typeof v === 'number' && v > 0);
  return [...werte, ...eigene];
}

export function mittelwert(zahlen) {
  if (!zahlen.length) return null;
  return zahlen.reduce((a, b) => a + b, 0) / zahlen.length;
}

/** Gesamtscore einer Suche (Mittel aus Team, Hund, HF) oder null. */
export function gesamtScore(suche) {
  const alle = [
    ...werteDerGruppe(suche, 'team'),
    ...werteDerGruppe(suche, 'hund'),
    ...werteDerGruppe(suche, 'hf'),
  ];
  return mittelwert(alle);
}

/* ------------------------------------------------------------------ */
/* Vollständigkeit einer Suche                                         */
/* ------------------------------------------------------------------ */

/**
 * Welche Angaben ein Protokoll enthalten muss, damit es als vollständig
 * ausgeführt gilt. Nur vollständige Suchen lassen sich abschließen und
 * landen damit im gemeinsamen Datenbestand.
 */
export const PFLICHT = [
  {
    id: 'datum',
    label: 'Datum',
    pruefe: (s) => !!s.datum,
  },
  {
    id: 'ort',
    label: 'Ort',
    pruefe: (s) => !!(s.ort || '').trim(),
  },
  {
    id: 'hund',
    label: 'Hund ausgewählt',
    pruefe: (s) => !!s.hundId,
  },
  {
    id: 'hf',
    label: 'Hundeführer:in ausgewählt',
    pruefe: (s) => !!s.hfId,
  },
  {
    id: 'suchzeit',
    label: 'Suchzeit eingetragen',
    pruefe: (s) => Number(s.suchzeitMin) > 0,
  },
  {
    id: 'versteck',
    label: 'Mindestens eine Versteckperson mit Ergebnis (gefunden / nicht gefunden)',
    pruefe: (s) => (s.helfer || []).some((h) => h.gefunden === true || h.gefunden === false),
  },
  {
    id: 'team',
    label: 'Team: Verlauf der Suche bewertet',
    pruefe: (s) => werteDerGruppe(s, 'team').length > 0,
  },
  {
    id: 'hundbewertung',
    label: 'Verhalten Hund bewertet',
    pruefe: (s) => werteDerGruppe(s, 'hund').length > 0,
  },
  {
    id: 'hfbewertung',
    label: 'Verhalten Hundeführer:in bewertet',
    pruefe: (s) => werteDerGruppe(s, 'hf').length > 0,
  },
];

/** Pflichtangaben einer freien Dokumentation – bewusst schlank gehalten. */
export const PFLICHT_FREIDOKU = [
  { id: 'datum', label: 'Datum', pruefe: (d) => !!d.datum },
  { id: 'titel', label: 'Überschrift', pruefe: (d) => !!(d.titel || '').trim() },
  { id: 'hund', label: 'Hund ausgewählt', pruefe: (d) => !!d.hundId },
  {
    id: 'inhalt',
    label: 'Freitext oder Skizze',
    pruefe: (d) => !!(d.text || '').trim() || (d.skizze?.striche?.length || 0) > 0,
  },
];

/** Pflichtangaben einer Verbellen-Sitzung. */
export const PFLICHT_VERBELLEN = [
  { id: 'datum', label: 'Datum', pruefe: (v) => !!v.datum },
  { id: 'hund', label: 'Hund ausgewählt', pruefe: (v) => !!v.hundId },
  {
    id: 'stufe',
    label: 'Mindestens eine bearbeitete Stufe',
    pruefe: (v) => (v.einheiten || []).length > 0,
  },
  {
    id: 'haken',
    label: 'Mindestens eine gelungene Wiederholung eingetragen',
    pruefe: (v) =>
      (v.einheiten || []).some(
        (e) =>
          Object.values(e.haken || {}).some((n) => n > 0) ||
          (e.zusatz || []).some((z) => (z.text || '').trim() && z.haken > 0)
      ),
  },
];

/** Dokumentarten, die dem Abschluss-Verfahren unterliegen. */
export const DOKUMENTARTEN = {
  suche: { label: 'Suche', pflicht: PFLICHT },
  freidoku: { label: 'Freie Dokumentation', pflicht: PFLICHT_FREIDOKU },
  verbellen: { label: 'Verbellen', pflicht: PFLICHT_VERBELLEN },
};

/**
 * @returns {{vollstaendig: boolean, offen: Array<{id,label}>, erfuellt: number, gesamt: number}}
 */
export function vollstaendigkeit(rec) {
  const pflicht = DOKUMENTARTEN[rec?.type]?.pflicht || PFLICHT;
  const offen = pflicht.filter((p) => !p.pruefe(rec)).map(({ id, label }) => ({ id, label }));
  return {
    vollstaendig: offen.length === 0,
    offen,
    erfuellt: pflicht.length - offen.length,
    gesamt: pflicht.length,
  };
}

/** Datensätze ohne `status` stammen aus einer älteren Fassung und gelten als abgeschlossen. */
export function istAbgeschlossen(rec) {
  if (!DOKUMENTARTEN[rec?.type]) return true; // Stammdaten, Bildfortschritt usw.
  return (rec.status ?? 'abgeschlossen') === 'abgeschlossen';
}

/** true für alles, was in der Dokumentenliste erscheint. */
export function istDokument(rec) {
  return !!DOKUMENTARTEN[rec?.type];
}
