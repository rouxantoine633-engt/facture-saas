import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { formatDate, QUOTE_STATUS_LABELS } from "@/lib/labels";
import { LinesTable } from "@/components/LinesTable";
import { ActionButton } from "@/components/ActionButton";
import { convertQuoteAction } from "../actions";

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const { company } = await requireCompany();
  const quote = await prisma.quote.findFirst({
    where: { id: params.id, companyId: company.id },
    include: { client: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!quote) notFound();

  const canConvert = quote.status !== "CONVERTED" && quote.status !== "REJECTED" && quote.status !== "EXPIRED";
  const convert = convertQuoteAction.bind(null, quote.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">Devis {quote.number}</h1>
      <p className="mt-1 text-gray-600">
        {QUOTE_STATUS_LABELS[quote.status]} · émis le {formatDate(quote.issueDate)}
        {quote.validUntil && ` · valable jusqu'au ${formatDate(quote.validUntil)}`}
      </p>
      <p className="mt-4">
        <span className="font-medium">{quote.client.name}</span>
        <br />
        {quote.client.addressLine1}, {quote.client.postalCode} {quote.client.city}
      </p>

      <div className="mt-6">
        <LinesTable
          lines={quote.lines}
          subtotalHtCents={quote.subtotalHtCents}
          totalVatCents={quote.totalVatCents}
          totalTtcCents={quote.totalTtcCents}
          franchiseEnBase={company.vatRegime === "FRANCHISE_EN_BASE"}
        />
      </div>

      {quote.notes && <p className="mt-4 whitespace-pre-line text-sm text-gray-700">{quote.notes}</p>}

      <div className="mt-8 flex items-start gap-6">
        {canConvert && (
          <ActionButton
            action={convert}
            label="Convertir en facture"
            pendingLabel="Conversion…"
          />
        )}
        {quote.convertedInvoiceId && (
          <Link href={`/factures/${quote.convertedInvoiceId}`} className="text-brand-700 underline">
            Voir la facture générée
          </Link>
        )}
      </div>
    </div>
  );
}
