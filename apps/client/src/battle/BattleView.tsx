import { BATTLE } from "@hazeschaden/shared";
import type { BattleLog } from "@hazeschaden/sim";
import { useEffect, useMemo, useRef, useState } from "react";
import { drawBattle } from "./draw";
import { createPlayback } from "./playback";

const MAX_FPS = 30;
const SPEEDS = [1, 2, 4] as const;

/** Plays a battle log on a canvas. Draws only while playing, at most 30 frames per second. */
export function BattleView({ log, onDone }: { log: BattleLog; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pb = useMemo(() => createPlayback(log), [log]);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [done, setDone] = useState(false);
  const tickRef = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const scale = Math.min(window.devicePixelRatio || 1, 2) * (canvas.clientWidth / BATTLE.fieldWidth);
    canvas.width = Math.round(BATTLE.fieldWidth * scale);
    canvas.height = Math.round(BATTLE.fieldHeight * scale);
    const ctx = canvas.getContext("2d")!;

    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    const loop = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      tickRef.current = Math.min(pb.endTick, tickRef.current + (dt / 1000) * BATTLE.ticksPerSecond * speedRef.current);
      if (now - lastDraw >= 1000 / MAX_FPS - 1) {
        lastDraw = now;
        drawBattle(ctx, pb, tickRef.current, scale);
      }
      if (tickRef.current >= pb.endTick) {
        drawBattle(ctx, pb, pb.endTick, scale);
        setDone(true);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pb]);

  const skip = () => {
    tickRef.current = pb.endTick;
  };

  return (
    <div className="battle">
      <canvas ref={canvasRef} className="battle-canvas" style={{ aspectRatio: `${BATTLE.fieldWidth} / ${BATTLE.fieldHeight}` }} />
      <div className="battle-controls">
        {SPEEDS.map((s) => (
          <button key={s} className={s === speed ? "chip active" : "chip"} onClick={() => setSpeed(s)}>
            {s}×
          </button>
        ))}
        {done ? (
          <button className="primary" onClick={onDone}>
            Weiter
          </button>
        ) : (
          <button className="chip" onClick={skip}>
            Überspringen
          </button>
        )}
      </div>
    </div>
  );
}
