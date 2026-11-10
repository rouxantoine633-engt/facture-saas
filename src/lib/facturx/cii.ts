import type { DocumentTotals } from "@/lib/money";
import type { BuyerSnapshot, SellerSnapshot } from "@/lib/invoice-compliance";
import { BILLING_FRAMEWORK_CODES, type OperationCategory } from "@/lib/operation-category";

/** Nom imposé par la norme pour le XML embarqué dans le PDF. */
export const FACTURX_FILENAME = "factur-x.xml";

/** Identifiant de profil EN 16931 (BT-24). */
const EN16931_GUIDELINE = "urn:cen.eu:en16931:2017";

/** Texte réglementaire de la franchise en base (BT-120) et code d'exonération (BT-121). */
const FRANCHISE_REASON = "TVA non applicable, art. 293 B du CGI";
const FRANCHISE_REASON_CODE = "VATEX-FR-FRANCHISE";

export class FacturXError extends Error {}

export interface FacturXLine {
  description: string;
  quantity: string;
  unitPriceCents: number;
  vatRatePer100000: number;
  lineHtCents: number;
}

export interface FacturXInput {
  kind: "INVOICE" | "CREDIT_NOTE";
  number: string;
  issueDate: Date;
  /** Absente sur un avoir. */
  dueDate?: Date;
  serviceDate?: Date | null;
  operationCategory: OperationCategory;
  seller: SellerSnapshot;
  buyer: BuyerSnapshot;
  lines: FacturXLine[];
  totals: DocumentTotals;
  /** Mentions de règlement figées sur la facture (reprises à l'identique du PDF). */
  settlement: {
    latePenaltyText: string;
    recoveryIndemnityCents: number;
    discountText: string;
    paymentTermsText?: string;
  };
  /** Facture rectifiée, pour un avoir. */
  rectifiedInvoice?: { number: string; issueDate: Date };
}

