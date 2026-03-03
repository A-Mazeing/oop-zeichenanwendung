// ============================================================
// OOP Zeichenanwendung – app.js
// Architektur: Model-View-Controller (MVC)
// ============================================================

// ============================================================
// 1. MODEL – Datenmodell mit Event-System
// ============================================================

// --- Abstrakte Basisklasse: Zeichenobjekt ---
class Zeichenobjekt {
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
        };
    }

    // Deserialisierung: Aus JSON-Daten ein Zeichenobjekt erstellen
    static vonJSON(daten) {
        const klassenMap = {
            Rechteck, Ellipse, Linie, Dreieck, TextObjekt, BildObjekt
        };
        const Klasse = klassenMap[daten.typ];
        if (!Klasse) throw new Error(`Unbekannter Typ: ${daten.typ}`);

        let obj;
        if (daten.typ === "Linie") {
            obj = new Linie(daten.x, daten.y, daten.x2, daten.y2);
        } else if (daten.typ === "TextObjekt") {
            obj = new TextObjekt(daten.x, daten.y, daten.inhalt);
            obj.schriftGroesse = daten.schriftGroesse || 20;
        } else if (daten.typ === "BildObjekt") {
            // Bild ohne Quelle erstellen (Laden wird von projektLaden gesteuert)
            obj = new BildObjekt(daten.x, daten.y, daten.breite, daten.hoehe, "");
            // Gespeicherte Groesse beibehalten, nicht automatisch anpassen
            obj._groesseFixiert = true;
            // Quelle merken, wird spaeter geladen
            obj._gespeicherteQuelle = daten.quelle || "";
        } else {
            obj = new Klasse(daten.x, daten.y, daten.breite, daten.hoehe);
        }

        obj.fuellFarbe = daten.fuellFarbe || "#3b82f6";
        obj.linienFarbe = daten.linienFarbe || "#1e293b";
        obj.linienStaerke = daten.linienStaerke != null ? daten.linienStaerke : 2;
        obj._name = daten.name || "";
        return obj;
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


// --- Subklasse: Rechteck ---
class Rechteck extends Zeichenobjekt {
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


// --- Subklasse: Ellipse ---
class Ellipse extends Zeichenobjekt {
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


// --- Subklasse: Linie ---
class Linie extends Zeichenobjekt {
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


// --- Subklasse: Dreieck ---
class Dreieck extends Zeichenobjekt {
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


// --- Subklasse: TextObjekt ---
class TextObjekt extends Zeichenobjekt {
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


// --- Subklasse: BildObjekt (mit OffscreenCanvas-Cache + DateiManager-Aufloesung) ---
class BildObjekt extends Zeichenobjekt {
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
        if (_dateiManager && url && !url.startsWith("data:") && !url.startsWith("http") && !url.startsWith("blob:")) {
            const aufgeloest = _dateiManager.gibDateiUrlSync(url);
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


// --- Dokument-Klasse: Verwaltet alle Zeichenobjekte + Events (rAF-Batching) ---
class Dokument {
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
            const obj = Zeichenobjekt.vonJSON(objDaten);
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


// ============================================================
// 2. VIEW – Canvas-Rendering
// ============================================================

class CanvasView {
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


// ============================================================
// 3. VIEW – Inspektor (Klassen- und Objektansicht)
// ============================================================

class InspektorView {
    constructor(klassenDiv, objektDiv, dokument) {
        this.klassenDiv = klassenDiv;
        this.objektDiv = objektDiv;
        this.dokument = dokument;
        this._onObjektKlick = null; // Callback wenn Objekt im Inspektor geklickt wird
        this._onObjektUmbenennen = null; // Callback wenn Objekt umbenannt wird: (index, neuerName) => void
        this._eingeklappteObjekte = new Set(); // Merkt sich eingeklappte Objektkarten (nach Name)
        this._eingeklapptDokument = false; // Merkt sich ob Dokument-Karte eingeklappt
        this._inspektorThrottleTimer = null; // Throttle-Timer fuer Inspector-Updates
        this._inspektorUpdateAnstehend = false; // Ob ein Update wartet

        // Klassenansicht ist statisch – einmal rendern
        this._rendereKlassen();

        // Objektansicht als Beobachter (mit Throttle)
        this.dokument.beobachterHinzufuegen(() => this._rendereObjekteGethrottled());
    }

    // Throttled Inspector-Update: maximal alle 150ms den DOM neu aufbauen
    _rendereObjekteGethrottled() {
        if (this._inspektorThrottleTimer) {
            // Timer laeuft bereits – merken, dass ein Update ansteht
            this._inspektorUpdateAnstehend = true;
            return;
        }
        // Sofort ausfuehren
        this._rendereObjekte();
        // Timer starten – waehrenddessen werden Updates gesammelt
        this._inspektorThrottleTimer = setTimeout(() => {
            this._inspektorThrottleTimer = null;
            if (this._inspektorUpdateAnstehend) {
                this._inspektorUpdateAnstehend = false;
                this._rendereObjekte();
            }
        }, 150);
    }

    setzeKlickHandler(handler) {
        this._onObjektKlick = handler;
    }

    setzeUmbenennenHandler(handler) {
        this._onObjektUmbenennen = handler;
    }

    _rendereKlassen() {
        const klassen = [
            {
                name: "DOKUMENT",
                attribute: [
                    "hintergrundFarbe",
                    "objekte",
                ],
                methoden: Dokument.gibMethoden(),
            },
            {
                name: "RECHTECK",
                attribute: [
                    "x", "y", "breite", "hoehe",
                    "fuellFarbe", "linienFarbe", "linienStaerke",
                ],
                methoden: Rechteck.gibMethoden(),
            },
            {
                name: "ELLIPSE",
                attribute: [
                    "x", "y", "breite", "hoehe",
                    "fuellFarbe", "linienFarbe", "linienStaerke",
                ],
                methoden: Ellipse.gibMethoden(),
            },
            {
                name: "LINIE",
                attribute: [
                    "x", "y", "x2", "y2",
                    "linienFarbe", "linienStaerke",
                ],
                methoden: Linie.gibMethoden(),
            },
            {
                name: "DREIECK",
                attribute: [
                    "x", "y", "breite", "hoehe",
                    "fuellFarbe", "linienFarbe", "linienStaerke",
                ],
                methoden: Dreieck.gibMethoden(),
            },
            {
                name: "TEXTOBJEKT",
                attribute: [
                    "x", "y", "inhalt", "schriftGroesse",
                    "fuellFarbe",
                ],
                methoden: TextObjekt.gibMethoden(),
            },
            {
                name: "BILDOBJEKT",
                attribute: [
                    "x", "y", "breite", "hoehe",
                    "quelle",
                ],
                methoden: BildObjekt.gibMethoden(),
            },
        ];

        let html = "";
        for (let i = 0; i < klassen.length; i++) {
            const kl = klassen[i];
            // Eigene Methoden aus dem Methoden-Editor hinzufuegen
            const eigeneMethoden = this._eigeneMethoden && this._eigeneMethoden[kl.name]
                ? this._eigeneMethoden[kl.name].map(m => m.name + "(" + m.parameter.join(", ") + ")")
                : [];
            const alleMethoden = [...kl.methoden, ...eigeneMethoden];

            html += `<div class="uml-karte klassen-karte" data-klasse-index="${i}" data-klasse-name="${kl.name}">
                <div class="uml-karte-kopf klassen-karte-toggle">
                    ${kl.name}
                    <span class="toggle-pfeil">&#9660;</span>
                </div>
                <div class="uml-karte-body">
                    <div class="uml-karte-attribute">
                        ${kl.attribute.map(a => `<span class="uml-zeile">${a}</span>`).join("")}
                    </div>
                    <div class="uml-karte-methoden">
                        ${alleMethoden.map(m => `<span class="uml-zeile">${m}</span>`).join("")}
                    </div>
                </div>
            </div>`;
        }
        this.klassenDiv.innerHTML = html;

        // Toggle-Klick-Handler fuer Ein-/Ausklappen
        const karten = this.klassenDiv.querySelectorAll(".klassen-karte-toggle");
        karten.forEach(kopf => {
            kopf.addEventListener("click", () => {
                const karte = kopf.closest(".klassen-karte");
                karte.classList.toggle("eingeklappt");
            });
        });
    }

    _rendereObjekte() {
        const objekte = this.dokument.alleObjekte();
        const dokAttr = this.dokument.gibAttribute();
        const dokMethoden = Dokument.gibMethoden();

        // Ausgewaehlten Typ ermitteln (fuer Klassenansicht-Reorder)
        let ausgewaehlterTyp = null;
        for (const obj of objekte) {
            if (obj.ausgewaehlt) {
                ausgewaehlterTyp = obj.gibTypName().toUpperCase();
                break;
            }
        }
        this._reordereKlassen(ausgewaehlterTyp);

        // Sortierte Objektliste: ausgewaehlte zuerst, Rest in Original-Reihenfolge
        const sortiertIndizes = [];
        for (let i = 0; i < objekte.length; i++) {
            if (objekte[i].ausgewaehlt) sortiertIndizes.push(i);
        }
        for (let i = 0; i < objekte.length; i++) {
            if (!objekte[i].ausgewaehlt) sortiertIndizes.push(i);
        }

        let html = "";

        // Dokument-Karte als HTML vorbereiten (wird spaeter eingefuegt)
        const dokEingeklappt = this._eingeklapptDokument ? " eingeklappt" : "";
        const dokKarteHtml = `<div class="uml-karte objekt-karte${dokEingeklappt}" data-objekt-name="dokument1">
            <div class="uml-karte-kopf objekt-karte-toggle">
                dokument1 : Dokument
                <span class="toggle-pfeil">&#9660;</span>
            </div>
            <div class="uml-karte-body">
                <div class="uml-karte-attribute">
                    ${Object.entries(dokAttr).map(([k, v]) => {
                        const farbPunkt = (k.toLowerCase().includes("farbe") && typeof v === "string" && v.startsWith("#"))
                            ? `<span class="farb-vorschau" style="background:${v}"></span>`
                            : "";
                        return `<span class="uml-zeile"><span class="attr-key">${k}</span> = <span class="attr-val">${v}</span>${farbPunkt}</span>`;
                    }).join("")}
                </div>
                <div class="uml-karte-methoden">
                    ${dokMethoden.map(m => `<span class="uml-zeile">${m}</span>`).join("")}
                </div>
            </div>
        </div>`;

        // Ausgewaehlte Objekte zuerst (VOR der Dokument-Karte)
        let htmlAusgewaehlt = "";
        let htmlRest = "";

        for (const idx of sortiertIndizes) {
            const obj = objekte[idx];
            const name = obj._name || `objekt_${idx}`;
            const attr = obj.gibAttribute();
            const methoden = obj.constructor.gibMethoden();
            const istAusgewaehlt = obj.ausgewaehlt;

            // Collapse-State wiederherstellen
            const istEingeklappt = this._eingeklappteObjekte.has(name);

            // Eigene Methoden fuer diesen Typ anzeigen
            const typName = obj.gibTypName().toUpperCase();
            const eigeneMethoden = this._eigeneMethoden && this._eigeneMethoden[typName]
                ? this._eigeneMethoden[typName].map(m => m.name + "(" + m.parameter.join(", ") + ")")
                : [];
            const alleMethoden = [...methoden, ...eigeneMethoden];

            const karteHtml = `<div class="uml-karte objekt-karte${istAusgewaehlt ? " ausgewaehlt" : ""}${istEingeklappt ? " eingeklappt" : ""}" data-objekt-index="${idx}" data-objekt-name="${name}">
                <div class="uml-karte-kopf objekt-karte-toggle">
                    ${name} : ${obj.gibTypName()}
                    <span class="toggle-pfeil">&#9660;</span>
                </div>
                <div class="uml-karte-body">
                    <div class="uml-karte-attribute">
                        ${Object.entries(attr).map(([k, v]) => {
                            const farbPunkt = (k.toLowerCase().includes("farbe") && typeof v === "string" && v.startsWith("#"))
                                ? `<span class="farb-vorschau" style="background:${v}"></span>`
                                : "";
                            return `<span class="uml-zeile"><span class="attr-key">${k}</span> = <span class="attr-val">${v}</span>${farbPunkt}</span>`;
                        }).join("")}
                    </div>
                    <div class="uml-karte-methoden">
                        ${alleMethoden.map(m => `<span class="uml-zeile">${m}</span>`).join("")}
                    </div>
                </div>
            </div>`;

            if (istAusgewaehlt) {
                htmlAusgewaehlt += karteHtml;
            } else {
                htmlRest += karteHtml;
            }
        }

        // Reihenfolge: Ausgewaehlte Objekte -> Dokument-Karte -> Rest
        html = htmlAusgewaehlt + dokKarteHtml + htmlRest;

        this.objektDiv.innerHTML = html;

        // Toggle-Handler fuer Objektkarten (Collapse-State in Set speichern)
        const toggleKoepfe = this.objektDiv.querySelectorAll(".objekt-karte-toggle");
        toggleKoepfe.forEach(kopf => {
            kopf.addEventListener("click", (e) => {
                const karte = kopf.closest(".objekt-karte");
                karte.classList.toggle("eingeklappt");
                // Collapse-State merken
                const objektName = karte.dataset.objektName;
                if (objektName) {
                    if (karte.classList.contains("eingeklappt")) {
                        if (objektName === "dokument1") {
                            this._eingeklapptDokument = true;
                        } else {
                            this._eingeklappteObjekte.add(objektName);
                        }
                    } else {
                        if (objektName === "dokument1") {
                            this._eingeklapptDokument = false;
                        } else {
                            this._eingeklappteObjekte.delete(objektName);
                        }
                    }
                }
                e.stopPropagation();
            });
        });

        // Klick-Handler auf Objekt-Karten (auf die ganze Karte, nicht nur den Kopf)
        const eintraege = this.objektDiv.querySelectorAll(".objekt-karte[data-objekt-index]");
        eintraege.forEach(el => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.objektIndex);
                if (this._onObjektKlick) {
                    this._onObjektKlick(idx);
                }
            });
        });

        // Doppelklick-Handler zum Umbenennen auf Objekt-Karten-Koepfe
        this.objektDiv.querySelectorAll(".objekt-karte[data-objekt-index] .objekt-karte-toggle").forEach(kopf => {
            kopf.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                e.preventDefault();
                const karte = kopf.closest(".objekt-karte");
                const idx = parseInt(karte.dataset.objektIndex);
                const alterName = karte.dataset.objektName;
                this._starteInlineUmbenennung(kopf, idx, alterName);
            });
        });
    }

    // Inline-Umbenennung: Ersetzt den Kopf-Text durch ein Eingabefeld
    _starteInlineUmbenennung(kopfElement, objektIndex, alterName) {
        const objekte = this.dokument.alleObjekte();
        const obj = objekte[objektIndex];
        if (!obj) return;

        const typName = obj.gibTypName();
        const pfeil = kopfElement.querySelector(".toggle-pfeil");

        // Eingabefeld erstellen
        const input = document.createElement("input");
        input.type = "text";
        input.value = alterName;
        input.className = "umbenennen-input";
        input.style.cssText = "width: 60%; font-size: 0.82rem; font-family: 'Fira Mono', monospace; padding: 1px 4px; border: 1px solid #60a5fa; border-radius: 3px; outline: none; background: #1e293b; color: #f1f5f9;";

        // Kopf-Inhalt ersetzen (nur den Textknoten, Pfeil behalten)
        Array.from(kopfElement.childNodes).forEach(node => {
            if (node !== pfeil) node.remove();
        });
        kopfElement.insertBefore(input, pfeil);

        // Typ-Suffix anzeigen
        const suffix = document.createTextNode(` : ${typName} `);
        kopfElement.insertBefore(suffix, pfeil);

        input.focus();
        input.select();

        const abschliessen = () => {
            const neuerName = input.value.trim();
            if (neuerName && neuerName !== alterName && /^[a-zA-ZäöüÄÖÜß_]\w*$/.test(neuerName)) {
                // Pruefen ob Name schon vergeben ist
                const nameVergeben = objekte.some((o, i) => i !== objektIndex && o._name === neuerName)
                    || neuerName === "dokument1";
                if (!nameVergeben) {
                    // Collapse-State aktualisieren
                    if (this._eingeklappteObjekte.has(alterName)) {
                        this._eingeklappteObjekte.delete(alterName);
                        this._eingeklappteObjekte.add(neuerName);
                    }
                    // Callback aufrufen (aktualisiert _name und codeEditor.variablen)
                    if (this._onObjektUmbenennen) {
                        this._onObjektUmbenennen(objektIndex, neuerName, alterName);
                    }
                    return; // Re-Render passiert durch dokument.aktualisieren()
                }
            }
            // Bei ungueltigem/leerem Namen: Originalzustand wiederherstellen
            this.dokument.aktualisieren();
        };

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
            }
            if (e.key === "Escape") {
                e.preventDefault();
                input.value = alterName; // Originalname wiederherstellen
                input.blur();
            }
            e.stopPropagation(); // Keyboard-Shortcuts nicht ausloesen
        });

        input.addEventListener("blur", () => {
            abschliessen();
        }, { once: true });
    }

    // Klassenansicht: Karte des ausgewaehlten Typs nach oben verschieben
    _reordereKlassen(ausgewaehlterTyp) {
        if (!ausgewaehlterTyp) return;

        const zielKarte = this.klassenDiv.querySelector(`.klassen-karte[data-klasse-name="${ausgewaehlterTyp}"]`);
        if (zielKarte && zielKarte !== this.klassenDiv.firstElementChild) {
            // Karte an den Anfang verschieben (DOM reorder, kein innerHTML reset)
            this.klassenDiv.insertBefore(zielKarte, this.klassenDiv.firstElementChild);
        }
    }
}


// ============================================================
// 3b. DATEIMANAGER – Bilder-Verwaltung mit IndexedDB
// ============================================================

// Modul-Variable fuer globalen Zugriff aus BildObjekt._ladeBild()
let _dateiManager = null;

class DateiManager {
    constructor() {
        this._db = null;
        this._cache = new Map(); // name -> { name, mimeType, dataUrl }
        this._bereit = false;
        this._onAenderung = null; // Callback bei Aenderungen
    }

    // Datenbank oeffnen und Cache fuellen
    async initialisieren() {
        return new Promise((resolve, reject) => {
            const anfrage = indexedDB.open("oop-dateien", 1);

            anfrage.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("bilder")) {
                    db.createObjectStore("bilder", { keyPath: "name" });
                }
            };

            anfrage.onsuccess = async (e) => {
                this._db = e.target.result;
                await this._cacheAktualisieren();
                this._bereit = true;
                _dateiManager = this;
                resolve();
            };

            anfrage.onerror = (e) => {
                console.error("IndexedDB Fehler:", e.target.error);
                this._bereit = true;
                _dateiManager = this;
                resolve(); // Auch bei Fehler weitermachen (ohne Persistenz)
            };
        });
    }

    // Cache aus IndexedDB fuellen
    async _cacheAktualisieren() {
        if (!this._db) return;
        return new Promise((resolve) => {
            const tx = this._db.transaction("bilder", "readonly");
            const store = tx.objectStore("bilder");
            const anfrage = store.getAll();
            anfrage.onsuccess = () => {
                this._cache.clear();
                for (const datei of anfrage.result) {
                    this._cache.set(datei.name, datei);
                }
                resolve();
            };
            anfrage.onerror = () => resolve();
        });
    }

    // Datei hinzufuegen (File-Objekt aus Input/Drag&Drop)
    async dateiHinzufuegen(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                const datei = {
                    name: file.name,
                    mimeType: file.type,
                    dataUrl: reader.result,
                    timestamp: Date.now(),
                };
                // In Cache speichern
                this._cache.set(datei.name, datei);
                // In IndexedDB speichern
                if (this._db) {
                    try {
                        const tx = this._db.transaction("bilder", "readwrite");
                        tx.objectStore("bilder").put(datei);
                        await new Promise((r, rej) => {
                            tx.oncomplete = r;
                            tx.onerror = () => rej(tx.error);
                        });
                    } catch (e) {
                        console.warn("IDB Schreibfehler:", e);
                    }
                }
                if (this._onAenderung) this._onAenderung();
                resolve(datei);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    // Datei loeschen
    async dateiLoeschen(name) {
        this._cache.delete(name);
        if (this._db) {
            try {
                const tx = this._db.transaction("bilder", "readwrite");
                tx.objectStore("bilder").delete(name);
                await new Promise((r, rej) => {
                    tx.oncomplete = r;
                    tx.onerror = () => rej(tx.error);
                });
            } catch (e) {
                console.warn("IDB Loeschfehler:", e);
            }
        }
        if (this._onAenderung) this._onAenderung();
    }

    // Alle Dateien zurueckgeben (aus Cache)
    alleDateien() {
        return Array.from(this._cache.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    // Synchroner Lookup: Dateiname -> DataURL (fuer BildObjekt._ladeBild)
    gibDateiUrlSync(name) {
        const datei = this._cache.get(name);
        return datei ? datei.dataUrl : null;
    }

    // Alle Dateien fuer Projekt-JSON exportieren
    exportiereFuerProjekt() {
        return this.alleDateien().map(d => ({
            name: d.name,
            mimeType: d.mimeType,
            dataUrl: d.dataUrl,
        }));
    }

    // Dateien aus Projekt-JSON importieren (in IDB + Cache)
    async importiereVonProjekt(dateien) {
        if (!dateien || !Array.isArray(dateien)) return;
        for (const d of dateien) {
            const datei = {
                name: d.name,
                mimeType: d.mimeType,
                dataUrl: d.dataUrl,
                timestamp: Date.now(),
            };
            this._cache.set(datei.name, datei);
            if (this._db) {
                try {
                    const tx = this._db.transaction("bilder", "readwrite");
                    tx.objectStore("bilder").put(datei);
                    await new Promise((r, rej) => {
                        tx.oncomplete = r;
                        tx.onerror = () => rej(tx.error);
                    });
                } catch (e) {
                    console.warn("IDB Import-Fehler:", e);
                }
            }
        }
        if (this._onAenderung) this._onAenderung();
    }
}


// ============================================================
// 3c. HIERARCHIEVIEW – Flache Objektliste (linkes Panel)
// ============================================================

class HierarchieView {
    constructor(listeDiv, dokument) {
        this.listeDiv = listeDiv;
        this.dokument = dokument;
        this._onObjektKlick = null;
        this._throttleTimer = null;
        this._updateAnstehend = false;

        // Typ-Icons (SVG-Pfade fuer kleine Symbole)
        this._typIcons = {
            Dokument:   { farbe: "#64748b", svg: '<rect x="2" y="2" width="10" height="10" rx="1" fill="currentColor"/>' },
            Rechteck:   { farbe: "#3b82f6", svg: '<rect x="1" y="3" width="12" height="8" fill="currentColor"/>' },
            Ellipse:    { farbe: "#8b5cf6", svg: '<ellipse cx="7" cy="7" rx="6" ry="4" fill="currentColor"/>' },
            Linie:      { farbe: "#ef4444", svg: '<line x1="1" y1="12" x2="13" y2="2" stroke="currentColor" stroke-width="2"/>' },
            Dreieck:    { farbe: "#f59e0b", svg: '<polygon points="7,1 13,13 1,13" fill="currentColor"/>' },
            TextObjekt: { farbe: "#10b981", svg: '<text x="2" y="11" font-size="11" fill="currentColor" font-weight="bold">T</text>' },
            BildObjekt: { farbe: "#ec4899", svg: '<rect x="1" y="2" width="12" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="4.5" cy="5.5" r="1.5" fill="currentColor"/><path d="M1 10l3-3 2.5 2.5L10 6l3 4" stroke="currentColor" stroke-width="1" fill="none"/>' },
        };

        // Als Beobachter registrieren (mit Throttle)
        this.dokument.beobachterHinzufuegen(() => this._rendereGethrottled());
        this._rendere();
    }

    setzeKlickHandler(handler) {
        this._onObjektKlick = handler;
    }

    _rendereGethrottled() {
        if (this._throttleTimer) {
            this._updateAnstehend = true;
            return;
        }
        this._rendere();
        this._throttleTimer = setTimeout(() => {
            this._throttleTimer = null;
            if (this._updateAnstehend) {
                this._updateAnstehend = false;
                this._rendere();
            }
        }, 150);
    }

    _rendere() {
        const objekte = this.dokument.alleObjekte();
        let html = "";

        // Dokument-Eintrag (immer zuerst)
        const dokIcon = this._typIcons.Dokument;
        html += `<div class="hierarchie-eintrag h-dokument" data-h-name="dokument1">
            <svg class="h-icon" viewBox="0 0 14 14" style="color:${dokIcon.farbe}">${dokIcon.svg}</svg>
            <span class="h-name">dokument1</span>
            <span class="h-typ">Dok</span>
        </div>`;

        // Alle Zeichenobjekte
        for (let i = 0; i < objekte.length; i++) {
            const obj = objekte[i];
            const name = obj._name || `objekt_${i}`;
            const typ = obj.gibTypName();
            const icon = this._typIcons[typ] || this._typIcons.Rechteck;
            const ausgewaehlt = obj.ausgewaehlt ? " ausgewaehlt" : "";
            const kurzTyp = typ.replace("Objekt", "").substring(0, 4);

            html += `<div class="hierarchie-eintrag${ausgewaehlt}" data-h-index="${i}" data-h-name="${name}">
                <svg class="h-icon" viewBox="0 0 14 14" style="color:${icon.farbe}">${icon.svg}</svg>
                <span class="h-name">${name}</span>
                <span class="h-typ">${kurzTyp}</span>
            </div>`;
        }

        this.listeDiv.innerHTML = html;

        // Klick-Handler
        const eintraege = this.listeDiv.querySelectorAll(".hierarchie-eintrag[data-h-index]");
        eintraege.forEach(el => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.hIndex);
                if (this._onObjektKlick) this._onObjektKlick(idx);
            });
        });
    }
}


