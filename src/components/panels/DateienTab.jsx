// ============================================================
// DateienTab.jsx — Uploaded image files (DateiManager)
// ============================================================
// Lists all images stored in IndexedDB via DateiManager.
// Supports upload, rename, delete, and drag-to-canvas.
// ============================================================

import { useRef, useState, useEffect, useCallback } from 'react';
import { getDateiManager } from '../../services/DateiManager.js';

function DateienTab() {
  const fileInputRef = useRef(null);
  const [dateien, setDateien] = useState([]);
  const [umbenennenName, setUmbenennenName] = useState(null); // name being renamed
  const [neuerName, setNeuerName] = useState('');

  // Refresh file list from DateiManager
  const aktualisiereListeVon = useCallback(() => {
    const dm = getDateiManager();
    if (dm) {
      setDateien(dm.alleDateien());
    }
  }, []);

  // On mount and when DateiManager changes
  useEffect(() => {
    aktualisiereListeVon();
    const dm = getDateiManager();
    if (dm) {
      dm._onAenderung = aktualisiereListeVon;
    }
    return () => {
      const dm2 = getDateiManager();
      if (dm2 && dm2._onAenderung === aktualisiereListeVon) {
        dm2._onAenderung = null;
      }
    };
  }, [aktualisiereListeVon]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dm = getDateiManager();
    if (!dm) {
      console.warn('DateiManager nicht initialisiert.');
      return;
    }

    try {
      await dm.dateiHinzufuegen(file);
      aktualisiereListeVon();
    } catch (err) {
      console.error('Fehler beim Hochladen:', err);
    }

    e.target.value = '';
  };

  const handleLoeschen = async (name) => {
    const dm = getDateiManager();
    if (!dm) return;
    await dm.dateiLoeschen(name);
    aktualisiereListeVon();
  };

  const starteUmbenennen = (name) => {
    setUmbenennenName(name);
    setNeuerName(name);
  };

  const handleUmbenennen = async () => {
    if (!umbenennenName || !neuerName.trim()) {
      setUmbenennenName(null);
      return;
    }
    const dm = getDateiManager();
    if (dm) {
      await dm.dateiUmbenennen(umbenennenName, neuerName.trim());
      aktualisiereListeVon();
    }
    setUmbenennenName(null);
  };

  const handleUmbenennenKeyDown = (e) => {
    if (e.key === 'Enter') handleUmbenennen();
    if (e.key === 'Escape') setUmbenennenName(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* File list area */}
      <div className="flex-1 overflow-auto p-2">
        {dateien.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            Keine Bilder hochgeladen.
          </p>
        ) : (
          <div className="space-y-1">
            {dateien.map((datei) => (
              <div
                key={datei.name}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 group"
              >
                {/* Thumbnail */}
                <img
                  src={datei.dataUrl}
                  alt={datei.name}
                  className="w-8 h-8 object-cover rounded border border-slate-200 shrink-0"
                  draggable={false}
                />

                {/* Name (editable or display) */}
                {umbenennenName === datei.name ? (
                  <input
                    type="text"
                    value={neuerName}
                    onChange={(e) => setNeuerName(e.target.value)}
                    onBlur={handleUmbenennen}
                    onKeyDown={handleUmbenennenKeyDown}
                    className="flex-1 text-xs px-1 py-0.5 border border-blue-300 rounded outline-none bg-white"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 text-xs text-slate-600 truncate cursor-pointer"
                    onDoubleClick={() => starteUmbenennen(datei.name)}
                    title={`Doppelklick zum Umbenennen: ${datei.name}`}
                  >
                    {datei.name}
                  </span>
                )}

                {/* Delete button */}
                <button
                  onClick={() => handleLoeschen(datei.name)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Datei loeschen"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload button */}
      <div className="border-t border-panel-border p-3 shrink-0">
        <button
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Bild hochladen
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

export default DateienTab;
