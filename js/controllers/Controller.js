import { Rechteck } from "../models/Rechteck.js";
import { Ellipse } from "../models/Ellipse.js";
import { Linie } from "../models/Linie.js";
import { Dreieck } from "../models/Dreieck.js";
import { TextObjekt } from "../models/TextObjekt.js";
import { BildObjekt } from "../models/BildObjekt.js";

export class Controller {
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
                // Sofortiger Canvas-Redraw fuer lag-freies Drag-Feedback
                // (umgeht die schwere Observer-Kette beim ersten Frame)
                this.canvasView.neuZeichnen();
            } else {
                this._aktuellesObjekt = null;
            }
            // Observer-Kette (Inspektor, Hierarchie) asynchron nachziehen
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
