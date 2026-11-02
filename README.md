# Hazeschaden

Kompetitiver 1v1-Autobattler als Web-App. Spezifikation: [docs/SPEC.md](docs/SPEC.md) · Begriffe: [docs/GLOSSARY.md](docs/GLOSSARY.md) · Grafikstil: [docs/ART_STYLE.md](docs/ART_STYLE.md)

## Stand

| Teil | Status |
|---|---|
| `packages/shared` – Regeln, Balance-Werte, 12 Einheiten | fertig (Startwerte) |
| `packages/sim` – deterministische Kampfsimulation + Ereignis-Protokoll | fertig |
| Balance-Runner (`pnpm balance`) + Tuner (`pnpm balance --tune`) | fertig – 134 von 144 Balance-Zielen erfüllt (siehe unten) |
| `packages/game` – Match-Regeln (Deck, Draft, Runden, Herzen) + Bot | fertig |
| `apps/client` – spielbar lokal: gegen Bot oder 2 Spieler an einem Gerät | fertig |
| `apps/server` (online, Login, Datenbank) | später |

## Loslegen (Windows)

Empfohlen: Code im WSL2-Dateisystem (z. B. `~/code/hazeschaden`), nicht unter `C:\` – pnpm und Docker sind dort deutlich schneller.

```bash
# einmalig in WSL2 (Ubuntu): Node 22 + pnpm
corepack enable
pnpm install

pnpm dev            # Spiel starten → http://127.0.0.1:5173
pnpm check          # Typecheck + Tests
pnpm balance        # Siegquoten-Matrix + Balance-Ziele
pnpm balance --sweep               # beste Konter-/Level-Boni suchen
pnpm balance --counter 30 --level 70   # Werte ausprobieren, ohne Code zu ändern
pnpm balance --tune                # Leben/Schaden pro Einheit tunen → packages/shared/src/tuning.json
```

Einheitenwerte: `BASE_UNITS` in `packages/shared/src/units.ts` sind die Design-Startwerte, `tuning.json` überschreibt Leben und Schaden. Das Spiel nutzt `UNITS` (Startwerte + Tuning). Der Tuner bleibt im Bereich 25–400 % der Startwerte.

## Lokal spielen

`pnpm dev` startet das Spiel unter http://127.0.0.1:5173 (nur auf diesem Rechner erreichbar).

- **Gegen Bot:** Deck aus 5 Einheiten wählen, der Bot bekommt ein Zufallsdeck und draftet gegen deine stärkste Rolle.
- **2 Spieler, 1 Gerät:** Beide wählen ein Deck; vor jedem Pick kommt ein Übergabe-Bildschirm, damit der andere nicht mitliest.
- Pro Pick 20 Sekunden, danach wird zufällig gewählt. Aufstiege sind eine der 3 Optionen im Angebot.
- Nach jedem Pick zeigt das Feld kurz beide Armeen, die neuen Einheiten erscheinen animiert (antippen überspringt).
- Kämpfe finden in einer Arena mit Wänden statt und lassen sich mit 1×/2×/4× abspielen oder überspringen.

Auf dem Handy testen: `pnpm dev:lan` macht den Server im **Heimnetz** sichtbar (Adresse steht in der Konsole). Nur im eigenen WLAN nutzen.

### Als App installieren (PWA)

Die gebaute Version ist eine installierbare Web-App und läuft danach auch offline (das ganze Spiel läuft im Browser):

```bash
pnpm build && pnpm preview   # → http://127.0.0.1:4173
```

Chrome bietet dann „App installieren“ an. Installieren geht nur über `localhost` oder HTTPS – auf dem Handy also erst über die HTTPS-Adresse von Tailscale Serve (siehe Hosting), nicht über `dev:lan`. Im Entwicklungsmodus (`pnpm dev`) ist der Offline-Cache absichtlich aus, damit Änderungen sofort sichtbar sind.

## Bewusst so gelassen: Flächenschaden gegen Masse

Regel seit 2026-11-02: Arbeitet die Form gegen den erwarteten Sieger, muss er nur in ≥ 60 % der Spiele gewinnen, sonst immer (`GOALS.conflictMinWinPct`).

Nach dem Tuning scheitern noch 10 von 144 Zielen (Stand Arena-Umbau), fast alle rund um Mörser und Bollwerk: Ein Flächentreffer löscht eng stehende Masse-Einheiten fast komplett aus. Ein Kampf geht zudem bei fast allen Seeds gleich aus, deshalb lockert die 60-%-Regel in der Praxis kaum etwas. **Entscheidung (2026-11-02):** Flächenschaden bleibt „alles oder nichts“, kein Abfall zum Rand. Die Ausnahmen werden akzeptiert; das echte Balancing kommt aus Testspielen. Der Abnahmetest `packages/sim/test/acceptance.test.ts` bleibt bis dahin übersprungen.

## Aufbau

```
packages/shared   Regeln (RULES), Balance-Knöpfe (BALANCE), Kampf-Konstanten (BATTLE), Einheiten (UNITS)
packages/sim      simulateBattle(): reine Funktion, nur Ganzzahlen, Seed-RNG → gleiches Ergebnis überall
packages/sim/scripts/balance.ts   Balance-Runner
packages/game     Match-Regeln als reine Funktionen (createMatch, choose, fightRound) + Bot
apps/client       React-App: Deck-Auswahl, Draft, Kampf (Canvas), Ergebnis
apps/server       (später)
docs/             Spezifikation, Glossar
```

### Regeln für `packages/sim`
- Keine Kommazahlen, kein `Math.random`, keine Winkelfunktionen. Nur Ganzzahlen (`idiv`, `isqrt`, `withPct`) und `Rng`.
- Keine Abhängigkeiten außer `@hazeschaden/shared`, kein DOM, kein Netzwerk.
- Der Golden Test in `test/battle.test.ts` schlägt bei jeder Verhaltensänderung an. Ist die Änderung gewollt, Snapshot aktualisieren: `pnpm vitest -u`.

## Hosting (geplant)

Läuft auf dem eigenen Windows-Rechner, nur für eingeladene Freunde erreichbar:

1. Docker Desktop (WSL2-Backend). `.env.example` → `.env`, dann `docker compose up -d`. Alle Ports binden nur an `127.0.0.1`.
2. Tailscale für Windows installieren, in der Admin-Konsole MagicDNS und HTTPS-Zertifikate aktivieren.
3. `tailscale serve --bg 443 http://127.0.0.1:2567` → Spiel unter `https://<rechner>.<tailnet>.ts.net` (nur im Tailnet).
4. Den Rechner per **Node-Sharing** mit den Freunden teilen. **Funnel bleibt aus.**
5. Discord-App: Redirect-URL `https://<rechner>.<tailnet>.ts.net/auth/discord/callback`.
