/** Unit catalog. See docs/SPEC.md §3. */
import tuning from "./tuning.json" with { type: "json" };

export type Role = "tank" | "ranged" | "assassin";
export type Form = "mass" | "elite";
export type DamageKind = "single" | "area";

export interface UnitType {
  id: string;
  name: string;
  role: Role;
  form: Form;
  damageKind: DamageKind;
  /** Units one pick brings. */
  count: number;
  hp: number;
  /** Damage per attack. */
  damage: number;
  attackIntervalTicks: number;
  /** Attack reach, measured edge to edge. */
  range: number;
  /** World units per tick. */
  speed: number;
  radius: number;
  /** Splash radius around the impact point; 0 for single-target units. */
  areaRadius: number;
  /** World units per tick; 0 means melee (hit lands next tick). */
  projectileSpeed: number;
  /** Teleports behind the enemy back line when the battle starts. */
  teleport: boolean;
}

/** Which role each role beats. */
export const COUNTERS: Readonly<Record<Role, Role>> = {
  assassin: "ranged",
  ranged: "tank",
  tank: "assassin",
};

const TPS = 20;
const RANGE = { melee: 12, mid: 220, long: 400 } as const;
/** Arena units per tick (×20 per second). */
const SPEED = { slow: 2, mid: 3, fast: 4 } as const;

interface Spec {
  id: string;
  name: string;
  role: Role;
  form: Form;
  damageKind: DamageKind;
  count: number;
  hp: number;
  dps: number;
  interval: number;
  range: number;
  speed: number;
  areaRadius?: number;
}

function radiusFor(form: Form, count: number): number {
  if (form === "elite") return 24;
  return count >= 5 ? 13 : 17;
}

function unit(s: Spec): UnitType {
  return {
    id: s.id,
    name: s.name,
    role: s.role,
    form: s.form,
    damageKind: s.damageKind,
    count: s.count,
    hp: s.hp,
    damage: Math.round((s.dps * s.interval) / TPS),
    attackIntervalTicks: s.interval,
    range: s.range,
    speed: s.speed,
    radius: radiusFor(s.form, s.count),
    areaRadius: s.areaRadius ?? 0,
    projectileSpeed: s.role === "ranged" ? 20 : 0,
    teleport: s.role === "assassin",
  };
}

/** Design starting values. The shipped values (UNITS) apply tuning.json on top. */
export const BASE_UNITS: readonly UnitType[] = [
  // Tanks
  unit({ id: "koloss", name: "Koloss", role: "tank", form: "elite", damageKind: "single", count: 1, hp: 2000, dps: 25, interval: 20, range: RANGE.melee, speed: SPEED.slow }),
  unit({ id: "bollwerk", name: "Bollwerk", role: "tank", form: "elite", damageKind: "area", count: 1, hp: 1800, dps: 18, interval: 30, range: RANGE.melee, speed: SPEED.slow, areaRadius: 40 }),
  unit({ id: "schildtraeger", name: "Schildträger", role: "tank", form: "mass", damageKind: "single", count: 5, hp: 300, dps: 7, interval: 20, range: RANGE.melee, speed: SPEED.mid }),
  unit({ id: "dornenwache", name: "Dornenwache", role: "tank", form: "mass", damageKind: "area", count: 3, hp: 500, dps: 7.5, interval: 40, range: RANGE.melee, speed: SPEED.mid, areaRadius: 30 }),
  // Ranged
  unit({ id: "scharfschuetze", name: "Scharfschütze", role: "ranged", form: "elite", damageKind: "single", count: 1, hp: 500, dps: 100, interval: 40, range: RANGE.long, speed: SPEED.slow }),
  unit({ id: "moerser", name: "Mörser", role: "ranged", form: "elite", damageKind: "area", count: 1, hp: 500, dps: 70, interval: 60, range: RANGE.long, speed: SPEED.slow, areaRadius: 70 }),
  unit({ id: "bogenschuetzen", name: "Bogenschützen", role: "ranged", form: "mass", damageKind: "single", count: 5, hp: 60, dps: 33, interval: 20, range: RANGE.mid, speed: SPEED.mid }),
  unit({ id: "funkenwerfer", name: "Funkenwerfer", role: "ranged", form: "mass", damageKind: "area", count: 3, hp: 130, dps: 30, interval: 30, range: RANGE.mid, speed: SPEED.mid, areaRadius: 35 }),
  // Assassins
  unit({ id: "klingenmeister", name: "Klingenmeister", role: "assassin", form: "elite", damageKind: "single", count: 1, hp: 800, dps: 65, interval: 16, range: RANGE.melee, speed: SPEED.fast }),
  unit({ id: "wirbelklinge", name: "Wirbelklinge", role: "assassin", form: "elite", damageKind: "area", count: 1, hp: 800, dps: 44, interval: 20, range: RANGE.melee, speed: SPEED.fast, areaRadius: 45 }),
  unit({ id: "schattenrudel", name: "Schattenrudel", role: "assassin", form: "mass", damageKind: "single", count: 5, hp: 100, dps: 20, interval: 10, range: RANGE.melee, speed: SPEED.fast }),
  unit({ id: "giftmischer", name: "Giftmischer", role: "assassin", form: "mass", damageKind: "area", count: 3, hp: 200, dps: 20, interval: 20, range: RANGE.melee, speed: SPEED.fast, areaRadius: 30 }),
];

/** Per-unit HP/damage written by `pnpm balance --tune`. */
export type Tuning = Record<string, { hp: number; damage: number }>;

export function applyTuning(units: readonly UnitType[], tuning: Tuning): UnitType[] {
  return units.map((u) => {
    const t = tuning[u.id];
    return t ? { ...u, hp: t.hp, damage: t.damage } : { ...u };
  });
}

/** The unit values the game uses. */
export const UNITS: readonly UnitType[] = applyTuning(BASE_UNITS, tuning as Tuning);

const BY_ID = new Map(UNITS.map((u, i) => [u.id, { unit: u, order: i }]));

export function getUnitType(id: string): UnitType {
  const entry = BY_ID.get(id);
  if (!entry) throw new Error(`Unknown unit type: ${id}`);
  return entry.unit;
}

/** Catalog position; used for deterministic ordering. */
export function unitOrder(id: string): number {
  const entry = BY_ID.get(id);
  if (!entry) throw new Error(`Unknown unit type: ${id}`);
  return entry.order;
}

/** Lanchester pick budget: count² × hp × dps. */
export function pickBudget(u: UnitType): number {
  const dps = (u.damage * TPS) / u.attackIntervalTicks;
  return u.count * u.count * u.hp * dps;
}
