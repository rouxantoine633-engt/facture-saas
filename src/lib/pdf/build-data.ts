import { summarizeDocument, type DocumentTotals } from "@/lib/money";
import { vatMention, type BuyerSnapshot, type SellerSnapshot } from "@/lib/invoice-compliance";
import { formatDate } from "@/lib/labels";
import { formatEurosForPdf } from "./format";

const LEGAL_FORM_LABELS: Record<string, string> = {
  AUTO_ENTREPRENEUR: "Micro-entrepreneur",
  EI: "Entreprise individuelle",
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
  kind: "INVOICE" | "QUOTE";
  title: string;
  number: string;
  numberLabel: string;
  clientName: string;
  dueDateLabel?: string;
  validUntilLabel?: string;
  isDraft: boolean;
  dates: Array<{ label: string; value: string }>;
  sellerLines: string[];
  buyerLines: string[];
  lines: PdfLine[];
  totals: DocumentTotals;
  franchise: boolean;
  vatMention: string;
  mentions: string[];
  bankLines: string[];
  footerLine: string;
}

function sellerIdentityLines(seller: SellerSnapshot): string[] {
  const form = LEGAL_FORM_LABELS[seller.legalForm];
  const lines = [
    seller.legalName + (form ? ` — ${form}` : ""),
    seller.addressLine1,
    `${seller.postalCode} ${seller.city}`,
    `SIREN ${seller.siren} — SIRET ${seller.siret}`,
  ];
  if (seller.shareCapitalCents != null) lines.push(`Capital social : ${formatEurosForPdf(seller.shareCapitalCents)}`);
  if (seller.rcsNumber) lines.push(`RCS ${seller.rcsCity ?? ""} ${seller.rcsNumber}`.trim());
  lines.push(vatMention(seller));
  lines.push(seller.email);
  return lines;
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
    isDraft: i.isDraft,
    dates,
    sellerLines: sellerIdentityLines(i.seller),
    buyerLines: buyerIdentityLines(i.buyer),
    lines: i.lines,
    totals: summarizeDocument(i.lines),
    franchise: i.seller.vatRegime === "FRANCHISE_EN_BASE",
    vatMention: vatMention(i.seller),
    mentions,
    bankLines: bankLines(i.seller),
    footerLine: `${i.seller.legalName} — SIRET ${i.seller.siret}`,
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
    isDraft: false,
    dates,
    sellerLines: sellerIdentityLines(q.seller),
    buyerLines: buyerIdentityLines(q.buyer),
    lines: q.lines,
    totals: summarizeDocument(q.lines),
    franchise: q.seller.vatRegime === "FRANCHISE_EN_BASE",
    vatMention: vatMention(q.seller),
    mentions,
    bankLines: [],
    footerLine: `${q.seller.legalName} — SIRET ${q.seller.siret}`,
  };
}
