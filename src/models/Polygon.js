import { Zeichenobjekt } from './Zeichenobjekt.js';

export class Polygon extends Zeichenobjekt {
    constructor(x = 0, y = 0, breite = 100, hoehe = 100, eckenAnzahl = 6) {
        super(x, y, breite, hoehe);
        this.eckenAnzahl = Math.max(3, Math.round(eckenAnzahl));
    }

    zeichnen(ctx) {
        const punkte = this._gibEckpunkte();
        ctx.fillStyle = this.fuellFarbe;
        ctx.strokeStyle = this.linienFarbe;
        ctx.lineWidth = this.linienStaerke;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(punkte[0][0], punkte[0][1]);
        for (let i = 1; i < punkte.length; i++) {
            ctx.lineTo(punkte[i][0], punkte[i][1]);
        }
        ctx.closePath();
        if (this.fuellFarbe !== "transparent") {
            ctx.fill();
        }
        if (this.linienStaerke > 0) {
            ctx.stroke();
        }
    }

    _gibEckpunkte() {
        const cx = this.x + this.breite / 2;
        const cy = this.y + this.hoehe / 2;
        const rx = this.breite / 2;
        const ry = this.hoehe / 2;
        const punkte = [];
        // Startwinkel: -90 Grad (Spitze oben)
        const startWinkel = -Math.PI / 2;
        for (let i = 0; i < this.eckenAnzahl; i++) {
            const winkel = startWinkel + (2 * Math.PI * i) / this.eckenAnzahl;
            punkte.push([
                cx + rx * Math.cos(winkel),
                cy + ry * Math.sin(winkel),
            ]);
        }
        return punkte;
    }

    enthaeltPunkt(px, py) {
        // Ray-Casting-Algorithmus fuer Punkt-in-Polygon-Test
        const punkte = this._gibEckpunkte();
        let innerhalb = false;
        for (let i = 0, j = punkte.length - 1; i < punkte.length; j = i++) {
            const xi = punkte[i][0], yi = punkte[i][1];
            const xj = punkte[j][0], yj = punkte[j][1];
            if ((yi > py) !== (yj > py) &&
                px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
                innerhalb = !innerhalb;
            }
        }
        return innerhalb;
    }

    setzeEckenAnzahl(n) {
        this.eckenAnzahl = Math.max(3, Math.round(n));
    }

    gibAttribute() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            breite: Math.round(this.breite),
            hoehe: Math.round(this.hoehe),
            eckenAnzahl: this.eckenAnzahl,
            fuellFarbe: this.fuellFarbe,
            linienFarbe: this.linienFarbe,
            linienStaerke: this.linienStaerke,
        };
    }

    zuJSON() {
        const basis = super.zuJSON();
        basis.eckenAnzahl = this.eckenAnzahl;
        return basis;
    }

    static gibMethoden() {
        return [
            ...Zeichenobjekt.gibMethoden(),
            "setzeEckenAnzahl(n)",
        ];
    }
}
