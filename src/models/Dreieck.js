import { Zeichenobjekt } from './Zeichenobjekt.js';

export class Dreieck extends Zeichenobjekt {
    constructor(x = 0, y = 0, breite = 100, hoehe = 87) {
        super(x, y, breite, hoehe);
    }

    zeichnen(ctx) {
        const punkte = this._gibEckpunkte();
        ctx.fillStyle = this.fuellFarbe;
        ctx.strokeStyle = this.linienFarbe;
        ctx.lineWidth = this.linienStaerke;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(punkte[0][0], punkte[0][1]);
        ctx.lineTo(punkte[1][0], punkte[1][1]);
        ctx.lineTo(punkte[2][0], punkte[2][1]);
        ctx.closePath();
        if (this.fuellFarbe !== "transparent") {
            ctx.fill();
        }
        if (this.linienStaerke > 0) {
            ctx.stroke();
        }
    }

    _gibEckpunkte() {
        return [
            [this.x + this.breite / 2, this.y],            // Spitze oben
            [this.x + this.breite, this.y + this.hoehe],    // Rechts unten
            [this.x, this.y + this.hoehe],                  // Links unten
        ];
    }

    enthaeltPunkt(px, py) {
        const [a, b, c] = this._gibEckpunkte();
        // Baryzentrische Koordinaten
        const flaeche = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
        const s = ((a[1] - c[1]) * (px - c[0]) + (c[0] - a[0]) * (py - c[1])) / flaeche;
        const t = ((a[0] - c[0]) * (py - c[1]) - (a[1] - c[1]) * (px - c[0])) / flaeche;
        // Negatives Vorzeichen korrigieren (fuer den Fall, dass flaeche negativ)
        if (flaeche < 0) {
            return s <= 0 && t <= 0 && s + t >= -1;
        }
        return s >= 0 && t >= 0 && s + t <= 1;
    }

    static gibMethoden() {
        return Zeichenobjekt.gibMethoden();
    }
}
