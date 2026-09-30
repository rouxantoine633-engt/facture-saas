import { describe, expect, it } from "vitest";
import { bucketPaymentsByMonth } from "./analytics";

describe("bucketPaymentsByMonth", () => {
  const now = new Date("2026-09-15T10:00:00.000Z");

  it("répartit les paiements dans le bon mois", () => {
    const result = bucketPaymentsByMonth(
      [
        { paidAt: new Date("2026-09-05T00:00:00.000Z"), amountCents: 1000 },
        { paidAt: new Date("2026-09-20T00:00:00.000Z"), amountCents: 2000 },
        { paidAt: new Date("2026-08-01T00:00:00.000Z"), amountCents: 500 },
      ],
      now,
      3
    );
    expect(result).toEqual([
      { monthKey: "2026-07", label: "juil.", totalCents: 0 },
      { monthKey: "2026-08", label: "août", totalCents: 500 },
      { monthKey: "2026-09", label: "sept.", totalCents: 3000 },
    ]);
  });

  it("inclut les mois sans paiement avec un total à 0", () => {
    const result = bucketPaymentsByMonth([], now, 6);
    expect(result).toHaveLength(6);
    expect(result.every((p) => p.totalCents === 0)).toBe(true);
    expect(result.map((p) => p.monthKey)).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
  });

  it("ignore les paiements antérieurs à la fenêtre demandée", () => {
    const result = bucketPaymentsByMonth(
      [{ paidAt: new Date("2025-01-01T00:00:00.000Z"), amountCents: 999 }],
      now,
      3
    );
    expect(result.reduce((sum, p) => sum + p.totalCents, 0)).toBe(0);
  });

  it("gère un changement d'année dans la fenêtre", () => {
    const result = bucketPaymentsByMonth(
      [{ paidAt: new Date("2025-12-15T00:00:00.000Z"), amountCents: 100 }],
      new Date("2026-01-10T00:00:00.000Z"),
      2
    );
    expect(result).toEqual([
      { monthKey: "2025-12", label: "déc.", totalCents: 100 },
      { monthKey: "2026-01", label: "janv.", totalCents: 0 },
    ]);
  });
});
