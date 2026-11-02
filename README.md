# Hazeschaden

Kompetitiver 1v1-Autobattler als Web-App. Spezifikation: [docs/SPEC.md](docs/SPEC.md) · Begriffe: [docs/GLOSSARY.md](docs/GLOSSARY.md)

## Stand

| Teil | Status |
|---|---|
| `packages/shared` – Regeln, Balance-Werte, 12 Einheiten | fertig (Startwerte) |
| `packages/sim` – deterministische Kampfsimulation + Ereignis-Protokoll | fertig |
| Balance-Runner (`pnpm balance`) | fertig – Startwerte erfüllen die Ziele noch nicht |
| `apps/server` (Colyseus, API, Postgres) | geplant |
| `apps/client` (React, PixiJS, PWA) | geplant |

## Loslegen (Windows)

Empfohlen: Code im WSL2-Dateisystem (z. B. `~/code/hazeschaden`), nicht unter `C:\` – pnpm und Docker sind dort deutlich schneller.

```bash
# einmalig in WSL2 (Ubuntu): Node 22 + pnpm
corepack enable
pnpm install
git add pnpm-lock.yaml && git commit -m "Add lockfile"

pnpm check          # Typecheck + Tests
pnpm balance        # Siegquoten-Matrix + Balance-Ziele
pnpm balance --sweep               # beste Konter-/Level-Boni suchen
pnpm balance --counter 30 --level 70   # Werte ausprobieren, ohne Code zu ändern
```

## Aufbau

```
packages/shared   Regeln (RULES), Balance-Knöpfe (BALANCE), Kampf-Konstanten (BATTLE), Einheiten (UNITS)
packages/sim      simulateBattle(): reine Funktion, nur Ganzzahlen, Seed-RNG → gleiches Ergebnis überall
packages/sim/scripts/balance.ts   Balance-Runner
apps/server       (geplant)
apps/client       (geplant)
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
