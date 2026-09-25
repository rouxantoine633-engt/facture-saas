import { describe, expect, it } from "vitest";
import {
  FRANCHISE_VAT_MENTION,
  validateInvoiceForEmission,
  vatMention,
  type ComplianceInput,
} from "./invoice-compliance";

function valid(): ComplianceInput {
  return {
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
    },
    buyer: {
      type: "BUSINESS",
      name: "ACME SAS",
      addressLine1: "2 avenue Foch",
      postalCode: "69001",
      city: "Lyon",
      country: "France",
    },
    issueDate: new Date("2026-01-10"),
    dueDate: new Date("2026-02-09"),
    lines: [{ description: "Prestation", quantity: 1, unitPriceCents: 10000, vatRatePer100000: 0 }],
    latePenaltyRateText: "Taux BCE + 10 points",
    recoveryIndemnityCents: 4000,
    discountPolicyText: "Escompte non applicable",
  };
}

describe("validateInvoiceForEmission", () => {
  it("accepte une facture complète", () => {
    expect(validateInvoiceForEmission(valid())).toEqual([]);
  });

  it("refuse une franchise en base avec TVA sur une ligne", () => {
    const input = valid();
    input.lines[0]!.vatRatePer100000 = 20000;
    expect(validateInvoiceForEmission(input)).toHaveLength(1);
  });

  it("exige le n° de TVA hors franchise", () => {
    const input = valid();
    input.seller.vatRegime = "REEL_NORMAL";
    expect(validateInvoiceForEmission(input).join(" ")).toContain("TVA intracommunautaire");
  });

  it("exige le RCS pour une SASU", () => {
    const input = valid();
    input.seller.legalForm = "SASU";
    expect(validateInvoiceForEmission(input).join(" ")).toContain("RCS");
  });

  it("refuse une facture sans ligne", () => {
    const input = valid();
    input.lines = [];
    expect(validateInvoiceForEmission(input)).toContain("Ajoutez au moins une ligne à la facture.");
  });

  it("refuse une échéance antérieure à l'émission", () => {
    const input = valid();
    input.dueDate = new Date("2026-01-01");
    expect(validateInvoiceForEmission(input)).toHaveLength(1);
  });

  it("exige l'indemnité de 40 € entre professionnels uniquement", () => {
    const input = valid();
    input.recoveryIndemnityCents = 0;
    expect(validateInvoiceForEmission(input)).toHaveLength(1);
    input.buyer.type = "INDIVIDUAL";
    expect(validateInvoiceForEmission(input)).toEqual([]);
  });

  it("exige les mentions pénalités et escompte", () => {
    const input = valid();
    input.latePenaltyRateText = "";
    input.discountPolicyText = " ";
    expect(validateInvoiceForEmission(input)).toHaveLength(2);
  });
});

describe("vatMention", () => {
  it("renvoie la mention 293B en franchise", () => {
    expect(vatMention({ vatRegime: "FRANCHISE_EN_BASE" })).toBe(FRANCHISE_VAT_MENTION);
  });
  it("renvoie le n° de TVA sinon", () => {
    expect(vatMention({ vatRegime: "REEL_NORMAL", vatNumber: "FR12345678901" })).toContain("FR12345678901");
  });
});
