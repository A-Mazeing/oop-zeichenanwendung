// ============================================================
// autovervollstaendigung.js — Autovervollstaendigungs-Quellen
// ============================================================
// Zwei CompletionSource-Funktionen:
//   1. pseudocodeVervollstaendigung — fuer den Code-Editor
//   2. klassenEditorVervollstaendigung — fuer den Klassen-Editor
// ============================================================

import { autocompletion } from '@codemirror/autocomplete';

// ----------------------------------------------------------
// Klassen und ihre Methoden (statisch bekannt)
// ----------------------------------------------------------
const KLASSEN_METHODEN = {
  Rechteck: [
    { label: 'setzeFarbe', detail: '(farbe)', info: 'Fuellfarbe setzen' },
    { label: 'setzeLinienFarbe', detail: '(farbe)', info: 'Linienfarbe setzen' },
    { label: 'setzeLinienStaerke', detail: '(staerke)', info: 'Linienstaerke setzen' },
    { label: 'verschieben', detail: '(dx, dy)', info: 'Objekt relativ verschieben' },
    { label: 'setzePosition', detail: '(x, y)', info: 'Absolute Position setzen' },
    { label: 'setzeGroesse', detail: '(breite, hoehe)', info: 'Groesse aendern' },
    { label: 'sperreUmschalten', detail: '()', info: 'Sperre ein-/ausschalten' },
    { label: 'starteAnimation', detail: '(methode, intervallMs)', info: 'Animation starten' },
    { label: 'stoppeAnimation', detail: '()', info: 'Animation stoppen' },
  ],
  Ellipse: null, // gleiche Methoden wie Rechteck
  Dreieck: null, // gleiche Methoden wie Rechteck
  Polygon: [
    { label: 'setzeFarbe', detail: '(farbe)', info: 'Fuellfarbe setzen' },
    { label: 'setzeLinienFarbe', detail: '(farbe)', info: 'Linienfarbe setzen' },
    { label: 'setzeLinienStaerke', detail: '(staerke)', info: 'Linienstaerke setzen' },
    { label: 'verschieben', detail: '(dx, dy)', info: 'Objekt relativ verschieben' },
    { label: 'setzePosition', detail: '(x, y)', info: 'Absolute Position setzen' },
    { label: 'setzeGroesse', detail: '(breite, hoehe)', info: 'Groesse aendern' },
    { label: 'setzeEckenAnzahl', detail: '(n)', info: 'Anzahl der Ecken setzen' },
    { label: 'sperreUmschalten', detail: '()', info: 'Sperre ein-/ausschalten' },
    { label: 'starteAnimation', detail: '(methode, intervallMs)', info: 'Animation starten' },
    { label: 'stoppeAnimation', detail: '()', info: 'Animation stoppen' },
  ],
  TextObjekt: [
    { label: 'setzeFarbe', detail: '(farbe)', info: 'Textfarbe setzen' },
    { label: 'verschieben', detail: '(dx, dy)', info: 'Objekt relativ verschieben' },
    { label: 'setzePosition', detail: '(x, y)', info: 'Absolute Position setzen' },
    { label: 'setzeInhalt', detail: '(text)', info: 'Textinhalt aendern' },
    { label: 'setzeSchriftGroesse', detail: '(groesse)', info: 'Schriftgroesse setzen' },
    { label: 'sperreUmschalten', detail: '()', info: 'Sperre ein-/ausschalten' },
    { label: 'starteAnimation', detail: '(methode, intervallMs)', info: 'Animation starten' },
    { label: 'stoppeAnimation', detail: '()', info: 'Animation stoppen' },
  ],
  Text: null, // Alias fuer TextObjekt
  BildObjekt: [
    { label: 'verschieben', detail: '(dx, dy)', info: 'Objekt relativ verschieben' },
    { label: 'setzePosition', detail: '(x, y)', info: 'Absolute Position setzen' },
    { label: 'setzeGroesse', detail: '(breite, hoehe)', info: 'Groesse aendern' },
    { label: 'setzeQuelle', detail: '(url)', info: 'Bildquelle (URL) setzen' },
    { label: 'sperreUmschalten', detail: '()', info: 'Sperre ein-/ausschalten' },
    { label: 'starteAnimation', detail: '(methode, intervallMs)', info: 'Animation starten' },
    { label: 'stoppeAnimation', detail: '()', info: 'Animation stoppen' },
  ],
  Bild: null, // Alias fuer BildObjekt
  Linie: [
    { label: 'setzeLinienFarbe', detail: '(farbe)', info: 'Linienfarbe setzen' },
    { label: 'setzeLinienStaerke', detail: '(staerke)', info: 'Linienstaerke setzen' },
    { label: 'verschieben', detail: '(dx, dy)', info: 'Objekt relativ verschieben' },
    { label: 'setzePosition', detail: '(x, y)', info: 'Absolute Position setzen' },
    { label: 'sperreUmschalten', detail: '()', info: 'Sperre ein-/ausschalten' },
    { label: 'starteAnimation', detail: '(methode, intervallMs)', info: 'Animation starten' },
    { label: 'stoppeAnimation', detail: '()', info: 'Animation stoppen' },
  ],
};

