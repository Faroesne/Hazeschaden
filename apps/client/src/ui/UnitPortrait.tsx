import { useEffect, useRef } from "react";
import { drawCharacter, hasCharacter } from "../battle/characters";
import { UnitArt } from "./UnitArt";

/** How far right of centre each character's drawing reaches (weapons, mortar), as a share of its height. */
const SHIFT: Record<string, number> = {
  koloss: 0.12,
  bollwerk: 0.02,
  schildtraeger: 0.15,
  dornenwache: 0.04,
  scharfschuetze: 0.16,
  moerser: 0.18,
  bogenschuetzen: 0.07,
  funkenwerfer: 0.1,
  klingenmeister: 0.1,
  wirbelklinge: 0,
  schattenrudel: 0.04,
  giftmischer: 0.08,
};

/** The unit's character in its idle pose (team blue), or its symbol if it has no character yet. Static: no animation loop. */
export function UnitPortrait({ typeId, size = 48 }: { typeId: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const character = hasCharacter(typeId);

  useEffect(() => {
    if (!character) return;
    const canvas = ref.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const height = size * 0.82;
    ctx.translate(size / 2 - (SHIFT[typeId] ?? 0) * height, size * 0.94);
    drawCharacter(ctx, typeId, { time: 0.3, walking: false, attack: null, hurt: 0, team: 0 }, height);
  }, [typeId, size, character]);

  if (!character) return <UnitArt typeId={typeId} size={Math.round(size * 0.85)} />;
  return <canvas ref={ref} className="unit-portrait" style={{ width: size, height: size }} />;
}
