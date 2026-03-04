import { Zeichenobjekt } from './Zeichenobjekt.js';
import { BildObjekt } from './BildObjekt.js';
import { vonJSON } from './shapes.js';

export class Dokument {
    constructor() {
        this.hintergrundFarbe = "#ffffff";
        this.objekte = [];
        this._listener = [];
        this._rafId = null; // fuer requestAnimationFrame-Batching
    }

    // Observer-Pattern: Listener registrieren
    beobachterHinzufuegen(callback) {
        this._listener.push(callback);
    }

    // Event feuern – alle Views werden benachrichtigt
    _benachrichtigen() {
        for (const cb of this._listener) {
            cb();
        }
    }

    hinzufuegen(objekt) {
        // BildObjekte: nach dem Laden des Bildes neu rendern
        if (objekt instanceof BildObjekt) {
            objekt._onBildGeladen = () => this._benachrichtigen();
        }
        this.objekte.push(objekt);
        this._benachrichtigen();
    }

    entfernen(objekt) {
        const idx = this.objekte.indexOf(objekt);
        if (idx !== -1) {
            this.objekte.splice(idx, 1);
            this._benachrichtigen();
        }
    }

    hintergrundfarbeSetzen(farbe) {
        this.hintergrundFarbe = Zeichenobjekt.farbeAufloesen(farbe);
        this._benachrichtigen();
    }

    alleObjekte() {
        return [...this.objekte];
    }

    // Findet das oberste Objekt an einer Position (letztes = oberstes)
    objektAnPosition(x, y) {
        for (let i = this.objekte.length - 1; i >= 0; i--) {
            if (this.objekte[i].enthaeltPunkt(x, y)) {
                return this.objekte[i];
            }
        }
        return null;
    }

    alleAbwaehlen() {
        for (const obj of this.objekte) {
            obj.ausgewaehlt = false;
        }
    }

    // rAF-gebatchte Benachrichtigung (fuer haeufige Updates wie Drag)
    aktualisieren() {
        if (this._rafId) return; // Update bereits geplant
        this._rafId = requestAnimationFrame(() => {
            this._rafId = null;
            this._benachrichtigen();
        });
    }

    // Sofortige Benachrichtigung (fuer initiales Rendering, Projekt laden etc.)
    sofortAktualisieren() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._benachrichtigen();
    }

    gibAttribute() {
        return {
            hintergrundFarbe: this.hintergrundFarbe,
            anzahlObjekte: this.objekte.length,
        };
    }

    // Gesamtes Dokument als JSON-Objekt serialisieren
    projektSpeichern() {
        return {
            version: 1,
            hintergrundFarbe: this.hintergrundFarbe,
            objekte: this.objekte.map(obj => obj.zuJSON()),
        };
    }

    // Dokument aus JSON-Daten wiederherstellen
    projektLaden(daten) {
        if (!daten || !daten.objekte) {
            throw new Error("Ungueltiges Projektformat.");
        }
        this.hintergrundFarbe = daten.hintergrundFarbe || "#ffffff";
        this.objekte = [];
        for (const objDaten of daten.objekte) {
            const obj = vonJSON(objDaten);
            // BildObjekte: Callback setzen, dann Bild laden
            if (obj instanceof BildObjekt) {
                obj._onBildGeladen = () => this._benachrichtigen();
                // Gespeicherte Quelle jetzt laden (nach Callback-Registrierung)
                if (obj._gespeicherteQuelle) {
                    obj.quelle = obj._gespeicherteQuelle;
                    obj._ladeBild(obj._gespeicherteQuelle);
                    delete obj._gespeicherteQuelle;
                }
            }
            this.objekte.push(obj);
        }
        this._benachrichtigen();
    }

    static gibMethoden() {
        return [
            "hintergrundfarbeSetzen(farbe)",
            "hinzufuegen(objekt)",
            "entfernen(objekt)",
        ];
    }
}
