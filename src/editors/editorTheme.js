// ============================================================
// editorTheme.js — Dunkles CodeMirror-Theme passend zu bg-slate-900
// ============================================================

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Editor-Grundstil (Hintergrund, Text, Cursor, Auswahl, Gutters)
const editorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      fontSize: '14px',
      height: '100%',
    },
    '.cm-content': {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      caretColor: '#93c5fd',
      lineHeight: '1.6',
      padding: '8px 0',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#93c5fd',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#334155',
    },
    '.cm-activeLine': {
      backgroundColor: '#1e293b80',
    },
    '.cm-gutters': {
      backgroundColor: '#0f172a',
      color: '#475569',
      border: 'none',
      paddingRight: '8px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#1e293b80',
      color: '#94a3b8',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 4px',
      minWidth: '2em',
    },
    '.cm-tooltip': {
      backgroundColor: '#1e293b',
      color: '#e2e8f0',
      border: '1px solid #334155',
      borderRadius: '6px',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul': {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: '13px',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      backgroundColor: '#334155',
      color: '#f1f5f9',
    },
    '.cm-tooltip-autocomplete ul li': {
      padding: '2px 8px',
    },
    '.cm-completionIcon': {
      paddingRight: '4px',
      opacity: '0.7',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
    // Scrollbar-Styling
    '.cm-scroller::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '.cm-scroller::-webkit-scrollbar-track': {
      backgroundColor: '#0f172a',
    },
    '.cm-scroller::-webkit-scrollbar-thumb': {
      backgroundColor: '#334155',
      borderRadius: '4px',
    },
  },
  { dark: true }
);

// Syntax-Hervorhebung (Farben fuer Keywords, Strings, etc.)
const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#93c5fd', fontWeight: 'bold' },
  { tag: tags.typeName, color: '#c4b5fd' },
  { tag: tags.variableName, color: '#f1f5f9' },
  { tag: tags.propertyName, color: '#7dd3fc' },
  { tag: tags.function(tags.variableName), color: '#7dd3fc' },
  { tag: tags.string, color: '#86efac' },
  { tag: tags.number, color: '#fbbf24' },
  { tag: tags.bool, color: '#fbbf24' },
  { tag: tags.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: tags.operator, color: '#94a3b8' },
  { tag: tags.punctuation, color: '#94a3b8' },
  { tag: tags.bracket, color: '#94a3b8' },
  { tag: tags.definition(tags.variableName), color: '#67e8f9' },
  { tag: tags.className, color: '#c4b5fd', fontWeight: 'bold' },
]);

// Kombiniertes Theme (Basis + Syntax-Farben)
export const dunklesTheme = [editorTheme, syntaxHighlighting(highlightStyle)];
