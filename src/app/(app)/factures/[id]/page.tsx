import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { formatCentsToEuros } from "@/lib/money";
import { displayInvoiceStatus, formatDate, INVOICE_STATUS_LABELS } from "@/lib/labels";
import { buyerSnapshotFromClient, sellerSnapshotFromCompany } from "@/lib/documents";
import { vatMention, type BuyerSnapshot, type SellerSnapshot } from "@/lib/invoice-compliance";
import { LinesTable } from "@/components/LinesTable";
import { ActionButton } from "@/components/ActionButton";
import { deleteDraftInvoiceAction, emitInvoiceAction } from "../actions";
import { PayForm } from "./PayForm";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { company } = await requireCompany();
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, companyId: company.id },
    include: { client: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!invoice) notFound();

  const isDraft = invoice.status === "DRAFT";
  // Facture émise : on n'affiche QUE les mentions figées à l'émission, jamais le profil actuel.
  const seller = (isDraft ? sellerSnapshotFromCompany(company) : invoice.sellerLegalSnapshot) as unknown as SellerSnapshot;
  const buyer = (isDraft ? buyerSnapshotFromClient(invoice.client) : invoice.buyerLegalSnapshot) as unknown as BuyerSnapshot;
  const latePenalty = isDraft ? company.latePenaltyRateText : invoice.latePenaltyRateText;
  const indemnity = isDraft ? company.recoveryIndemnityCents : invoice.recoveryIndemnityCents;
  const discount = isDraft ? company.discountPolicyText : invoice.discountPolicyText;
  const franchise = seller.vatRegime === "FRANCHISE_EN_BASE";
  const status = displayInvoiceStatus(invoice);

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
        {(invoice.status === "SENT" || invoice.status === "PARTIALLY_PAID") && <PayForm invoiceId={invoice.id} />}
        <Link href="/factures" className="inline-block text-brand-700 underline">
          Retour aux factures
        </Link>
      </div>
    </div>
  );
}
