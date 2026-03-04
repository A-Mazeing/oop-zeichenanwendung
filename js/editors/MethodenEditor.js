import { Rechteck } from "../models/Rechteck.js";
import { Ellipse } from "../models/Ellipse.js";
import { Linie } from "../models/Linie.js";
import { Dreieck } from "../models/Dreieck.js";
import { TextObjekt } from "../models/TextObjekt.js";
import { BildObjekt } from "../models/BildObjekt.js";

export class MethodenEditor {
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
