export class HierarchieView {
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
