// ============================================================
// pythonSubsetSprache.js — Sprach-Konfiguration fuer den Klassen-Editor
// ============================================================
// Basiert auf @codemirror/lang-python, erweitert um deutsche Schluesselwoerter
// und Klassen-/Methodennamen der Zeichenanwendung.
// ============================================================

import { StreamLanguage } from '@codemirror/language';

const PYTHON_KEYWORDS = new Set([
  'def', 'class', 'self', 'for', 'in', 'range', 'while',
  'if', 'elif', 'else', 'return', 'pass', 'break', 'continue',
  'print', 'import', 'from', 'not', 'and', 'or',
  'True', 'False', 'None',
]);

const DEUTSCHE_KEYWORDS = new Set([
  'wahr', 'falsch', 'und', 'oder', 'nicht', 'entferne',
]);

const BUILTINS = new Set([
  'abs', 'min', 'max', 'int', 'float', 'str', 'len', 'range', 'print',
]);

const TYPEN = new Set([
  'Rechteck', 'Ellipse', 'Linie', 'Dreieck', 'Polygon',
  'TextObjekt', 'Text', 'BildObjekt', 'Bild',
  'Zeichenobjekt', 'Dokument',
]);

const pythonSubsetGrammatik = {
  startState() {
    return {
      nachPunkt: false,
      einrueckung: 0,
    };
  },

  token(stream, state) {
    // Leerzeichen ueberspringen
    if (stream.eatSpace()) {
      state.nachPunkt = false;
      return null;
    }

    // Kommentare: #
    if (stream.eat('#')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Strings: dreifache Anfuehrungszeichen
    if (stream.match('"""') || stream.match("'''")) {
      const quote = stream.current();
      while (!stream.eol()) {
        if (stream.match(quote)) return 'string';
        stream.next();
      }
      return 'string';
    }

    // Strings: einfache/doppelte Anfuehrungszeichen
    if (stream.match('"')) {
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '\\') { stream.next(); continue; }
        if (ch === '"') break;
      }
      return 'string';
    }
    if (stream.match("'")) {
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '\\') { stream.next(); continue; }
        if (ch === "'") break;
      }
      return 'string';
    }

    // Zahlen
    if (stream.match(/^-?\d+(\.\d+)?/)) {
      return 'number';
    }

    // Punkt (Attribut-/Methodenzugriff)
    if (stream.eat('.')) {
      state.nachPunkt = true;
      return 'punctuation';
    }

    // Operatoren
    if (stream.match('==') || stream.match('!=') ||
        stream.match('<=') || stream.match('>=') ||
        stream.match('+=') || stream.match('-=') ||
        stream.match('*=') || stream.match('/=')) {
      state.nachPunkt = false;
      return 'operator';
    }
    if (stream.eat('+') || stream.eat('-') || stream.eat('*') ||
        stream.eat('/') || stream.eat('%') || stream.eat('<') ||
        stream.eat('>') || stream.eat('=')) {
      state.nachPunkt = false;
      return 'operator';
    }

    // Doppelpunkt (Blockbeginn)
    if (stream.eat(':')) {
      state.nachPunkt = false;
      return 'punctuation';
    }

    // Klammern und Komma
    if (stream.eat('(') || stream.eat(')') ||
        stream.eat('[') || stream.eat(']')) {
      state.nachPunkt = false;
      return 'bracket';
    }
    if (stream.eat(',')) {
      state.nachPunkt = false;
      return 'punctuation';
    }

    // Woerter (Bezeichner, Keywords, Typen)
    if (stream.match(/^\w+/)) {
      const wort = stream.current();

      // Nach Punkt: Attribut/Methode
      if (state.nachPunkt) {
        state.nachPunkt = false;
        return 'propertyName';
      }

      state.nachPunkt = false;

      // Decorator-artig: self
      if (wort === 'self') return 'keyword';

      // Python Keywords
      if (PYTHON_KEYWORDS.has(wort)) {
        if (wort === 'True' || wort === 'False' || wort === 'None') return 'bool';
        if (wort === 'def' || wort === 'class') return 'keyword';
        return 'keyword';
      }

      // Deutsche Keywords
      if (DEUTSCHE_KEYWORDS.has(wort)) {
        if (wort === 'wahr' || wort === 'falsch') return 'bool';
        return 'keyword';
      }

      // Builtins
      if (BUILTINS.has(wort)) return 'function(variableName)';

      // Typen (Klassen)
      if (TYPEN.has(wort)) return 'typeName';

      return 'variableName';
    }

    // Unbekanntes Zeichen ueberspringen
    stream.next();
    state.nachPunkt = false;
    return null;
  },

  indent(state, textAfter) {
    // Einfache Einrueckungshilfe: nach : einruecken
    return null; // CodeMirror handhabt Python-Einrueckung
  },
};

export const pythonSubsetSprache = StreamLanguage.define(pythonSubsetGrammatik);
