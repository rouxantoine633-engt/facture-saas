import { describe, expect, it } from "vitest";
import { computeLineTotals } from "@/lib/money";
import type { PaymentRow, SalesDocument } from "./accounting";
import { buildPaymentsReport, buildSalesReport, monthLabel } from "./report";

const line = (qty: string, unit: number, vat: number) => ({ vatRatePer100000: vat, ...computeLineTotals({ quantity: qty, unitPriceCents: unit, vatRatePer100000: vat }) });

function doc(overrides: Partial<SalesDocument> & { number: string }): SalesDocument {
  return { kind: "INVOICE", issueDate: new Date("2026-11-03T10:00:00Z"), clientName: "Client", lines: [line("1", 10000, 20000)], statusLabel: "Envoyée", ...overrides };
}

describe("buildSalesReport", () => {
  const report = buildSalesReport([
    doc({ number: "F-1", lines: [line("1", 10000, 20000), line("2", 5000, 5500)] }), // HT 200, TVA 25,50
    doc({ number: "F-2", issueDate: new Date("2026-11-20T10:00:00Z"), lines: [line("1", 3000, 20000)] }), // HT 30, TVA 6
    doc({ number: "F-3", issueDate: new Date("2026-10-15T10:00:00Z"), lines: [line("1", 8000, 0)] }), // HT 80, TVA 0
    doc({ kind: "CREDIT_NOTE", number: "AV-1", issueDate: new Date("2026-11-25T10:00:00Z"), lines: [line("1", 4000, 20000)] }), // -40 / -8
  ]);

  it("regroupe par mois, en ordre chronologique, avoirs déduits", () => {
    expect(report.months.map((m) => [m.monthKey, m.invoiceCount, m.creditNoteCount, m.htCents, m.vatCents, m.ttcCents])).toEqual([
      ["2026-10", 1, 0, 8000, 0, 8000],
      ["2026-11", 2, 1, 20000 + 3000 - 4000, 2550 + 600 - 800, 22550 + 3600 - 4800],
    ]);
    expect(report.months[1]!.label).toBe("Novembre 2026");
  });

  it("totalise toute la période, et les totaux sont la somme des lignes et des mois", () => {
    expect(report.totals).toEqual({ invoiceCount: 3, creditNoteCount: 1, htCents: 27000, vatCents: 2350, ttcCents: 29350 });
    const sum = (pick: (r: (typeof report.rows)[number]) => number) => report.rows.reduce((s, r) => s + pick(r), 0);
    expect(sum((r) => r.htCents)).toBe(report.totals.htCents);
    expect(sum((r) => r.vatCents)).toBe(report.totals.vatCents);
    expect(sum((r) => r.ttcCents)).toBe(report.totals.ttcCents);
    expect(report.months.reduce((s, m) => s + m.ttcCents, 0)).toBe(report.totals.ttcCents);
  });

  it("ventile la TVA par taux (le plus haut d'abord), avoirs déduits", () => {
    expect(report.vatByRate).toEqual([
      { vatRatePer100000: 20000, baseHtCents: 10000 + 3000 - 4000, vatCents: 2000 + 600 - 800 },
      { vatRatePer100000: 5500, baseHtCents: 10000, vatCents: 550 },
      { vatRatePer100000: 0, baseHtCents: 8000, vatCents: 0 },
    ]);
    expect(report.vatByRate.reduce((s, r) => s + r.vatCents, 0)).toBe(report.totals.vatCents);
  });

  it("exporte les avoirs en négatif dans le détail", () => {
    const credit = report.rows.find((r) => r.number === "AV-1")!;
    expect([credit.htCents, credit.vatCents, credit.ttcCents]).toEqual([-4000, -800, -4800]);
  });

  it("gère une période sans écriture", () => {
    const empty = buildSalesReport([]);
    expect(empty.months).toEqual([]);
    expect(empty.totals).toEqual({ invoiceCount: 0, creditNoteCount: 0, htCents: 0, vatCents: 0, ttcCents: 0 });
  });

  it("ne produit jamais de zéro négatif (avoir à zéro)", () => {
    const r = buildSalesReport([doc({ kind: "CREDIT_NOTE", number: "AV-0", lines: [line("1", 0, 20000)] })]);
    expect(Object.is(r.rows[0]!.htCents, -0)).toBe(false);
    expect(Object.is(r.totals.ttcCents, -0)).toBe(false);
  });
});

describe("buildPaymentsReport", () => {
  const pay = (invoiceNumber: string, date: string, amountCents: number, methodLabel: string): PaymentRow => ({
    paidAt: new Date(`${date}T10:00:00Z`), invoiceNumber, clientName: "Client", amountCents, methodLabel,
  });
  const report = buildPaymentsReport([
    pay("F-1", "2026-10-30", 5000, "Virement"),
    pay("F-1", "2026-11-05", 6000, "Virement"),
    pay("F-2", "2026-11-09", 9550, "Carte bancaire"),
    pay("F-3", "2026-11-12", 1000, "Chèque"),
  ]);

  it("regroupe par mois et totalise", () => {
    expect(report.months.map((m) => [m.monthKey, m.count, m.totalCents])).toEqual([["2026-10", 1, 5000], ["2026-11", 3, 16550]]);
    expect(report.totals).toEqual({ count: 4, totalCents: 21550 });
  });

  it("ventile par moyen de paiement, du plus important au plus petit", () => {
    expect(report.byMethod).toEqual([
      { methodLabel: "Virement", count: 2, totalCents: 11000 },
      { methodLabel: "Carte bancaire", count: 1, totalCents: 9550 },
      { methodLabel: "Chèque", count: 1, totalCents: 1000 },
    ]);
    expect(report.byMethod.reduce((s, m) => s + m.totalCents, 0)).toBe(report.totals.totalCents);
  });
});

describe("monthLabel", () => {
  it("met en forme le mois en français avec une majuscule", () => {
    expect(monthLabel("2026-01")).toBe("Janvier 2026");
    expect(monthLabel("2026-12")).toBe("Décembre 2026");
  });
});
