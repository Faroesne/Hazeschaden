import type { Choice, MatchState, PlayerId } from "@hazeschaden/game";
import { RULES, getUnitType } from "@hazeschaden/shared";
import { useEffect, useRef, useState } from "react";
import { UnitPortrait } from "../ui/UnitPortrait";
import { UnitCard } from "../ui/UnitCard";
import { Hearts } from "../ui/Hearts";

/** One player's pick: the three choices, both armies, and the pick timer. */
export function DraftScreen({
  match,
  player,
  names,
  onChoose,
  onTimeout,
}: {
  match: MatchState;
  player: PlayerId;
  names: [string, string];
  onChoose: (c: Choice) => void;
  onTimeout: () => void;
}) {
  const me = match.players[player];
  const opp: PlayerId = player === 0 ? 1 : 0;
  const them = match.players[opp];
  const remaining = useCountdown(RULES.pickSeconds, `${match.round}-${match.pickIndex}-${player}`, onTimeout);
  const lastOppPick = them.picks[them.picks.length - 1];

  return (
    <div className="screen draft">
      <header className="draft-header">
        <div>
          <div className="round">Runde {match.round}</div>
          <div className="muted">
            Pick {match.pickIndex + 1}/{RULES.picksPerRound} · {names[player]}
          </div>
        </div>
        <div className="hearts-col">
          <Hearts label={names[player]} count={me.hearts} side={player} />
          <Hearts label={names[opp]} count={them.hearts} side={opp} />
        </div>
      </header>

      <div className="timer">
        <div className="timer-fill" style={{ width: `${(remaining / RULES.pickSeconds) * 100}%` }} />
        <span className="timer-text">{Math.ceil(remaining)} s</span>
      </div>

      <section>
        <h2>Armee {names[opp]}</h2>
        <ArmyList army={them.army} highlight={lastOppPick?.round === match.round ? lastOppPick.choice.typeId : undefined} empty="Noch keine Einheiten" />
      </section>

      <section>
        <h2>Dein Angebot</h2>
        <div className="offer">
          {me.offer.map((c) => (
            <UnitCard
              key={`${c.kind}-${c.typeId}`}
              typeId={c.typeId}
              owned={ownedLabel(me.army, c.typeId)}
              levelUp={c.kind === "levelUp" ? { from: me.army.find((e) => e.typeId === c.typeId)!.level } : undefined}
              onClick={() => onChoose(c)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Deine Armee</h2>
        <ArmyList army={me.army} empty="Noch keine Einheiten" />
      </section>
    </div>
  );
}

function ownedLabel(army: MatchState["players"][number]["army"], id: string): string | undefined {
  const e = army.find((a) => a.typeId === id);
  return e ? `im Besitz: ${e.picks}× · Lv${e.level}` : undefined;
}

export function ArmyList({ army, highlight, empty }: { army: MatchState["players"][number]["army"]; highlight?: string | undefined; empty: string }) {
  if (army.length === 0) return <div className="muted small">{empty}</div>;
  return (
    <div className="army">
      {army.map((e) => {
        const u = getUnitType(e.typeId);
        return (
          <div key={e.typeId} className={`army-chip role-${u.role}${highlight === e.typeId ? " highlight" : ""}`}>
            <UnitPortrait typeId={e.typeId} size={30} />
            <div className="army-chip-text">
              <span>{u.name}</span>
              <span className="muted">
                {u.count * e.picks} Einh. · Lv{e.level}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Seconds left; restarts when `key` changes; calls onExpire once at 0. */
function useCountdown(seconds: number, key: string, onExpire: () => void): number {
  const [left, setLeft] = useState(seconds);
  const expire = useRef(onExpire);
  expire.current = onExpire;
  useEffect(() => {
    const start = performance.now();
    setLeft(seconds);
    let fired = false;
    const id = window.setInterval(() => {
      const l = Math.max(0, seconds - (performance.now() - start) / 1000);
      setLeft(l);
      if (l === 0 && !fired) {
        fired = true;
        window.clearInterval(id);
        expire.current();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [seconds, key]);
  return left;
}
