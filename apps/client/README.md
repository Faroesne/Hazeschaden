# @hazeschaden/client

Die spielbare Web-App. Start aus dem Repo-Root: `pnpm dev` → http://127.0.0.1:5173

- `src/App.tsx` – Ablauf: Deck-Auswahl → (Übergabe) → Draft → Kampf → Rundenergebnis → Ende
- `src/screens/` – Deck-Auswahl und Draft-Bildschirm (20-s-Timer, 3 Optionen inkl. Aufstiege, beide Armeen)
- `src/art/unitArt.ts` – eigene SVG-Bilder der 12 Einheiten (Karten, Armee-Chips, Kampf)
- `src/battle/SpawnPreview.tsx` – Feld-Vorschau nach jedem Pick mit Spawn-Animation
- `src/battle/playback.ts` – liest das Ereignis-Protokoll der Simulation (Positionen, Leben, Geschosse, Treffer); getestet in `test/`
- `src/battle/draw.ts` – zeichnet einen Moment auf ein Canvas (runde Marken mit Einheitenbild in Teamfarbe; gelber Rand = Flächenschaden; Punkte = Level) und die Kamera, die auf die Einheiten zoomt
- `src/battle/BattleView.tsx` – Abspielen mit max. 30 FPS, 1×/2×/4×, Überspringen
- `public/manifest.webmanifest`, `public/sw.js`, `public/icons/` – PWA: installierbar, offline spielbar (Service Worker nur im Production-Build, Netzwerk zuerst, Cache als Rückfall)

Noch offen: Online-Modus, Login.