// ============================================================
// 3d. DATEIENVIEW – Bild-Asset-Verwaltung (linkes Panel)
// ============================================================

class DateienView {
    constructor(listeDiv, dateiManager, panelElement) {
        this.listeDiv = listeDiv;
        this.dateiManager = dateiManager;
        this.panelElement = panelElement; // Das Tab-Panel (fuer Drag&Drop-Bereich)
        this._dropzone = document.getElementById("dateien-dropzone");
        this._uploadInput = document.getElementById("dateien-upload-input");

        this._initUpload();
        this._initDragDrop();
        this._rendere();

        // Bei Aenderungen im DateiManager neu rendern
        this.dateiManager._onAenderung = () => this._rendere();
    }

    _initUpload() {
        this._uploadInput.addEventListener("change", async (e) => {
            const dateien = Array.from(e.target.files);
            for (const datei of dateien) {
                await this.dateiManager.dateiHinzufuegen(datei);
            }
            this._uploadInput.value = ""; // Reset
        });
    }

    _initDragDrop() {
        let dragCounter = 0;

        this.panelElement.addEventListener("dragenter", (e) => {
            e.preventDefault();
            dragCounter++;
            this._dropzone.classList.add("sichtbar");
        });

        this.panelElement.addEventListener("dragleave", (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                this._dropzone.classList.remove("sichtbar");
            }
        });

