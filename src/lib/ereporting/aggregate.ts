import type { OperationCategory } from "@/lib/operation-category";
import { classifyB2cOperation, isFrance, type EReportingCategory, type VatRegimeCode } from "./categories";

export interface EReportingLine {
  vatRatePer100000: number;
  lineHtCents: number;
  lineVatCents: number;
  lineTtcCents: number;
}

interface Operation {
  buyerType: "INDIVIDUAL" | "BUSINESS";
  buyerCountry: string;
  vatRegime: VatRegimeCode;
  operationCategory: OperationCategory;
}

/** Facture émise ou avoir (la catégorie d'un avoir est celle de la facture rectifiée). */
export interface EReportingDocument extends Operation {
  kind: "INVOICE" | "CREDIT_NOTE";
  number: string;
  issueDate: Date;
  lines: EReportingLine[];
}

/** Encaissement d'une facture émise, avec les lignes de cette facture pour ventiler la TVA. */
export interface EReportingPayment extends Operation {
  invoiceNumber: string;
  paidAt: Date;
  amountCents: number;
  invoiceLines: EReportingLine[];
}

export interface TransactionRow {
  date: string; // AAAA-MM-JJ (jour UTC)
  category: EReportingCategory;
  vatRatePer100000: number;
  /** Nombre de documents de ce jour et de cette catégorie portant ce taux. */
  documentCount: number;
  htCents: number;
  vatCents: number;
  ttcCents: number;
}

export interface DailyCount {
  date: string;
  category: EReportingCategory;
  invoiceCount: number;
  creditNoteCount: number;
}

export interface PaymentRow {
  date: string;
  category: EReportingCategory;
  vatRatePer100000: number;
  ttcCents: number;
  vatCents: number;
}

export interface EReportingWarning {
  document: string;
  message: string;
}

export interface EReportingReport {
  transactions: TransactionRow[];
  dailyCounts: DailyCount[];
  payments: PaymentRow[];
  warnings: EReportingWarning[];
  totals: { htCents: number; vatCents: number; ttcCents: number; paymentsTtcCents: number; paymentsVatCents: number };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Répartit un encaissement TTC entre les taux de TVA de la facture, au prorata du TTC de chaque taux
 * (méthode du plus fort reste : la somme des parts est exactement le montant encaissé).
 * Renvoie, par taux, la part TTC et la TVA qu'elle contient.
 */
export function allocatePayment(
  amountCents: number,
  lines: EReportingLine[]
): Array<{ vatRatePer100000: number; ttcCents: number; vatCents: number }> {
  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(l.vatRatePer100000, (byRate.get(l.vatRatePer100000) ?? 0) + l.lineTtcCents);
  const total = [...byRate.values()].reduce((a, b) => a + b, 0);
  if (total <= 0 || amountCents === 0) return [];

  const sign = amountCents < 0 ? -1n : 1n;
  const amount = BigInt(Math.abs(amountCents));
  const shares = [...byRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, ttc]) => {
      const exact = amount * BigInt(ttc);
      return { rate, floor: exact / BigInt(total), remainder: exact % BigInt(total) };
    });

  let missing = Number(amount - shares.reduce((sum, s) => sum + s.floor, 0n));
  const order = shares.map((_, i) => i).sort((a, b) => Number(shares[b]!.remainder - shares[a]!.remainder) || a - b);
  const extra = new Map<number, number>();
  for (const i of order) {
    if (missing <= 0) break;
    extra.set(i, 1);
    missing -= 1;
  }

  return shares.map((s, i) => {
    const ttc = Number(sign) * (Number(s.floor) + (extra.get(i) ?? 0));
    // TVA contenue dans un TTC : TTC × taux / (100 % + taux), arrondie au centime.
    const vat = Math.round((Math.abs(ttc) * s.rate) / (100000 + s.rate)) * Math.sign(ttc);
    return { vatRatePer100000: s.rate, ttcCents: ttc, vatCents: vat || 0 };
  });
}

/**
 * Agrège les opérations avec des particuliers en données d'e-reporting : par jour, catégorie et taux de TVA
 * pour les transactions (les avoirs en négatif), et par jour d'encaissement pour les paiements de prestations
 * de services. Les opérations avec un professionnel sont ignorées (elles relèvent de la facture électronique).
 */
