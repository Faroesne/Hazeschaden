# Hazeschaden – Spezifikation

Stand: 2026-11-02 · Ergebnis der Design-Session („Grilling“). Begriffe: siehe [GLOSSARY.md](GLOSSARY.md).

Hazeschaden ist ein kompetitiver 1v1-Autobattler als Web-App (PWA, mobile-first, Hochformat).
Keine Story. Ranglistenfaktor > Inhalt.

---

## 1. Match-Ablauf

| Regel | Wert |
|---|---|
| Format | 1v1, synchron/live |
| Herzen | 4 pro Spieler → 4 bis 7 Runden |
| Picks pro Runde | 3, nacheinander |
| Zeit pro Pick | 10 s, danach Zufalls-Pick |
| Angebot pro Pick | 3 zufällige Einheitentypen aus dem eigenen Deck (Deck = 5 Typen) |
| Alternative zum Pick | Einen bereits besessenen Typ um 1 Level aufsteigen (max. Level 3) |
| Armee | wächst dauerhaft; jede Runde voll geheilt |
| Rundenverlierer | verliert 1 Herz |
| Gleichzeitiger Tod beider Teams | beide verlieren 1 Herz |
| Kampfdauer | Sudden Death ab 30 s (steigender Schaden für alle) |

- Maximal 21 Picks pro Spieler, maximal ~105 Einheiten pro Seite.
- **Sichtbarkeit:** Zwischen den Picks sieht man die Picks des Gegners, nie seine Angebote. Das Deck des Gegners ist verdeckt und wird nur über seine Picks sichtbar.
- **Verbindungsabbruch:** Match läuft weiter (Zufalls-Picks). Wiedereinstieg innerhalb 60 s, danach gilt das Match als aufgegeben.
- Endet ein Match mit beiden Spielern bei 0 Herzen in derselben Runde: Unentschieden (Elo-Ergebnis 0,5).

## 2. Deck

- Jeder Spieler baut Decks aus **5 Einheitentypen** aus dem Pool aller Einheiten (alle Einheiten für alle verfügbar).
- Keine Pflicht-Rollen. Mehrere Decks speicherbar; eines muss vor der Queue ausgewählt sein.

## 3. Einheiten

### Achsen
- **Rolle** (harter Konter, Schere-Stein-Papier): Assassine → schlägt Fernkampf → schlägt Tank → schlägt Assassine.
- **Form** (Modifikator): *Masse* (viele kleine) kontert Einzelziel-Schaden; *Klasse* (wenige große) kontert Flächenschaden.
- Bei Widerspruch der Achsen gewinnt die **Rolle**, aber knapp.

### Werte
Nur Leben und Schaden. Keine Fähigkeiten, kein Mana. Einheiten unterscheiden sich durch:
Anzahl pro Pick, Leben, Schaden/Angriffsintervall (DPS), Reichweite, Bewegungstempo, Flächenradius, Teleport.

- **Pick-Budget** (Lanchester): `Anzahl² × Leben × DPS ≈ 50 000`. Flächenschaden-Einheiten ~30 % weniger.
- **Level:** +100 % Leben und Schaden pro Level über 1 (per Sweep ermittelt) für alle Einheiten des Typs (auch später hinzukommende). Ein Level zählt balance-technisch wie ein Pick.
- Später möglich: Level schalten Mechaniken frei statt nur Werte.

### Startliste (Platzhalternamen)

| Rolle | Einheit | Form | Schaden | Anzahl | Leben | DPS | Reichweite | Tempo |
|---|---|---|---|---|---|---|---|---|
| Tank | Koloss | Klasse | Einzel | 1 | 2000 | 25 | Nah | langsam |
| Tank | Bollwerk | Klasse | Fläche (klein) | 1 | 1800 | 18 | Nah | langsam |
| Tank | Schildträger | Masse | Einzel | 5 | 300 | 7 | Nah | mittel |
| Tank | Dornenwache | Masse | Fläche (klein) | 3 | 500 | 7,5 | Nah | mittel |
| Fernkampf | Scharfschütze | Klasse | Einzel | 1 | 500 | 100 | Weit | langsam |
| Fernkampf | Mörser | Klasse | Fläche (groß) | 1 | 500 | 70 | Weit | langsam |
| Fernkampf | Bogenschützen | Masse | Einzel | 5 | 60 | 33 | Mittel | mittel |
| Fernkampf | Funkenwerfer | Masse | Fläche (klein) | 3 | 130 | 30 | Mittel | mittel |
| Assassine | Klingenmeister | Klasse | Einzel | 1 | 800 | 65 | Nah | schnell |
| Assassine | Wirbelklinge | Klasse | Fläche (klein) | 1 | 800 | 44 | Nah | schnell |
| Assassine | Schattenrudel | Masse | Einzel | 5 | 100 | 20 | Nah | schnell |
| Assassine | Giftmischer | Masse | Fläche (klein) | 3 | 200 | 20 | Nah | schnell |

