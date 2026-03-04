import { Zeichenobjekt } from './Zeichenobjekt.js';

export class TextObjekt extends Zeichenobjekt {
    constructor(x = 0, y = 0, inhalt = "Text") {
        super(x, y, 0, 0);
        this.inhalt = inhalt;
        this.schriftGroesse = 20;
        this.fuellFarbe = "#1e293b";
        this.linienFarbe = "transparent";
        this.linienStaerke = 0;
    }

    zeichnen(ctx) {
        ctx.font = `${this.schriftGroesse}px sans-serif`;
        ctx.fillStyle = this.fuellFarbe;
        ctx.textBaseline = "top";

        // Breite/Hoehe aus Text berechnen
        const metrics = ctx.measureText(this.inhalt);
        this.breite = metrics.width;
        this.hoehe = this.schriftGroesse * 1.2;

        ctx.fillText(this.inhalt, this.x, this.y);

        if (this.linienFarbe !== "transparent" && this.linienStaerke > 0) {
            ctx.strokeStyle = this.linienFarbe;
            ctx.lineWidth = this.linienStaerke;
            ctx.strokeText(this.inhalt, this.x, this.y);
        }
    }

    setzeInhalt(text) {
        this.inhalt = text;
    }

    setzeSchriftGroesse(groesse) {
        this.schriftGroesse = Math.max(6, groesse);
    }

    gibAttribute() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            inhalt: this.inhalt,
            schriftGroesse: this.schriftGroesse,
            fuellFarbe: this.fuellFarbe,
        };
    }

    zuJSON() {
        return {
            typ: "TextObjekt",
            name: this._name,
            x: this.x,
            y: this.y,
            inhalt: this.inhalt,
            schriftGroesse: this.schriftGroesse,
            fuellFarbe: this.fuellFarbe,
            linienFarbe: this.linienFarbe,
            linienStaerke: this.linienStaerke,
        };
    }

    static gibMethoden() {
        return [
            "verschieben(dx, dy)",
            "setzePosition(x, y)",
            "setzeFarbe(farbe)",
            "setzeInhalt(text)",
            "setzeSchriftGroesse(groesse)",
            "starteAnimation(methode, intervallMs)",
            "stoppeAnimation()",
        ];
    }
}
