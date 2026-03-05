// ============================================================
// BildDialog.jsx — Modal dialog for inserting images
// ============================================================

import { useState, useRef, useEffect } from 'react';

function BildDialog({ x, y, onConfirm, onCancel }) {
  const [url, setUrl] = useState('');
  const urlInputRef = useRef(null);
  const dateiInputRef = useRef(null);

  useEffect(() => {
    urlInputRef.current?.focus();
  }, []);

  const handleConfirm = () => {
    const datei = dateiInputRef.current?.files?.[0];

    if (datei) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onConfirm(e.target.result, x, y);
      };
      reader.readAsDataURL(datei);
    } else if (url.trim()) {
      onConfirm(url.trim(), x, y);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-lg shadow-xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Bild-URL eingeben:
        </label>
        <input
          ref={urlInputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/bild.png"
          className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <div className="mt-3">
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Oder Datei hochladen:
          </label>
          <input
            ref={dateiInputRef}
            type="file"
            accept="image/*"
            className="text-xs text-slate-600"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-semibold"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default BildDialog;
