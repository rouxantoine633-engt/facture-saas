import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { formatDate } from "@/lib/labels";
import { ClientForm } from "../ClientForm";
import { updateClientAction } from "../actions";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireActiveCompany();
  const client = await prisma.client.findFirst({
    where: { id, companyId: company.id },
    include: { _count: { select: { quotes: true, invoices: true } } },
  });
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/app/clients" className="text-sm text-brand-700 underline">
        ← Retour aux clients
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-bold">{client.name}</h1>
      <p className="mb-6 text-sm text-gray-600">
        {client.type === "BUSINESS" ? "Professionnel" : "Particulier"} · ajouté le {formatDate(client.createdAt)} ·{" "}
        {client._count.quotes} devis · {client._count.invoices} facture{client._count.invoices > 1 ? "s" : ""}
      </p>

      <section aria-labelledby="modifier" className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 id="modifier" className="mb-1 text-lg font-semibold">
          Modifier la fiche
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Les factures et avoirs déjà émis conservent les informations figées à leur émission. Les brouillons et les
          devis reflètent la fiche à jour.
        </p>
        <ClientForm
          action={updateClientAction.bind(null, client.id)}
          defaults={{
            type: client.type,
            name: client.name,
            siret: client.siret ?? "",
            vatNumber: client.vatNumber ?? "",
            addressLine1: client.addressLine1,
            postalCode: client.postalCode,
            city: client.city,
            country: client.country,
            email: client.email ?? "",
            phone: client.phone ?? "",
          }}
          submitLabel="Enregistrer les modifications"
          pendingLabel="Enregistrement…"
          successMessage="Modifications enregistrées."
        />
      </section>
    </div>
  );
}
