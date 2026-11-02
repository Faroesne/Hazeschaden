import { STRIKE, bodyMotion, circle, impact, legs, roundRect, swing, type CharacterDraw } from "./paint";
import { FX, MAT, TEAM } from "./style";

/** Klingenmeister: lean masked swordsman with topknot and a trailing scarf. Wide slash with a swoosh. */
export const drawKlingenmeister: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const hit = impact(pose.attack);
  const sway = Math.sin(pose.time * 4) * 3 + (pose.walking ? 4 : 0);

  // Scarf tails behind.
  p.part((cc) => {
    cc.moveTo(-4, -56);
    cc.quadraticCurveTo(-22, -54 + sway, -34, -46 + sway * 1.4);
    cc.lineTo(-30, -40 + sway * 1.2);
    cc.quadraticCurveTo(-18, -48 + sway, -2, -50);
    cc.closePath();
  }, team, -20);

  legs(p, -12, 3, 8, -26, MAT.cloth, MAT.cloth, legA, legB);

  c.save();
  c.translate(0, bob);
  c.scale(1 + hit * 0.05, 1 - hit * 0.06);

  const rest = 0.7;
  const angle = s < 0 ? rest + s * (rest + 2.0) : rest + s * 0.9;
  const shoulder = { x: 9, y: -50 };

  // Swoosh trail right after the strike.
  if (pose.attack !== null && pose.attack >= STRIKE - 0.02 && pose.attack < STRIKE + 0.3) {
    const k = (pose.attack - STRIKE + 0.02) / 0.32;
    c.save();
    c.globalAlpha = 1 - k;
    c.beginPath();
    c.arc(shoulder.x, shoulder.y, 56, -2.0, angle);
    c.arc(shoulder.x, shoulder.y, 40, angle, -2.0, true);
    c.closePath();
    c.fillStyle = FX.swoosh;
    c.fill();
    c.restore();
  }

  // Slim torso with team sash.
  p.part((cc) => roundRect(cc, -12, -56, 24, 32, 7), MAT.cloth, 3);
  p.part((cc) => {
    cc.moveTo(-12, -50);
    cc.lineTo(-6, -56);
    cc.lineTo(12, -32);
    cc.lineTo(6, -26);
    cc.closePath();
  }, team, 4);

  // Head: topknot, mask, narrow eyes.
  p.part((cc) => circle(cc, -6, -92, 6), MAT.hairDark);
  p.part((cc) => circle(cc, 2, -72, 16), MAT.skinLight, 9);
  p.part((cc) => {
    cc.moveTo(-14, -78);
    cc.arc(2, -74, 17, Math.PI * 1.05, Math.PI * 1.95);
    cc.closePath();
  }, MAT.hairDark, 8);
  p.part((cc) => roundRect(cc, -8, -68, 27, 11, 4), MAT.cloth, 12);
  p.flat((cc) => {
    roundRect(cc, 6, -75, 5, 2.4, 1);
    roundRect(cc, 13, -75, 5, 2.4, 1);
  }, "#1b1530");

  // Sword arm.
  c.save();
  c.translate(shoulder.x, shoulder.y);
  c.rotate(angle);
  p.stroke((cc) => {
    cc.moveTo(0, 0);
    cc.lineTo(15, 0);
  }, MAT.cloth.base, 7);
  p.part((cc) => roundRect(cc, 14, -6, 4, 12, 2), MAT.gold);
  p.part((cc) => {
    cc.moveTo(18, -2.5);
    cc.lineTo(62, -1.5);
    cc.lineTo(67, 0);
    cc.lineTo(62, 2.5);
    cc.lineTo(18, 2.5);
    cc.closePath();
  }, MAT.steel);
  p.part((cc) => circle(cc, 15, 0, 4.5), MAT.skinLight);
  c.restore();

  c.restore();
};
