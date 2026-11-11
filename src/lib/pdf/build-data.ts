import { summarizeDocument, type DocumentTotals } from "@/lib/money";
import { vatMention, type BuyerSnapshot, type SellerSnapshot } from "@/lib/invoice-compliance";
import { formatDate } from "@/lib/labels";
import { OPERATION_CATEGORY_LABELS, type OperationCategory } from "@/lib/operation-category";
import { formatEurosForPdf } from "./format";

const LEGAL_FORM_LABELS: Record<string, string> = {
  AUTO_ENTREPRENEUR: "Entrepreneur individuel (micro-entrepreneur)",
  EI: "Entrepreneur individuel",
  EURL: "EURL",
  SARL: "SARL",
  SASU: "SASU",
  SAS: "SAS",
  AUTRE: "",
};

export interface PdfLine {
  description: string;
  quantity: string;
  unitPriceCents: number;
  vatRatePer100000: number;
  lineHtCents: number;
  lineVatCents: number;
  lineTtcCents: number;
}

/** Données normalisées et déjà formatées : le composant PDF ne fait aucune logique métier. */
export interface PdfDocumentData {
  kind: "INVOICE" | "QUOTE" | "CREDIT_NOTE";
  title: string;
  number: string;
  numberLabel: string;
  clientName: string;
  dueDateLabel?: string;
  validUntilLabel?: string;
  rectifiedInvoiceNumber?: string;
  sellerName: string;
  isDraft: boolean;
  dates: Array<{ label: string; value: string }>;
  sellerLines: string[];
  buyerLines: string[];
  lines: PdfLine[];
  totals: DocumentTotals;
  totalLabel: string;
  franchise: boolean;
  vatMention: string;
  mentions: string[];
  bankLines: string[];
  /** Mentions légales de l'émetteur, répétées en pied de chaque page. */
  footerLines: string[];
}

/** Adresse complète sur une ligne ; le pays n'est précisé que s'il n'est pas la France. */
function fullAddress(seller: SellerSnapshot): string {
  const parts = [seller.addressLine1, seller.addressLine2, `${seller.postalCode} ${seller.city}`];
  if (seller.country && !/^france$/i.test(seller.country.trim())) parts.push(seller.country);
  return parts.filter(Boolean).join(", ");
}

/** Bloc « Émetteur » : coordonnées seulement, les mentions légales étant regroupées en pied de page. */
function sellerIdentityLines(seller: SellerSnapshot): string[] {
  const lines = [seller.legalName, seller.addressLine1];
  if (seller.addressLine2) lines.push(seller.addressLine2);
  lines.push(`${seller.postalCode} ${seller.city}`);
  if (seller.country && !/^france$/i.test(seller.country.trim())) lines.push(seller.country);
  lines.push(seller.email);
  return lines;
}

/**
 * Mentions légales obligatoires de l'émetteur, pour le pied de page :
 * identité et forme juridique, adresse du siège, SIRET, code NAF/APE, immatriculation (RCS ou Répertoire
 * des métiers) et régime de TVA.
 */
export function legalFooterLines(seller: SellerSnapshot): string[] {
  const form = LEGAL_FORM_LABELS[seller.legalForm];
  const identity = [seller.legalName + (form ? ` — ${form}` : "")];
  if (seller.shareCapitalCents != null) identity.push(`au capital de ${formatEurosForPdf(seller.shareCapitalCents)}`);
  const line1 = `${identity.join(" ")} — Siège : ${fullAddress(seller)}`;

  const registration = [`SIRET ${seller.siret}`];
  if (seller.nafCode) registration.push(`Code NAF/APE : ${seller.nafCode}`);
  if (seller.rcsNumber) registration.push(`RCS ${seller.rcsCity ?? ""} ${seller.rcsNumber}`.replace(/\s+/g, " ").trim());
  if (seller.rmNumber) registration.push(`RM ${seller.rmCity ?? ""} ${seller.rmNumber}`.replace(/\s+/g, " ").trim());

  return [line1, registration.join(" — "), vatMention(seller)];
}

function buyerIdentityLines(buyer: BuyerSnapshot): string[] {
  const lines = [buyer.name, buyer.addressLine1, `${buyer.postalCode} ${buyer.city}`];
  if (buyer.country && buyer.country !== "France") lines.push(buyer.country);
  if (buyer.siret) lines.push(`SIRET ${buyer.siret}`);
  if (buyer.vatNumber) lines.push(`N° TVA : ${buyer.vatNumber}`);
  return lines;
}

function bankLines(seller: SellerSnapshot): string[] {
  const lines: string[] = [];
  if (seller.iban) lines.push(`IBAN : ${seller.iban}`);
  if (seller.bic) lines.push(`BIC : ${seller.bic}`);
  return lines;
}

export interface InvoicePdfInput {
  number: string;
  isDraft: boolean;
  issueDate: Date;
  serviceDate?: Date | null;
  dueDate: Date;
  operationCategory: OperationCategory;
  originQuoteNumber?: string | null;
  originQuoteDate?: Date | null;
  lines: PdfLine[];
  seller: SellerSnapshot;
  buyer: BuyerSnapshot;
  latePenaltyRateText: string;
  recoveryIndemnityCents: number;
  discountPolicyText: string;
}

