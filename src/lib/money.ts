/**
 * Moteur de calcul financier (HT / TVA / TTC).
 *
 * Règles :
 * - Tous les montants sont manipulés en CENTIMES ENTIERS, jamais en flottant.
 * - Toute division intermédiaire passe par BigInt + arrondi "half away from
 *   zero" (arrondi commercial : 0,5 arrondit vers le haut en valeur absolue),
 *   pour bannir toute erreur de représentation flottante.
 * - L'arrondi de la TVA est appliqué ligne à ligne (méthode autorisée par
 *   l'administration fiscale française, à condition d'être appliquée de
 *   façon constante — voir README §Conformité).
 */

const QUANTITY_DECIMALS = 3;
const QUANTITY_SCALE = 10n ** BigInt(QUANTITY_DECIMALS);
const VAT_RATE_SCALE = 100000n; // vatRatePer100000: 20% => 20000, 5.5% => 5500

/** Taux de TVA français courants, exprimés en centièmes de millième (voir VAT_RATE_SCALE). */
export const FRENCH_VAT_RATES = {
  NORMAL: 20000, // 20 %
  INTERMEDIAIRE: 10000, // 10 %
  REDUIT: 5500, // 5.5 %
  PARTICULIER: 2100, // 2.1 %
  EXONERE: 0, // TVA non applicable (art. 293B du CGI)
} as const;

export class MoneyError extends Error {}

/**
 * Convertit une quantité (nombre ou chaîne décimale, jusqu'à 3 décimales)
 * en entier mis à l'échelle, en travaillant directement sur les chiffres
 * de la représentation décimale — aucune arithmétique flottante impliquée.
 */
export function parseDecimalToScaledBigInt(
  value: number | string,
  scaleDecimals: number
): bigint {
  const str = typeof value === "number" ? value.toString() : value.trim();
  if (str === "" || Number.isNaN(Number(str))) {
    throw new MoneyError(`Valeur décimale invalide : "${value}"`);
  }
  const negative = str.startsWith("-");
  const unsigned = negative ? str.slice(1) : str;

  if (unsigned.includes("e") || unsigned.includes("E")) {
    throw new MoneyError(
      `Notation scientifique non supportée pour une valeur monétaire : "${value}"`
    );
  }

  const [intPartRaw, fracPartRaw = ""] = unsigned.split(".");
  const intPart = intPartRaw === "" ? "0" : intPartRaw;

  if (fracPartRaw.length > scaleDecimals) {
    throw new MoneyError(
      `Trop de décimales (maximum ${scaleDecimals}) pour la valeur "${value}"`
    );
  }

  const paddedFrac = fracPartRaw.padEnd(scaleDecimals, "0");
  const digits = `${intPart}${paddedFrac}`;
  const result = BigInt(digits);
  return negative ? -result : result;
}

/**
 * Division entière avec arrondi "half away from zero" :
 * 0.5 arrondit à 1, -0.5 arrondit à -1 (arrondi commercial standard).
 * `denominator` doit être strictement positif.
 */
export function divRoundHalfAwayFromZero(
  numerator: bigint,
  denominator: bigint
): bigint {
  if (denominator <= 0n) {
    throw new MoneyError("Le dénominateur doit être strictement positif");
  }
  const sign = numerator < 0n ? -1n : 1n;
  const abs = numerator < 0n ? -numerator : numerator;
  const quotient = abs / denominator;
  const remainder = abs % denominator;
  const roundedAbs = remainder * 2n >= denominator ? quotient + 1n : quotient;
  return sign * roundedAbs;
}

function toSafeNumber(value: bigint): number {
  if (
    value > BigInt(Number.MAX_SAFE_INTEGER) ||
    value < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new MoneyError(
      `Montant hors des bornes représentables sans risque de perte de précision : ${value}`
    );
  }
  return Number(value);
}

export interface LineInput {
  quantity: number | string;
  unitPriceCents: number;
  vatRatePer100000: number;
}

export interface LineTotals {
  lineHtCents: number;
  lineVatCents: number;
  lineTtcCents: number;
}

export function computeLineTotals(input: LineInput): LineTotals {
  if (!Number.isInteger(input.unitPriceCents)) {
    throw new MoneyError(
      "unitPriceCents doit être un entier (prix unitaire en centimes)"
    );
  }
  if (!Number.isInteger(input.vatRatePer100000) || input.vatRatePer100000 < 0) {
    throw new MoneyError(
      "vatRatePer100000 doit être un entier positif (voir FRENCH_VAT_RATES)"
    );
  }

  const quantityScaled = parseDecimalToScaledBigInt(
    input.quantity,
    QUANTITY_DECIMALS
  );
  const unitPriceCents = BigInt(input.unitPriceCents);
  const vatRate = BigInt(input.vatRatePer100000);

  const lineHtCents = divRoundHalfAwayFromZero(
    unitPriceCents * quantityScaled,
    QUANTITY_SCALE
  );
  const lineVatCents = divRoundHalfAwayFromZero(
    lineHtCents * vatRate,
    VAT_RATE_SCALE
  );
  const lineTtcCents = lineHtCents + lineVatCents;

  return {
    lineHtCents: toSafeNumber(lineHtCents),
    lineVatCents: toSafeNumber(lineVatCents),
    lineTtcCents: toSafeNumber(lineTtcCents),
  };
}

export interface VatBreakdownEntry {
  vatRatePer100000: number;
  baseHtCents: number;
  vatCents: number;
}

export interface DocumentTotals {
  subtotalHtCents: number;
  totalVatCents: number;
  totalTtcCents: number;
  vatBreakdown: VatBreakdownEntry[];
}

export type ComputedLine = LineTotals & { vatRatePer100000: number };

/**
 * Agrège les lignes d'un devis/facture/avoir : totaux HT/TVA/TTC et
 * ventilation de la TVA par taux (mention obligatoire sur la facture).
 */
export function summarizeDocument(lines: ComputedLine[]): DocumentTotals {
  let subtotalHtCents = 0;
  let totalVatCents = 0;
  let totalTtcCents = 0;
  const breakdownMap = new Map<
    number,
    { baseHtCents: number; vatCents: number }
  >();

  for (const line of lines) {
    subtotalHtCents += line.lineHtCents;
    totalVatCents += line.lineVatCents;
    totalTtcCents += line.lineTtcCents;

    const existing = breakdownMap.get(line.vatRatePer100000) ?? {
      baseHtCents: 0,
      vatCents: 0,
    };
    existing.baseHtCents += line.lineHtCents;
    existing.vatCents += line.lineVatCents;
    breakdownMap.set(line.vatRatePer100000, existing);
  }

  const vatBreakdown = Array.from(breakdownMap.entries())
    .sort(([rateA], [rateB]) => rateA - rateB)
    .map(([vatRatePer100000, totals]) => ({ vatRatePer100000, ...totals }));

  return { subtotalHtCents, totalVatCents, totalTtcCents, vatBreakdown };
}

/** Formate un montant en centimes en chaîne monétaire française (ex: "1 234,56 €"). */
export function formatCentsToEuros(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new MoneyError("formatCentsToEuros attend un entier (centimes)");
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
