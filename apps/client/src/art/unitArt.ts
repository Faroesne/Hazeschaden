/**
 * Original unit pictures as SVG (64×64, drawn with `currentColor`), so the UI can tint them and
 * the battle canvas can render them in white. Placeholder art until real graphics exist.
 */
const stroke = (w = 3.5) => `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const S = stroke();
const F = 'fill="currentColor" fill-opacity="0.28"';

export const UNIT_ART: Record<string, string> = {
  // Great helm with visor slit.
  koloss: `
    <path ${F} d="M16 50V30C16 17 48 17 48 30V50Z"/>
    <path ${S} d="M16 50V30C16 17 48 17 48 30V50Z"/>
    <path ${stroke(5)} d="M20 33H44"/>
    <path ${S} d="M32 38V50M24 42v4M40 42v4"/>
    <path ${S} d="M32 19V11"/>`,
  // Tower with battlements and a gate.
  bollwerk: `
    <path ${F} d="M13 54V22h6v-7h7v7h5v-7h7v7h5v-7h7v7h6v32Z"/>
    <path ${S} d="M13 54V22h6v-7h7v7h5v-7h7v7h5v-7h7v7h6v32Z"/>
    <path ${S} d="M27 54V45a5 5 0 0 1 10 0v9"/>
    <path ${S} d="M13 32h38"/>`,
  // Three round shields in a wall.
  schildtraeger: `
    <circle ${F} cx="20" cy="38" r="12"/><circle ${F} cx="44" cy="38" r="12"/><circle ${F} cx="32" cy="26" r="12"/>
    <circle ${S} cx="20" cy="38" r="12"/><circle ${S} cx="44" cy="38" r="12"/><circle ${S} cx="32" cy="26" r="12"/>
    <circle fill="currentColor" cx="20" cy="38" r="3"/><circle fill="currentColor" cx="44" cy="38" r="3"/><circle fill="currentColor" cx="32" cy="26" r="3"/>`,
  // Kite shield bristling with thorns.
  dornenwache: `
    <path ${F} d="M32 14l14 5v13c0 11-7 17-14 21-7-4-14-10-14-21V19Z"/>
    <path ${S} d="M32 14l14 5v13c0 11-7 17-14 21-7-4-14-10-14-21V19Z"/>
    <path ${S} d="M32 14V5M46 19l7-6M18 19l-7-6M46 32l8 2M18 32l-8 2M40 47l5 6M24 47l-5 6"/>`,
  // Crosshair.
  scharfschuetze: `
    <circle ${F} cx="32" cy="32" r="17"/>
    <circle ${S} cx="32" cy="32" r="17"/>
    <path ${S} d="M32 6v14M32 44v14M6 32h14M44 32h14"/>
    <circle fill="currentColor" cx="32" cy="32" r="4"/>`,
  // Mortar tube with a lobbed shell.
  moerser: `
    <path ${F} d="M14 46l18-18 8 8-18 18Z"/>
    <path ${S} d="M14 46l18-18 8 8-18 18Z"/>
    <path ${S} d="M10 56h30"/>
    <path ${S} d="M38 24Q46 6 56 16" stroke-dasharray="4 5"/>
    <circle fill="currentColor" cx="56" cy="20" r="4.5"/>`,
  // Bow with nocked arrow.
  bogenschuetzen: `
    <path ${F} d="M20 9Q46 32 20 55Z"/>
    <path ${S} d="M20 9Q46 32 20 55"/>
    <path ${stroke(2)} d="M20 9V55"/>
    <path ${S} d="M12 32h44M48 25l8 7-8 7"/>`,
  // Flame with sparks.
  funkenwerfer: `
    <path ${F} d="M32 56c-13 0-17-13-10-23 2 7 6 8 6 8-2-12 4-21 10-29 0 12 12 17 10 31-1 9-8 13-16 13Z"/>
    <path ${S} d="M32 56c-13 0-17-13-10-23 2 7 6 8 6 8-2-12 4-21 10-29 0 12 12 17 10 31-1 9-8 13-16 13Z"/>
    <circle fill="currentColor" cx="14" cy="18" r="2.5"/><circle fill="currentColor" cx="52" cy="14" r="2.5"/><circle fill="currentColor" cx="54" cy="30" r="2"/>`,
  // Long sword.
  klingenmeister: `
    <path ${F} d="M47 9l8 0 0 8-27 27-8-8Z"/>
    <path ${S} d="M47 9h8v8L28 44l-8-8Z"/>
    <path ${S} d="M14 34l16 16"/>
    <path ${stroke(5)} d="M22 42l-10 10"/>`,
  // Three spinning blades.
  wirbelklinge: `
    <g ${F}><path d="M32 32C30 19 38 8 52 8c-7 6-9 15-20 24Z"/></g>
    <g ${S}><path d="M32 32C30 19 38 8 52 8c-7 6-9 15-20 24Z"/></g>
    <g transform="rotate(120 32 32)"><path ${F} d="M32 32C30 19 38 8 52 8c-7 6-9 15-20 24Z"/><path ${S} d="M32 32C30 19 38 8 52 8c-7 6-9 15-20 24Z"/></g>
    <g transform="rotate(240 32 32)"><path ${F} d="M32 32C30 19 38 8 52 8c-7 6-9 15-20 24Z"/><path ${S} d="M32 32C30 19 38 8 52 8c-7 6-9 15-20 24Z"/></g>
    <circle fill="currentColor" cx="32" cy="32" r="4"/>`,
  // Wolf head.
  schattenrudel: `
    <path ${F} d="M15 12l11 12h12l11-12v20c0 12-8 20-17 23-9-3-17-11-17-23Z"/>
    <path ${S} d="M15 12l11 12h12l11-12v20c0 12-8 20-17 23-9-3-17-11-17-23Z"/>
    <path fill="currentColor" d="M22 33l7 2-6 3Z M42 33l-7 2 6 3Z"/>
    <path ${S} d="M28 46l4 3 4-3"/>`,
  // Poison flask with bubbles.
  giftmischer: `
    <path ${F} d="M19 42h26l4 7c2 4-1 7-5 7H20c-4 0-7-3-5-7Z"/>
    <path ${S} d="M26 9h12M28 9v15L15 49c-2 4 1 7 5 7h24c4 0 7-3 5-7L36 24V9"/>
    <circle ${stroke(2)} cx="40" cy="15" r="2.5"/><circle ${stroke(2)} cx="46" cy="8" r="2"/>
    <circle fill="currentColor" cx="28" cy="48" r="2.5"/><circle fill="currentColor" cx="37" cy="50" r="2"/>`,
};

export function unitSvg(typeId: string, color = "currentColor", size = 64): string {
  const art = UNIT_ART[typeId] ?? "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" style="color:${color}">${art}</svg>`;
}
