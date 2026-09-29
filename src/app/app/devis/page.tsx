import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { formatCentsToEuros } from "@/lib/money";
import { formatDate, QUOTE_STATUS_LABELS } from "@/lib/labels";

export default async function QuotesPage() {
  const { company } = await requireActiveCompany();
  const quotes = await prisma.quote.findMany({
    where: { companyId: company.id },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Devis</h1>
        <Link href="/app/devis/nouveau" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Nouveau devis
        </Link>
      </div>
      {quotes.length === 0 ? (
        <p className="text-gray-600">Aucun devis pour l'instant.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Liste des devis</caption>
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th scope="col" className="p-3">Numéro</th>
                <th scope="col" className="p-3">Client</th>
                <th scope="col" className="p-3">Date</th>
                <th scope="col" className="p-3">Statut</th>
                <th scope="col" className="p-3 text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td className="p-3">
                    <Link href={`/app/devis/${q.id}`} className="font-medium text-brand-700 underline">
                      {q.number}
                    </Link>
                  </td>
                  <td className="p-3">{q.client.name}</td>
                  <td className="p-3">{formatDate(q.issueDate)}</td>
                  <td className="p-3">{QUOTE_STATUS_LABELS[q.status]}</td>
                  <td className="p-3 text-right">{formatCentsToEuros(q.totalTtcCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
