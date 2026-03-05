// ============================================================
// Header.jsx — Top bar with title and project save/load
// ============================================================

import { useRef, useCallback } from 'react';
import { getDokument, setDokument, getUndoManager, emitChange } from '../../stores/dokumentStore';
import { getDateiManager } from '../../services/DateiManager.js';

function Header() {
  const dateiInputRef = useRef(null);

  const zeitstempel = useCallback(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}-${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  const projektSpeichern = useCallback(() => {
    const dokument = getDokument();
    const daten = dokument.projektSpeichern();

    // Include DateiManager files if available
    const dateiManager = getDateiManager();
    if (dateiManager) {
      daten.dateien = dateiManager.exportiereFuerProjekt();
    }

    const json = JSON.stringify(daten, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `oop-projekt-${zeitstempel()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [zeitstempel]);

  const projektLaden = useCallback((datei) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const daten = JSON.parse(e.target.result);
        const dokument = getDokument();
        dokument.projektLaden(daten);

        // Import DateiManager files if present
        const dateiManager = getDateiManager();
        if (dateiManager && daten.dateien) {
          await dateiManager.importiereVonProjekt(daten.dateien);
        }

        // Reset UndoManager after load
        const undoManager = getUndoManager();
        undoManager.zuruecksetzen();

        emitChange();
      } catch (err) {
        alert('Fehler beim Laden: ' + err.message);
      }
    };
    reader.readAsText(datei);
  }, []);

  const onDateiChange = useCallback((e) => {
    const datei = e.target.files[0];
    if (!datei) return;
    projektLaden(datei);
    e.target.value = '';
  }, [projektLaden]);

  return (
    <header className="bg-white border-b border-panel-border px-4 py-2 flex items-center gap-4 shrink-0">
      <h1 className="text-base font-bold text-slate-800 tracking-tight">
        OOP Zeichenanwendung
      </h1>
      <span className="text-xs text-slate-400 font-mono">v1.0</span>

      <div className="ml-auto flex items-center gap-2">
        {/* Save button */}
        <button
          onClick={projektSpeichern}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 px-2.5 py-1.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
          title="Projekt als Datei speichern"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Speichern
        </button>

        {/* Load button */}
        <button
          onClick={() => dateiInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 px-2.5 py-1.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
          title="Projekt aus Datei laden"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Laden
        </button>
        <input
          ref={dateiInputRef}
          type="file"
          accept=".json,.oop"
          className="hidden"
          onChange={onDateiChange}
        />
      </div>
    </header>
  );
}

export default Header;