function esc(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Centimes entiers → « 123.45 » (point décimal, deux décimales), sans passer par un flottant. */
function amount(cents: number): string {
  if (!Number.isInteger(cents)) throw new FacturXError("Montant invalide (centimes attendus).");
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Date au format 102 (AAAAMMJJ), en UTC comme le reste de l'application. */
function date102(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function dateElement(tag: string, date: Date, ns: "udt" | "qdt" = "udt"): string {
  return `<${tag}><${ns}:DateTimeString format="102">${date102(date)}</${ns}:DateTimeString></${tag}>`;
}

function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(date);
}

function quantity(raw: string): string {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new FacturXError(`Quantité invalide : « ${raw} ».`);
  return normalized.includes(".") ? normalized.replace(/0+$/, "").replace(/\.$/, "") : normalized;
}

function percent(ratePer100000: number): string {
  return (ratePer100000 / 1000).toFixed(2);
}

function countryCode(country: string): string {
  const normalized = country.trim();
  if (/^france$/i.test(normalized) || normalized === "FR") return "FR";
  throw new FacturXError(`Pays non pris en charge pour la facture électronique : « ${country} ».`);
}

function sirenOf(siret: string | null | undefined): string | null {
  return siret && /^\d{14}$/.test(siret) ? siret.slice(0, 9) : null;
}

function address(a: { addressLine1: string; postalCode: string; city: string; country: string }): string {
  return (
    `<ram:PostalTradeAddress>` +
    `<ram:PostcodeCode>${esc(a.postalCode)}</ram:PostcodeCode>` +
    `<ram:LineOne>${esc(a.addressLine1)}</ram:LineOne>` +
    `<ram:CityName>${esc(a.city)}</ram:CityName>` +
    `<ram:CountryID>${countryCode(a.country)}</ram:CountryID>` +
    `</ram:PostalTradeAddress>`
  );
}

function vatRegistration(vatNumber: string | null | undefined): string {
  const value = vatNumber?.replace(/\s+/g, "");
  return value ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(value)}</ram:ID></ram:SpecifiedTaxRegistration>` : "";
}

function sellerParty(seller: SellerSnapshot): string {
  if (!/^\d{9}$/.test(seller.siren)) throw new FacturXError("SIREN du vendeur invalide.");
  // Un vendeur en franchise n'a pas de numéro de TVA, mais la catégorie « exonéré » exige un
  // identifiant fiscal du vendeur (règle BR-E-02) : on utilise son SIREN, avec le schéma « FC ».
  const vat =
    seller.vatRegime === "FRANCHISE_EN_BASE"
      ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${seller.siren}</ram:ID></ram:SpecifiedTaxRegistration>`
      : vatRegistration(seller.vatNumber);
  return (
    `<ram:SellerTradeParty>` +
    `<ram:Name>${esc(seller.legalName)}</ram:Name>` +
    `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${seller.siren}</ram:ID></ram:SpecifiedLegalOrganization>` +
    address(seller) +
    `<ram:URIUniversalCommunication><ram:URIID schemeID="0225">${seller.siren}</ram:URIID></ram:URIUniversalCommunication>` +
    vat +
    `</ram:SellerTradeParty>`
  );
}

function buyerParty(buyer: BuyerSnapshot): string {
  const siren = sirenOf(buyer.siret);
  if (!siren) throw new FacturXError("SIRET du client professionnel manquant ou invalide.");
  return (
    `<ram:BuyerTradeParty>` +
    `<ram:Name>${esc(buyer.name)}</ram:Name>` +
    `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${siren}</ram:ID></ram:SpecifiedLegalOrganization>` +
    address(buyer) +
    `<ram:URIUniversalCommunication><ram:URIID schemeID="0225">${siren}</ram:URIID></ram:URIUniversalCommunication>` +
    vatRegistration(buyer.vatNumber) +
    `</ram:BuyerTradeParty>`
  );
}

type VatCategory = "S" | "E" | "Z";

function vatCategory(ratePer100000: number, franchise: boolean): VatCategory {
  if (ratePer100000 > 0) return "S";
  return franchise ? "E" : "Z";
}

function lineTax(ratePer100000: number, franchise: boolean): string {
  const category = vatCategory(ratePer100000, franchise);
  return (
    `<ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${category}</ram:CategoryCode>` +
    `<ram:RateApplicablePercent>${percent(ratePer100000)}</ram:RateApplicablePercent>` +
    `</ram:ApplicableTradeTax>`
  );
}

function note(content: string, subjectCode: string): string {
  return `<ram:IncludedNote><ram:Content>${esc(content)}</ram:Content><ram:SubjectCode>${subjectCode}</ram:SubjectCode></ram:IncludedNote>`;
}

function euros(cents: number): string {
  return amount(cents).replace(".", ",") + " €";
}

export function buildCiiXml(input: FacturXInput): string {
  const { seller, buyer, totals, settlement } = input;
  const franchise = seller.vatRegime === "FRANCHISE_EN_BASE";
  // Les ventes aux particuliers relèvent du e-reporting, pas de la facture électronique entre
  // professionnels : les règles françaises exigent l'adresse électronique (SIREN) de l'acheteur.
  if (buyer.type !== "BUSINESS") {
    throw new FacturXError("La facture électronique (Factur-X) ne concerne que les clients professionnels.");
  }
  if (input.lines.length === 0) throw new FacturXError("Une facture électronique doit comporter au moins une ligne.");

  const notes = [
    note("B2B", "BAR"),
    note(`Pénalités de retard : ${settlement.latePenaltyText}.`, "PMD"),
    note(
      `Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : ${euros(settlement.recoveryIndemnityCents)}.`,
      "PMT"
    ),
    note(`${settlement.discountText}.`, "AAB"),
  ].join("");

  const lines = input.lines
    .map(
      (l, i) =>
        `<ram:IncludedSupplyChainTradeLineItem>` +
        `<ram:AssociatedDocumentLineDocument><ram:LineID>${i + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>` +
        `<ram:SpecifiedTradeProduct><ram:Name>${esc(l.description)}</ram:Name></ram:SpecifiedTradeProduct>` +
        `<ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>${amount(l.unitPriceCents)}</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>` +
        `<ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">${quantity(l.quantity)}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>` +
        `<ram:SpecifiedLineTradeSettlement>${lineTax(l.vatRatePer100000, franchise)}` +
        `<ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${amount(l.lineHtCents)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>` +
        `</ram:SpecifiedLineTradeSettlement>` +
        `</ram:IncludedSupplyChainTradeLineItem>`
    )
    .join("");

  const delivery = input.serviceDate
    ? `<ram:ApplicableHeaderTradeDelivery><ram:ActualDeliverySupplyChainEvent>${dateElement("ram:OccurrenceDateTime", input.serviceDate)}</ram:ActualDeliverySupplyChainEvent></ram:ApplicableHeaderTradeDelivery>`
    : `<ram:ApplicableHeaderTradeDelivery/>`;

  const paymentMeans = seller.iban
    ? `<ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>30</ram:TypeCode>` +
      `<ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${esc(seller.iban.replace(/\s+/g, ""))}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount>` +
      (seller.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${esc(seller.bic.replace(/\s+/g, ""))}</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>` : "") +
      `</ram:SpecifiedTradeSettlementPaymentMeans>`
    : "";

  const taxBreakdown = totals.vatBreakdown
    .map((b) => {
      const category = vatCategory(b.vatRatePer100000, franchise);
      return (
        `<ram:ApplicableTradeTax>` +
        `<ram:CalculatedAmount>${amount(b.vatCents)}</ram:CalculatedAmount>` +
        `<ram:TypeCode>VAT</ram:TypeCode>` +
        (category === "E" ? `<ram:ExemptionReason>${esc(FRANCHISE_REASON)}</ram:ExemptionReason>` : "") +
        `<ram:BasisAmount>${amount(b.baseHtCents)}</ram:BasisAmount>` +
        `<ram:CategoryCode>${category}</ram:CategoryCode>` +
        (category === "E" ? `<ram:ExemptionReasonCode>${FRANCHISE_REASON_CODE}</ram:ExemptionReasonCode>` : "") +
        `<ram:RateApplicablePercent>${percent(b.vatRatePer100000)}</ram:RateApplicablePercent>` +
        `</ram:ApplicableTradeTax>`
      );
    })
    .join("");

  const paymentTerms = input.dueDate
    ? `<ram:SpecifiedTradePaymentTerms>` +
      `<ram:Description>${esc(settlement.paymentTermsText ?? `Paiement à réception, au plus tard le ${formatDateFr(input.dueDate)}`)}</ram:Description>` +
      dateElement("ram:DueDateDateTime", input.dueDate) +
      `</ram:SpecifiedTradePaymentTerms>`
    : "";

  const rectified = input.rectifiedInvoice
    ? `<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>${esc(input.rectifiedInvoice.number)}</ram:IssuerAssignedID>` +
      dateElement("ram:FormattedIssueDateTime", input.rectifiedInvoice.issueDate, "qdt") +
      `</ram:InvoiceReferencedDocument>`
    : "";

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rsm:CrossIndustryInvoice` +
    ` xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"` +
    ` xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"` +
    ` xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"` +
    ` xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"` +
    ` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
    `<rsm:ExchangedDocumentContext>` +
    `<ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>${BILLING_FRAMEWORK_CODES[input.operationCategory]}</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>` +
    `<ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>${EN16931_GUIDELINE}</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>` +
    `</rsm:ExchangedDocumentContext>` +
    `<rsm:ExchangedDocument>` +
    `<ram:ID>${esc(input.number)}</ram:ID>` +
    `<ram:TypeCode>${input.kind === "CREDIT_NOTE" ? "381" : "380"}</ram:TypeCode>` +
    dateElement("ram:IssueDateTime", input.issueDate) +
    notes +
    `</rsm:ExchangedDocument>` +
    `<rsm:SupplyChainTradeTransaction>` +
    lines +
    `<ram:ApplicableHeaderTradeAgreement>${sellerParty(seller)}${buyerParty(buyer)}</ram:ApplicableHeaderTradeAgreement>` +
    delivery +
    `<ram:ApplicableHeaderTradeSettlement>` +
    `<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>` +
    paymentMeans +
    taxBreakdown +
    paymentTerms +
    `<ram:SpecifiedTradeSettlementHeaderMonetarySummation>` +
    `<ram:LineTotalAmount>${amount(totals.subtotalHtCents)}</ram:LineTotalAmount>` +
    `<ram:TaxBasisTotalAmount>${amount(totals.subtotalHtCents)}</ram:TaxBasisTotalAmount>` +
    `<ram:TaxTotalAmount currencyID="EUR">${amount(totals.totalVatCents)}</ram:TaxTotalAmount>` +
    `<ram:GrandTotalAmount>${amount(totals.totalTtcCents)}</ram:GrandTotalAmount>` +
    `<ram:DuePayableAmount>${amount(totals.totalTtcCents)}</ram:DuePayableAmount>` +
    `</ram:SpecifiedTradeSettlementHeaderMonetarySummation>` +
    rectified +
    `</ram:ApplicableHeaderTradeSettlement>` +
    `</rsm:SupplyChainTradeTransaction>` +
    `</rsm:CrossIndustryInvoice>\n`
  );
}
