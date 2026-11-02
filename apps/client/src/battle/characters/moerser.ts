import { STRIKE, bodyMotion, circle, ellipse, impact, roundRect, type CharacterDraw } from "./paint";
import { clothLeg, eyes, hand, stitches } from "./parts";
import { FX, MAT, TEAM } from "./style";

/**
 * Mörser: stout gunner with goggles, braided beard with a gold bead, leather apron and team
 * scarf, beside a banded iron mortar on a bolted wooden sled with a shell stack and a pennant.
 * Recoil, muzzle flash, smoke.
 */
export const drawMoerser: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const flash = pose.attack !== null && pose.attack >= STRIKE ? impact(pose.attack) : 0;
  const after = pose.attack === null || pose.attack < STRIKE ? 0 : (pose.attack - STRIKE) / (1 - STRIKE);
  const recoil = pose.attack === null || pose.attack < STRIKE ? 0 : Math.max(0, 1 - after * 2.5) * 7;
  const crouch = pose.attack !== null && pose.attack < STRIKE ? (pose.attack / STRIKE) * 2 : 0;

  // Pennant with a stripe.
  p.stroke((cc) => {
    cc.moveTo(46, -2);
    cc.lineTo(46, -60);
  }, MAT.wood.base, 2.5);
  p.part3((cc) => circle(cc, 46, -61, 2.4), MAT.gold, 47, 45);
  const wave = Math.sin(pose.time * 5) * 3;
  const flag = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(46, -58);
    cc.quadraticCurveTo(56, -55 + wave, 64, -52);
    cc.quadraticCurveTo(56, -48 + wave, 46, -45);
    cc.closePath();
  };
  p.part3(flag, team, 56, 50);
  p.line((cc) => {
    cc.moveTo(48, -51.5);
    cc.quadraticCurveTo(55, -51.5 + wave * 0.6, 61, -51.5);
  }, 1.6, MAT.gold.base);

  // Shell stack.
  for (const [x, y] of [
    [-24, -5],
    [-14, -5],
    [-19, -13],
  ] as const) {
    p.part3((cc) => circle(cc, x, y, 5), MAT.iron, x + 1, x - 2);
    p.gloss((cc) => circle(cc, x - 1.8, y - 1.8, 1.2), 0.5);
  }

  // Sled with planks and bolts.
  const sled = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(6, 0);
    cc.lineTo(48, 0);
    cc.lineTo(42, -13);
    cc.lineTo(12, -13);
    cc.closePath();
  };
  p.part3(sled, MAT.wood, 32, 14);
  p.line((cc) => {
    cc.moveTo(9, -6.5);
    cc.lineTo(45, -6.5);
  }, 1.1);
  p.rivets([
    [14, -10],
    [40, -10],
    [12, -3],
    [43, -3],
  ], 1.2, MAT.iron);

  // Iron tube with bronze bands, rivets and a reinforced muzzle.
  c.save();
  c.translate(27, -15);
  c.rotate(-0.95);
  c.translate(-recoil, 0);
  p.part3((cc) => roundRect(cc, -5, -10, 41, 20, 7), MAT.iron, 0, 0);
  p.ctx.save();
  p.ctx.beginPath();
  roundRect(p.ctx, -5, -10, 41, 20, 7);
  p.ctx.clip();
  p.flat((cc) => cc.rect(-6, 3, 44, 8), MAT.iron.shade);
  p.flat((cc) => cc.rect(-6, -10, 44, 4), MAT.iron.light);
  p.ctx.restore();
  for (const bx of [6, 20]) {
    p.part3((cc) => roundRect(cc, bx, -11, 5, 22, 2), MAT.bronze, bx + 3, bx + 1);
    p.rivets([[bx + 2.5, -7]], 0.9, MAT.gold);
  }
  p.part3((cc) => roundRect(cc, 31, -12, 9, 24, 3), MAT.iron, 37, 33);
  p.flat((cc) => ellipse(cc, 40, 0, 2.5, 7), "#140f24");
  if (flash > 0) {
    p.flat((cc) => {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r = i % 2 === 0 ? 20 * flash + 6 : 8;
        if (i === 0) cc.moveTo(48 + Math.cos(a) * r, Math.sin(a) * r);
        else cc.lineTo(48 + Math.cos(a) * r, Math.sin(a) * r);
      }
      cc.closePath();
    }, FX.muzzle);
    p.flat((cc) => circle(cc, 48, 0, 7 * flash), FX.muzzleHot);
    p.flat((cc) => circle(cc, 48, 0, 3 * flash), "#fff6c2");
  }
  c.restore();
  if (after > 0 && after < 1) {
    for (let i = 0; i < 3; i++) {
      const k = Math.min(1, after * 1.2 + i * 0.1);
      c.globalAlpha = (1 - k) * 0.7;
      p.flat((cc) => circle(cc, 50 + i * 5, -48 - k * 26 - i * 6, 5 + k * 8), FX.smoke);
    }
    c.globalAlpha = 1;
  }

  clothLeg(p, -17, -20, 10, legA, { base: "#6b5a4a", shade: "#4b3e32", light: "#86725f" }, MAT.iron);
  clothLeg(p, -5, -20, 10, legB, { base: "#6b5a4a", shade: "#4b3e32", light: "#86725f" }, MAT.iron);

  c.save();
  c.translate(0, bob + crouch);
  // Round belly: jacket, leather apron with pocket, belt.
  p.part3((cc) => ellipse(cc, -7, -35, 18, 17), MAT.bronze, 0, -17);
  p.part3((cc) => {
    cc.moveTo(-18, -40);
    cc.lineTo(4, -40);
    cc.lineTo(6, -20);
    cc.quadraticCurveTo(-7, -16, -20, -20);
    cc.closePath();
  }, MAT.leather, 0, -14);
  p.part3((cc) => roundRect(cc, -12, -32, 10, 8, 2), MAT.leather, -4, -10);
  stitches(p, (cc) => roundRect(cc, -11, -31, 8, 6, 1.5), "rgba(255,230,190,0.6)");
  // Arm reaching to the mortar.
  p.stroke((cc) => {
    cc.moveTo(2, -42);
    cc.lineTo(12, -31 + recoil * 0.3);
  }, MAT.bronze.base, 7);
  hand(p, 13, -30 + recoil * 0.3, MAT.skinLight);

  // Team scarf with knot.
  p.part3((cc) => roundRect(cc, -21, -56, 28, 7, 3), team, 0, -14);
  p.part3((cc) => {
    cc.moveTo(-18, -52);
    cc.lineTo(-24, -40);
    cc.lineTo(-17, -42);
    cc.closePath();
  }, team, -19, -22);

  // Head: face, braided beard with gold bead, bronze helmet with goggles.
  p.part3((cc) => circle(cc, -5, -68, 15), MAT.skinLight, 2, -15);
  eyes(p, -2, -67, 7, 2.2, 0.3);
  p.part3((cc) => {
    cc.moveTo(-18, -68);
    cc.quadraticCurveTo(-18, -48, -5, -47);
    cc.quadraticCurveTo(9, -48, 10, -66);
    cc.quadraticCurveTo(3, -60, -4, -62);
    cc.quadraticCurveTo(-10, -60, -18, -68);
    cc.closePath();
  }, MAT.beard, 2, -13);
  p.line((cc) => {
    cc.moveTo(-9, -58);
    cc.lineTo(-7, -51);
    cc.moveTo(-2, -58);
    cc.lineTo(-1, -51);
  }, 1, MAT.beard.shade);
  p.part3((cc) => roundRect(cc, -8, -48, 6, 7, 2), MAT.beard, -4, -7);
  p.part3((cc) => circle(cc, -5, -40, 2.6), MAT.gold, -4, -6);
  p.part3((cc) => {
    cc.moveTo(-21, -73);
    cc.arc(-5, -73, 16, Math.PI, 0);
    cc.closePath();
  }, MAT.bronze, 3, -14);
  p.rivets([
    [-15, -79],
    [-5, -85],
    [5, -79],
  ], 1.1, MAT.gold);
  p.part3((cc) => roundRect(cc, -14, -78, 27, 7, 3), MAT.leather, 6, -12);
  for (const gx of [0, 9.5]) {
    p.part3((cc) => circle(cc, gx, -74.5, 4.8), MAT.bronze, gx + 1, gx - 2);
    p.part3((cc) => circle(cc, gx, -74.5, 3.2), { base: "#9fe3ff", shade: "#5fb8e0", light: "#d8f5ff" }, gx + 1, gx - 1);
    p.gloss((cc) => circle(cc, gx - 1, -75.5, 1.1), 0.9);
  }
  c.restore();
};