        this.panelElement.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        });

        this.panelElement.addEventListener("drop", async (e) => {
            e.preventDefault();
            dragCounter = 0;
            this._dropzone.classList.remove("sichtbar");

            const dateien = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
            for (const datei of dateien) {
                await this.dateiManager.dateiHinzufuegen(datei);
            }
        });
    }

    _rendere() {
        const dateien = this.dateiManager.alleDateien();

        if (dateien.length === 0) {
            this.listeDiv.innerHTML = `<div class="dateien-leer">
                <svg viewBox="0 0 24 24" class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>
                    <path d="M21 15l-5-5L5 21"/>
                </svg>
                <span>Noch keine Bilder hochgeladen</span>
                <span style="color:#cbd5e1">Bilder hierhin ziehen oder Button unten nutzen</span>
            </div>`;
            return;
        }

        let html = "";
        for (const datei of dateien) {
            const kurzName = datei.name.length > 18
                ? datei.name.substring(0, 15) + "..."
                : datei.name;

            html += `<div class="datei-eintrag" data-datei-name="${this._escapeAttr(datei.name)}" title="${this._escapeAttr(datei.name)}">
                <img class="datei-thumb" src="${datei.dataUrl}" alt="${this._escapeAttr(datei.name)}">
                <span class="datei-name">${this._escapeHtml(datei.name)}</span>
                <button class="datei-loeschen" title="Loeschen" data-loeschen="${this._escapeAttr(datei.name)}">
                    <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>`;
        }

        this.listeDiv.innerHTML = html;

        // Loeschen-Handler
        this.listeDiv.querySelectorAll(".datei-loeschen").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const name = btn.dataset.loeschen;
                if (name) await this.dateiManager.dateiLoeschen(name);
            });
        });
    }

    _escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    _escapeAttr(text) {
        return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}


// ============================================================
// 4. CONTROLLER – Toolbar und Maus-Interaktion
// ============================================================

class Controller {
    constructor(dokument, canvasView) {
        this.dokument = dokument;
        this.canvasView = canvasView;
        this.aktivesWerkzeug = "auswahl";
        this.fuellFarbe = "#3b82f6";
        this.linienFarbe = "#1e293b";

        // Maus-Zustand
        this._istGedruckt = false;
        this._startX = 0;
        this._startY = 0;
        this._aktuellesObjekt = null; // beim Verschieben
        this._verschiebeOffsetX = 0;
        this._verschiebeOffsetY = 0;
        this._objektZaehler = { Rechteck: 0, Ellipse: 0, Linie: 0, Dreieck: 0, TextObjekt: 0, BildObjekt: 0 };
        this._canvasRect = null; // gecachtes BoundingClientRect

        this._initToolbar();
        this._initFarbwahl();
        this._initMausEvents();
        this._initTastaturKuerzel();
        this._initProjektButtons();
    }

    // --- Toolbar-Buttons ---
    _initToolbar() {
        const buttons = document.querySelectorAll(".werkzeug-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("aktiv"));
                btn.classList.add("aktiv");
                this.aktivesWerkzeug = btn.dataset.werkzeug;
                this._aktualisiereCursor();
            });
        });
    }

    _aktualisiereCursor() {
        const canvasBereich = document.querySelector(".canvas-bereich");
        // Alle werkzeug-* Klassen entfernen
        canvasBereich.className = canvasBereich.className
            .split(" ")
            .filter(c => !c.startsWith("werkzeug-"))
            .join(" ");
        canvasBereich.classList.add(`werkzeug-${this.aktivesWerkzeug}`);
    }

    // --- Farbwahl ---
    _initFarbwahl() {
        const fuellInput = document.getElementById("fuellfarbe");
        const fuellVorschau = document.getElementById("fuellfarbe-vorschau");
        fuellInput.addEventListener("input", () => {
            this.fuellFarbe = fuellInput.value;
            fuellVorschau.style.background = fuellInput.value;
        });

        const linienInput = document.getElementById("linienfarbe");
        const linienVorschau = document.getElementById("linienfarbe-vorschau");
        linienInput.addEventListener("input", () => {
            this.linienFarbe = linienInput.value;
            linienVorschau.style.background = linienInput.value;
        });
    }

    // --- Tastatur-Kuerzel ---
    _initTastaturKuerzel() {
        document.addEventListener("keydown", (e) => {
            // Nicht reagieren wenn im Textfeld
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

            const kuerzel = {
                v: "auswahl", r: "rechteck", e: "ellipse",
                l: "linie", d: "dreieck", t: "text", b: "bild"
            };
            if (kuerzel[e.key.toLowerCase()]) {
                this.aktivesWerkzeug = kuerzel[e.key.toLowerCase()];
                document.querySelectorAll(".werkzeug-btn").forEach(b => b.classList.remove("aktiv"));
                const btn = document.querySelector(`[data-werkzeug="${this.aktivesWerkzeug}"]`);
                if (btn) btn.classList.add("aktiv");
                this._aktualisiereCursor();
            }

            // Entfernen-Taste: ausgewaehltes Objekt loeschen
            if (e.key === "Delete" || e.key === "Backspace") {
                const ausgewaehlte = this.dokument.objekte.filter(o => o.ausgewaehlt);
                for (const obj of ausgewaehlte) {
                    // Animation stoppen, falls vorhanden
                    if (typeof obj.stoppeAnimation === "function") {
                        obj.stoppeAnimation();
                    }
                    // Aus CodeEditor-Variablen entfernen
                    if (obj._name && this._codeEditorRef && this._codeEditorRef.variablen[obj._name]) {
                        delete this._codeEditorRef.variablen[obj._name];
                    }
                    this.dokument.entfernen(obj);
                }
            }
        });
    }

    // --- Maus-Events auf dem Canvas ---
    _initMausEvents() {
        const canvas = this.canvasView.canvas;

        canvas.addEventListener("mousedown", (e) => this._onMouseDown(e));
        canvas.addEventListener("mousemove", (e) => this._onMouseMove(e));
        canvas.addEventListener("mouseup", (e) => this._onMouseUp(e));
        canvas.addEventListener("mouseleave", (e) => this._onMouseUp(e));
    }

    _mausPosition(e) {
        // Gecachtes Rect verwenden (wird bei mousedown aktualisiert)
        const rect = this._canvasRect || this.canvasView.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    _onMouseDown(e) {
        const canvas = this.canvasView.canvas;
        // BoundingClientRect bei mousedown cachen (erzwingt sonst Layout-Reflow bei jedem mousemove)
        this._canvasRect = canvas.getBoundingClientRect();
        const pos = this._mausPosition(e);
        this._istGedruckt = true;
        this._startX = pos.x;
        this._startY = pos.y;

        if (this.aktivesWerkzeug === "auswahl") {
            // Objekt unter dem Cursor finden
            const obj = this.dokument.objektAnPosition(pos.x, pos.y);
            this.dokument.alleAbwaehlen();
            if (obj) {
                obj.ausgewaehlt = true;
                this._aktuellesObjekt = obj;
                this._verschiebeOffsetX = pos.x - obj.x;
                this._verschiebeOffsetY = pos.y - obj.y;
            } else {
                this._aktuellesObjekt = null;
            }
            this.dokument.aktualisieren();
        }
    }

    _onMouseMove(e) {
        if (!this._istGedruckt) return;
        const pos = this._mausPosition(e);

        if (this.aktivesWerkzeug === "auswahl") {
            // Objekt verschieben – nur Canvas neu zeichnen (kein Inspector-Rebuild)
            if (this._aktuellesObjekt) {
                const neuesX = pos.x - this._verschiebeOffsetX;
                const neuesY = pos.y - this._verschiebeOffsetY;
                this._aktuellesObjekt.setzePosition(neuesX, neuesY);
                // Direkter Canvas-Redraw ohne Observer-Kette (schneller Pfad)
                this.canvasView.nurCanvasNeuZeichnen();
            }
        } else if (this.aktivesWerkzeug === "text") {
            // Kein Vorschau-Objekt fuer Text
        } else if (this.aktivesWerkzeug === "bild") {
            // Kein Vorschau-Objekt fuer Bild
        } else {
            // Vorschau-Objekt zeichnen
            const vorschau = this._erstelleObjekt(
                this._startX, this._startY,
                pos.x - this._startX, pos.y - this._startY
            );
            if (vorschau) {
                this.canvasView.setzeVorschau(vorschau);
            }
        }
    }

    _onMouseUp(e) {
        if (!this._istGedruckt) return;
        this._istGedruckt = false;
        const pos = this._mausPosition(e);

        // BoundingClientRect-Cache invalidieren
        this._canvasRect = null;

        this.canvasView.loescheVorschau();

        if (this.aktivesWerkzeug === "auswahl") {
            // Verschieben beendet
            this._aktuellesObjekt = null;
            this.dokument.aktualisieren();
        } else if (this.aktivesWerkzeug === "text") {
            // Text-Dialog oeffnen
            this._zeigeTextDialog(this._startX, this._startY);
        } else if (this.aktivesWerkzeug === "bild") {
            // Bild-Dialog oeffnen
            this._zeigeBildDialog(this._startX, this._startY);
        } else {
            // Neues Objekt erstellen
            let breite = pos.x - this._startX;
            let hoehe = pos.y - this._startY;

            // Mindestgroesse
            if (Math.abs(breite) < 5 && Math.abs(hoehe) < 5) {
                breite = 100;
                hoehe = 80;
            }

            const neuesObjekt = this._erstelleObjekt(this._startX, this._startY, breite, hoehe);
            if (neuesObjekt) {
                // Normalisieren: negative Breite/Hoehe korrigieren
                if (this.aktivesWerkzeug !== "linie") {
                    if (neuesObjekt.breite < 0) {
                        neuesObjekt.x += neuesObjekt.breite;
                        neuesObjekt.breite = Math.abs(neuesObjekt.breite);
                    }
                    if (neuesObjekt.hoehe < 0) {
                        neuesObjekt.y += neuesObjekt.hoehe;
                        neuesObjekt.hoehe = Math.abs(neuesObjekt.hoehe);
                    }
                }

                // Name zuweisen
                const typ = neuesObjekt.gibTypName();
                this._objektZaehler[typ] = (this._objektZaehler[typ] || 0) + 1;
                const prefix = typ.charAt(0).toLowerCase();
                neuesObjekt._name = `${prefix}${this._objektZaehler[typ]}`;

                this.dokument.hinzufuegen(neuesObjekt);
            }
        }
    }

    _erstelleObjekt(x, y, breite, hoehe) {
        let obj;
        switch (this.aktivesWerkzeug) {
            case "rechteck":
                obj = new Rechteck(x, y, breite, hoehe);
                break;
            case "ellipse":
                obj = new Ellipse(x, y, breite, hoehe);
                break;
            case "linie":
                obj = new Linie(x, y, x + breite, y + hoehe);
                break;
            case "dreieck":
                obj = new Dreieck(x, y, breite, hoehe);
                break;
            default:
                return null;
        }
        obj.fuellFarbe = this.fuellFarbe;
        obj.linienFarbe = this.linienFarbe;
        return obj;
    }

    _zeigeTextDialog(x, y) {
        // Overlay erstellen
        const overlay = document.createElement("div");
        overlay.className = "text-dialog-overlay";
        overlay.innerHTML = `
            <div class="text-dialog">
                <label class="block text-sm font-semibold text-slate-700 mb-1">Text eingeben:</label>
                <input type="text" id="text-dialog-input" value="Text" autofocus>
                <div class="text-dialog-buttons">
                    <button id="text-dialog-abbrechen" class="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition">
                        Abbrechen
                    </button>
                    <button id="text-dialog-ok" class="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-semibold">
                        OK
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = document.getElementById("text-dialog-input");
        input.select();

        const abschliessen = (bestaetigt) => {
            if (bestaetigt) {
                const text = input.value.trim();
                if (text) {
                    const textObj = new TextObjekt(x, y, text);
                    textObj.fuellFarbe = this.fuellFarbe;
                    this._objektZaehler.TextObjekt = (this._objektZaehler.TextObjekt || 0) + 1;
                    textObj._name = `t${this._objektZaehler.TextObjekt}`;
                    this.dokument.hinzufuegen(textObj);
                }
            }
            overlay.remove();
        };

        document.getElementById("text-dialog-ok").addEventListener("click", () => abschliessen(true));
        document.getElementById("text-dialog-abbrechen").addEventListener("click", () => abschliessen(false));
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") abschliessen(true);
            if (e.key === "Escape") abschliessen(false);
        });
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) abschliessen(false);
        });
    }

    _zeigeBildDialog(x, y) {
        const overlay = document.createElement("div");
        overlay.className = "text-dialog-overlay";
        overlay.innerHTML = `
            <div class="text-dialog">
                <label class="block text-sm font-semibold text-slate-700 mb-1">Bild-URL eingeben:</label>
                <input type="text" id="bild-dialog-input" placeholder="https://example.com/bild.png" autofocus>
                <div class="mt-3">
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Oder Datei hochladen:</label>
                    <input type="file" id="bild-dialog-datei" accept="image/*" class="text-xs text-slate-600">
                </div>
                <div class="text-dialog-buttons">
                    <button id="bild-dialog-abbrechen" class="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition">
                        Abbrechen
                    </button>
                    <button id="bild-dialog-ok" class="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-semibold">
                        OK
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const urlInput = document.getElementById("bild-dialog-input");
        const dateiInput = document.getElementById("bild-dialog-datei");
        urlInput.focus();

        const abschliessen = (bestaetigt) => {
            if (bestaetigt) {
                const url = urlInput.value.trim();
                const datei = dateiInput.files && dateiInput.files[0];

                const erstelleBild = (quelle) => {
                    const bildObj = new BildObjekt(x, y, 150, 150, quelle);
                    this._objektZaehler.BildObjekt = (this._objektZaehler.BildObjekt || 0) + 1;
                    bildObj._name = `b${this._objektZaehler.BildObjekt}`;
                    this.dokument.hinzufuegen(bildObj);
                };

                if (datei) {
                    // Datei als DataURL lesen
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        erstelleBild(e.target.result);
                    };
                    reader.readAsDataURL(datei);
                } else if (url) {
                    erstelleBild(url);
                }
            }
            overlay.remove();
        };

        document.getElementById("bild-dialog-ok").addEventListener("click", () => abschliessen(true));
        document.getElementById("bild-dialog-abbrechen").addEventListener("click", () => abschliessen(false));
        urlInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") abschliessen(true);
            if (e.key === "Escape") abschliessen(false);
        });
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) abschliessen(false);
        });
    }

    // --- Projekt Speichern / Laden ---
    _initProjektButtons() {
        const speichernBtn = document.getElementById("projekt-speichern-btn");
        const ladenBtn = document.getElementById("projekt-laden-btn");
        const dateiInput = document.getElementById("projekt-datei-input");

        speichernBtn.addEventListener("click", () => this._projektSpeichern());

        ladenBtn.addEventListener("click", () => dateiInput.click());

        dateiInput.addEventListener("change", (e) => {
            const datei = e.target.files[0];
            if (!datei) return;
            this._projektLaden(datei);
            dateiInput.value = ""; // zuruecksetzen fuer erneutes Laden
        });
    }

    _projektSpeichern() {
        const daten = this.dokument.projektSpeichern();

        // Code-Editor-Inhalt mitspeichern
        const codeEditor = document.getElementById("code-editor");
        if (codeEditor) {
            daten.codeEditorInhalt = codeEditor.value;
        }

        const json = JSON.stringify(daten, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `oop-projekt-${this._zeitstempel()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    _projektLaden(datei) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const daten = JSON.parse(e.target.result);

                // Dateien (Bilder) zuerst importieren, damit BildObjekt._ladeBild() Dateinamen aufloesen kann
                if (this._onVorProjektLaden) {
                    await this._onVorProjektLaden(daten);
                }

                this.dokument.projektLaden(daten);

                // Objekt-Zaehler und Variablen-Registry zuruecksetzen
                this._objektZaehler = { Rechteck: 0, Ellipse: 0, Linie: 0, Dreieck: 0, TextObjekt: 0, BildObjekt: 0 };

                for (const obj of this.dokument.objekte) {
                    const typ = obj.gibTypName();
                    if (this._objektZaehler[typ] !== undefined) {
                        this._objektZaehler[typ]++;
                    }
                }

                // Code-Editor-Inhalt wiederherstellen
                if (daten.codeEditorInhalt != null) {
                    const codeEditor = document.getElementById("code-editor");
                    if (codeEditor) {
                        codeEditor.value = daten.codeEditorInhalt;
                    }
                }

                // Callback: CodeEditor-Sync + MethodenEditor-Daten laden (nach projektLaden)
                if (this._onProjektGeladen) {
                    this._onProjektGeladen(daten);
                }
            } catch (err) {
                alert("Fehler beim Laden: " + err.message);
            }
        };
        reader.readAsText(datei);
    }

    _zeitstempel() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}-${String(d.getMinutes()).padStart(2, "0")}`;
    }

    // Wird vom Inspektor aufgerufen, wenn ein Objekt geklickt wird
    waehleObjektAus(index) {
        this.dokument.alleAbwaehlen();
        const obj = this.dokument.objekte[index];
        if (obj) {
            obj.ausgewaehlt = true;
        }
        this.dokument.aktualisieren();
    }
}


