// ============================================================
// CodeEditorTab.jsx — Code editor textarea + console
// ============================================================
// Self-contained CodeInterpreter that parses a simple pseudocode
// syntax and creates/manipulates Zeichenobjekte on the canvas.
// ============================================================

import { useRef, useEffect, useCallback } from 'react';
import { getDokument } from '../../stores/dokumentStore';
import { snapshotSpeichern } from '../../stores/dokumentStore';
import { useAppState } from '../../stores/useAppStore';
import { Rechteck } from '../../models/Rechteck.js';
import { Ellipse } from '../../models/Ellipse.js';
import { Linie } from '../../models/Linie.js';
import { Dreieck } from '../../models/Dreieck.js';
import { TextObjekt } from '../../models/TextObjekt.js';
import { BildObjekt } from '../../models/BildObjekt.js';
import { Polygon } from '../../models/Polygon.js';

// Lightweight code interpreter that doesn't depend on DOM IDs.
// Replicates CodeEditor's parsing logic but works with refs.
class CodeInterpreter {
  constructor() {
    this.variablen = {};
    this.fuellFarbe = '#3b82f6';
    this.linienFarbe = '#1e293b';

    this._klassenMap = {
      Rechteck, Ellipse, Linie, Dreieck, Polygon,
      Text: TextObjekt, TextObjekt,
      Bild: BildObjekt, BildObjekt,
    };
  }

  ausfuehren(code, dokument) {
    const zeilen = code.split('\n');
    const ausgaben = [];
    let fehlerGefunden = false;

    // Make dokument available as variable
    this.variablen['dokument1'] = dokument;

    for (let i = 0; i < zeilen.length; i++) {
      const zeile = zeilen[i].trim();
      if (zeile === '' || zeile.startsWith('//')) continue;

      try {
        const msg = this._verarbeiteZeile(zeile, i + 1, dokument);
        if (msg) ausgaben.push({ typ: 'info', text: msg });
      } catch (err) {
        ausgaben.push({ typ: 'fehler', text: `Zeile ${i + 1}: ${err.message}` });
        fehlerGefunden = true;
      }
    }

    if (!fehlerGefunden) {
      ausgaben.push({ typ: 'erfolg', text: 'Code erfolgreich ausgefuehrt.' });
    }

    return { ausgaben, fehlerGefunden };
  }

  _verarbeiteZeile(zeile, zeilenNr, dokument) {
    // Pattern 1: Instanziierung
    const instanzMatch = zeile.match(/^(\w+)\s+(\w+)\s*=\s*neu\s+(\w+)\s*\(([^)]*)\)\s*$/);
    if (instanzMatch) {
      return this._instanziiere(instanzMatch[2], instanzMatch[3], instanzMatch[4], dokument);
    }

    // Pattern 2: Methodenaufruf
    const methodenMatch = zeile.match(/^(\w+)\.(\w+)\s*\(([^)]*)\)\s*$/);
    if (methodenMatch) {
      return this._rufeMethodeAuf(methodenMatch[1], methodenMatch[2], methodenMatch[3], dokument);
    }

    // Pattern 3: Objekt entfernen
    const entferneMatch = zeile.match(/^entferne\(\s*"?(\w+)"?\s*\)$/);
    if (entferneMatch) {
      const varName = entferneMatch[1];
      const obj = this.variablen[varName];
      if (!obj || typeof obj !== 'object') {
        throw new Error(`Objekt "${varName}" nicht gefunden. Verfuegbar: ${Object.keys(this.variablen).join(', ')}`);
      }
      if (typeof obj.stoppeAnimation === 'function') obj.stoppeAnimation();
      delete this.variablen[varName];
      dokument.entfernen(obj);
      return `"${varName}" wurde entfernt.`;
    }

    throw new Error(`Unbekannte Syntax: "${zeile}"`);
  }

  _instanziiere(varName, klassenName, argsStr, dokument) {
    const Klasse = this._klassenMap[klassenName];
    if (!Klasse) {
      throw new Error(`Unbekannte Klasse "${klassenName}". Verfuegbar: ${Object.keys(this._klassenMap).join(', ')}`);
    }

    const args = this._parseArgs(argsStr);
    let obj;
    try {
      obj = new Klasse(...args);
    } catch (e) {
      throw new Error(`Fehler beim Erstellen von ${klassenName}: ${e.message}`);
    }

    if (obj.fuellFarbe === '#3b82f6') obj.fuellFarbe = this.fuellFarbe;
    if (obj.linienFarbe === '#1e293b') obj.linienFarbe = this.linienFarbe;

    obj._name = varName;
    this.variablen[varName] = obj;
    dokument.hinzufuegen(obj);

    return `${varName} = neu ${klassenName}(${argsStr}) erstellt.`;
  }

  _rufeMethodeAuf(varName, methodenName, argsStr, dokument) {
    const obj = this.variablen[varName];
    if (!obj) {
      throw new Error(`Variable "${varName}" nicht gefunden. Verfuegbar: ${Object.keys(this.variablen).join(', ')}`);
    }
    if (typeof obj[methodenName] !== 'function') {
      throw new Error(`Methode "${methodenName}" existiert nicht auf ${varName}.`);
    }

    const args = this._parseArgs(argsStr);
    try {
      obj[methodenName](...args);
    } catch (e) {
      throw new Error(`Fehler bei ${varName}.${methodenName}(): ${e.message}`);
    }

    dokument.aktualisieren();
    return `${varName}.${methodenName}(${argsStr}) ausgefuehrt.`;
  }

  _parseArgs(argsStr) {
    if (!argsStr || argsStr.trim() === '') return [];

    return argsStr.split(',').map(arg => {
      arg = arg.trim();

      // String in Anfuehrungszeichen
      if ((arg.startsWith('"') && arg.endsWith('"')) ||
          (arg.startsWith("'") && arg.endsWith("'"))) {
        return arg.slice(1, -1);
      }

      // Zahl
      if (!isNaN(arg) && arg !== '') return parseFloat(arg);

      // Boolean
      if (arg === 'true' || arg === 'wahr') return true;
      if (arg === 'false' || arg === 'falsch') return false;

      // Variable referenzieren
      if (this.variablen[arg]) return this.variablen[arg];

      // Als String behandeln
      return arg;
    });
  }

  // Register objects created externally (e.g., via canvas mouse interaction)
  registriereExternesObjekt(obj) {
    if (obj._name && !this.variablen[obj._name]) {
      this.variablen[obj._name] = obj;
    }
  }
}

