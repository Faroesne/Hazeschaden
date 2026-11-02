# Hazeschaden – Art Style Guide

Verbindliche Vorgaben für alles Grafische: Einheiten, Animationen, Effekte, Arena und UI.
Vor jedem neuen Design hier nachlesen; Abweichungen erst hier eintragen, dann umsetzen.
Die Werte stehen im Code in `apps/client/src/battle/characters/style.ts` (eine Quelle der Wahrheit).

---

## 1. Leitbild: „Chunky Cartoon Fantasy“

Ein eigener Stil im Genre der mobilen Arena-Battler (Richtung Clash Royale / Draft Showdown),
**ohne deren Figuren, Logos oder Assets nachzubauen**. Alle Charaktere sind eigene Entwürfe.

- **Chibi-Proportionen:** Kopf ≈ 40–45 % der Figurenhöhe, kurze Beine, große Hände/Waffen.
- **Kräftige Konturen:** jede Fläche hat eine dunkle Outline `#1b1530`, gleich dick für alle Teile.
- **Cel-Shading mit 2 Tönen:** Grundfarbe + Schattenton (rechte Seite jedes Teils, Licht kommt von links oben). Kein Verlauf auf Figuren.
- **Satte, warme Farben**, klare Silhouetten. Lesbar auf 20 px Höhe.
- **Übertriebene Bewegung:** Ausholen, Squash & Stretch, Nachschwingen.

## 2. Farbpalette

### Teams (Teamfarbe = Erkennung auf einen Blick)
| | Grund | Schatten | Hell |
|---|---|---|---|
| Blau (Spieler 1, unten) | `#3d8bfd` | `#1f4fa8` | `#9cc9ff` |
| Rot (Spieler 2, oben) | `#f0473c` | `#a3221c` | `#ffa59c` |

Die Teamfarbe sitzt bei jeder Einheit auf **mindestens einer großen Fläche** (Schild, Umhang, Kapuze, Tabard)
und einem **Akzent am Kopf** (Federbusch, Stirnband, Schal).

### Materialien
| Material | Grund | Schatten |
|---|---|---|
| Stahl | `#c9d3e0` | `#8a97ab` |
| Eisen (dunkel) | `#5b6274` | `#3a3f4d` |
| Holz | `#a8743f` | `#6f4a25` |
| Leder | `#8a5531` | `#5e3820` |
| Gold | `#ffcf3f` | `#c9902a` |
| Bronze | `#d08a4a` | `#9a5c2a` |
| Stoff dunkel (Assassinen) | `#3a3150` | `#241e33` |
| Haut hell / mittel / dunkel | `#f6cfa6` / `#d39a6a` / `#8f5d3d` | jeweils ~20 % dunkler |

### Rollen-Akzent (nur UI, nicht auf Figuren)
Tank `#6fd08c` · Fernkampf `#ffbf47` · Assassine `#b07cff`

### Effekte
Treffer-Funke `#fff6c2` → `#ffd24a` · Schockwelle `#ffd76a` · Rauch `#d9d4e3` → transparent · Mündungsfeuer `#ffb43a`/`#ff6a2a`

## 3. Figuren-Baukasten

- **Koordinaten:** Füße bei (0, 0), Figurenhöhe 100 Einheiten, Blick nach rechts (+x). Gespiegelt wird über die Blickrichtung.
- **Größe im Kampf:** Figurenhöhe = Kollisionsradius × 3; Füße liegen bei Radius × 0,75 unter dem Mittelpunkt.
- **Zeichenreihenfolge:** Schatten → hinterer Arm/Ausrüstung → Beine → Körper → Kopf → vorderer Arm/Waffe → Effekte. Figuren nach y sortiert (weiter unten = davor).
- **Bodenschatten:** Ellipse 52 × 16, `rgba(0,0,0,0.28)`, ohne Outline.
- **Form zeigt Stärke:** *Klasse*-Einheiten sind breiter, detaillierter, mit Gold-Akzenten. *Masse*-Einheiten sind schlicht, klein und gleich.
- **Rolle zeigt Funktion:**
  - **Tank:** schwere Rüstung, großer Schild, breite Silhouette, Stahl dominiert.
  - **Fernkampf:** leichte Kleidung, Kapuze/Hut, Fernwaffe deutlich sichtbar.
  - **Assassine:** dunkler Stoff, Maske, schlanke Silhouette, Klingen, wehender Schal in Teamfarbe.
- **Level:** goldene Sterne über dem Kopf (1 pro Level über 1).
- **Lebensbalken:** über dem Kopf, nur wenn verletzt; grün > gelb > rot.

## 4. Animationen (Zeiten in Ticks, 20 Ticks = 1 s)

| Zustand | Bewegung |
|---|---|
| **Idle** | Atmen: Körper ±1,5 Einheiten, Zyklus 1,2 s; Umhang/Schal schwingt leicht |
| **Laufen** | Hüpfen 4 Einheiten pro Schritt, Beine wechseln, Schritt-Zyklus 0,4 s; leichte Vorlage |
| **Angriff** | Ausholen 4 Ticks **vor** dem Schlag → Schlag 2 Ticks (Squash 0,92 / Stretch 1,06) → Zurückfedern 6 Ticks |
| **Getroffen** | 3 Ticks weißer Blitz + 2 Einheiten Rückstoß |
| **Tod** | 12 Ticks: kippt nach hinten (bis 80°), blendet aus, Rauchwolke |
| **Spawn** | 0,5 s Aufploppen mit Überschwingen + Staubring |

