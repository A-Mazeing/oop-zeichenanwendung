// ============================================================
// ZeichenCanvas.jsx — Main canvas React component
// ============================================================
// Combines the rendering logic (useCanvas hook) with mouse/wheel
// interaction (extracted from the old Controller class).
//
// Performance: All mouse state lives in refs. No React state is
// set during mousemove — only the canvas is redrawn directly.
// ============================================================

import { useRef, useEffect, useCallback } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import { useAppState, useAppDispatch } from '../../stores/useAppStore';
import {
  getDokument,
  snapshotSpeichern,
  emitChange,
} from '../../stores/dokumentStore';
import { Rechteck } from '../../models/Rechteck.js';
import { Ellipse } from '../../models/Ellipse.js';
import { Linie } from '../../models/Linie.js';
import { Dreieck } from '../../models/Dreieck.js';
import { Polygon } from '../../models/Polygon.js';

function ZeichenCanvas() {
  const canvasRef = useRef(null);
  const state = useAppState();
  const dispatch = useAppDispatch();

  const {
    neuZeichnen,
    nurCanvasNeuZeichnen,
    setzeVorschau,
    loescheVorschau,
    bildschirmZuWelt,
    zoomRef,
    panRef,
  } = useCanvas(canvasRef, {
    rasterAnzeigen: state.rasterAnzeigen,
    rasterGroesse: state.rasterGroesse,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
  });

  // --- Mouse state refs (never trigger re-renders) ---
  const istGedrucktRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const aktuellesObjektRef = useRef(null);
  const verschiebeOffsetRef = useRef({ x: 0, y: 0 });
  const canvasRectRef = useRef(null);
  const objektZaehlerRef = useRef({
    Rechteck: 0, Ellipse: 0, Linie: 0, Dreieck: 0,
    Polygon: 0, TextObjekt: 0, BildObjekt: 0,
  });

  // Pan state
  const istPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panStartVerschiebungRef = useRef({ x: 0, y: 0 });

  // Resize state
  const istAmSkalierenRef = useRef(false);
  const skalierEckeRef = useRef(null);
  const skalierObjektRef = useRef(null);
  const skalierStartBBRef = useRef(null);

  // Read tool from React state (via ref so event handlers see latest)
  const werkzeugRef = useRef(state.aktivesWerkzeug);
  const fuellFarbeRef = useRef(state.fuellFarbe);
  const linienFarbeRef = useRef(state.linienFarbe);

  useEffect(() => { werkzeugRef.current = state.aktivesWerkzeug; }, [state.aktivesWerkzeug]);
  useEffect(() => { fuellFarbeRef.current = state.fuellFarbe; }, [state.fuellFarbe]);
  useEffect(() => { linienFarbeRef.current = state.linienFarbe; }, [state.linienFarbe]);

  // --- Helpers ---
  const mausPosition = useCallback((e) => {
    const rect = canvasRectRef.current || canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return bildschirmZuWelt(screenX, screenY);
  }, [bildschirmZuWelt]);

  const mausPositionBildschirm = useCallback((e) => {
    const rect = canvasRectRef.current || canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const erstelleObjekt = useCallback((x, y, breite, hoehe) => {
    let obj;
    switch (werkzeugRef.current) {
      case 'rechteck':
        obj = new Rechteck(x, y, breite, hoehe);
        break;
      case 'ellipse':
        obj = new Ellipse(x, y, breite, hoehe);
        break;
      case 'linie':
        obj = new Linie(x, y, x + breite, y + hoehe);
        break;
      case 'dreieck':
        obj = new Dreieck(x, y, breite, hoehe);
        break;
      case 'polygon':
        obj = new Polygon(x, y, breite, hoehe, 6);
        break;
      default:
        return null;
    }
    obj.fuellFarbe = fuellFarbeRef.current;
    obj.linienFarbe = linienFarbeRef.current;
    return obj;
  }, []);

  const findeHandle = useCallback((px, py) => {
    const dokument = getDokument();
    const handleGroesse = 8 / zoomRef.current;
    for (let i = dokument.objekte.length - 1; i >= 0; i--) {
      const obj = dokument.objekte[i];
      if (!obj.ausgewaehlt) continue;
      const bb = obj.gibBoundingBox();
      const ecken = [
        { ecke: 'tl', x: bb.x, y: bb.y },
        { ecke: 'tr', x: bb.x + bb.b, y: bb.y },
        { ecke: 'bl', x: bb.x, y: bb.y + bb.h },
        { ecke: 'br', x: bb.x + bb.b, y: bb.y + bb.h },
      ];
      for (const e of ecken) {
        if (Math.abs(px - e.x) <= handleGroesse && Math.abs(py - e.y) <= handleGroesse) {
          return { ecke: e.ecke, objekt: obj };
        }
      }
    }
    return null;
  }, [zoomRef]);

  const skaliere = useCallback((px, py) => {
    const obj = skalierObjektRef.current;
    const bb = skalierStartBBRef.current;
    const ecke = skalierEckeRef.current;
    if (!obj || !bb) return;

    const minGroesse = 10;

    if (obj.gibTypName() === 'Linie') {
      if (ecke === 'tl') { obj.x = px; obj.y = py; }
      else if (ecke === 'br') { obj.x2 = px; obj.y2 = py; }
      else if (ecke === 'tr') { obj.x2 = px; obj.y = py; }
      else if (ecke === 'bl') { obj.x = px; obj.y2 = py; }
      return;
    }

    let neuesX = obj.x, neuesY = obj.y, neueBreite = obj.breite, neueHoehe = obj.hoehe;

    if (ecke === 'br') {
      neueBreite = Math.max(minGroesse, px - bb.x);
      neueHoehe = Math.max(minGroesse, py - bb.y);
    } else if (ecke === 'bl') {
      neueBreite = Math.max(minGroesse, (bb.x + bb.b) - px);
      neueHoehe = Math.max(minGroesse, py - bb.y);
      neuesX = Math.min(px, bb.x + bb.b - minGroesse);
    } else if (ecke === 'tr') {
      neueBreite = Math.max(minGroesse, px - bb.x);
      neueHoehe = Math.max(minGroesse, (bb.y + bb.h) - py);
      neuesY = Math.min(py, bb.y + bb.h - minGroesse);
    } else if (ecke === 'tl') {
      neueBreite = Math.max(minGroesse, (bb.x + bb.b) - px);
      neueHoehe = Math.max(minGroesse, (bb.y + bb.h) - py);
      neuesX = Math.min(px, bb.x + bb.b - minGroesse);
      neuesY = Math.min(py, bb.y + bb.h - minGroesse);
    }

    obj.x = neuesX;
    obj.y = neuesY;
    obj.breite = neueBreite;
    obj.hoehe = neueHoehe;
  }, []);

  // --- Mouse event handlers ---
  const onMouseDown = useCallback((e) => {
    canvasRectRef.current = canvasRef.current.getBoundingClientRect();
    const dokument = getDokument();

    // Middle button: pan
    if (e.button === 1) {
      e.preventDefault();
      istPanningRef.current = true;
      const screenPos = mausPositionBildschirm(e);
      panStartRef.current = { x: screenPos.x, y: screenPos.y };
      panStartVerschiebungRef.current = { x: panRef.current.x, y: panRef.current.y };
      canvasRef.current.style.cursor = 'grabbing';
      return;
    }

    if (e.button !== 0) return;

    const pos = mausPosition(e);
    istGedrucktRef.current = true;
    startRef.current = { x: pos.x, y: pos.y };

    if (werkzeugRef.current === 'auswahl') {
      // Check resize handles first
      const handle = findeHandle(pos.x, pos.y);
      if (handle && !handle.objekt.gesperrt) {
        istAmSkalierenRef.current = true;
        skalierEckeRef.current = handle.ecke;
        skalierObjektRef.current = handle.objekt;
        const bb = handle.objekt.gibBoundingBox();
        skalierStartBBRef.current = { x: bb.x, y: bb.y, b: bb.b, h: bb.h };
        return;
      }

      // Find object under cursor
      const obj = dokument.objektAnPosition(pos.x, pos.y);
      dokument.alleAbwaehlen();
      if (obj) {
        obj.ausgewaehlt = true;
        // Allow selection but block dragging for locked objects
        aktuellesObjektRef.current = obj.gesperrt ? null : obj;
        verschiebeOffsetRef.current = { x: pos.x - obj.x, y: pos.y - obj.y };
        neuZeichnen();
        // Update React selection state
        const idx = dokument.objekte.indexOf(obj);
        dispatch({ type: 'SET_AUSWAHL', payload: idx });
      } else {
        aktuellesObjektRef.current = null;
        dispatch({ type: 'SET_AUSWAHL', payload: null });
      }
      emitChange();
    }
  }, [mausPosition, mausPositionBildschirm, findeHandle, neuZeichnen, dispatch, panRef]);

  const onMouseMove = useCallback((e) => {
    // Pan
    if (istPanningRef.current) {
      const screenPos = mausPositionBildschirm(e);
      const newX = panStartVerschiebungRef.current.x + (screenPos.x - panStartRef.current.x);
      const newY = panStartVerschiebungRef.current.y + (screenPos.y - panStartRef.current.y);
      panRef.current = { x: newX, y: newY };
      dispatch({ type: 'SET_PAN', payload: { x: newX, y: newY } });
      nurCanvasNeuZeichnen();
      return;
    }

    // Resize
    if (istAmSkalierenRef.current) {
      const pos = mausPosition(e);
      skaliere(pos.x, pos.y);
      nurCanvasNeuZeichnen();
      return;
    }

    if (!istGedrucktRef.current) return;
    const pos = mausPosition(e);

    if (werkzeugRef.current === 'auswahl') {
      if (aktuellesObjektRef.current) {
        const obj = aktuellesObjektRef.current;
        obj.setzePosition(
          pos.x - verschiebeOffsetRef.current.x,
          pos.y - verschiebeOffsetRef.current.y
        );
        nurCanvasNeuZeichnen();
      }
    } else if (werkzeugRef.current !== 'text' && werkzeugRef.current !== 'bild') {
      const vorschau = erstelleObjekt(
        startRef.current.x, startRef.current.y,
        pos.x - startRef.current.x, pos.y - startRef.current.y
      );
      if (vorschau) setzeVorschau(vorschau);
    }
  }, [mausPosition, mausPositionBildschirm, skaliere, erstelleObjekt, setzeVorschau, nurCanvasNeuZeichnen, dispatch, panRef]);

  const onMouseUp = useCallback((e) => {
    const dokument = getDokument();

    // End pan
    if (istPanningRef.current) {
      istPanningRef.current = false;
      canvasRef.current.style.cursor = '';
      canvasRectRef.current = null;
      return;
    }

    // End resize
    if (istAmSkalierenRef.current) {
      istAmSkalierenRef.current = false;
      skalierEckeRef.current = null;
      skalierObjektRef.current = null;
      skalierStartBBRef.current = null;
      canvasRectRef.current = null;
      snapshotSpeichern();
      return;
    }

    if (!istGedrucktRef.current) return;
    istGedrucktRef.current = false;
    const pos = mausPosition(e);
    canvasRectRef.current = null;
    loescheVorschau();

    if (werkzeugRef.current === 'auswahl') {
      aktuellesObjektRef.current = null;
      snapshotSpeichern();
    } else if (werkzeugRef.current === 'text') {
      dispatch({
        type: 'SHOW_DIALOG',
        payload: { typ: 'text', x: startRef.current.x, y: startRef.current.y },
      });
    } else if (werkzeugRef.current === 'bild') {
      dispatch({
        type: 'SHOW_DIALOG',
        payload: { typ: 'bild', x: startRef.current.x, y: startRef.current.y },
      });
    } else {
      let breite = pos.x - startRef.current.x;
      let hoehe = pos.y - startRef.current.y;

      if (Math.abs(breite) < 5 && Math.abs(hoehe) < 5) {
        breite = 100;
        hoehe = 80;
      }

      const neuesObjekt = erstelleObjekt(startRef.current.x, startRef.current.y, breite, hoehe);
      if (neuesObjekt) {
        // Normalize negative sizes
        if (werkzeugRef.current !== 'linie') {
          if (neuesObjekt.breite < 0) {
            neuesObjekt.x += neuesObjekt.breite;
            neuesObjekt.breite = Math.abs(neuesObjekt.breite);
          }
          if (neuesObjekt.hoehe < 0) {
            neuesObjekt.y += neuesObjekt.hoehe;
            neuesObjekt.hoehe = Math.abs(neuesObjekt.hoehe);
          }
        }

        // Assign name
        const typ = neuesObjekt.gibTypName();
        objektZaehlerRef.current[typ] = (objektZaehlerRef.current[typ] || 0) + 1;
        const prefix = typ.charAt(0).toLowerCase();
        neuesObjekt._name = `${prefix}${objektZaehlerRef.current[typ]}`;

        dokument.hinzufuegen(neuesObjekt);
        snapshotSpeichern();
      }
    }
  }, [mausPosition, erstelleObjekt, loescheVorschau, dispatch]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const zoomSchritt = 0.1;
    const richtung = e.deltaY < 0 ? 1 : -1;
    const alterZoom = zoomRef.current;
    const neuerZoom = Math.min(5, Math.max(0.1, alterZoom * (1 + richtung * zoomSchritt)));

    const faktorAenderung = neuerZoom / alterZoom;
    const newPanX = screenX - (screenX - panRef.current.x) * faktorAenderung;
    const newPanY = screenY - (screenY - panRef.current.y) * faktorAenderung;

    zoomRef.current = neuerZoom;
    panRef.current = { x: newPanX, y: newPanY };

    dispatch({ type: 'SET_ZOOM', payload: neuerZoom });
    dispatch({ type: 'SET_PAN', payload: { x: newPanX, y: newPanY } });

    nurCanvasNeuZeichnen();
  }, [zoomRef, panRef, nurCanvasNeuZeichnen, dispatch]);

  // Attach wheel event (needs { passive: false })
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    // Prevent middle-click scroll
    const preventMiddle = (e) => { if (e.button === 1) e.preventDefault(); };
    canvas.addEventListener('auxclick', preventMiddle);
    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('auxclick', preventMiddle);
    };
  }, [onWheel]);

  // Cursor style based on active tool
  const cursorClass = {
    auswahl: 'cursor-default',
    rechteck: 'cursor-crosshair',
    ellipse: 'cursor-crosshair',
    linie: 'cursor-crosshair',
    dreieck: 'cursor-crosshair',
    polygon: 'cursor-crosshair',
    text: 'cursor-text',
    bild: 'cursor-crosshair',
  }[state.aktivesWerkzeug] || 'cursor-default';

  return (
    <div className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`block w-full h-full ${cursorClass}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}

export default ZeichenCanvas;
