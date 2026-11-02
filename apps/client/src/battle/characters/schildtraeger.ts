import { bodyMotion, circle, impact, legs, roundRect, swing, type CharacterDraw } from "./paint";
import { MAT, TEAM } from "./style";

/** Schildträger: small soldier, nose-guard helm, big round shield, short spear. Thrusts forward. */
export const drawSchildtraeger: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const hit = impact(pose.attack);

  legs(p, -11, 2, 10, -24, MAT.leather, MAT.iron, legA, legB);

  c.save();
  c.translate(0, bob);
  c.scale(1 + hit * 0.05, 1 - hit * 0.06);

  // Spear: held diagonally forward, thrust along its own axis.
  const thrust = s < 0 ? s * 7 : s * 14;
  const ang = -0.45;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const hx = 14 + dx * thrust;
  const hy = -40 + dy * thrust;
  p.stroke((cc) => {
    cc.moveTo(hx - dx * 22, hy - dy * 22);
    cc.lineTo(hx + dx * 30, hy + dy * 30);
  }, MAT.wood.base, 4);
  p.part((cc) => {
    const tx = hx + dx * 30;
    const ty = hy + dy * 30;
    cc.moveTo(tx + dx * 14, ty + dy * 14);
    cc.lineTo(tx - dy * 5, ty + dx * 5);
    cc.lineTo(tx + dy * 5, ty - dx * 5);
    cc.closePath();
  }, MAT.steel);

  // Tunic.
  p.part((cc) => roundRect(cc, -14, -52, 28, 30, 8), MAT.leather, 4);
  p.part((cc) => roundRect(cc, -15, -30, 30, 5, 2), MAT.iron, 6);

  // Head with nose-guard helm and team band.
  p.part((cc) => circle(cc, 2, -68, 16), MAT.skinLight, 8);
  p.flat((cc) => {
    circle(cc, 7, -66, 2.2);
    circle(cc, 13, -66, 2.2);
  }, "#1b1530");
  p.part((cc) => {
    cc.moveTo(-15, -70);
    cc.arc(2, -70, 17, Math.PI, 0);
    cc.closePath();
  }, MAT.steel, 8);
  p.part((cc) => roundRect(cc, -15, -74, 34, 5, 2), team, 10);
  p.part((cc) => roundRect(cc, 9, -72, 4, 12, 2), MAT.steel);

  // Hand on the spear.
  p.part((cc) => circle(cc, hx, hy, 4.5), MAT.skinLight);

  // Round shield.
  p.part((cc) => circle(cc, -8, -40, 18), MAT.steel, -4);
  p.part((cc) => circle(cc, -8, -40, 14), team, -5);
  p.part((cc) => circle(cc, -8, -40, 5), MAT.gold, -7);

  c.restore();
};
