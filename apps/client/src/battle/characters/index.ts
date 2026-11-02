import { drawBogenschuetzen } from "./bogenschuetzen";
import { drawKlingenmeister } from "./klingenmeister";
import { drawKoloss } from "./koloss";
import { drawMoerser } from "./moerser";
import { Painter, type CharacterDraw, type Pose } from "./paint";
import { drawSchildtraeger } from "./schildtraeger";

export type { Pose } from "./paint";

/** Units drawn as characters (docs/ART_STYLE.md §8). The rest still use their symbol token. */
const CHARACTERS: Record<string, CharacterDraw> = {
  koloss: drawKoloss,
  schildtraeger: drawSchildtraeger,
  bogenschuetzen: drawBogenschuetzen,
  moerser: drawMoerser,
  klingenmeister: drawKlingenmeister,
};

export function hasCharacter(typeId: string): boolean {
  return typeId in CHARACTERS;
}

/**
 * Draws a character with its feet at the current origin, `height` world units tall,
 * looking towards `facing`. Includes the ground shadow.
 */
export function drawCharacter(ctx: CanvasRenderingContext2D, typeId: string, pose: Pose, height: number, facing: 1 | -1 = 1): void {
  const draw = CHARACTERS[typeId];
  if (!draw) return;
  const k = height / 100;
  ctx.save();
  ctx.scale(k, k);
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();
  ctx.scale(facing, 1);
  draw(new Painter(ctx, pose.hurt), pose);
  ctx.restore();
}

