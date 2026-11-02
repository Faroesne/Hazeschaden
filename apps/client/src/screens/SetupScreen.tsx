import { randomDeck } from "@hazeschaden/game";
import { RULES, UNITS } from "@hazeschaden/shared";
import { useState } from "react";
import { load, save } from "../storage";
import { UnitCard } from "../ui/UnitCard";

export type Mode = "bot" | "hotseat";

export interface SetupResult {
  mode: Mode;
  decks: [string[], string[]];
}

const DECK_KEYS = ["hz.deck.p1", "hz.deck.p2"] as const;

export function SetupScreen({ onStart }: { onStart: (r: SetupResult) => void }) {
  const [mode, setMode] = useState<Mode>(() => load<Mode>("hz.mode", "bot"));
  const [editing, setEditing] = useState<0 | 1>(0);
  const [decks, setDecks] = useState<[string[], string[]]>(() => [
    load<string[]>(DECK_KEYS[0], []),
    load<string[]>(DECK_KEYS[1], []),
  ]);

  const deck = decks[editing];
  const setDeck = (next: string[]) => {
    const copy: [string[], string[]] = [decks[0], decks[1]];
    copy[editing] = next;
    setDecks(copy);
    save(DECK_KEYS[editing], next);
  };
  const toggle = (id: string) => {
    if (deck.includes(id)) setDeck(deck.filter((d) => d !== id));
    else if (deck.length < RULES.deckSize) setDeck([...deck, id]);
  };
  const chooseMode = (m: Mode) => {
    setMode(m);
    save("hz.mode", m);
    if (m === "bot") setEditing(0);
  };

  const ready = decks[0].length === RULES.deckSize && (mode === "bot" || decks[1].length === RULES.deckSize);

  return (
    <div className="screen setup">
      <h1 className="title">Hazeschaden</h1>

      <div className="segmented">
        <button className={mode === "bot" ? "active" : ""} onClick={() => chooseMode("bot")}>
          Gegen Bot
        </button>
        <button className={mode === "hotseat" ? "active" : ""} onClick={() => chooseMode("hotseat")}>
          2 Spieler, 1 Gerät
        </button>
      </div>

      {mode === "hotseat" && (
        <div className="segmented small">
          {([0, 1] as const).map((p) => (
            <button key={p} className={editing === p ? "active" : ""} onClick={() => setEditing(p)}>
              Deck Spieler {p + 1} ({decks[p].length}/{RULES.deckSize})
            </button>
          ))}
        </div>
      )}

      <div className="row between">
        <span className="muted">
          Wähle {RULES.deckSize} Einheiten ({deck.length}/{RULES.deckSize})
        </span>
        <button className="chip" onClick={() => setDeck(randomDeck((Date.now() >>> 0) + editing))}>
          Zufällig
        </button>
      </div>

      <div className="unit-grid">
        {UNITS.map((u) => (
          <UnitCard key={u.id} typeId={u.id} selected={deck.includes(u.id)} onClick={() => toggle(u.id)} />
        ))}
      </div>

      <div className="sticky-bottom">
        <button
          className="primary wide"
          disabled={!ready}
          onClick={() => onStart({ mode, decks: [decks[0], mode === "bot" ? randomDeck(Date.now() >>> 0) : decks[1]] })}
        >
          {ready ? "Match starten" : mode === "hotseat" ? "Beide Decks brauchen 5 Einheiten" : "Deck braucht 5 Einheiten"}
        </button>
      </div>
    </div>
  );
}