// ============================================================
// 5. CODE-EDITOR – Pseudocode-Parser
// ============================================================

class CodeEditor {
    constructor(dokument, controller) {
        this.dokument = dokument;
        this.controller = controller;
        this.variablen = {};  // name -> Zeichenobjekt

        this.editorElement = document.getElementById("code-editor");
        this.konsoleElement = document.getElementById("konsole");
        this.statusElement = document.getElementById("editor-status");
        this.ausfuehrenBtn = document.getElementById("ausfuehren-btn");

        // "dokument1" ist immer verfuegbar
        this.variablen["dokument1"] = this.dokument;

        this.ausfuehrenBtn.addEventListener("click", () => this.ausfuehren());

        // Ctrl+Enter zum Ausfuehren
        this.editorElement.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                this.ausfuehren();
            }
        });
    }

    ausfuehren() {
        const code = this.editorElement.value;
        const zeilen = code.split("\n");
        this._konsoleLeer();
        let fehlerGefunden = false;

        for (let i = 0; i < zeilen.length; i++) {
            const zeile = zeilen[i].trim();

            // Leere Zeilen und Kommentare ueberspringen
            if (zeile === "" || zeile.startsWith("//")) continue;

            try {
                this._verarbeiteZeile(zeile, i + 1);
            } catch (err) {
                this._konsoleFehler(`Zeile ${i + 1}: ${err.message}`);
                fehlerGefunden = true;
            }
        }

        if (!fehlerGefunden) {
            this._konsoleErfolg("Code erfolgreich ausgefuehrt.");
        }

        this.statusElement.textContent = fehlerGefunden ? "Fehler" : "OK";
        this.statusElement.className = `text-xs ${fehlerGefunden ? "text-red-400" : "text-emerald-400"}`;
    }

    _verarbeiteZeile(zeile, zeilenNr) {
        // Pattern 1: Instanziierung – "KlassenName varName = neu KlassenName(args...)"
        const instanzMatch = zeile.match(
            /^(\w+)\s+(\w+)\s*=\s*neu\s+(\w+)\s*\(([^)]*)\)\s*$/
        );
        if (instanzMatch) {
            return this._instanziiere(instanzMatch[1], instanzMatch[2], instanzMatch[3], instanzMatch[4], zeilenNr);
        }

        // Pattern 2: Methodenaufruf – "varName.methode(args...)"
        const methodenMatch = zeile.match(
            /^(\w+)\.(\w+)\s*\(([^)]*)\)\s*$/
        );
        if (methodenMatch) {
            return this._rufeMethodeAuf(methodenMatch[1], methodenMatch[2], methodenMatch[3], zeilenNr);
        }

        // Pattern 3: Objekt entfernen – "entferne(varName)" oder "entferne("varName")"
        const entferneMatch = zeile.match(/^entferne\(\s*"?(\w+)"?\s*\)$/);
        if (entferneMatch) {
            const varName = entferneMatch[1];
            const obj = this.variablen[varName];
            if (!obj || typeof obj !== "object") {
                throw new Error(`Objekt "${varName}" nicht gefunden. Verfuegbar: ${Object.keys(this.variablen).join(", ")}`);
            }
            if (typeof obj.stoppeAnimation === "function") {
                obj.stoppeAnimation();
            }
            delete this.variablen[varName];
            this.dokument.entfernen(obj);
            this._konsoleInfo(`"${varName}" wurde entfernt.`);
            return;
        }

        throw new Error(`Unbekannte Syntax: "${zeile}"`);
    }

    _instanziiere(typAngabe, varName, klassenName, argsStr, zeilenNr) {
        // Klasse zuordnen
        const klassenMap = {
            Rechteck: Rechteck,
            Ellipse: Ellipse,
            Linie: Linie,
            Dreieck: Dreieck,
            Text: TextObjekt,
            TextObjekt: TextObjekt,
            Bild: BildObjekt,
            BildObjekt: BildObjekt,
        };

        const Klasse = klassenMap[klassenName];
        if (!Klasse) {
            throw new Error(`Unbekannte Klasse "${klassenName}". Verfuegbar: ${Object.keys(klassenMap).join(", ")}`);
        }

        // Argumente parsen
        const args = this._parseArgs(argsStr);

        // Instanz erstellen
        let obj;
        try {
            obj = new Klasse(...args);
        } catch (e) {
            throw new Error(`Fehler beim Erstellen von ${klassenName}: ${e.message}`);
        }

        // Farben vom Controller uebernehmen
        if (obj.fuellFarbe === "#3b82f6") {
            obj.fuellFarbe = this.controller.fuellFarbe;
        }
        if (obj.linienFarbe === "#1e293b") {
            obj.linienFarbe = this.controller.linienFarbe;
        }

        obj._name = varName;
        this.variablen[varName] = obj;
        this.dokument.hinzufuegen(obj);

        this._konsoleInfo(`${varName} = neu ${klassenName}(${argsStr}) erstellt.`);
    }

    _rufeMethodeAuf(varName, methodenName, argsStr, zeilenNr) {
        const obj = this.variablen[varName];
        if (!obj) {
            throw new Error(`Variable "${varName}" nicht gefunden. Verfuegbar: ${Object.keys(this.variablen).join(", ")}`);
        }

        // Methode auf dem Objekt finden
        if (typeof obj[methodenName] !== "function") {
            throw new Error(`Methode "${methodenName}" existiert nicht auf ${varName}.`);
        }

        const args = this._parseArgs(argsStr);

        try {
            obj[methodenName](...args);
        } catch (e) {
            throw new Error(`Fehler bei ${varName}.${methodenName}(): ${e.message}`);
        }

        this.dokument.aktualisieren();
        this._konsoleInfo(`${varName}.${methodenName}(${argsStr}) ausgefuehrt.`);
    }

    _parseArgs(argsStr) {
        if (!argsStr || argsStr.trim() === "") return [];

        return argsStr.split(",").map(arg => {
            arg = arg.trim();

            // String in Anfuehrungszeichen
            if ((arg.startsWith('"') && arg.endsWith('"')) ||
                (arg.startsWith("'") && arg.endsWith("'"))) {
                return arg.slice(1, -1);
            }

            // Zahl
            if (!isNaN(arg) && arg !== "") {
                return parseFloat(arg);
            }

            // Boolean
            if (arg === "true" || arg === "wahr") return true;
            if (arg === "false" || arg === "falsch") return false;

            // Variable referenzieren
            if (this.variablen[arg]) {
                return this.variablen[arg];
            }

            // Als String behandeln
            return arg;
        });
    }

    // --- Konsole ---
    _konsoleLeer() {
        this.konsoleElement.innerHTML = "";
    }

    _konsoleInfo(text) {
        this.konsoleElement.innerHTML += `<div class="info">&gt; ${this._escapeHtml(text)}</div>`;
        this.konsoleElement.scrollTop = this.konsoleElement.scrollHeight;
    }

    _konsoleErfolg(text) {
        this.konsoleElement.innerHTML += `<div class="erfolg">${this._escapeHtml(text)}</div>`;
        this.konsoleElement.scrollTop = this.konsoleElement.scrollHeight;
    }

    _konsoleFehler(text) {
        this.konsoleElement.innerHTML += `<div class="fehler">${this._escapeHtml(text)}</div>`;
        this.konsoleElement.scrollTop = this.konsoleElement.scrollHeight;
    }

    _escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Synchronisation: Variablen-Registry mit dem Dokument abgleichen
    // (falls Objekte per Maus oder extern hinzugefuegt werden)
    registriereExternesObjekt(obj) {
        if (obj._name && !this.variablen[obj._name]) {
            this.variablen[obj._name] = obj;
        }
    }
}


