import { describe, expect, it } from "vitest";
import { buildCreditNotePdfData, buildInvoicePdfData, buildQuotePdfData, legalFooterLines, type InvoicePdfInput } from "./build-data";
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
    operationCategory: "PRESTATION_SERVICES",
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
    const text = [...data.mentions, ...data.footerLines, data.vatMention, data.numberLabel].join("\n");
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
    const text = data.footerLines.join("\n");
    expect(text).toContain("RCS Paris 123 456 789");
    expect(text).toContain("au capital de 1 000,00 €");
  });

  it("recalcule les totaux à partir des lignes", () => {
    expect(buildInvoicePdfData(input()).totals.totalTtcCents).toBe(10000);
  });

  it("indique la catégorie d'opération sur la facture", () => {
    const data = buildInvoicePdfData(input({ operationCategory: "MIXTE" }));
    expect(data.dates).toContainEqual({ label: "Catégorie d'opération", value: "Opération mixte (biens et services)" });
    expect(buildInvoicePdfData(input()).dates).toContainEqual({
      label: "Catégorie d'opération",
      value: "Prestation de services",
    });
  });

  it("expose le nom de l'entreprise pour l'en-tête, y compris sur un brouillon", () => {
    expect(buildInvoicePdfData(input()).sellerName).toBe("Jean Dupont");
    expect(buildInvoicePdfData(input({ isDraft: true })).sellerName).toBe("Jean Dupont");
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
    expect(data.sellerName).toBe("Jean Dupont");
  });
});

describe("formatEurosForPdf", () => {
  it("n'émet aucun espace insécable (absent de la police PDF)", () => {
    expect(formatEurosForPdf(123456789)).not.toMatch(/[  ]/);
    expect(formatEurosForPdf(123456)).toMatch(/1 234,56 €/);
  });
});

describe("buildCreditNotePdfData", () => {
  const data = buildCreditNotePdfData({
    number: "AV-2026-0001",
    issueDate: new Date("2026-02-01"),
    invoiceNumber: "F-2026-0001",
    invoiceDate: new Date("2026-01-10"),
    operationCategory: "LIVRAISON_BIENS",
    reason: "Prestation annulée",
    lines: [line],
    seller: input().seller,
    buyer: input().buyer,
  });

  it("référence la facture rectifiée par son numéro et sa date", () => {
    expect(data.title).toBe("AVOIR");
    expect(data.dates).toContainEqual({ label: "Facture rectifiée", value: "F-2026-0001 du 10/01/2026" });
    expect(data.mentions.join("\n")).toContain("Motif : Prestation annulée");
    expect(data.dates).toContainEqual({ label: "Catégorie d'opération", value: "Livraison de biens" });
    expect(data.sellerName).toBe("Jean Dupont");
  });

  it("n'inclut ni échéance ni pénalités de retard", () => {
    expect(data.dates.map((d) => d.label)).not.toContain("Date d'échéance");
    expect(data.mentions.join("\n")).not.toContain("Pénalités");
  });

  it("porte son propre numéro et un libellé de total dédié", () => {
    expect(data.numberLabel).toBe("N° AV-2026-0001");
    expect(data.totalLabel).toBe("Total TTC de l'avoir");
  });
});

describe("pied de page : mentions légales de l'émetteur", () => {
  const seller = input().seller; // micro-entrepreneur en franchise de TVA

  it("regroupe identité, forme juridique, siège, SIRET et mention de TVA", () => {
    const [identity, registration, vat] = legalFooterLines(seller);
    expect(identity).toBe("Jean Dupont — Entrepreneur individuel (micro-entrepreneur) — Siège : 1 rue de la Paix, 75002 Paris");
    expect(registration).toBe("SIRET 12345678900012");
    expect(vat).toBe("TVA non applicable, art. 293B du CGI");
  });

  it("affiche le numéro de TVA intracommunautaire pour un assujetti", () => {
    const lines = legalFooterLines({ ...seller, vatRegime: "REEL_NORMAL", vatNumber: "FR40552100554" });
    expect(lines.at(-1)).toBe("N° TVA intracommunautaire : FR40552100554");
  });

  it("ajoute le code NAF/APE quand il est renseigné, et seulement alors", () => {
    expect(legalFooterLines(seller)[1]).not.toContain("NAF");
    expect(legalFooterLines({ ...seller, nafCode: "6201Z" })[1]).toBe("SIRET 12345678900012 — Code NAF/APE : 6201Z");
  });

  it("indique le RCS avec la ville du greffe, le capital et la forme d'une société", () => {
    const lines = legalFooterLines({ ...seller, legalName: "ACME", legalForm: "SARL", rcsCity: "Lyon", rcsNumber: "552 100 554", shareCapitalCents: 500000, nafCode: "6201Z" });
    expect(lines[0]).toContain("ACME — SARL au capital de 5 000,00 €");
    expect(lines[1]).toBe("SIRET 12345678900012 — Code NAF/APE : 6201Z — RCS Lyon 552 100 554");
  });

  it("indique le Répertoire des métiers pour un artisan, éventuellement avec le RCS", () => {
    expect(legalFooterLines({ ...seller, legalForm: "EI", rmCity: "Clermont-Ferrand", rmNumber: "552 100 554" })[1]).toBe(
      "SIRET 12345678900012 — RM Clermont-Ferrand 552 100 554"
    );
    expect(legalFooterLines({ ...seller, rcsCity: "Lyon", rcsNumber: "1", rmCity: "Lyon", rmNumber: "2" })[1]).toBe(
      "SIRET 12345678900012 — RCS Lyon 1 — RM Lyon 2"
    );
  });

  it("donne l'adresse complète : complément d'adresse et pays étranger", () => {
    expect(legalFooterLines({ ...seller, addressLine2: "Bâtiment B" })[0]).toContain("1 rue de la Paix, Bâtiment B, 75002 Paris");
    expect(legalFooterLines({ ...seller, country: "Belgique" })[0]).toContain("75002 Paris, Belgique");
  });

  it("n'écrit pas « EI » ou une forme vide quand la forme est « Autre »", () => {
    expect(legalFooterLines({ ...seller, legalForm: "AUTRE" })[0]).toMatch(/^Jean Dupont — Siège :/);
  });

  it("figure sur les factures, devis et avoirs, et plus dans le bloc Émetteur", () => {
    const sel = { ...seller, nafCode: "6201Z" };
    const invoice = buildInvoicePdfData(input({ seller: sel }));
    const quote = buildQuotePdfData({ number: "DEV-1", issueDate: new Date("2026-01-10"), lines: [line], seller: sel, buyer: input().buyer });
    const credit = buildCreditNotePdfData({
      number: "AV-1",
      issueDate: new Date("2026-01-10"),
      invoiceNumber: "F-1",
      invoiceDate: new Date("2026-01-01"),
      operationCategory: "PRESTATION_SERVICES",
      reason: "Erreur",
      lines: [line],
      seller: sel,
      buyer: input().buyer,
    });
    for (const data of [invoice, quote, credit]) {
      expect(data.footerLines).toEqual(legalFooterLines(sel));
      expect(data.footerLines.join("\n")).toContain("SIRET 12345678900012");
      expect(data.sellerLines.join("\n")).not.toContain("SIRET");
    }
  });
});