Das sind die Design-Startwerte (`BASE_UNITS`). Gespielt wird mit `UNITS` = Startwerte + `tuning.json` (Ergebnis von `pnpm balance --tune`).

## 4. Kampf

- **Freie Fläche**, Koordinaten in Ganzzahlen. Jede Seite hat eine Hälfte des Feldes.
- **Aufstellung** komplett automatisch und deterministisch: Tanks vorne, Fernkampf und Assassinen hinten. Gleiche Armee → gleiche Positionen.
- **Assassinen** teleportieren sich zu Kampfbeginn hinter die hinterste gegnerische Reihe.
- **Zielwahl:**
  1. Standard: nächster lebender Gegner (Gleichstand → feste ID-Reihenfolge).
  2. Assassinen: hinterste gegnerische Einheit.
  3. Overkill-Schutz nur über bereits fliegende Geschosse / bereits ausgelöste Treffer: Ist ein Ziel durch ausstehenden Schaden schon sicher tot, wird ein anderes gewählt. Keine Vorhersage zukünftiger Angriffe.
  4. Gleiche Einheiten greifen deterministisch leicht versetzt zum ersten Mal an.
- **Rollen-Konter:** +X % Schaden gegen die gekonterte Rolle (X wird vom Balance-Runner bestimmt).
- **Sudden Death:** ab 30 s erleiden alle Einheiten steigenden Schaden pro Sekunde.
- **Ende:** Seite ohne lebende Einheiten verliert. Beide gleichzeitig → beide verlieren ein Herz.

### Balance-Ziele (automatische Tests)
- „Immer“ heißt 100 % der Spiele. **Ausnahme:** Arbeitet die Form gegen den erwarteten Sieger (der Gegner hat die passende Form gegen seine Schadensart, er selbst nicht umgekehrt), reichen **≥ 60 %**.
- 1 Pick gegen 1 Pick: der Rollen-Konter gewinnt **immer**.
- 2 Picks gegen 1 Pick des Konters: der Konter **verliert**.
- Ein Level zählt dabei wie ein Pick.

## 5. Meta

- Login: **Discord** (OAuth).
- Eine gemeinsame Queue; wer zuerst wartet, wird gepaart.
- **Trophäen** nach Elo-Formel, Start 1000. Dazu Winrate pro Spieler. Saisons/Ligen: später.
- Grafik: einfache Formen. Pixelart erst, wenn das Balancing steht.

## 6. Technik

| Bereich | Entscheidung |
|---|---|
| Sprache | TypeScript überall, pnpm-Monorepo |
| `packages/sim` | Reine Simulation: Ganzzahlen, Seed-RNG (kein `Math.random`, keine Floats), keine Abhängigkeiten |
| `packages/shared` | Einheiten-Daten, Typen, Netzwerk-Protokoll |
| `apps/server` | Node + Colyseus (Räume, Queue, Reconnect) + HTTP-API; server-autoritativ; eigener typisierter Event-Bus |
| `packages/game` | Match-Regeln als reine Funktionen (Deck, Angebote, Picks, Runden, Herzen) + Bot; läuft im Client und später auf dem Server |
| `apps/client` | React + Vite, Kampfanzeige mit Canvas 2D (statt PixiJS, solange es nur Formen gibt), PWA; max. 30 FPS nur im Kampf, pausiert im Hintergrund. Modi vorerst lokal: gegen Bot, 2 Spieler an einem Gerät |
| Kampf → Client | Server sendet **Ereignis-Protokoll**; Client spielt nur ab |
| Replays | Ereignis-Protokoll komprimiert in Postgres → bleiben nach Balancing abspielbar |
| Datenbank | Postgres + TypeORM (nur Persistenz, keine Entity-Listener für Spiellogik) |
| Tests | Vitest, Golden Tests (Determinismus), Balance-Tests, Performance-Test 105 vs. 105 |
| Balancing | CLI-Balance-Runner in `packages/sim` |
| Hosting | Eigener Windows-Rechner: Docker Desktop (WSL2), alle Dienste an `127.0.0.1`, Tailscale Serve (HTTPS/WSS, nur Tailnet), Node-Sharing an Freunde, Funnel aus |
| CI | GitHub Actions: Typecheck, Tests, Balance-Report |
