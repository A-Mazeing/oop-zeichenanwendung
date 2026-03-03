# OOP Zeichenanwendung

Eine browserbasierte Zeichenanwendung zur Vermittlung von **Objektorientierter Programmierung (OOP)** im Schulunterricht (Klassenstufe 7).

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

// Animation starten (eigene Methode nötig, s. Klassen-Editor)
r1.starteAnimation("bewege", 50)
r1.stoppeAnimation()
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
| `starteAnimation(methode, ms)` | Eigene Methode wiederholt aufrufen |
| `stoppeAnimation()` | Laufende Animation stoppen |

**Farbname-Unterstützung:** `rot`, `gruen`, `blau`, `gelb`, `orange`, `lila`, `rosa`, `schwarz`, `weiss`, `grau`, `cyan` u.v.m.

- Code ausführen: **Button „Ausführen"** oder `Strg+Enter`
- Die Konsole zeigt Ausgaben, Fehler und Erfolg farbig an

---

### Klassen-Editor

Der zweite Tab im Editor-Bereich ermöglicht das Schreiben **eigener Methoden** für die eingebauten Klassen – in Python-ähnlicher Syntax.

Der Klassen-Editor unterstützt:

- `for`-Schleifen: `for i in range(10):` / `for i in range(1, 10, 2):`
- `while`-Schleifen: `while self.x < 400:`
- Bedingungen: `if` / `elif` / `else`
- Lokale Variablen: `ergebnis = self.breite * 2`
- Ausgabe: `print(self.x)`
- Eingebaute Funktionen: `abs()`, `min()`, `max()`, `int()`, `float()`, `str()`
- Boolesche Operatoren: `and` / `or` / `not` (auch `und` / `oder` / `nicht`)
- Vergleiche: `==`, `!=`, `<`, `>`, `<=`, `>=`

**Beispiel:**

```python
class Rechteck:

    def verdoppleBreite(self):
        self.setzeGroesse(self.breite * 2, self.hoehe)

    def bewege(self):
        self.verschieben(5, 0)
        if self.x > 500:
            self.setzePosition(0, self.y)

    def bewegeMitSchleife(self):
        for i in range(10):
            self.verschieben(3, 0)

    def zentriere(self, cx, cy):
        self.setzePosition(cx - self.breite / 2, cy - self.hoehe / 2)
```

**Animation starten** (im Code-Editor):
```
r1.starteAnimation("bewege", 50)
r1.stoppeAnimation()
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
  - Die Karte des aktuell ausgewählten Objekttyps erscheint automatisch ganz oben
- **Objektansicht:** UML-Objektkarten mit Live-Attributwerten, Farbvorschau-Punkten und allen verfügbaren Methoden (einklappbar)
  - Das aktuell ausgewählte Objekt erscheint ganz oben
  - Collapse-Zustände bleiben beim Wechsel der Auswahl erhalten
- **Klick** auf eine Objektkarte → Objekt wird auf der Zeichenfläche ausgewählt
- **Doppelklick** auf den Kopf einer Objektkarte → Objekt umbenennen (Inline-Eingabe)
  - Name wird in allen Views synchronisiert (Inspektor, Code-Editor, Serialisierung)
  - Validierung: kein Leerzeichen, kein bereits vergebener Name, gültiger Bezeichner
  - `Enter` bestätigt, `Escape` bricht ab
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
app.js       – Gesamte Anwendungslogik (~2700 Zeilen)
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
            MethodenEditor (Python-Syntax Parser, Block-Interpreter, Methoden-Registrierung)
```

**Abhängigkeiten:** Nur [Tailwind CSS](https://tailwindcss.com/) via CDN – kein Build-Schritt, keine weiteren Abhängigkeiten.

---

## Version

**v0.2** – Erweiterter Klassen-Editor, Objekte umbenennen, verbesserte Inspektor-Navigation
