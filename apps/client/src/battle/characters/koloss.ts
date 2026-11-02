import { bodyMotion, circle, impact, roundRect, swing, type CharacterDraw, type Painter } from "./paint";
import { MAT, TEAM, type TeamTone } from "./style";

/**
 * Koloss: broad knight in plate. Great helm with cross visor, rivets and gold crown band,
 * three-feather plume, kite shield with a sun emblem, flanged mace, team tabard with trim.
 * Smashes the mace from over the head.
 */
export const drawKoloss: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const hit = impact(pose.attack);

  armoredLeg(p, -15, legA);
  armoredLeg(p, 3, legB);

  c.save();
  c.translate(0, bob);
  c.scale(1 + hit * 0.05, 1 - hit * 0.07);

  // Chainmail skirt with ring pattern and scalloped hem.
  p.part3((cc) => {
    cc.moveTo(-21, -34);
    cc.lineTo(21, -34);
    cc.lineTo(21, -22);
    for (let x = 21; x > -21; x -= 7) cc.quadraticCurveTo(x - 3.5, -18, x - 7, -22);
    cc.closePath();
  }, MAT.chain, 8, -12);
  p.line((cc) => {
    for (let y = -31; y <= -24; y += 3.5) for (let x = -18 + (y % 2) * 2; x < 19; x += 4.5) {
      cc.moveTo(x + 1.6, y);
      cc.arc(x, y, 1.6, 0, Math.PI);
    }
  }, 0.8);

  // Breastplate: ridge, seams, light rim on the left.
  p.part3((cc) => {
    cc.moveTo(-21, -36);
    cc.quadraticCurveTo(-25, -52, -18, -62);
    cc.lineTo(18, -62);
    cc.quadraticCurveTo(25, -52, 21, -36);
    cc.closePath();
  }, MAT.steel, 4, -13);
  p.line((cc) => {
    cc.moveTo(0, -61);
    cc.lineTo(0, -37);
    cc.moveTo(-19, -46);
    cc.quadraticCurveTo(0, -42, 19, -46);
  }, 1.4);
  p.gloss((cc) => roundRect(cc, -15, -58, 4, 16, 2));

  // Team tabard with gold trim and folds.
  tabard(p, team);

  // Belt with gold buckle.
  p.part3((cc) => roundRect(cc, -23, -38, 46, 7, 3), MAT.leather, 10, -16);
  p.part3((cc) => roundRect(cc, -4.5, -39.5, 9, 10, 2), MAT.gold, 2, -2);
  p.flat((cc) => roundRect(cc, -2, -37, 4, 5, 1), MAT.leather.shade);

  // Pauldrons (layered shoulder plates).
  for (const [x, dir] of [
    [-19, -1],
    [17, 1],
  ] as const) {
    p.part3((cc) => {
      cc.moveTo(x - 9, -54);
      cc.quadraticCurveTo(x - 9, -68, x + 2 * dir, -67);
      cc.quadraticCurveTo(x + 12, -66, x + 10, -54);
      cc.quadraticCurveTo(x, -50, x - 9, -54);
      cc.closePath();
    }, MAT.steel, x + 3, x - 4);
    p.line((cc) => {
      cc.moveTo(x - 7, -58);
      cc.quadraticCurveTo(x, -55, x + 8, -58);
    }, 1.2);
    p.rivets([[x + 1, -62]], 1.4);
  }

  helm(p, team, pose.time, pose.walking);
  shield(p, team);
  mace(p, s);

  c.restore();
};

function armoredLeg(p: Painter, x: number, lift: number): void {
  // Greave.
  p.part3((cc) => roundRect(cc, x, -26, 12, 20 - lift, 4), MAT.steel, x + 7, x + 3);
  // Knee cop.
  p.part3((cc) => circle(cc, x + 6, -21 - lift * 0.5, 4.5), MAT.steel, x + 7, x + 4);
  p.rivets([[x + 6, -21 - lift * 0.5]], 1.1, MAT.gold);
  // Sabaton.
  p.part3((cc) => {
    cc.moveTo(x - 2, -lift);
    cc.lineTo(x - 2, -8 - lift);
    cc.lineTo(x + 12, -8 - lift);
    cc.quadraticCurveTo(x + 19, -5 - lift, x + 18, -lift);
    cc.closePath();
  }, MAT.iron, x + 9, x + 2);
}

