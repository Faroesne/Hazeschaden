import { ATTACK_RECOVER_TICKS, ATTACK_WINDUP_TICKS } from "../playback";
import { OUTLINE, OUTLINE_WIDTH, type Tone } from "./style";

/** Where in the attack animation (0..1) the blow lands. */
export const STRIKE = ATTACK_WINDUP_TICKS / (ATTACK_WINDUP_TICKS + ATTACK_RECOVER_TICKS);

export interface Pose {
  /** Seconds, drives idle and walk cycles. */
  time: number;
  walking: boolean;
  /** 0..1 attack animation progress, or null. */
  attack: number | null;
  /** 0..1 white flash strength. */
  hurt: number;
  team: 0 | 1;
}

export type CharacterDraw = (p: Painter, pose: Pose) => void;

const rgbCache = new Map<string, [number, number, number]>();
function rgb(hex: string): [number, number, number] {
  let c = rgbCache.get(hex);
  if (!c) {
    const n = parseInt(hex.slice(1), 16);
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(hex, c);
  }
  return c;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export const easeOut = (k: number): number => 1 - (1 - k) * (1 - k);
export const easeInOut = (k: number): number => (k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k));

/**
 * Attack swing curve: 0 → -1 while winding up, snaps to +1 on the strike, eases back to 0.
 * Every weapon animation maps -1 to its "raised" pose and +1 to its "follow-through" pose.
 */
export function swing(attack: number | null): number {
  if (attack === null) return 0;
  const strikeEnd = STRIKE + 0.1;
  if (attack < STRIKE) return -easeOut(attack / STRIKE);
  if (attack < strikeEnd) return -1 + 2 * easeOut((attack - STRIKE) / (strikeEnd - STRIKE));
  return 1 - easeInOut((attack - strikeEnd) / (1 - strikeEnd));
}

/** 0..1 peak right at the strike, for squash and impact effects. */
export function impact(attack: number | null): number {
  if (attack === null) return 0;
  return clamp01(1 - Math.abs(attack - STRIKE) / 0.12);
}

/** Shared body motion: breathing when idle, hopping and alternating legs when walking. */
export function bodyMotion(pose: Pose): { bob: number; legA: number; legB: number } {
  if (pose.walking) {
    const ph = pose.time * 2.5 * Math.PI * 2;
    return { bob: -Math.abs(Math.sin(ph / 2)) * 4, legA: Math.max(0, Math.sin(ph)) * 5, legB: Math.max(0, -Math.sin(ph)) * 5 };
  }
  return { bob: Math.sin((pose.time * Math.PI * 2) / 1.2) * 1.5, legA: 0, legB: 0 };
}

/**
 * Draws character parts in the style of docs/ART_STYLE.md: flat base colour, a shade on the
 * right side of each part, one outline colour and width. A hurt pose flashes everything white.
 */
export class Painter {
  constructor(
    readonly ctx: CanvasRenderingContext2D,
    private readonly flash: number,
  ) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
  }

  color(hex: string): string {
    if (this.flash <= 0) return hex;
    const [r, g, b] = rgb(hex);
    const k = this.flash * 0.85;
    return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`;
  }

  /** A filled, shaded, outlined part. `shadeFrom` is the x where the right-hand shade begins. */
  part(path: (c: CanvasRenderingContext2D) => void, tone: Tone, shadeFrom?: number): void {
    const c = this.ctx;
    c.beginPath();
    path(c);
    c.fillStyle = this.color(tone.base);
    c.fill();
    if (shadeFrom !== undefined) {
      c.save();
      c.clip();
      c.fillStyle = this.color(tone.shade);
      c.fillRect(shadeFrom, -300, 600, 600);
      c.restore();
    }
    c.beginPath();
    path(c);
    c.strokeStyle = OUTLINE;
    c.lineWidth = OUTLINE_WIDTH;
    c.stroke();
  }

  /** An outlined stroke (shafts, strings, handles): dark border under a coloured core. */
  stroke(path: (c: CanvasRenderingContext2D) => void, color: string, width: number): void {
    const c = this.ctx;
    c.beginPath();
    path(c);
    c.strokeStyle = OUTLINE;
    c.lineWidth = width + OUTLINE_WIDTH * 1.4;
    c.stroke();
    c.beginPath();
    path(c);
    c.strokeStyle = this.color(color);
    c.lineWidth = width;
    c.stroke();
  }

  /**
   * A part with three tones: base, shade on the right of `shadeFrom`, and a light rim on the
   * left of `lightTo` (the lit side, light from top-left).
   */
  part3(path: (c: CanvasRenderingContext2D) => void, tone: Tone, shadeFrom: number, lightTo: number): void {
    const c = this.ctx;
    c.beginPath();
    path(c);
    c.fillStyle = this.color(tone.base);
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = this.color(tone.shade);
    c.fillRect(shadeFrom, -300, 600, 600);
    if (tone.light) {
      c.fillStyle = this.color(tone.light);
      c.fillRect(-300, -300, 300 + lightTo, 600);
    }
    c.restore();
    c.beginPath();
    path(c);
    c.strokeStyle = OUTLINE;
    c.lineWidth = OUTLINE_WIDTH;
    c.stroke();
  }

  /** Thin inner detail lines (plate seams, folds, stitching). */
  line(path: (c: CanvasRenderingContext2D) => void, width = 1.6, color: string = OUTLINE): void {
    const c = this.ctx;
    c.beginPath();
    path(c);
    c.strokeStyle = color === OUTLINE ? OUTLINE : this.color(color);
    c.lineWidth = width;
    c.stroke();
  }

  /** A soft specular glint (metal, gems): white with alpha, no outline. */
  gloss(path: (c: CanvasRenderingContext2D) => void, alpha = 0.55): void {
    const c = this.ctx;
    c.beginPath();
    path(c);
    c.fillStyle = `rgba(255,255,255,${Math.min(1, alpha + this.flash * 0.3)})`;
    c.fill();
  }

  /** Small rivets/studs along a list of points. */
  rivets(points: readonly (readonly [number, number])[], r = 1.6, tone: Tone = { base: "#e9eef5", shade: "#8a97ab" }): void {
    const c = this.ctx;
    for (const [x, y] of points) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fillStyle = this.color(tone.base);
      c.fill();
      c.lineWidth = 0.9;
      c.strokeStyle = OUTLINE;
      c.stroke();
    }
  }

  /** A flat detail without outline (eyes, slits, highlights). */
  flat(path: (c: CanvasRenderingContext2D) => void, color: string): void {
    const c = this.ctx;
    c.beginPath();
    path(c);
    c.fillStyle = this.color(color);
    c.fill();
  }
}

export function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

export function circle(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  c.moveTo(x + r, y);
  c.arc(x, y, r, 0, Math.PI * 2);
}

export function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  c.moveTo(x + rx, y);
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

/** Two legs with boots; `legA`/`legB` lift each foot while walking. */
export function legs(p: Painter, x1: number, x2: number, width: number, hipY: number, tone: Tone, boot: Tone, liftA: number, liftB: number): void {
  for (const [x, lift] of [
    [x1, liftA],
    [x2, liftB],
  ] as const) {
    p.part((c) => roundRect(c, x, hipY, width, -hipY - lift - 6, 3), tone, x + width * 0.6);
    p.part((c) => roundRect(c, x - 1, -lift - 8, width + 5, 8, 3), boot, x + width * 0.7);
  }
}
