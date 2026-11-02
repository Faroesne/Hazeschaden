import { STRIKE, bodyMotion, circle, ellipse, legs, roundRect, type CharacterDraw } from "./paint";
import { MAT, TEAM } from "./style";

/** Bogenschützen: hooded archers with a longbow and quiver. Draw the string, release. */
export const drawBogenschuetzen: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  // String pull: grows during the wind-up, snaps back on release.
  const pull = pose.attack === null ? 0 : pose.attack < STRIKE ? pose.attack / STRIKE : Math.max(0, 1 - (pose.attack - STRIKE) * 8);
  const sway = Math.sin(pose.time * 3) * 2;

  // Cape behind.
  p.part((cc) => {
    cc.moveTo(-10, -56);
    cc.lineTo(10, -56);
    cc.lineTo(6 + sway * 0.3, -14);
    cc.quadraticCurveTo(-8, -10 + sway, -20 + sway, -16);
    cc.closePath();
  }, team, 2);

  // Quiver.
  c.save();
  c.translate(-12, -48 + bob);
  c.rotate(-0.35);
  p.part((cc) => roundRect(cc, -5, -10, 10, 26, 3), MAT.leather, 1);
  p.stroke((cc) => {
    cc.moveTo(-2, -10);
    cc.lineTo(-3, -18);
    cc.moveTo(2, -10);
    cc.lineTo(3, -17);
  }, "#f2efe6", 2);
  c.restore();

  legs(p, -9, 2, 9, -22, MAT.leather, MAT.leather, legA, legB);

  c.save();
  c.translate(0, bob);

  // Tunic.
  p.part((cc) => roundRect(cc, -12, -50, 24, 28, 7), MAT.wood, 3);
  p.part((cc) => roundRect(cc, -13, -30, 26, 4, 2), MAT.leather, 5);

  // Hood with the face peeking out.
  p.part((cc) => {
    cc.moveTo(-6, -88);
    cc.quadraticCurveTo(-24, -84, -19, -62);
    cc.quadraticCurveTo(-10, -48, 8, -50);
    cc.quadraticCurveTo(22, -56, 18, -72);
    cc.quadraticCurveTo(12, -88, -6, -88);
    cc.closePath();
  }, team, 4);
  p.part((cc) => ellipse(cc, 7, -66, 10, 11), MAT.skinMid, 11);
  p.flat((cc) => {
    circle(cc, 8, -67, 1.9);
    circle(cc, 13, -67, 1.9);
  }, "#1b1530");

  // Longbow, string and nocked arrow.
  const bx = 20;
  const sx = bx - 2 - pull * 12;
  p.stroke((cc) => {
    cc.moveTo(bx - 4, -74);
    cc.lineTo(sx, -46);
    cc.lineTo(bx - 4, -18);
  }, "#f2efe6", 1.2);
  p.stroke((cc) => {
    cc.moveTo(bx - 4, -74);
    cc.quadraticCurveTo(bx + 14, -46, bx - 4, -18);
  }, MAT.wood.base, 4);
  if (pose.attack !== null && pose.attack < STRIKE + 0.02) {
    p.stroke((cc) => {
      cc.moveTo(sx, -46);
      cc.lineTo(sx + 30, -46);
    }, MAT.wood.base, 2);
    p.part((cc) => {
      cc.moveTo(sx + 36, -46);
      cc.lineTo(sx + 29, -49.5);
      cc.lineTo(sx + 29, -42.5);
      cc.closePath();
    }, MAT.steel);
  }
  // Hands: one on the bow, one on the string.
  p.part((cc) => circle(cc, bx + 4, -46, 4), MAT.skinMid);
  p.part((cc) => circle(cc, sx, -46, 4), MAT.skinMid);

  c.restore();
};
