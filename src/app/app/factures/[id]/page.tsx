import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { formatCentsToEuros } from "@/lib/money";
import {
  displayInvoiceStatus,
  formatDate,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  REMINDER_STATUS_LABELS,
} from "@/lib/labels";
import { amountStillDue } from "@/lib/credit-notes";
import { buyerSnapshotFromClient, sellerSnapshotFromCompany } from "@/lib/documents";
import { vatMention, type BuyerSnapshot, type SellerSnapshot } from "@/lib/invoice-compliance";
import { LinesTable } from "@/components/LinesTable";
import { ActionButton } from "@/components/ActionButton";
import { deleteDraftInvoiceAction, emitInvoiceAction } from "../actions";
import { PayForm } from "./PayForm";
import { SendEmailForm } from "@/components/SendEmailForm";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireActiveCompany();
  const invoice = await prisma.invoice.findFirst({
    where: { id: id, companyId: company.id },
    include: {
      client: true,
      lines: { orderBy: { position: "asc" } },
      creditNotes: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { paidAt: "asc" } },
    },
  });
  if (!invoice) notFound();

  const isDraft = invoice.status === "DRAFT";
  // Facture émise : on n'affiche QUE les mentions figées à l'émission, jamais le profil actuel.
  const seller = (isDraft ? sellerSnapshotFromCompany(company) : invoice.sellerLegalSnapshot) as unknown as SellerSnapshot;
  const buyer = (isDraft ? buyerSnapshotFromClient(invoice.client) : invoice.buyerLegalSnapshot) as unknown as BuyerSnapshot;
  const latePenalty = isDraft ? company.latePenaltyRateText : invoice.latePenaltyRateText;
  const indemnity = isDraft ? company.recoveryIndemnityCents : invoice.recoveryIndemnityCents;
  const discount = isDraft ? company.discountPolicyText : invoice.discountPolicyText;
  const creditedCents = invoice.creditNotes.reduce((sum, n) => sum + n.totalTtcCents, 0);
  const paidCents = invoice.payments.reduce((sum, p) => sum + p.amountCents, 0);
  const creditable = invoice.totalTtcCents - creditedCents;
  const remainingCents = amountStillDue({ totalTtcCents: invoice.totalTtcCents, paidCents, creditedTtcCents: creditedCents });
  const franchise = seller.vatRegime === "FRANCHISE_EN_BASE";
  const status = displayInvoiceStatus(invoice);
  const reminders = await prisma.reminder.findMany({
    where: { invoiceId: invoice.id },
    orderBy: { offsetDays: "asc" },
  });
  const lastEmail = await prisma.auditLog.findFirst({
    where: { companyId: company.id, entityId: invoice.id, action: "email.invoice_sent" },
    orderBy: { createdAt: "desc" },
  });
  const lastSent = lastEmail
    ? `Dernier envoi : le ${formatDate(lastEmail.createdAt)} à ${(lastEmail.metadata as { to?: string } | null)?.to ?? ""}`
    : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">{isDraft ? "Facture (brouillon)" : `Facture ${invoice.number}`}</h1>
      <p className={`mt-1 ${status === "OVERDUE" ? "font-medium text-red-700" : "text-gray-600"}`}>
        {INVOICE_STATUS_LABELS[status]} · émise le {formatDate(invoice.issueDate)} · échéance le {formatDate(invoice.dueDate)}
      </p>
      {invoice.originQuoteNumber && invoice.originQuoteDate && (
        <p className="mt-1 text-sm text-gray-600">
          Suite au devis {invoice.originQuoteNumber} du {formatDate(invoice.originQuoteDate)}
        </p>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="vendeur" className="text-sm">
          <h2 id="vendeur" className="mb-1 font-semibold">Émetteur</h2>
          <p>{seller.legalName}</p>
          <p>{seller.addressLine1}, {seller.postalCode} {seller.city}</p>
          <p>SIRET {seller.siret}</p>
          {seller.rcsNumber && <p>RCS {seller.rcsCity} {seller.rcsNumber}</p>}
          <p>{vatMention(seller)}</p>
        </section>
        <section aria-labelledby="client" className="text-sm">
          <h2 id="client" className="mb-1 font-semibold">Client</h2>
          <p>{buyer.name}</p>
          <p>{buyer.addressLine1}, {buyer.postalCode} {buyer.city}</p>
          {buyer.siret && <p>SIRET {buyer.siret}</p>}
        </section>
      </div>

      <div className="mt-6">
        <LinesTable
          lines={invoice.lines}
          subtotalHtCents={invoice.subtotalHtCents}
          totalVatCents={invoice.totalVatCents}
          totalTtcCents={invoice.totalTtcCents}
          franchiseEnBase={franchise}
        />
      </div>

      <section aria-labelledby="mentions" className="mt-6 space-y-1 text-sm text-gray-700">
        <h2 id="mentions" className="font-semibold text-gray-900">Conditions de règlement</h2>
        <p>Paiement à réception avant le {formatDate(invoice.dueDate)}.</p>
        <p>Pénalités de retard : {latePenalty}.</p>
        {buyer.type === "BUSINESS" && indemnity != null && (
          <p>Indemnité forfaitaire pour frais de recouvrement en cas de retard : {formatCentsToEuros(indemnity)}.</p>
        )}
        <p>{discount}.</p>
      </section>

      <div className="mt-8 space-y-6">
        {isDraft && (
          <div className="flex flex-wrap items-start gap-6">
            <ActionButton
              action={emitInvoiceAction.bind(null, invoice.id)}
              label="Émettre la facture"
              pendingLabel="Émission…"
              confirmMessage="Une fois émise, la facture recevra son numéro définitif et ne pourra plus être modifiée ni supprimée (seul un avoir pourra la corriger). Continuer ?"
            />
            <ActionButton
              action={deleteDraftInvoiceAction.bind(null, invoice.id)}
              label="Supprimer le brouillon"
              pendingLabel="Suppression…"
              confirmMessage="Supprimer ce brouillon ?"
            />
          </div>
        )}
        {invoice.creditNotes.length > 0 && (
          <section aria-labelledby="avoirs" className="text-sm">
            <h2 id="avoirs" className="mb-1 font-semibold">Avoirs liés</h2>
            <ul className="list-disc pl-5">
              {invoice.creditNotes.map((n) => (
                <li key={n.id}>
                  <Link href={`/app/avoirs/${n.id}`} className="text-brand-700 underline">
                    {n.number}
                  </Link>{" "}
                  du {formatDate(n.issueDate)} — {formatCentsToEuros(n.totalTtcCents)} TTC
                </li>
              ))}
            </ul>
          </section>
        )}
        {!isDraft && creditable > 0 && (
          <Link href={`/app/factures/${invoice.id}/avoir/nouveau`} className="inline-block text-brand-700 underline">
            Émettre un avoir pour corriger cette facture
          </Link>
        )}
        {!isDraft && (
          <SendEmailForm kind="INVOICE" documentId={invoice.id} defaultTo={invoice.client.email ?? ""} lastSent={lastSent} />
        )}
        {invoice.payments.length > 0 && (
          <section aria-labelledby="paiements" className="text-sm">
            <h2 id="paiements" className="mb-1 font-semibold">Paiements reçus</h2>
            <ul className="list-disc pl-5 text-gray-700">
              {invoice.payments.map((p) => (
                <li key={p.id}>
                  {formatDate(p.paidAt)} — {formatCentsToEuros(p.amountCents)} ({PAYMENT_METHOD_LABELS[p.method]}
                  {p.reference ? `, réf. ${p.reference}` : ""})
                </li>
              ))}
            </ul>
            <p className="mt-1 font-medium">
              {remainingCents > 0 ? `Reste dû : ${formatCentsToEuros(remainingCents)}` : "Solde intégralement réglé."}
            </p>
          </section>
        )}
        {(invoice.status === "SENT" || invoice.status === "PARTIALLY_PAID" || invoice.status === "OVERDUE") &&
          remainingCents > 0 && <PayForm invoiceId={invoice.id} remainingCents={remainingCents} />}
        {reminders.length > 0 && (
          <section aria-labelledby="relances" className="text-sm">
            <h2 id="relances" className="mb-1 font-semibold">Relances</h2>
            <ul className="list-disc pl-5 text-gray-700">
              {reminders.map((r) => (
                <li key={r.id}>
                  J+{r.offsetDays} : {REMINDER_STATUS_LABELS[r.status]}
                  {r.sentAt ? ` le ${formatDate(r.sentAt)}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="flex gap-6">
          <a href={`/app/factures/${invoice.id}/pdf`} className="text-brand-700 underline">
            Télécharger le PDF{isDraft ? " (brouillon)" : ""}
          </a>
          <Link href="/app/factures" className="text-brand-700 underline">
            Retour aux factures
          </Link>
        </div>
      </div>
    </div>
  );
}