// ============================================================
// 5b. METHODEN-EDITOR – Eigene Methoden in Python-Syntax
// ============================================================

class MethodenEditor {
    constructor(dokument, codeEditor, inspektorView, controller) {
        this.dokument = dokument;
        this.codeEditor = codeEditor;
        this.inspektorView = inspektorView;
        this.controller = controller;

        // Eigene Methoden pro Klasse: { "RECHTECK": [{name, parameter, koerper}], ... }
        this.eigeneMethoden = {};

        // Gespeicherter Editor-Inhalt pro Klasse (damit beim Tab-Wechsel nichts verloren geht)
        this._editorInhalte = {};

        this.editorElement = document.getElementById("klassen-editor");
        this.auswahlElement = document.getElementById("klassen-auswahl");
        this.konsoleElement = document.getElementById("klassen-konsole");
        this.uebernehmenBtn = document.getElementById("methoden-uebernehmen-btn");

        this._aktuelleKlasse = "Rechteck";

        // Klassenstruktur-Definitionen (alle Attribute und eingebaute Methoden)
        this._klassenDef = {
            Rechteck: {
                attribute: { x: 0, y: 0, breite: 100, hoehe: 80, fuellFarbe: '"#3b82f6"', linienFarbe: '"#1e293b"', linienStaerke: 2 },
                methoden: ["verschieben(dx, dy)", "setzePosition(x, y)", "setzeGroesse(breite, hoehe)", "setzeFarbe(farbe)", "setzeLinienFarbe(farbe)", "setzeLinienStaerke(staerke)", "starteAnimation(methode, intervallMs)", "stoppeAnimation()"],
            },
            Ellipse: {
                attribute: { x: 0, y: 0, breite: 100, hoehe: 80, fuellFarbe: '"#3b82f6"', linienFarbe: '"#1e293b"', linienStaerke: 2 },
                methoden: ["verschieben(dx, dy)", "setzePosition(x, y)", "setzeGroesse(breite, hoehe)", "setzeFarbe(farbe)", "setzeLinienFarbe(farbe)", "setzeLinienStaerke(staerke)", "starteAnimation(methode, intervallMs)", "stoppeAnimation()"],
            },
            Linie: {
                attribute: { x: 0, y: 0, x2: 100, y2: 100, linienFarbe: '"#1e293b"', linienStaerke: 2 },
                methoden: ["verschieben(dx, dy)", "setzePosition(x, y)", "setzeLinienFarbe(farbe)", "setzeLinienStaerke(staerke)", "starteAnimation(methode, intervallMs)", "stoppeAnimation()"],
            },
            Dreieck: {
                attribute: { x: 0, y: 0, breite: 100, hoehe: 87, fuellFarbe: '"#3b82f6"', linienFarbe: '"#1e293b"', linienStaerke: 2 },
                methoden: ["verschieben(dx, dy)", "setzePosition(x, y)", "setzeGroesse(breite, hoehe)", "setzeFarbe(farbe)", "setzeLinienFarbe(farbe)", "setzeLinienStaerke(staerke)", "starteAnimation(methode, intervallMs)", "stoppeAnimation()"],
            },
            TextObjekt: {
                attribute: { x: 0, y: 0, inhalt: '"Text"', schriftGroesse: 20, fuellFarbe: '"#1e293b"' },
                methoden: ["verschieben(dx, dy)", "setzePosition(x, y)", "setzeFarbe(farbe)", "setzeInhalt(text)", "setzeSchriftGroesse(groesse)", "starteAnimation(methode, intervallMs)", "stoppeAnimation()"],
            },
            BildObjekt: {
                attribute: { x: 0, y: 0, breite: 150, hoehe: 150, quelle: '""' },
                methoden: ["verschieben(dx, dy)", "setzePosition(x, y)", "setzeGroesse(breite, hoehe)", "setzeQuelle(url)", "starteAnimation(methode, intervallMs)", "stoppeAnimation()"],
            },
        };

        this._initTabs();
        this._initEvents();
        this._ladeKlasse("Rechteck");
        this._registriereTimerMethoden();
    }

