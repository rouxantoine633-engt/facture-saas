import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { QuoteForm } from "@/components/QuoteForm";
import { createQuoteAction } from "../actions";

export default async function NewQuotePage() {
  const { company } = await requireActiveCompany();
  const clients = await prisma.client.findMany({
    where: { companyId: company.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Nouveau devis</h1>
      {clients.length === 0 ? (
        <p>
          Vous devez d'abord{" "}
          <Link href="/app/clients" className="text-brand-700 underline">
            ajouter un client
          </Link>
          .
        </p>
      ) : (
        <QuoteForm
          clients={clients}
          franchiseEnBase={company.vatRegime === "FRANCHISE_EN_BASE"}
          submitAction={createQuoteAction}
          submitLabel="Créer le devis"
          pendingLabel="Création…"
        />
      )}
    </div>
  );
}
