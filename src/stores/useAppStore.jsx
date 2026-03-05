// ============================================================
// useAppStore.jsx — React Context for UI state
// ============================================================
// Manages all UI-related state that SHOULD trigger React re-renders:
// active tool, colors, panel visibility, zoom/pan, editor tabs, etc.
//
// The Dokument model is NOT stored here — it lives in dokumentStore.js
// to keep canvas interactions fast and re-render-free.
// ============================================================

import { createContext, useContext, useReducer, useCallback } from 'react';

// --- Initial State ---

const initialState = {
  // Active drawing tool
  aktivesWerkzeug: 'auswahl', // auswahl | rechteck | ellipse | linie | dreieck | polygon | text | bild

  // Colors
  fuellFarbe: '#3b82f6',
  linienFarbe: '#1e293b',
  linienStaerke: 2,

  // Canvas settings
  rasterAnzeigen: true,
  rasterGroesse: 20,

  // Zoom & Pan
  zoom: 1,
  panX: 0,
  panY: 0,

  // Panel visibility
  linkesPanelOffen: true,
  inspektorOffen: true,

  // Left panel active tab
  linkerTab: 'hierarchie', // hierarchie | dateien | vererbung

  // Editor area
  editorOffen: true,
  editorTab: 'code', // code | klassen | methoden

  // Selection (ID of selected object, synced from Dokument)
  ausgewaehlteId: null,

  // Status bar message
  statusNachricht: '',

  // Dialog state
  dialog: null, // null | { typ: 'text', ... } | { typ: 'bild', ... }
};

// --- Reducer ---

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_WERKZEUG':
      return { ...state, aktivesWerkzeug: action.payload };

    case 'SET_FUELL_FARBE':
      return { ...state, fuellFarbe: action.payload };

    case 'SET_LINIEN_FARBE':
      return { ...state, linienFarbe: action.payload };

    case 'SET_LINIEN_STAERKE':
      return { ...state, linienStaerke: action.payload };

    case 'TOGGLE_RASTER':
      return { ...state, rasterAnzeigen: !state.rasterAnzeigen };

    case 'SET_RASTER_GROESSE':
      return { ...state, rasterGroesse: action.payload };

    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };

    case 'SET_PAN':
      return { ...state, panX: action.payload.x, panY: action.payload.y };

    case 'ZOOM_IN':
      return { ...state, zoom: Math.min(state.zoom * 1.2, 5) };

    case 'ZOOM_OUT':
      return { ...state, zoom: Math.max(state.zoom / 1.2, 0.1) };

    case 'ZOOM_RESET':
      return { ...state, zoom: 1, panX: 0, panY: 0 };

    case 'TOGGLE_LINKES_PANEL':
      return { ...state, linkesPanelOffen: !state.linkesPanelOffen };

    case 'TOGGLE_INSPEKTOR':
      return { ...state, inspektorOffen: !state.inspektorOffen };

    case 'SET_LINKER_TAB':
      return { ...state, linkerTab: action.payload };

    case 'TOGGLE_EDITOR':
      return { ...state, editorOffen: !state.editorOffen };

    case 'SET_EDITOR_OFFEN':
      return { ...state, editorOffen: action.payload };

    case 'SET_EDITOR_TAB':
      return { ...state, editorTab: action.payload };

    case 'SET_AUSWAHL':
      return { ...state, ausgewaehlteId: action.payload };

    case 'SET_STATUS':
      return { ...state, statusNachricht: action.payload };

    case 'SHOW_DIALOG':
      return { ...state, dialog: action.payload };

    case 'CLOSE_DIALOG':
      return { ...state, dialog: null };

    default:
      return state;
  }
}

// --- Context ---

const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

// --- Provider ---

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// --- Hooks ---

/** Access the full UI state */
export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (ctx === null) {
    throw new Error('useAppState must be used within <AppStoreProvider>');
  }
  return ctx;
}

/** Access the dispatch function */
export function useAppDispatch() {
  const ctx = useContext(AppDispatchContext);
  if (ctx === null) {
    throw new Error('useAppDispatch must be used within <AppStoreProvider>');
  }
  return ctx;
}

/** Convenience: get both state and dispatch */
export function useAppStore() {
  return [useAppState(), useAppDispatch()];
}

// --- Action creators (optional convenience) ---

export function useActions() {
  const dispatch = useAppDispatch();

  return {
    setWerkzeug: useCallback((w) => dispatch({ type: 'SET_WERKZEUG', payload: w }), [dispatch]),
    setFuellFarbe: useCallback((f) => dispatch({ type: 'SET_FUELL_FARBE', payload: f }), [dispatch]),
    setLinienFarbe: useCallback((f) => dispatch({ type: 'SET_LINIEN_FARBE', payload: f }), [dispatch]),
    setLinienStaerke: useCallback((s) => dispatch({ type: 'SET_LINIEN_STAERKE', payload: s }), [dispatch]),
    toggleRaster: useCallback(() => dispatch({ type: 'TOGGLE_RASTER' }), [dispatch]),
    zoomIn: useCallback(() => dispatch({ type: 'ZOOM_IN' }), [dispatch]),
    zoomOut: useCallback(() => dispatch({ type: 'ZOOM_OUT' }), [dispatch]),
    zoomReset: useCallback(() => dispatch({ type: 'ZOOM_RESET' }), [dispatch]),
    setZoom: useCallback((z) => dispatch({ type: 'SET_ZOOM', payload: z }), [dispatch]),
    setPan: useCallback((x, y) => dispatch({ type: 'SET_PAN', payload: { x, y } }), [dispatch]),
    toggleLinkesPanel: useCallback(() => dispatch({ type: 'TOGGLE_LINKES_PANEL' }), [dispatch]),
    toggleInspektor: useCallback(() => dispatch({ type: 'TOGGLE_INSPEKTOR' }), [dispatch]),
    setLinkerTab: useCallback((t) => dispatch({ type: 'SET_LINKER_TAB', payload: t }), [dispatch]),
    toggleEditor: useCallback(() => dispatch({ type: 'TOGGLE_EDITOR' }), [dispatch]),
    setEditorOffen: useCallback((v) => dispatch({ type: 'SET_EDITOR_OFFEN', payload: v }), [dispatch]),
    setEditorTab: useCallback((t) => dispatch({ type: 'SET_EDITOR_TAB', payload: t }), [dispatch]),
    setAuswahl: useCallback((id) => dispatch({ type: 'SET_AUSWAHL', payload: id }), [dispatch]),
    setStatus: useCallback((msg) => dispatch({ type: 'SET_STATUS', payload: msg }), [dispatch]),
    showDialog: useCallback((d) => dispatch({ type: 'SHOW_DIALOG', payload: d }), [dispatch]),
    closeDialog: useCallback(() => dispatch({ type: 'CLOSE_DIALOG' }), [dispatch]),
  };
}
