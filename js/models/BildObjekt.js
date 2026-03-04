import { Zeichenobjekt } from './Zeichenobjekt.js';
import { getDateiManager } from '../services/DateiManager.js';

export class BildObjekt extends Zeichenobjekt {
    constructor(x = 0, y = 0, breite = 150, hoehe = 150, quelle = "") {
        super(x, y, breite, hoehe);
        this.quelle = quelle;
        this.fuellFarbe = "transparent";
        this.linienFarbe = "#94a3b8";
        this.linienStaerke = 1;
        this._bild = null;
        this._geladen = false;
        // OffscreenCanvas-Cache fuer performantes Rendering
        this._cache = null;
        this._cacheBreite = 0;
        this._cacheHoehe = 0;

        if (quelle) {
            this._ladeBild(quelle);
        }
    }

    _ladeBild(url) {
        // Einfache Dateinamen (z.B. "feuerball.png") ueber DateiManager aufloesen
        const dateiManager = getDateiManager();
        if (dateiManager && url && !url.startsWith("data:") && !url.startsWith("http") && !url.startsWith("blob:")) {
            const aufgeloest = dateiManager.gibDateiUrlSync(url);
            if (aufgeloest) {
                url = aufgeloest;
            }
        }

        this._bild = new Image();
        this._bild.crossOrigin = "anonymous";
        this._bild.onload = () => {
            this._geladen = true;
            // Cache invalidieren
            this._cache = null;
            // Seitenverhaeltnis beibehalten wenn noch Standardgroesse (nicht bei gespeicherten Projekten)
            if (!this._groesseFixiert && this.breite === 150 && this.hoehe === 150) {
                const ratio = this._bild.naturalWidth / this._bild.naturalHeight;
                if (ratio > 1) {
                    this.hoehe = Math.round(this.breite / ratio);
                } else {
                    this.breite = Math.round(this.hoehe * ratio);
                }
            }
            this._groesseFixiert = false;
            // Callback ausloesen (z.B. Canvas neu zeichnen)
            if (typeof this._onBildGeladen === "function") {
                this._onBildGeladen();
            }
        };
        this._bild.onerror = () => {
            this._geladen = false;
        };
        this._bild.src = url;
    }

    zeichnen(ctx) {
        if (this._geladen && this._bild) {
            const b = Math.round(this.breite);
            const h = Math.round(this.hoehe);
            // OffscreenCanvas-Cache: nur neu erzeugen wenn Groesse sich aendert
            if (!this._cache || this._cacheBreite !== b || this._cacheHoehe !== h) {
                try {
                    this._cache = new OffscreenCanvas(b, h);
                    const cCtx = this._cache.getContext("2d");
                    cCtx.drawImage(this._bild, 0, 0, b, h);
                    this._cacheBreite = b;
                    this._cacheHoehe = h;
                } catch (e) {
                    // Fallback falls OffscreenCanvas nicht unterstuetzt
                    this._cache = null;
                }
            }
            if (this._cache) {
                ctx.drawImage(this._cache, this.x, this.y);
            } else {
                ctx.drawImage(this._bild, this.x, this.y, this.breite, this.hoehe);
            }
        } else {
            // Platzhalter zeichnen
            ctx.fillStyle = "#f1f5f9";
            ctx.fillRect(this.x, this.y, this.breite, this.hoehe);
            ctx.strokeStyle = this.linienFarbe;
            ctx.lineWidth = this.linienStaerke;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(this.x, this.y, this.breite, this.hoehe);
            ctx.setLineDash([]);

            // Bild-Icon in der Mitte
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                this.quelle ? "Bild laedt..." : "Kein Bild",
                this.x + this.breite / 2,
                this.y + this.hoehe / 2
            );
            ctx.textAlign = "start";
            ctx.textBaseline = "alphabetic";
        }

        // Rahmen
        if (this.linienStaerke > 0 && this.linienFarbe !== "transparent") {
            ctx.strokeStyle = this.linienFarbe;
            ctx.lineWidth = this.linienStaerke;
            ctx.strokeRect(this.x, this.y, this.breite, this.hoehe);
        }
    }

    setzeQuelle(url) {
        this.quelle = url;
        this._geladen = false;
        this._cache = null; // Cache invalidieren
        this._ladeBild(url);
    }

    gibAttribute() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            breite: Math.round(this.breite),
            hoehe: Math.round(this.hoehe),
            quelle: this.quelle || "(leer)",
        };
    }

    zuJSON() {
        return {
            typ: "BildObjekt",
            name: this._name,
            x: this.x,
            y: this.y,
            breite: this.breite,
            hoehe: this.hoehe,
            quelle: this.quelle,
            linienFarbe: this.linienFarbe,
            linienStaerke: this.linienStaerke,
        };
    }

    static gibMethoden() {
        return [
            "verschieben(dx, dy)",
            "setzePosition(x, y)",
            "setzeGroesse(breite, hoehe)",
            "setzeQuelle(url)",
            "starteAnimation(methode, intervallMs)",
            "stoppeAnimation()",
        ];
    }
}
