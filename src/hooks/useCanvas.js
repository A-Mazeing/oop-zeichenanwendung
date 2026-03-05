// ============================================================
// useCanvas.js — Hook for canvas rendering and resize logic
// ============================================================
// Extracted from the original CanvasView. Manages:
// - DPR-aware canvas sizing via ResizeObserver
// - Render loop (grid, objects, preview)
// - Screen-to-world coordinate conversion
// - Zoom/Pan state as refs (no React re-renders)
// ============================================================

import { useRef, useEffect, useCallback } from 'react';
import { getDokument, subscribe } from '../stores/dokumentStore.js';

/**
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef
 * @param {object} options - { rasterAnzeigen, rasterGroesse, zoom, panX, panY }
 */
export function useCanvas(canvasRef, options = {}) {
  const ctxRef = useRef(null);
  const vorschauRef = useRef(null);
  const rafIdRef = useRef(null);
  const resizeRafIdRef = useRef(null);
  const lastSizeRef = useRef({ w: 0, h: 0, dpr: 0 });
  const neuZeichnenRef = useRef(null); // stable ref to latest neuZeichnen

  // Zoom/Pan stored as refs for performance (no re-render on change)
  const zoomRef = useRef(options.zoom ?? 1);
  const panRef = useRef({ x: options.panX ?? 0, y: options.panY ?? 0 });
  const rasterRef = useRef({
    anzeigen: options.rasterAnzeigen ?? true,
    groesse: options.rasterGroesse ?? 20,
  });

  // Update refs when options change (from React state)
  useEffect(() => {
    zoomRef.current = options.zoom ?? 1;
    panRef.current = { x: options.panX ?? 0, y: options.panY ?? 0 };
    rasterRef.current = {
      anzeigen: options.rasterAnzeigen ?? true,
      groesse: options.rasterGroesse ?? 20,
    };
  }, [options.zoom, options.panX, options.panY, options.rasterAnzeigen, options.rasterGroesse]);

  // --- Resize logic ---
  const groesseAnpassen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const breite = parent.clientWidth;
    const hoehe = parent.clientHeight;
    const last = lastSizeRef.current;

    if (breite === last.w && hoehe === last.h && dpr === last.dpr) return;
    lastSizeRef.current = { w: breite, h: hoehe, dpr };

    canvas.width = breite * dpr;
    canvas.height = hoehe * dpr;
    canvas.style.width = breite + 'px';
    canvas.style.height = hoehe + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;

    if (neuZeichnenRef.current) neuZeichnenRef.current();
  }, []);

  const groesseAnpassenDebounced = useCallback(() => {
    if (resizeRafIdRef.current) return;
    resizeRafIdRef.current = requestAnimationFrame(() => {
      resizeRafIdRef.current = null;
      groesseAnpassen();
    });
  }, [groesseAnpassen]);

  // --- Drawing ---
  const zeichneRaster = useCallback((ctx, w, h) => {
    const g = rasterRef.current.groesse;
    const z = zoomRef.current;
    const vx = panRef.current.x;
    const vy = panRef.current.y;

    const weltLinks = -vx / z;
    const weltOben = -vy / z;
    const weltRechts = (w - vx) / z;
    const weltUnten = (h - vy) / z;

    const startX = Math.floor(weltLinks / g) * g;
    const startY = Math.floor(weltOben / g) * g;
    const endeX = Math.ceil(weltRechts / g) * g;
    const endeY = Math.ceil(weltUnten / g) * g;

    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5 / z;

    ctx.beginPath();
    for (let x = startX; x <= endeX; x += g) {
      ctx.moveTo(x, weltOben);
      ctx.lineTo(x, weltUnten);
    }
    for (let y = startY; y <= endeY; y += g) {
      ctx.moveTo(weltLinks, y);
      ctx.lineTo(weltRechts, y);
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  const neuZeichnen = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const dokument = getDokument();

    // Reset transform
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = dokument.hintergrundFarbe;
    ctx.fillRect(0, 0, w, h);

    // Apply zoom + pan
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    // Grid
    if (rasterRef.current.anzeigen) {
      zeichneRaster(ctx, w, h);
    }

    // Draw all objects
    for (const obj of dokument.objekte) {
      ctx.save();
      obj.zeichnen(ctx);
      obj.zeichneAuswahl(ctx);
      ctx.restore();
    }

    // Preview object (while drawing)
    if (vorschauRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      vorschauRef.current.zeichnen(ctx);
      ctx.restore();
    }
  }, [zeichneRaster]);

  // Keep ref in sync so groesseAnpassen always calls latest version
  neuZeichnenRef.current = neuZeichnen;

  /** Lightweight redraw (RAF-debounced, for drag/mousemove) */
  const nurCanvasNeuZeichnen = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      neuZeichnen();
    });
  }, [neuZeichnen]);

  /** Set preview object (semi-transparent, shown while drawing) */
  const setzeVorschau = useCallback((objekt) => {
    vorschauRef.current = objekt;
    nurCanvasNeuZeichnen();
  }, [nurCanvasNeuZeichnen]);

  /** Clear preview */
  const loescheVorschau = useCallback(() => {
    vorschauRef.current = null;
  }, []);

  /** Convert screen coords to world coords */
  const bildschirmZuWelt = useCallback((screenX, screenY) => {
    return {
      x: (screenX - panRef.current.x) / zoomRef.current,
      y: (screenY - panRef.current.y) / zoomRef.current,
    };
  }, []);

  // --- Setup & teardown ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial size
    groesseAnpassen();

    // ResizeObserver on parent container
    const parent = canvas.parentElement;
    const resizeObserver = new ResizeObserver(() => groesseAnpassenDebounced());
    if (parent) resizeObserver.observe(parent);

    // Window resize fallback (DPI changes)
    const onResize = () => groesseAnpassenDebounced();
    window.addEventListener('resize', onResize);

    // Subscribe to Dokument changes
    const unsubscribe = subscribe(() => neuZeichnen());

    // Also register as Dokument observer (for internal model notifications)
    const dokument = getDokument();
    const observer = () => neuZeichnen();
    dokument.beobachterHinzufuegen(observer);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      unsubscribe();
      dokument.beobachterEntfernen(observer);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (resizeRafIdRef.current) cancelAnimationFrame(resizeRafIdRef.current);
    };
  }, [groesseAnpassen, groesseAnpassenDebounced, neuZeichnen]);

  return {
    neuZeichnen,
    nurCanvasNeuZeichnen,
    setzeVorschau,
    loescheVorschau,
    bildschirmZuWelt,
    zoomRef,
    panRef,
  };
}
