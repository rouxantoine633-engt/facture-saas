import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { formatCentsToEuros } from "@/lib/money";

export default async function DashboardPage() {
  const { company } = await requireCompany();
  const now = new Date();

  const [drafts, unpaid, overdue, paid] = await Promise.all([
    prisma.invoice.count({ where: { companyId: company.id, status: "DRAFT" } }),
    prisma.invoice.aggregate({
      where: { companyId: company.id, status: { in: ["SENT", "PARTIALLY_PAID"] }, dueDate: { gte: now } },
      _count: true,
      _sum: { totalTtcCents: true },
    }),
    prisma.invoice.aggregate({
      where: { companyId: company.id, status: { in: ["SENT", "PARTIALLY_PAID"] }, dueDate: { lt: now } },
      _count: true,
      _sum: { totalTtcCents: true },
    }),
    prisma.invoice.aggregate({
      where: { companyId: company.id, status: "PAID" },
      _count: true,
      _sum: { totalTtcCents: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-1 text-gray-600">Bienvenue, {company.legalName}.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Brouillons" count={drafts} href="/factures" />
        <Card title="En attente de paiement" count={unpaid._count} amount={unpaid._sum.totalTtcCents} href="/factures" />
        <Card title="En retard" count={overdue._count} amount={overdue._sum.totalTtcCents} href="/factures" alert={overdue._count > 0} />
        <Card title="Payées" count={paid._count} amount={paid._sum.totalTtcCents} href="/factures" />
      </div>

      <Link
        href="/devis/nouveau"
        className="mt-8 inline-block rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
      >
        Créer un devis
      </Link>
    </div>
  );
}

function Card({
  title,
  count,
  amount,
  href,
  alert,
}: {
  title: string;
  count: number;
  amount?: number | null;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href} className={`rounded-lg border bg-white p-4 hover:shadow ${alert ? "border-red-300" : "border-gray-200"}`}>
      <p className="text-sm text-gray-600">{title}</p>
      <p className={`mt-1 text-2xl font-semibold ${alert ? "text-red-700" : ""}`}>{count}</p>
      {amount !== undefined && <p className="text-sm text-gray-600">{formatCentsToEuros(amount ?? 0)}</p>}
    </Link>
  );
}
