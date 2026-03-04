import { Zeichenobjekt } from './Zeichenobjekt.js';

export class Ellipse extends Zeichenobjekt {
    constructor(x = 0, y = 0, breite = 100, hoehe = 80) {
        super(x, y, breite, hoehe);
    }

    zeichnen(ctx) {
        ctx.fillStyle = this.fuellFarbe;
        ctx.strokeStyle = this.linienFarbe;
        ctx.lineWidth = this.linienStaerke;
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.breite / 2,
            this.y + this.hoehe / 2,
            Math.abs(this.breite / 2),
            Math.abs(this.hoehe / 2),
            0, 0, Math.PI * 2
        );
        if (this.fuellFarbe !== "transparent") {
            ctx.fill();
        }
        if (this.linienStaerke > 0) {
            ctx.stroke();
        }
    }

    enthaeltPunkt(px, py) {
        // Ellipsen-Hit-Test
        const cx = this.x + this.breite / 2;
        const cy = this.y + this.hoehe / 2;
        const rx = Math.abs(this.breite / 2);
        const ry = Math.abs(this.hoehe / 2);
        if (rx === 0 || ry === 0) return false;
        return ((px - cx) ** 2 / rx ** 2) + ((py - cy) ** 2 / ry ** 2) <= 1;
    }

    static gibMethoden() {
        return Zeichenobjekt.gibMethoden();
    }
}
