// ============================================================
// DateiManager – Bilder-Verwaltung mit IndexedDB
// ============================================================

// Modul-Variable fuer globalen Zugriff aus BildObjekt._ladeBild()
let _dateiManager = null;

export function getDateiManager() {
    return _dateiManager;
}

export function setDateiManager(dm) {
    _dateiManager = dm;
}

export class DateiManager {
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
                setDateiManager(this);
                resolve();
            };

            anfrage.onerror = (e) => {
                console.error("IndexedDB Fehler:", e.target.error);
                this._bereit = true;
                setDateiManager(this);
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

    // Datei umbenennen
    async dateiUmbenennen(alterName, neuerName) {
        neuerName = neuerName.trim();
        if (!neuerName || neuerName === alterName) return false;
        if (this._cache.has(neuerName)) return false; // Name existiert bereits

        const datei = this._cache.get(alterName);
        if (!datei) return false;

        // Alten Eintrag entfernen
        this._cache.delete(alterName);
        if (this._db) {
            try {
                const tx = this._db.transaction("bilder", "readwrite");
                tx.objectStore("bilder").delete(alterName);
                await new Promise((r, rej) => {
                    tx.oncomplete = r;
                    tx.onerror = () => rej(tx.error);
                });
            } catch (e) {
                console.warn("IDB Loeschfehler beim Umbenennen:", e);
            }
        }

        // Neuen Eintrag anlegen
        datei.name = neuerName;
        this._cache.set(neuerName, datei);
        if (this._db) {
            try {
                const tx = this._db.transaction("bilder", "readwrite");
                tx.objectStore("bilder").put(datei);
                await new Promise((r, rej) => {
                    tx.oncomplete = r;
                    tx.onerror = () => rej(tx.error);
                });
            } catch (e) {
                console.warn("IDB Schreibfehler beim Umbenennen:", e);
            }
        }

        if (this._onAenderung) this._onAenderung();
        return true;
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
