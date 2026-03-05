// ============================================================
// App.jsx — Main application layout
// ============================================================

import { useRef, useCallback } from 'react';
import { AppStoreProvider, useAppState, useAppDispatch } from './stores/useAppStore';
import { getDokument, snapshotSpeichern } from './stores/dokumentStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Header from './components/layout/Header';
import Toolbar from './components/layout/Toolbar';
import ZeichenCanvas from './components/canvas/ZeichenCanvas';
import LinkesPanel from './components/panels/LinkesPanel';
import InspektorPanel from './components/panels/InspektorPanel';
import TextDialog from './components/dialogs/TextDialog';
import BildDialog from './components/dialogs/BildDialog';
import EditorBereich from './components/editors/EditorBereich';
import { TextObjekt } from './models/TextObjekt.js';
import { BildObjekt } from './models/BildObjekt.js';

function AppContent() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const objektZaehlerRef = useRef({
    Rechteck: 0, Ellipse: 0, Linie: 0, Dreieck: 0,
    Polygon: 0, TextObjekt: 0, BildObjekt: 0,
  });

  // Global keyboard shortcuts
  useKeyboardShortcuts(dispatch, objektZaehlerRef);

  // Dialog handlers
  const handleTextConfirm = useCallback((text, x, y) => {
    const dokument = getDokument();
    const textObj = new TextObjekt(x, y, text);
    textObj.fuellFarbe = state.fuellFarbe;
    objektZaehlerRef.current.TextObjekt = (objektZaehlerRef.current.TextObjekt || 0) + 1;
    textObj._name = `t${objektZaehlerRef.current.TextObjekt}`;
    dokument.hinzufuegen(textObj);
    snapshotSpeichern();
    dispatch({ type: 'CLOSE_DIALOG' });
  }, [state.fuellFarbe, dispatch]);

  const handleBildConfirm = useCallback((quelle, x, y) => {
    const dokument = getDokument();
    const bildObj = new BildObjekt(x, y, 150, 150, quelle);
    objektZaehlerRef.current.BildObjekt = (objektZaehlerRef.current.BildObjekt || 0) + 1;
    bildObj._name = `b${objektZaehlerRef.current.BildObjekt}`;
    dokument.hinzufuegen(bildObj);
    snapshotSpeichern();
    dispatch({ type: 'CLOSE_DIALOG' });
  }, [dispatch]);

  const handleDialogCancel = useCallback(() => {
    dispatch({ type: 'CLOSE_DIALOG' });
  }, [dispatch]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-sm text-slate-700">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        {state.linkesPanelOffen && <LinkesPanel />}
        <ZeichenCanvas />
        {state.inspektorOffen && <InspektorPanel />}
      </div>

      {/* Editor Panel (bottom) */}
      {state.editorOffen && <EditorBereich />}

      {/* Dialogs */}
      {state.dialog?.typ === 'text' && (
        <TextDialog
          x={state.dialog.x}
          y={state.dialog.y}
          onConfirm={handleTextConfirm}
          onCancel={handleDialogCancel}
        />
      )}
      {state.dialog?.typ === 'bild' && (
        <BildDialog
          x={state.dialog.x}
          y={state.dialog.y}
          onConfirm={handleBildConfirm}
          onCancel={handleDialogCancel}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AppStoreProvider>
      <AppContent />
    </AppStoreProvider>
  );
}

export default App;
