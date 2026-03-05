// ============================================================
// Toolbar.jsx — Left vertical toolbar with drawing tools
// ============================================================

import { useAppState, useActions } from '../../stores/useAppStore';

const werkzeuge = [
  {
    id: 'auswahl',
    title: 'Auswahl (V)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
      </svg>
    ),
  },
  {
    id: 'rechteck',
    title: 'Rechteck (R)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'ellipse',
    title: 'Ellipse (E)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="12" rx="10" ry="7"/>
      </svg>
    ),
  },
  {
    id: 'linie',
    title: 'Linie (L)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="20" x2="20" y2="4"/>
      </svg>
    ),
  },
  {
    id: 'dreieck',
    title: 'Dreieck (D)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,3 22,21 2,21"/>
      </svg>
    ),
  },
  {
    id: 'polygon',
    title: 'Polygon (P)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 21.5,8 19,19 5,19 2.5,8"/>
      </svg>
    ),
  },
  {
    id: 'text',
    title: 'Text (T)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <text x="6" y="18" fontSize="16" fill="currentColor" stroke="none" fontFamily="serif" fontWeight="bold">T</text>
      </svg>
    ),
  },
  {
    id: 'bild',
    title: 'Bild (B)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    ),
  },
];

function Toolbar() {
  const state = useAppState();
  const { setWerkzeug, toggleRaster, setFuellFarbe, setLinienFarbe } = useActions();

  return (
    <aside className="w-14 bg-white border-r border-panel-border flex flex-col items-center py-3 gap-1 shrink-0">
      {werkzeuge.map((w) => (
        <button
          key={w.id}
          onClick={() => setWerkzeug(w.id)}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
            state.aktivesWerkzeug === w.id
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title={w.title}
        >
          {w.icon}
        </button>
      ))}

      <div className="border-t border-panel-border w-8 my-2" />

      {/* Grid toggle */}
      <button
        onClick={toggleRaster}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
          state.rasterAnzeigen
            ? 'bg-blue-100 text-blue-700'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
        title="Raster ein/aus (G)"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="4" y1="4" x2="4" y2="20"/><line x1="10" y1="4" x2="10" y2="20"/>
          <line x1="16" y1="4" x2="16" y2="20"/><line x1="4" y1="4" x2="20" y2="4"/>
          <line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="16" x2="20" y2="16"/>
          <line x1="20" y1="4" x2="20" y2="20"/><line x1="4" y1="20" x2="20" y2="20"/>
        </svg>
      </button>

      <div className="border-t border-panel-border w-8 my-2" />

      {/* Fill color */}
      <label className="cursor-pointer" title="Fuellfarbe">
        <input
          type="color"
          value={state.fuellFarbe}
          onChange={(e) => setFuellFarbe(e.target.value)}
          className="sr-only"
        />
        <span
          className="w-6 h-6 rounded border border-slate-300 block"
          style={{ background: state.fuellFarbe }}
        />
      </label>
      <span className="text-[10px] text-slate-400 select-none">Fuell</span>

      {/* Line color */}
      <label className="cursor-pointer mt-1" title="Linienfarbe">
        <input
          type="color"
          value={state.linienFarbe}
          onChange={(e) => setLinienFarbe(e.target.value)}
          className="sr-only"
        />
        <span
          className="w-6 h-6 rounded border border-slate-300 block"
          style={{ background: state.linienFarbe }}
        />
      </label>
      <span className="text-[10px] text-slate-400 select-none">Linie</span>
    </aside>
  );
}

export default Toolbar;
