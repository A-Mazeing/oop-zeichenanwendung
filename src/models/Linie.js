import { Zeichenobjekt } from './Zeichenobjekt.js';

export class Linie extends Zeichenobjekt {
    constructor(x = 0, y = 0, x2 = 100, y2 = 100) {
        super(x, y, 0, 0);
        this.x2 = x2;
        this.y2 = y2;
    }

    zeichnen(ctx) {
        ctx.strokeStyle = this.linienFarbe;
        ctx.lineWidth = this.linienStaerke;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }

    verschieben(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.x2 += dx;
        this.y2 += dy;
    }

    setzePosition(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        this.verschieben(dx, dy);
    }

    enthaeltPunkt(px, py) {
        // Abstand Punkt zu Liniensegment
        const distanz = this._punktLinienAbstand(px, py);
        return distanz <= Math.max(6, this.linienStaerke + 2);
    }

    _punktLinienAbstand(px, py) {
        const dx = this.x2 - this.x;
        const dy = this.y2 - this.y;
        const laengeQuadrat = dx * dx + dy * dy;
        if (laengeQuadrat === 0) return Math.hypot(px - this.x, py - this.y);
        let t = ((px - this.x) * dx + (py - this.y) * dy) / laengeQuadrat;
        t = Math.max(0, Math.min(1, t));
        const naechsterX = this.x + t * dx;
        const naechsterY = this.y + t * dy;
        return Math.hypot(px - naechsterX, py - naechsterY);
    }

    gibBoundingBox() {
        const minX = Math.min(this.x, this.x2);
        const minY = Math.min(this.y, this.y2);
        const maxX = Math.max(this.x, this.x2);
        const maxY = Math.max(this.y, this.y2);
        return { x: minX, y: minY, b: maxX - minX || 4, h: maxY - minY || 4 };
    }

    gibAttribute() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            x2: Math.round(this.x2),
            y2: Math.round(this.y2),
            linienFarbe: this.linienFarbe,
            linienStaerke: this.linienStaerke,
        };
    }

    zuJSON() {
        return {
            typ: "Linie",
            name: this._name,
            x: this.x,
            y: this.y,
            x2: this.x2,
            y2: this.y2,
            linienFarbe: this.linienFarbe,
            linienStaerke: this.linienStaerke,
        };
    }

    static gibMethoden() {
        return [
            "verschieben(dx, dy)",
            "setzePosition(x, y)",
            "setzeLinienFarbe(farbe)",
            "setzeLinienStaerke(staerke)",
            "starteAnimation(methode, intervallMs)",
            "stoppeAnimation()",
        ];
    }
}
