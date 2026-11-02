# Sprite-Sheets (echte Grafiken)

Liegt hier ein Sprite-Sheet für eine Einheit, zeichnet das Spiel sie damit statt mit der Code-Figur.
Alle anderen Einheiten bleiben unverändert. Stilvorgaben: `docs/ART_STYLE.md`.

## Ablauf

1. Bild(er) hierher legen, z. B. `koloss-blau.png` und `koloss-rot.png` (oder eins für beide Teams).
2. Eintrag in `manifest.json` ergänzen (Schlüssel = Einheiten-ID aus `packages/shared/src/units.ts`).
3. `pnpm dev` neu laden – fertig.

## Format eines Eintrags

```json
{
  "koloss": {
    "images": ["koloss-blau.png", "koloss-rot.png"],
    "frameWidth": 128,
    "frameHeight": 128,
    "anchorX": 64,
    "anchorY": 120,
    "figureHeight": 110,
    "animations": {
      "idle":   { "row": 0, "frames": 4, "fps": 6 },
      "walk":   { "row": 1, "frames": 6, "fps": 12 },
      "attack": { "row": 2, "frames": 8 },
      "hurt":   { "row": 3, "frames": 2 },
      "death":  { "row": 4, "frames": 6 }
    }
  }
}
```

- Ein Sheet ist ein Raster: jede **Zeile** eine Animation, jede **Spalte** ein Frame, alle Frames gleich groß.
- Figuren schauen **nach rechts**; links wird gespiegelt.
- `anchorX/anchorY`: Fußpunkt im Frame (Pixel). `figureHeight`: Pixelhöhe der Figur, wird auf die Spielgröße skaliert.
- Nur `idle` ist Pflicht. Der Angriff wird über die gesamte Angriffsdauer abgespielt; der Treffer-Frame sollte bei etwa 1/3 liegen (Ausholen 4 Ticks, Zurückfedern 8 Ticks).
- Fehlt `death`, kippt das Spiel die Figur wie bei Code-Figuren um.
