/**
 * VererbungsView – Interaktives Vererbungs-Diagramm (Klassenhierarchie).
 *
 * Zeigt die Klassen-Hierarchie als visuellen Baum an:
 *   Zeichenobjekt (abstrakt)
 *     ├─ Rechteck
 *     ├─ Ellipse
 *     ├─ Dreieck
 *     ├─ Polygon
 *     ├─ Linie
 *     ├─ TextObjekt
 *     └─ BildObjekt
 *
 * Jede Klasse ist aufklappbar und zeigt geerbte + eigene Attribute/Methoden.
 */
export class VererbungsView {
    constructor(container) {
        this.container = container;
        this._hierarchie = this._erstelleHierarchie();
        this._aufgeklappt = new Set(["Zeichenobjekt"]); // Wurzel standardmaessig offen
        this.zeichnen();
    }

    _erstelleHierarchie() {
        return {
            name: "Zeichenobjekt",
            abstrakt: true,
            attribute: [
                "x : Zahl",
                "y : Zahl",
                "breite : Zahl",
                "hoehe : Zahl",
                "fuellFarbe : Text",
                "linienFarbe : Text",
                "linienStaerke : Zahl",
                "ausgewaehlt : Boolean",
            ],
            methoden: [
                "zeichnen(ctx)*",
                "verschieben(dx, dy)",
                "setzePosition(x, y)",
                "setzeFarbe(farbe)",
                "setzeLinienFarbe(farbe)",
                "setzeGroesse(b, h)",
                "enthaeltPunkt(px, py)",
                "gibBoundingBox()",
                "zuJSON()",
            ],
            kinder: [
                {
                    name: "Rechteck",
                    attribute: [],
                    methoden: ["zeichnen(ctx)", "enthaeltPunkt(px, py)"],
                },
                {
                    name: "Ellipse",
                    attribute: [],
                    methoden: ["zeichnen(ctx)", "enthaeltPunkt(px, py)"],
                },
                {
                    name: "Dreieck",
                    attribute: [],
                    methoden: ["zeichnen(ctx)", "enthaeltPunkt(px, py)"],
                },
                {
                    name: "Polygon",
                    attribute: ["eckenAnzahl : Zahl"],
                    methoden: ["zeichnen(ctx)", "enthaeltPunkt(px, py)", "setzeEckenAnzahl(n)"],
                },
                {
                    name: "Linie",
                    attribute: ["x2 : Zahl", "y2 : Zahl"],
                    methoden: ["zeichnen(ctx)", "enthaeltPunkt(px, py)", "verschieben(dx, dy)"],
                },
                {
                    name: "TextObjekt",
                    attribute: ["inhalt : Text", "schriftGroesse : Zahl"],
                    methoden: ["zeichnen(ctx)", "enthaeltPunkt(px, py)", "setzeText(text)"],
                },
                {
                    name: "BildObjekt",
                    attribute: ["quelle : Text"],
                    methoden: ["zeichnen(ctx)"],
                },
            ],
        };
    }

    zeichnen() {
        this.container.innerHTML = "";
        const baum = this._erstelleKnoten(this._hierarchie, 0, true);
        this.container.appendChild(baum);
    }

    _erstelleKnoten(knoten, tiefe, istLetzter) {
        const div = document.createElement("div");
        div.className = "vererbung-knoten";
        div.style.marginLeft = (tiefe * 16) + "px";

        const hatKinder = knoten.kinder && knoten.kinder.length > 0;
        const istOffen = this._aufgeklappt.has(knoten.name);

        // Kopfzeile
        const kopf = document.createElement("div");
        kopf.className = "vererbung-kopf";
        if (knoten.abstrakt) kopf.classList.add("abstrakt");

        // Toggle-Pfeil
        const pfeil = document.createElement("span");
        pfeil.className = "vererbung-pfeil";
        pfeil.textContent = hatKinder ? (istOffen ? "\u25BC" : "\u25B6") : "\u00A0";
        pfeil.style.cursor = hatKinder ? "pointer" : "default";
        kopf.appendChild(pfeil);

        // Klassenname
        const name = document.createElement("span");
        name.className = "vererbung-name";
        name.textContent = knoten.name;
        if (knoten.abstrakt) {
            name.style.fontStyle = "italic";
        }
        kopf.appendChild(name);

        // Farb-Indikator
        const farbe = this._klassenFarbe(knoten.name);
        const farbPunkt = document.createElement("span");
        farbPunkt.className = "vererbung-farb-punkt";
        farbPunkt.style.backgroundColor = farbe;
        kopf.appendChild(farbPunkt);

        kopf.addEventListener("click", () => {
            if (this._aufgeklappt.has(knoten.name)) {
                this._aufgeklappt.delete(knoten.name);
            } else {
                this._aufgeklappt.add(knoten.name);
            }
            this.zeichnen();
        });

        div.appendChild(kopf);

        // Details (Attribute + Methoden), wenn aufgeklappt
        if (istOffen) {
            const details = document.createElement("div");
            details.className = "vererbung-details";
            details.style.marginLeft = "18px";

            // Attribute
            if (knoten.attribute && knoten.attribute.length > 0) {
                const attrHeader = document.createElement("div");
                attrHeader.className = "vererbung-section-label";
                attrHeader.textContent = "Attribute:";
                details.appendChild(attrHeader);

                for (const attr of knoten.attribute) {
                    const zeile = document.createElement("div");
                    zeile.className = "vererbung-zeile vererbung-attr";
                    zeile.textContent = "- " + attr;
                    details.appendChild(zeile);
                }
            }

            // Methoden
            if (knoten.methoden && knoten.methoden.length > 0) {
                const methHeader = document.createElement("div");
                methHeader.className = "vererbung-section-label";
                methHeader.textContent = "Methoden:";
                details.appendChild(methHeader);

                for (const meth of knoten.methoden) {
                    const zeile = document.createElement("div");
                    zeile.className = "vererbung-zeile vererbung-meth";
                    zeile.textContent = "+ " + meth;
                    if (meth.endsWith("*")) {
                        zeile.classList.add("abstrakt");
                        zeile.textContent = "+ " + meth.slice(0, -1) + " {abstrakt}";
                    }
                    details.appendChild(zeile);
                }
            }

            div.appendChild(details);

            // Verbindungslinien + Kinder
            if (hatKinder) {
                for (let i = 0; i < knoten.kinder.length; i++) {
                    const kind = knoten.kinder[i];
                    const istLetzt = i === knoten.kinder.length - 1;

                    // Verbindungstext
                    const verbindung = document.createElement("div");
                    verbindung.className = "vererbung-verbindung";
                    verbindung.style.marginLeft = "6px";
                    verbindung.innerHTML = `<span class="vererbung-linie">${istLetzt ? "\u2514\u2500" : "\u251C\u2500"}</span> <span class="vererbung-verb-text">erbt von ${knoten.name}</span>`;
                    div.appendChild(verbindung);

                    const kindKnoten = this._erstelleKnoten(kind, tiefe + 1, istLetzt);
                    div.appendChild(kindKnoten);
                }
            }
        }

        return div;
    }

    _klassenFarbe(name) {
        const farben = {
            Zeichenobjekt: "#94a3b8",
            Rechteck: "#3b82f6",
            Ellipse: "#8b5cf6",
            Dreieck: "#f59e0b",
            Polygon: "#10b981",
            Linie: "#ef4444",
            TextObjekt: "#ec4899",
            BildObjekt: "#06b6d4",
        };
        return farben[name] || "#64748b";
    }
}
