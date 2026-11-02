import { circle, ellipse, roundRect, type Painter } from "./paint";
import { MAT, type Tone } from "./style";

/** Shared body parts so every figure has the same level of detail (docs/ART_STYLE.md §3). */

/** Cloth/leather leg with a cuffed boot and a sole line. `lift` raises the foot while walking. */
export function clothLeg(p: Painter, x: number, hipY: number, width: number, lift: number, cloth: Tone, boot: Tone): void {
  p.part3((c) => roundRect(c, x, hipY, width, -hipY - lift - 7, 3), cloth, x + width * 0.6, x + width * 0.25);
  p.part3((c) => {
    c.moveTo(x - 1, -lift);
    c.lineTo(x - 1, -10 - lift);
    c.lineTo(x + width + 1, -10 - lift);
    c.lineTo(x + width + 1, -5 - lift);
    c.quadraticCurveTo(x + width + 7, -4 - lift, x + width + 6, -lift);
    c.closePath();
  }, boot, x + width * 0.6, x + 1.5);
  p.line((c) => {
    c.moveTo(x - 1, -7 - lift);
    c.lineTo(x + width + 1, -7 - lift);
  }, 1);
}

/** Plate leg: greave, knee cop with a gold rivet, pointed sabaton. */
export function armoredLeg(p: Painter, x: number, lift: number, width = 12): void {
  p.part3((c) => roundRect(c, x, -26, width, 20 - lift, 4), MAT.steel, x + width * 0.6, x + 3);
  p.part3((c) => circle(c, x + width / 2, -21 - lift * 0.5, 4.5), MAT.steel, x + width / 2 + 1, x + width / 2 - 2);
  p.rivets([[x + width / 2, -21 - lift * 0.5]], 1.1, MAT.gold);
  p.part3((c) => {
    c.moveTo(x - 2, -lift);
    c.lineTo(x - 2, -8 - lift);
    c.lineTo(x + width, -8 - lift);
    c.quadraticCurveTo(x + width + 7, -5 - lift, x + width + 6, -lift);
    c.closePath();
  }, MAT.iron, x + width * 0.75, x + 2);
}

/** Chibi eyes looking right: dark ovals with a white glint, and optional brows (angle > 0 = fierce). */
export function eyes(p: Painter, x: number, y: number, gap = 7, size = 2.6, brow = 0.25): void {
  for (const ex of [x, x + gap]) {
    p.flat((c) => ellipse(c, ex, y, size * 0.8, size), "#1b1530");
    p.gloss((c) => circle(c, ex - size * 0.25, y - size * 0.4, size * 0.35), 0.9);
  }
  if (brow !== null) {
    p.line((c) => {
      c.moveTo(x - size, y - size - 2.5 - brow * 2);
      c.lineTo(x + size, y - size - 2.5 + brow * 2);
      c.moveTo(x + gap - size, y - size - 2.5 + brow * 2);
      c.lineTo(x + gap + size, y - size - 2.5 - brow * 2);
    }, 1.8);
  }
}

/** A round hand/fist. */
export function hand(p: Painter, x: number, y: number, skin: Tone, r = 4.5): void {
  p.part3((c) => circle(c, x, y, r), skin, x + r * 0.2, x - r * 0.4);
}

/** A belt with a gold buckle across the waist. */
export function belt(p: Painter, x: number, y: number, w: number, buckleX = x + w / 2): void {
  p.part3((c) => roundRect(c, x, y, w, 6, 2.5), MAT.leather, x + w * 0.65, x + 3);
  p.part3((c) => roundRect(c, buckleX - 4, y - 1, 8, 8, 2), MAT.gold, buckleX + 1, buckleX - 2);
  p.flat((c) => roundRect(c, buckleX - 1.8, y + 1.2, 3.6, 3.6, 1), MAT.leather.shade);
}

/** Thin stitching along a path (dashed detail line). */
export function stitches(p: Painter, path: (c: CanvasRenderingContext2D) => void, color = "rgba(255,255,255,0.45)"): void {
  const c = p.ctx;
  c.save();
  c.setLineDash([2.2, 2.2]);
  c.beginPath();
  path(c);
  c.strokeStyle = color;
  c.lineWidth = 1;
  c.stroke();
  c.restore();
}
