import { describe, expect, it } from "vitest";
import {
  computeLineTotals,
  divRoundHalfAwayFromZero,
  FRENCH_VAT_RATES,
  formatCentsToEuros,
  MoneyError,
  parseDecimalToScaledBigInt,
  summarizeDocument,
} from "./money";

describe("parseDecimalToScaledBigInt", () => {
  it("parse un entier simple", () => {
    expect(parseDecimalToScaledBigInt(5, 3)).toBe(5000n);
  });

  it("parse une décimale exacte", () => {
    expect(parseDecimalToScaledBigInt("2.5", 3)).toBe(2500n);
    expect(parseDecimalToScaledBigInt("1.234", 3)).toBe(1234n);
  });

  it("parse une valeur négative (avoir)", () => {
    expect(parseDecimalToScaledBigInt("-3.5", 3)).toBe(-3500n);
  });

  it("rejette trop de décimales", () => {
    expect(() => parseDecimalToScaledBigInt("1.2345", 3)).toThrow(MoneyError);
  });

  it("rejette la notation scientifique", () => {
    expect(() => parseDecimalToScaledBigInt("1e21", 3)).toThrow(MoneyError);
  });

  it("rejette une valeur non numérique", () => {
    expect(() => parseDecimalToScaledBigInt("abc", 3)).toThrow(MoneyError);
  });
});

describe("divRoundHalfAwayFromZero", () => {
  it("arrondit une moitié positive vers le haut", () => {
    expect(divRoundHalfAwayFromZero(5n, 10n)).toBe(1n); // 0.5 -> 1
    expect(divRoundHalfAwayFromZero(15n, 10n)).toBe(2n); // 1.5 -> 2
  });

  it("arrondit une moitié négative vers le bas (symétrique)", () => {
    expect(divRoundHalfAwayFromZero(-5n, 10n)).toBe(-1n);
    expect(divRoundHalfAwayFromZero(-15n, 10n)).toBe(-2n);
  });

  it("n'arrondit pas quand ce n'est pas une moitié exacte", () => {
    expect(divRoundHalfAwayFromZero(4n, 10n)).toBe(0n); // 0.4 -> 0
    expect(divRoundHalfAwayFromZero(6n, 10n)).toBe(1n); // 0.6 -> 1
  });

  it("rejette un dénominateur non positif", () => {
    expect(() => divRoundHalfAwayFromZero(5n, 0n)).toThrow(MoneyError);
    expect(() => divRoundHalfAwayFromZero(5n, -1n)).toThrow(MoneyError);
  });
});

describe("computeLineTotals — cas nominaux", () => {
  it("calcule une ligne simple sans arrondi (100 € HT, TVA 20 %)", () => {
    const result = computeLineTotals({
      quantity: 1,
      unitPriceCents: 10000,
      vatRatePer100000: FRENCH_VAT_RATES.NORMAL,
    });
    expect(result).toEqual({
      lineHtCents: 10000,
      lineVatCents: 2000,
      lineTtcCents: 12000,
    });
  });

  it("gère une quantité avec 3 décimales (ex: 1.234 heures)", () => {
    const result = computeLineTotals({
      quantity: "1.234",
      unitPriceCents: 5000, // 50,00 €/h
      vatRatePer100000: FRENCH_VAT_RATES.NORMAL,
    });
    // HT = 50 * 1.234 = 61.70 € -> 6170 centimes exact
    expect(result.lineHtCents).toBe(6170);
    expect(result.lineVatCents).toBe(1234); // 6170 * 0.20 = 1234 exact
    expect(result.lineTtcCents).toBe(7404);
  });

  it("gère un taux de TVA à 0 (exonéré)", () => {
    const result = computeLineTotals({
      quantity: 3,
      unitPriceCents: 1000,
      vatRatePer100000: FRENCH_VAT_RATES.EXONERE,
    });
    expect(result).toEqual({
      lineHtCents: 3000,
      lineVatCents: 0,
      lineTtcCents: 3000,
    });
  });
});

describe("computeLineTotals — arrondi au centime le plus proche", () => {
  it("arrondit exactement 0,5 centime de TVA vers le haut", () => {
    // HT = 10 centimes, taux 5% (5000/100000) => TVA = 0.5 centime exact
    const result = computeLineTotals({
      quantity: 1,
      unitPriceCents: 10,
      vatRatePer100000: 5000,
    });
    expect(result.lineHtCents).toBe(10);
    expect(result.lineVatCents).toBe(1); // 0.5 -> 1 (arrondi commercial)
    expect(result.lineTtcCents).toBe(11);
  });

  it("arrondit une TVA à 5.5 % avec un HT qui ne tombe pas rond", () => {
    // HT = 33 centimes, taux 5.5% => 33 * 5500 / 100000 = 1.815 -> arrondi à 2
    const result = computeLineTotals({
      quantity: 1,
      unitPriceCents: 33,
      vatRatePer100000: FRENCH_VAT_RATES.REDUIT,
    });
    expect(result.lineHtCents).toBe(33);
    expect(result.lineVatCents).toBe(2);
    expect(result.lineTtcCents).toBe(35);
  });

  it("reste précis sur de gros montants (pas de perte de précision flottante)", () => {
    // 999 999,999 unités à 999 999 centimes, TVA 20% — dépasse 2^53 en intermédiaire
    // si on utilisait des flottants ; BigInt doit rester exact.
    const result = computeLineTotals({
      quantity: "999999.999",
      unitPriceCents: 999999,
      vatRatePer100000: FRENCH_VAT_RATES.NORMAL,
    });
    // Vérification manuelle : HT = 999999 * 999999999 / 1000 (centimes), arrondi
    const expectedHt = divRoundHalfAwayFromZero(
      999999n * 999999999n,
      1000n
    );
    expect(BigInt(result.lineHtCents)).toBe(expectedHt);
    expect(BigInt(result.lineVatCents)).toBe(
      divRoundHalfAwayFromZero(expectedHt * 20000n, 100000n)
    );
  });
});

