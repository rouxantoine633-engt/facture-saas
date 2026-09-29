import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { CreditNoteForm } from "./CreditNoteForm";

export default async function NewCreditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireActiveCompany();
  const invoice = await prisma.invoice.findFirst({
    where: { id: id, companyId: company.id },
    include: { lines: { orderBy: { position: "asc" } }, creditNotes: { select: { totalTtcCents: true } } },
  });
  if (!invoice) notFound();

  const credited = invoice.creditNotes.reduce((sum, c) => sum + c.totalTtcCents, 0);
  const maxCredit = invoice.totalTtcCents - credited;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Nouvel avoir sur la facture {invoice.number}</h1>
      {invoice.status === "DRAFT" ? (
        <p>
          Cette facture est un brouillon : modifiez-la ou supprimez-la directement. Un avoir ne concerne que les
          factures émises.{" "}
          <Link href={`/factures/${invoice.id}`} className="text-brand-700 underline">
            Retour à la facture
          </Link>
        </p>
      ) : maxCredit <= 0 ? (
        <p>
          Cette facture a déjà été entièrement annulée par des avoirs.{" "}
          <Link href={`/factures/${invoice.id}`} className="text-brand-700 underline">
            Retour à la facture
          </Link>
        </p>
      ) : (
        <CreditNoteForm
          invoiceId={invoice.id}
          franchiseEnBase={company.vatRegime === "FRANCHISE_EN_BASE"}
          maxCreditCents={maxCredit}
          initialLines={invoice.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity.toString(),
            unitPriceCents: l.unitPriceCents,
            vatRatePer100000: l.vatRatePer100000,
          }))}
        />
      )}
    </div>
  );
}
