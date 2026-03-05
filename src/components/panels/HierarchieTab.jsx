// ============================================================
// HierarchieTab.jsx — Lists all Zeichenobjekte in the Dokument
// ============================================================
// Shows each object with color dot, type name, variable name.
// Clicking an item selects it and dispatches SET_AUSWAHL.
// ============================================================

import { useCallback } from 'react';
import { useDokument } from '../../hooks/useDokument.js';
import { useAppDispatch } from '../../stores/useAppStore';
import { getDokument, emitChange } from '../../stores/dokumentStore.js';

function HierarchieTab() {
  const dokument = useDokument();
  const dispatch = useAppDispatch();
  const objekte = dokument.objekte;

  const handleSelect = useCallback((index) => {
    const dok = getDokument();
    dok.alleAbwaehlen();
    const obj = dok.objekte[index];
    if (obj) {
      obj.ausgewaehlt = true;
    }
    emitChange();
    dispatch({ type: 'SET_AUSWAHL', payload: index });
  }, [dispatch]);

  if (objekte.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-400 text-center">
        Keine Objekte vorhanden.
        <br />
        Zeichne ein Objekt auf der Leinwand.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {objekte.map((obj, index) => (
        <button
          key={obj._name || `obj-${index}`}
          onClick={() => handleSelect(index)}
          className={`flex items-center gap-2 px-3 py-1.5 text-left w-full transition-colors ${
            obj.ausgewaehlt
              ? 'bg-blue-50 text-blue-800'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          {/* Color indicator dot */}
          <span
            className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
            style={{ backgroundColor: obj.fuellFarbe }}
          />

          {/* Type name */}
          <span className="text-xs font-medium truncate">
            {obj.gibTypName()}
          </span>

          {/* Variable name */}
          {obj._name && (
            <span className="text-[10px] text-slate-400 font-mono truncate ml-auto">
              {obj._name}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default HierarchieTab;