export function buildInvoicePdfData(i: InvoicePdfInput): PdfDocumentData {
  const dates = [{ label: "Date d'émission", value: formatDate(i.issueDate) }];
  if (i.serviceDate) dates.push({ label: "Date de la prestation", value: formatDate(i.serviceDate) });
  dates.push({ label: "Date d'échéance", value: formatDate(i.dueDate) });
  dates.push({ label: "Catégorie d'opération", value: OPERATION_CATEGORY_LABELS[i.operationCategory] });
  if (i.originQuoteNumber && i.originQuoteDate) {
    dates.push({ label: "Devis d'origine", value: `${i.originQuoteNumber} du ${formatDate(i.originQuoteDate)}` });
  }

  const mentions = [
    `Conditions de règlement : paiement à réception, au plus tard le ${formatDate(i.dueDate)}.`,
    `Pénalités de retard : ${i.latePenaltyRateText}.`,
  ];
  if (i.buyer.type === "BUSINESS") {
    mentions.push(
      `Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : ${formatEurosForPdf(i.recoveryIndemnityCents)}.`
    );
  }
  mentions.push(`${i.discountPolicyText}.`);

  return {
    kind: "INVOICE",
    title: "FACTURE",
    number: i.number,
    clientName: i.buyer.name,
    dueDateLabel: formatDate(i.dueDate),
    numberLabel: i.isDraft ? "BROUILLON" : `N° ${i.number}`,
    sellerName: i.seller.legalName,
    isDraft: i.isDraft,
    dates,
    sellerLines: sellerIdentityLines(i.seller),
    buyerLines: buyerIdentityLines(i.buyer),
    lines: i.lines,
    totals: summarizeDocument(i.lines),
    totalLabel: "Total TTC",
    franchise: i.seller.vatRegime === "FRANCHISE_EN_BASE",
    vatMention: vatMention(i.seller),
    mentions,
    bankLines: bankLines(i.seller),
    footerLines: legalFooterLines(i.seller),
  };
}

export interface QuotePdfInput {
  number: string;
  issueDate: Date;
  validUntil?: Date | null;
  lines: PdfLine[];
  seller: SellerSnapshot;
  buyer: BuyerSnapshot;
  notes?: string | null;
}

export function buildQuotePdfData(q: QuotePdfInput): PdfDocumentData {
  const dates = [{ label: "Date du devis", value: formatDate(q.issueDate) }];
  if (q.validUntil) dates.push({ label: "Valable jusqu'au", value: formatDate(q.validUntil) });

  const mentions = ["Devis gratuit. Pour acceptation : date, signature précédée de la mention « Bon pour accord »."];
  if (q.notes) mentions.unshift(q.notes);

  return {
    kind: "QUOTE",
    title: "DEVIS",
    number: q.number,
    clientName: q.buyer.name,
    validUntilLabel: q.validUntil ? formatDate(q.validUntil) : undefined,
    numberLabel: `N° ${q.number}`,
    sellerName: q.seller.legalName,
    isDraft: false,
    dates,
    sellerLines: sellerIdentityLines(q.seller),
    buyerLines: buyerIdentityLines(q.buyer),
    lines: q.lines,
    totals: summarizeDocument(q.lines),
    totalLabel: "Total TTC",
    franchise: q.seller.vatRegime === "FRANCHISE_EN_BASE",
    vatMention: vatMention(q.seller),
    mentions,
    bankLines: [],
    footerLines: legalFooterLines(q.seller),
  };
}

export interface CreditNotePdfInput {
  number: string;
  issueDate: Date;
  invoiceNumber: string;
  invoiceDate: Date;
  /** Catégorie d'opération de la facture rectifiée. */
  operationCategory: OperationCategory;
  reason: string;
  lines: PdfLine[];
  seller: SellerSnapshot;
  buyer: BuyerSnapshot;
}

export function buildCreditNotePdfData(c: CreditNotePdfInput): PdfDocumentData {
  return {
    kind: "CREDIT_NOTE",
    title: "AVOIR",
    number: c.number,
    clientName: c.buyer.name,
    rectifiedInvoiceNumber: c.invoiceNumber,
    numberLabel: `N° ${c.number}`,
    sellerName: c.seller.legalName,
    isDraft: false,
    dates: [
      { label: "Date d'émission", value: formatDate(c.issueDate) },
      { label: "Facture rectifiée", value: `${c.invoiceNumber} du ${formatDate(c.invoiceDate)}` },
      { label: "Catégorie d'opération", value: OPERATION_CATEGORY_LABELS[c.operationCategory] },
    ],
    sellerLines: sellerIdentityLines(c.seller),
    buyerLines: buyerIdentityLines(c.buyer),
    lines: c.lines,
    totals: summarizeDocument(c.lines),
    totalLabel: "Total TTC de l'avoir",
    franchise: c.seller.vatRegime === "FRANCHISE_EN_BASE",
    vatMention: vatMention(c.seller),
    mentions: [
      `Motif : ${c.reason}`,
      `Cet avoir vient en déduction de la facture n° ${c.invoiceNumber} du ${formatDate(c.invoiceDate)}.`,
    ],
    bankLines: [],
    footerLines: legalFooterLines(c.seller),
  };
}
