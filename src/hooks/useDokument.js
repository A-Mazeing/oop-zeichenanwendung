// ============================================================
// useDokument.js — React hook to access the Dokument store
// ============================================================
// Uses useSyncExternalStore for safe concurrent reads.
// Components using this hook will re-render when the Dokument
// changes (e.g., after undo/redo, file load, object add/remove).
//
// For the canvas render loop, do NOT use this hook — access
// getDokument() directly via ref to avoid re-renders.
// ============================================================

import { useSyncExternalStore, useCallback } from 'react';
import {
  getDokument,
  subscribe,
  getSnapshot,
  snapshotSpeichern,
  rueckgaengig,
  wiederherstellen,
  emitChange,
} from '../stores/dokumentStore.js';

/**
 * React hook to read the current Dokument.
 * Triggers re-render when the Dokument changes.
 */
export function useDokument() {
  const dokument = useSyncExternalStore(subscribe, getSnapshot);
  return dokument;
}

/**
 * React hook providing Dokument mutation helpers.
 * These wrap common operations with undo snapshots and change notification.
 */
export function useDokumentActions() {
  const objektHinzufuegen = useCallback((objekt) => {
    const dok = getDokument();
    dok.hinzufuegen(objekt);
    snapshotSpeichern();
  }, []);

  const objektEntfernen = useCallback((objekt) => {
    const dok = getDokument();
    dok.entfernen(objekt);
    snapshotSpeichern();
  }, []);

  const alleAbwaehlen = useCallback(() => {
    const dok = getDokument();
    dok.alleAbwaehlen();
    emitChange();
  }, []);

  const objektAuswaehlen = useCallback((objekt) => {
    const dok = getDokument();
    dok.alleAbwaehlen();
    if (objekt) {
      objekt.ausgewaehlt = true;
    }
    emitChange();
  }, []);

  const notifyChange = useCallback(() => {
    emitChange();
  }, []);

  return {
    objektHinzufuegen,
    objektEntfernen,
    alleAbwaehlen,
    objektAuswaehlen,
    notifyChange,
    snapshotSpeichern,
    rueckgaengig,
    wiederherstellen,
  };
}
