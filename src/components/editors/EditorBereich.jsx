// ============================================================
// EditorBereich.jsx — Bottom editor panel with Code & Klassen tabs
// ============================================================

import { useRef, useState, useCallback, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../stores/useAppStore';
import { useEditorResize } from '../../hooks/useEditorResize';
import CodeEditorTab from './CodeEditorTab';
import KlassenEditorTab from './KlassenEditorTab';
import { VORLAGEN } from '../../services/CodeVorlagen.js';

const vorlagenListe = Object.entries(VORLAGEN).map(([key, v]) => ({ key, name: v.name }));

function EditorBereich() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const editorRef = useRef(null);
  const { onMouseDown } = useEditorResize(editorRef);
  const [vorlagenOffen, setVorlagenOffen] = useState(false);
  const codeEditorRef = useRef(null); // ref to CodeEditorTab's textarea

  // Refs to child execute/apply callbacks
  const ausfuehrenRef = useRef(null);
  const uebernehmenRef = useRef(null);

  const handleVorlageClick = useCallback((vorlageKey) => {
    const vorlage = VORLAGEN[vorlageKey];
    if (vorlage && codeEditorRef.current) {
      codeEditorRef.current.value = vorlage.code;
    }
    setVorlagenOffen(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!vorlagenOffen) return;
    const handler = () => setVorlagenOffen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [vorlagenOffen]);

  const handleAusfuehrenClick = useCallback(() => {
    if (ausfuehrenRef.current) ausfuehrenRef.current();
  }, []);

  const handleUebernehmenClick = useCallback(() => {
    if (uebernehmenRef.current) uebernehmenRef.current();
  }, []);

  return (
    <div
      ref={editorRef}
      className="bg-white border-t border-panel-border flex flex-col shrink-0"
      style={{ height: 240 }}
    >
      {/* Resize handle */}
      <div
        className="h-1.5 cursor-ns-resize bg-transparent hover:bg-blue-200 transition-colors shrink-0"
        onMouseDown={onMouseDown}
      />

      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-panel-border shrink-0">
        <div className="flex items-center gap-0">
          <button
            className={`px-3 py-1 text-xs font-medium border-b-2 transition-colors ${
              state.editorTab === 'code'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => dispatch({ type: 'SET_EDITOR_TAB', payload: 'code' })}
          >
            Code-Editor
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium border-b-2 transition-colors ${
              state.editorTab === 'klassen'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => dispatch({ type: 'SET_EDITOR_TAB', payload: 'klassen' })}
          >
            Klassen-Editor
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Templates dropdown (Code tab only) */}
          {state.editorTab === 'code' && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setVorlagenOffen(!vorlagenOffen); }}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                title="Code-Vorlagen"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Vorlagen
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {vorlagenOffen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                  {vorlagenListe.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => handleVorlageClick(v.key)}
                      className="block w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Execute button (Code tab only) */}
          {state.editorTab === 'code' && (
            <button
              onClick={handleAusfuehrenClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1 rounded transition"
            >
              Ausfuehren
            </button>
          )}

          {/* Apply button (Klassen tab only) */}
          {state.editorTab === 'klassen' && (
            <button
              onClick={handleUebernehmenClick}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1 rounded transition"
            >
              Uebernehmen
            </button>
          )}

          {/* Collapse button */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_EDITOR' })}
            className="text-slate-400 hover:text-slate-600 transition"
            title="Editor ein-/ausklappen"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {state.editorTab === 'code' && (
          <CodeEditorTab textareaRef={codeEditorRef} onAusfuehrenRef={ausfuehrenRef} />
        )}
        {state.editorTab === 'klassen' && (
          <KlassenEditorTab onUebernehmenRef={uebernehmenRef} />
        )}
      </div>
    </div>
  );
}

export default EditorBereich;
