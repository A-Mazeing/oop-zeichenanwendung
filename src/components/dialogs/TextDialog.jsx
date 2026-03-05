// ============================================================
// TextDialog.jsx — Modal dialog for entering text
// ============================================================

import { useState, useRef, useEffect } from 'react';

function TextDialog({ x, y, onConfirm, onCancel }) {
  const [text, setText] = useState('Text');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleConfirm = () => {
    const trimmed = text.trim();
    if (trimmed) onConfirm(trimmed, x, y);
    else onCancel();
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
      <div className="bg-white rounded-lg shadow-xl p-5 w-80" onClick={(e) => e.stopPropagation()}>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Text eingeben:
        </label>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
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

export default TextDialog;
