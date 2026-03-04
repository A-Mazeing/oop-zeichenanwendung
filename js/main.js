import { Dokument } from "./models/Dokument.js";
import { DateiManager, setDateiManager } from "./services/DateiManager.js";
import { UndoManager } from "./services/UndoManager.js";
import { CanvasView } from "./views/CanvasView.js";
import { InspektorView } from "./views/InspektorView.js";
import { HierarchieView } from "./views/HierarchieView.js";
import { DateienView } from "./views/DateienView.js";
import { Controller } from "./controllers/Controller.js";
import { CodeEditor } from "./editors/CodeEditor.js";
import { MethodenEditor } from "./editors/MethodenEditor.js";

(async function init() {
    // --- Model ---
    const dokument = new Dokument();

    // --- DateiManager (vor Views initialisieren, damit BildObjekt darauf zugreifen kann) ---
    const dateiManager = new DateiManager();
    setDateiManager(dateiManager);
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

    // Vererbungs-Diagramm
    const { VererbungsView } = await import("./views/VererbungsView.js");
    const vererbungBaum = document.getElementById("vererbung-baum");
    const vererbungsView = new VererbungsView(vererbungBaum);

    // Tab-Umschaltung
    (function initLinkesPanelTabs() {
        const tabs = document.querySelectorAll(".linkes-panel-tab");
        const inhalte = {
            hierarchie: document.getElementById("lp-tab-hierarchie"),
            vererbung: document.getElementById("lp-tab-vererbung"),
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

    // --- Undo/Redo ---
    const undoManager = new UndoManager(dokument);
    controller._undoManager = undoManager;

    // Nach jeder Dokumentaenderung einen Snapshot erstellen
    dokument.beobachterHinzufuegen(() => {
        undoManager.snapshot();
    });

    // --- Code-Editor ---
    const codeEditor = new CodeEditor(dokument, controller);
    controller._codeEditorRef = codeEditor;

    // --- Methoden-Editor ---
    const methodenEditor = new MethodenEditor(dokument, codeEditor, inspektorView, controller);

    // --- Code-Vorlagen ---
    (async function initVorlagen() {
        const { VORLAGEN } = await import("./services/CodeVorlagen.js");
        const vorlagenBtn = document.getElementById("vorlagen-btn");
        const vorlagenDropdown = document.getElementById("vorlagen-dropdown");

        if (!vorlagenBtn || !vorlagenDropdown) return;

        // Dropdown ein-/ausblenden
        vorlagenBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const sichtbar = vorlagenDropdown.style.display !== "none";
            vorlagenDropdown.style.display = sichtbar ? "none" : "";
        });

        // Klick ausserhalb schliesst Dropdown
        document.addEventListener("click", () => {
            vorlagenDropdown.style.display = "none";
        });

        // Vorlage einfuegen
        vorlagenDropdown.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-vorlage]");
            if (!btn) return;
            const key = btn.dataset.vorlage;
            const vorlage = VORLAGEN[key];
            if (!vorlage) return;

            // Code in Editor einsetzen
            const editorEl = document.getElementById("code-editor");
            if (editorEl) {
                editorEl.value = vorlage.code;
            }

            // Dropdown schliessen
            vorlagenDropdown.style.display = "none";

            // Zum Code-Tab wechseln
            const codeTabs = document.querySelectorAll(".editor-tab");
            codeTabs.forEach(t => t.classList.remove("aktiv"));
            const codeTab = document.querySelector('[data-tab="code"]');
            if (codeTab) codeTab.classList.add("aktiv");
            document.getElementById("tab-code").style.display = "";
            document.getElementById("tab-klassen").style.display = "none";
        });
    })();

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
        // Undo-Stack zuruecksetzen
        undoManager.zuruecksetzen();
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
