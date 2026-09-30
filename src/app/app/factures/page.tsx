import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireActiveCompany } from "@/lib/session";
import { formatCentsToEuros } from "@/lib/money";
import { displayInvoiceStatus, formatDate } from "@/lib/labels";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { ReminderButton } from "@/components/ReminderButton";
import { sendInvoiceReminderAction } from "./actions";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { company } = await requireActiveCompany();
  const { filter } = await searchParams;
  const onlyUnpaid = filter === "impayes";

  const allInvoices = await prisma.invoice.findMany({
    where: { companyId: company.id },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const withStatus = allInvoices.map((inv) => ({ ...inv, displayStatus: displayInvoiceStatus(inv) }));
  const invoices = onlyUnpaid
    ? withStatus.filter((inv) => inv.displayStatus === "SENT" || inv.displayStatus === "PARTIALLY_PAID" || inv.displayStatus === "OVERDUE")
    : withStatus;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Factures</h1>
        <nav aria-label="Filtrer les factures" className="flex gap-2 text-sm">
          <Link
            href="/app/factures"
            className={`rounded-full border px-3 py-1.5 font-medium ${
              !onlyUnpaid ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Toutes
          </Link>
          <Link
            href="/app/factures?filter=impayes"
            className={`rounded-full border px-3 py-1.5 font-medium ${
              onlyUnpaid ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Impayées
          </Link>
        </nav>
      </div>

      {invoices.length === 0 ? (
        <p className="text-gray-600">
          {onlyUnpaid ? "Aucune facture impayée : tout est à jour." : "Aucune facture. Créez un devis puis convertissez-le en facture en un clic."}
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
                <th scope="col" className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="p-3">
                    <Link href={`/app/factures/${inv.id}`} className="font-medium text-brand-700 underline">
                      {inv.status === "DRAFT" ? "Brouillon" : inv.number}
                    </Link>
                  </td>
                  <td className="p-3">{inv.client.name}</td>
                  <td className="p-3">{formatDate(inv.dueDate)}</td>
                  <td className="p-3">
                    <InvoiceStatusBadge status={inv.displayStatus} />
                  </td>
                  <td className="p-3 text-right">{formatCentsToEuros(inv.totalTtcCents)}</td>
                  <td className="p-3 text-right">
                    {inv.displayStatus === "OVERDUE" && (
                      <ReminderButton action={sendInvoiceReminderAction.bind(null, inv.id)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
