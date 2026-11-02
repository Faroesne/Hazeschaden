import { BALANCE, RULES, getUnitType } from "@hazeschaden/shared";
import { DAMAGE_LABEL, FORM_LABEL, ROLE_LABEL, beats, dps, rangeLabel } from "../text";
import { UnitArt } from "./UnitArt";

export function UnitCard({
  typeId,
  selected = false,
  owned,
  levelUp,
  onClick,
}: {
  typeId: string;
  selected?: boolean;
  /** Units already in the army, e.g. "im Besitz: 2× · Lv1". */
  owned?: string | undefined;
  /** Shown as a level-up choice: current level → next. */
  levelUp?: { from: number } | undefined;
  onClick?: () => void;
}) {
  const u = getUnitType(typeId);
  return (
    <button
      className={`unit-card role-${u.role}${selected ? " selected" : ""}${levelUp ? " levelup-card" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <UnitArt typeId={typeId} size={levelUp ? 48 : 44} />
      <div className="unit-body">
        <div className="unit-head">
          <span className="unit-name">{u.name}</span>
          {levelUp ? (
            <span className="unit-badge">
              ⬆ Lv{levelUp.from}→{levelUp.from + 1}
            </span>
          ) : (
            <span className="unit-count">×{u.count}</span>
          )}
        </div>
        {levelUp ? (
          <div className="unit-tags">
            Alle {u.name}: +{BALANCE.levelBonusPct} % Leben und Schaden{levelUp.from + 1 === RULES.maxLevel ? " (max. Level)" : ""}
          </div>
        ) : (
          <>
            <div className="unit-tags">
              {ROLE_LABEL[u.role]} · {FORM_LABEL[u.form]} · {DAMAGE_LABEL[u.damageKind]}
            </div>
            <div className="unit-stats">
              <span>❤ {u.hp}</span>
              <span>⚔ {dps(u)}/s</span>
              <span>↔ {rangeLabel(u)}</span>
            </div>
            <div className="unit-beats">stark gegen {beats(u)}</div>
          </>
        )}
        {owned && <div className="unit-owned">{owned}</div>}
      </div>
    </button>
  );
}
