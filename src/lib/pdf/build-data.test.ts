import { describe, expect, it } from "vitest";
import { buildInvoicePdfData, buildQuotePdfData, type InvoicePdfInput } from "./build-data";
import { formatEurosForPdf } from "./format";
import { computeLineTotals } from "@/lib/money";

const line = (() => {
  const t = computeLineTotals({ quantity: "2", unitPriceCents: 5000, vatRatePer100000: 0 });
  return { description: "Prestation", quantity: "2", unitPriceCents: 5000, vatRatePer100000: 0, ...t };
})();

function input(overrides: Partial<InvoicePdfInput> = {}): InvoicePdfInput {
  return {
    number: "F-2026-0001",
    isDraft: false,
    issueDate: new Date("2026-01-10"),
    dueDate: new Date("2026-02-09"),
    lines: [line],
    seller: {
      legalName: "Jean Dupont",
      legalForm: "AUTO_ENTREPRENEUR",
      siren: "123456789",
      siret: "12345678900012",
      vatRegime: "FRANCHISE_EN_BASE",
      addressLine1: "1 rue de la Paix",
      postalCode: "75002",
      city: "Paris",
      country: "France",
      email: "jean@example.fr",
      iban: "FR7612345678901234567890123",
    },
    buyer: {
      type: "BUSINESS",
      name: "ACME SAS",
      addressLine1: "2 avenue Foch",
      postalCode: "69001",
      city: "Lyon",
      country: "France",
    },
    latePenaltyRateText: "Taux BCE + 10 points",
    recoveryIndemnityCents: 4000,
    discountPolicyText: "Escompte non applicable",
    ...overrides,
  };
}

describe("buildInvoicePdfData", () => {
  it("contient toutes les mentions obligatoires pour un client professionnel", () => {
    const data = buildInvoicePdfData(input());
    const text = [...data.mentions, ...data.sellerLines, data.vatMention, data.numberLabel].join("\n");
    expect(text).toContain("TVA non applicable, art. 293B du CGI");
    expect(text).toContain("Pénalités de retard : Taux BCE + 10 points");
    expect(text).toContain("40,00 €");
    expect(text).toContain("Escompte non applicable");
    expect(text).toContain("SIRET 12345678900012");
    expect(text).toContain("N° F-2026-0001");
    expect(data.franchise).toBe(true);
  });

  it("omet l'indemnité de 40 € pour un client particulier", () => {
    const data = buildInvoicePdfData(
      input({ buyer: { ...input().buyer, type: "INDIVIDUAL" } })
    );
    expect(data.mentions.join("\n")).not.toContain("recouvrement");
  });

  it("référence le devis d'origine avec son numéro et sa date", () => {
    const data = buildInvoicePdfData(
      input({ originQuoteNumber: "DEV-2026-0003", originQuoteDate: new Date("2025-12-20") })
    );
    expect(data.dates).toContainEqual({ label: "Devis d'origine", value: "DEV-2026-0003 du 20/12/2025" });
  });

  it("affiche la date de prestation uniquement si elle est renseignée", () => {
    expect(buildInvoicePdfData(input()).dates.map((d) => d.label)).not.toContain("Date de la prestation");
    const withService = buildInvoicePdfData(input({ serviceDate: new Date("2026-01-05") }));
    expect(withService.dates.map((d) => d.label)).toContain("Date de la prestation");
  });

  it("marque un brouillon sans numéro légal", () => {
    const data = buildInvoicePdfData(input({ isDraft: true, number: "BROUILLON-abc" }));
    expect(data.numberLabel).toBe("BROUILLON");
    expect(data.isDraft).toBe(true);
  });

  it("indique RCS et capital social quand ils existent", () => {
    const data = buildInvoicePdfData(
      input({
        seller: { ...input().seller, legalForm: "SASU", rcsCity: "Paris", rcsNumber: "123 456 789", shareCapitalCents: 100000 },
      })
    );
    const text = data.sellerLines.join("\n");
    expect(text).toContain("RCS Paris 123 456 789");
    expect(text).toContain("Capital social : 1 000,00 €");
  });

  it("recalcule les totaux à partir des lignes", () => {
    expect(buildInvoicePdfData(input()).totals.totalTtcCents).toBe(10000);
  });
});

describe("buildQuotePdfData", () => {
  it("prévoit la mention d'acceptation et la validité", () => {
    const data = buildQuotePdfData({
      number: "DEV-2026-0001",
      issueDate: new Date("2026-01-10"),
      validUntil: new Date("2026-02-10"),
      lines: [line],
      seller: input().seller,
      buyer: input().buyer,
    });
    expect(data.dates.map((d) => d.label)).toContain("Valable jusqu'au");
    expect(data.mentions.join("\n")).toContain("Bon pour accord");
  });
});

describe("formatEurosForPdf", () => {
  it("n'émet aucun espace insécable (absent de la police PDF)", () => {
    expect(formatEurosForPdf(123456789)).not.toMatch(/[  ]/);
    expect(formatEurosForPdf(123456)).toMatch(/1 234,56 €/);
  });
});
