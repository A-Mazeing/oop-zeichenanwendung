export class DateienView {
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
