import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { ClientForm } from "./ClientForm";

export default async function ClientsPage() {
  const { company } = await requireCompany();
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
                <li key={c.id} className="p-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-600">
                    {c.postalCode} {c.city}
                  </p>
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
