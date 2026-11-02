import { STRIKE, bodyMotion, circle, impact, roundRect, swing, type CharacterDraw, type Painter } from "./paint";
import { clothLeg, eyes, hand } from "./parts";
import { FX, MAT, TEAM } from "./style";

/**
 * Wirbelklinge: hooded acrobat in light leather with a team sash and face wrap, a crescent sickle in
 * each hand. Crouches with crossed blades, then whirls: blades thrown wide with a full ring trail.
 */
export const drawWirbelklinge: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const hit = impact(pose.attack);
  const crouch = s < 0 ? -s * 4 : 0;
  const sway = Math.sin(pose.time * 4) * 2.5 + (pose.walking ? 3 : 0);

  // Sash tails.
  p.part3((cc) => {
    cc.moveTo(-8, -34);
    cc.quadraticCurveTo(-20, -30 + sway, -28, -20 + sway);
    cc.lineTo(-24, -16 + sway);
    cc.quadraticCurveTo(-16, -26 + sway, -6, -29);
    cc.closePath();
  }, team, -16, -24);

  const leather = { base: "#9a7b5a", shade: "#6e563d", light: "#b9997a" };
  clothLeg(p, -13, -26, 8, legA, MAT.darkLeather, MAT.leather);
  clothLeg(p, 4, -26, 8, legB, MAT.darkLeather, MAT.leather);

  c.save();
  c.translate(0, bob + crouch);

  // Whirl ring right after the strike.
  if (pose.attack !== null && pose.attack >= STRIKE - 0.02 && pose.attack < STRIKE + 0.35) {
    const k = (pose.attack - STRIKE + 0.02) / 0.37;
    c.save();
    c.globalAlpha = (1 - k) * 0.85;
    c.beginPath();
    c.ellipse(0, -44, 50 + k * 8, 20 + k * 4, 0, 0, Math.PI * 2);
    c.ellipse(0, -44, 38 + k * 6, 13 + k * 3, 0, 0, Math.PI * 2, true);
    c.fillStyle = FX.swoosh;
    c.fill("evenodd");
    c.restore();
  }

  // Leather vest and sash.
  p.part3((cc) => roundRect(cc, -12, -56, 24, 30, 7), leather, 4, -8);
  p.line((cc) => {
    cc.moveTo(0, -54);
    cc.lineTo(0, -30);
  }, 1.1);
  p.part3((cc) => roundRect(cc, -13, -36, 26, 7, 2.5), team, 5, -8);
  p.rivets([
    [-6, -48],
    [6, -48],
  ], 1, MAT.gold);

  // Hood with face wrap and fierce eyes.
  p.part3((cc) => {
    cc.moveTo(-8, -90);
    cc.quadraticCurveTo(-23, -84, -18, -62);
    cc.quadraticCurveTo(-6, -52, 10, -56);
    cc.quadraticCurveTo(22, -62, 18, -76);
    cc.quadraticCurveTo(12, -92, -8, -90);
    cc.closePath();
  }, MAT.darkLeather, 6, -10);
  p.part3((cc) => roundRect(cc, -2, -78, 20, 10, 4), MAT.skinLight, 12, 2);
  eyes(p, 5, -73, 6.5, 2, 0.65);
  p.part3((cc) => roundRect(cc, -4, -69, 23, 9, 3), team, 12, 0);

  // Two crescent sickles: crossed when winding up, thrown wide on the whirl.
  const spread = s < 0 ? 0.2 + s * 0.5 : 0.2 + s * 1.4 + hit * 0.2;
  sickle(p, 10, -46, 0.35 - spread, 1);
  sickle(p, -10, -46, Math.PI - 0.35 + spread, -1);

  c.restore();
};

function sickle(p: Painter, x: number, y: number, angle: number, dir: 1 | -1): void {
  const c = p.ctx;
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  p.stroke((cc) => {
    cc.moveTo(0, 0);
    cc.lineTo(12, 0);
  }, MAT.darkLeather.base, 6);
  p.part3((cc) => roundRect(cc, 10, -2.5, 9, 5, 2), MAT.wood, 16, 12);
  const blade = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(18, -2 * dir);
    cc.quadraticCurveTo(34, -18 * dir, 22, -30 * dir);
    cc.quadraticCurveTo(28, -16 * dir, 18, 3 * dir);
    cc.closePath();
  };
  p.part3(blade, MAT.steel, 200, 200);
  p.gloss((cc) => circle(cc, 26, -16 * dir, 1.4), 0.8);
  hand(p, 11, 0, MAT.skinLight, 4);
  c.restore();
}
