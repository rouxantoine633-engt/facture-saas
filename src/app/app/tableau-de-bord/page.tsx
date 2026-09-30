import Link from "next/link";
import { requireActiveCompany } from "@/lib/session";
import { formatCentsToEuros } from "@/lib/money";
import { getDashboardData } from "@/lib/dashboard-data";
import { inter, display } from "@/lib/fonts";
import { DashboardKpis, type KpiItem } from "@/components/dashboard/DashboardKpis";
import { RevenueChart } from "@/components/dashboard/RevenueChart";

export default async function DashboardPage() {
  const { company } = await requireActiveCompany();
  const data = await getDashboardData(company.id);

  const revenueDeltaCents = data.revenueThisMonthCents - data.revenueLastMonthCents;
  const hasRevenueHistory = data.revenueThisMonthCents > 0 || data.revenueLastMonthCents > 0;
  const revenueDeltaPct =
    data.revenueLastMonthCents > 0 ? Math.round((revenueDeltaCents / data.revenueLastMonthCents) * 100) : null;

  const kpis: KpiItem[] = [
    {
      label: "Chiffre d'affaires encaissé (ce mois-ci)",
      value: formatCentsToEuros(data.revenueThisMonthCents),
      deltaLabel: hasRevenueHistory
        ? `${revenueDeltaCents >= 0 ? "+" : ""}${formatCentsToEuros(revenueDeltaCents)}${
            revenueDeltaPct !== null ? ` (${revenueDeltaPct >= 0 ? "+" : ""}${revenueDeltaPct} %)` : ""
          } vs mois dernier`
        : undefined,
      deltaTone: revenueDeltaCents > 0 ? "good" : revenueDeltaCents < 0 ? "bad" : "neutral",
    },
    {
      label: "Factures en attente de paiement",
      value: String(data.pendingCount),
      deltaLabel: data.pendingCount > 0 ? formatCentsToEuros(data.pendingCents) : undefined,
      href: "/app/factures",
    },
    {
      label: "Devis convertis ce mois-ci",
      value: String(data.convertedQuotesThisMonth),
      href: "/app/devis",
    },
  ];

  return (
    <div className={`${inter.variable} ${display.variable} bg-[#07070a] font-sans text-white`}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className={`${display.className} text-2xl font-semibold tracking-tight sm:text-3xl`}>Tableau de bord</h1>
        <p className="mt-1 text-white/50">Bienvenue, {company.legalName}.</p>

        {data.overdueCount > 0 && (
          <Link
            href="/app/factures?filter=impayes"
            className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm transition-colors hover:border-red-500/50"
          >
            <span className="flex items-center gap-2 font-medium text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-400" aria-hidden />
              {data.overdueCount} facture{data.overdueCount > 1 ? "s" : ""} en retard de paiement —{" "}
              {formatCentsToEuros(data.overdueCents)} à relancer
            </span>
            <span className="text-red-300/70">Voir les impayés →</span>
          </Link>
        )}

        <div className="mt-6">
          <DashboardKpis items={kpis} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 sm:p-6">
          <h2 className={`${display.className} text-lg font-semibold`}>Évolution du chiffre d&apos;affaires encaissé</h2>
          <p className="text-sm text-white/40">Paiements reçus, 6 derniers mois</p>
          <div className="mt-6">
            <RevenueChart series={data.revenueSeries} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/app/devis/nouveau"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
          >
            Créer un devis
          </Link>
          <Link href="/app/factures" className="text-sm text-white/60 transition-colors hover:text-white">
            Voir toutes les factures
          </Link>
          {data.draftInvoices > 0 && (
            <span className="text-sm text-white/40">
              {data.draftInvoices} brouillon{data.draftInvoices > 1 ? "s" : ""} de facture en attente
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