describe("computeLineTotals — validation stricte", () => {
  it("rejette un prix unitaire non entier", () => {
    expect(() =>
      computeLineTotals({
        quantity: 1,
        unitPriceCents: 10.5,
        vatRatePer100000: FRENCH_VAT_RATES.NORMAL,
      })
    ).toThrow(MoneyError);
  });

  it("rejette un taux de TVA négatif", () => {
    expect(() =>
      computeLineTotals({
        quantity: 1,
        unitPriceCents: 100,
        vatRatePer100000: -1,
      })
    ).toThrow(MoneyError);
  });

  it("rejette une quantité à 4 décimales", () => {
    expect(() =>
      computeLineTotals({
        quantity: "1.2345",
        unitPriceCents: 100,
        vatRatePer100000: FRENCH_VAT_RATES.NORMAL,
      })
    ).toThrow(MoneyError);
  });
});

describe("summarizeDocument", () => {
  it("agrège plusieurs lignes au même taux de TVA", () => {
    const lines = [
      computeLineTotals({
        quantity: 2,
        unitPriceCents: 5000,
        vatRatePer100000: FRENCH_VAT_RATES.NORMAL,
      }),
      computeLineTotals({
        quantity: 1,
        unitPriceCents: 3000,
        vatRatePer100000: FRENCH_VAT_RATES.NORMAL,
      }),
    ].map((l) => ({ ...l, vatRatePer100000: FRENCH_VAT_RATES.NORMAL }));

    const totals = summarizeDocument(lines);
    expect(totals.subtotalHtCents).toBe(13000); // (2*5000) + 3000
    expect(totals.totalVatCents).toBe(2600); // 13000 * 20%
    expect(totals.totalTtcCents).toBe(15600);
    expect(totals.vatBreakdown).toEqual([
      { vatRatePer100000: FRENCH_VAT_RATES.NORMAL, baseHtCents: 13000, vatCents: 2600 },
    ]);
  });

  it("ventile correctement la TVA quand plusieurs taux sont mélangés", () => {
    const lineA = {
      ...computeLineTotals({
        quantity: 1,
        unitPriceCents: 10000,
        vatRatePer100000: FRENCH_VAT_RATES.NORMAL,
      }),
      vatRatePer100000: FRENCH_VAT_RATES.NORMAL,
    };
    const lineB = {
      ...computeLineTotals({
        quantity: 1,
        unitPriceCents: 10000,
        vatRatePer100000: FRENCH_VAT_RATES.REDUIT,
      }),
      vatRatePer100000: FRENCH_VAT_RATES.REDUIT,
    };

    const totals = summarizeDocument([lineA, lineB]);
    expect(totals.subtotalHtCents).toBe(20000);
    expect(totals.totalVatCents).toBe(2000 + 550);
    expect(totals.vatBreakdown).toEqual([
      { vatRatePer100000: FRENCH_VAT_RATES.REDUIT, baseHtCents: 10000, vatCents: 550 },
      { vatRatePer100000: FRENCH_VAT_RATES.NORMAL, baseHtCents: 10000, vatCents: 2000 },
    ]);
  });

  it("gère une liste vide (devis sans lignes)", () => {
    const totals = summarizeDocument([]);
    expect(totals).toEqual({
      subtotalHtCents: 0,
      totalVatCents: 0,
      totalTtcCents: 0,
      vatBreakdown: [],
    });
  });

  it("la somme des lignes TTC est toujours égale à HT + TVA (cohérence interne)", () => {
    const lines: Array<{ q: string; price: number; rate: number }> = [
      { q: "1.5", price: 3333, rate: FRENCH_VAT_RATES.NORMAL },
      { q: "0.001", price: 999999, rate: FRENCH_VAT_RATES.REDUIT },
      { q: "7", price: 1, rate: FRENCH_VAT_RATES.PARTICULIER },
    ];
    const computed = lines.map((l) => ({
      ...computeLineTotals({
        quantity: l.q,
        unitPriceCents: l.price,
        vatRatePer100000: l.rate,
      }),
      vatRatePer100000: l.rate,
    }));
    const totals = summarizeDocument(computed);
    expect(totals.totalTtcCents).toBe(
      totals.subtotalHtCents + totals.totalVatCents
    );
  });
});

describe("formatCentsToEuros", () => {
  it("formate en euros avec séparateur français", () => {
    expect(formatCentsToEuros(123456)).toMatch(/1\s?234,56\s?€/);
  });

  it("rejette un montant non entier", () => {
    expect(() => formatCentsToEuros(10.5)).toThrow(MoneyError);
  });
});
