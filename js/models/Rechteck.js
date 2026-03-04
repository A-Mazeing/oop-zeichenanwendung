import { Zeichenobjekt } from './Zeichenobjekt.js';

export class Rechteck extends Zeichenobjekt {
    constructor(x = 0, y = 0, breite = 100, hoehe = 80) {
        super(x, y, breite, hoehe);
    }

    zeichnen(ctx) {
        ctx.fillStyle = this.fuellFarbe;
        ctx.strokeStyle = this.linienFarbe;
        ctx.lineWidth = this.linienStaerke;
        if (this.fuellFarbe !== "transparent") {
            ctx.fillRect(this.x, this.y, this.breite, this.hoehe);
        }
        if (this.linienStaerke > 0) {
            ctx.strokeRect(this.x, this.y, this.breite, this.hoehe);
        }
    }

    static gibMethoden() {
        return Zeichenobjekt.gibMethoden();
    }
}
