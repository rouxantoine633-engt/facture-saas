/** Couleur principale par défaut des rapports PDF (celle de la charte de l'application). */
export const DEFAULT_BRAND_COLOR = "#1e40af";

/** « #abc » ou « #AABBCC » → « #aabbcc » ; `null` si ce n'est pas une couleur hexadécimale valide. */
export function normalizeHexColor(value: string | null | undefined): string | null {
  const v = (value ?? "").trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : null;
}

function channels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = ([r, g, b]: [number, number, number]) =>
  `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;

/** Luminance relative WCAG d'une couleur « #rrggbb ». */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste WCAG entre deux couleurs (de 1 à 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Texte (blanc ou noir) le plus lisible sur un fond donné, par exemple l'en-tête d'un tableau. Avec ces deux
 * extrêmes, le meilleur des deux atteint toujours au moins 4,58:1, quel que soit le fond (un gris quasi noir
 * ne le garantirait pas, par exemple sur un rouge pur).
 */
export function readableTextOn(background: string): string {
  return contrastRatio("#ffffff", background) >= contrastRatio("#000000", background) ? "#ffffff" : "#000000";
}

/** Mélange une couleur avec une autre (`amount` de 0 à 1 vers `toward`). */
export function mix(hex: string, toward: string, amount: number): string {
  const a = channels(hex);
  const b = channels(toward);
  return toHex([0, 1, 2].map((i) => a[i]! + (b[i]! - a[i]!) * amount) as [number, number, number]);
}

/** Fond très clair teinté de la couleur de l'entreprise (lignes de totaux). */
export function tint(hex: string, amount = 0.9): string {
  return mix(hex, "#ffffff", amount);
}

/**
 * Variante de la couleur utilisable pour du TEXTE sur fond blanc (contraste ≥ 4,5:1) : la couleur
 * choisie est assombrie au besoin. Une couleur claire (jaune, par exemple) reste ainsi lisible.
 */
export function accentForText(hex: string, background = "#ffffff"): string {
  let color = hex;
  for (let step = 0; step < 20 && contrastRatio(color, background) < 4.5; step++) color = mix(color, "#000000", 0.1);
  return color;
}
