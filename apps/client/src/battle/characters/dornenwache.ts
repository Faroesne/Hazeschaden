import { STRIKE, bodyMotion, circle, impact, roundRect, swing, type CharacterDraw } from "./paint";
import { belt, clothLeg, eyes } from "./parts";
import { MAT, TEAM } from "./style";

/**
 * Dornenwache: stocky warden in thorned green plate, spiked round helm, team tabard, kite shield
 * wrapped in a thorny vine. Shield bash with a burst of thorns.
 */
export const drawDornenwache: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const hit = impact(pose.attack);
  const burst = pose.attack !== null && pose.attack >= STRIKE ? hit : 0;

  clothLeg(p, -14, -24, 11, legA, MAT.thorn, MAT.iron);
  clothLeg(p, 2, -24, 11, legB, MAT.thorn, MAT.iron);

  c.save();
  c.translate(0, bob);
  c.scale(1 + hit * 0.05, 1 - hit * 0.06);

  // Thorned plate torso.
  p.part3((cc) => roundRect(cc, -18, -56, 36, 32, 9), MAT.thorn, 5, -10);
  p.part3((cc) => {
    cc.moveTo(-9, -54);
    cc.lineTo(9, -54);
    cc.lineTo(10, -22);
    cc.lineTo(0, -18);
    cc.lineTo(-10, -22);
    cc.closePath();
  }, team, 3, -5);
  p.line((cc) => {
    cc.moveTo(-9, -54);
    cc.lineTo(9, -54);
    cc.lineTo(10, -22);
    cc.lineTo(0, -18);
    cc.lineTo(-10, -22);
    cc.closePath();
  }, 1.8, MAT.gold.base);
  belt(p, -19, -31, 38, 0);
  // Spiked pauldrons.
  for (const x of [-18, 16]) {
    p.part3((cc) => circle(cc, x, -54, 8), MAT.thorn, x + 2, x - 4);
    for (const a of [-2.2, -1.57, -0.9]) {
      p.part3((cc) => {
        cc.moveTo(x + Math.cos(a - 0.3) * 7, -54 + Math.sin(a - 0.3) * 7);
        cc.lineTo(x + Math.cos(a) * 15, -54 + Math.sin(a) * 15);
        cc.lineTo(x + Math.cos(a + 0.3) * 7, -54 + Math.sin(a + 0.3) * 7);
        cc.closePath();
      }, MAT.bone, x + 100, x - 100);
    }
  }

  // Head with spiked round helm and face opening.
  p.part3((cc) => circle(cc, 2, -72, 16), MAT.thorn, 9, -6);
  for (const a of [-2.4, -1.9, -1.4, -0.9]) {
    p.part3((cc) => {
      cc.moveTo(2 + Math.cos(a - 0.18) * 15, -72 + Math.sin(a - 0.18) * 15);
      cc.lineTo(2 + Math.cos(a) * 25, -72 + Math.sin(a) * 25);
      cc.lineTo(2 + Math.cos(a + 0.18) * 15, -72 + Math.sin(a + 0.18) * 15);
      cc.closePath();
    }, MAT.bone, 200, -200);
  }
  p.part3((cc) => roundRect(cc, 0, -76, 17, 13, 5), MAT.skinMid, 12, 3);
  eyes(p, 6, -70, 6, 2.1, 0.5);
  p.rivets([
    [-10, -74],
    [-6, -82],
  ], 1.1, MAT.gold);

  // Kite shield with thorny vine, pushed forward on the bash.
  const push = s < 0 ? s * 5 : s * 13;
  const cx = -4 + push;
  const shield = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(cx - 14, -64);
    cc.lineTo(cx + 14, -64);
    cc.quadraticCurveTo(cx + 15, -34, cx, -14);
    cc.quadraticCurveTo(cx - 15, -34, cx - 14, -64);
    cc.closePath();
  };
  p.part3(shield, team, cx + 4, cx - 9);
  p.line((cc) => {
    cc.moveTo(cx - 11, -60);
    cc.bezierCurveTo(cx + 2, -54, cx - 8, -44, cx + 6, -36);
    cc.bezierCurveTo(cx + 10, -30, cx - 4, -24, cx, -18);
  }, 2.4, MAT.thorn.base);
  for (const [tx, ty] of [
    [-6, -55],
    [2, -47],
    [4, -34],
    [-2, -25],
  ] as const) {
    p.part3((cc) => {
      cc.moveTo(cx + tx, ty);
      cc.lineTo(cx + tx + 5, ty - 3);
      cc.lineTo(cx + tx + 1, ty + 2);
      cc.closePath();
    }, MAT.bone, 200, -200);
  }
  if (burst > 0) {
    p.line((cc) => {
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i - 3.5) * 0.35;
        cc.moveTo(cx + 16 + Math.cos(a) * 6, -40 + Math.sin(a) * 18);
        cc.lineTo(cx + 16 + Math.cos(a) * (10 + burst * 14), -40 + Math.sin(a) * (22 + burst * 14));
      }
    }, 2.2, MAT.bone.base);
  }
  p.gloss((cc) => roundRect(cc, cx - 10, -60, 2.5, 14, 1.2), 0.4);

  c.restore();
};
