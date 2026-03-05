import { Dokument } from '../models/Dokument.js';
import { Rechteck, Ellipse, Linie, Dreieck, TextObjekt, BildObjekt, Polygon } from '../models/shapes.js';

export class InspektorView {
    constructor(klassenDiv, objektDiv, dokument) {
        this.klassenDiv = klassenDiv;
        this.objektDiv = objektDiv;
        this.dokument = dokument;
        this._onObjektKlick = null; // Callback wenn Objekt im Inspektor geklickt wird
        this._onObjektUmbenennen = null; // Callback wenn Objekt umbenannt wird: (index, neuerName) => void
        this._onObjektSperreUmschalten = null; // Callback wenn Sperre umgeschaltet wird: (index) => void
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

    setzeSperreHandler(handler) {
        this._onObjektSperreUmschalten = handler;
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
                name: "POLYGON",
                attribute: [
                    "x", "y", "breite", "hoehe", "eckenAnzahl",
                    "fuellFarbe", "linienFarbe", "linienStaerke",
                ],
                methoden: Polygon.gibMethoden(),
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

            const karteHtml = `<div class="uml-karte objekt-karte${istAusgewaehlt ? " ausgewaehlt" : ""}${istEingeklappt ? " eingeklappt" : ""}${obj.gesperrt ? " gesperrt" : ""}" data-objekt-index="${idx}" data-objekt-name="${name}">
                <div class="uml-karte-kopf objekt-karte-toggle">
                    <button class="sperre-btn" data-sperre-index="${idx}" title="${obj.gesperrt ? 'Entsperren' : 'Sperren'}">
                        <svg viewBox="0 0 24 24" class="sperre-icon${obj.gesperrt ? ' gesperrt' : ''}" fill="none" stroke="currentColor" stroke-width="2">
                            ${obj.gesperrt
                                ? '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>'
                                : '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/>'
                            }
                        </svg>
                    </button>
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
                // Nicht umbenennen wenn auf Sperre-Button geklickt
                if (e.target.closest(".sperre-btn")) return;
                e.stopPropagation();
                e.preventDefault();
                const karte = kopf.closest(".objekt-karte");
                const idx = parseInt(karte.dataset.objektIndex);
                const alterName = karte.dataset.objektName;
                this._starteInlineUmbenennung(kopf, idx, alterName);
            });
        });

        // Sperre-Handler auf Sperre-Buttons
        this.objektDiv.querySelectorAll(".sperre-btn[data-sperre-index]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                const idx = parseInt(btn.dataset.sperreIndex);
                if (this._onObjektSperreUmschalten) {
                    this._onObjektSperreUmschalten(idx);
                }
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