function tabard(p: Painter, team: TeamTone): void {
  const path = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-10, -60);
    cc.lineTo(10, -60);
    cc.lineTo(11, -14);
    cc.lineTo(0, -10);
    cc.lineTo(-11, -14);
    cc.closePath();
  };
  p.part3(path, team, 3, -6);
  p.line(path, 2.2, MAT.gold.base);
  p.line((cc) => {
    cc.moveTo(-5, -32);
    cc.lineTo(-6, -15);
    cc.moveTo(5, -32);
    cc.lineTo(6, -15);
  }, 1.1, team.shade);
  // Embroidered emblem: small gold lozenge.
  p.part3((cc) => {
    cc.moveTo(0, -56);
    cc.lineTo(4.5, -50);
    cc.lineTo(0, -44);
    cc.lineTo(-4.5, -50);
    cc.closePath();
  }, MAT.gold, 1, -1.5);
}

function helm(p: Painter, team: TeamTone, time: number, walking: boolean): void {
  const c = p.ctx;
  // Three-feather plume, swaying.
  const sway = Math.sin(time * 3) * 2 + (walking ? 3 : 0);
  const feathers: [string, number, number][] = [
    [team.shade, -26, -2],
    [team.base, -20, 0],
    [team.light, -13, 2],
  ];
  for (const [color, reach, dy] of feathers) {
    p.part((cc) => {
      cc.moveTo(-4, -100 + dy);
      cc.bezierCurveTo(reach - 6 - sway, -112 + dy, reach - 14 - sway, -92 + dy, reach - sway * 1.3, -84 + dy);
      cc.bezierCurveTo(reach + 4, -92 + dy, -6, -96 + dy, -4, -100 + dy);
      cc.closePath();
    }, { base: color, shade: color });
  }
  p.part3((cc) => roundRect(cc, -7, -104, 8, 7, 2), MAT.gold, -2, -5);

  // Great helm.
  const shell = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-19, -60);
    cc.lineTo(-19, -86);
    cc.quadraticCurveTo(-19, -101, 0, -101);
    cc.quadraticCurveTo(19, -101, 19, -86);
    cc.lineTo(19, -60);
    cc.quadraticCurveTo(0, -56, -19, -60);
    cc.closePath();
  };
  p.part3(shell, MAT.steel, 6, -11);
  // Gold crown band with rivets.
  p.part3((cc) => roundRect(cc, -19.5, -92, 39, 6, 2), MAT.gold, 7, -10);
  p.rivets(
    [
      [-14, -89],
      [-6, -89],
      [2, -89],
      [10, -89],
    ],
    1.2,
    MAT.steel,
  );
  // Brow ridge and cross-shaped visor.
  p.line((cc) => {
    cc.moveTo(-17, -81);
    cc.quadraticCurveTo(2, -84, 19, -81);
  }, 1.6);
  p.flat((cc) => {
    roundRect(cc, -2, -80, 21, 4.5, 2);
    roundRect(cc, 5, -80, 4.5, 15, 2);
  }, "#140f24");
  // Breathing holes.
  p.flat((cc) => {
    for (const [x, y] of [
      [12, -70],
      [15, -70],
      [12, -66.5],
      [15, -66.5],
    ] as const)
      circle(cc, x, y, 1.1);
  }, "#140f24");
  // Specular glint.
  p.gloss((cc) => {
    cc.moveTo(-14, -94);
    cc.quadraticCurveTo(-16, -80, -14, -66);
    cc.lineTo(-11, -66);
    cc.quadraticCurveTo(-13, -80, -10, -95);
    cc.closePath();
  }, 0.6);
  c.lineWidth = 1;
}

