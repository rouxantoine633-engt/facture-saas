import { prisma } from "@/lib/prisma";
import { addUtcMonths, startOfUtcDay, startOfUtcMonth } from "@/lib/dates";
import { bucketPaymentsByMonth, type MonthlyRevenuePoint } from "@/lib/analytics";

const REVENUE_SERIES_MONTHS = 6;

export interface DashboardData {
  revenueThisMonthCents: number;
  revenueLastMonthCents: number;
  revenueSeries: MonthlyRevenuePoint[];
  pendingCount: number;
  pendingCents: number;
  overdueCount: number;
  overdueCents: number;
  convertedQuotesThisMonth: number;
  draftInvoices: number;
}

/** Toutes les données du tableau de bord analytique, en un aller-retour base groupé. */
export async function getDashboardData(companyId: string, now: Date = new Date()): Promise<DashboardData> {
  const today = startOfUtcDay(now);
  const currentMonthStart = startOfUtcMonth(now);
  const seriesStart = addUtcMonths(currentMonthStart, -(REVENUE_SERIES_MONTHS - 1));

  const [payments, drafts, pending, overdue, convertedQuotesThisMonth] = await Promise.all([
    prisma.payment.findMany({
      where: { invoice: { companyId }, paidAt: { gte: seriesStart } },
      select: { paidAt: true, amountCents: true },
    }),
    prisma.invoice.count({ where: { companyId, status: "DRAFT" } }),
    prisma.invoice.aggregate({
      where: { companyId, status: { in: ["SENT", "PARTIALLY_PAID"] }, dueDate: { gte: today } },
      _count: true,
      _sum: { totalTtcCents: true },
    }),
    prisma.invoice.aggregate({
      where: { companyId, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] }, dueDate: { lt: today } },
      _count: true,
      _sum: { totalTtcCents: true },
    }),
    prisma.quote.count({
      where: { companyId, status: "CONVERTED", updatedAt: { gte: currentMonthStart } },
    }),
  ]);

  const revenueSeries = bucketPaymentsByMonth(payments, now, REVENUE_SERIES_MONTHS);
  const revenueThisMonthCents = revenueSeries[revenueSeries.length - 1]?.totalCents ?? 0;
  const revenueLastMonthCents = revenueSeries[revenueSeries.length - 2]?.totalCents ?? 0;

  return {
    revenueThisMonthCents,
    revenueLastMonthCents,
    revenueSeries,
    pendingCount: pending._count,
    pendingCents: pending._sum.totalTtcCents ?? 0,
    overdueCount: overdue._count,
    overdueCents: overdue._sum.totalTtcCents ?? 0,
    convertedQuotesThisMonth,
    draftInvoices: drafts,
  };
}
