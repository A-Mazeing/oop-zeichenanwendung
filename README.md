# OOP Zeichenanwendung

Eine browserbasierte Zeichenanwendung zur Vermittlung von **Objektorientierter Programmierung (OOP)** im Schulunterricht (Klassenstufe 7). Die App demonstriert OOP-Konzepte anhand eines grafischen Editors, der nach dem **Model-View-Controller (MVC)** Muster aufgebaut ist.

**Live-Demo:** https://a-mazeing.github.io/oop-zeichenanwendung/

---

## Funktionalitäten

### Zeichenwerkzeuge

Mit der Toolbar auf der linken Seite lassen sich folgende Objekte auf der Zeichenfläche erstellen:

| Werkzeug | Taste | Beschreibung |
|---|---|---|
| Auswahl | `V` | Objekte auswählen und verschieben |
| Rechteck | `R` | Rechteck aufziehen |
| Ellipse | `E` | Ellipse / Kreis aufziehen |
| Linie | `L` | Linie ziehen |
| Dreieck | `D` | Dreieck aufziehen |
| Text | `T` | Textobjekt platzieren |
| Bild | `B` | Bild per URL oder Datei einfügen |

- **Füllfarbe und Linienfarbe** sind frei wählbar (Farbpicker in der Toolbar)
- **Objekte löschen:** Auswählen + `Entf`-Taste

---

### Code-Editor (Pseudocode)

Im unteren Bereich befindet sich ein Code-Editor mit einer eigenen **Pseudocode-Syntax**, die Schülerinnen und Schüler ohne Vorkenntnisse nutzen können.

**Beispiele:**

```
// Objekt erstellen
Rechteck r1 = neu Rechteck(50, 50, 200, 100)

// Methoden aufrufen
r1.setzeFarbe("rot")
r1.verschieben(30, 0)
r1.setzeGroesse(150, 80)

// Ellipse erstellen
Ellipse e1 = neu Ellipse(200, 150, 100, 100)
e1.setzeFarbe("blau")
```

**Verfügbare Methoden für alle Formen:**

| Methode | Beschreibung |
|---|---|
| `verschieben(dx, dy)` | Objekt relativ verschieben |
| `setzePosition(x, y)` | Absolute Position setzen |
| `setzeFarbe(farbe)` | Füllfarbe setzen (Name oder Hex) |
| `setzeLinienFarbe(farbe)` | Linienfarbe setzen |
| `setzeLinienStaerke(n)` | Linienstärke in Pixeln |
| `setzeGroesse(breite, hoehe)` | Größe ändern (nicht für Linie) |

**Farbname-Unterstützung:** `rot`, `gruen`, `blau`, `gelb`, `orange`, `lila`, `rosa`, `schwarz`, `weiss`, `grau`, `cyan` u.v.m.

- Code ausführen: **Button „Ausführen"** oder `Strg+Enter`
- Die Konsole rechts zeigt Ausgaben, Fehler und Erfolg farbig an

---

### Klassen-Editor

Der zweite Tab im Editor-Bereich ermöglicht das Schreiben **eigener Methoden** für die eingebauten Klassen – in Python-ähnlicher Syntax.

**Beispiel:**

```python
class Rechteck:

    def verdoppleBreite(self):
        self.setzeGroesse(self.breite * 2, self.hoehe)

    def zentriere(self, cx, cy):
        self.setzePosition(cx - self.breite / 2, cy - self.hoehe / 2)
```

- Klasse über das Dropdown auswählen
- Methode schreiben (Tab-Taste für Einrückung, Shift+Tab zum Entfernen)
- **„Übernehmen"** kompiliert die Methoden und registriert sie
- Danach im Code-Editor aufrufbar: `r1.verdoppleBreite()`
- Eigene Methoden erscheinen in den UML-Karten im Inspektor

---

### Inspektor (UML-Ansicht)

Der rechte Bereich zeigt die aktuelle OOP-Struktur als **UML-Diagramm**:

- **Klassenansicht:** UML-Klassenkarten mit Attributen und Methoden (einklappbar)
- **Objektansicht:** UML-Objektkarten mit Live-Attributwerten, Farbvorschau-Punkten und allen verfügbaren Methoden (einklappbar)
- Klick auf eine Objektkarte → Objekt wird auf der Zeichenfläche ausgewählt
- Alle Ansichten synchronisieren sich **bidirektional** (Canvas ↔ Inspektor ↔ Code-Editor)

---

### Projekte speichern & laden

- **Speichern:** Speichert das gesamte Projekt (Objekte, Code, eigene Methoden) als `.json`-Datei
- **Laden:** Lädt ein gespeichertes Projekt aus einer `.json`-Datei wieder
- Bilder werden als **Data-URL** eingebettet und sind vollständig portabel

---

### Editor-Bereich

- **Größe anpassen:** Den oberen Rand des Editors nach oben/unten ziehen
- **Ein-/Ausklappen:** Pfeil-Button rechts oben im Editor klappt den Bereich ein und aus

---

## Technischer Aufbau

```
index.html   – HTML-Struktur (Layout, Toolbar, Canvas, Inspektor, Editor)
style.css    – Eigenes CSS (ergänzt Tailwind CSS)
app.js       – Gesamte Anwendungslogik (~2300 Zeilen)
```

**Architektur (MVC + Observer):**

```
Model:      Zeichenobjekt (abstrakt)
            ├── Rechteck
            ├── Ellipse
            ├── Linie
            ├── Dreieck
            ├── TextObjekt
            └── BildObjekt
            Dokument  (verwaltet alle Objekte, Observer-Pattern)

View:       CanvasView     (HTML5 Canvas Rendering)
            InspektorView  (UML-Karten Darstellung)

Controller: Controller     (Toolbar, Maus-Interaktion, Tastatur)
            CodeEditor     (Pseudocode-Parser und -Ausführung)
            MethodenEditor (Python-Syntax Parser, Methoden-Registrierung)
```

**Abhängigkeiten:** Nur [Tailwind CSS](https://tailwindcss.com/) via CDN – kein Build-Schritt, keine weiteren Abhängigkeiten.

---

## Version

**v0.1** – Initiale Version