function shield(p: Painter, team: TeamTone): void {
  const outer = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-38, -70);
    cc.lineTo(-8, -70);
    cc.quadraticCurveTo(-6, -36, -23, -12);
    cc.quadraticCurveTo(-40, -36, -38, -70);
    cc.closePath();
  };
  const inner = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-34, -66);
    cc.lineTo(-12, -66);
    cc.quadraticCurveTo(-11, -38, -23, -18);
    cc.quadraticCurveTo(-35, -38, -34, -66);
    cc.closePath();
  };
  p.part3(outer, MAT.steel, -16, -33);
  p.part3(inner, team, -18, -30);
  // Diagonal field split for depth.
  p.ctx.save();
  p.ctx.beginPath();
  inner(p.ctx);
  p.ctx.clip();
  p.flat((cc) => {
    cc.moveTo(-34, -40);
    cc.lineTo(-10, -66);
    cc.lineTo(-10, -10);
    cc.lineTo(-34, -10);
    cc.closePath();
  }, team.shade);
  p.ctx.restore();
  p.line(inner, 1.6);
  // Gold sun emblem.
  const cx = -23;
  const cy = -46;
  const sun = (cc: CanvasRenderingContext2D) => {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 === 0 ? 10 : 6.5;
      if (i === 0) cc.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      else cc.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    cc.closePath();
  };
  p.flat(sun, MAT.gold.base);
  p.line(sun, 1.2);
  p.flat((cc) => circle(cc, cx, cy, 4.2), MAT.gold.shade);
  p.line((cc) => circle(cc, cx, cy, 4.2), 1.2);
  p.gloss((cc) => circle(cc, cx - 1.3, cy - 1.3, 1.4), 0.7);
  p.rivets([
    [-35, -67],
    [-11, -67],
    [-36, -48],
    [-10, -48],
    [-23, -15],
  ]);
  p.gloss((cc) => roundRect(cc, -34, -64, 3, 18, 1.5), 0.4);
}

function mace(p: Painter, s: number): void {
  const c = p.ctx;
  const rest = 0.9;
  const angle = s < 0 ? rest + s * (rest + 2.3) : rest + s * (0.5 - rest) + s * 0.2;
  c.save();
  c.translate(15, -52);
  c.rotate(angle);
  // Arm in plate with an elbow cop.
  p.stroke((cc) => {
    cc.moveTo(0, 0);
    cc.lineTo(17, 0);
  }, MAT.steel.base, 10);
  p.part3((cc) => circle(cc, 8, 0, 4), MAT.steel, 9, 6);
  // Handle with leather grip wraps and gold collar.
  p.stroke((cc) => {
    cc.moveTo(14, 0);
    cc.lineTo(44, 0);
  }, MAT.wood.base, 5);
  p.line((cc) => {
    for (let x = 16; x < 26; x += 3) {
      cc.moveTo(x, -2.5);
      cc.lineTo(x + 2, 2.5);
    }
  }, 1.1);
  p.part3((cc) => roundRect(cc, 38, -4, 4, 8, 1.5), MAT.gold, 40, 39);
  // Flanged head.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    p.part3((cc) => {
      cc.moveTo(48 + Math.cos(a - 0.35) * 6, Math.sin(a - 0.35) * 6);
      cc.lineTo(48 + Math.cos(a) * 14, Math.sin(a) * 14);
      cc.lineTo(48 + Math.cos(a + 0.35) * 6, Math.sin(a + 0.35) * 6);
      cc.closePath();
    }, MAT.iron, 50, 45);
  }
  p.part3((cc) => circle(cc, 48, 0, 8), MAT.iron, 50, 45);
  p.gloss((cc) => circle(cc, 45.5, -2.5, 2.2), 0.5);
  // Gauntlet.
  p.part3((cc) => roundRect(cc, 12, -5.5, 9, 11, 3), MAT.steel, 17, 14);
  c.restore();
}