    // --- Tab-Switching ---
    _initTabs() {
        const tabs = document.querySelectorAll(".editor-tab");
        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                tabs.forEach(t => t.classList.remove("aktiv"));
                tab.classList.add("aktiv");

                const tabName = tab.dataset.tab;
                document.getElementById("tab-code").style.display = tabName === "code" ? "flex" : "none";
                document.getElementById("tab-klassen").style.display = tabName === "klassen" ? "flex" : "none";

                // Ausfuehren-Button nur im Code-Tab anzeigen
                document.getElementById("ausfuehren-btn").style.display = tabName === "code" ? "" : "none";
            });
        });
    }

    _initEvents() {
        // Klassen-Auswahl Dropdown
        this.auswahlElement.addEventListener("change", () => {
            // Aktuellen Inhalt speichern
            this._editorInhalte[this._aktuelleKlasse] = this.editorElement.value;
            this._aktuelleKlasse = this.auswahlElement.value;
            this._ladeKlasse(this._aktuelleKlasse);
        });

        // Uebernehmen-Button
        this.uebernehmenBtn.addEventListener("click", () => {
            this._editorInhalte[this._aktuelleKlasse] = this.editorElement.value;
            this._parseAlleKlassen();
        });
    }

    // --- Klasse in den Editor laden ---
    _ladeKlasse(klassenName) {
        // Wenn bereits gespeicherter Inhalt vorhanden, diesen laden
        if (this._editorInhalte[klassenName]) {
            this.editorElement.value = this._editorInhalte[klassenName];
            return;
        }

        // Ansonsten: Python-Klassencode generieren
        const def = this._klassenDef[klassenName];
        if (!def) return;

        let code = `class ${klassenName}:\n`;
        code += `\n`;
        code += `    # --- Attribute ---\n`;
        code += `    # Diese Attribute hat jedes ${klassenName}-Objekt:\n`;

        for (const [attr, wert] of Object.entries(def.attribute)) {
            code += `    # self.${attr} = ${wert}\n`;
        }

        code += `\n`;
        code += `    # --- Eingebaute Methoden ---\n`;
        for (const m of def.methoden) {
            code += `    # def ${m}: ...\n`;
        }

        code += `\n`;
        code += `    # =============================================\n`;
        code += `    # Eigene Methoden hier schreiben:\n`;
        code += `    # =============================================\n`;
        code += `\n`;
        code += `    # Beispiel:\n`;
        code += `    # def verdoppleBreite(self):\n`;
        code += `    #     self.setzeGroesse(self.breite * 2, self.hoehe)\n`;
        code += `\n`;
        code += `    # Schleifen:\n`;
        code += `    # def bewege10Mal(self):\n`;
        code += `    #     for i in range(10):\n`;
        code += `    #         self.verschieben(5, 0)\n`;
        code += `\n`;
        code += `    # Bedingungen:\n`;
        code += `    # def begrenze(self):\n`;
        code += `    #     if self.x > 400:\n`;
        code += `    #         self.setzePosition(0, self.y)\n`;
        code += `    #     elif self.x < 0:\n`;
        code += `    #         self.setzePosition(400, self.y)\n`;
        code += `\n`;
        code += `    # Animation (im Code-Editor aufrufen):\n`;
        code += `    # r1.starteAnimation("bewege10Mal", 100)\n`;
        code += `    # r1.stoppeAnimation()\n`;
        code += `\n`;

        this.editorElement.value = code;
        this._editorInhalte[klassenName] = code;
    }

    // --- Alle Klassen parsen ---
    _parseAlleKlassen() {
        // Aktuellen Editor-Inhalt speichern
        this._editorInhalte[this._aktuelleKlasse] = this.editorElement.value;

        this.eigeneMethoden = {};
        this.konsoleElement.innerHTML = "";
        let gesamtFehler = 0;
        let gesamtMethoden = 0;

        for (const klassenName of Object.keys(this._klassenDef)) {
            const inhalt = this._editorInhalte[klassenName];
            if (!inhalt) continue;

            const ergebnis = this._parseKlassenCode(klassenName, inhalt);
            if (ergebnis.fehler.length > 0) {
                for (const f of ergebnis.fehler) {
                    this._konsoleFehler(`${klassenName}: ${f}`);
                    gesamtFehler++;
                }
            }
            if (ergebnis.methoden.length > 0) {
                this.eigeneMethoden[klassenName.toUpperCase()] = ergebnis.methoden;
                gesamtMethoden += ergebnis.methoden.length;
            }
        }

        // Eigene Methoden an den CodeEditor und InspektorView weitergeben
        this.codeEditor.eigeneMethoden = this.eigeneMethoden;
        this.inspektorView._eigeneMethoden = this.eigeneMethoden;
        this.inspektorView._rendereKlassen();
        this.dokument.aktualisieren(); // Objektkarten neu rendern

        // Eigene Methoden als echte Funktionen auf den Prototypen setzen
        this._registriereMethoden();

        if (gesamtFehler === 0 && gesamtMethoden > 0) {
            this._konsoleErfolg(`${gesamtMethoden} Methode(n) erfolgreich uebernommen.`);
        } else if (gesamtMethoden === 0 && gesamtFehler === 0) {
            this._konsoleInfo("Keine eigenen Methoden gefunden.");
        }
    }

    // --- Python-Code einer Klasse parsen ---
    _parseKlassenCode(klassenName, code) {
        const zeilen = code.split("\n");
        const methoden = [];
        const fehler = [];

        let aktuelleMethode = null;
        let defEinrueckung = -1; // Anzahl fuehrender Leerzeichen der def-Zeile

        for (let i = 0; i < zeilen.length; i++) {
            const zeile = zeilen[i];
            const getrimmteZeile = zeile.trim();

            // Leere Zeilen und Kommentare ueberspringen
            if (getrimmteZeile === "" || getrimmteZeile.startsWith("#")) continue;

            // class-Zeile ueberspringen
            if (getrimmteZeile.startsWith("class ")) continue;

            // Einrueckung dieser Zeile bestimmen (Tabs als 4 Spaces zaehlen)
            const einrueckung = this._zaehleEinrueckung(zeile);

            // def-Zeile erkennen: def methodenName(self, param1, param2):
            const defMatch = getrimmteZeile.match(/^def\s+(\w+)\s*\(\s*self\s*((?:,\s*\w+)*)\s*\)\s*:\s*$/);
            if (defMatch) {
                // Vorherige Methode abschliessen
                if (aktuelleMethode) {
                    if (aktuelleMethode.koerperZeilen.length === 0) {
                        fehler.push(`Methode "${aktuelleMethode.name}" hat keinen Koerper (Zeile ${aktuelleMethode.startZeile}).`);
                    } else {
                        methoden.push(this._finalisiereMethode(aktuelleMethode));
                    }
                }

                const paramStr = defMatch[2] ? defMatch[2].replace(/^\s*,\s*/, "").trim() : "";
                const parameter = paramStr ? paramStr.split(",").map(p => p.trim()) : [];

                defEinrueckung = einrueckung;
                aktuelleMethode = {
                    name: defMatch[1],
                    parameter: parameter,
                    koerperZeilen: [],
                    startZeile: i + 1,
                    klassenName: klassenName,
                };
                continue;
            }

            // Methoden-Koerper: jede Zeile die tiefer eingerueckt ist als die def-Zeile
            if (aktuelleMethode && einrueckung > defEinrueckung) {
                if (getrimmteZeile !== "" && !getrimmteZeile.startsWith("#")) {
                    // Relative Einrueckung speichern (relativ zur def-Zeile)
                    aktuelleMethode.koerperZeilen.push({
                        einrueckung: einrueckung - defEinrueckung,
                        inhalt: getrimmteZeile,
                    });
                }
                continue;
            }

            // Wenn wir hier ankommen und eine Methode offen ist, schliessen
            if (aktuelleMethode) {
                if (aktuelleMethode.koerperZeilen.length === 0) {
                    fehler.push(`Methode "${aktuelleMethode.name}" hat keinen Koerper (Zeile ${aktuelleMethode.startZeile}).`);
                } else {
                    methoden.push(this._finalisiereMethode(aktuelleMethode));
                }
                aktuelleMethode = null;
                defEinrueckung = -1;
            }
        }

        // Letzte Methode abschliessen
        if (aktuelleMethode) {
            if (aktuelleMethode.koerperZeilen.length === 0) {
                fehler.push(`Methode "${aktuelleMethode.name}" hat keinen Koerper (Zeile ${aktuelleMethode.startZeile}).`);
            } else {
                methoden.push(this._finalisiereMethode(aktuelleMethode));
            }
        }

        return { methoden, fehler };
    }

    // Einrueckung zaehlen (Tabs = 4 Spaces)
    _zaehleEinrueckung(zeile) {
        let n = 0;
        for (const ch of zeile) {
            if (ch === " ") n++;
            else if (ch === "\t") n += 4;
            else break;
        }
        return n;
    }

    _finalisiereMethode(m) {
        return {
            name: m.name,
            parameter: m.parameter,
            koerperZeilen: m.koerperZeilen,
            klassenName: m.klassenName,
        };
    }

    // --- Eigene Methoden als echte JS-Funktionen registrieren ---
    _registriereMethoden() {
        // Klassenname -> JS-Klasse zuordnen
        const klassenMap = {
            Rechteck, Ellipse, Linie, Dreieck, TextObjekt, BildObjekt
        };

        for (const [klassenNameUpper, methoden] of Object.entries(this.eigeneMethoden)) {
            // Klassennamen-Mapping: RECHTECK -> Rechteck
            const klassenName = Object.keys(klassenMap).find(k => k.toUpperCase() === klassenNameUpper);
            if (!klassenName) continue;
            const Klasse = klassenMap[klassenName];

            for (const methode of methoden) {
                const koerperZeilen = methode.koerperZeilen;
                const paramNamen = methode.parameter;
                const that = this;

                Klasse.prototype[methode.name] = function (...args) {
                    const self = this;

                    // Parameter als lokale Variablen zuweisen
                    const lokaleVars = {};
                    for (let i = 0; i < paramNamen.length; i++) {
                        lokaleVars[paramNamen[i]] = args[i] !== undefined ? args[i] : undefined;
                    }

                    // Block-Interpreter aufrufen
                    that._fuehreBlockAus(self, koerperZeilen, lokaleVars);
                };
            }
        }
    }

    // --- Block-Interpreter: Fuehrt eine Liste von Zeilen mit Einrueckung aus ---
    // Jede Zeile ist { einrueckung: number, inhalt: string }
    // Kompatibilitaet: Falls eine Zeile ein reiner String ist (alt), wird sie als { einrueckung: 4, inhalt: zeile } behandelt
    _fuehreBlockAus(self, zeilen, lokaleVars, maxIterationen = 10000) {
        let i = 0;
        let iterationsZaehler = 0;

        while (i < zeilen.length) {
            if (++iterationsZaehler > maxIterationen) {
                throw new Error("Maximale Iterationsanzahl ueberschritten (Endlosschleife?).");
            }

            const zeile = this._normalisiereZeile(zeilen[i]);
            const inhalt = zeile.inhalt;
            const meineEinrueckung = zeile.einrueckung;

            // --- for-Schleife: for variable in range(start, ende): ---
            const forMatch = inhalt.match(/^for\s+(\w+)\s+in\s+range\((.+)\)\s*:$/);
            if (forMatch) {
                const varName = forMatch[1];
                const rangeArgs = this._parseRangeArgs(self, forMatch[2], lokaleVars);
                const unterBlock = this._extrahiereUnterBlock(zeilen, i, meineEinrueckung);
                i += 1 + unterBlock.length;

                const start = rangeArgs.length >= 2 ? rangeArgs[0] : 0;
                const ende = rangeArgs.length >= 2 ? rangeArgs[1] : rangeArgs[0];
                const schritt = rangeArgs.length >= 3 ? rangeArgs[2] : 1;

                if (schritt === 0) throw new Error("Schrittweite darf nicht 0 sein.");
                for (let v = start; schritt > 0 ? v < ende : v > ende; v += schritt) {
                    lokaleVars[varName] = v;
                    this._fuehreBlockAus(self, unterBlock, lokaleVars, maxIterationen - iterationsZaehler);
                }
                continue;
            }

            // --- while-Schleife: while bedingung: ---
            const whileMatch = inhalt.match(/^while\s+(.+)\s*:$/);
            if (whileMatch) {
                const bedingungStr = whileMatch[1];
                const unterBlock = this._extrahiereUnterBlock(zeilen, i, meineEinrueckung);
                i += 1 + unterBlock.length;

                let schleifenZaehler = 0;
                while (this._werteBedingungAus(self, bedingungStr, lokaleVars)) {
                    if (++schleifenZaehler > maxIterationen) {
                        throw new Error("While-Schleife: Maximale Iterationsanzahl ueberschritten.");
                    }
                    this._fuehreBlockAus(self, unterBlock, lokaleVars, maxIterationen - iterationsZaehler);
                }
                continue;
            }

            // --- if / elif / else ---
            const ifMatch = inhalt.match(/^if\s+(.+)\s*:$/);
            if (ifMatch) {
                const ergebnis = this._verarbeiteIfBlock(self, zeilen, i, meineEinrueckung, lokaleVars, maxIterationen - iterationsZaehler);
                i = ergebnis.naechsterIndex;
                continue;
            }

            // --- print(ausdruck) ---
            const printMatch = inhalt.match(/^print\((.+)\)$/);
            if (printMatch) {
                const wert = this._werteAusdruckAus(self, printMatch[1].trim(), lokaleVars);
                this._konsoleInfo(String(wert));
                i++;
                continue;
            }

            // --- Einzel-Anweisung ausfuehren ---
            this._fuehreAnweisungAus(self, inhalt, lokaleVars);
            i++;
        }
    }

    // Normalisiert eine Zeile: String -> {einrueckung, inhalt}
    _normalisiereZeile(zeile) {
        if (typeof zeile === "string") {
            return { einrueckung: 4, inhalt: zeile };
        }
        return zeile;
    }

    // Extrahiert den Unterblock (tiefer eingerueckt) nach einer Block-Kopfzeile
    _extrahiereUnterBlock(zeilen, kopfIndex, kopfEinrueckung) {
        const block = [];
        let j = kopfIndex + 1;
        while (j < zeilen.length) {
            const z = this._normalisiereZeile(zeilen[j]);
            if (z.einrueckung <= kopfEinrueckung) break;
            block.push(z);
            j++;
        }
        return block;
    }

    // Verarbeitet if / elif / else Bloecke
    _verarbeiteIfBlock(self, zeilen, startIndex, meineEinrueckung, lokaleVars, maxIterationen) {
        let i = startIndex;
        let ausgefuehrt = false;

        // if-Block
        const ifZeile = this._normalisiereZeile(zeilen[i]);
        const ifMatch = ifZeile.inhalt.match(/^if\s+(.+)\s*:$/);
        const ifBedingung = ifMatch[1];
        const ifBlock = this._extrahiereUnterBlock(zeilen, i, meineEinrueckung);
        i += 1 + ifBlock.length;

        if (this._werteBedingungAus(self, ifBedingung, lokaleVars)) {
            this._fuehreBlockAus(self, ifBlock, lokaleVars, maxIterationen);
            ausgefuehrt = true;
        }

        // elif / else Bloecke
        while (i < zeilen.length) {
            const naechsteZeile = this._normalisiereZeile(zeilen[i]);
            if (naechsteZeile.einrueckung !== meineEinrueckung) break;

            const elifMatch = naechsteZeile.inhalt.match(/^elif\s+(.+)\s*:$/);
            if (elifMatch) {
                const elifBlock = this._extrahiereUnterBlock(zeilen, i, meineEinrueckung);
                i += 1 + elifBlock.length;

                if (!ausgefuehrt && this._werteBedingungAus(self, elifMatch[1], lokaleVars)) {
                    this._fuehreBlockAus(self, elifBlock, lokaleVars, maxIterationen);
                    ausgefuehrt = true;
                }
                continue;
            }

            const elseMatch = naechsteZeile.inhalt.match(/^else\s*:$/);
            if (elseMatch) {
                const elseBlock = this._extrahiereUnterBlock(zeilen, i, meineEinrueckung);
                i += 1 + elseBlock.length;

                if (!ausgefuehrt) {
                    this._fuehreBlockAus(self, elseBlock, lokaleVars, maxIterationen);
                }
                continue;
            }

            // Kein elif/else mehr -> Block beenden
            break;
        }

        return { naechsterIndex: i };
    }

    // range() Argumente parsen: range(5), range(1, 10), range(0, 20, 2)
    _parseRangeArgs(self, argsStr, lokaleVars) {
        return argsStr.split(",").map(a => {
            const wert = this._werteAusdruckAus(self, a.trim(), lokaleVars);
            return Math.floor(Number(wert));
        });
    }

    // --- Eine Anweisung innerhalb einer eigenen Methode ausfuehren ---
    _fuehreAnweisungAus(self, anweisung, lokaleVars) {
        // Pattern: self.methode(args)
        const methodenMatch = anweisung.match(/^self\.(\w+)\(([^)]*)\)$/);
        if (methodenMatch) {
            const methName = methodenMatch[1];
            const argsStr = methodenMatch[2];
            const args = this._parseMethodenArgs(self, argsStr, lokaleVars);

            if (typeof self[methName] === "function") {
                self[methName](...args);
            } else {
                throw new Error(`Methode "${methName}" existiert nicht.`);
            }
            return;
        }

        // Pattern: self.attribut = ausdruck
        const selfZuweisungMatch = anweisung.match(/^self\.(\w+)\s*=\s*(.+)$/);
        if (selfZuweisungMatch) {
            const attrName = selfZuweisungMatch[1];
            const wert = this._werteAusdruckAus(self, selfZuweisungMatch[2].trim(), lokaleVars);
            self[attrName] = wert;
            return;
        }

        // Pattern: ObjektName.methode(args) — Zugriff auf andere Objekte via codeEditor.variablen
        const fremdMethodenMatch = anweisung.match(/^(\w+)\.(\w+)\(([^)]*)\)$/);
        if (fremdMethodenMatch) {
            const objName = fremdMethodenMatch[1];
            const methName = fremdMethodenMatch[2];
            const argsStr = fremdMethodenMatch[3];
            const obj = this._loeseName(objName, lokaleVars);
            if (obj === undefined || obj === null) {
                throw new Error(`Objekt "${objName}" nicht gefunden. Verfuegbar: ${this._verfuegbareNamen(lokaleVars)}`);
            }
            if (typeof obj[methName] !== "function") {
                throw new Error(`Methode "${methName}" existiert nicht auf "${objName}".`);
            }
            const args = this._parseMethodenArgs(self, argsStr, lokaleVars);
            obj[methName](...args);
            return;
        }

        // Pattern: ObjektName.attribut = ausdruck — Attribut eines anderen Objekts setzen
        const fremdZuweisungMatch = anweisung.match(/^(\w+)\.(\w+)\s*=\s*(.+)$/);
        if (fremdZuweisungMatch) {
            const objName = fremdZuweisungMatch[1];
            const attrName = fremdZuweisungMatch[2];
            const obj = this._loeseName(objName, lokaleVars);
            if (obj === undefined || obj === null) {
                throw new Error(`Objekt "${objName}" nicht gefunden. Verfuegbar: ${this._verfuegbareNamen(lokaleVars)}`);
            }
            const wert = this._werteAusdruckAus(self, fremdZuweisungMatch[3].trim(), lokaleVars);
            obj[attrName] = wert;
            return;
        }

        // Pattern: varName = TypName(args) — neues Objekt erstellen
        // z.B. Feuerball = BildObjekt(self.x, self.y, 50, 50, "feuerball.png")
        const erstellungsMatch = anweisung.match(/^(\w+)\s*=\s*(Rechteck|Ellipse|Linie|Dreieck|TextObjekt|Text|BildObjekt|Bild)\s*\(([^)]*)\)\s*$/);
        if (erstellungsMatch) {
            const varName = erstellungsMatch[1];
            const klassenName = erstellungsMatch[2];
            const argsStr = erstellungsMatch[3];
            this._erstelleObjekt(self, varName, klassenName, argsStr, lokaleVars);
            return;
        }

        // Pattern: entferne(objName) oder entferne("objName") — Objekt loeschen
        const entferneMatch = anweisung.match(/^entferne\(\s*"?(\w+)"?\s*\)$/);
        if (entferneMatch) {
            const objName = entferneMatch[1];
            this._entferneObjekt(objName, lokaleVars);
            return;
        }

        // Pattern: lokale Variable zuweisen: varName = ausdruck
        const varZuweisungMatch = anweisung.match(/^(\w+)\s*=\s*(.+)$/);
        if (varZuweisungMatch) {
            const varName = varZuweisungMatch[1];
            // Reservierte Woerter nicht als Variable
            if (!["if", "elif", "else", "for", "while", "def", "class", "True", "False", "print"].includes(varName)) {
                const wert = this._werteAusdruckAus(self, varZuweisungMatch[2].trim(), lokaleVars);
                lokaleVars[varName] = wert;
                return;
            }
        }

        // Pattern: print(ausdruck) — Fallback fuer flache Ausfuehrung
        const printMatch = anweisung.match(/^print\((.+)\)$/);
        if (printMatch) {
            const wert = this._werteAusdruckAus(self, printMatch[1].trim(), lokaleVars);
            this._konsoleInfo(String(wert));
            return;
        }

        throw new Error(`Unbekannte Anweisung: "${anweisung}"`);
    }

    // Namen in lokalen Variablen ODER in codeEditor.variablen nachschlagen
    _loeseName(name, lokaleVars) {
        if (lokaleVars[name] !== undefined) return lokaleVars[name];
        if (this.codeEditor && this.codeEditor.variablen && this.codeEditor.variablen[name] !== undefined) {
            return this.codeEditor.variablen[name];
        }
        return undefined;
    }

    // Alle verfuegbaren Namen fuer Fehlermeldungen aufzaehlen
    _verfuegbareNamen(lokaleVars) {
        const lokal = Object.keys(lokaleVars);
        const global = this.codeEditor && this.codeEditor.variablen ? Object.keys(this.codeEditor.variablen) : [];
        return [...new Set([...lokal, ...global])].join(", ");
    }

    // --- Argumente fuer Methoden-Aufrufe in eigenen Methoden parsen ---
    _parseMethodenArgs(self, argsStr, lokaleVars) {
        if (!argsStr || argsStr.trim() === "") return [];

        return argsStr.split(",").map(arg => {
            return this._werteAusdruckAus(self, arg.trim(), lokaleVars);
        });
    }

    // --- Objekt erstellen aus Klassen-Editor-Methode ---
    // z.B. Feuerball = BildObjekt(self.x, self.y, 50, 50, "feuerball.png")
    _erstelleObjekt(self, varName, klassenName, argsStr, lokaleVars) {
        const klassenMap = {
            Rechteck: Rechteck,
            Ellipse: Ellipse,
            Linie: Linie,
            Dreieck: Dreieck,
            Text: TextObjekt,
            TextObjekt: TextObjekt,
            Bild: BildObjekt,
            BildObjekt: BildObjekt,
        };

        const Klasse = klassenMap[klassenName];
        if (!Klasse) {
            throw new Error(`Unbekannte Klasse "${klassenName}". Verfuegbar: ${Object.keys(klassenMap).join(", ")}`);
        }

        // Argumente auswerten (koennen self.x, lokale Variablen, etc. enthalten)
        const args = this._parseMethodenArgs(self, argsStr, lokaleVars);

        // Instanz erstellen
        let obj;
        try {
            obj = new Klasse(...args);
        } catch (e) {
            throw new Error(`Fehler beim Erstellen von ${klassenName}: ${e.message}`);
        }

        // Name setzen
        obj._name = varName;

        // Falls ein Objekt mit diesem Namen schon existiert -> erst entfernen
        const vorhandenes = this._loeseName(varName, lokaleVars);
        if (vorhandenes && typeof vorhandenes === "object" && vorhandenes !== self) {
            // Animation stoppen, falls vorhanden
            if (typeof vorhandenes.stoppeAnimation === "function") {
                vorhandenes.stoppeAnimation();
            }
            this.dokument.entfernen(vorhandenes);
        }

        // Im CodeEditor registrieren (damit andere Methoden/Code-Editor darauf zugreifen koennen)
        if (this.codeEditor) {
            this.codeEditor.variablen[varName] = obj;
        }

        // Zum Dokument hinzufuegen (loest Neuzeichnung + Inspektor-Update aus)
        this.dokument.hinzufuegen(obj);

        this._konsoleInfo(`${varName} = neu ${klassenName}(${argsStr}) erstellt.`);
    }

    // --- Objekt entfernen aus Klassen-Editor-Methode ---
    // z.B. entferne(Feuerball) oder entferne("Feuerball")
    _entferneObjekt(objName, lokaleVars) {
        const obj = this._loeseName(objName, lokaleVars);
        if (!obj || typeof obj !== "object") {
            throw new Error(`Objekt "${objName}" nicht gefunden. Verfuegbar: ${this._verfuegbareNamen(lokaleVars)}`);
        }

        // Animation stoppen, falls vorhanden
        if (typeof obj.stoppeAnimation === "function") {
            obj.stoppeAnimation();
        }

        // Aus CodeEditor-Variablen entfernen
        if (this.codeEditor && this.codeEditor.variablen[objName]) {
            delete this.codeEditor.variablen[objName];
        }

        // Aus Dokument entfernen
        this.dokument.entfernen(obj);

        this._konsoleInfo(`"${objName}" wurde entfernt.`);
    }

    // --- Bedingung auswerten (gibt Boolean zurueck) ---
    _werteBedingungAus(self, bedingung, lokaleVars) {
        bedingung = bedingung.trim();

        // "and" und "or" Verknuepfungen (einfache Ebene)
        // Zuerst "or" aufteilen (niedrigere Prioritaet)
        if (bedingung.includes(" or ") || bedingung.includes(" oder ")) {
            const teile = bedingung.split(/\s+(?:or|oder)\s+/);
            return teile.some(teil => this._werteBedingungAus(self, teil, lokaleVars));
        }

        // Dann "and" aufteilen (hoehere Prioritaet)
        if (bedingung.includes(" and ") || bedingung.includes(" und ")) {
            const teile = bedingung.split(/\s+(?:and|und)\s+/);
            return teile.every(teil => this._werteBedingungAus(self, teil, lokaleVars));
        }

        // "not" / "nicht" Praefixf
        const notMatch = bedingung.match(/^(?:not|nicht)\s+(.+)$/);
        if (notMatch) {
            return !this._werteBedingungAus(self, notMatch[1], lokaleVars);
        }

        // Vergleichsoperatoren
        const vergleichMatch = bedingung.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
        if (vergleichMatch) {
            const links = this._werteAusdruckAus(self, vergleichMatch[1].trim(), lokaleVars);
            const op = vergleichMatch[2];
            const rechts = this._werteAusdruckAus(self, vergleichMatch[3].trim(), lokaleVars);

            switch (op) {
                case "==": return links == rechts;
                case "!=": return links != rechts;
                case ">=": return links >= rechts;
                case "<=": return links <= rechts;
                case ">": return links > rechts;
                case "<": return links < rechts;
            }
        }

        // Einfacher Wahrheitswert
        const wert = this._werteAusdruckAus(self, bedingung, lokaleVars);
        return !!wert;
    }

    // --- Ausdruecke auswerten (erweitert) ---
    _werteAusdruckAus(self, ausdruck, lokaleVars) {
        ausdruck = ausdruck.trim();

        // String-Literal
        if ((ausdruck.startsWith('"') && ausdruck.endsWith('"')) ||
            (ausdruck.startsWith("'") && ausdruck.endsWith("'"))) {
            return ausdruck.slice(1, -1);
        }

        // Zahl
        if (!isNaN(ausdruck) && ausdruck !== "" && !ausdruck.includes(" ")) {
            return parseFloat(ausdruck);
        }

        // Boolean
        if (ausdruck === "True" || ausdruck === "true" || ausdruck === "wahr") return true;
        if (ausdruck === "False" || ausdruck === "false" || ausdruck === "falsch") return false;

        // None / null
        if (ausdruck === "None" || ausdruck === "null") return null;

        // abs() Funktion
        const absMatch = ausdruck.match(/^abs\((.+)\)$/);
        if (absMatch) {
            return Math.abs(this._werteAusdruckAus(self, absMatch[1], lokaleVars));
        }

        // min() / max() Funktionen
        const minMatch = ausdruck.match(/^min\((.+)\)$/);
        if (minMatch) {
            const args = minMatch[1].split(",").map(a => this._werteAusdruckAus(self, a.trim(), lokaleVars));
            return Math.min(...args);
        }
        const maxMatch = ausdruck.match(/^max\((.+)\)$/);
        if (maxMatch) {
            const args = maxMatch[1].split(",").map(a => this._werteAusdruckAus(self, a.trim(), lokaleVars));
            return Math.max(...args);
        }

        // int() / float() Konvertierung
        const intMatch = ausdruck.match(/^int\((.+)\)$/);
        if (intMatch) {
            return Math.floor(this._werteAusdruckAus(self, intMatch[1], lokaleVars));
        }
        const floatMatch = ausdruck.match(/^float\((.+)\)$/);
        if (floatMatch) {
            return parseFloat(this._werteAusdruckAus(self, floatMatch[1], lokaleVars));
        }

        // str() Konvertierung
        const strMatch = ausdruck.match(/^str\((.+)\)$/);
        if (strMatch) {
            return String(this._werteAusdruckAus(self, strMatch[1], lokaleVars));
        }

        // ObjektName.attribut direkt (z.B. "Feuerball.x")
        const fremdAttrDirektMatch = ausdruck.match(/^(\w+)\.(\w+)$/);
        if (fremdAttrDirektMatch) {
            const obj = this._loeseName(fremdAttrDirektMatch[1], lokaleVars);
            if (obj !== undefined && obj !== null && typeof obj === "object") {
                return obj[fremdAttrDirektMatch[2]];
            }
        }

        // Arithmetik/Vergleich mit self-Attributen, lokalen Variablen, ObjektName.attribut oder Parametern
        if (ausdruck.includes("self.") || ausdruck.includes("+") || ausdruck.includes("-") ||
            ausdruck.includes("*") || ausdruck.includes("/") || ausdruck.includes("%") ||
            ausdruck.includes("(") || ausdruck.includes(".") ||
            Object.keys(lokaleVars).some(p => ausdruck.includes(p))) {
            try {
                // self.attribut durch Werte ersetzen
                let jsAusdruck = ausdruck.replace(/self\.(\w+)/g, (match, attr) => {
                    const wert = self[attr];
                    if (typeof wert === "string") return JSON.stringify(wert);
                    if (wert === null || wert === undefined) return "null";
                    return wert;
                });

                // ObjektName.attribut durch Werte ersetzen (z.B. Feuerball.x -> 42)
                jsAusdruck = jsAusdruck.replace(/\b([A-Za-z_]\w*)\.([A-Za-z_]\w*)\b/g, (match, objName, attrName) => {
                    const obj = this._loeseName(objName, lokaleVars);
                    if (obj !== undefined && obj !== null && typeof obj === "object") {
                        const wert = obj[attrName];
                        if (typeof wert === "string") return JSON.stringify(wert);
                        if (wert === null || wert === undefined) return "null";
                        if (typeof wert === "number") return wert;
                    }
                    return match; // unveraendert lassen, wenn nicht aufloesbar
                });

                // Lokale Variablen und Parameter durch Werte ersetzen
                // Sortiere nach Laenge (laengste zuerst) um Teilstring-Ersetzungen zu vermeiden
                const sortierteVars = Object.keys(lokaleVars).sort((a, b) => b.length - a.length);
                for (const varName of sortierteVars) {
                    const wert = lokaleVars[varName];
                    const regex = new RegExp(`\\b${varName}\\b`, "g");
                    if (typeof wert === "string") {
                        jsAusdruck = jsAusdruck.replace(regex, JSON.stringify(wert));
                    } else if (wert === null || wert === undefined) {
                        jsAusdruck = jsAusdruck.replace(regex, "null");
                    } else {
                        jsAusdruck = jsAusdruck.replace(regex, wert);
                    }
                }

                // Python-Operatoren uebersetzen
                jsAusdruck = jsAusdruck.replace(/\s+\/\/\s+/g, " / ").replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false");

                // Sicher auswerten
                return Function(`"use strict"; return (${jsAusdruck})`)();
            } catch (e) {
                throw new Error(`Ausdruck konnte nicht ausgewertet werden: "${ausdruck}" -> ${e.message}`);
            }
        }

        // Lokale Variable direkt
        if (lokaleVars[ausdruck] !== undefined) {
            return lokaleVars[ausdruck];
        }

        // self.attribut direkt
        if (ausdruck.startsWith("self.")) {
            return self[ausdruck.substring(5)];
        }

        // Als String behandeln (Fallback)
        return ausdruck;
    }

    // --- Timer-Funktionen fuer Animationen ---
    // Startet eine wiederholte Ausfuehrung einer eigenen Methode
    // Nutzt requestAnimationFrame statt setInterval fuer fluessige, Display-synchrone Animation
    // Nutzung aus dem Code-Editor: objekt.starteAnimation(methodenName, intervallMs)
    _registriereTimerMethoden() {
        const klassenMap = { Rechteck, Ellipse, Linie, Dreieck, TextObjekt, BildObjekt };
        const that = this;

        for (const Klasse of Object.values(klassenMap)) {
            if (!Klasse.prototype.starteAnimation) {
                Klasse.prototype.starteAnimation = function (methodenName, intervallMs) {
                    if (typeof this[methodenName] !== "function") {
                        throw new Error(`Methode "${methodenName}" existiert nicht.`);
                    }
                    // Vorherige Animation stoppen
                    if (this._animationTimer) {
                        cancelAnimationFrame(this._animationTimer);
                        this._animationTimer = null;
                    }

                    const intervall = intervallMs || 50;
                    let letzteZeit = performance.now();
                    const obj = this;

                    const animationsSchritt = (aktuelleZeit) => {
                        const vergangeneZeit = aktuelleZeit - letzteZeit;
                        if (vergangeneZeit >= intervall) {
                            letzteZeit = aktuelleZeit - (vergangeneZeit % intervall);
                            try {
                                obj[methodenName]();
                                that.dokument.aktualisieren();
                            } catch (e) {
                                obj._animationTimer = null;
                                that._konsoleFehler(`Animation gestoppt: ${e.message}`);
                                return; // Animation bei Fehler beenden
                            }
                        }
                        obj._animationTimer = requestAnimationFrame(animationsSchritt);
                    };

                    this._animationTimer = requestAnimationFrame(animationsSchritt);
                };
            }

            if (!Klasse.prototype.stoppeAnimation) {
                Klasse.prototype.stoppeAnimation = function () {
                    if (this._animationTimer) {
                        cancelAnimationFrame(this._animationTimer);
                        this._animationTimer = null;
                    }
                };
            }
        }
    }

    // --- Konsole ---
    _konsoleInfo(text) {
        this.konsoleElement.innerHTML += `<div class="info">&gt; ${this._escapeHtml(text)}</div>`;
        this.konsoleElement.scrollTop = this.konsoleElement.scrollHeight;
    }

    _konsoleErfolg(text) {
        this.konsoleElement.innerHTML += `<div class="erfolg">${this._escapeHtml(text)}</div>`;
        this.konsoleElement.scrollTop = this.konsoleElement.scrollHeight;
    }

    _konsoleFehler(text) {
        this.konsoleElement.innerHTML += `<div class="fehler">${this._escapeHtml(text)}</div>`;
        this.konsoleElement.scrollTop = this.konsoleElement.scrollHeight;
    }

    _escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Serialisierung ---
    gibDaten() {
        // Aktuellen Editor-Inhalt speichern
        this._editorInhalte[this._aktuelleKlasse] = this.editorElement.value;
        return {
            editorInhalte: { ...this._editorInhalte },
            eigeneMethoden: { ...this.eigeneMethoden },
        };
    }

    ladeDaten(daten) {
        if (!daten) return;
        if (daten.editorInhalte) {
            this._editorInhalte = { ...daten.editorInhalte };
        }
        if (daten.eigeneMethoden) {
            this.eigeneMethoden = { ...daten.eigeneMethoden };
        }
        // Aktive Klasse neu laden
        this._ladeKlasse(this._aktuelleKlasse);
        // Methoden registrieren und Inspektor aktualisieren
        this.codeEditor.eigeneMethoden = this.eigeneMethoden;
        this.inspektorView._eigeneMethoden = this.eigeneMethoden;
        this._registriereMethoden();
        this.inspektorView._rendereKlassen();
        this.dokument.aktualisieren();
    }
}


