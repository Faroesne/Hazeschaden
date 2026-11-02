import { BATTLE, UNITS, getUnitType } from "@hazeschaden/shared";
import { unitSvg } from "../art/unitArt";
import { animatesDeath, drawCharacter, hasCharacter } from "./characters";
import { ARENA, FEET_OFFSET_PER_RADIUS, FX, OUTLINE, TEAM, charHeight as heightFor } from "./characters/style";
import type { DyingView, HitView, Playback, ProjectileView, UnitView } from "./playback";

/** Unit symbols in white for units without a character yet. Created once, on first use (browser only). */
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

export const SIDE_COLOR = [TEAM[0].base, TEAM[1].base] as const;
const SIDE_DARK = [TEAM[0].shade, TEAM[1].shade] as const;
/** Symbol tokens are drawn slightly smaller than their collision radius, so neighbours never touch. */
const TOKEN_SCALE = 0.92;
const WALL = 14;

/** Clears the canvas and draws the arena: grass with mowing stripes, chalk lines, stone walls, team banners. */
export function drawField(ctx: CanvasRenderingContext2D, scale: number): void {
  const W = BATTLE.fieldWidth;
  const H = BATTLE.fieldHeight;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  ctx.fillStyle = ARENA.grass;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ARENA.grassStripe;
  for (let y = 0; y < H; y += 120) ctx.fillRect(0, y, W, 60);

  // Chalk: centre line and circle.
  ctx.strokeStyle = ARENA.chalk;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(WALL, H / 2);
  ctx.lineTo(W - WALL, H / 2);
  ctx.moveTo(W / 2 + 64, H / 2);
  ctx.arc(W / 2, H / 2, 64, 0, Math.PI * 2);
  ctx.stroke();

  // Team banners along the back lines.
  for (const side of [0, 1] as const) {
    const y = side === 0 ? H - WALL - 10 : WALL;
    ctx.fillStyle = TEAM[side].base;
    ctx.fillRect(WALL, y, W - 2 * WALL, 10);
    ctx.fillStyle = TEAM[side].shade;
    ctx.fillRect(WALL, side === 0 ? y + 7 : y, W - 2 * WALL, 3);
  }

  // Stone walls with a dark inner edge and block joints.
  ctx.fillStyle = ARENA.stone;
  ctx.fillRect(0, 0, W, WALL);
  ctx.fillRect(0, H - WALL, W, WALL);
  ctx.fillRect(0, 0, WALL, H);
  ctx.fillRect(W - WALL, 0, WALL, H);
  ctx.strokeStyle = ARENA.stoneDark;
  ctx.lineWidth = 3;
  ctx.strokeRect(WALL - 1.5, WALL - 1.5, W - 2 * WALL + 3, H - 2 * WALL + 3);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 40; x < W; x += 48) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WALL);
    ctx.moveTo(x, H - WALL);
    ctx.lineTo(x, H);
  }
  for (let y = 40; y < H; y += 48) {
    ctx.moveTo(0, y);
    ctx.lineTo(WALL, y);
    ctx.moveTo(W - WALL, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
}

/** Draws one moment of the battle onto a canvas whose drawing buffer is `scale` × the field size. */
export function drawBattle(ctx: CanvasRenderingContext2D, pb: Playback, tick: number, scale: number): void {
  drawField(ctx, scale);
  if (pb.suddenDeathAt(tick)) {
    ctx.fillStyle = "rgba(255, 40, 40, 0.10)";
    ctx.fillRect(0, 0, BATTLE.fieldWidth, BATTLE.fieldHeight);
  }

  const hits = pb.hitsAt(tick);
  for (const h of hits) if (h.area > 0) drawShockwave(ctx, h);

  // Living and dying units together, back to front.
  const all: (UnitView | DyingView)[] = [...pb.unitsAt(tick), ...pb.dyingAt(tick)];
  all.sort((a, b) => a.y - b.y || a.id - b.id);
  const time = tick / BATTLE.ticksPerSecond;
  for (const u of all) {
    if ("progress" in u) drawDying(ctx, u, time);
    else drawUnit(ctx, u, { time });
  }

  for (const h of hits) if (h.area === 0) drawSpark(ctx, h);
  for (const p of pb.projectilesAt(tick)) drawProjectile(ctx, p, time);
}

export interface UnitDrawOptions {
  /** Seconds, drives idle/walk cycles. */
  time?: number;
  /** 0..1 size factor, for spawn animations. */
  grow?: number;
  /** 0..1 strength of a highlight ring (new or levelled-up units). */
  glow?: number;
}

const charHeight = (u: { radius: number }) => heightFor(u.radius);

/** A unit: its character if it has one (docs/ART_STYLE.md), otherwise a symbol token. */
export function drawUnit(ctx: CanvasRenderingContext2D, u: UnitView, opts: UnitDrawOptions = {}): void {
  const grow = opts.grow ?? 1;
  if (grow <= 0) return;
  const time = (opts.time ?? 0) + u.id * 0.37;

  if (hasCharacter(u.typeId)) {
    const feetY = u.y + u.radius * FEET_OFFSET_PER_RADIUS;
    if (opts.glow && opts.glow > 0) {
      ctx.strokeStyle = `rgba(255, 210, 80, ${opts.glow})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(u.x, feetY, u.radius * 1.3, u.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(u.x - u.facing * 2.5 * u.hurt, feetY);
    drawCharacter(ctx, u.typeId, { time, walking: u.walking, attack: u.attack, hurt: u.hurt, team: u.side }, charHeight(u) * grow, u.facing);
    ctx.restore();
    drawOverhead(ctx, u, feetY - charHeight(u) * grow);
    return;
  }

  const type = getUnitType(u.typeId);
  const r = u.radius * TOKEN_SCALE * grow;
  if (opts.glow && opts.glow > 0) {
    ctx.strokeStyle = `rgba(255, 200, 80, ${opts.glow})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(u.x, u.y, r + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(u.x, u.y + r * 0.85, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(u.x, u.y, r, 0, Math.PI * 2);
  ctx.fillStyle = u.hurt > 0 ? "#ffffff" : SIDE_DARK[u.side];
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = type.damageKind === "area" ? "#ffc850" : OUTLINE;
  ctx.stroke();
  const img = unitImage(u.typeId);
  if (img) {
    const s = r * 1.5;
    ctx.drawImage(img, u.x - s / 2, u.y - s / 2, s, s);
  }
  drawOverhead(ctx, u, u.y - r - 4);
}

/** Level stars and (when hurt) the health bar above a unit; `top` is the y of its head. */
function drawOverhead(ctx: CanvasRenderingContext2D, u: UnitView, top: number): void {
  let y = top - 4;
  if (u.hp < u.maxHp && u.hp > 0) {
    const w = Math.max(18, u.radius * 1.8);
    const frac = u.hp / u.maxHp;
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(u.x - w / 2 - 1, y - 5, w + 2, 6);
    ctx.fillStyle = frac > 0.5 ? "#62d26f" : frac > 0.25 ? "#f0c040" : "#f05050";
    ctx.fillRect(u.x - w / 2, y - 4, w * frac, 4);
    y -= 8;
  }
  for (let i = 1; i < u.level; i++) star(ctx, u.x + (i - u.level / 2) * 9, y - 3, 4);
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = "#ffcf3f";
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

/** A unit tipping over and fading, with a smoke puff. */
function drawDying(ctx: CanvasRenderingContext2D, u: DyingView, time: number): void {
  const k = u.progress;
  if (hasCharacter(u.typeId)) {
    const feetY = u.y + u.radius * FEET_OFFSET_PER_RADIUS;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.translate(u.x, feetY);
    if (!animatesDeath(u.typeId)) ctx.rotate(-u.facing * Math.min(1, k * 1.6) * 1.35);
    drawCharacter(ctx, u.typeId, { time, walking: false, attack: null, hurt: k < 0.2 ? 1 : 0, team: u.side }, charHeight(u), u.facing, k);
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.beginPath();
    ctx.arc(u.x, u.y, u.radius * TOKEN_SCALE * (1 - k * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = SIDE_DARK[u.side];
    ctx.fill();
    ctx.restore();
  }
  // Smoke puff.
  ctx.save();
  ctx.globalAlpha = Math.max(0, 0.75 * (1 - k));
  ctx.fillStyle = FX.smoke;
  const base = u.radius * (0.5 + k * 0.9);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + u.id;
    ctx.beginPath();
    ctx.arc(u.x + Math.cos(a) * base * 0.8, u.y - k * 10 + Math.sin(a) * base * 0.5, base * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Colours of an area hit by attacker: ring, fill, particles. */
const AREA_STYLE: Record<string, [string, string, string]> = {
  funkenwerfer: [FX.fire, "rgba(255,120,40,0.25)", FX.muzzle],
  moerser: [FX.muzzle, "rgba(255,150,60,0.22)", FX.smoke],
  giftmischer: [FX.poison, "rgba(120,220,80,0.28)", "#c8ff9a"],
  bollwerk: [FX.dust, "rgba(200,180,140,0.25)", "#9a9cab"],
  dornenwache: [FX.dust, "rgba(120,160,80,0.22)", "#efe6d2"],
  wirbelklinge: ["#ffffff", "rgba(255,255,255,0.15)", "#d9d4e3"],
};

/** Area hit: a shockwave ring growing to the real radius, plus particles in the attacker's colours. */
function drawShockwave(ctx: CanvasRenderingContext2D, h: HitView): void {
  const k = 1 - h.fresh;
  const r = h.area * (0.35 + 0.65 * k);
  const [ring, fill, specks] = AREA_STYLE[h.typeId] ?? [FX.shockwave, "rgba(255, 215, 106, 0.18)", FX.dust];
  ctx.save();
  ctx.globalAlpha = h.fresh;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(h.x, h.y, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = specks;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + h.seed;
    ctx.beginPath();
    ctx.arc(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r * 0.7 - k * 8, 4 * h.fresh + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Single-target hit: a small four-pointed spark. */
function drawSpark(ctx: CanvasRenderingContext2D, h: HitView): void {
  const r = 6 + 8 * (1 - h.fresh);
  ctx.save();
  ctx.globalAlpha = h.fresh;
  ctx.translate(h.x, h.y - 10);
  ctx.rotate(h.seed);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.3;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = FX.sparkHot;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = FX.spark;
  ctx.fill();
  ctx.restore();
}

/** Projectiles: arrows point along their flight, mortar shells fly in a visible arc with a smoke trail. */
function drawProjectile(ctx: CanvasRenderingContext2D, p: ProjectileView, time: number): void {
  const team = TEAM[p.side];
  if (p.typeId === "moerser") {
    const arc = (k: number) => Math.sin(k * Math.PI) * 120;
    for (let i = 1; i <= 3; i++) {
      const k = Math.max(0, p.progress - i * 0.05);
      ctx.globalAlpha = 0.35 / i;
      ctx.fillStyle = FX.smoke;
      ctx.beginPath();
      ctx.arc(p.x - p.dirX * i * 14, p.y - p.dirY * i * 14 - arc(k), 5 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    const lift = arc(p.progress);
    ctx.beginPath();
    ctx.arc(p.x, p.y - lift, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#3a3f4d";
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = FX.muzzle;
    ctx.beginPath();
    ctx.arc(p.x - 2, p.y - lift - 9 + Math.sin(time * 30) * 1.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (p.typeId === "bogenschuetzen" || p.typeId === "scharfschuetze") {
    const len = p.typeId === "scharfschuetze" ? 30 : 22;
    const lift = Math.sin(p.progress * Math.PI) * (p.typeId === "scharfschuetze" ? 6 : 18);
    ctx.save();
    ctx.translate(p.x, p.y - 18 - lift);
    ctx.rotate(Math.atan2(p.dirY, p.dirX));
    ctx.lineCap = "round";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(len / 2, 0);
    ctx.stroke();
    ctx.strokeStyle = "#a8743f";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "#c9d3e0";
    ctx.beginPath();
    ctx.moveTo(len / 2 + 7, 0);
    ctx.lineTo(len / 2 - 1, -4);
    ctx.lineTo(len / 2 - 1, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = team.base;
    ctx.fillRect(-len / 2 - 2, -3.5, 6, 7);
    ctx.restore();
    return;
  }
  // Generic bolt (fire for the spark throwers, team-coloured otherwise).
  ctx.fillStyle = p.typeId === "funkenwerfer" ? FX.muzzle : team.light;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 16, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
}