Ausholen vor dem Schlag ist möglich, weil der ganze Kampf vorab berechnet ist (die Wiedergabe kennt die Zukunft).

## 5. Effekte & Geschosse

- **Pfeil:** Holzschaft, Stahlspitze, Federn in Teamfarbe, zeigt in Flugrichtung.
- **Granate (Mörser):** dunkle Eisenkugel, fliegt sichtbar im **Bogen** (rein optisch), Rauchspur.
- **Nahkampf-Treffer:** kleiner 4-zackiger Funke, 4 Ticks.
- **Flächentreffer:** Schockwelle (Ring wächst auf den echten Radius) + Staubpartikel.
- **Tod:** Rauchwolke aus 4 Kreisen, wächst und verblasst.

## 6. Arena

- Rasen `#5fae4e` mit hellen Mähstreifen `#69b957` (quer), Steinmauer `#8c8f9e` mit dunkler Kante `#5b5e6e`.
- Mittellinie als weiße Kreide-Linie mit Mittelkreis.
- Hinter jeder Grundlinie ein Banner-Streifen in Teamfarbe (unten blau, oben rot).

## 7. UI

- **Schrift:** „Lilita One“ (Google Fonts) für Titel, Buttons und Zahlen, sonst Systemschrift. Fallback: fette Systemschrift.
- **Primär-Button:** Gold `#ffcb3d`, untere 3D-Kante `#c48a12` (4 px), Text dunkel `#3a2500`. Gedrückt: Kante 1 px.
- **Panels:** Dunkelblau `#1b2238`, 2 px helle Innenkante `rgba(255,255,255,0.06)`, Radius 14 px.
- **Einheitenkarten:** Rahmenfarbe = Rollen-Akzent, Porträt der Figur links (Leerlauf-Pose, Team Blau).
- Hintergrund `#11152a` mit leichtem Verlauf nach `#0b0e1c`.

## 8. Einheiten-Briefings

Status: ✅ als Figur umgesetzt · ⏳ noch Symbol

| Einheit | Status | Silhouette & Ausrüstung | Teamfarbe auf | Angriff |
|---|---|---|---|---|
| Koloss | ✅ | Breiter Ritter, Topfhelm mit Sehschlitz, riesiger Turmschild, Streitkolben | Federbusch, Schild, Tabard | Kolben weit über den Kopf, Schmetterschlag |
| Bollwerk | ⏳ | Kleiner Steingolem mit Wehrturm auf dem Rücken, Fäuste wie Felsblöcke | Banner auf dem Turm | Beidhändiger Bodenstampfer (Schockwelle) |
| Schildträger | ✅ | Kleiner Soldat, Nasenhelm, großer Rundschild, kurzer Speer | Schildfläche, Helmband | Speerstoß nach vorn |
| Dornenwache | ⏳ | Gedrungener Wächter in Dornenrüstung, Stachelschild | Wappenrock, Schildmitte | Schildschlag, Dornen sprühen |
| Scharfschütze | ⏳ | Schlanker Jäger mit langer Armbrust, Federhut, Monokel | Hut, Umhang | Zielen (Laser-Linie kurz), Schuss mit Rückstoß |
| Mörser | ✅ | Stämmiger Kanonier mit Brille und Bart neben Mörserrohr auf Holzgestell | Halstuch, Fahne am Gestell | Rohr ruckt zurück, Mündungsfeuer + Rauch, Granate im Bogen |
| Bogenschützen | ✅ | Kapuzen-Schützen mit Langbogen, Köcher | Kapuze & Umhang | Sehne ziehen beim Ausholen, Pfeil fliegt |
| Funkenwerfer | ⏳ | Kleine Alchemisten mit Tank auf dem Rücken und Düse | Schutzbrille, Tank-Streifen | Flammenstoß (Kegel) |
| Klingenmeister | ✅ | Schlanker Schwertkämpfer, Maske, Haarknoten, langes Schwert | Schal (weht), Gürtel | Weiter Schwung mit weißem Schweif |
| Wirbelklinge | ⏳ | Akrobat mit zwei Sichelklingen | Schärpe | Drehwirbel mit Kreis-Schweif |
| Schattenrudel | ⏳ | Schattenwölfe mit glühenden Augen | Halsband | Sprung-Biss |
| Giftmischer | ⏳ | Pestdoktor-Silhouette mit Schnabelmaske und Phiolen | Umhangsaum | Phiole werfen, grüne Pfütze |

## 9. Checkliste für eine neue Figur

1. Silhouette als Schwarzfläche lesbar? Rolle erkennbar?
2. Teamfarbe auf großer Fläche + Kopfakzent?
3. Nur Palettenfarben aus `style.ts`, Outline überall gleich?
4. Idle, Laufen, Angriff (mit Ausholen), Treffer, Tod vorhanden?
5. Auf 20 px Höhe noch erkennbar (Masse-Einheiten)?
6. Porträt auf der Karte sieht gut aus?
7. Status in Abschnitt 8 auf ✅ setzen.
