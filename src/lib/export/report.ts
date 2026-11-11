import { summarizeDocument } from "@/lib/money";
import type { PaymentRow, SalesDocument } from "./accounting";

/** Calculs du rapport PDF des exports comptables : aucun formatage ici, uniquement des montants en centimes. */

const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

export const monthKey = (d: Date) => d.toISOString().slice(0, 7);

/** « novembre 2026 » ; la première lettre en majuscule pour un titre de ligne. */
export function monthLabel(key: string): string {
  const label = monthFormat.format(new Date(`${key}-01T00:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ---------------------------------------------------------------------------
// Journal des ventes
// ---------------------------------------------------------------------------

export interface SalesReportRow {
  date: Date;
  kind: "INVOICE" | "CREDIT_NOTE";
  number: string;
  clientName: string;
  /** Montants signés : un avoir vient en déduction. */
  htCents: number;
  vatCents: number;
  ttcCents: number;
  statusLabel: string;
}

export interface SalesMonth {
  monthKey: string;
  label: string;
  invoiceCount: number;
  creditNoteCount: number;
  htCents: number;
  vatCents: number;
  ttcCents: number;
}

export interface VatRateTotal {
  vatRatePer100000: number;
  baseHtCents: number;
  vatCents: number;
}

export interface SalesReport {
  rows: SalesReportRow[];
  months: SalesMonth[];
  vatByRate: VatRateTotal[];
  totals: { invoiceCount: number; creditNoteCount: number; htCents: number; vatCents: number; ttcCents: number };
}

export function buildSalesReport(documents: SalesDocument[]): SalesReport {
  const rows: SalesReportRow[] = [];
  const months = new Map<string, SalesMonth>();
  const rates = new Map<number, VatRateTotal>();
  const totals = { invoiceCount: 0, creditNoteCount: 0, htCents: 0, vatCents: 0, ttcCents: 0 };

  for (const doc of documents) {
    const sign = doc.kind === "CREDIT_NOTE" ? -1 : 1;
    const sum = summarizeDocument(doc.lines);
    // `+ 0` : évite « -0 » quand un avoir est à zéro.
    const signed = (cents: number) => sign * cents + 0;

    rows.push({
      date: doc.issueDate,
      kind: doc.kind,
      number: doc.number,
      clientName: doc.clientName,
      htCents: signed(sum.subtotalHtCents),
      vatCents: signed(sum.totalVatCents),
      ttcCents: signed(sum.totalTtcCents),
      statusLabel: doc.statusLabel,
    });

    const key = monthKey(doc.issueDate);
    const month =
      months.get(key) ??
      { monthKey: key, label: monthLabel(key), invoiceCount: 0, creditNoteCount: 0, htCents: 0, vatCents: 0, ttcCents: 0 };
    if (doc.kind === "INVOICE") month.invoiceCount += 1;
    else month.creditNoteCount += 1;
    month.htCents += signed(sum.subtotalHtCents);
    month.vatCents += signed(sum.totalVatCents);
    month.ttcCents += signed(sum.totalTtcCents);
    months.set(key, month);

    for (const b of sum.vatBreakdown) {
      const rate = rates.get(b.vatRatePer100000) ?? { vatRatePer100000: b.vatRatePer100000, baseHtCents: 0, vatCents: 0 };
      rate.baseHtCents += signed(b.baseHtCents);
      rate.vatCents += signed(b.vatCents);
      rates.set(b.vatRatePer100000, rate);
    }

    if (doc.kind === "INVOICE") totals.invoiceCount += 1;
    else totals.creditNoteCount += 1;
    totals.htCents += signed(sum.subtotalHtCents);
    totals.vatCents += signed(sum.totalVatCents);
    totals.ttcCents += signed(sum.totalTtcCents);
  }

  return {
    rows,
    months: [...months.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    vatByRate: [...rates.values()].sort((a, b) => b.vatRatePer100000 - a.vatRatePer100000),
    totals,
  };
}

// ---------------------------------------------------------------------------
// Encaissements
// ---------------------------------------------------------------------------

export interface PaymentsMonth {
  monthKey: string;
  label: string;
  count: number;
  totalCents: number;
}

export interface PaymentsMethodTotal {
  methodLabel: string;
  count: number;
  totalCents: number;
}

export interface PaymentsReport {
  rows: PaymentRow[];
  months: PaymentsMonth[];
  byMethod: PaymentsMethodTotal[];
  totals: { count: number; totalCents: number };
}

export function buildPaymentsReport(payments: PaymentRow[]): PaymentsReport {
  const months = new Map<string, PaymentsMonth>();
  const methods = new Map<string, PaymentsMethodTotal>();
  const totals = { count: 0, totalCents: 0 };

  for (const p of payments) {
    const key = monthKey(p.paidAt);
    const month = months.get(key) ?? { monthKey: key, label: monthLabel(key), count: 0, totalCents: 0 };
    month.count += 1;
    month.totalCents += p.amountCents;
    months.set(key, month);

    const method = methods.get(p.methodLabel) ?? { methodLabel: p.methodLabel, count: 0, totalCents: 0 };
    method.count += 1;
    method.totalCents += p.amountCents;
    methods.set(p.methodLabel, method);

    totals.count += 1;
    totals.totalCents += p.amountCents;
  }

  return {
    rows: payments,
    months: [...months.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    byMethod: [...methods.values()].sort((a, b) => b.totalCents - a.totalCents || a.methodLabel.localeCompare(b.methodLabel)),
    totals,
  };
}
