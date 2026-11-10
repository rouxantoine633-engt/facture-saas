import { prisma } from "@/lib/prisma";
import type { BuyerSnapshot, SellerSnapshot } from "@/lib/invoice-compliance";
import { buildEReporting, type EReportingDocument, type EReportingLine, type EReportingPayment, type EReportingReport } from "./aggregate";

const toLines = (lines: EReportingLine[]): EReportingLine[] =>
  lines.map((l) => ({
    vatRatePer100000: l.vatRatePer100000,
    lineHtCents: l.lineHtCents,
    lineVatCents: l.lineVatCents,
    lineTtcCents: l.lineTtcCents,
  }));

/** Les mentions du vendeur et de l'acheteur sont celles figées à l'émission, pas les fiches actuelles. */
function parties(seller: unknown, buyer: unknown) {
  const s = seller as SellerSnapshot | null;
  const b = buyer as BuyerSnapshot | null;
  if (!s || !b) return null;
  return { buyerType: b.type, buyerCountry: b.country, vatRegime: s.vatRegime };
}

/** Données d'e-reporting de la période [from, to] : factures et avoirs par date d'émission, paiements par date d'encaissement. */
export async function loadEReporting(companyId: string, from: Date, to: Date): Promise<EReportingReport> {
  const range = { gte: from, lte: to };
  const [invoices, creditNotes, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId, status: { not: "DRAFT" }, issueDate: range },
      include: { lines: true },
    }),
    prisma.creditNote.findMany({
      where: { companyId, issueDate: range },
      include: { lines: true, invoice: { select: { operationCategory: true } } },
    }),
    prisma.payment.findMany({
      where: { invoice: { companyId, status: { not: "DRAFT" } }, paidAt: range },
      include: { invoice: { include: { lines: true } } },
    }),
  ]);

  const documents: EReportingDocument[] = [];
  for (const inv of invoices) {
    const p = parties(inv.sellerLegalSnapshot, inv.buyerLegalSnapshot);
    if (p) documents.push({ ...p, kind: "INVOICE", number: inv.number, issueDate: inv.issueDate, operationCategory: inv.operationCategory, lines: toLines(inv.lines) });
  }
  for (const note of creditNotes) {
    const p = parties(note.sellerLegalSnapshot, note.buyerLegalSnapshot);
    if (p) documents.push({ ...p, kind: "CREDIT_NOTE", number: note.number, issueDate: note.issueDate, operationCategory: note.invoice.operationCategory, lines: toLines(note.lines) });
  }

  const encaissements: EReportingPayment[] = [];
  for (const pay of payments) {
    const p = parties(pay.invoice.sellerLegalSnapshot, pay.invoice.buyerLegalSnapshot);
    if (p) {
      encaissements.push({
        ...p,
        invoiceNumber: pay.invoice.number,
        paidAt: pay.paidAt,
        amountCents: pay.amountCents,
        operationCategory: pay.invoice.operationCategory,
        invoiceLines: toLines(pay.invoice.lines),
      });
    }
  }

  return buildEReporting(documents, encaissements);
}