// Aliases aufloesen
KLASSEN_METHODEN.Ellipse = KLASSEN_METHODEN.Rechteck;
KLASSEN_METHODEN.Dreieck = KLASSEN_METHODEN.Rechteck;
KLASSEN_METHODEN.Text = KLASSEN_METHODEN.TextObjekt;
KLASSEN_METHODEN.Bild = KLASSEN_METHODEN.BildObjekt;

const KLASSEN_NAMEN = Object.keys(KLASSEN_METHODEN).map(name => ({
  label: name,
  type: 'class',
  detail: 'Klasse',
}));

// ----------------------------------------------------------
// 1. Pseudocode-Vervollstaendigung (Code-Editor)
// ----------------------------------------------------------
function pseudocodeQuelle(interpreterRef) {
  return (context) => {
    // Nach Punkt: Methoden vorschlagen
    const punktMatch = context.matchBefore(/(\w+)\.\w*$/);
    if (punktMatch) {
      const volltext = punktMatch.text;
      const punktPos = volltext.lastIndexOf('.');
      const varName = volltext.substring(0, punktPos);
      const nachPunkt = volltext.substring(punktPos + 1);

      // Klasse der Variable bestimmen
      const interpreter = interpreterRef?.current;
      const obj = interpreter?.variablen?.[varName];
      let methoden = [];

      if (obj) {
        // Zur Laufzeit: Klasse des Objekts bestimmen
        const klassenName = obj.constructor?.name;
        const bekannteMethoden = KLASSEN_METHODEN[klassenName];
        if (bekannteMethoden) {
          methoden = bekannteMethoden.map(m => ({ ...m, type: 'method' }));
        }
      }

      // Fallback: Alle bekannten Methoden anbieten
      if (methoden.length === 0) {
        const alleMethoden = new Map();
        for (const [, liste] of Object.entries(KLASSEN_METHODEN)) {
          if (!liste) continue;
          for (const m of liste) {
            if (!alleMethoden.has(m.label)) {
              alleMethoden.set(m.label, { ...m, type: 'method' });
            }
          }
        }
        methoden = [...alleMethoden.values()];
      }

      return {
        from: punktMatch.from + punktPos + 1,
        options: methoden,
        filter: true,
      };
    }

    // Allgemeine Wort-Vervollstaendigung
    const wortMatch = context.matchBefore(/\w+/);
    if (!wortMatch && !context.explicit) return null;

    const from = wortMatch ? wortMatch.from : context.pos;
    const optionen = [];

    // Keyword "neu"
    optionen.push({ label: 'neu', type: 'keyword', detail: 'Neues Objekt erstellen' });

    // "entferne"
    optionen.push({ label: 'entferne', type: 'keyword', detail: 'Objekt entfernen' });

    // Klassen-Namen
    optionen.push(...KLASSEN_NAMEN);

    // Booleans
    optionen.push(
      { label: 'true', type: 'constant' },
      { label: 'false', type: 'constant' },
      { label: 'wahr', type: 'constant', detail: '= true' },
      { label: 'falsch', type: 'constant', detail: '= false' },
    );

    // Laufzeit-Variablen aus dem Interpreter
    const interpreter = interpreterRef?.current;
    if (interpreter?.variablen) {
      for (const [name, obj] of Object.entries(interpreter.variablen)) {
        const klasse = obj?.constructor?.name || 'Objekt';
        optionen.push({ label: name, type: 'variable', detail: klasse });
      }
    }

    return {
      from,
      options: optionen,
      filter: true,
    };
  };
}

/**
 * Erstellt die Autocompletion-Erweiterung fuer den Pseudocode-Editor.
 * @param {React.RefObject} interpreterRef — Ref zum CodeInterpreter
 */
