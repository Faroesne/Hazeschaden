import { STRIKE, bodyMotion, circle, ellipse, impact, legs, roundRect, type CharacterDraw } from "./paint";
import { FX, MAT, TEAM } from "./style";

/** Mörser: stout bearded gunner with goggles beside a mortar on a wooden sled. Recoil, flash, smoke. */
export const drawMoerser: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const flash = pose.attack !== null && pose.attack >= STRIKE ? impact(pose.attack) : 0;
  const after = pose.attack === null || pose.attack < STRIKE ? 0 : (pose.attack - STRIKE) / (1 - STRIKE);
  const recoil = pose.attack === null ? 0 : pose.attack < STRIKE ? 0 : Math.max(0, 1 - after * 2.5) * 7;

  // Team pennant on the sled.
  p.stroke((cc) => {
    cc.moveTo(44, -2);
    cc.lineTo(44, -58);
  }, MAT.wood.base, 2.5);
  const wave = Math.sin(pose.time * 5) * 3;
  p.part((cc) => {
    cc.moveTo(44, -58);
    cc.quadraticCurveTo(54, -55 + wave, 62, -52);
    cc.quadraticCurveTo(54, -48 + wave, 44, -45);
    cc.closePath();
  }, team);

  // Mortar: sled and tube pointing up-forward.
  p.part((cc) => {
    cc.moveTo(6, 0);
    cc.lineTo(46, 0);
    cc.lineTo(40, -12);
    cc.lineTo(12, -12);
    cc.closePath();
  }, MAT.wood, 30);
  c.save();
  c.translate(26, -14);
  c.rotate(-0.95);
  c.translate(-recoil, 0);
  p.part((cc) => roundRect(cc, -4, -9, 40, 18, 6), MAT.iron, 18);
  p.part((cc) => roundRect(cc, 30, -11, 9, 22, 3), MAT.iron, 36);
  p.part((cc) => roundRect(cc, 10, -10, 5, 20, 2), MAT.bronze);
  if (flash > 0) {
    p.flat((cc) => {
      cc.moveTo(40, 0);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = i % 2 === 0 ? 18 * flash + 6 : 8;
        cc.lineTo(46 + Math.cos(a) * r, Math.sin(a) * r);
      }
      cc.closePath();
    }, FX.muzzle);
    p.flat((cc) => circle(cc, 46, 0, 6 * flash), FX.muzzleHot);
  }
  c.restore();
  // Smoke drifting up after the shot.
  if (after > 0 && after < 1) {
    for (let i = 0; i < 3; i++) {
      const k = Math.min(1, after * 1.2 + i * 0.1);
      c.globalAlpha = (1 - k) * 0.7;
      p.flat((cc) => circle(cc, 48 + i * 5, -46 - k * 26 - i * 6, 5 + k * 8), FX.smoke);
    }
    c.globalAlpha = 1;
  }

  legs(p, -16, -4, 10, -20, MAT.leather, MAT.iron, legA, legB);

  c.save();
  c.translate(0, bob);
  // Round belly in a bronze-brown jacket.
  p.part((cc) => ellipse(cc, -7, -34, 18, 17), MAT.bronze, 0);
  p.part((cc) => roundRect(cc, -25, -26, 36, 5, 2), MAT.leather, 0);
  // Arm reaching to the mortar.
  p.stroke((cc) => {
    cc.moveTo(2, -40);
    cc.lineTo(12, -30 + recoil * 0.3);
  }, MAT.bronze.base, 7);
  p.part((cc) => circle(cc, 13, -29 + recoil * 0.3, 4.5), MAT.skinLight);
  // Head: beard, team scarf, bronze helmet with goggles.
  p.part((cc) => roundRect(cc, -20, -54, 26, 7, 3), team, -2);
  p.part((cc) => circle(cc, -5, -66, 15), MAT.skinLight, 3);
  p.part((cc) => {
    cc.moveTo(-18, -66);
    cc.quadraticCurveTo(-18, -46, -4, -46);
    cc.quadraticCurveTo(10, -46, 10, -64);
    cc.quadraticCurveTo(2, -58, -4, -60);
    cc.quadraticCurveTo(-10, -58, -18, -66);
    cc.closePath();
  }, MAT.beard, 2);
  p.part((cc) => {
    cc.moveTo(-21, -71);
    cc.arc(-5, -71, 16, Math.PI, 0);
    cc.closePath();
  }, MAT.bronze, 2);
  p.part((cc) => roundRect(cc, -14, -76, 26, 7, 3), MAT.leather, 6);
  p.part((cc) => {
    circle(cc, 0, -72.5, 4.5);
    circle(cc, 9, -72.5, 4.5);
  }, { base: "#9fe3ff", shade: "#5fb8e0" }, 5);
  c.restore();
};
