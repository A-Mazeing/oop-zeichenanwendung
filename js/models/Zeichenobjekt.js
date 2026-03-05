// ============================================================
// Abstrakte Basisklasse: Zeichenobjekt
// ============================================================

export class Zeichenobjekt {
    constructor(x = 0, y = 0, breite = 50, hoehe = 50) {
        if (new.target === Zeichenobjekt) {
            throw new Error("Zeichenobjekt ist abstrakt und kann nicht direkt instanziiert werden.");
        }
        this.x = x;
        this.y = y;
        this.breite = breite;
        this.hoehe = hoehe;
        this.fuellFarbe = "#3b82f6";
        this.linienFarbe = "#1e293b";
        this.linienStaerke = 2;
        this.ausgewaehlt = false;
        this.gesperrt = false; // Sperre: Objekt kann nicht verschoben/veraendert werden
        this._name = "";       // Variablenname im Code-Editor
    }

    // Abstrakte Methode – muss von Subklassen ueberschrieben werden
    zeichnen(ctx) {
        throw new Error("zeichnen() muss von der Subklasse implementiert werden.");
    }

    // Gemeinsame Methoden
    verschieben(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    setzePosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setzeGroesse(breite, hoehe) {
        this.breite = Math.max(1, breite);
        this.hoehe = Math.max(1, hoehe);
    }

    setzeFarbe(farbe) {
        this.fuellFarbe = Zeichenobjekt.farbeAufloesen(farbe);
    }

    setzeLinienFarbe(farbe) {
        this.linienFarbe = Zeichenobjekt.farbeAufloesen(farbe);
    }

    setzeLinienStaerke(staerke) {
        this.linienStaerke = Math.max(0, staerke);
    }

    // Hit-Testing: Liegt ein Punkt innerhalb dieses Objekts?
    enthaeltPunkt(px, py) {
        return px >= this.x && px <= this.x + this.breite &&
               py >= this.y && py <= this.y + this.hoehe;
    }

    // Bounding-Box (fuer Auswahl-Handles)
    gibBoundingBox() {
        return { x: this.x, y: this.y, b: this.breite, h: this.hoehe };
    }

    // Zeichnet Auswahl-Handles wenn selektiert
    zeichneAuswahl(ctx) {
        if (!this.ausgewaehlt) return;
        const bb = this.gibBoundingBox();
        const s = 6; // Handle-Groesse
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(bb.x - 2, bb.y - 2, bb.b + 4, bb.h + 4);
        ctx.setLineDash([]);

        // Handles an den 4 Ecken
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.5;
        const ecken = [
            [bb.x, bb.y],
            [bb.x + bb.b, bb.y],
            [bb.x, bb.y + bb.h],
            [bb.x + bb.b, bb.y + bb.h]
        ];
        for (const [ex, ey] of ecken) {
            ctx.fillRect(ex - s / 2, ey - s / 2, s, s);
            ctx.strokeRect(ex - s / 2, ey - s / 2, s, s);
        }
    }

    // Typ-Name fuer Anzeige
    gibTypName() {
        return this.constructor.name;
    }

    // Attribute als Object (fuer Inspektor)
    gibAttribute() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            breite: Math.round(this.breite),
            hoehe: Math.round(this.hoehe),
            fuellFarbe: this.fuellFarbe,
            linienFarbe: this.linienFarbe,
            linienStaerke: this.linienStaerke,
        };
    }

    // Sperre umschalten
    sperreUmschalten() {
        this.gesperrt = !this.gesperrt;
    }

    // Serialisierung: Objekt als einfaches JSON-Objekt zurueckgeben
    zuJSON() {
        return {
            typ: this.gibTypName(),
            name: this._name,
            x: this.x,
            y: this.y,
            breite: this.breite,
            hoehe: this.hoehe,
            fuellFarbe: this.fuellFarbe,
            linienFarbe: this.linienFarbe,
            linienStaerke: this.linienStaerke,
            gesperrt: this.gesperrt,
        };
    }

    // Hilfs-Methode: Farbnamen in Hex-Werte umwandeln
    static farbeAufloesen(farbe) {
        const farbMap = {
            rot: "#ef4444", red: "#ef4444",
            gruen: "#22c55e", green: "#22c55e",
            blau: "#3b82f6", blue: "#3b82f6",
            gelb: "#eab308", yellow: "#eab308",
            orange: "#f97316",
            lila: "#a855f7", purple: "#a855f7",
            rosa: "#ec4899", pink: "#ec4899",
            schwarz: "#000000", black: "#000000",
            weiss: "#ffffff", white: "#ffffff",
            grau: "#6b7280", gray: "#6b7280",
            braun: "#92400e", brown: "#92400e",
            cyan: "#06b6d4",
            hellblau: "#7dd3fc", lightblue: "#7dd3fc",
            hellgruen: "#86efac", lightgreen: "#86efac",
            hellgelb: "#fef08a",
            dunkelblau: "#1e3a5f",
            dunkelgruen: "#166534",
            transparent: "transparent",
        };
        const key = farbe.toLowerCase().replace(/['"]/g, "").trim();
        return farbMap[key] || farbe;
    }

    // Statische Methoden-Liste (fuer Klassenansicht im Inspektor)
    static gibMethoden() {
        return [
            "verschieben(dx, dy)",
            "setzePosition(x, y)",
            "setzeGroesse(breite, hoehe)",
            "setzeFarbe(farbe)",
            "setzeLinienFarbe(farbe)",
            "setzeLinienStaerke(staerke)",
            "starteAnimation(methode, intervallMs)",
            "stoppeAnimation()",
        ];
    }
}
