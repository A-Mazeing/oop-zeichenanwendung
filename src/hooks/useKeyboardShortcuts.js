// ============================================================
// useKeyboardShortcuts.js — Global keyboard shortcut handler
// ============================================================

import { useEffect } from 'react';
import { getDokument, snapshotSpeichern, rueckgaengig, wiederherstellen, emitChange } from '../stores/dokumentStore';
import { vonJSON } from '../models/shapes.js';

export function useKeyboardShortcuts(dispatch, objektZaehlerRef) {
  useEffect(() => {
    const handler = (e) => {
      // Skip if focus is in a text input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const werkzeugMap = {
        v: 'auswahl', r: 'rechteck', e: 'ellipse',
        l: 'linie', d: 'dreieck', p: 'polygon', t: 'text', b: 'bild',
      };

      const key = e.key.toLowerCase();

      // Tool shortcuts
      if (!e.ctrlKey && !e.altKey && werkzeugMap[key]) {
        dispatch({ type: 'SET_WERKZEUG', payload: werkzeugMap[key] });
        return;
      }

      // Grid toggle: G
      if (key === 'g' && !e.ctrlKey && !e.altKey) {
        dispatch({ type: 'TOGGLE_RASTER' });
        return;
      }

      // Delete selected objects
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const dokument = getDokument();
        const ausgewaehlte = dokument.objekte.filter(o => o.ausgewaehlt);
        for (const obj of ausgewaehlte) {
          if (typeof obj.stoppeAnimation === 'function') obj.stoppeAnimation();
          dokument.entfernen(obj);
        }
        if (ausgewaehlte.length > 0) {
          snapshotSpeichern();
          dispatch({ type: 'SET_AUSWAHL', payload: null });
        }
        return;
      }

      // Ctrl+D: Duplicate
      if (e.ctrlKey && key === 'd') {
        e.preventDefault();
        const dokument = getDokument();
        const ausgewaehlte = dokument.objekte.filter(o => o.ausgewaehlt);
        if (ausgewaehlte.length === 0) return;

        dokument.alleAbwaehlen();
        const zaehler = objektZaehlerRef?.current || {};

        for (const obj of ausgewaehlte) {
          const json = obj.zuJSON();
          json.x += 20;
          json.y += 20;
          if (json.x2 !== undefined) json.x2 += 20;
          if (json.y2 !== undefined) json.y2 += 20;

          const duplikat = vonJSON(json);
          const typ = duplikat.gibTypName();
          zaehler[typ] = (zaehler[typ] || 0) + 1;
          const prefix = typ.charAt(0).toLowerCase();
          duplikat._name = `${prefix}${zaehler[typ]}`;
          duplikat.ausgewaehlt = true;
          dokument.hinzufuegen(duplikat);
        }
        snapshotSpeichern();
        return;
      }

      // Ctrl+Z: Undo
      if (e.ctrlKey && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        rueckgaengig();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if (e.ctrlKey && (key === 'y' || (e.shiftKey && key === 'z'))) {
        e.preventDefault();
        wiederherstellen();
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch, objektZaehlerRef]);
}
