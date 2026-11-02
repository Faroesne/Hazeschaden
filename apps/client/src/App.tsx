import {
  botChoice,
  choose,
  createMatch,
  fightRound,
  timeoutChoice,
  type Choice,
  type MatchState,
  type PlayerId,
} from "@hazeschaden/game";
import type { BattleLog, BattleWinner } from "@hazeschaden/sim";
import { RULES } from "@hazeschaden/shared";
import { useState } from "react";
import { BattleView } from "./battle/BattleView";
import { ArmyList, DraftScreen } from "./screens/DraftScreen";
import { SetupScreen, type Mode, type SetupResult } from "./screens/SetupScreen";
import { Hearts } from "./ui/Hearts";

type View =
  | { kind: "setup" }
  | { kind: "handover"; player: PlayerId }
  | { kind: "draft"; player: PlayerId }
  | { kind: "battle"; log: BattleLog; winner: BattleWinner }
  | { kind: "roundResult"; winner: BattleWinner }
  | { kind: "finished" };

interface Session {
  mode: Mode;
  decks: [string[], string[]];
  match: MatchState;
}

const newSeed = (): number => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

export function App() {
  const [view, setView] = useState<View>({ kind: "setup" });
  const [session, setSession] = useState<Session | null>(null);

  const names: [string, string] = session?.mode === "hotseat" ? ["Spieler 1", "Spieler 2"] : ["Du", "Bot"];

  /** Moves on from a state: the next human pick, or the battle once the draft is done. */
  const advance = (mode: Mode, match: MatchState) => {
    if (match.phase === "battle") {
      const { state, battle } = fightRound(match);
      setSession((s) => (s ? { ...s, match: state } : s));
      setView({ kind: "battle", log: battle.log!, winner: battle.winner });
      return;
    }
    setSession((s) => (s ? { ...s, match } : s));
    if (mode === "bot") setView({ kind: "draft", player: 0 });
    else setView({ kind: "handover", player: match.players[0].pending ? 1 : 0 });
  };

  const start = (setup: SetupResult) => {
    const match = createMatch({ seed: newSeed(), decks: setup.decks });
    setSession({ mode: setup.mode, decks: setup.decks, match });
    advance(setup.mode, match);
  };

  const pick = (player: PlayerId, choice: Choice) => {
    if (!session) return;
    let match = choose(session.match, player, choice);
    if (session.mode === "bot") match = choose(match, 1, botChoice(match, 1));
    advance(session.mode, match);
  };

  if (view.kind === "setup" || !session) return <SetupScreen onStart={start} />;
  const { match } = session;

  switch (view.kind) {
    case "handover":
      return (
        <div className="screen center">
          <h1>{names[view.player]} ist dran</h1>
          <p className="muted">Gib das Gerät weiter. {names[view.player === 0 ? 1 : 0]} schaut bitte weg.</p>
          <button className="primary wide" onClick={() => setView({ kind: "draft", player: view.player })}>
            Bereit
          </button>
        </div>
      );

    case "draft":
      return (
        <DraftScreen
          key={`${match.round}-${match.pickIndex}-${view.player}`}
          match={match}
          player={view.player}
          names={names}
          onChoose={(c) => pick(view.player, c)}
          onTimeout={() => pick(view.player, timeoutChoice(match, view.player))}
        />
      );

    case "battle":
      return (
        <div className="screen">
          <header className="draft-header">
            <div className="round">Runde {match.history.length} – Kampf</div>
            <div className="hearts-col">
              <Hearts label={names[0]} count={heartsBefore(match, 0)} side={0} />
              <Hearts label={names[1]} count={heartsBefore(match, 1)} side={1} />
            </div>
          </header>
          <BattleView log={view.log} onDone={() => setView({ kind: "roundResult", winner: view.winner })} />
        </div>
      );

    case "roundResult": {
      const last = match.history[match.history.length - 1]!;
      return (
        <div className="screen center">
          <h1>{roundText(view.winner, names)}</h1>
          <Hearts label={names[0]} count={last.heartsAfter[0]} side={0} />
          <Hearts label={names[1]} count={last.heartsAfter[1]} side={1} />
          <button
            className="primary wide"
            onClick={() => (match.phase === "finished" ? setView({ kind: "finished" }) : advance(session.mode, match))}
          >
            {match.phase === "finished" ? "Ergebnis" : `Runde ${match.round}`}
          </button>
        </div>
      );
    }

    case "finished":
      return (
        <div className="screen center">
          <h1>{match.winner === "draw" ? "Unentschieden" : `${names[match.winner!]} ${session.mode === "bot" && match.winner === 0 ? "gewinnst" : "gewinnt"}!`}</h1>
          <ol className="history">
            {match.history.map((r) => (
              <li key={r.round}>
                Runde {r.round}: {r.winner === "draw" ? "Unentschieden" : `${names[r.winner]} gewinnt`} · Herzen {r.heartsAfter[0]}:{r.heartsAfter[1]}
              </li>
            ))}
          </ol>
          <section className="final-armies">
            <h2>{names[0]}</h2>
            <ArmyList army={match.players[0].army} empty="–" />
            <h2>{names[1]}</h2>
            <ArmyList army={match.players[1].army} empty="–" />
          </section>
          <button className="primary wide" onClick={() => start({ mode: session.mode, decks: session.decks })}>
            Revanche
          </button>
          <button className="chip" onClick={() => setView({ kind: "setup" })}>
            Decks ändern
          </button>
        </div>
      );
  }
}

/** Hearts before the round that was just fought. */
function heartsBefore(match: MatchState, p: PlayerId): number {
  return match.history[match.history.length - 2]?.heartsAfter[p] ?? RULES.hearts;
}

function roundText(winner: BattleWinner, names: [string, string]): string {
  if (winner === "draw") return "Unentschieden – beide verlieren ein Herz";
  if (names[0] === "Du") return winner === 0 ? "Runde gewonnen!" : "Runde verloren";
  return `${names[winner]} gewinnt die Runde`;
}
