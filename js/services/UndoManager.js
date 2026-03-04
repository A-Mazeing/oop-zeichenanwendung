/**
 * UndoManager – Snapshot-basiertes Undo/Redo fuer das Dokument.
 *
 * Speichert den vollstaendigen Dokumentzustand (via projektSpeichern/projektLaden)
 * auf einem Undo-Stack. Maximal `maxSchritte` Snapshots werden gehalten.
 *
 * Nutzung:
 *   undoManager.snapshot()   – aktuellen Zustand merken (nach jeder Aenderung)
 *   undoManager.undo()       – letzten Zustand wiederherstellen
 *   undoManager.redo()       – wiederhergestellten Zustand erneut anwenden
 */
export class UndoManager {
    constructor(dokument, maxSchritte = 50) {
        this.dokument = dokument;
        this.maxSchritte = maxSchritte;
        this._undoStack = [];
        this._redoStack = [];
        this._gesperrt = false; // verhindert Snapshots waehrend undo/redo

        // Initialen Zustand sichern
        this._undoStack.push(this._erstelleSnapshot());
    }

    // Aktuellen Dokumentzustand als Snapshot speichern
    snapshot() {
        if (this._gesperrt) return;
        const snap = this._erstelleSnapshot();

        // Duplikate vermeiden: wenn identisch zum letzten Snapshot, ueberspringen
        if (this._undoStack.length > 0) {
            const letzter = this._undoStack[this._undoStack.length - 1];
            if (letzter === snap) return;
        }

        this._undoStack.push(snap);
        // Redo-Stack leeren, da ein neuer Zweig begonnen wird
        this._redoStack = [];

        // Stack-Groesse begrenzen
        if (this._undoStack.length > this.maxSchritte) {
            this._undoStack.shift();
        }
    }

    undo() {
        if (this._undoStack.length <= 1) return false; // nichts zum Rueckgaengig-Machen

        // Aktuellen Zustand auf Redo-Stack schieben
        const aktuell = this._undoStack.pop();
        this._redoStack.push(aktuell);

        // Vorherigen Zustand wiederherstellen
        const vorheriger = this._undoStack[this._undoStack.length - 1];
        this._stelleWiederHer(vorheriger);
        return true;
    }

    redo() {
        if (this._redoStack.length === 0) return false;

        const naechster = this._redoStack.pop();
        this._undoStack.push(naechster);
        this._stelleWiederHer(naechster);
        return true;
    }

    kannUndo() {
        return this._undoStack.length > 1;
    }

    kannRedo() {
        return this._redoStack.length > 0;
    }

    // --- Interne Helfer ---

    _erstelleSnapshot() {
        return JSON.stringify(this.dokument.projektSpeichern());
    }

    _stelleWiederHer(snapshotStr) {
        this._gesperrt = true;
        try {
            const daten = JSON.parse(snapshotStr);
            this.dokument.projektLaden(daten);
        } finally {
            this._gesperrt = false;
        }
    }

    // Stack zuruecksetzen (z.B. nach Projekt-Laden)
    zuruecksetzen() {
        this._undoStack = [this._erstelleSnapshot()];
        this._redoStack = [];
    }
}
