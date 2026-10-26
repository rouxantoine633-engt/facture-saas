import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { ClientForm } from "./ClientForm";

export default async function ClientsPage() {
  const { company } = await requireActiveCompany();
  const clients = await prisma.client.findMany({
    where: { companyId: company.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Clients</h1>
      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="liste">
          <h2 id="liste" className="mb-3 text-lg font-semibold">
            Mes clients ({clients.length})
          </h2>
          {clients.length === 0 ? (
            <p className="text-gray-600">Aucun client pour l'instant. Ajoutez-en un pour créer votre premier devis.</p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {clients.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/app/clients/${c.id}`}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 focus-visible:bg-gray-50"
                  >
                    <span>
                      <span className="block font-medium text-brand-700">{c.name}</span>
                      <span className="block text-sm text-gray-600">
                        {c.postalCode} {c.city}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-gray-500" aria-hidden="true">
                      Voir / modifier →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="ajout">
          <h2 id="ajout" className="mb-3 text-lg font-semibold">
            Nouveau client
          </h2>
          <ClientForm />
        </section>
      </div>
    </div>
  );
}
