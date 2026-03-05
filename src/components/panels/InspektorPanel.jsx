// ============================================================
// InspektorPanel.jsx — Right-side inspector panel
// ============================================================
// Shows two collapsible sections:
//   1. Klassenansicht — UML class cards for each unique class type
//   2. Objektansicht  — UML object cards for selected objects
// ============================================================

import { useState } from 'react';
import { useDokument } from '../../hooks/useDokument.js';
import { Zeichenobjekt } from '../../models/Zeichenobjekt.js';

// Map JS typeof results to German-friendly type names
function typName(value) {
  if (typeof value === 'number') return 'Number';
  if (typeof value === 'string') return 'String';
  if (typeof value === 'boolean') return 'Boolean';
  return 'Object';
}

// Chevron SVG — points down when expanded, rotates 180 when collapsed
function Chevron({ collapsed }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}

// Collapsible section wrapper
function Section({ title, collapsed, onToggle, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-panel-border cursor-pointer flex items-center justify-between"
      >
        <span>{title}</span>
        <Chevron collapsed={collapsed} />
      </button>
      {!collapsed && (
        <div className="p-2 space-y-2 overflow-auto">
          {children}
        </div>
      )}
    </div>
  );
}

// UML class card — shows class name, attributes with types, and methods
function KlassenKarte({ className, attributeTypes, methoden }) {
  return (
    <div className="uml-card">
      <div className="uml-card-header">{className}</div>
      <div className="uml-card-section">
        {attributeTypes.map(([name, type]) => (
          <div key={name}>{name}: {type}</div>
        ))}
      </div>
      <div className="uml-card-section">
        {methoden.map((m) => (
          <div key={m}>{m}</div>
        ))}
      </div>
    </div>
  );
}

// UML object card — shows instance name : class, and current attribute values
function ObjektKarte({ obj }) {
  const varName = obj._name || '?';
  const klasse = obj.gibTypName();
  const attribute = obj.gibAttribute();

  return (
    <div className="uml-card">
      <div className="uml-card-header">
        <span className="underline">{varName} : {klasse}</span>
      </div>
      <div className="uml-card-section">
        {Object.entries(attribute).map(([key, value]) => (
          <div key={key}>{key} = {String(value)}</div>
        ))}
      </div>
    </div>
  );
}

function InspektorPanel() {
  const dokument = useDokument();

  // Both sections default to collapsed
  const [klassenCollapsed, setKlassenCollapsed] = useState(true);
  const [objekteCollapsed, setObjekteCollapsed] = useState(true);

  const objekte = dokument?.objekte ?? [];

  // Unique class types present in the document
  const uniqueTypes = [...new Set(objekte.map((o) => o.gibTypName()))];

  // Build class info from the first instance of each type
  const klassenInfos = uniqueTypes.map((typeName) => {
    const beispiel = objekte.find((o) => o.gibTypName() === typeName);
    const attribute = beispiel.gibAttribute();
    const attributeTypes = Object.entries(attribute).map(([key, val]) => [
      key,
      typName(val),
    ]);
    const methoden = beispiel.constructor.gibMethoden
      ? beispiel.constructor.gibMethoden()
      : Zeichenobjekt.gibMethoden();
    return { className: typeName, attributeTypes, methoden };
  });

  // Selected objects
  const ausgewaehlteObjekte = objekte.filter((o) => o.ausgewaehlt);

  return (
    <aside className="w-72 bg-white border-l border-panel-border flex flex-col overflow-hidden">
      {/* Klassenansicht */}
      <Section
        title="Klassenansicht"
        collapsed={klassenCollapsed}
        onToggle={() => setKlassenCollapsed((prev) => !prev)}
      >
        {klassenInfos.length === 0 ? (
          <p className="text-xs text-slate-400 px-1">Keine Objekte vorhanden.</p>
        ) : (
          klassenInfos.map((info) => (
            <KlassenKarte
              key={info.className}
              className={info.className}
              attributeTypes={info.attributeTypes}
              methoden={info.methoden}
            />
          ))
        )}
      </Section>

      {/* Objektansicht */}
      <Section
        title="Objektansicht"
        collapsed={objekteCollapsed}
        onToggle={() => setObjekteCollapsed((prev) => !prev)}
      >
        {ausgewaehlteObjekte.length === 0 ? (
          <p className="text-xs text-slate-400 px-1">Kein Objekt ausgewaehlt.</p>
        ) : (
          ausgewaehlteObjekte.map((obj, index) => (
            <ObjektKarte key={obj._name || index} obj={obj} />
          ))
        )}
      </Section>
    </aside>
  );
}

export default InspektorPanel;
