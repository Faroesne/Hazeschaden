import { STRIKE, bodyMotion, circle, ellipse, roundRect, swing, type CharacterDraw, type Painter } from "./paint";
import { belt, clothLeg, hand } from "./parts";
import { MAT, TEAM } from "./style";

/**
 * Giftmischer: plague-doctor figure. Wide-brimmed hat, bone beak mask with green glass eyes,
 * long dark coat with team hem and lapels, belt with glowing vials. Lobs a vial overhead.
 */
export const drawGiftmischer: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const holding = pose.attack !== null && pose.attack < STRIKE + 0.02;
  const sway = Math.sin(pose.time * 3) * 1.5 + (pose.walking ? 2.5 : 0);

  clothLeg(p, -10, -24, 8, legA, MAT.cloth, MAT.darkLeather);
  clothLeg(p, 3, -24, 8, legB, MAT.cloth, MAT.darkLeather);

  c.save();
  c.translate(0, bob);

  // Back arm.
  hand(p, -14, -38, MAT.darkLeather, 3.8);

  // Long coat with team hem and lapels.
  const coat = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-13, -60);
    cc.lineTo(13, -60);
    cc.lineTo(16, -18);
    cc.quadraticCurveTo(0, -14 + sway * 0.4, -18 - sway, -18);
    cc.closePath();
  };
  p.part3(coat, MAT.cloth, 4, -8);
  p.line((cc) => {
    cc.moveTo(16, -18);
    cc.quadraticCurveTo(0, -14 + sway * 0.4, -18 - sway, -18);
  }, 3, team.base);
  p.part3((cc) => {
    cc.moveTo(-3, -60);
    cc.lineTo(7, -60);
    cc.lineTo(3, -40);
    cc.closePath();
  }, team, 4, -1);
  p.line((cc) => {
    cc.moveTo(-6, -40);
    cc.lineTo(-8, -20);
    cc.moveTo(6, -40);
    cc.lineTo(8, -21);
  }, 1.1, MAT.cloth.light);
  belt(p, -15, -36, 31, 9);
  // Vials on the belt.
  for (const vx of [-10, -3]) vial(p, vx, -31, 0.8);

  // Head: hood shadow, beak mask, green glass eyes, wide hat.
  p.part3((cc) => circle(cc, 1, -70, 14), MAT.darkLeather, 7, -6);
  p.part3((cc) => {
    cc.moveTo(4, -74);
    cc.quadraticCurveTo(22, -70, 32, -58);
    cc.quadraticCurveTo(20, -60, 6, -60);
    cc.closePath();
  }, MAT.bone, 20, 10);
  p.line((cc) => {
    cc.moveTo(8, -66);
    cc.quadraticCurveTo(18, -64, 28, -59);
  }, 0.9);
  for (const ex of [3, 11]) {
    p.part3((cc) => circle(cc, ex, -73, 3.6), MAT.bronze, ex + 1, ex - 2);
    p.flat((cc) => circle(cc, ex, -73, 2.4), MAT.poison.base);
    p.gloss((cc) => circle(cc, ex - 0.8, -74, 0.9), 0.9);
  }
  p.part3((cc) => {
    cc.moveTo(-24, -80);
    cc.quadraticCurveTo(1, -86, 28, -80);
    cc.quadraticCurveTo(30, -76, 24, -77);
    cc.quadraticCurveTo(1, -81, -22, -77);
    cc.quadraticCurveTo(-27, -77, -24, -80);
    cc.closePath();
  }, MAT.darkLeather, 10, -12);
  p.part3((cc) => {
    cc.moveTo(-11, -82);
    cc.lineTo(-9, -100);
    cc.lineTo(13, -100);
    cc.lineTo(15, -82);
    cc.closePath();
  }, MAT.darkLeather, 7, -5);
  p.part3((cc) => roundRect(cc, -11, -87, 26, 5, 2), team, 9, -6);

  // Throwing arm: raised behind with a vial while winding up, flung forward on the strike.
  const angle = s < 0 ? -0.6 + s * 2.2 : -0.6 + s * 1.4;
  c.save();
  c.translate(8, -54);
  c.rotate(angle);
  p.stroke((cc) => {
    cc.moveTo(0, 0);
    cc.lineTo(16, 0);
  }, MAT.cloth.base, 7);
  if (holding) vial(p, 20, -4, 1.1);
  hand(p, 17, 0, MAT.darkLeather, 4);
  c.restore();

  c.restore();
};

function vial(p: Painter, x: number, y: number, scale: number): void {
  const c = p.ctx;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  p.part3((cc) => roundRect(cc, -1.8, -9, 3.6, 4, 1), MAT.wood, 1, -1);
  p.part3((cc) => ellipse(cc, 0, -2, 4.2, 5), MAT.poison, 1.5, -2);
  c.save();
  c.globalAlpha = 0.35;
  p.flat((cc) => circle(cc, 0, -2, 7), MAT.poison.light);
  c.restore();
  p.gloss((cc) => circle(cc, -1.4, -3.5, 1.1), 0.9);
  c.restore();
}
