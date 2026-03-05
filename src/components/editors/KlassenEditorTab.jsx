// ============================================================
// KlassenEditorTab.jsx — Klassen-Editor with CodeMirror + console
// ============================================================
// Uses the MethodenEditor class from src/editors/MethodenEditor.js
// with the new "elements" constructor parameter to avoid DOM IDs.
// ============================================================

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { getDokument, emitChange } from '../../stores/dokumentStore';
import { MethodenEditor } from '../../editors/MethodenEditor.js';
import { dunklesTheme } from '../../editors/editorTheme.js';
import { pythonSubsetSprache } from '../../editors/pythonSubsetSprache.js';
import { klassenEditorVervollstaendigung } from '../../editors/autovervollstaendigung.js';

const KLASSEN = ['Rechteck', 'Ellipse', 'Linie', 'Dreieck', 'Polygon', 'TextObjekt', 'BildObjekt'];

function KlassenEditorTab({ onUebernehmenRef }) {
  const konsoleRef = useRef(null);
  const [aktuelleKlasse, setAktuelleKlasse] = useState('Rechteck');
  const editorInstanceRef = useRef(null);
  const codeRef = useRef('');
  const [editorValue, setEditorValue] = useState('');

  // We create a fake editorElement-like object so MethodenEditor can
  // read/write .value without a real textarea DOM node.
  const fakeEditorElement = useRef({
    get value() { return codeRef.current; },
    set value(v) {
      codeRef.current = v;
      setEditorValue(v);
    },
  });

  // Initialize MethodenEditor once, after first render when refs are set
  const getEditor = useCallback(() => {
    if (editorInstanceRef.current) return editorInstanceRef.current;
    if (!konsoleRef.current) return null;

    const dokument = getDokument();
    const instance = new MethodenEditor(dokument, null, null, null, {
      editorElement: fakeEditorElement.current,
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
    editor.editorElement = fakeEditorElement.current;
    editor.konsoleElement = konsoleRef.current;
    editor.dokument = getDokument();
    editor._aktuelleKlasse = aktuelleKlasse;
    editor._ladeKlasse(aktuelleKlasse);

    // After loading, sync the value from the fake element
    codeRef.current = fakeEditorElement.current.value;
    setEditorValue(fakeEditorElement.current.value);
  }, [aktuelleKlasse, getEditor]);

  const handleUebernehmen = useCallback(() => {
    const editor = getEditor();
    if (!editor) return;

    editor.editorElement = fakeEditorElement.current;
    editor.konsoleElement = konsoleRef.current;
    editor.dokument = getDokument();
    editor._editorInhalte[aktuelleKlasse] = codeRef.current;
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
    if (editor) {
      editor._editorInhalte[aktuelleKlasse] = codeRef.current;
    }
    setAktuelleKlasse(e.target.value);
  }, [aktuelleKlasse, getEditor]);

  const handleChange = useCallback((value) => {
    codeRef.current = value;
  }, []);

  // Autocompletion extension
  const vervollstaendigung = useMemo(
    () => klassenEditorVervollstaendigung(),
    []
  );

  // Combined extensions
  const extensions = useMemo(
    () => [pythonSubsetSprache, vervollstaendigung],
    [vervollstaendigung]
  );

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

        <div className="flex-1 overflow-hidden">
          <CodeMirror
            value={editorValue}
            onChange={handleChange}
            theme={dunklesTheme}
            extensions={extensions}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: false, // We provide our own
              indentOnInput: true,
            }}
            height="100%"
            style={{ height: '100%' }}
          />
        </div>
      </div>

      <div
        ref={konsoleRef}
        className="w-72 bg-slate-950 text-slate-300 p-3 font-mono text-sm overflow-y-auto border-l border-slate-700"
      >
        <span className="text-slate-500">// Methoden-Status erscheint hier</span>
      </div>
    </div>
  );
}

export default KlassenEditorTab;
