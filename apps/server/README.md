# @hazeschaden/server

Noch nicht gebaut. Geplant (siehe `docs/SPEC.md` §6):

- Node + **Colyseus**: Match-Raum (Draft-Phase, 3 Picks pro Runde, 10 s Timer, Kampf), Queue, Reconnect (60 s).
- Server-autoritativ: Angebote, Picks und Kampf (`@hazeschaden/sim`) laufen nur hier.
- Kleine HTTP-API im selben Prozess: Discord-Login, Decks, Profil, Replays.
- **Postgres + TypeORM** nur zur Persistenz; typisierter Event-Bus (`match.finished` → Elo, Winrate, Replay in einer Transaktion).
- Lauscht nur auf `127.0.0.1`; nach außen geht nur Tailscale Serve.
