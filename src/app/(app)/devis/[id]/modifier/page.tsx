import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { QuoteForm, type QuoteFormInitial } from "@/components/QuoteForm";
import { updateQuoteAction } from "../../actions";

function centsToEurosInput(cents: number): string {
  return `${Math.trunc(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireActiveCompany();

  const [quote, clients] = await Promise.all([
    prisma.quote.findFirst({
      where: { id, companyId: company.id },
      include: { lines: { orderBy: { position: "asc" } } },
    }),
    prisma.client.findMany({ where: { companyId: company.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!quote) notFound();

  if (quote.status !== "DRAFT") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">Modifier le devis {quote.number}</h1>
        <p>
          Ce devis n'est plus un brouillon : il ne peut plus être modifié.{" "}
          <Link href={`/devis/${quote.id}`} className="text-brand-700 underline">
            Retour au devis
          </Link>
        </p>
      </div>
    );
  }

  const initial: QuoteFormInitial = {
    clientId: quote.clientId,
    issueDate: quote.issueDate.toISOString().slice(0, 10),
    validUntil: quote.validUntil ? quote.validUntil.toISOString().slice(0, 10) : "",
    notes: quote.notes ?? "",
    lines: quote.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity.toString(),
      unitPrice: centsToEurosInput(l.unitPriceCents),
      vatRatePer100000: l.vatRatePer100000,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Modifier le devis {quote.number}</h1>
      <QuoteForm
        clients={clients}
        franchiseEnBase={company.vatRegime === "FRANCHISE_EN_BASE"}
        initial={initial}
        submitAction={updateQuoteAction.bind(null, quote.id)}
        submitLabel="Enregistrer les modifications"
        pendingLabel="Enregistrement…"
      />
    </div>
  );
}
