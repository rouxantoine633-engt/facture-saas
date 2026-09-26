import type { InvoiceStatus, QuoteStatus } from "@prisma/client";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
  CONVERTED: "Converti en facture",
};

export type DisplayInvoiceStatus = InvoiceStatus | "OVERDUE";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  PARTIALLY_PAID: "Partiellement payée",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED_BY_CREDIT_NOTE: "Annulée par avoir",
};

/** Une facture émise/partiellement payée dont l'échéance est dépassée s'affiche « En retard ». */
export function displayInvoiceStatus(
  invoice: { status: InvoiceStatus; dueDate: Date },
  now: Date = new Date()
): InvoiceStatus {
  const unpaid = invoice.status === "SENT" || invoice.status === "PARTIALLY_PAID";
  return unpaid && invoice.dueDate.getTime() < now.getTime() ? "OVERDUE" : invoice.status;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(date);
}
