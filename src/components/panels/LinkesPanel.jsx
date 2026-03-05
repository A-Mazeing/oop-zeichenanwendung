// ============================================================
// LinkesPanel.jsx — Left panel with tabbed views
// ============================================================
// Tabs: Hierarchie, Dateien, Vererbung
// Reads linkerTab from app state, dispatches SET_LINKER_TAB.
// ============================================================

import { useAppState, useAppDispatch } from '../../stores/useAppStore';
import HierarchieTab from './HierarchieTab';
import DateienTab from './DateienTab';
import VererbungTab from './VererbungTab';

const tabs = [
  { id: 'hierarchie', label: 'Hierarchie' },
  { id: 'dateien', label: 'Dateien' },
  { id: 'vererbung', label: 'Vererbung' },
];

function LinkesPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const activeTab = state.linkerTab;

  const handleTabClick = (tabId) => {
    dispatch({ type: 'SET_LINKER_TAB', payload: tabId });
  };

  return (
    <aside className="w-[220px] bg-white border-r border-panel-border flex flex-col shrink-0 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-panel-border shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-slate-800 border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'hierarchie' && <HierarchieTab />}
        {activeTab === 'dateien' && <DateienTab />}
        {activeTab === 'vererbung' && <VererbungTab />}
      </div>
    </aside>
  );
}

export default LinkesPanel;
