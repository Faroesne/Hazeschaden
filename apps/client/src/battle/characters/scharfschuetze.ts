import { STRIKE, bodyMotion, circle, roundRect, type CharacterDraw } from "./paint";
import { belt, clothLeg, eyes, hand } from "./parts";
import { MAT, TEAM } from "./style";

/**
 * Scharfschütze: slim marksman in a long team coat with gold buttons, wide-brimmed hat with a
 * feather, monocle, and a long heavy crossbow. Aims (thin aim line) and fires with recoil.
 */
export const drawScharfschuetze: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const aiming = pose.attack !== null && pose.attack < STRIKE;
  const after = pose.attack !== null && pose.attack >= STRIKE ? (pose.attack - STRIKE) / (1 - STRIKE) : 1;
  const recoil = Math.max(0, 1 - after * 3) * 6;
  const sway = Math.sin(pose.time * 3) * 1.5 + (pose.walking ? 2.5 : 0);

  clothLeg(p, -10, -26, 8, legA, MAT.darkLeather, MAT.leather);
  clothLeg(p, 3, -26, 8, legB, MAT.darkLeather, MAT.leather);

  c.save();
  c.translate(-recoil * 0.4, bob);

  // Long coat with flaring tails, lapels and gold buttons.
  const coat = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-13, -60);
    cc.lineTo(13, -60);
    cc.lineTo(15, -20);
    cc.lineTo(4, -16 + sway * 0.4);
    cc.lineTo(-6, -24);
    cc.lineTo(-18 - sway, -16);
    cc.closePath();
  };
  p.part3(coat, team, 4, -8);
  p.line((cc) => {
    cc.moveTo(-6, -24);
    cc.lineTo(-4, -46);
  }, 1.2, team.shade);
  p.part3((cc) => {
    cc.moveTo(-4, -60);
    cc.lineTo(6, -60);
    cc.lineTo(2, -46);
    cc.closePath();
  }, MAT.bone, 3, -1);
  for (const y of [-44, -38, -32]) p.part3((cc) => circle(cc, 5, y, 1.8), MAT.gold, 6, 4);
  belt(p, -14, -36, 29, -4);

  // Head: face, monocle, wide hat with team band and feather.
  p.part3((cc) => circle(cc, 3, -72, 14), MAT.skinLight, 9, -5);
  eyes(p, 6, -71, 6.5, 2.1, 0.45);
  p.part3((cc) => circle(cc, 12.5, -71, 4.4), MAT.gold, 14, 11);
  p.flat((cc) => circle(cc, 12.5, -71, 3), "rgba(190,235,255,0.55)");
  p.gloss((cc) => circle(cc, 11.5, -72.5, 1.1), 0.9);
  p.line((cc) => {
    cc.moveTo(15, -67);
    cc.quadraticCurveTo(14, -58, 10, -54);
  }, 0.9, MAT.gold.base);
  p.line((cc) => {
    cc.moveTo(5, -62);
    cc.quadraticCurveTo(8, -60.5, 11, -62);
  }, 1.1);
  p.part3((cc) => {
    cc.moveTo(-22, -80);
    cc.quadraticCurveTo(3, -86, 30, -80);
    cc.quadraticCurveTo(32, -76, 26, -77);
    cc.quadraticCurveTo(3, -81, -20, -77);
    cc.quadraticCurveTo(-25, -77, -22, -80);
    cc.closePath();
  }, MAT.darkLeather, 12, -10);
  p.part3((cc) => {
    cc.moveTo(-10, -82);
    cc.quadraticCurveTo(-9, -98, 4, -98);
    cc.quadraticCurveTo(17, -98, 17, -82);
    cc.closePath();
  }, MAT.darkLeather, 8, -5);
  p.part3((cc) => roundRect(cc, -10, -86, 27, 5, 2), team, 10, -6);
  p.part3((cc) => {
    cc.moveTo(-8, -86);
    cc.bezierCurveTo(-22, -100, -26, -108, -20, -112 + sway);
    cc.bezierCurveTo(-16, -102, -10, -96, -4, -87);
    cc.closePath();
  }, { base: "#f4f1ea", shade: "#cfc7b6" }, -12, -18);

  // Heavy crossbow at shoulder height.
  const cy = -50;
  c.save();
  c.translate(-recoil, 0);
  if (aiming) {
    c.save();
    c.globalAlpha = 0.35 + 0.4 * (pose.attack! / STRIKE);
    p.line((cc) => {
      cc.moveTo(46, cy);
      cc.lineTo(130, cy);
    }, 1.2, "#ff5a4a");
    c.restore();
  }
  p.part3((cc) => roundRect(cc, -4, cy - 3, 48, 6, 2.5), MAT.wood, 200, 4);
  p.part3((cc) => roundRect(cc, 40, cy - 4, 6, 8, 2), MAT.iron, 44, 41);
  // Steel prod (bow arms) and string.
  p.stroke((cc) => {
    cc.moveTo(34, cy - 15);
    cc.quadraticCurveTo(42, cy, 34, cy + 15);
  }, MAT.steel.base, 3.5);
  p.stroke((cc) => {
    cc.moveTo(34, cy - 15);
    cc.lineTo(aiming ? 18 : 30, cy);
    cc.lineTo(34, cy + 15);
  }, "#f2efe6", 1);
  if (aiming) {
    p.stroke((cc) => {
      cc.moveTo(18, cy);
      cc.lineTo(46, cy);
    }, MAT.wood.base, 2);
  }
  p.part3((cc) => roundRect(cc, -8, cy - 2, 9, 9, 3), MAT.wood, -2, -6);
  c.restore();
  hand(p, 4 - recoil, cy + 2, MAT.skinLight);
  hand(p, 24 - recoil, cy + 2, MAT.skinLight);

  c.restore();
};
