import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { QuoteForm } from "./QuoteForm";

export default async function NewQuotePage() {
  const { company } = await requireCompany();
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
          <Link href="/clients" className="text-brand-700 underline">
            ajouter un client
          </Link>
          .
        </p>
      ) : (
        <QuoteForm clients={clients} franchiseEnBase={company.vatRegime === "FRANCHISE_EN_BASE"} />
      )}
    </div>
  );
}
