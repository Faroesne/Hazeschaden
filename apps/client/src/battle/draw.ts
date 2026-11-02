import { BATTLE, getUnitType, type Role } from "@hazeschaden/shared";
import type { Playback, UnitView } from "./playback";

export const SIDE_COLOR = ["#4da3ff", "#ff5d5d"] as const;
/** Units are drawn larger than their collision radius so they stay readable on a phone. */
const VISUAL_SCALE = 1.8;
const SIDE_DARK = ["#1d4f85", "#8a2525"] as const;

/** Draws one moment of the battle onto a canvas whose drawing buffer is `scale` × the field size. */
export function drawBattle(ctx: CanvasRenderingContext2D, pb: Playback, tick: number, scale: number): void {
  const W = BATTLE.fieldWidth;
  const H = BATTLE.fieldHeight;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // Field: own half bottom, enemy half top.
  ctx.fillStyle = "#151922";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#181d28";
  ctx.fillRect(0, H / 2, W, H / 2);
  ctx.strokeStyle = "#2a3242";
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.setLineDash([]);

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
      ctx.arc(h.x, h.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const u of pb.unitsAt(tick)) drawUnit(ctx, u);

  for (const p of pb.projectilesAt(tick)) {
    ctx.fillStyle = p.side === 0 ? "#bfe0ff" : "#ffd0d0";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function shape(ctx: CanvasRenderingContext2D, role: Role, x: number, y: number, r: number): void {
  ctx.beginPath();
  if (role === "tank") {
    ctx.rect(x - r, y - r, r * 2, r * 2);
  } else if (role === "ranged") {
    ctx.moveTo(x, y - r * 1.15);
    ctx.lineTo(x + r * 1.1, y + r * 0.85);
    ctx.lineTo(x - r * 1.1, y + r * 0.85);
    ctx.closePath();
  } else {
    ctx.moveTo(x, y - r * 1.2);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r * 1.2);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  }
}

function drawUnit(ctx: CanvasRenderingContext2D, u: UnitView): void {
  const type = getUnitType(u.typeId);
  const r = u.radius * VISUAL_SCALE;
  shape(ctx, type.role, u.x, u.y, r);
  ctx.fillStyle = SIDE_COLOR[u.side];
  ctx.fill();
  ctx.lineWidth = type.damageKind === "area" ? 4 : 2;
  ctx.strokeStyle = type.damageKind === "area" ? "#ffc850" : SIDE_DARK[u.side];
  ctx.stroke();

  // Level pips.
  for (let i = 1; i < u.level; i++) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(u.x - r + i * 10, u.y - r - 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (u.hp < u.maxHp) {
    const w = Math.max(16, r * 2);
    const frac = u.hp / u.maxHp;
    ctx.fillStyle = "#000000aa";
    ctx.fillRect(u.x - w / 2, u.y + r + 4, w, 6);
    ctx.fillStyle = frac > 0.5 ? "#62d26f" : frac > 0.25 ? "#f0c040" : "#f05050";
    ctx.fillRect(u.x - w / 2, u.y + r + 4, w * frac, 6);
  }
}
