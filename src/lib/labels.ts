import type { InvoiceStatus, PaymentMethod, QuoteStatus, ReminderStatus } from "@prisma/client";
import { isOverdue } from "./dates";

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
  return unpaid && isOverdue(invoice.dueDate, now) ? "OVERDUE" : invoice.status;
}

export type StatusTone = "good" | "warning" | "critical" | "neutral";

/**
 * Regroupement visuel des statuts de facture en 3 familles lisibles au premier coup
 * d'œil (Payée / En attente / En retard), plus les états neutres (brouillon, annulée).
 */
export const INVOICE_STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  DRAFT: "neutral",
  SENT: "warning",
  PARTIALLY_PAID: "warning",
  PAID: "good",
  OVERDUE: "critical",
  CANCELLED_BY_CREDIT_NOTE: "neutral",
};

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(date);
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  ESPECES: "Espèces",
  CARTE: "Carte bancaire",
  PRELEVEMENT: "Prélèvement",
  AUTRE: "Autre",
};

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  PENDING: "en cours d'envoi",
  SENT: "envoyée",
  FAILED: "échec d'envoi, nouvelle tentative prévue",
  CANCELLED: "non envoyée (dépassée par une relance plus récente)",
};
