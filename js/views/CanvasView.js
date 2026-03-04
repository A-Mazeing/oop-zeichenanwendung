export class CanvasView {
    constructor(canvasElement, dokument) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext("2d");
        this.dokument = dokument;
        this._vorschauObjekt = null;
        this._resizeRafId = null;
        this._letzteBreite = 0;
        this._letzteHoehe = 0;
        this._letzteDpr = 0;

        // Canvas-Groesse an Container anpassen
        this._groesseAnpassen();

        // ResizeObserver: reagiert auf ALLE Layout-Aenderungen des Containers
        // (Editor ein-/ausklappen, Editor-Resize, Fenster-Resize, etc.)
        this._resizeObserver = new ResizeObserver(() => this._groesseAnpassenDebounced());
        this._resizeObserver.observe(this.canvas.parentElement);

        // Fallback: window resize fuer DPI-Aenderungen (Strg+Scrollwheel)
        window.addEventListener("resize", () => this._groesseAnpassenDebounced());

        // Als Beobachter registrieren
        this.dokument.beobachterHinzufuegen(() => this.neuZeichnen());
    }

    // Debounced Resize: buendelt mehrere Resize-Events pro Frame
    _groesseAnpassenDebounced() {
        if (this._resizeRafId) return;
        this._resizeRafId = requestAnimationFrame(() => {
            this._resizeRafId = null;
            this._groesseAnpassen();
        });
    }

    _groesseAnpassen() {
        const parent = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const breite = parent.clientWidth;
        const hoehe = parent.clientHeight;

        // Nur neu allokieren wenn sich die Groesse oder DPI tatsaechlich geaendert hat
        if (breite === this._letzteBreite && hoehe === this._letzteHoehe && dpr === this._letzteDpr) return;
        this._letzteBreite = breite;
        this._letzteHoehe = hoehe;
        this._letzteDpr = dpr;

        this.canvas.width = breite * dpr;
        this.canvas.height = hoehe * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = breite + "px";
        this.canvas.style.height = hoehe + "px";
        this.neuZeichnen();
    }

    neuZeichnen() {
        const ctx = this.ctx;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        // Hintergrund
        ctx.fillStyle = this.dokument.hintergrundFarbe;
        ctx.fillRect(0, 0, w, h);

        // Alle Objekte zeichnen
        for (const obj of this.dokument.objekte) {
            ctx.save();
            obj.zeichnen(ctx);
            obj.zeichneAuswahl(ctx);
            ctx.restore();
        }

        // Vorschau-Objekt (waehrend des Zeichnens)
        if (this._vorschauObjekt) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            this._vorschauObjekt.zeichnen(ctx);
            ctx.restore();
        }
    }

    // Leichtgewichtiger Redraw nur fuer Canvas (ohne Observer-Kette)
    // Wird beim Drag verwendet, um den Inspector-Rebuild zu umgehen
    _rafNeuZeichnenId = null;
    nurCanvasNeuZeichnen() {
        if (this._rafNeuZeichnenId) return;
        this._rafNeuZeichnenId = requestAnimationFrame(() => {
            this._rafNeuZeichnenId = null;
            this.neuZeichnen();
        });
    }

    setzeVorschau(objekt) {
        this._vorschauObjekt = objekt;
        this.nurCanvasNeuZeichnen();
    }

    loescheVorschau() {
        this._vorschauObjekt = null;
    }
}
