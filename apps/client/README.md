# @hazeschaden/client

Die spielbare Web-App. Start aus dem Repo-Root: `pnpm dev` → http://127.0.0.1:5173

- `src/App.tsx` – Ablauf: Deck-Auswahl → (Übergabe) → Draft → Kampf → Rundenergebnis → Ende
- `src/screens/` – Deck-Auswahl und Draft-Bildschirm (10-s-Timer, Angebot, Level-Ups, beide Armeen)
- `src/battle/playback.ts` – liest das Ereignis-Protokoll der Simulation (Positionen, Leben, Geschosse, Treffer); getestet in `test/`
- `src/battle/draw.ts` – zeichnet einen Moment auf ein Canvas (Formen: ■ Tank, ▲ Fernkampf, ◆ Assassine; gelber Rand = Flächenschaden; Punkte = Level)
- `src/battle/BattleView.tsx` – Abspielen mit max. 30 FPS, 1×/2×/4×, Überspringen

Noch offen: PWA (Manifest, Offline), Online-Modus, Login.
