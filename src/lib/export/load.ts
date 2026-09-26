import { prisma } from "@/lib/prisma";
import { INVOICE_STATUS_LABELS } from "@/lib/labels";
import type { BuyerSnapshot } from "@/lib/invoice-compliance";
import { buildPaymentsJournal, buildSalesJournal, type SalesDocument } from "./accounting";

const METHOD_LABELS: Record<string, string> = {
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  ESPECES: "Espèces",
  CARTE: "Carte bancaire",
  PRELEVEMENT: "Prélèvement",
  AUTRE: "Autre",
};

const toComputedLines = <T extends { lineHtCents: number; lineVatCents: number; lineTtcCents: number; vatRatePer100000: number }>(
  lines: T[]
) => lines.map((l) => ({ lineHtCents: l.lineHtCents, lineVatCents: l.lineVatCents, lineTtcCents: l.lineTtcCents, vatRatePer100000: l.vatRatePer100000 }));

/** Journal des ventes : factures émises (jamais les brouillons) et avoirs de la période, par date d'émission. */
export async function loadSalesJournal(companyId: string, from: Date, to: Date): Promise<string[][]> {
  const range = { gte: from, lte: to };
  const [invoices, creditNotes] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId, status: { not: "DRAFT" }, issueDate: range },
      include: { lines: true, payments: { orderBy: { paidAt: "asc" } } },
      orderBy: [{ issueDate: "asc" }, { number: "asc" }],
    }),
    prisma.creditNote.findMany({
      where: { companyId, issueDate: range },
      include: { lines: true, invoice: { select: { number: true } } },
      orderBy: [{ issueDate: "asc" }, { number: "asc" }],
    }),
  ]);

  const docs: SalesDocument[] = [
    ...invoices.map((inv): SalesDocument => {
      // Client tel que figé à l'émission, pas la fiche actuelle.
      const buyer = inv.buyerLegalSnapshot as unknown as BuyerSnapshot;
      return {
        kind: "INVOICE",
        number: inv.number,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        clientName: buyer.name,
        clientSiret: buyer.siret,
        lines: toComputedLines(inv.lines),
        statusLabel: INVOICE_STATUS_LABELS[inv.status],
        paidCents: inv.payments.reduce((sum, p) => sum + p.amountCents, 0),
        lastPaymentDate: inv.payments.at(-1)?.paidAt ?? null,
      };
    }),
    ...creditNotes.map((n): SalesDocument => {
      const buyer = n.buyerLegalSnapshot as unknown as BuyerSnapshot;
      return {
        kind: "CREDIT_NOTE",
        number: n.number,
        issueDate: n.issueDate,
        clientName: buyer.name,
        clientSiret: buyer.siret,
        lines: toComputedLines(n.lines),
        statusLabel: "",
        rectifiedInvoiceNumber: n.invoice.number,
      };
    }),
  ].sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime() || a.number.localeCompare(b.number));

  return buildSalesJournal(docs);
}

export async function loadPaymentsJournal(companyId: string, from: Date, to: Date): Promise<string[][]> {
  const payments = await prisma.payment.findMany({
    where: { invoice: { companyId }, paidAt: { gte: from, lte: to } },
    include: { invoice: { select: { number: true, buyerLegalSnapshot: true } } },
    orderBy: { paidAt: "asc" },
  });
  return buildPaymentsJournal(
    payments.map((p) => ({
      paidAt: p.paidAt,
      invoiceNumber: p.invoice.number,
      clientName: (p.invoice.buyerLegalSnapshot as unknown as BuyerSnapshot).name,
      amountCents: p.amountCents,
      methodLabel: METHOD_LABELS[p.method] ?? p.method,
      reference: p.reference,
    }))
  );
}
