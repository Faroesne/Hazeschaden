import { STRIKE, bodyMotion, circle, ellipse, roundRect, type CharacterDraw } from "./paint";
import { belt, clothLeg, eyes, hand } from "./parts";
import { FX, MAT, TEAM } from "./style";

/**
 * Funkenwerfer: small alchemists with a copper fuel tank (team stripe, pressure gauge) on the back,
 * a hose to a brass nozzle, leather apron and goggles. Blasts a cone of fire.
 */
export const drawFunkenwerfer: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const fire = pose.attack !== null && pose.attack >= STRIKE - 0.05 ? Math.max(0, 1 - (pose.attack - STRIKE + 0.05) / 0.5) : 0;
  const charge = pose.attack !== null && pose.attack < STRIKE ? pose.attack / STRIKE : 0;

  // Copper tank on the back with straps, team stripe and gauge.
  c.save();
  c.translate(0, bob);
  p.part3((cc) => roundRect(cc, -28, -66, 16, 38, 8), MAT.copper, -18, -24);
  p.part3((cc) => roundRect(cc, -28.5, -52, 17, 6, 2), team, -18, -25);
  p.rivets([
    [-25, -62],
    [-15, -62],
    [-25, -32],
    [-15, -32],
  ], 1, MAT.bronze);
  p.part3((cc) => circle(cc, -20, -40, 4), MAT.bone, -19, -22);
  p.line((cc) => {
    cc.moveTo(-20, -40);
    cc.lineTo(-20 + Math.cos(-2.4 + charge * 2) * 3, -40 + Math.sin(-2.4 + charge * 2) * 3);
  }, 1.1, "#c0392b");
  c.restore();

  clothLeg(p, -10, -22, 8, legA, MAT.darkLeather, MAT.iron);
  clothLeg(p, 2, -22, 8, legB, MAT.darkLeather, MAT.iron);

  c.save();
  c.translate(0, bob);

  // Jacket and leather apron.
  p.part3((cc) => roundRect(cc, -12, -50, 24, 28, 7), { base: "#c9b37a", shade: "#9a8656", light: "#e2d09c" }, 4, -8);
  p.part3((cc) => {
    cc.moveTo(-9, -44);
    cc.lineTo(9, -44);
    cc.lineTo(11, -20);
    cc.lineTo(-11, -20);
    cc.closePath();
  }, MAT.leather, 4, -6);
  p.part3((cc) => roundRect(cc, -4, -36, 8, 6, 1.5), MAT.leather, 1, -2);
  belt(p, -13, -30, 26, 5);
  p.stroke((cc) => {
    cc.moveTo(-10, -48);
    cc.lineTo(-18, -40);
  }, MAT.leather.shade, 2.5);

  // Head: face, scorch smudge, goggles, team cap.
  p.part3((cc) => circle(cc, 2, -66, 14), MAT.skinMid, 8, -5);
  p.flat((cc) => ellipse(cc, 10, -59, 3, 1.6), "rgba(40,30,30,0.35)");
  eyes(p, 5, -64, 6.5, 2, 0.1);
  p.part3((cc) => {
    cc.moveTo(-12, -70);
    cc.quadraticCurveTo(-11, -84, 2, -84);
    cc.quadraticCurveTo(16, -84, 16, -70);
    cc.closePath();
  }, team, 7, -6);
  p.part3((cc) => roundRect(cc, -12, -74, 30, 6, 3), MAT.leather, 10, -8);
  for (const gx of [5, 13]) {
    p.part3((cc) => circle(cc, gx, -71, 4), MAT.bronze, gx + 1, gx - 2);
    p.part3((cc) => circle(cc, gx, -71, 2.6), { base: "#ffb347", shade: "#e07a1f", light: "#ffe0a8" }, gx + 1, gx - 1);
    p.gloss((cc) => circle(cc, gx - 0.8, -72, 0.9), 0.9);
  }

  // Hose and brass nozzle.
  p.stroke((cc) => {
    cc.moveTo(-14, -34);
    cc.bezierCurveTo(-8, -18, 6, -26, 14, -40);
  }, "#3a3f4d", 3);
  const nx = 14;
  const ny = -42;
  p.part3((cc) => roundRect(cc, nx, ny - 3, 18, 6, 2), MAT.bronze, nx + 12, nx + 3);
  p.part3((cc) => roundRect(cc, nx + 16, ny - 4.5, 5, 9, 2), MAT.iron, nx + 19, nx + 17);
  if (charge > 0) {
    c.save();
    c.globalAlpha = 0.4 + charge * 0.5;
    p.flat((cc) => circle(cc, nx + 23, ny, 2 + charge * 2), FX.muzzle);
    c.restore();
  }
  hand(p, nx + 2, ny + 3, MAT.skinMid, 4);

  // Cone of fire.
  if (fire > 0) {
    c.save();
    c.globalAlpha = Math.min(1, fire * 1.4);
    const len = 40 + (1 - fire) * 12;
    const flame = (r: number, color: string) =>
      p.flat((cc) => {
        cc.moveTo(nx + 21, ny);
        cc.quadraticCurveTo(nx + 21 + len * 0.4, ny - r, nx + 21 + len, ny - r * 0.4 + Math.sin(pose.time * 30) * 2);
        cc.quadraticCurveTo(nx + 21 + len * 1.05, ny, nx + 21 + len, ny + r * 0.4);
        cc.quadraticCurveTo(nx + 21 + len * 0.4, ny + r, nx + 21, ny);
        cc.closePath();
      }, color);
    flame(16, FX.muzzleHot);
    flame(10, FX.fire);
    flame(5, "#fff3b0");
    c.restore();
  }

  c.restore();
};
