export interface PeriodPreset {
  label: string;
  from: string;
  to: string;
}

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

/**
 * Périodes usuelles : le mois en cours, le mois précédent et les trois tranches de 10 jours du mois en cours
 * (1-10, 11-20, 21-fin), qui correspondent aux fenêtres de transmission les plus citées pour l'e-reporting.
 */
export function periodPresets(now: Date): PeriodPreset[] {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const monthName = (year: number, month: number) =>
    new Date(Date.UTC(year, month, 1)).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return [
    { label: `Mois en cours (${monthName(y, m)})`, from: iso(y, m, 1), to: iso(y, m, lastDay) },
    { label: `Mois précédent (${monthName(y, m - 1)})`, from: iso(y, m - 1, 1), to: iso(y, m, 0) },
    { label: "Du 1er au 10", from: iso(y, m, 1), to: iso(y, m, 10) },
    { label: "Du 11 au 20", from: iso(y, m, 11), to: iso(y, m, 20) },
    { label: `Du 21 à la fin du mois`, from: iso(y, m, 21), to: iso(y, m, lastDay) },
  ];
}
