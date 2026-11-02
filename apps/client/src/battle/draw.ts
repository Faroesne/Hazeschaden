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
/** Units are drawn larger than their collision radius so they stay readable on a phone. */
const VISUAL_SCALE = 1.8;
const SIDE_DARK = ["#1d4f85", "#8a2525"] as const;

/** Which part of the field is visible: top-left corner and zoom (1 = whole field). */
export interface Camera {
  x0: number;
  y0: number;
  zoom: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const MAX_ZOOM = 2.4;
const CAMERA_PAD = 90;

/** Zooms in on `bounds` (plus padding), keeping the field's aspect ratio and never zooming out past the whole field. */
export function fitCamera(b: Bounds): Camera {
  const W = BATTLE.fieldWidth;
  const H = BATTLE.fieldHeight;
  const bw = b.maxX - b.minX + 2 * CAMERA_PAD;
  const bh = b.maxY - b.minY + 2 * CAMERA_PAD;
  const zoom = Math.max(1, Math.min(MAX_ZOOM, W / bw, H / bh));
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const vw = W / zoom;
  const vh = H / zoom;
  return {
    x0: Math.min(W - vw, Math.max(0, cx - vw / 2)),
    y0: Math.min(H - vh, Math.max(0, cy - vh / 2)),
    zoom,
  };
}

export function boundsOf(points: Iterable<{ x: number; y: number }>): Bounds {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const p of points) {
    b.minX = Math.min(b.minX, p.x);
    b.minY = Math.min(b.minY, p.y);
    b.maxX = Math.max(b.maxX, p.x);
    b.maxY = Math.max(b.maxY, p.y);
  }
  if (b.minX === Infinity) return { minX: 0, minY: 0, maxX: BATTLE.fieldWidth, maxY: BATTLE.fieldHeight };
  return b;
}

const WHOLE_FIELD: Camera = { x0: 0, y0: 0, zoom: 1 };

/** Clears the canvas and draws the empty field: own half bottom, enemy half top. */
export function drawField(ctx: CanvasRenderingContext2D, scale: number, cam: Camera = WHOLE_FIELD): void {
  const W = BATTLE.fieldWidth;
  const H = BATTLE.fieldHeight;
  const z = scale * cam.zoom;
  ctx.setTransform(z, 0, 0, z, -cam.x0 * z, -cam.y0 * z);
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
}

/** Draws one moment of the battle onto a canvas whose drawing buffer is `scale` × the field size. */
export function drawBattle(ctx: CanvasRenderingContext2D, pb: Playback, tick: number, scale: number, cam: Camera = WHOLE_FIELD): void {
  const W = BATTLE.fieldWidth;
  const H = BATTLE.fieldHeight;
  drawField(ctx, scale, cam);
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
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(u.x, u.y, r + 8, 0, Math.PI * 2);
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
