// ============================================================
// pseudocodeSprache.js — StreamLanguage fuer deutsche Pseudocode-Syntax
// ============================================================
// Unterstuetzte Muster:
//   TypName varName = neu KlassenName(args)
//   varName.methode(args)
//   entferne(varName)
//   // Kommentar
// ============================================================

import { StreamLanguage } from '@codemirror/language';

const KEYWORDS = new Set(['neu', 'entferne']);

const TYPEN = new Set([
  'Rechteck', 'Ellipse', 'Linie', 'Dreieck', 'Polygon',
  'TextObjekt', 'Text', 'BildObjekt', 'Bild',
]);

const METHODEN = new Set([
  'setzeFarbe', 'setzeLinienFarbe', 'setzeLinienStaerke',
  'verschieben', 'setzePosition', 'setzeGroesse',
  'sperreUmschalten', 'starteAnimation', 'stoppeAnimation',
  'setzeEckenAnzahl', 'setzeInhalt', 'setzeSchriftGroesse',
  'setzeQuelle', 'hintergrundfarbeSetzen',
]);

const BOOLEANS = new Set(['true', 'false', 'wahr', 'falsch']);

const pseudocodeGrammatik = {
  startState() {
    return { nachPunkt: false };
  },

  token(stream, state) {
    // Leerzeichen ueberspringen
    if (stream.eatSpace()) {
      state.nachPunkt = false;
      return null;
    }

    // Kommentare: //
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Strings: "..." oder '...'
    if (stream.match('"')) {
      while (!stream.eol()) {
        if (stream.next() === '"') break;
      }
      return 'string';
    }
    if (stream.match("'")) {
      while (!stream.eol()) {
        if (stream.next() === "'") break;
      }
      return 'string';
    }

    // Zahlen
    if (stream.match(/^-?\d+(\.\d+)?/)) {
      return 'number';
    }

    // Punkt (Methodentrenner)
    if (stream.eat('.')) {
      state.nachPunkt = true;
      return 'punctuation';
    }

    // Klammern und Komma
    if (stream.eat('(') || stream.eat(')')) {
      state.nachPunkt = false;
      return 'bracket';
    }
    if (stream.eat(',')) {
      state.nachPunkt = false;
      return 'punctuation';
    }

    // Gleichheitszeichen
    if (stream.eat('=')) {
      state.nachPunkt = false;
      return 'operator';
    }

    // Woerter (Bezeichner, Keywords, Typen)
    if (stream.match(/^\w+/)) {
      const wort = stream.current();

      // Nach Punkt: Methode
      if (state.nachPunkt) {
        state.nachPunkt = false;
        if (METHODEN.has(wort)) return 'function(variableName)';
        return 'propertyName';
      }

      state.nachPunkt = false;

      if (KEYWORDS.has(wort)) return 'keyword';
      if (TYPEN.has(wort)) return 'typeName';
      if (BOOLEANS.has(wort)) return 'bool';

      return 'variableName';
    }

    // Unbekanntes Zeichen ueberspringen
    stream.next();
    state.nachPunkt = false;
    return null;
  },
};

export const pseudocodeSprache = StreamLanguage.define(pseudocodeGrammatik);
