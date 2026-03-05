// ============================================================
// dokumentStore.js — Non-React store for the Dokument model
// ============================================================
// This store lives OUTSIDE React to avoid re-renders on every
// mouse move / canvas interaction. Components that need to read
// the Dokument (e.g., canvas) access it via useRef.
//
// Uses a simple pub/sub pattern so non-React code (canvas render
// loop) can subscribe to changes, while React components can
// opt-in to re-renders via useSyncExternalStore or manual sub.
// ============================================================

import { Dokument } from '../models/Dokument.js';
import { UndoManager } from '../services/UndoManager.js';

let dokument = new Dokument();
let undoManager = new UndoManager(dokument);
const listeners = new Set();

// --- Public API ---

/** Get the current Dokument instance */
export function getDokument() {
  return dokument;
}

/** Replace the entire Dokument (e.g., after file load) */
export function setDokument(neuesDokument) {
  dokument = neuesDokument;
  undoManager = new UndoManager(dokument);
  emitChange();
}

/** Get the UndoManager */
export function getUndoManager() {
  return undoManager;
}

// --- Snapshot helpers for undo ---

/** Save current state as undo snapshot */
export function snapshotSpeichern() {
  undoManager.snapshot();
  emitChange();
}

/** Undo: restore previous snapshot */
export function rueckgaengig() {
  if (undoManager.undo()) {
    // UndoManager restores into the existing dokument via projektLaden,
    // so no need to replace the dokument reference.
    emitChange();
    return true;
  }
  return false;
}

/** Redo: restore next snapshot */
export function wiederherstellen() {
  if (undoManager.redo()) {
    emitChange();
    return true;
  }
  return false;
}

// --- Subscribe / notify ---

/** Subscribe to changes. Returns unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Notify all listeners that the Dokument changed */
export function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

/** For useSyncExternalStore: returns a snapshot identifier */
export function getSnapshot() {
  return dokument;
}
