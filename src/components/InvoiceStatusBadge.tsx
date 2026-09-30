import type { InvoiceStatus } from "@prisma/client";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONE, type StatusTone } from "@/lib/labels";

const TONE_CLASSES: Record<StatusTone, string> = {
  good: "border-green-200 bg-green-50 text-green-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-gray-200 bg-gray-50 text-gray-600",
};

const TONE_DOT: Record<StatusTone, string> = {
  good: "bg-green-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
  neutral: "bg-gray-400",
};

/** Pastille de statut cohérente entre la liste des factures et le détail d'une facture. */
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const tone = INVOICE_STATUS_TONE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} aria-hidden />
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
