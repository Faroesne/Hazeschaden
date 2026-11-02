import { BATTLE, UNITS, getUnitType } from "@hazeschaden/shared";
import { unitSvg } from "../art/unitArt";
import type { Playback, UnitView } from "./playback";

/** Unit pictures in white, ready for drawImage. Created once, on first use (browser only). */
let images: Map<string, HTMLImageElement> | null = null;
function unitImage(typeId: string): HTMLImageElement | undefined {
  if (!images) {
    images = new Map();
    for (const u of UNITS) {
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(unitSvg(u.id, "#ffffff", 64));
      images.set(u.id, img);
    }
  }
  const img = images.get(typeId);
  return img && img.complete && img.naturalWidth > 0 ? img : undefined;
}

export const SIDE_COLOR = ["#4da3ff", "#ff5d5d"] as const;
/** Tokens are drawn slightly smaller than their collision radius, so neighbours never touch. */
const VISUAL_SCALE = 0.92;
const TILE = 80;
const WALL = 6;
const SIDE_DARK = ["#1d4f85", "#8a2525"] as const;

/** Clears the canvas and draws the arena: floor, team halves, centre line and walls. */
export function drawField(ctx: CanvasRenderingContext2D, scale: number): void {
  const W = BATTLE.fieldWidth;
  const H = BATTLE.fieldHeight;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = "#0c0e13";
  ctx.fillRect(0, 0, W, H);

  // Floor with a faint tile grid; each half tinted in its team's colour.
  ctx.fillStyle = "#1a1720";
  ctx.fillRect(0, 0, W, H / 2);
  ctx.fillStyle = "#151b26";
  ctx.fillRect(0, H / 2, W, H / 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = TILE; x < W; x += TILE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = TILE; y < H; y += TILE) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2);
  ctx.stroke();

  // Walls.
  ctx.strokeStyle = "#3a4256";
  ctx.lineWidth = WALL;
  ctx.strokeRect(WALL / 2, WALL / 2, W - WALL, H - WALL);
  ctx.strokeStyle = "rgba(255, 60, 60, 0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WALL, WALL);
  ctx.lineTo(W - WALL, WALL);
  ctx.stroke();
  ctx.strokeStyle = "rgba(77, 163, 255, 0.45)";
  ctx.beginPath();
  ctx.moveTo(WALL, H - WALL);
  ctx.lineTo(W - WALL, H - WALL);
  ctx.stroke();
}

/** Draws one moment of the battle onto a canvas whose drawing buffer is `scale` × the field size. */
export function drawBattle(ctx: CanvasRenderingContext2D, pb: Playback, tick: number, scale: number): void {
  const W = BATTLE.fieldWidth;
  const H = BATTLE.fieldHeight;
  drawField(ctx, scale);
  if (pb.suddenDeathAt(tick)) {
    ctx.fillStyle = "rgba(255, 60, 60, 0.08)";
    ctx.fillRect(0, 0, W, H);
  }

  for (const h of pb.hitsAt(tick)) {
    if (h.area > 0) {
      ctx.strokeStyle = `rgba(255, 200, 80, ${0.7 * h.fresh})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.area, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * h.fresh})`;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const u of pb.unitsAt(tick)) drawUnit(ctx, u);

  for (const p of pb.projectilesAt(tick)) {
    ctx.fillStyle = p.side === 0 ? "#bfe0ff" : "#ffd0d0";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export interface UnitDrawOptions {
  /** 0..1 size factor, for spawn animations. */
  grow?: number;
  /** 0..1 strength of a highlight ring (new or levelled-up units). */
  glow?: number;
}

/** A unit as a round token in its side's colour with its picture inside. */
export function drawUnit(ctx: CanvasRenderingContext2D, u: UnitView, opts: UnitDrawOptions = {}): void {
  const type = getUnitType(u.typeId);
  const grow = opts.grow ?? 1;
  if (grow <= 0) return;
  const r = u.radius * VISUAL_SCALE * grow;

  if (opts.glow && opts.glow > 0) {
    ctx.strokeStyle = `rgba(255, 200, 80, ${opts.glow})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(u.x, u.y, r + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(u.x, u.y, r, 0, Math.PI * 2);
  ctx.fillStyle = SIDE_DARK[u.side];
  ctx.fill();
  ctx.lineWidth = type.damageKind === "area" ? 4 : 3;
  ctx.strokeStyle = type.damageKind === "area" ? "#ffc850" : SIDE_COLOR[u.side];
  ctx.stroke();

  const img = unitImage(u.typeId);
  if (img) {
    const s = r * 1.5;
    ctx.drawImage(img, u.x - s / 2, u.y - s / 2, s, s);
  }

  // Level pips.
  for (let i = 1; i < u.level; i++) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(u.x - r + i * 8, u.y - r - 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (u.hp < u.maxHp) {
    const w = Math.max(16, r * 2);
    const frac = u.hp / u.maxHp;
    ctx.fillStyle = "#000000aa";
    ctx.fillRect(u.x - w / 2, u.y + r + 3, w, 4);
    ctx.fillStyle = frac > 0.5 ? "#62d26f" : frac > 0.25 ? "#f0c040" : "#f05050";
    ctx.fillRect(u.x - w / 2, u.y + r + 3, w * frac, 4);
  }
}
