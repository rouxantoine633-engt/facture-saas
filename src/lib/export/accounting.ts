import { FRENCH_VAT_RATES, summarizeDocument, type ComputedLine } from "@/lib/money";
import { formatDate } from "@/lib/labels";
import { csvAmount, csvText } from "./csv";

const BREAKDOWN_RATES = [
  FRENCH_VAT_RATES.NORMAL,
  FRENCH_VAT_RATES.INTERMEDIAIRE,
  FRENCH_VAT_RATES.REDUIT,
  FRENCH_VAT_RATES.PARTICULIER,
  FRENCH_VAT_RATES.EXONERE,
];

function rateLabel(ratePer100000: number): string {
  return `${(ratePer100000 / 1000).toLocaleString("fr-FR")} %`;
}

export interface SalesDocument {
  kind: "INVOICE" | "CREDIT_NOTE";
  number: string;
  issueDate: Date;
  dueDate?: Date | null;
  clientName: string;
  clientSiret?: string | null;
  lines: ComputedLine[];
  statusLabel: string;
  paidCents?: number;
  lastPaymentDate?: Date | null;
  rectifiedInvoiceNumber?: string | null;
}

export const SALES_HEADER = [
  "Type",
  "Numéro",
  "Date d'émission",
  "Date d'échéance",
  "Client",
  "SIRET client",
  "Total HT",
  "Total TVA",
  "Total TTC",
  ...BREAKDOWN_RATES.flatMap((r) => [`HT ${rateLabel(r)}`, `TVA ${rateLabel(r)}`]),
  "Statut",
  "Montant payé",
  "Date du dernier paiement",
  "Facture rectifiée",
];

/**
 * Journal des ventes. Les avoirs sont exportés en montants NÉGATIFS : ils viennent
 * en déduction du chiffre d'affaires et de la TVA collectée.
 */
export function buildSalesJournal(documents: SalesDocument[]): string[][] {
  const rows = documents.map((doc) => {
    const sign = doc.kind === "CREDIT_NOTE" ? -1 : 1;
    const totals = summarizeDocument(doc.lines);
    const amount = (cents: number) => csvAmount(cents === 0 ? 0 : cents * sign);
    const byRate = new Map(totals.vatBreakdown.map((b) => [b.vatRatePer100000, b]));

    return [
      doc.kind === "INVOICE" ? "Facture" : "Avoir",
      csvText(doc.number),
      formatDate(doc.issueDate),
      doc.dueDate ? formatDate(doc.dueDate) : "",
      csvText(doc.clientName),
      csvText(doc.clientSiret),
      amount(totals.subtotalHtCents),
      amount(totals.totalVatCents),
      amount(totals.totalTtcCents),
      ...BREAKDOWN_RATES.flatMap((rate) => {
        const b = byRate.get(rate);
        return b ? [amount(b.baseHtCents), amount(b.vatCents)] : ["", ""];
      }),
      csvText(doc.statusLabel),
      doc.kind === "INVOICE" ? csvAmount(doc.paidCents ?? 0) : "",
      doc.lastPaymentDate ? formatDate(doc.lastPaymentDate) : "",
      csvText(doc.rectifiedInvoiceNumber),
    ];
  });
  return [SALES_HEADER, ...rows];
}

export interface PaymentRow {
  paidAt: Date;
  invoiceNumber: string;
  clientName: string;
  amountCents: number;
  methodLabel: string;
  reference?: string | null;
}

export const PAYMENTS_HEADER = ["Date du paiement", "Facture", "Client", "Montant", "Moyen de paiement", "Référence"];

export function buildPaymentsJournal(payments: PaymentRow[]): string[][] {
  return [
    PAYMENTS_HEADER,
    ...payments.map((p) => [
      formatDate(p.paidAt),
      csvText(p.invoiceNumber),
      csvText(p.clientName),
      csvAmount(p.amountCents),
      csvText(p.methodLabel),
      csvText(p.reference),
    ]),
  ];
}
