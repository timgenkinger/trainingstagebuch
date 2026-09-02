/**
 * Trainingsplan Verbellen.
 *
 * Der Plan ist wortgetreu aus "Verbell App 2.0.html" uebernommen (Stand 1.0.2),
 * die wiederum aus Trainingsplan_Verbellen.xlsx stammt. Bewusst unveraendert,
 * damit sich beim Uebertragen kein Fehler einschleicht.
 *
 * Aufbau: zwei Wege ("box" und "mensch") mit je durchnummerierten Stufen.
 * Jede Stufe hat Unteruebungen. Eine Mensch-Stufe traegt zusaetzlich `req`:
 * die Box-Stufen, die dafuer abgeschlossen sein muessen ([von, bis] oder "all").
 */

function rep(counts, tmpl){ return counts.map(function(c){ return tmpl(c); }); }

const BOX = [
  {n:1, title:"Kennenlernen Box", items:[
    "Kiste offen - Hund holt BW",
    "Kiste offen - Hund holt BW -Box Klickt",
    "Kiste geschlossen - Hund holt BW - Box öffnet sich von weitem",
    "Kiste geschlossen - Hund holt BW - Box öffnet sich von näher"
  ]},
  {n:2, title:"Aufbau Bellen (Abstand 10m)", items:[
    "Kiste offen mit BW - Hund wird gesperrt und bekommt BW nach 1x Bellen",
    ...rep([1,3,5,10,15,20,25,30], c=>`Kiste geschlossen - Hund wird gesperrt und bekommt BW nach ${c}x Bellen`)
  ]},
  {n:3, title:"Hygenie an der Box (Abstand 10m)", items:
    rep([1,3,5,10,15,20,25,30], c=>`Hund wird NICHT gesperrt und bekommt BW nach ${c}x Bellen`)
  },
  {n:4, title:"Bridge 1 - HF bewegt sich zum Hund (Abstand 15m)", items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung nach 3m",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung nach 3m`)
  ]},
  {n:5, title:"Bridge 2 - HF bewegt sich weiter Hund (Abstand 15m)", items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung nach 10m",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung nach 10m`)
  ]},
  {n:6, title:"Bridge 3 - HF bewegt sich bis zum Hund (Abstand 15m)", items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Hund",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund`)
  ]},
  {n:7, title:"Bridge 4 - HF läuft zum Hund auf die eine Seite und dann ein U um den Hund (Abstand 15m)", items:[
    "Hundführer bewegt sich auf Hund zu Bestätigung beim Hund",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund`)
  ]},
  {n:8, title:"Bridge 5 - HF bewegt sich bis zum Hund und kniet hin (Abstand 15m)", items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Knien",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Knien`)
  ]},
  {n:9, title:"Bridge 6 - Stehende Person im Umfeld >10m der VP - HF steht (Abstand 15m)", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:10, title:"Bridge 7 - 2 stehende Person im Umfeld der VP (>10m)- HF steht (Abstand 15m)", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:11, title:"Bridge 7 - HF steht +1 stehende Person + 1 Person, die auf einem parallelen Weg weg läuft (Abstand 15m)", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:12, title:"Bridge 8 - HF steht +2 Personen, die links und rechts vom Hund weg laufen in V Form vom HF aus (Abstand 15m)", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:13, title:"Bridge 9 - 1 Person, die Hinter der VP langläuft (Abstand 15m) + HF bewegt sich zum Hund", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:14, title:"Bridge 10 - 2 stehende Person im Umfeld der VP (>10m)- HF bewegt sich zum Hund (Abstand 15m)", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:15, title:"Bridge 11 - 1 stehende Person + 1 Person, die auf einem parallelen Weg weg läuft (Abstand 15m) + HF bewegt sich zum Hund", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:16, title:"Bridge 12 - 2 Personen, die links und rechts vom Hund weg laufen in V Form vom HF aus (Abstand 15m) + HF bewegt sich zum Hund", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:17, title:"Bridge 13 - 1 Person, die Hinter der VP langläuft (Abstand 15m) + HF bewegt sich zum Hund", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:18, title:"Bridge 14 - Ablenkung durch scharren am Boden mit Füßen (1 Person)", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:19, title:"Bridge 15 - Ablenkung durch Klatschen (1 Person)", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:20, title:"Bridge 16 - Ablenkung durch Klatschen und Scharren ( je 1 Person)", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:21, title:"Bridge 17 - Ablenkung durch Klatschen und Scharren ( je 2 Personen) - 2. Person steht hinter der Box", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:22, title:"Bridge 18 - HF bewegt sich bis zum Hund (Abstand 15m) und Hund bellt weiter", items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Hund",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund nach 5x Bellen`)
  ]},
  {n:23, title:"Bridge 19 - Ablenkung durch Stehenden Hund im Hintergrund", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:24, title:"Bridge 20 - Ablenkung durch Hund an der Leine im Hintergrund", items:[
    "Hund läuft parallel - Bestätigung nach kurzer Distanz 3m",
    "Hund läuft parallel - Bestätigung nach kurzer Distanz 5m",
    "Hund läuft parallel - Bestätigung nach kurzer Distanz 10m",
    "Hund läuft parallel - Bestätigung, wenn Hund an VP parallel vorbei"
  ]},
  {n:25, title:"Bridge 21 - Ablenkung durch Person mit klingelnder Kenndecke", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:26, title:"Bridge 22 - Ablenkung durch Hund mit klingelnder Kenndecke", items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:27, title:"Bridge 23 - HF bewegt sich bis zum Hund (Abstand 15m) und geht mit der Hand über ihn", items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Hund, wenn Hand in Richtung des Hundes",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund, wenn Hand in Richtung des Hundes`)
  ]},
  {n:28, title:"Bridge 24 - HF bewegt sich bis zum Hund (Abstand 15m) und berührt Hund", items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Hund, wenn Hund berührt",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund, wenn Hund berührt`)
  ]},
  {n:29, title:"Bridge 25 - HF bewegt sich am Hund vorbei (Abstand 15m)", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung, wenn am Hund vorbei`)},
  {n:30, title:"Bridge 26 - HF bewegt sich am Hund vorbei (Abstand 15m)", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung, wenn 5m am Hund vorbei`)},
  {n:31, title:"Bridge 27 - HF ruft z.B. \"Hallo ist da jemand\" (Abstand 15m)", items: rep([5,10,20,30], c=>`${c}x Bellen dann rufen und Bestätigung beim rufen`)},
  {n:32, title:"Bridge 28 - langes Bellen", items:["40x Bellen","50x Bellen","60x Bellen"]},
  {n:33, title:"Bridge 29 - HF fällt auf dem Weg still hin", items: rep([5,10,20,30], c=>`${c}x Bellen dann loslaufen und Bestätigung beim hinfallen`)}
];

