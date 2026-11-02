import { unitSvg } from "../art/unitArt";

/** A unit's picture, tinted by the surrounding CSS `color`. */
export function UnitArt({ typeId, size = 40 }: { typeId: string; size?: number }) {
  return <span className="unit-art" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: unitSvg(typeId, "currentColor", size) }} />;
}
