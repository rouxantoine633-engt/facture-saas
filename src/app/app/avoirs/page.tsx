import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { formatCentsToEuros } from "@/lib/money";
import { formatDate } from "@/lib/labels";

export default async function CreditNotesPage() {
  const { company } = await requireActiveCompany();
  const notes = await prisma.creditNote.findMany({
    where: { companyId: company.id },
    include: { client: { select: { name: true } }, invoice: { select: { number: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Avoirs</h1>
      <p className="mb-6 text-gray-600">
        Un avoir corrige une facture déjà émise. Pour en créer un, ouvrez la facture concernée.
      </p>
      {notes.length === 0 ? (
        <p className="text-gray-600">Aucun avoir pour l'instant.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Liste des avoirs</caption>
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th scope="col" className="p-3">Numéro</th>
                <th scope="col" className="p-3">Facture</th>
                <th scope="col" className="p-3">Client</th>
                <th scope="col" className="p-3">Date</th>
                <th scope="col" className="p-3 text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notes.map((n) => (
                <tr key={n.id}>
                  <td className="p-3">
                    <Link href={`/app/avoirs/${n.id}`} className="font-medium text-brand-700 underline">
                      {n.number}
                    </Link>
                  </td>
                  <td className="p-3">{n.invoice.number}</td>
                  <td className="p-3">{n.client.name}</td>
                  <td className="p-3">{formatDate(n.issueDate)}</td>
                  <td className="p-3 text-right">{formatCentsToEuros(n.totalTtcCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
