import { Rechteck } from "../models/Rechteck.js";
import { Ellipse } from "../models/Ellipse.js";
import { Linie } from "../models/Linie.js";
import { Dreieck } from "../models/Dreieck.js";
import { TextObjekt } from "../models/TextObjekt.js";
import { BildObjekt } from "../models/BildObjekt.js";
import { Polygon } from "../models/Polygon.js";

export class CodeEditor {
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
            Polygon: Polygon,
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