function CodeEditorTab({ textareaRef, onAusfuehrenRef }) {
  const internalTextareaRef = useRef(null);
  const konsoleRef = useRef(null);
  const interpreterRef = useRef(null);

  const state = useAppState();

  // Use external ref if provided, otherwise internal
  const actualRef = textareaRef || internalTextareaRef;

  // Lazy-init the interpreter (no DOM dependency)
  const getInterpreter = useCallback(() => {
    if (!interpreterRef.current) {
      interpreterRef.current = new CodeInterpreter();
    }
    return interpreterRef.current;
  }, []);

  const ausfuehren = useCallback(() => {
    const code = actualRef.current?.value || '';
    const dokument = getDokument();
    const interpreter = getInterpreter();

    // Sync colors from app state
    interpreter.fuellFarbe = state.fuellFarbe;
    interpreter.linienFarbe = state.linienFarbe;

    const { ausgaben, fehlerGefunden } = interpreter.ausfuehren(code, dokument);

    // Render output to console
    if (konsoleRef.current) {
      konsoleRef.current.innerHTML = ausgaben.map(a => {
        const escaped = a.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        switch (a.typ) {
          case 'fehler': return `<div class="text-red-400">${escaped}</div>`;
          case 'erfolg': return `<div class="text-emerald-400">${escaped}</div>`;
          default: return `<div class="text-slate-300">&gt; ${escaped}</div>`;
        }
      }).join('');
      konsoleRef.current.scrollTop = konsoleRef.current.scrollHeight;
    }

    // Notify canvas to redraw
    snapshotSpeichern();
  }, [actualRef, getInterpreter, state.fuellFarbe, state.linienFarbe]);

  // Expose the execute callback to parent via ref
  useEffect(() => {
    if (onAusfuehrenRef) {
      onAusfuehrenRef.current = ausfuehren;
    }
    return () => {
      if (onAusfuehrenRef) {
        onAusfuehrenRef.current = null;
      }
    };
  }, [ausfuehren, onAusfuehrenRef]);

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      ausfuehren();
    }
    // Tab support in textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = actualRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + '    ' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 4;
    }
  }, [ausfuehren, actualRef]);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <textarea
        ref={actualRef}
        className="flex-1 p-3 font-mono text-sm resize-none outline-none bg-slate-900 text-slate-100 leading-relaxed"
        spellCheck={false}
        onKeyDown={handleKeyDown}
        placeholder={'// Beispiel:\nRechteck r1 = neu Rechteck(50, 50, 150, 100)\nr1.setzeFarbe("gelb")\nr1.verschieben(20, 0)'}
      />
      <div
        ref={konsoleRef}
        className="w-72 bg-slate-950 text-slate-300 p-3 font-mono text-sm overflow-y-auto border-l border-slate-700"
      >
        <span className="text-slate-500">// Ausgabe erscheint hier</span>
      </div>
    </div>
  );
}

export default CodeEditorTab;
