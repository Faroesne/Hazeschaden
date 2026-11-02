import type { Choice, MatchState } from "@hazeschaden/game";
import { BATTLE, getUnitType } from "@hazeschaden/shared";
import { previewDeployment } from "@hazeschaden/sim";
import { useEffect, useMemo, useRef } from "react";
import { UnitArt } from "../ui/UnitArt";
import { drawField, drawUnit } from "./draw";
import type { UnitView } from "./playback";

const DURATION_MS = 2200;
const GROW_FROM = 250;
const GROW_MS = 550;
const MAX_FPS = 30;

/** Ease-out with a slight overshoot, so new units "pop" in. */
function popIn(k: number): number {
  const c = 1.7;
  const x = k - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
}

/**
 * Shows both armies in formation right after a pick: the newly picked units spawn in,
 * levelled-up types light up. Ends by itself after ~2 s or on tap.
 */
export function SpawnPreview({
  match,
  choices,
  names,
  onDone,
}: {
  match: MatchState;
  choices: [Choice, Choice];
  names: [string, string];
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finished = useRef(false);
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    doneRef.current();
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const { units, fresh, levelled } = useMemo(() => {
    const deployed = previewDeployment({ seed: match.seed, armies: [match.players[0].army, match.players[1].army] });
    const fresh = new Set<number>();
    const levelled = new Set<number>();
    choices.forEach((c, side) => {
      const ofType = deployed.filter((u) => u.side === side && u.typeId === c.typeId);
      if (c.kind === "levelUp") ofType.forEach((u) => levelled.add(u.id));
      else ofType.slice(-getUnitType(c.typeId).count).forEach((u) => fresh.add(u.id));
    });
    const units: UnitView[] = deployed.map((u) => ({ ...u, maxHp: u.hp }));
    return { units, fresh, levelled };
  }, [match, choices]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const scale = Math.min(window.devicePixelRatio || 1, 2) * (canvas.clientWidth / BATTLE.fieldWidth);
    canvas.width = Math.round(BATTLE.fieldWidth * scale);
    canvas.height = Math.round(BATTLE.fieldHeight * scale);
    const ctx = canvas.getContext("2d")!;
    const start = performance.now();
    let lastDraw = 0;
    let raf = 0;

    const frame = (now: number) => {
      const t = now - start;
      if (now - lastDraw >= 1000 / MAX_FPS - 1) {
        lastDraw = now;
        drawField(ctx, scale);
        const k = Math.min(1, Math.max(0, (t - GROW_FROM) / GROW_MS));
        const pulse = 0.5 + 0.5 * Math.sin(t / 120);
        for (const u of units) {
          if (fresh.has(u.id)) drawUnit(ctx, u, { grow: popIn(k), glow: 1 - k * 0.6 });
          else if (levelled.has(u.id)) drawUnit(ctx, u, { glow: t < DURATION_MS - 400 ? pulse : 0 });
          else drawUnit(ctx, u);
        }
      }
      if (t >= DURATION_MS) {
        finishRef.current();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [units, fresh, levelled]);

  return (
    <div className="spawn" onClick={finish}>
      <div className="spawn-banners">
        {[1, 0].map((side) => (
          <ChoiceBanner key={side} name={names[side]!} choice={choices[side]!} side={side as 0 | 1} match={match} />
        ))}
      </div>
      <canvas ref={canvasRef} className="battle-canvas" style={{ aspectRatio: `${BATTLE.fieldWidth} / ${BATTLE.fieldHeight}` }} />
      <div className="muted small center-text">Tippen zum Überspringen</div>
    </div>
  );
}

function ChoiceBanner({ name, choice, side, match }: { name: string; choice: Choice; side: 0 | 1; match: MatchState }) {
  const u = getUnitType(choice.typeId);
  const level = match.players[side].army.find((e) => e.typeId === choice.typeId)?.level ?? 1;
  return (
    <div className={`spawn-banner side-${side} role-${u.role}`}>
      <UnitArt typeId={choice.typeId} size={28} />
      <span>
        <b>{name}</b> {choice.kind === "levelUp" ? `${u.name} ⬆ Lv${level}` : `+${u.count} ${u.name}`}
      </span>
    </div>
  );
}
