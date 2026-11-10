import { describe, expect, it } from "vitest";
import { computeLineTotals, summarizeDocument } from "@/lib/money";
import { buildCiiXml, FacturXError, type FacturXInput } from "./cii";

const seller = {
  legalName: "Entreprise Démo & Associés",
  legalForm: "SARL",
  siren: "552100554",
  siret: "55210055400013",
  vatRegime: "REEL_SIMPLIFIE" as const,
  vatNumber: "FR 40 552100554",
  addressLine1: "12 rue de la Démo",
  postalCode: "75001",
  city: "Paris",
  country: "France",
  email: "contact@demo.example",
  iban: "FR76 3000 6000 0112 3456 7890 189",
  bic: "AGRIFRPP",
};

const buyer = {
  type: "BUSINESS" as const,
  name: "Atelier Bois & Fer SAS",
  addressLine1: "27 quai des Forges",
  postalCode: "69002",
  city: "Lyon",
  country: "France",
  siret: "44455566600027",
  vatNumber: "FR44455566600",
};

function line(description: string, quantity: string, unitPriceCents: number, vatRatePer100000: number) {
  return { description, quantity, unitPriceCents, vatRatePer100000, ...computeLineTotals({ quantity, unitPriceCents, vatRatePer100000 }) };
}

function input(overrides: Partial<FacturXInput> = {}): FacturXInput {
  const lines = [line("Conception du site", "3", 45000, 20000), line("Hébergement", "1", 24000, 5500)];
  return {
    kind: "INVOICE",
    number: "F-2026-0001",
    issueDate: new Date("2026-11-10T09:30:00Z"),
    dueDate: new Date("2026-12-10T00:00:00Z"),
    operationCategory: "PRESTATION_SERVICES",
    seller,
    buyer,
    lines,
    totals: summarizeDocument(lines),
    settlement: { latePenaltyText: "Taux BCE + 10 points", recoveryIndemnityCents: 4000, discountText: "Escompte non applicable" },
    ...overrides,
  };
}

describe("buildCiiXml", () => {
  it("décrit une facture de services avec TVA multi-taux", () => {
    const xml = buildCiiXml(input());
    expect(xml).toContain("<ram:ID>S1</ram:ID>"); // cadre de facturation : services
    expect(xml).toContain("urn:cen.eu:en16931:2017");
    expect(xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
    expect(xml).toContain('<udt:DateTimeString format="102">20261110</udt:DateTimeString>');
    expect(xml).toContain('<ram:ID schemeID="0002">552100554</ram:ID>'); // SIREN vendeur
    expect(xml).toContain('<ram:ID schemeID="0002">444555666</ram:ID>'); // SIREN acheteur dérivé du SIRET
    expect(xml).toContain('<ram:URIID schemeID="0225">444555666</ram:URIID>');
    expect(xml).toContain('<ram:ID schemeID="VA">FR40552100554</ram:ID>'); // espaces retirés
    expect(xml).toContain("<ram:BasisAmount>1350.00</ram:BasisAmount>");
    expect(xml).toContain("<ram:CalculatedAmount>270.00</ram:CalculatedAmount>");
    expect(xml).toContain("<ram:RateApplicablePercent>5.50</ram:RateApplicablePercent>");
    expect(xml).toContain("<ram:GrandTotalAmount>1873.20</ram:GrandTotalAmount>");
    expect(xml).toContain("<ram:IBANID>FR7630006000011234567890189</ram:IBANID>");
    expect(xml).toContain('<udt:DateTimeString format="102">20261210</udt:DateTimeString>');
  });

  it("reprend les mentions légales de règlement dans les notes réglementaires", () => {
    const xml = buildCiiXml(input());
    expect(xml).toMatch(/Pénalités de retard : Taux BCE \+ 10 points\.<\/ram:Content><ram:SubjectCode>PMD/);
    expect(xml).toMatch(/recouvrement en cas de retard de paiement : 40,00 €\.<\/ram:Content><ram:SubjectCode>PMT/);
    expect(xml).toMatch(/Escompte non applicable\.<\/ram:Content><ram:SubjectCode>AAB/);
    expect(xml).toMatch(/<ram:Content>B2B<\/ram:Content><ram:SubjectCode>BAR/);
  });

  it("traduit la catégorie d'opération en cadre de facturation", () => {
    expect(buildCiiXml(input({ operationCategory: "LIVRAISON_BIENS" }))).toContain("<ram:ID>B1</ram:ID>");
    expect(buildCiiXml(input({ operationCategory: "MIXTE" }))).toContain("<ram:ID>M1</ram:ID>");
  });

  it("exprime la franchise en base par la catégorie exonéré, le code français et le SIREN comme identifiant fiscal", () => {
    const lines = [line("Mission", "2", 15000, 0)];
    const xml = buildCiiXml(input({ seller: { ...seller, vatRegime: "FRANCHISE_EN_BASE", vatNumber: null }, lines, totals: summarizeDocument(lines) }));
    expect(xml).toContain("<ram:CategoryCode>E</ram:CategoryCode>");
    expect(xml).toContain("<ram:ExemptionReasonCode>VATEX-FR-FRANCHISE</ram:ExemptionReasonCode>");
    expect(xml).toContain("TVA non applicable, art. 293 B du CGI");
    const sellerXml = xml.slice(xml.indexOf("<ram:SellerTradeParty>"), xml.indexOf("</ram:SellerTradeParty>"));
    expect(sellerXml).toContain('<ram:ID schemeID="FC">552100554</ram:ID>');
    expect(sellerXml).not.toContain('schemeID="VA"'); // pas de n° de TVA en franchise
  });

  it("produit un avoir (381) qui référence la facture rectifiée, sans échéance", () => {
    const xml = buildCiiXml(
      input({
        kind: "CREDIT_NOTE",
        number: "AV-2026-0001",
        dueDate: undefined,
        rectifiedInvoice: { number: "F-2026-0001", issueDate: new Date("2026-11-10T09:30:00Z") },
      })
    );
    expect(xml).toContain("<ram:TypeCode>381</ram:TypeCode>");
    expect(xml).toContain("<ram:IssuerAssignedID>F-2026-0001</ram:IssuerAssignedID>");
    expect(xml).not.toContain("DueDateDateTime");
  });

  it("échappe les caractères spéciaux XML", () => {
    const lines = [line('Pose de <cloison> "premium" & finitions', "1.50", 1010, 5500)];
    const xml = buildCiiXml(input({ lines, totals: summarizeDocument(lines) }));
    expect(xml).toContain("Pose de &lt;cloison&gt; &quot;premium&quot; &amp; finitions");
    expect(xml).toContain("Atelier Bois &amp; Fer SAS");
    expect(xml).toContain('<ram:BilledQuantity unitCode="C62">1.5</ram:BilledQuantity>');
  });

  it("refuse un client particulier : les ventes aux particuliers relèvent du e-reporting", () => {
    expect(() => buildCiiXml(input({ buyer: { ...buyer, type: "INDIVIDUAL", siret: null } }))).toThrow(FacturXError);
  });

  it("refuse un client professionnel sans SIRET valide", () => {
    expect(() => buildCiiXml(input({ buyer: { ...buyer, siret: null } }))).toThrow(/SIRET/);
    expect(() => buildCiiXml(input({ buyer: { ...buyer, siret: "123" } }))).toThrow(FacturXError);
  });

  it("refuse un pays autre que la France, que la mise en forme actuelle ne sait pas coder", () => {
    expect(() => buildCiiXml(input({ buyer: { ...buyer, country: "Belgique" } }))).toThrow(/Pays/);
  });
});