// ============================================================
// 6. INITIALISIERUNG – Alles zusammenfuegen
// ============================================================

(async function init() {
    // --- Model ---
    const dokument = new Dokument();

    // --- DateiManager (vor Views initialisieren, damit BildObjekt darauf zugreifen kann) ---
    const dateiManager = new DateiManager();
    await dateiManager.initialisieren();

    // --- Views ---
    const canvasElement = document.getElementById("zeichenflaeche");
    const canvasView = new CanvasView(canvasElement, dokument);

    const klassenDiv = document.getElementById("klassenansicht");
    const objektDiv = document.getElementById("objektansicht");
    const inspektorView = new InspektorView(klassenDiv, objektDiv, dokument);

    // --- Linkes Panel: Hierarchie + Dateien ---
    const hierarchieListe = document.getElementById("hierarchie-liste");
    const hierarchieView = new HierarchieView(hierarchieListe, dokument);

    const dateienListe = document.getElementById("dateien-liste");
    const dateienPanel = document.getElementById("lp-tab-dateien");
    const dateienView = new DateienView(dateienListe, dateiManager, dateienPanel);

    // Tab-Umschaltung
    (function initLinkesPanelTabs() {
        const tabs = document.querySelectorAll(".linkes-panel-tab");
        const inhalte = {
            hierarchie: document.getElementById("lp-tab-hierarchie"),
            dateien: document.getElementById("lp-tab-dateien"),
        };

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const ziel = tab.dataset.lpTab;
                // Alle Tabs deaktivieren
                tabs.forEach(t => t.classList.remove("aktiv"));
                // Alle Inhalte verstecken
                Object.values(inhalte).forEach(el => el.style.display = "none");
                // Aktiven Tab + Inhalt anzeigen
                tab.classList.add("aktiv");
                if (inhalte[ziel]) inhalte[ziel].style.display = "";
            });
        });
    })();

    // --- Controller ---
    const controller = new Controller(dokument, canvasView);

    // --- Code-Editor ---
    const codeEditor = new CodeEditor(dokument, controller);
    controller._codeEditorRef = codeEditor;

    // --- Methoden-Editor ---
    const methodenEditor = new MethodenEditor(dokument, codeEditor, inspektorView, controller);

    // Hierarchie-Klick -> Objekt auf Canvas auswaehlen
    hierarchieView.setzeKlickHandler((index) => {
        controller.waehleObjektAus(index);
    });

    // --- Bidirektionale Synchronisation ---

    // Inspektor-Klick -> Objekt auf Canvas auswaehlen
    inspektorView.setzeKlickHandler((index) => {
        controller.waehleObjektAus(index);
    });

    // Inspektor-Doppelklick -> Objekt umbenennen
    inspektorView.setzeUmbenennenHandler((index, neuerName, alterName) => {
        const obj = dokument.objekte[index];
        if (!obj) return;

        // Alten Key aus CodeEditor-Variablen entfernen, neuen setzen
        if (alterName && codeEditor.variablen[alterName] === obj) {
            delete codeEditor.variablen[alterName];
        }
        obj._name = neuerName;
        codeEditor.variablen[neuerName] = obj;

        dokument.aktualisieren();
    });

    // Wenn Objekte per Maus erstellt werden -> im Code-Editor registrieren
    dokument.beobachterHinzufuegen(() => {
        for (const obj of dokument.objekte) {
            codeEditor.registriereExternesObjekt(obj);
        }
    });

    // Vor Projekt-Laden: Dateien importieren (damit BildObjekt._ladeBild Dateinamen aufloesen kann)
    controller._onVorProjektLaden = async (daten) => {
        if (daten && daten.dateien) {
            await dateiManager.importiereVonProjekt(daten.dateien);
        }
    };

    // Nach Projekt-Laden: CodeEditor-Variablen neu synchronisieren + MethodenEditor-Daten laden
    controller._onProjektGeladen = (daten) => {
        codeEditor.variablen = { dokument1: dokument };
        for (const obj of dokument.objekte) {
            if (obj._name) {
                codeEditor.variablen[obj._name] = obj;
            }
        }
        // MethodenEditor-Daten wiederherstellen
        if (daten && daten.methodenEditor) {
            methodenEditor.ladeDaten(daten.methodenEditor);
        }
    };

    // MethodenEditor-Daten beim Speichern einbinden (ueberschreibt Controller._projektSpeichern)
    controller._projektSpeichern = function () {
        const daten = this.dokument.projektSpeichern();

        // Code-Editor-Inhalt mitspeichern
        const codeEditorEl = document.getElementById("code-editor");
        if (codeEditorEl) {
            daten.codeEditorInhalt = codeEditorEl.value;
        }

        // MethodenEditor-Daten mitspeichern
        daten.methodenEditor = methodenEditor.gibDaten();

        // Dateien (Bilder) aus DateiManager einbetten
        daten.dateien = dateiManager.exportiereFuerProjekt();

        const json = JSON.stringify(daten, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `oop-projekt-${this._zeitstempel()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Initial die Cursor-Klasse setzen
    controller._aktualisiereCursor();

    // Initiales Rendering (sofort, nicht gebatcht)
    dokument.sofortAktualisieren();

    // --- Editor-Bereich: Resize (Hoehe ziehen) ---
    (function initEditorResize() {
        const editorBereich = document.getElementById("editor-bereich");
        const resizeHandle = document.getElementById("editor-resize-handle");
        let istAmZiehen = false;
        let startY = 0;
        let startHoehe = 0;

        resizeHandle.addEventListener("mousedown", (e) => {
            if (editorBereich.classList.contains("eingeklappt")) return;
            istAmZiehen = true;
            startY = e.clientY;
            startHoehe = editorBereich.offsetHeight;
            resizeHandle.classList.add("aktiv");
            document.body.style.cursor = "ns-resize";
            document.body.style.userSelect = "none";
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (!istAmZiehen) return;
            const diff = startY - e.clientY;
            const neueHoehe = Math.max(100, Math.min(window.innerHeight * 0.7, startHoehe + diff));
            editorBereich.style.height = neueHoehe + "px";
            editorBereich.style.transition = "none";
            // Canvas-Groesse waehrend des Ziehens aktualisieren
            canvasView._groesseAnpassenDebounced();
        });

        document.addEventListener("mouseup", () => {
            if (!istAmZiehen) return;
            istAmZiehen = false;
            resizeHandle.classList.remove("aktiv");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            editorBereich.style.transition = "";
            // Canvas-Groesse nach dem Ziehen final aktualisieren
            canvasView._groesseAnpassenDebounced();
        });
    })();

    // --- Editor-Bereich: Ein-/Ausklappen ---
    (function initEditorEinklappen() {
        const editorBereich = document.getElementById("editor-bereich");
        const btn = document.getElementById("editor-einklappen-btn");
        let gespeicherteHoehe = editorBereich.style.height || "240px";

        btn.addEventListener("click", () => {
            if (editorBereich.classList.contains("eingeklappt")) {
                // Ausklappen
                editorBereich.classList.remove("eingeklappt");
                editorBereich.style.height = gespeicherteHoehe;
            } else {
                // Einklappen
                gespeicherteHoehe = editorBereich.style.height || editorBereich.offsetHeight + "px";
                editorBereich.classList.add("eingeklappt");
            }
            // Canvas-Groesse nach CSS-Transition aktualisieren
            canvasView._groesseAnpassenDebounced();
        });

        // Sicherstellen, dass Canvas nach Transition-Ende korrekt resized wird
        editorBereich.addEventListener("transitionend", () => {
            canvasView._groesseAnpassenDebounced();
        });
    })();

    // --- Inspektor-Sections: Ein-/Ausklappen (Klassen- und Objektansicht) ---
    (function initInspektorSections() {
        const sectionHeaders = document.querySelectorAll(".inspektor-section-header");
        sectionHeaders.forEach(header => {
            header.addEventListener("click", () => {
                const bereich = header.parentElement;
                bereich.classList.toggle("inspektor-section-eingeklappt");
            });
        });
    })();

    // --- Tab-Taste in Textareas (Code-Editor + Klassen-Editor) ---
    (function initTabSupport() {
        const textareas = [
            document.getElementById("code-editor"),
            document.getElementById("klassen-editor"),
        ];

        for (const textarea of textareas) {
            if (!textarea) continue;
            textarea.addEventListener("keydown", (e) => {
                if (e.key === "Tab") {
                    e.preventDefault();
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const wert = textarea.value;

                    if (e.shiftKey) {
                        // Shift+Tab: Einrueckung der aktuellen Zeile(n) entfernen
                        const vorher = wert.substring(0, start);
                        const zeilenStart = vorher.lastIndexOf("\n") + 1;
                        const zeile = wert.substring(zeilenStart, end);

                        if (start === end) {
                            // Einzelne Zeile
                            const aktuelleZeile = wert.substring(zeilenStart, wert.indexOf("\n", start) === -1 ? wert.length : wert.indexOf("\n", start));
                            if (aktuelleZeile.startsWith("    ")) {
                                textarea.value = wert.substring(0, zeilenStart) + aktuelleZeile.substring(4) + wert.substring(zeilenStart + aktuelleZeile.length);
                                textarea.selectionStart = textarea.selectionEnd = Math.max(zeilenStart, start - 4);
                            } else if (aktuelleZeile.startsWith("\t")) {
                                textarea.value = wert.substring(0, zeilenStart) + aktuelleZeile.substring(1) + wert.substring(zeilenStart + aktuelleZeile.length);
                                textarea.selectionStart = textarea.selectionEnd = Math.max(zeilenStart, start - 1);
                            }
                        }
                    } else {
                        // Tab: 4 Leerzeichen einfuegen
                        textarea.value = wert.substring(0, start) + "    " + wert.substring(end);
                        textarea.selectionStart = textarea.selectionEnd = start + 4;
                    }
                }
            });
        }
    })();
})();