const AUFBAU9 = [
  "Hund wird gesperrt und bekommt BW nach 1x Bellen",
  "Hund wird gesperrt und bekommt BW nach 1x Bellen",
  ...rep([3,5,10,15,20,25,30], c=>`Hund wird gesperrt und bekommt BW nach ${c}x Bellen`)
];

const MENSCH = [
  {n:1, title:"Aufbau Bellen 1 - Sitzend erhöht + BW offen", req:[1,6], items: AUFBAU9},
  {n:2, title:"Aufbau Bellen 2 - Sitzend erhöht + BW versteckt", req:[2,7], items: AUFBAU9},
  {n:3, title:"Aufbau Bellen 3 - Sitzend am Boden + BW offen", req:[3,8], items: AUFBAU9},
  {n:4, title:"Aufbau Bellen 4 - Sitzend am Boden + BW versteckt", req:[4,9], items: AUFBAU9},
  {n:5, title:"Hygenie beim Verbellen", req:[5,10], items:
    rep([1,3,5,10,15,20,25,30], c=>`Hund wird NICHT gesperrt und bekommt BW nach ${c}x Bellen`)
  },
  {n:6, title:"Bridge 1 - HF bewegt sich zum Hund (Abstand 15m)", req:[6,11], items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung nach 3m",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung nach 3m`)
  ]},
  {n:7, title:"Bridge 2 - HF bewegt sich weiter Hund (Abstand 15m)", req:[7,12], items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung nach 10m",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung nach 10m`)
  ]},
  {n:8, title:"Bridge 3 - HF bewegt sich bis zum Hund (Abstand 15m)", req:[8,13], items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Hund",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund`)
  ]},
  {n:9, title:"Bridge 4 - HF läuft zum Hund auf die eine Seite und dann ein U um den Hund (Abstand 15m)", req:[9,14], items:[
    "Hundführer bewegt sich auf Hund zu Bestätigung beim Hund",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund`)
  ]},
  {n:10, title:"Bridge 5 - HF bewegt sich bis zum Hund und kniet hin (Abstand 15m)", req:[10,15], items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Knien",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Knien`)
  ]},
  {n:11, title:"Bridge 6 - Stehende Person im Umfeld >10m der VP - HF steht (Abstand 15m)", req:[11,16], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:12, title:"Bridge 7 - 2 stehende Person im Umfeld der VP (>10m)- HF steht (Abstand 15m)", req:[12,17], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:13, title:"Bridge 7 - HF steht +1 stehende Person + 1 Person, die auf einem parallelen Weg weg läuft (Abstand 15m)", req:[13,18], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:14, title:"Bridge 8 - HF steht +2 Personen, die links und rechts vom Hund weg laufen in V Form vom HF aus (Abstand 15m)", req:[14,19], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:15, title:"Bridge 9 - 1 Person, die Hinter der VP langläuft (Abstand 15m) + HF bewegt sich zum Hund", req:[15,20], items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:16, title:"Bridge 10 - 2 stehende Person im Umfeld der VP (>10m)- HF bewegt sich zum Hund (Abstand 15m)", req:[16,21], items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:17, title:"Bridge 11 - 1 stehende Person + 1 Person, die auf einem parallelen Weg weg läuft (Abstand 15m) + HF bewegt sich zum Hund", req:[17,22], items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:18, title:"Bridge 12 - 2 Personen, die links und rechts vom Hund weg laufen in V Form vom HF aus (Abstand 15m) + HF bewegt sich zum Hund", req:[18,23], items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:19, title:"Bridge 13 - 1 Person, die Hinter der VP langläuft (Abstand 15m) + HF bewegt sich zum Hund", req:[19,24], items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung beim Hund`)},
  {n:20, title:"Bridge 14 - Ablenkung durch scharren am Boden mit Füßen (1 Person)", req:[20,25], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:21, title:"Bridge 15 - Ablenkung durch Klatschen (1 Person)", req:[21,26], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:22, title:"Bridge 16 - Ablenkung durch Klatschen und Scharren ( je 1 Person)", req:[22,27], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:23, title:"Bridge 17 - Ablenkung durch Klatschen und Scharren ( je 2 Personen) - 2. Person steht hinter der Box", req:[23,28], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:24, title:"Bridge 18 - Bewegung der VP - VP bewegt langsam die Hände", req:[24,29], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:25, title:"Bridge 19 - Bewegung der VP - VP kratzt sich im Gesicht (Langsam)", req:[25,30], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:26, title:"Bridge 20 - Bewegung der VP - VP bewegt sich etwas schneller z.B. kratzen", req:[26,31], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:27, title:"Bridge 21 - HF bewegt sich bis zum Hund (Abstand 15m) und Hund bellt weiter", req:[27,32], items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Hund",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund nach 5x Bellen`)
  ]},
  {n:28, title:"Bridge 22 - Ablenkung durch Stehenden Hund im Hintergrund", req:[28,33], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:29, title:"Bridge 23 - Ablenkung durch Hund an der Leine im Hintergrund", req:[29,33], items:[
    "Hund läuft parallel - Bestätigung nach kurzer Distanz 3m",
    "Hund läuft parallel - Bestätigung nach kurzer Distanz 5m",
    "Hund läuft parallel - Bestätigung nach kurzer Distanz 10m",
    "Hund läuft parallel - Bestätigung, wenn Hund an VP parallel vorbei"
  ]},
  {n:30, title:"Bridge 24 - Ablenkung durch Person mit klingelnder Kenndecke", req:[30,33], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:31, title:"Bridge 25 - Ablenkung durch Hund mit klingelnder Kenndecke", req:[31,33], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:32, title:"Bridge 26- VP Liegend", req:[32,33], items: rep([5,10,20,30], c=>`${c}x Bellen`)},
  {n:33, title:"Bridge 27 - HF bewegt sich bis zum Hund (Abstand 15m) und geht mit der Hand über ihn", req:[33,33], items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Hund, wenn Hand in Richtung des Hundes",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund, wenn Hand in Richtung des Hundes`)
  ]},
  {n:34, title:"Bridge 28 - HF bewegt sich bis zum Hund (Abstand 15m) und berührt Hund", req:"all", items:[
    "Hundführer bewegt sich auf Hund zu - Bestätigung beim Hund, wenn Hund berührt",
    ...rep([5,10,15,20], c=>`${c}x Bellen + HF bewegt sich auf Hund zu - Besättigung beim Hund, wenn Hund berührt`)
  ]},
  {n:35, title:"Bridge 29 - HF bewegt sich am Hund vorbei (Abstand 15m)", req:"all", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung, wenn am Hund vorbei`)},
  {n:36, title:"Bridge 30 - HF bewegt sich am Hund vorbei (Abstand 15m)", req:"all", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung, wenn 5m am Hund vorbei`)},
  {n:37, title:"Bridge 31 - HF ruft z.B. \"Hallo ist da jemand\" (Abstand 15m)", req:"all", items: rep([5,10,20,30], c=>`${c}x Bellen dann los + Bestätigung, wenn 5m am Hund vorbei`)},
  {n:38, title:"Bridge 32 - langes Bellen", req:"all", items:["40x Bellen","50x Bellen","60x Bellen"]}
];


export const VERBELLEN_PLAN = { box: BOX, mensch: MENSCH };

export const WEGE = [
  { id: 'box', label: 'Box', lang: 'Aufbau an der Box' },
  { id: 'mensch', label: 'Mensch', lang: 'Übertrag auf die Versteckperson' },
];

/** Anzahl Unterübungen im gesamten Plan – Bezugsgröße für den Fortschritt. */
export function planUmfang() {
  let box = 0, mensch = 0;
  BOX.forEach((st) => (box += st.items.length));
  MENSCH.forEach((st) => (mensch += st.items.length));
  return { box, mensch, gesamt: box + mensch };
}
