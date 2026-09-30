import { addUtcMonths, monthKey, startOfUtcMonth } from "./dates";

const MONTH_LABELS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export interface MonthlyRevenuePoint {
  /** "AAAA-MM", trié chronologiquement. */
  monthKey: string;
  /** Libellé court pour l'axe du graphique, ex. "sept.". */
  label: string;
  totalCents: number;
}

/**
 * Répartit des paiements par mois calendaire (UTC), sur les `monthsCount` derniers mois
 * en incluant le mois courant. Les mois sans paiement apparaissent avec un total à 0
 * (nécessaire pour un graphique continu).
 */
export function bucketPaymentsByMonth(
  payments: { paidAt: Date; amountCents: number }[],
  now: Date,
  monthsCount: number
): MonthlyRevenuePoint[] {
  const currentMonth = startOfUtcMonth(now);
  const firstMonth = addUtcMonths(currentMonth, -(monthsCount - 1));

  const totals = new Map<string, number>();
  for (let i = 0; i < monthsCount; i++) {
    const month = addUtcMonths(firstMonth, i);
    totals.set(monthKey(month), 0);
  }

  for (const payment of payments) {
    if (payment.paidAt.getTime() < firstMonth.getTime()) continue;
    const key = monthKey(payment.paidAt);
    if (!totals.has(key)) continue; // hors fenêtre (ne devrait pas arriver si la requête est déjà filtrée)
    totals.set(key, (totals.get(key) ?? 0) + payment.amountCents);
  }

  return [...totals.entries()].map(([key, totalCents]) => {
    const month = Number(key.split("-")[1]);
    return { monthKey: key, label: MONTH_LABELS_SHORT[month - 1] ?? key, totalCents };
  });
}
