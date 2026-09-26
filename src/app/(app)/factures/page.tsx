import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { formatCentsToEuros } from "@/lib/money";
import { displayInvoiceStatus, formatDate, INVOICE_STATUS_LABELS } from "@/lib/labels";

export default async function InvoicesPage() {
  const { company } = await requireCompany();
  const invoices = await prisma.invoice.findMany({
    where: { companyId: company.id },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Factures</h1>
      {invoices.length === 0 ? (
        <p className="text-gray-600">
          Aucune facture. Créez un devis puis convertissez-le en facture en un clic.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Liste des factures</caption>
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th scope="col" className="p-3">Numéro</th>
                <th scope="col" className="p-3">Client</th>
                <th scope="col" className="p-3">Échéance</th>
                <th scope="col" className="p-3">Statut</th>
                <th scope="col" className="p-3 text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => {
                const status = displayInvoiceStatus(inv);
                return (
                  <tr key={inv.id}>
                    <td className="p-3">
                      <Link href={`/factures/${inv.id}`} className="font-medium text-brand-700 underline">
                        {inv.status === "DRAFT" ? "Brouillon" : inv.number}
                      </Link>
                    </td>
                    <td className="p-3">{inv.client.name}</td>
                    <td className="p-3">{formatDate(inv.dueDate)}</td>
                    <td className={`p-3 ${status === "OVERDUE" ? "font-medium text-red-700" : ""}`}>
                      {INVOICE_STATUS_LABELS[status]}
                    </td>
                    <td className="p-3 text-right">{formatCentsToEuros(inv.totalTtcCents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
