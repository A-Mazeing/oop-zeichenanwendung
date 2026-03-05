// ============================================================
// useEditorResize.js — Hook for editor panel drag-to-resize
// ============================================================

import { useRef, useEffect, useCallback } from 'react';

export function useEditorResize(editorRef, { minHeight = 120, maxHeight = 600, defaultHeight = 240 } = {}) {
  const heightRef = useRef(defaultHeight);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = heightRef.current;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const delta = startYRef.current - e.clientY;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeightRef.current + delta));
      heightRef.current = newHeight;
      if (editorRef.current) {
        editorRef.current.style.height = newHeight + 'px';
      }
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [editorRef, minHeight, maxHeight]);

  return { onMouseDown, heightRef };
}