export function buildEReporting(documents: EReportingDocument[], payments: EReportingPayment[]): EReportingReport {
  const warnings: EReportingWarning[] = [];
  const warned = new Set<string>();
  const warn = (document: string, message: string) => {
    const key = `${document}|${message}`;
    if (warned.has(key)) return;
    warned.add(key);
    warnings.push({ document, message });
  };

  const classify = (op: Operation, label: string): EReportingCategory | null => {
    if (op.buyerType !== "INDIVIDUAL") return null;
    if (!isFrance(op.buyerCountry)) {
      warn(label, "client particulier hors de France (vente à distance ou export) : non traité ici, à déclarer à part");
      return null;
    }
    const result = classifyB2cOperation(op);
    if ("reason" in result) {
      warn(label, result.reason);
      return null;
    }
    return result.category;
  };

  const tx = new Map<string, TransactionRow & { docs: Set<string> }>();
  const counts = new Map<string, { date: string; category: EReportingCategory; invoices: Set<string>; creditNotes: Set<string> }>();

  for (const doc of documents) {
    const category = classify(doc, doc.number);
    if (!category) continue;
    const date = dayKey(doc.issueDate);
    const sign = doc.kind === "CREDIT_NOTE" ? -1 : 1;

    const countKey = `${date}|${category}`;
    const count = counts.get(countKey) ?? { date, category, invoices: new Set(), creditNotes: new Set() };
    (doc.kind === "INVOICE" ? count.invoices : count.creditNotes).add(doc.number);
    counts.set(countKey, count);

    for (const line of doc.lines) {
      const key = `${date}|${category}|${line.vatRatePer100000}`;
      const row =
        tx.get(key) ??
        { date, category, vatRatePer100000: line.vatRatePer100000, documentCount: 0, htCents: 0, vatCents: 0, ttcCents: 0, docs: new Set<string>() };
      row.htCents += sign * line.lineHtCents;
      row.vatCents += sign * line.lineVatCents;
      row.ttcCents += sign * line.lineTtcCents;
      row.docs.add(`${doc.kind}:${doc.number}`);
      tx.set(key, row);
    }
  }

  const pay = new Map<string, PaymentRow>();
  for (const p of payments) {
    // La TVA sur les prestations de services est exigible à l'encaissement : seules ces ventes ont un flux de paiement.
    if (p.operationCategory !== "PRESTATION_SERVICES") continue;
    const category = classify(p, p.invoiceNumber);
    if (!category) continue;
    const date = dayKey(p.paidAt);
    for (const part of allocatePayment(p.amountCents, p.invoiceLines)) {
      const key = `${date}|${category}|${part.vatRatePer100000}`;
      const row = pay.get(key) ?? { date, category, vatRatePer100000: part.vatRatePer100000, ttcCents: 0, vatCents: 0 };
      row.ttcCents += part.ttcCents;
      row.vatCents += part.vatCents;
      pay.set(key, row);
    }
  }

  const sortKey = (a: { date: string; category: string; vatRatePer100000: number }, b: typeof a) =>
    a.date.localeCompare(b.date) || a.category.localeCompare(b.category) || a.vatRatePer100000 - b.vatRatePer100000;

  const transactions = [...tx.values()]
    .map(({ docs, ...row }) => ({ ...row, documentCount: docs.size }))
    .sort(sortKey);
  const payments_ = [...pay.values()].sort(sortKey);
  const dailyCounts = [...counts.values()]
    .map((c) => ({ date: c.date, category: c.category, invoiceCount: c.invoices.size, creditNoteCount: c.creditNotes.size }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.category.localeCompare(b.category));

  const sum = <T,>(rows: T[], pick: (r: T) => number) => rows.reduce((total, r) => total + pick(r), 0);
  return {
    transactions,
    dailyCounts,
    payments: payments_,
    warnings,
    totals: {
      htCents: sum(transactions, (r) => r.htCents),
      vatCents: sum(transactions, (r) => r.vatCents),
      ttcCents: sum(transactions, (r) => r.ttcCents),
      paymentsTtcCents: sum(payments_, (r) => r.ttcCents),
      paymentsVatCents: sum(payments_, (r) => r.vatCents),
    },
  };
}
