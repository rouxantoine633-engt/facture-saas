import { describe, expect, it } from "vitest";
import { csvAmount, csvText, toCsv } from "./csv";
import { buildPaymentsJournal, buildSalesJournal, SALES_HEADER, type SalesDocument } from "./accounting";
import { computeLineTotals, FRENCH_VAT_RATES } from "@/lib/money";

const line = (price: number, rate: number) => ({
  ...computeLineTotals({ quantity: "1", unitPriceCents: price, vatRatePer100000: rate }),
  vatRatePer100000: rate,
});

describe("csvAmount", () => {
  it("formate avec virgule décimale et sans séparateur de milliers", () => {
    expect(csvAmount(123456)).toBe("1234,56");
    expect(csvAmount(5)).toBe("0,05");
    expect(csvAmount(0)).toBe("0,00");
  });
  it("gère les montants négatifs", () => {
    expect(csvAmount(-1250)).toBe("-12,50");
    expect(csvAmount(-5)).toBe("-0,05");
  });
  it("rejette un non-entier", () => {
    expect(() => csvAmount(1.5)).toThrow();
  });
});

describe("csvText", () => {
  it("neutralise l'injection de formule", () => {
    expect(csvText("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csvText("+33 1 23")).toBe("'+33 1 23");
    expect(csvText("@cmd")).toBe("'@cmd");
    expect(csvText("-1+1")).toBe("'-1+1");
  });
  it("protège les séparateurs, guillemets et retours à la ligne", () => {
    expect(csvText("Dupont; Fils")).toBe("\"Dupont; Fils\"");
    expect(csvText("Ligne 1\nLigne 2")).toBe("Ligne 1 Ligne 2");
    expect(csvText('Le "Bon" Coin;')).toBe('"Le ""Bon"" Coin;"');
  });
  it("gère les valeurs absentes", () => {
    expect(csvText(null)).toBe("");
    expect(csvText(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  it("préfixe un BOM UTF-8 et termine les lignes en CRLF", () => {
    const csv = toCsv([["a", "b"], ["c", "d"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿a;b\r\nc;d\r\n");
  });
});

describe("buildSalesJournal", () => {
  const invoice: SalesDocument = {
    kind: "INVOICE",
    number: "F-2026-0001",
    issueDate: new Date("2026-01-10"),
    dueDate: new Date("2026-02-09"),
    clientName: "ACME SAS",
    clientSiret: "12345678900012",
    lines: [line(10000, FRENCH_VAT_RATES.NORMAL), line(10000, FRENCH_VAT_RATES.REDUIT)],
    statusLabel: "Payée",
    paidCents: 22550,
    lastPaymentDate: new Date("2026-02-01"),
  };

  it("génère une ligne par document avec ventilation par taux", () => {
    const [header, row] = buildSalesJournal([invoice]);
    expect(header).toEqual(SALES_HEADER);
    expect(row).toHaveLength(header!.length);
    const col = (name: string) => row![header!.indexOf(name)];
    expect(col("Total HT")).toBe("200,00");
    expect(col("Total TVA")).toBe("25,50");
    expect(col("Total TTC")).toBe("225,50");
    expect(col("HT 20 %")).toBe("100,00");
    expect(col("TVA 20 %")).toBe("20,00");
    expect(col("HT 5,5 %")).toBe("100,00");
    expect(col("TVA 5,5 %")).toBe("5,50");
    expect(col("HT 10 %")).toBe("");
    expect(col("Montant payé")).toBe("225,50");
    expect(col("Date du dernier paiement")).toBe("01/02/2026");
  });

  it("exporte les avoirs en montants négatifs avec la facture rectifiée", () => {
    const credit: SalesDocument = {
      kind: "CREDIT_NOTE",
      number: "AV-2026-0001",
      issueDate: new Date("2026-02-15"),
      clientName: "ACME SAS",
      lines: [line(5000, FRENCH_VAT_RATES.NORMAL)],
      statusLabel: "",
      rectifiedInvoiceNumber: "F-2026-0001",
    };
    const [header, row] = buildSalesJournal([credit]);
    const col = (name: string) => row![header!.indexOf(name)];
    expect(col("Type")).toBe("Avoir");
    expect(col("Total HT")).toBe("-50,00");
    expect(col("Total TVA")).toBe("-10,00");
    expect(col("Total TTC")).toBe("-60,00");
    expect(col("HT 20 %")).toBe("-50,00");
    expect(col("Facture rectifiée")).toBe("F-2026-0001");
    expect(col("Montant payé")).toBe("");
  });

  it("ne produit pas de « -0,00 » pour un montant nul dans un avoir", () => {
    const credit: SalesDocument = {
      kind: "CREDIT_NOTE",
      number: "AV-1",
      issueDate: new Date("2026-02-15"),
      clientName: "X",
      lines: [line(1000, FRENCH_VAT_RATES.EXONERE)],
      statusLabel: "",
    };
    const [header, row] = buildSalesJournal([credit]);
    expect(row![header!.indexOf("Total TVA")]).toBe("0,00");
  });

  it("neutralise un nom de client malveillant", () => {
    const [header, row] = buildSalesJournal([{ ...invoice, clientName: "=cmd|' /C calc'!A0" }]);
    expect(row![header!.indexOf("Client")].startsWith("'=")).toBe(true);
  });
});

describe("buildPaymentsJournal", () => {
  it("liste les paiements avec référence sécurisée", () => {
    const rows = buildPaymentsJournal([
      { paidAt: new Date("2026-02-01"), invoiceNumber: "F-2026-0001", clientName: "ACME", amountCents: 22550, methodLabel: "Virement", reference: "+123" },
    ]);
    expect(rows[1]).toEqual(["01/02/2026", "F-2026-0001", "ACME", "225,50", "Virement", "'+123"]);
  });
});
