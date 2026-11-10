import { describe, expect, it } from "vitest";
import { computeLineTotals } from "@/lib/money";
import {
  allocatePayment,
  buildEReporting,
  type EReportingDocument,
  type EReportingLine,
  type EReportingPayment,
} from "./aggregate";
import { classifyB2cOperation, isFrance } from "./categories";
import { paymentsCsv, reportJson, transactionsCsv } from "./export";
import { periodPresets } from "./periods";

function line(quantity: string, unitPriceCents: number, vatRatePer100000: number): EReportingLine {
  const t = computeLineTotals({ quantity, unitPriceCents, vatRatePer100000 });
  return { vatRatePer100000, lineHtCents: t.lineHtCents, lineVatCents: t.lineVatCents, lineTtcCents: t.lineTtcCents };
}

function doc(overrides: Partial<EReportingDocument> = {}): EReportingDocument {
  return {
    kind: "INVOICE",
    number: "F-2026-0001",
    issueDate: new Date("2026-11-10T09:30:00Z"),
    buyerType: "INDIVIDUAL",
    buyerCountry: "France",
    vatRegime: "REEL_NORMAL",
    operationCategory: "PRESTATION_SERVICES",
    lines: [line("1", 10000, 20000)],
    ...overrides,
  };
}

describe("classifyB2cOperation", () => {
  it("range selon la nature de l'opération en régime réel", () => {
    expect(classifyB2cOperation({ operationCategory: "LIVRAISON_BIENS", vatRegime: "REEL_NORMAL" })).toEqual({ category: "TLB1" });
    expect(classifyB2cOperation({ operationCategory: "PRESTATION_SERVICES", vatRegime: "REEL_SIMPLIFIE" })).toEqual({ category: "TPS1" });
  });

  it("range la franchise en base en TNT1, quelle que soit la nature", () => {
    expect(classifyB2cOperation({ operationCategory: "LIVRAISON_BIENS", vatRegime: "FRANCHISE_EN_BASE" })).toEqual({ category: "TNT1" });
    expect(classifyB2cOperation({ operationCategory: "PRESTATION_SERVICES", vatRegime: "FRANCHISE_EN_BASE" })).toEqual({ category: "TNT1" });
  });

  it("refuse de classer une opération mixte", () => {
    expect(classifyB2cOperation({ operationCategory: "MIXTE", vatRegime: "REEL_NORMAL" })).toHaveProperty("reason");
  });

  it("reconnaît la France sous ses différentes écritures", () => {
    expect(["France", " france ", "FR", "fr"].every(isFrance)).toBe(true);
    expect(isFrance("Belgique")).toBe(false);
  });
});

