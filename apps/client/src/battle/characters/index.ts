import { drawBogenschuetzen } from "./bogenschuetzen";
import { drawBollwerk } from "./bollwerk";
import { drawDornenwache } from "./dornenwache";
import { drawFunkenwerfer } from "./funkenwerfer";
import { drawGiftmischer } from "./giftmischer";
import { drawScharfschuetze } from "./scharfschuetze";
import { drawSchattenrudel } from "./schattenrudel";
import { drawWirbelklinge } from "./wirbelklinge";
import { drawKlingenmeister } from "./klingenmeister";
import { drawKoloss } from "./koloss";
import { drawMoerser } from "./moerser";
import { Painter, type CharacterDraw, type Pose } from "./paint";
import { drawSchildtraeger } from "./schildtraeger";
import { drawSprite, hasSprite, spriteHandlesDeath } from "../sprites";

export type { Pose } from "./paint";

/** Code-drawn characters for every unit (docs/ART_STYLE.md §8). Sprite sheets take precedence. */
const CHARACTERS: Record<string, CharacterDraw> = {
  koloss: drawKoloss,
  bollwerk: drawBollwerk,
  schildtraeger: drawSchildtraeger,
  dornenwache: drawDornenwache,
  scharfschuetze: drawScharfschuetze,
  moerser: drawMoerser,
  bogenschuetzen: drawBogenschuetzen,
  funkenwerfer: drawFunkenwerfer,
  klingenmeister: drawKlingenmeister,
  wirbelklinge: drawWirbelklinge,
  schattenrudel: drawSchattenrudel,
  giftmischer: drawGiftmischer,
};

/** True if the unit has a figure: a sprite sheet (preferred) or a code-drawn character. */
export function hasCharacter(typeId: string): boolean {
  return hasSprite(typeId) || typeId in CHARACTERS;
}

/** True if the figure animates its own death (sprite with a death row); otherwise the caller tips it over. */
export function animatesDeath(typeId: string): boolean {
  return spriteHandlesDeath(typeId);
}

/**
 * Draws a character with its feet at the current origin, `height` world units tall,
 * looking towards `facing`. Includes the ground shadow.
 */
export function drawCharacter(ctx: CanvasRenderingContext2D, typeId: string, pose: Pose, height: number, facing: 1 | -1 = 1, dying?: number): void {
  const k = height / 100;
  if (hasSprite(typeId)) {
    ctx.save();
    ctx.scale(k, k);
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fill();
    ctx.restore();
    drawSprite(ctx, typeId, pose, height, facing, dying);
    return;
  }
  const draw = CHARACTERS[typeId];
  if (!draw) return;
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

