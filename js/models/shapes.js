// ============================================================
// shapes.js – Re-exports aller Zeichenobjekt-Subklassen
// + vonJSON-Factory (loest die zirkulaere Abhaengigkeit)
// ============================================================

import { Zeichenobjekt } from './Zeichenobjekt.js';
import { Rechteck } from './Rechteck.js';
import { Ellipse } from './Ellipse.js';
import { Linie } from './Linie.js';
import { Dreieck } from './Dreieck.js';
import { TextObjekt } from './TextObjekt.js';
import { BildObjekt } from './BildObjekt.js';

// Deserialisierung: Aus JSON-Daten ein Zeichenobjekt erstellen
export function vonJSON(daten) {
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

export { Zeichenobjekt, Rechteck, Ellipse, Linie, Dreieck, TextObjekt, BildObjekt };
