// ============================================================
// KlassenEditorTab.jsx — Klassen-Editor textarea + console
// ============================================================
// Uses the MethodenEditor class from src/editors/MethodenEditor.js
// with the new "elements" constructor parameter to avoid DOM IDs.
// ============================================================

import { useRef, useState, useCallback, useEffect } from 'react';
import { getDokument, emitChange } from '../../stores/dokumentStore';
import { MethodenEditor } from '../../editors/MethodenEditor.js';

const KLASSEN = ['Rechteck', 'Ellipse', 'Linie', 'Dreieck', 'Polygon', 'TextObjekt', 'BildObjekt'];

function KlassenEditorTab({ onUebernehmenRef }) {
  const editorRef = useRef(null);
  const konsoleRef = useRef(null);
  const [aktuelleKlasse, setAktuelleKlasse] = useState('Rechteck');
  const editorInstanceRef = useRef(null);

  // Initialize MethodenEditor once, after first render when refs are set
  const getEditor = useCallback(() => {
    if (editorInstanceRef.current) return editorInstanceRef.current;
    if (!editorRef.current || !konsoleRef.current) return null;

    const dokument = getDokument();
    const instance = new MethodenEditor(dokument, null, null, null, {
      editorElement: editorRef.current,
      auswahlElement: null,
      konsoleElement: konsoleRef.current,
      uebernehmenBtn: null,
      skipInit: true,
    });

    editorInstanceRef.current = instance;
    return instance;
  }, []);

  // Load class content when class changes or on first mount
  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;

    // Update refs in case they changed
    editor.editorElement = editorRef.current;
    editor.konsoleElement = konsoleRef.current;
    editor.dokument = getDokument();
    editor._aktuelleKlasse = aktuelleKlasse;
    editor._ladeKlasse(aktuelleKlasse);
  }, [aktuelleKlasse, getEditor]);

  const handleUebernehmen = useCallback(() => {
    const editor = getEditor();
    if (!editor || !editorRef.current) return;

    editor.editorElement = editorRef.current;
    editor.konsoleElement = konsoleRef.current;
    editor.dokument = getDokument();
    editor._editorInhalte[aktuelleKlasse] = editorRef.current.value;
    editor._parseAlleKlassen();
    emitChange();
  }, [aktuelleKlasse, getEditor]);

  // Expose the apply callback to parent via ref
  useEffect(() => {
    if (onUebernehmenRef) {
      onUebernehmenRef.current = handleUebernehmen;
    }
    return () => {
      if (onUebernehmenRef) {
        onUebernehmenRef.current = null;
      }
    };
  }, [handleUebernehmen, onUebernehmenRef]);

  const handleKlasseChange = useCallback((e) => {
    // Save current content before switching
    const editor = getEditor();
    if (editor && editorRef.current) {
      editor._editorInhalte[aktuelleKlasse] = editorRef.current.value;
    }
    setAktuelleKlasse(e.target.value);
  }, [aktuelleKlasse, getEditor]);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Class selector bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border-b border-slate-700 shrink-0">
          <label className="text-xs text-slate-400">Klasse:</label>
          <select
            value={aktuelleKlasse}
            onChange={handleKlasseChange}
            className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded border border-slate-600 outline-none"
          >
            {KLASSEN.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <textarea
          ref={editorRef}
          className="flex-1 p-3 font-mono text-xs resize-none outline-none bg-slate-900 text-slate-100 leading-relaxed"
          spellCheck={false}
        />
      </div>

      <div
        ref={konsoleRef}
        className="w-72 bg-slate-950 text-slate-300 p-3 font-mono text-xs overflow-y-auto border-l border-slate-700"
      >
        <span className="text-slate-500">// Methoden-Status erscheint hier</span>
      </div>
    </div>
  );
}

export default KlassenEditorTab;