export function pseudocodeVervollstaendigung(interpreterRef) {
  return autocompletion({
    override: [pseudocodeQuelle(interpreterRef)],
    activateOnTyping: true,
    maxRenderedOptions: 20,
  });
}

// ----------------------------------------------------------
// 2. Klassen-Editor-Vervollstaendigung
// ----------------------------------------------------------
const PYTHON_KEYWORDS_COMPLETIONS = [
  { label: 'def', type: 'keyword' },
  { label: 'class', type: 'keyword' },
  { label: 'self', type: 'keyword' },
  { label: 'for', type: 'keyword' },
  { label: 'in', type: 'keyword' },
  { label: 'range', type: 'keyword' },
  { label: 'while', type: 'keyword' },
  { label: 'if', type: 'keyword' },
  { label: 'elif', type: 'keyword' },
  { label: 'else', type: 'keyword' },
  { label: 'return', type: 'keyword' },
  { label: 'pass', type: 'keyword' },
  { label: 'print', type: 'function', detail: '(wert)' },
  { label: 'True', type: 'constant' },
  { label: 'False', type: 'constant' },
  { label: 'None', type: 'constant' },
];

const DEUTSCHE_COMPLETIONS = [
  { label: 'wahr', type: 'constant', detail: '= True' },
  { label: 'falsch', type: 'constant', detail: '= False' },
  { label: 'und', type: 'keyword', detail: '= and' },
  { label: 'oder', type: 'keyword', detail: '= or' },
  { label: 'nicht', type: 'keyword', detail: '= not' },
  { label: 'entferne', type: 'keyword', detail: 'Objekt entfernen' },
];

const BUILTIN_COMPLETIONS = [
  { label: 'abs', type: 'function', detail: '(x)' },
  { label: 'min', type: 'function', detail: '(a, b)' },
  { label: 'max', type: 'function', detail: '(a, b)' },
  { label: 'int', type: 'function', detail: '(x)' },
  { label: 'float', type: 'function', detail: '(x)' },
  { label: 'str', type: 'function', detail: '(x)' },
  { label: 'len', type: 'function', detail: '(obj)' },
];

// self. Attribute und Methoden
const SELF_COMPLETIONS = [
  { label: 'x', type: 'property', detail: 'Position X' },
  { label: 'y', type: 'property', detail: 'Position Y' },
  { label: 'breite', type: 'property', detail: 'Breite' },
  { label: 'hoehe', type: 'property', detail: 'Hoehe' },
  { label: 'fuellFarbe', type: 'property', detail: 'Fuellfarbe' },
  { label: 'linienFarbe', type: 'property', detail: 'Linienfarbe' },
  { label: 'linienStaerke', type: 'property', detail: 'Linienstaerke' },
  { label: 'sichtbar', type: 'property', detail: 'Sichtbarkeit' },
  { label: 'setzeFarbe', type: 'method', detail: '(farbe)' },
  { label: 'setzePosition', type: 'method', detail: '(x, y)' },
  { label: 'verschieben', type: 'method', detail: '(dx, dy)' },
  { label: 'setzeGroesse', type: 'method', detail: '(breite, hoehe)' },
  { label: 'starteAnimation', type: 'method', detail: '(methode, intervallMs)' },
  { label: 'stoppeAnimation', type: 'method', detail: '()' },
];

function klassenEditorQuelle(context) {
  // self. Vervollstaendigung
  const selfMatch = context.matchBefore(/self\.\w*$/);
  if (selfMatch) {
    const punktPos = selfMatch.text.indexOf('.');
    return {
      from: selfMatch.from + punktPos + 1,
      options: SELF_COMPLETIONS,
      filter: true,
    };
  }

  // Allgemeine Wort-Vervollstaendigung
  const wortMatch = context.matchBefore(/\w+/);
  if (!wortMatch && !context.explicit) return null;

  const from = wortMatch ? wortMatch.from : context.pos;
  const optionen = [
    ...PYTHON_KEYWORDS_COMPLETIONS,
    ...DEUTSCHE_COMPLETIONS,
    ...BUILTIN_COMPLETIONS,
    ...KLASSEN_NAMEN,
  ];

  return {
    from,
    options: optionen,
    filter: true,
  };
}

/**
 * Erstellt die Autocompletion-Erweiterung fuer den Klassen-Editor.
 */
export function klassenEditorVervollstaendigung() {
  return autocompletion({
    override: [klassenEditorQuelle],
    activateOnTyping: true,
    maxRenderedOptions: 20,
  });
}