describe("buildEReporting — transactions", () => {
  it("agrège par jour, catégorie et taux de TVA", () => {
    const report = buildEReporting(
      [
        doc({ number: "F-1", lines: [line("1", 10000, 20000), line("2", 5000, 5500)] }),
        doc({ number: "F-2", lines: [line("1", 3000, 20000)] }),
        doc({ number: "F-3", operationCategory: "LIVRAISON_BIENS", lines: [line("1", 2000, 20000)] }),
        doc({ number: "F-4", issueDate: new Date("2026-11-11T08:00:00Z"), lines: [line("1", 1000, 20000)] }),
      ],
      []
    );
    const rows = report.transactions.map((r) => [r.date, r.category, r.vatRatePer100000, r.htCents, r.vatCents, r.ttcCents, r.documentCount]);
    expect(rows).toEqual([
      ["2026-11-10", "TLB1", 20000, 2000, 400, 2400, 1],
      ["2026-11-10", "TPS1", 5500, 10000, 550, 10550, 1],
      ["2026-11-10", "TPS1", 20000, 13000, 2600, 15600, 2],
      ["2026-11-11", "TPS1", 20000, 1000, 200, 1200, 1],
    ]);
    expect(report.totals).toMatchObject({ htCents: 26000, vatCents: 3750, ttcCents: 29750 });
    expect(report.dailyCounts).toContainEqual({ date: "2026-11-10", category: "TPS1", invoiceCount: 2, creditNoteCount: 0 });
  });

  it("retranche les avoirs et les compte à part", () => {
    const report = buildEReporting(
      [doc({ number: "F-1", lines: [line("1", 10000, 20000)] }), doc({ kind: "CREDIT_NOTE", number: "AV-1", lines: [line("1", 4000, 20000)] })],
      []
    );
    expect(report.transactions).toHaveLength(1);
    expect(report.transactions[0]).toMatchObject({ htCents: 6000, vatCents: 1200, ttcCents: 7200, documentCount: 2 });
    expect(report.dailyCounts[0]).toMatchObject({ invoiceCount: 1, creditNoteCount: 1 });
  });

  it("utilise le jour UTC de la date d'émission", () => {
    const report = buildEReporting([doc({ issueDate: new Date("2026-11-10T23:59:59Z") }), doc({ number: "F-2", issueDate: new Date("2026-11-11T00:00:00Z") })], []);
    expect(report.transactions.map((r) => r.date)).toEqual(["2026-11-10", "2026-11-11"]);
  });

  it("ignore les clients professionnels", () => {
    const report = buildEReporting([doc({ buyerType: "BUSINESS" })], []);
    expect(report.transactions).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it("signale sans les compter les particuliers hors de France et les opérations mixtes", () => {
    const report = buildEReporting(
      [doc({ number: "F-BE", buyerCountry: "Belgique" }), doc({ number: "F-MIXTE", operationCategory: "MIXTE" }), doc({ number: "F-OK" })],
      []
    );
    expect(report.transactions.map((r) => r.documentCount)).toEqual([1]);
    expect(report.warnings.map((w) => w.document)).toEqual(["F-BE", "F-MIXTE"]);
  });

  it("range une vente en franchise en TNT1 à 0 % de TVA", () => {
    const report = buildEReporting([doc({ vatRegime: "FRANCHISE_EN_BASE", lines: [line("1", 8000, 0)] })], []);
    expect(report.transactions[0]).toMatchObject({ category: "TNT1", vatRatePer100000: 0, htCents: 8000, vatCents: 0, ttcCents: 8000 });
  });
});

describe("allocatePayment", () => {
  it("répartit l'encaissement au prorata du TTC de chaque taux, sans perdre un centime", () => {
    const lines = [line("1", 10000, 20000), line("1", 10000, 5500)]; // TTC 12000 et 10550
    const parts = allocatePayment(10001, lines);
    expect(parts.reduce((s, p) => s + p.ttcCents, 0)).toBe(10001);
    expect(parts.map((p) => p.vatRatePer100000)).toEqual([5500, 20000]);
  });

  it("encaisse la totalité d'une facture : la TVA retrouve celle de la facture", () => {
    const lines = [line("1", 10000, 20000), line("1", 10000, 5500)];
    const total = lines.reduce((s, l) => s + l.lineTtcCents, 0);
    const parts = allocatePayment(total, lines);
    expect(parts.find((p) => p.vatRatePer100000 === 20000)).toMatchObject({ ttcCents: 12000, vatCents: 2000 });
    expect(parts.find((p) => p.vatRatePer100000 === 5500)).toMatchObject({ ttcCents: 10550, vatCents: 550 });
  });

  it("attribue les centimes restants aux plus gros restes", () => {
    const lines = [line("1", 100, 0), line("1", 100, 0), line("1", 100, 0)].map((l, i) => ({ ...l, vatRatePer100000: i * 1000 }));
    const parts = allocatePayment(100, lines);
    expect(parts.reduce((s, p) => s + p.ttcCents, 0)).toBe(100);
  });

  it("ne renvoie rien pour une facture sans montant ou un encaissement nul", () => {
    expect(allocatePayment(0, [line("1", 100, 0)])).toEqual([]);
    expect(allocatePayment(100, [])).toEqual([]);
  });
});

describe("buildEReporting — encaissements", () => {
  function payment(overrides: Partial<EReportingPayment> = {}): EReportingPayment {
    return {
      invoiceNumber: "F-2026-0001",
      paidAt: new Date("2026-11-20T10:00:00Z"),
      amountCents: 6000,
      buyerType: "INDIVIDUAL",
      buyerCountry: "France",
      vatRegime: "REEL_NORMAL",
      operationCategory: "PRESTATION_SERVICES",
      invoiceLines: [line("1", 10000, 20000)],
      ...overrides,
    };
  }

  it("déclare les encaissements de prestations à la date d'encaissement, TVA incluse", () => {
    const report = buildEReporting([], [payment(), payment({ amountCents: 6000, paidAt: new Date("2026-11-20T18:00:00Z") })]);
    expect(report.payments).toEqual([{ date: "2026-11-20", category: "TPS1", vatRatePer100000: 20000, ttcCents: 12000, vatCents: 2000 }]);
    expect(report.totals).toMatchObject({ paymentsTtcCents: 12000, paymentsVatCents: 2000 });
  });

  it("ne déclare pas d'encaissement pour une livraison de biens ni pour un professionnel", () => {
    const report = buildEReporting([], [payment({ operationCategory: "LIVRAISON_BIENS" }), payment({ buyerType: "BUSINESS" })]);
    expect(report.payments).toEqual([]);
  });
});

describe("exports", () => {
  const report = buildEReporting(
    [doc({ lines: [line("1", 10000, 20000)] })],
    [{ invoiceNumber: "F-1", paidAt: new Date("2026-11-12T00:00:00Z"), amountCents: 12000, buyerType: "INDIVIDUAL", buyerCountry: "France", vatRegime: "REEL_NORMAL", operationCategory: "PRESTATION_SERVICES", invoiceLines: [line("1", 10000, 20000)] }]
  );

  it("produit des CSV au format français", () => {
    expect(transactionsCsv(report)).toContain("2026-11-10;TPS1;20 %;100,00;20,00;120,00;1");
    expect(paymentsCsv(report)).toContain("2026-11-12;TPS1;20 %;120,00;20,00");
  });

  it("produit un JSON explicitement préparatoire, montants en centimes", () => {
    const json = JSON.parse(reportJson(report, { from: "2026-11-01", to: "2026-11-30" }));
    expect(json.format).toBe("onyx-ereporting-preparatoire-v1");
    expect(json.avertissement).toContain("n'est pas un flux officiel");
    expect(json.transactions[0]).toMatchObject({ categorie: "TPS1", tauxTvaPourCent: 20, totalHtCents: 10000, totalTvaCents: 2000 });
    expect(json.encaissements[0]).toMatchObject({ encaisseTtcCents: 12000, dontTvaCents: 2000 });
  });
});

describe("periodPresets", () => {
  it("propose le mois, le mois précédent et les trois tranches de 10 jours", () => {
    const presets = periodPresets(new Date("2026-11-10T12:00:00Z"));
    expect(presets.map((p) => [p.from, p.to])).toEqual([
      ["2026-11-01", "2026-11-30"],
      ["2026-10-01", "2026-10-31"],
      ["2026-11-01", "2026-11-10"],
      ["2026-11-11", "2026-11-20"],
      ["2026-11-21", "2026-11-30"],
    ]);
  });

  it("gère janvier (mois précédent en décembre) et février bissextile", () => {
    expect(periodPresets(new Date("2027-01-05T00:00:00Z"))[1]).toMatchObject({ from: "2026-12-01", to: "2026-12-31" });
    expect(periodPresets(new Date("2028-02-15T00:00:00Z"))[0]).toMatchObject({ from: "2028-02-01", to: "2028-02-29" });
  });
});
