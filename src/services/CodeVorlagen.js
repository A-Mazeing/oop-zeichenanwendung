/**
 * CodeVorlagen – Vordefinierte Code-Beispiele fuer den Code-Editor.
 *
 * Jede Vorlage ist ein mehrzeiliges Skript in der vereinfachten
 * OOP-Syntax, das vom CodeEditor ausgefuehrt werden kann.
 */
export const VORLAGEN = {
    haus: {
        name: "Haus",
        code: `// === Haus ===
Rechteck wand = neu Rechteck(100, 200, 200, 150)
wand.setzeFarbe("#d97706")

Dreieck dach = neu Dreieck(80, 80, 240, 120)
dach.setzeFarbe("#dc2626")

Rechteck tuer = neu Rechteck(170, 280, 60, 70)
tuer.setzeFarbe("#78350f")

Rechteck fenster1 = neu Rechteck(120, 230, 40, 40)
fenster1.setzeFarbe("#bfdbfe")
fenster1.setzeLinienFarbe("#1e40af")

Rechteck fenster2 = neu Rechteck(240, 230, 40, 40)
fenster2.setzeFarbe("#bfdbfe")
fenster2.setzeLinienFarbe("#1e40af")`,
    },

    ampel: {
        name: "Ampel",
        code: `// === Ampel ===
Rechteck gehaeuse = neu Rechteck(170, 50, 80, 240)
gehaeuse.setzeFarbe("#1e293b")

Ellipse rot = neu Ellipse(185, 65, 50, 50)
rot.setzeFarbe("#ef4444")
rot.setzeLinienFarbe("#991b1b")

Ellipse gelb = neu Ellipse(185, 135, 50, 50)
gelb.setzeFarbe("#eab308")
gelb.setzeLinienFarbe("#854d0e")

Ellipse gruen = neu Ellipse(185, 205, 50, 50)
gruen.setzeFarbe("#22c55e")
gruen.setzeLinienFarbe("#166534")

Rechteck stange = neu Rechteck(200, 290, 20, 120)
stange.setzeFarbe("#475569")`,
    },

    smiley: {
        name: "Smiley",
        code: `// === Smiley ===
Ellipse kopf = neu Ellipse(120, 80, 200, 200)
kopf.setzeFarbe("#fde047")
kopf.setzeLinienFarbe("#ca8a04")

Ellipse auge1 = neu Ellipse(170, 140, 25, 30)
auge1.setzeFarbe("#1e293b")
auge1.setzeLinienFarbe("#1e293b")

Ellipse auge2 = neu Ellipse(245, 140, 25, 30)
auge2.setzeFarbe("#1e293b")
auge2.setzeLinienFarbe("#1e293b")

Ellipse mund = neu Ellipse(170, 200, 100, 50)
mund.setzeFarbe("transparent")
mund.setzeLinienFarbe("#ca8a04")`,
    },

    schneemann: {
        name: "Schneemann",
        code: `// === Schneemann ===
Ellipse unten = neu Ellipse(130, 240, 160, 140)
unten.setzeFarbe("#f1f5f9")
unten.setzeLinienFarbe("#94a3b8")

Ellipse mitte = neu Ellipse(150, 150, 120, 110)
mitte.setzeFarbe("#f1f5f9")
mitte.setzeLinienFarbe("#94a3b8")

Ellipse oben = neu Ellipse(170, 70, 80, 80)
oben.setzeFarbe("#f1f5f9")
oben.setzeLinienFarbe("#94a3b8")

Ellipse auge1 = neu Ellipse(190, 90, 10, 10)
auge1.setzeFarbe("#1e293b")

Ellipse auge2 = neu Ellipse(220, 90, 10, 10)
auge2.setzeFarbe("#1e293b")

Dreieck nase = neu Dreieck(200, 105, 30, 15)
nase.setzeFarbe("#f97316")

Rechteck hut = neu Rechteck(175, 40, 70, 35)
hut.setzeFarbe("#1e293b")

Rechteck hutKrempe = neu Rechteck(165, 70, 90, 8)
hutKrempe.setzeFarbe("#1e293b")`,
    },

    landschaft: {
        name: "Landschaft",
        code: `// === Landschaft ===
dokument1.hintergrundfarbeSetzen("#87ceeb")

Rechteck wiese = neu Rechteck(0, 280, 500, 200)
wiese.setzeFarbe("#22c55e")
wiese.setzeLinienFarbe("#16a34a")

Dreieck berg1 = neu Dreieck(50, 160, 200, 130)
berg1.setzeFarbe("#6b7280")
berg1.setzeLinienFarbe("#4b5563")

Dreieck berg2 = neu Dreieck(200, 130, 250, 160)
berg2.setzeFarbe("#9ca3af")
berg2.setzeLinienFarbe("#6b7280")

Ellipse sonne = neu Ellipse(350, 40, 80, 80)
sonne.setzeFarbe("#fbbf24")
sonne.setzeLinienFarbe("#f59e0b")

Ellipse wolke1 = neu Ellipse(80, 50, 100, 40)
wolke1.setzeFarbe("#f1f5f9")
wolke1.setzeLinienFarbe("#e2e8f0")

Ellipse wolke2 = neu Ellipse(110, 35, 80, 35)
wolke2.setzeFarbe("#f8fafc")
wolke2.setzeLinienFarbe("#e2e8f0")`,
    },
};
