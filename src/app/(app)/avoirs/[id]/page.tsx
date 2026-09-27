import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { formatDate } from "@/lib/labels";
import type { BuyerSnapshot, SellerSnapshot } from "@/lib/invoice-compliance";
import { LinesTable } from "@/components/LinesTable";
import { SendEmailForm } from "@/components/SendEmailForm";

export default async function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompany();
  const note = await prisma.creditNote.findFirst({
    where: { id: id, companyId: company.id },
    include: { client: true, invoice: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!note) notFound();

  const seller = note.sellerLegalSnapshot as unknown as SellerSnapshot;
  const buyer = note.buyerLegalSnapshot as unknown as BuyerSnapshot;

  const lastEmail = await prisma.auditLog.findFirst({
    where: { companyId: company.id, entityId: note.id, action: "email.credit_note_sent" },
    orderBy: { createdAt: "desc" },
  });
  const lastSent = lastEmail
    ? `Dernier envoi : le ${formatDate(lastEmail.createdAt)} à ${(lastEmail.metadata as { to?: string } | null)?.to ?? ""}`
    : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Avoir {note.number}</h1>
      <p className="mt-1 text-gray-600">
        Émis le {formatDate(note.issueDate)} · rectifie la facture{" "}
        <Link href={`/factures/${note.invoiceId}`} className="text-brand-700 underline">
          {note.invoice.number}
        </Link>{" "}
        du {formatDate(note.invoice.issueDate)}
      </p>
      <p className="mt-4 text-sm">
        <span className="font-semibold">Motif :</span> {note.reason}
      </p>
      <p className="mt-4 text-sm">
        <span className="font-medium">{buyer.name}</span>
        <br />
        {buyer.addressLine1}, {buyer.postalCode} {buyer.city}
      </p>

      <div className="mt-6">
        <LinesTable
          lines={note.lines}
          subtotalHtCents={note.subtotalHtCents}
          totalVatCents={note.totalVatCents}
          totalTtcCents={note.totalTtcCents}
          franchiseEnBase={seller.vatRegime === "FRANCHISE_EN_BASE"}
        />
      </div>

      <div className="mt-8 space-y-6">
        <SendEmailForm kind="CREDIT_NOTE" documentId={note.id} defaultTo={note.client.email ?? ""} lastSent={lastSent} />
        <a href={`/avoirs/${note.id}/pdf`} className="inline-block text-brand-700 underline">
          Télécharger le PDF
        </a>
      </div>
    </div>
  );
}
